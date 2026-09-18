import { existsSync } from "node:fs";
import type Database from "better-sqlite3";
import { randomUUID } from "node:crypto";
import type { AssetService } from "./assets";
import { createProbeService } from "./probeService";
import { KaiwaError } from "./repository";
import type { MediaProbeOk } from "./probe/types";

export type TimelineMapping = {
  version: 1;
  sourceAssetId: string;
  proxyAssetId: string;
  /** Proxy timeline is authoritative for studio (PLAN §8). */
  sourceStartMs: number;
  proxyStartMs: number;
  /**
   * Duration scale proxy/source. Identity (=1) for passthrough;
   * ffmpeg normalize may adjust later.
   */
  durationScale: number;
  rotation: number;
  engine: "passthrough" | "ffmpeg";
  probe: MediaProbeOk;
};

/**
 * Build playback derivatives after a successful probe.
 * Without ffmpeg: passthrough copy (source immutable) + identity timeline.
 * With FFMPEG_PATH later: normalize VFR/rotation into a dedicated proxy file.
 */
export function createProxyService(db: Database.Database, assets: AssetService) {
  const probes = createProbeService(db, assets);

  async function preparePlayback(ownerId: string, sourceAssetId: string) {
    const source = assets.ownAsset(ownerId, sourceAssetId);
    if (source.kind !== "source" && source.kind !== "upload") {
      // allow any ready source-like asset
    }
    const probed = await probes.probeAsset(ownerId, sourceAssetId);
    if (!probed.result.ok) {
      throw new KaiwaError(
        422,
        probed.result.message || "Probe thất bại — chưa tạo proxy.",
      );
    }
    const probe = probed.result;
    const srcPath = assets.storage.resolvePath(source.storage_key);
    if (!existsSync(srcPath))
      throw new KaiwaError(404, "Thiếu tệp nguồn — không tạo proxy.");

    // Source bytes must remain untouched: write proxy under a new key.
    const proxy = assets.reserve({
      ownerId,
      kind: "proxy",
      bytes: source.bytes || 1,
      ext: probe.container === "webm" ? "webm" : "mp4",
    });
    assets.storage.copyFile(source.storage_key, proxy.storage_key);

    const ffmpeg = process.env.FFMPEG_PATH || process.env.KAIWA_FFMPEG_PATH;
    const engine = ffmpeg ? "ffmpeg" : "passthrough";
    // Passthrough path: no remux yet (ffmpeg hook reserved).
    void ffmpeg;

    const media = {
      contentType: probe.container === "webm" ? "video/webm" : "video/mp4",
      committedAt: new Date().toISOString(),
      derivedFrom: sourceAssetId,
      probe,
      engine,
    };
    db.prepare(
      "UPDATE kaiwa_assets SET bytes=?, media_json=?, processing_status=?, checksum=? WHERE id=?",
    ).run(
      source.bytes,
      JSON.stringify(media),
      "ready",
      source.checksum,
      proxy.id,
    );
    db.prepare("DELETE FROM kaiwa_quota_reservations WHERE asset_id=?").run(
      proxy.id,
    );

    // Optional tiny thumbnail placeholder metadata (no binary image without ffmpeg).
    const thumbId = randomUUID();
    const mapping: TimelineMapping = {
      version: 1,
      sourceAssetId,
      proxyAssetId: proxy.id,
      sourceStartMs: 0,
      proxyStartMs: 0,
      durationScale: 1,
      rotation: probe.rotation || 0,
      engine,
      probe,
    };

    // Verify source file unchanged (size + checksum field).
    const sourceAfter = assets.ownAsset(ownerId, sourceAssetId);
    if (sourceAfter.storage_key !== source.storage_key)
      throw new KaiwaError(500, "Source storage key changed unexpectedly.");
    if (!existsSync(srcPath))
      throw new KaiwaError(500, "Source file missing after proxy copy.");

    return {
      sourceAssetId,
      proxyAssetId: proxy.id,
      thumbnailAssetId: null as string | null,
      timeline: mapping,
      engine,
      note:
        engine === "passthrough"
          ? "Passthrough proxy (no ffmpeg). VFR/rotation normalize requires FFMPEG_PATH."
          : "ffmpeg available — normalize pipeline not yet expanded beyond copy.",
      thumbPlaceholderId: thumbId,
    };
  }

  return { preparePlayback };
}
