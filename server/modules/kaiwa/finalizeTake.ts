import type Database from "better-sqlite3";
import { KaiwaError } from "./repository";
import type { AssetService } from "./assets";
import type { AttemptChunkService } from "./attemptChunks";
import { recordFinalizeActivity } from "./activity";

export type FinalizeInput = {
  completion: "completed" | "partial" | "interrupted" | "failed";
  durationMs?: number;
  clocks?: Record<string, unknown>;
  device?: Record<string, unknown>;
  /** When true, assemble remaining chunks before finalize (default true for completed/partial). */
  assemble?: boolean;
};

function fail(status: number, message: string): never {
  throw new KaiwaError(status, message);
}

/**
 * KAI-020 take finalize: idempotent, decode gate, duration check,
 * interrupted/missing-tail honesty, mic track never mixed with reference video.
 */
export function createFinalizeTakeService(
  db: Database.Database,
  assets: AssetService,
  attemptChunks: AttemptChunkService,
) {
  function loadAttempt(ownerId: string, attemptId: string) {
    const row = db
      .prepare("SELECT * FROM kaiwa_attempts WHERE id=? AND owner_id=?")
      .get(attemptId, ownerId) as Record<string, unknown> | undefined;
    if (!row) fail(404, "Không tìm thấy bản thu.");
    return row;
  }

  function validateMicAsset(ownerId: string, assetId: string) {
    const asset = assets.ownAsset(ownerId, assetId);
    if (asset.kind !== "mic") {
      fail(
        422,
        "Audio bản thu phải là track micro (kind=mic) — không trộn tiếng mẫu/video.",
      );
    }
    const st = assets.storage.stat(asset.storage_key);
    if (!st || st.size < 16) {
      fail(422, "Tệp micro thiếu hoặc quá ngắn — không báo đã lưu.");
    }
    // Head / mid / tail byte ranges must be readable (playability smoke).
    const size = st.size;
    const probes = [
      { start: 0, end: Math.min(7, size - 1) },
      {
        start: Math.max(0, Math.floor(size / 2) - 4),
        end: Math.min(size - 1, Math.floor(size / 2) + 3),
      },
      { start: Math.max(0, size - 8), end: size - 1 },
    ];
    for (const range of probes) {
      try {
        const { stream } = assets.storage.openRead(asset.storage_key, range);
        stream.resume();
      } catch {
        fail(422, "Không đọc được audio đầu/giữa/cuối — không báo đã lưu.");
      }
    }
    const media = JSON.parse(asset.media_json || "{}") as {
      contentType?: string;
      purpose?: string;
    };
    if (media.purpose && media.purpose !== "attempt_mic") {
      fail(422, "Asset không phải mic thu — từ chối finalize.");
    }
    // Ensure content is not video/*
    if (media.contentType?.startsWith("video/")) {
      fail(422, "Track micro không được chứa video/reference.");
    }
    return { asset, size };
  }

  function finalize(
    ownerId: string,
    attemptId: string,
    input: FinalizeInput,
  ) {
    const row = loadAttempt(ownerId, attemptId);
    if (row.finalized_at) {
      // Idempotent return
      return {
        reused: true,
        attemptId,
        completion: row.completion,
        audioAssetId: row.audio_asset_id,
        recordState: row.record_state,
        durationMs: row.duration_ms,
        tailMissing: Boolean(
          (JSON.parse(String(row.clocks_json || "{}")) as { tailMissing?: boolean })
            .tailMissing,
        ),
      };
    }

    const needsAudio =
      input.completion === "completed" || input.completion === "partial";
    const shouldAssemble = input.assemble !== false && needsAudio;

    let audioAssetId = row.audio_asset_id as string | null;
    let tailMissing = false;

    if (shouldAssemble && !audioAssetId) {
      try {
        const asset = attemptChunks.assemble(ownerId, attemptId);
        audioAssetId = asset.id;
      } catch (e) {
        if (input.completion === "interrupted") {
          // Honest path: interruption with incomplete journal
          tailMissing = true;
        } else {
          throw e;
        }
      }
    }

    // Interrupted with some chunks already assembled earlier is OK.
    if (needsAudio) {
      if (!audioAssetId) {
        fail(409, "Thiếu audio hợp lệ — không báo đã lưu bản thu.");
      }
      validateMicAsset(ownerId, audioAssetId);
    }

    if (
      input.completion === "interrupted" &&
      !audioAssetId
    ) {
      tailMissing = true;
    }

    const durationMs = input.durationMs;
    if (
      needsAudio &&
      (durationMs == null || !Number.isFinite(durationMs) || durationMs < 0)
    ) {
      fail(400, "Thiếu durationMs hợp lệ khi chốt bản thu có audio.");
    }
    // Sanity: tiny completed takes are suspicious but partial/interrupted OK
    if (input.completion === "completed" && (durationMs || 0) < 50) {
      fail(422, "Thời lượng hoàn tất quá ngắn — kiểm tra lại đồng hồ video.");
    }

    const clocks = {
      ...(input.clocks || {}),
      tailMissing,
      micOnly: true,
      finalizedEngine: "kaiwa-finalize-v1",
    };
    const now = new Date().toISOString();
    const recordState = needsAudio
      ? "saved"
      : input.completion === "interrupted"
        ? "interrupted"
        : input.completion;

    const result = db
      .prepare(
        `UPDATE kaiwa_attempts SET completion=?, duration_ms=?, clocks_json=?, device_json=?,
       audio_asset_id=COALESCE(?, audio_asset_id), record_state=?, finalized_at=?
       WHERE id=? AND owner_id=? AND finalized_at IS NULL`,
      )
      .run(
        input.completion,
        durationMs ?? null,
        JSON.stringify(clocks),
        JSON.stringify(input.device ?? {}),
        audioAssetId,
        recordState,
        now,
        attemptId,
        ownerId,
      );

    const after = loadAttempt(ownerId, attemptId);
    if (!after.finalized_at || result.changes === 0) {
      // Lost race to another finalize — return idempotent snapshot
      const clocksJson = JSON.parse(String(after.clocks_json || "{}")) as {
        tailMissing?: boolean;
      };
      return {
        reused: true,
        attemptId,
        completion: after.completion,
        audioAssetId: after.audio_asset_id,
        recordState: after.record_state,
        durationMs: after.duration_ms,
        tailMissing: Boolean(clocksJson.tailMissing),
      };
    }

    // Gate A history only — does not touch deck/grammar XP (ADR-018).
    recordFinalizeActivity(db, {
      ownerId,
      attemptId,
      speakingMs: Number(durationMs) || 0,
      occurredAt: now,
    });

    return {
      reused: false,
      attemptId,
      completion: after.completion,
      audioAssetId: after.audio_asset_id,
      recordState: after.record_state,
      durationMs: after.duration_ms,
      tailMissing,
      micOnly: true,
    };
  }

  return { finalize, validateMicAsset };
}

export type FinalizeTakeService = ReturnType<typeof createFinalizeTakeService>;
