import { readFileSync } from "node:fs";
import type Database from "better-sqlite3";
import { KaiwaError } from "./repository";
import type { AssetService } from "./assets";
import {
  analyzePcmInt16Le,
  unavailableDecodeReport,
  type AudioQualityReport,
} from "../../../shared/kaiwa/audioQuality";

function fail(status: number, message: string): never {
  throw new KaiwaError(status, message);
}

/**
 * Attempt audio quality check — never blocks export; never invents scores.
 * Compressed mic WebM without PCM decode → unavailable (honest).
 */
export function createAudioQualityService(
  db: Database.Database,
  assets: AssetService,
) {
  function persist(
    ownerId: string,
    attemptId: string,
    report: AudioQualityReport,
  ) {
    const row = db
      .prepare(
        "SELECT clocks_json FROM kaiwa_attempts WHERE id=? AND owner_id=?",
      )
      .get(attemptId, ownerId) as { clocks_json: string } | undefined;
    if (!row) return;
    let clocks: Record<string, unknown> = {};
    try {
      clocks = JSON.parse(row.clocks_json || "{}");
    } catch {
      clocks = {};
    }
    clocks.audioQuality = report;
    db.prepare(
      "UPDATE kaiwa_attempts SET clocks_json=? WHERE id=? AND owner_id=?",
    ).run(JSON.stringify(clocks), attemptId, ownerId);
  }

  function checkAttempt(
    ownerId: string,
    attemptId: string,
  ): AudioQualityReport {
    const attempt = db
      .prepare("SELECT * FROM kaiwa_attempts WHERE id=? AND owner_id=?")
      .get(attemptId, ownerId) as Record<string, unknown> | undefined;
    if (!attempt) fail(404, "Không tìm thấy bản thu.");
    if (!attempt.audio_asset_id) {
      const report: AudioQualityReport = {
        ...unavailableDecodeReport(),
        verdict: "not_assessable",
        reasons: ["empty", "decode_unavailable"],
        messageVi:
          "Chưa có audio micro — không chấm. Không gán điểm phát âm 0.",
      };
      persist(ownerId, attemptId, report);
      return report;
    }

    const asset = assets.ownAsset(ownerId, String(attempt.audio_asset_id));
    const media = JSON.parse(asset.media_json || "{}") as {
      contentType?: string;
      sampleRateHz?: number;
      channels?: number;
      pcm?: boolean;
    };

    let bytes: Buffer | null = null;
    try {
      bytes = readFileSync(assets.storage.resolvePath(asset.storage_key));
    } catch {
      bytes = null;
    }

    if (
      bytes &&
      media.pcm === true &&
      (media.contentType === "audio/pcm" ||
        media.contentType === "application/octet-stream")
    ) {
      const report = analyzePcmInt16Le(bytes, {
        sampleRateHz: media.sampleRateHz || 48000,
        channels: media.channels || 1,
      });
      persist(ownerId, attemptId, report);
      return report;
    }

    const report = unavailableDecodeReport();
    persist(ownerId, attemptId, report);
    return report;
  }

  function getStored(
    ownerId: string,
    attemptId: string,
  ): AudioQualityReport | null {
    const row = db
      .prepare(
        "SELECT clocks_json FROM kaiwa_attempts WHERE id=? AND owner_id=?",
      )
      .get(attemptId, ownerId) as { clocks_json: string } | undefined;
    if (!row) fail(404, "Không tìm thấy bản thu.");
    try {
      const clocks = JSON.parse(row.clocks_json || "{}") as {
        audioQuality?: AudioQualityReport;
      };
      return clocks.audioQuality ?? null;
    } catch {
      return null;
    }
  }

  return { checkAttempt, getStored };
}

export type AudioQualityService = ReturnType<typeof createAudioQualityService>;
