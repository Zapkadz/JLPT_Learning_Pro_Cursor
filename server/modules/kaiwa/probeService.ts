import type Database from "better-sqlite3";
import type { AssetService } from "./assets";
import {
  applyPilotLimits,
  createResilientProbe,
  type MediaProbeResult,
} from "./probe/index";
import { KaiwaError } from "./repository";

const MAX_DURATION_MS = 10 * 60 * 1000;

export function createProbeService(db: Database.Database, assets: AssetService) {
  const probe = createResilientProbe();

  async function probeAsset(
    ownerId: string,
    assetId: string,
  ): Promise<{ assetId: string; result: MediaProbeResult }> {
    const asset = assets.ownAsset(ownerId, assetId);
    if (asset.processing_status !== "ready") {
      throw new KaiwaError(409, "Media chưa sẵn sàng để probe.");
    }
    const path = assets.storage.resolvePath(asset.storage_key);
    let result = await probe.probeFile(path);
    result = applyPilotLimits(result, {
      maxDurationMs: MAX_DURATION_MS,
      requireVideo: true,
    });

    const media = JSON.parse(asset.media_json || "{}") as Record<string, unknown>;
    media.probe = result;
    media.probedAt = new Date().toISOString();
    const nextStatus = result.ok ? "ready" : "failed";
    db.prepare(
      "UPDATE kaiwa_assets SET media_json=?, processing_status=? WHERE id=? AND owner_id=?",
    ).run(JSON.stringify(media), nextStatus, assetId, ownerId);

    return { assetId, result };
  }

  return { probeAsset, probe };
}
