/**
 * KAI-053 script-align + KAI-065 honesty: no fake timings; preserve line meta.
 */

import { randomUUID } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import type Database from "better-sqlite3";
import {
  parseUntimedScript,
  UNTIMED_PLACEHOLDER_SLOT_MS,
} from "../../../shared/kaiwa/subtitles";
import {
  scriptAlignRequestSchema,
  type KaiwaSegment,
} from "../../../shared/kaiwa/types";
import type { JobService } from "./jobs";
import type { AssetService } from "./assets";
import { KaiwaError, type KaiwaRepository } from "./repository";
import {
  resolveFfmpegPath,
  resolveScriptAlignCapability,
} from "./speechCapability";

function fail(status: number, message: string): never {
  throw new KaiwaError(status, message);
}

function newSegId(): string {
  return randomUUID();
}

function normalizeJaKey(s: string): string {
  return s
    .toLowerCase()
    .replace(/[\s　、。．，,.！？!?「」『』（）()【】\[\]…・]+/g, "");
}

/** Keep id / vi / tokens when re-timing the same dialogue lines. */
export function mergePreserveSegmentMeta(
  aligned: KaiwaSegment[],
  previous: KaiwaSegment[] | undefined,
): KaiwaSegment[] {
  if (!previous?.length) return aligned;
  const used = new Set<string>();
  return aligned.map((seg, i) => {
    let prev =
      previous[i] &&
      normalizeJaKey(previous[i].ja) === normalizeJaKey(seg.ja)
        ? previous[i]
        : undefined;
    if (!prev) {
      prev = previous.find(
        (p) =>
          !used.has(p.id) &&
          normalizeJaKey(p.ja) === normalizeJaKey(seg.ja),
      );
    }
    if (!prev) return seg;
    used.add(prev.id);
    return {
      ...seg,
      id: prev.id,
      vi: prev.vi,
      tokens: prev.tokens,
      readingStale: prev.readingStale,
      speakerLabel: prev.speakerLabel,
    };
  });
}

function mockAlign(lines: string[], durationMs: number): KaiwaSegment[] {
  const n = Math.max(lines.length, 1);
  const slot = Math.max(
    500,
    Math.floor(durationMs > 0 ? durationMs / n : UNTIMED_PLACEHOLDER_SLOT_MS),
  );
  return lines.map((ja, i) => ({
    id: newSegId(),
    startMs: i * slot,
    endMs: (i + 1) * slot,
    ja: ja.slice(0, 4000),
    reviewState: "draft" as const,
    assessable: true,
    timingUncertain: true,
    timingStatus: "needs_review" as const,
    timingReason: "mock_equal_slots",
  }));
}

type SidecarSeg = {
  ja: string;
  startMs: number | null;
  endMs: number | null;
  timingUncertain?: boolean;
  timingStatus?: "proposed" | "needs_review" | "unmatched";
  matchReason?: string;
};

function sidecarToSegment(s: SidecarSeg): KaiwaSegment {
  const status =
    s.timingStatus ||
    (s.startMs == null || s.endMs == null
      ? "unmatched"
      : s.timingUncertain
        ? "needs_review"
        : "proposed");

  if (status === "unmatched" || s.startMs == null || s.endMs == null) {
    return {
      id: newSegId(),
      startMs: 0,
      endMs: 1,
      ja: (s.ja || "").slice(0, 4000),
      reviewState: "draft",
      assessable: false,
      assessableReason: "Chưa tìm được vị trí trong audio",
      timingUncertain: true,
      timingStatus: "unmatched",
      timingReason: s.matchReason || "unmatched",
    };
  }

  const startMs = Math.max(0, s.startMs);
  const endMs = s.endMs > startMs ? s.endMs : startMs + 400;
  return {
    id: newSegId(),
    startMs,
    endMs,
    ja: (s.ja || "").slice(0, 4000),
    reviewState: "draft",
    assessable: true,
    timingUncertain: Boolean(s.timingUncertain) || status === "needs_review",
    timingStatus: status,
    timingReason: s.matchReason,
  };
}

