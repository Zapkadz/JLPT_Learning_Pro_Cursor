/**
 * KAI-053 script-align + KAI-065 honesty + KAI-071 windowed long audio.
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
import {
  mergeWindowPassResults,
  planAlignWindows,
  regionsFromAnchors,
  resolveAlignWindowEnv,
  type TimedLineDraft,
  type WindowPassResult,
} from "../../../shared/kaiwa/alignWindows";
import type { JobService } from "./jobs";
import type { AssetService } from "./assets";
import { KaiwaError, type KaiwaRepository } from "./repository";
import {
  resolveFfmpegPath,
  resolveScriptAlignCapability,
  resolveScriptAlignEnginePref,
} from "./speechCapability";

function fail(status: number, message: string): never {
  throw new KaiwaError(status, message);
}

function newSegId(): string {
  return randomUUID();
}

function ffmpegDirOnPath(ffmpeg: string, env: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  const dir = join(ffmpeg, "..");
  const pathKey = process.platform === "win32" ? "Path" : "PATH";
  const prev = env[pathKey] || env.PATH || "";
  return {
    ...env,
    FFMPEG_PATH: ffmpeg,
    [pathKey]: `${dir}${process.platform === "win32" ? ";" : ":"}${prev}`,
    PYTHONIOENCODING: "utf-8",
  };
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

function draftToSegment(s: TimedLineDraft): KaiwaSegment {
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
    speechStartMs: startMs,
    speechEndMs: endMs,
    ja: (s.ja || "").slice(0, 4000),
    reviewState: "draft",
    assessable: true,
    timingUncertain: Boolean(s.timingUncertain) || status === "needs_review",
    timingStatus: status,
    timingReason: s.matchReason,
  };
}

function probeDurationMs(ffmpeg: string, mediaPath: string): number | null {
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
      mediaPath,
    ],
    { encoding: "utf8", timeout: 30_000 },
  );
  const d = Number(probe.stdout?.trim());
  if (Number.isFinite(d) && d > 0) return Math.round(d * 1000);
  return null;
}

function runSidecarOnWav(opts: {
  wavPath: string;
  lines: string[];
  python: string;
  model: string;
  sidecarFile: string;
  failLabel: string;
  ffmpeg: string;
  workDir: string;
}): { drafts: TimedLineDraft[]; engineLabel: string } {
  const scriptPath = join(opts.workDir, `script-${randomUUID()}.json`);
  const outPath = join(opts.workDir, `out-${randomUUID()}.json`);
  writeFileSync(scriptPath, JSON.stringify({ lines: opts.lines }), "utf8");

  const sidecar = join(process.cwd(), "scripts", "kaiwa", opts.sidecarFile);
  const run = spawnSync(
    opts.python,
    [
      sidecar,
      "--wav",
      opts.wavPath,
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
      env: ffmpegDirOnPath(opts.ffmpeg, process.env),
      cwd: join(process.cwd(), "scripts", "kaiwa"),
    },
  );
  if (run.status !== 0) {
    fail(
      503,
      `${opts.failLabel} thất bại. ${run.stderr?.slice(0, 300) || run.stdout?.slice(0, 300) || ""}`.trim(),
    );
  }
  const raw = JSON.parse(readFileSync(outPath, "utf8")) as {
    segments: SidecarSeg[];
    engine?: string;
  };
  return {
    drafts: (raw.segments || []).map((s) => ({
      ja: s.ja,
      startMs: s.startMs,
      endMs: s.endMs,
      timingUncertain: s.timingUncertain,
      timingStatus: s.timingStatus,
      matchReason: s.matchReason,
    })),
    engineLabel: raw.engine || opts.failLabel,
  };
}

function extractFullWav(
  ffmpeg: string,
  videoPath: string,
  wavPath: string,
): void {
  const extract = spawnSync(
    ffmpeg,
    ["-y", "-i", videoPath, "-vn", "-ac", "1", "-ar", "16000", wavPath],
    { encoding: "utf8", timeout: 120_000 },
  );
  if (extract.status !== 0) {
    fail(
      422,
      `Không tách được audio (ffmpeg). ${extract.stderr?.slice(0, 200) || ""}`.trim(),
    );
  }
}

function sliceWav(
  ffmpeg: string,
  fullWav: string,
  slicePath: string,
  startMs: number,
  endMs: number,
): boolean {
  const startSec = (startMs / 1000).toFixed(3);
  const durSec = (Math.max(1, endMs - startMs) / 1000).toFixed(3);
  const cut = spawnSync(
    ffmpeg,
    [
      "-y",
      "-ss",
      startSec,
      "-t",
      durSec,
      "-i",
      fullWav,
      "-ac",
      "1",
      "-ar",
      "16000",
      slicePath,
    ],
    { encoding: "utf8", timeout: 60_000 },
  );
  return cut.status === 0;
}

function runAlignSidecar(opts: {
  ffmpeg: string;
  videoPath: string;
  lines: string[];
  python: string;
  model: string;
  sidecarFile: string;
  failLabel: string;
  anchors?: { lineIndex: number; atMs: number }[];
}): {
  segments: KaiwaSegment[];
  engineLabel: string;
  windowCount: number;
  failedWindows: number[];
} {
  const tmp = mkdtempSync(join(tmpdir(), "kaiwa-align-"));
  try {
    const fullWav = join(tmp, "full.wav");
    extractFullWav(opts.ffmpeg, opts.videoPath, fullWav);
    const durationMs =
      probeDurationMs(opts.ffmpeg, fullWav) ||
      probeDurationMs(opts.ffmpeg, opts.videoPath) ||
      opts.lines.length * UNTIMED_PLACEHOLDER_SLOT_MS;

    const winEnv = resolveAlignWindowEnv();
    const regions = regionsFromAnchors(
      opts.lines.length,
      durationMs,
      opts.anchors,
    );

    const windows: { startMs: number; endMs: number; index: number }[] = [];
    for (const region of regions) {
      const span = Math.max(1, region.audioEndMs - region.audioStartMs);
      const local = planAlignWindows(span, {
        windowMs: winEnv.windowMs,
        overlapMs: winEnv.overlapMs,
        minDurationForWindowsMs: winEnv.minDurationForWindowsMs,
      });
      for (const w of local) {
        windows.push({
          index: windows.length,
          startMs: region.audioStartMs + w.startMs,
          endMs: Math.min(
            region.audioEndMs,
            region.audioStartMs + w.endMs,
          ),
        });
      }
    }
    if (!windows.length) {
      windows.push({ index: 0, startMs: 0, endMs: durationMs });
    }

    if (windows.length === 1 && windows[0].startMs === 0) {
      const out = runSidecarOnWav({
        wavPath: fullWav,
        lines: opts.lines,
        python: opts.python,
        model: opts.model,
        sidecarFile: opts.sidecarFile,
        failLabel: opts.failLabel,
        ffmpeg: opts.ffmpeg,
        workDir: tmp,
      });
      return {
        segments: out.drafts.map(draftToSegment),
        engineLabel: out.engineLabel,
        windowCount: 1,
        failedWindows: [],
      };
    }

    const passes: WindowPassResult<TimedLineDraft>[] = [];
    const offsets: number[] = [];
    let engineLabel = opts.failLabel;

    for (const w of windows) {
      offsets[w.index] = w.startMs;
      const provisionalSoFar = mergeWindowPassResults(
        opts.lines,
        passes,
        offsets,
      );
      const remaining = provisionalSoFar.drafts
        .map((d, i) =>
          d.timingStatus === "unmatched" || d.startMs == null ? i : -1,
        )
        .filter((i) => i >= 0);
      if (!remaining.length) break;

      const slicePath = join(tmp, `w${w.index}.wav`);
      if (!sliceWav(opts.ffmpeg, fullWav, slicePath, w.startMs, w.endMs)) {
        passes.push({
          windowIndex: w.index,
          ok: false,
          error: "ffmpeg_slice_failed",
        });
        continue;
      }
      const subset = remaining.map((i) => opts.lines[i]);
      try {
        const out = runSidecarOnWav({
          wavPath: slicePath,
          lines: subset,
          python: opts.python,
          model: opts.model,
          sidecarFile: opts.sidecarFile,
          failLabel: opts.failLabel,
          ffmpeg: opts.ffmpeg,
          workDir: tmp,
        });
        engineLabel = `${out.engineLabel}+windows`;
        passes.push({
          windowIndex: w.index,
          ok: true,
          items: out.drafts,
        });
      } catch (e) {
        passes.push({
          windowIndex: w.index,
          ok: false,
          error: e instanceof Error ? e.message : "window_align_failed",
        });
      }
    }

    const merged = mergeWindowPassResults(opts.lines, passes, offsets);
    return {
      segments: merged.drafts.map(draftToSegment),
      engineLabel,
      windowCount: windows.length,
      failedWindows: merged.failedWindows,
    };
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
    if (cap.status === "not_configured" || cap.status === "unavailable") {
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
        anchorCount: data.anchors?.length || 0,
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
      const engine = resolveScriptAlignEnginePref();

      let segments: KaiwaSegment[];
      let alignEngine: string;
      let provider: string;
      let windowCount = 1;
      let failedWindows: number[] = [];

      if (engine === "mock") {
        let durationMs = lines.length * UNTIMED_PLACEHOLDER_SLOT_MS;
        if (ffmpeg) {
          const d = probeDurationMs(ffmpeg, videoPath);
          if (d) durationMs = d;
        }
        segments = mockAlign(lines, durationMs);
        alignEngine = "mock_equal_slots";
        provider = "mock";
      } else {
        if (!ffmpeg) {
          fail(503, "Thiếu ffmpeg — không thể đồng bộ script.");
        }
        const python =
          process.env.KAIWA_PYTHON?.trim() ||
          process.env.PYTHON?.trim() ||
          "python";
        const model = process.env.KAIWA_WHISPER_MODEL?.trim() || "base";
        const common = {
          ffmpeg,
          videoPath,
          lines,
          python,
          model,
          anchors: data.anchors,
        };
        let out: ReturnType<typeof runAlignSidecar>;
        if (engine === "stable_ts") {
          out = runAlignSidecar({
            ...common,
            sidecarFile: "align_stable_ts_sidecar.py",
            failLabel: "Align stable-ts",
          });
          provider = "stable-ts";
        } else if (engine === "qwen_fa") {
          out = runAlignSidecar({
            ...common,
            model:
              process.env.KAIWA_QWEN_FA_MODEL?.trim() ||
              "Qwen/Qwen3-ForcedAligner-0.6B",
            sidecarFile: "align_qwen_fa_sidecar.py",
            failLabel: "Align Qwen ForcedAligner",
          });
          provider = "qwen-forced-aligner";
        } else {
          out = runAlignSidecar({
            ...common,
            sidecarFile: "align_script_sidecar.py",
            failLabel: "Align Whisper",
          });
          provider = "faster-whisper";
        }
        segments = out.segments;
        alignEngine = out.engineLabel;
        windowCount = out.windowCount;
        failedWindows = out.failedWindows;
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
          provider: provider,
          generatedAt: new Date().toISOString(),
          windowCount,
          failedWindows,
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
          windowCount,
          failedWindows,
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
        windowCount,
        failedWindows,
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
