import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type Database from "better-sqlite3";
import { KaiwaError } from "./repository";
import type { AssetService } from "./assets";
import type { FinalizeTakeService } from "./finalizeTake";
import {
  buildSegmentTimeline,
  buildSilentWav,
  type SegmentTimelinePlan,
} from "../../../shared/kaiwa/segmentAssemble";

function fail(status: number, message: string): never {
  throw new KaiwaError(status, message);
}

function resolveFfmpeg(): string | null {
  return process.env.FFMPEG_PATH || process.env.KAIWA_FFMPEG_PATH || null;
}

/**
 * KAI-039: assemble latest segment clips onto a full-duration learner mic track.
 * Gaps = silence on learner track. Never labels capture as continuous.
 */
export function createSegmentAssembleService(
  db: Database.Database,
  assets: AssetService,
  finalizeTake: FinalizeTakeService,
) {
  function loadAttempt(ownerId: string, attemptId: string) {
    const row = db
      .prepare("SELECT * FROM kaiwa_attempts WHERE id=? AND owner_id=?")
      .get(attemptId, ownerId) as Record<string, unknown> | undefined;
    if (!row) fail(404, "Không tìm thấy bản thu.");
    return row;
  }

  function loadSegments(attempt: Record<string, unknown>) {
    const revision = db
      .prepare("SELECT payload FROM kaiwa_revisions WHERE id=?")
      .get(String(attempt.revision_id)) as { payload: string } | undefined;
    try {
      const payload = JSON.parse(revision?.payload || '{"segments":[]}');
      const segs = Array.isArray(payload.segments) ? payload.segments : [];
      return segs
        .map((s: { id?: string; startMs?: number; endMs?: number }) => ({
          id: String(s.id || ""),
          startMs: Number(s.startMs) || 0,
          endMs: Number(s.endMs) || 0,
        }))
        .filter((s: { id: string }) => s.id);
    } catch {
      return [] as Array<{ id: string; startMs: number; endMs: number }>;
    }
  }

  function latestClips(attemptId: string) {
    const rows = db
      .prepare(
        `SELECT c.segment_id, c.status, c.audio_asset_id, c.version
         FROM kaiwa_segment_clips c
         INNER JOIN (
           SELECT segment_id, MAX(version) AS v
           FROM kaiwa_segment_clips WHERE attempt_id=?
           GROUP BY segment_id
         ) t ON c.segment_id=t.segment_id AND c.version=t.v
         WHERE c.attempt_id=?`,
      )
      .all(attemptId, attemptId) as Array<{
      segment_id: string;
      status: string;
      audio_asset_id: string | null;
    }>;
    return rows.map((r) => ({
      segmentId: r.segment_id,
      status: r.status,
      audioAssetId: r.audio_asset_id,
    }));
  }

  function tryFfmpegOverlay(input: {
    durationMs: number;
    placements: SegmentTimelinePlan["placements"];
    ownerId: string;
  }): Buffer | null {
    const bin = resolveFfmpeg();
    if (!bin) return null;
    const withAudio = input.placements.filter(
      (p) =>
        p.audioAssetId &&
        (p.status === "recorded" || p.status === "partial"),
    );
    if (withAudio.length === 0) return null;

    const tmp = mkdtempSync(join(tmpdir(), "kaiwa-seg-asm-"));
    try {
      const silencePath = join(tmp, "base.wav");
      writeFileSync(silencePath, buildSilentWav(input.durationMs));
      const args: string[] = ["-y", "-i", silencePath];
      const placed: Array<{ startMs: number }> = [];
      let idx = 1;
      for (const p of withAudio) {
        try {
          const asset = assets.ownAsset(input.ownerId, String(p.audioAssetId));
          const src = assets.storage.resolvePath(asset.storage_key);
          const dest = join(tmp, `clip${idx}.bin`);
          writeFileSync(dest, readFileSync(src));
          args.push("-i", dest);
          placed.push({ startMs: p.startMs });
          idx++;
        } catch {
          /* skip unreadable clip */
        }
      }
      if (placed.length === 0) return null;
      const delayFilters = placed
        .map((p, i) => {
          const n = i + 1;
          const delay = Math.max(0, p.startMs);
          return `[${n}:a]adelay=${delay}|${delay},aformat=sample_fmts=fltp:channel_layouts=mono[c${n}]`;
        })
        .join(";");
      const labels = ["[0:a]", ...placed.map((_, i) => `[c${i + 1}]`)];
      const filter = `${delayFilters};${labels.join("")}amix=inputs=${labels.length}:duration=first:dropout_transition=0[aout]`;
      const outPath = join(tmp, "out.wav");
      const r = spawnSync(
        bin,
        [
          ...args,
          "-filter_complex",
          filter,
          "-map",
          "[aout]",
          "-t",
          String(input.durationMs / 1000),
          "-ac",
          "1",
          "-ar",
          "48000",
          outPath,
        ],
        { encoding: "utf8", timeout: 120_000 },
      );
      if (r.status !== 0) return null;
      return readFileSync(outPath);
    } catch {
      return null;
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  }

  function assemble(ownerId: string, attemptId: string) {
    const attempt = loadAttempt(ownerId, attemptId);

    if (attempt.finalized_at && attempt.audio_asset_id) {
      let clocks: Record<string, unknown> = {};
      try {
        clocks = JSON.parse(String(attempt.clocks_json || "{}"));
      } catch {
        /* ignore */
      }
      return {
        reused: true,
        attemptId,
        audioAssetId: String(attempt.audio_asset_id),
        completion: String(attempt.completion || ""),
        durationMs: Number(attempt.duration_ms) || 0,
        assembly: clocks.assembly ?? "segment_timeline",
        captureMode: "segment",
        engine: clocks.assembleEngine ?? "reused",
      };
    }

    let device: Record<string, unknown> = {};
    try {
      device = JSON.parse(String(attempt.device_json || "{}"));
    } catch {
      device = {};
    }
    if (device.captureMode === "continuous") {
      fail(
        409,
        "Attempt đang ở chế độ liên tục — dùng finalize chunk, không ghép đoạn.",
      );
    }

    const segments = loadSegments(attempt);
    if (segments.length === 0) {
      fail(422, "Chưa có phụ đề theo thời gian — không ghép timeline đoạn.");
    }

    const clips = latestClips(attemptId);
    const preferred =
      Number(attempt.duration_ms) > 0 ? Number(attempt.duration_ms) : null;
    const plan = buildSegmentTimeline(segments, clips, preferred);

    let body = buildSilentWav(plan.durationMs);
    let engine = "silence_wav_v1";
    const mixed = tryFfmpegOverlay({
      durationMs: plan.durationMs,
      placements: plan.placements,
      ownerId,
    });
    if (mixed && mixed.length > 44) {
      body = mixed;
      engine = "ffmpeg_adelay_v1";
    }

    const digest = createHash("sha256").update(body).digest("hex");
    const reserved = assets.reserve({
      ownerId,
      kind: "mic",
      bytes: body.length,
      ext: "wav",
    });
    assets.storage.writeFile(reserved.storage_key, body);
    db.prepare(
      "UPDATE kaiwa_assets SET bytes=?, checksum=?, media_json=?, processing_status=? WHERE id=?",
    ).run(
      body.length,
      digest,
      JSON.stringify({
        contentType: "audio/wav",
        purpose: "attempt_mic",
        attemptId,
        assembly: "segment_timeline",
        captureMode: "segment",
        committedAt: new Date().toISOString(),
      }),
      "ready",
      reserved.id,
    );
    db.prepare("DELETE FROM kaiwa_quota_reservations WHERE asset_id=?").run(
      reserved.id,
    );
    db.prepare(
      "UPDATE kaiwa_attempts SET audio_asset_id=? WHERE id=? AND owner_id=?",
    ).run(reserved.id, attemptId, ownerId);

    const completion =
      plan.pending === 0 && plan.recordedOrPartial > 0
        ? plan.skipped > 0 || plan.recordedOrPartial < plan.placements.length
          ? "partial"
          : "completed"
        : "partial";

    const clocks = {
      assembly: "segment_timeline",
      captureMode: "segment",
      assembleEngine: engine,
      hasOverlap: plan.hasOverlap,
      gapTotalMs: plan.gapTotalMs,
      segmentProgress: {
        recorded: plan.recordedOrPartial,
        skipped: plan.skipped,
        pending: plan.pending,
        total: plan.placements.length,
      },
      placements: plan.placements.map((p) => ({
        segmentId: p.segmentId,
        startMs: p.startMs,
        endMs: p.endMs,
        status: p.status,
        audioAssetId: p.audioAssetId,
        overlapWithPrevious: p.overlapWithPrevious,
        gapBeforeMs: p.gapBeforeMs,
      })),
      micOnly: true,
    };

    device.captureMode = "segment";
    device.assembly = "segment_timeline";

    const finalized = finalizeTake.finalize(ownerId, attemptId, {
      completion,
      durationMs: plan.durationMs,
      assemble: false,
      clocks,
      device,
    });

    return {
      reused: Boolean(finalized.reused),
      attemptId,
      audioAssetId: String(finalized.audioAssetId || reserved.id),
      completion: String(finalized.completion),
      durationMs: plan.durationMs,
      assembly: "segment_timeline",
      captureMode: "segment",
      engine,
      hasOverlap: plan.hasOverlap,
      gapTotalMs: plan.gapTotalMs,
      progress: clocks.segmentProgress,
      note:
        plan.pending > 0 || plan.skipped > 0
          ? "Chưa thu đủ mọi đoạn. Bản nghe/xuất chỉ gồm phần đã thu (khoảng trống = im lặng)."
          : undefined,
    };
  }

  return { assemble };
}

export type SegmentAssembleService = ReturnType<
  typeof createSegmentAssembleService
>;