function whisperAlign(opts: {
  ffmpeg: string;
  videoPath: string;
  lines: string[];
  python: string;
  model: string;
}): KaiwaSegment[] {
  const tmp = mkdtempSync(join(tmpdir(), "kaiwa-align-"));
  try {
    const wav = join(tmp, "align.wav");
    const scriptPath = join(tmp, "script.json");
    const outPath = join(tmp, "out.json");
    writeFileSync(scriptPath, JSON.stringify({ lines: opts.lines }), "utf8");

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
      "align_script_sidecar.py",
    );
    const run = spawnSync(
      opts.python,
      [
        sidecar,
        "--wav",
        wav,
        "--script",
        scriptPath,
        "--out",
        outPath,
        "--model",
        opts.model,
      ],
      {
        encoding: "utf8",
        timeout: 600_000,
        env: { ...process.env, PYTHONIOENCODING: "utf-8" },
      },
    );
    if (run.status !== 0) {
      fail(
        503,
        `Align Whisper thất bại. ${run.stderr?.slice(0, 300) || run.stdout?.slice(0, 300) || ""}`.trim(),
      );
    }
    const raw = JSON.parse(readFileSync(outPath, "utf8")) as {
      segments: SidecarSeg[];
    };
    return (raw.segments || []).map(sidecarToSegment);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

export function createScriptAlignService(
  db: Database.Database,
  repo: KaiwaRepository,
  assets: AssetService,
  jobs: JobService,
) {
  function runAlign(ownerId: string, projectId: string, body: unknown) {
    const data = scriptAlignRequestSchema.parse(body);
    const cap = resolveScriptAlignCapability();
    if (cap.status === "not_configured") {
      fail(503, cap.messageVi);
    }

    const project = repo.ownProject(projectId, ownerId);
    const assetId = project.proxy_asset_id || project.source_asset_id;
    if (!assetId) {
      fail(422, "Dự án chưa có video — hãy tải lên và chuẩn bị media trước.");
    }

    const parsed = parseUntimedScript(data.text);
    if (!parsed.segments.length) {
      fail(422, "Script trống hoặc không còn dòng hợp lệ sau khi làm sạch.");
    }
    const lines = parsed.segments.map((s) => s.ja);

    let previous: KaiwaSegment[] | undefined;
    try {
      const revId = project.active_revision_id;
      if (revId) {
        const rev = db
          .prepare(
            `SELECT payload FROM kaiwa_revisions WHERE id=? AND project_id=?`,
          )
          .get(String(revId), projectId) as { payload?: string } | undefined;
        if (rev?.payload) {
          const payload = JSON.parse(rev.payload) as {
            segments?: KaiwaSegment[];
          };
          previous = payload.segments;
        }
      }
    } catch {
      previous = undefined;
    }

    const job = jobs.enqueue({
      ownerId,
      kind: "align_script",
      payload: {
        projectId,
        expectedRevisionVersion: data.expectedRevisionVersion,
        lineCount: lines.length,
      },
      idempotencyKey: `align_script:${projectId}:${data.expectedRevisionVersion}:${lines.length}:${Buffer.from(data.text).toString("base64url").slice(0, 48)}`,
    });

    const workerId = `align-inline:${job.id}`;
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
      const engine = process.env.KAIWA_SCRIPT_ALIGN_ENGINE?.trim() || "whisper";

      let segments: KaiwaSegment[];
      let alignEngine: string;

      if (engine === "mock") {
        let durationMs = lines.length * UNTIMED_PLACEHOLDER_SLOT_MS;
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
        segments = mockAlign(lines, durationMs);
        alignEngine = "mock_equal_slots";
      } else {
        if (!ffmpeg) {
          fail(503, "Thiếu ffmpeg — không thể đồng bộ script.");
        }
        const python =
          process.env.KAIWA_PYTHON?.trim() ||
          process.env.PYTHON?.trim() ||
          "python";
        const model = process.env.KAIWA_WHISPER_MODEL?.trim() || "base";
        segments = whisperAlign({
          ffmpeg,
          videoPath,
          lines,
          python,
          model,
        });
        alignEngine = `faster-whisper:${model}`;
      }

      segments = mergePreserveSegmentMeta(segments, previous);

      if (!segments.length) {
        fail(422, "Align không tạo được đoạn nào.");
      }

      const proposed = segments.filter((s) => s.timingStatus !== "unmatched");
      if (engine !== "mock" && proposed.length === 0) {
        fail(
          422,
          "Không tìm được mốc thời gian nào khớp script. Giữ lời thoại — hãy chỉnh tay hoặc thử lại với audio rõ hơn. Không gán mốc giả.",
        );
      }

      const revision = repo.saveDraft(ownerId, projectId, {
        expectedRevisionVersion: data.expectedRevisionVersion,
        payload: { segments },
        source: {
          source: "script_align",
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
          proposedCount: proposed.length,
          unmatchedCount: segments.length - proposed.length,
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
        proposedCount: proposed.length,
        unmatchedCount: segments.length - proposed.length,
      };
    } catch (e) {
      const message = e instanceof Error ? e.message : "Align thất bại.";
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

  return { runAlign };
}

export type ScriptAlignService = ReturnType<typeof createScriptAlignService>;
