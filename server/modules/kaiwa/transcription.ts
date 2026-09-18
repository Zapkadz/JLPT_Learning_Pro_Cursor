/**
 * KAI-056 video-only ASR → draft revision (source=asr). Never auto-publish.
 */

import { randomUUID } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import type Database from "better-sqlite3";
import { z } from "zod";
import { UNTIMED_PLACEHOLDER_SLOT_MS } from "../../../shared/kaiwa/subtitles";
import type { KaiwaSegment } from "../../../shared/kaiwa/types";
import type { JobService } from "./jobs";
import type { AssetService } from "./assets";
import { KaiwaError, type KaiwaRepository } from "./repository";
import {
  resolveFfmpegPath,
  resolveTranscriptionCapability,
} from "./speechCapability";

const transcriptionRequestSchema = z.object({
  expectedRevisionVersion: z.number().int().nonnegative(),
});

function fail(status: number, message: string): never {
  throw new KaiwaError(status, message);
}

function newSegId(): string {
  return randomUUID();
}

function mockTranscribe(durationMs: number): KaiwaSegment[] {
  const slot = Math.max(1000, Math.floor(durationMs / 2) || UNTIMED_PLACEHOLDER_SLOT_MS);
  return [
    {
      id: newSegId(),
      startMs: 0,
      endMs: slot,
      ja: "（ASR mock）こんにちは。",
      reviewState: "draft",
      assessable: true,
      timingUncertain: true,
    },
    {
      id: newSegId(),
      startMs: slot,
      endMs: slot * 2,
      ja: "（ASR mock）今日はいい天気ですね。",
      reviewState: "draft",
      assessable: true,
      timingUncertain: true,
    },
  ];
}

