import { readFileSync } from "node:fs";
import type Database from "better-sqlite3";
import { KaiwaError } from "./repository";
import type { AssetService } from "./assets";
import type { AlignmentReport } from "../../../shared/kaiwa/alignment";
import {
  analyzeProsodyPcm,
  buildAttemptProsodyReport,
  unavailableProsodyReport,
  type ProsodyReport,
  type ProsodySegmentReport,
} from "../../../shared/kaiwa/prosody";

function fail(status: number, message: string): never {
  throw new KaiwaError(status, message);
}

/**
 * Local relative F0 / timing — never pitch-accent labels; never ability scores.
 */
export function createProsodyService(
  db: Database.Database,
  assets: AssetService,
) {
  function persist(
    ownerId: string,
    attemptId: string,
    report: ProsodyReport,
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
    clocks.prosody = report;
    db.prepare(
      "UPDATE kaiwa_attempts SET clocks_json=? WHERE id=? AND owner_id=?",
    ).run(JSON.stringify(clocks), attemptId, ownerId);
  }

  function analyzeAttempt(
    ownerId: string,
    attemptId: string,
  ): ProsodyReport {
    const attempt = db
      .prepare("SELECT * FROM kaiwa_attempts WHERE id=? AND owner_id=?")
      .get(attemptId, ownerId) as Record<string, unknown> | undefined;
    if (!attempt) fail(404, "Không tìm thấy bản thu.");

    if (!attempt.audio_asset_id) {
      const report = unavailableProsodyReport("empty_audio");
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

    const isPcm =
      bytes &&
      media.pcm === true &&
      (media.contentType === "audio/pcm" ||
        media.contentType === "application/octet-stream");

    if (!isPcm || !bytes) {
      const report = unavailableProsodyReport("decode_unavailable");
      persist(ownerId, attemptId, report);
      return report;
    }

    const revision = db
      .prepare("SELECT * FROM kaiwa_revisions WHERE id=?")
      .get(String(attempt.revision_id)) as
      | { payload: string }
      | undefined;

    let planned: Array<{ id: string; startMs: number; endMs: number }> = [];
    try {
      const payload = JSON.parse(revision?.payload || '{"segments":[]}');
      planned = Array.isArray(payload.segments) ? payload.segments : [];
    } catch {
      planned = [];
    }

    let clocks: { alignment?: AlignmentReport } = {};
    try {
      clocks = JSON.parse(String(attempt.clocks_json || "{}"));
    } catch {
      clocks = {};
    }
    const alignById = new Map(
      (clocks.alignment?.segments ?? []).map((s) => [s.segmentId, s] as const),
    );

    const sampleRateHz = media.sampleRateHz || 48000;
    const channels = media.channels || 1;
    const totalMs = Math.round((bytes.byteLength / (2 * channels) / sampleRateHz) * 1000);

    const segments: ProsodySegmentReport[] = [];

    if (planned.length === 0) {
      segments.push(
        analyzeProsodyPcm(bytes, {
          sampleRateHz,
          channels,
          segmentId: null,
          plannedMs: null,
        }),
      );
    } else {
      for (const seg of planned) {
        const align = alignById.get(seg.id);
        const startMs = align?.alignedStartMs ?? seg.startMs;
        const endMs = align?.alignedEndMs ?? seg.endMs;
        const startSample = Math.max(
          0,
          Math.floor((startMs / 1000) * sampleRateHz) * channels * 2,
        );
        const endSample = Math.min(
          bytes.byteLength,
          Math.ceil((endMs / 1000) * sampleRateHz) * channels * 2,
        );
        const slice =
          endSample > startSample
            ? bytes.subarray(startSample, endSample)
            : Buffer.alloc(0);

        // Do not time-warp audio to fit plan — analyze the raw slice only.
        void totalMs;
        segments.push(
          analyzeProsodyPcm(slice, {
            sampleRateHz,
            channels,
            segmentId: seg.id,
            plannedMs: Math.max(0, seg.endMs - seg.startMs),
            alignmentStatus: align?.status ?? null,
          }),
        );
      }
    }

    const report = buildAttemptProsodyReport(segments);
    persist(ownerId, attemptId, report);
    return report;
  }

  function getStored(
    ownerId: string,
    attemptId: string,
  ): ProsodyReport | null {
    const row = db
      .prepare(
        "SELECT clocks_json FROM kaiwa_attempts WHERE id=? AND owner_id=?",
      )
      .get(attemptId, ownerId) as { clocks_json: string } | undefined;
    if (!row) fail(404, "Không tìm thấy bản thu.");
    try {
      const clocks = JSON.parse(row.clocks_json || "{}") as {
        prosody?: ProsodyReport;
      };
      return clocks.prosody ?? null;
    } catch {
      return null;
    }
  }

  return { analyzeAttempt, getStored };
}

export type ProsodyService = ReturnType<typeof createProsodyService>;