function whisperTranscribe(opts: {
  ffmpeg: string;
  videoPath: string;
  python: string;
  model: string;
}): KaiwaSegment[] {
  const tmp = mkdtempSync(join(tmpdir(), "kaiwa-asr-"));
  try {
    const wav = join(tmp, "asr.wav");
    const outPath = join(tmp, "out.json");
    const extract = spawnSync(
      opts.ffmpeg,
      ["-y", "-i", opts.videoPath, "-vn", "-ac", "1", "-ar", "16000", wav],
      { encoding: "utf8", timeout: 120_000 },
    );
    if (extract.status !== 0) {
      fail(
        422,
        `Không tách được audio (ffmpeg). ${extract.stderr?.slice(0, 200) || ""}`.trim(),
      );
    }
    const sidecar = join(
      process.cwd(),
      "scripts",
      "kaiwa",
      "transcribe_sidecar.py",
    );
    const run = spawnSync(
      opts.python,
      [sidecar, "--wav", wav, "--out", outPath, "--model", opts.model],
      {
        encoding: "utf8",
        timeout: 600_000,
        env: { ...process.env, PYTHONIOENCODING: "utf-8" },
      },
    );
    if (run.status !== 0) {
      const detail =
        run.stderr?.slice(0, 400) || run.stdout?.slice(0, 400) || "";
      if (run.status === 3 || /0 segments/i.test(detail)) {
        fail(
          422,
          "ASR không nhận được lời thoại (0 đoạn). Anime/BGM/chồng tiếng thường làm Whisper trống — hãy dùng Đồng bộ script (có sẵn lời) hoặc nhập SRT/VTT.",
        );
      }
      fail(
        503,
        `ASR Whisper thất bại. ${detail}`.trim(),
      );
    }
    const raw = JSON.parse(readFileSync(outPath, "utf8")) as {
      segments: Array<{
        ja: string;
        startMs: number;
        endMs: number;
        timingUncertain?: boolean;
      }>;
    };
    const segs = (raw.segments || []).map((s) => ({
      id: newSegId(),
      startMs: Math.max(0, s.startMs),
      endMs: s.endMs > s.startMs ? s.endMs : s.startMs + 300,
      ja: (s.ja || "").slice(0, 4000),
      reviewState: "draft" as const,
      assessable: true,
      timingUncertain: true,
    }));
    if (!segs.length) {
      fail(422, "ASR không nhận được lời thoại — hãy thử SRT/VTT hoặc soạn tay.");
    }
    return segs;
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

export function createTranscriptionService(
  db: Database.Database,
  repo: KaiwaRepository,
  assets: AssetService,
  jobs: JobService,
) {
  function runTranscribe(ownerId: string, projectId: string, body: unknown) {
    const data = transcriptionRequestSchema.parse(body ?? {});
    const cap = resolveTranscriptionCapability();
    if (cap.status === "not_configured") {
      fail(503, cap.messageVi);
    }

    const project = repo.ownProject(projectId, ownerId);
    const assetId = project.proxy_asset_id || project.source_asset_id;
    if (!assetId) {
      fail(422, "Dự án chưa có video — hãy tải lên và chuẩn bị media trước.");
    }

    const job = jobs.enqueue({
      ownerId,
      kind: "transcribe",
      payload: {
        projectId,
        expectedRevisionVersion: data.expectedRevisionVersion,
      },
      idempotencyKey: `transcribe:${projectId}:${data.expectedRevisionVersion}`,
    });

    const workerId = `asr-inline:${job.id}`;
    const now = new Date().toISOString();
    try {
      db.prepare(
        `UPDATE kaiwa_jobs
         SET state='running', lease_owner=?, lease_until=?, updated_at=?
         WHERE id=?`,
      ).run(workerId, new Date(Date.now() + 600_000).toISOString(), now, job.id);

      const asset = assets.ownAsset(ownerId, String(assetId));
      const videoPath = assets.storage.resolvePath(String(asset.storage_key));
      const ffmpeg = resolveFfmpegPath();
      const engine = process.env.KAIWA_ASR_ENGINE?.trim() || "whisper";

      let segments: KaiwaSegment[];
      let alignEngine: string;

      if (engine === "mock") {
        let durationMs = 6000;
        if (ffmpeg) {
          const probeBin = ffmpeg.replace(/ffmpeg(\.exe)?$/i, "ffprobe$1");
          const probe = spawnSync(
            probeBin,
            [
              "-v",
              "error",
              "-show_entries",
              "format=duration",
              "-of",
              "default=noprint_wrappers=1:nokey=1",
              videoPath,
            ],
            { encoding: "utf8", timeout: 30_000 },
          );
          const d = Number(probe.stdout?.trim());
          if (Number.isFinite(d) && d > 0) durationMs = Math.round(d * 1000);
        }
        segments = mockTranscribe(durationMs);
        alignEngine = "mock_asr";
      } else {
        if (!ffmpeg) fail(503, "Thiếu ffmpeg — không thể ASR từ video.");
        const python =
          process.env.KAIWA_PYTHON?.trim() ||
          process.env.PYTHON?.trim() ||
          "python";
        const model = process.env.KAIWA_WHISPER_MODEL?.trim() || "base";
        segments = whisperTranscribe({
          ffmpeg,
          videoPath,
          python,
          model,
        });
        alignEngine = `faster-whisper:${model}`;
      }

      const revision = repo.saveDraft(ownerId, projectId, {
        expectedRevisionVersion: data.expectedRevisionVersion,
        payload: { segments },
        source: {
          source: "asr",
          alignEngine,
          alignConfidence: null,
          provider: engine === "mock" ? "mock" : "faster-whisper",
          generatedAt: new Date().toISOString(),
        },
      });

      db.prepare(
        `UPDATE kaiwa_jobs
         SET state='succeeded', result_json=?, lease_owner=NULL, lease_until=NULL,
             error_message=NULL, updated_at=?
         WHERE id=?`,
      ).run(
        JSON.stringify({
          revisionId: revision.id,
          version: revision.version,
          segmentCount: segments.length,
          alignEngine,
        }),
        new Date().toISOString(),
        job.id,
      );

      return {
        jobId: job.id,
        revision: {
          id: revision.id,
          version: revision.version,
          state: revision.state,
          payload: JSON.parse(revision.payload || '{"segments":[]}'),
          source_json: JSON.parse(revision.source_json || "{}"),
        },
        alignEngine,
      };
    } catch (e) {
      const message = e instanceof Error ? e.message : "ASR thất bại.";
      try {
        db.prepare(
          `UPDATE kaiwa_jobs
           SET state='failed', error_message=?, lease_owner=NULL, lease_until=NULL, updated_at=?
           WHERE id=? AND state!='succeeded'`,
        ).run(message.slice(0, 500), new Date().toISOString(), job.id);
      } catch {
        /* ignore */
      }
      throw e;
    }
  }

  return { runTranscribe };
}

export type TranscriptionService = ReturnType<typeof createTranscriptionService>;
