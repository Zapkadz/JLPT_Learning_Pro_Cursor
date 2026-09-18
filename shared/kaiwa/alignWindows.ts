/**
 * KAI-071 — long-audio window plan + merge (no character-count splits).
 */

export type AlignWindow = {
  index: number;
  startMs: number;
  endMs: number;
};

export type AlignAnchor = {
  /** 0-based script line that should sit near this media time */
  lineIndex: number;
  atMs: number;
};

export type AlignWindowPlanOptions = {
  windowMs?: number;
  overlapMs?: number;
  /** Below this duration, return a single full-span window. */
  minDurationForWindowsMs?: number;
};

export const DEFAULT_ALIGN_WINDOW_MS = 90_000;
export const DEFAULT_ALIGN_OVERLAP_MS = 15_000;
export const DEFAULT_ALIGN_WINDOW_MIN_MS = 180_000;

export function resolveAlignWindowEnv(
  env: NodeJS.ProcessEnv = process.env,
): Required<AlignWindowPlanOptions> {
  const num = (key: string, fallback: number) => {
    const raw = env[key]?.trim();
    if (!raw) return fallback;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
  };
  return {
    windowMs: num("KAIWA_ALIGN_WINDOW_MS", DEFAULT_ALIGN_WINDOW_MS),
    overlapMs: num("KAIWA_ALIGN_OVERLAP_MS", DEFAULT_ALIGN_OVERLAP_MS),
    minDurationForWindowsMs: num(
      "KAIWA_ALIGN_WINDOW_MIN_MS",
      DEFAULT_ALIGN_WINDOW_MIN_MS,
    ),
  };
}

/**
 * Time-based overlapping windows. Never allocates by character count.
 */
export function planAlignWindows(
  durationMs: number,
  opts: AlignWindowPlanOptions = {},
): AlignWindow[] {
  const windowMs = opts.windowMs ?? DEFAULT_ALIGN_WINDOW_MS;
  const overlapMs = Math.min(
    opts.overlapMs ?? DEFAULT_ALIGN_OVERLAP_MS,
    Math.max(0, windowMs - 1000),
  );
  const minDur =
    opts.minDurationForWindowsMs ?? DEFAULT_ALIGN_WINDOW_MIN_MS;
  const dur = Math.max(0, Math.floor(durationMs));
  if (dur <= 0) {
    return [{ index: 0, startMs: 0, endMs: 1 }];
  }
  if (dur <= minDur) {
    return [{ index: 0, startMs: 0, endMs: dur }];
  }
  const step = Math.max(1000, windowMs - overlapMs);
  const windows: AlignWindow[] = [];
  let start = 0;
  let i = 0;
  while (start < dur) {
    const end = Math.min(dur, start + windowMs);
    windows.push({ index: i, startMs: start, endMs: end });
    i += 1;
    if (end >= dur) break;
    start += step;
    if (start >= dur) break;
  }
  return windows;
}

export type LineAudioRegion = {
  lineStart: number;
  lineEnd: number; // exclusive
  audioStartMs: number;
  audioEndMs: number;
};

/**
 * Split the script into contiguous line ranges using optional time anchors.
 * Without anchors → one region spanning the whole file.
 * Does **not** proportion lines by character count.
 */
export function regionsFromAnchors(
  lineCount: number,
  durationMs: number,
  anchors: AlignAnchor[] | undefined,
): LineAudioRegion[] {
  const n = Math.max(0, lineCount);
  const dur = Math.max(1, Math.floor(durationMs));
  if (n === 0) {
    return [{ lineStart: 0, lineEnd: 0, audioStartMs: 0, audioEndMs: dur }];
  }
  if (!anchors?.length) {
    return [
      { lineStart: 0, lineEnd: n, audioStartMs: 0, audioEndMs: dur },
    ];
  }
  const cleaned = anchors
    .filter(
      (a) =>
        Number.isFinite(a.lineIndex) &&
        a.lineIndex >= 0 &&
        a.lineIndex < n &&
        Number.isFinite(a.atMs) &&
        a.atMs >= 0,
    )
    .map((a) => ({
      lineIndex: Math.floor(a.lineIndex),
      atMs: Math.min(dur, Math.floor(a.atMs)),
    }))
    .sort((a, b) => a.lineIndex - b.lineIndex || a.atMs - b.atMs);

  const unique: AlignAnchor[] = [];
  for (const a of cleaned) {
    const last = unique[unique.length - 1];
    if (last && last.lineIndex === a.lineIndex) {
      unique[unique.length - 1] = a;
    } else {
      unique.push(a);
    }
  }

  const regions: LineAudioRegion[] = [];
  let lineStart = 0;
  let audioStart = 0;
  for (const a of unique) {
    if (a.lineIndex <= lineStart) {
      audioStart = Math.min(dur, Math.max(audioStart, a.atMs));
      continue;
    }
    regions.push({
      lineStart,
      lineEnd: a.lineIndex,
      audioStartMs: audioStart,
      audioEndMs: Math.max(audioStart + 1, a.atMs),
    });
    lineStart = a.lineIndex;
    audioStart = a.atMs;
  }
  if (lineStart < n) {
    regions.push({
      lineStart,
      lineEnd: n,
      audioStartMs: audioStart,
      audioEndMs: dur,
    });
  }
  return regions.length
    ? regions
    : [{ lineStart: 0, lineEnd: n, audioStartMs: 0, audioEndMs: dur }];
}

export type WindowPassResult<T> = {
  windowIndex: number;
  ok: boolean;
  /** Per attempted line (same order as the subset passed to the engine). */
  items?: T[];
  error?: string;
};

export type TimedLineDraft = {
  ja: string;
  startMs: number | null;
  endMs: number | null;
  timingStatus?: "proposed" | "needs_review" | "unmatched";
  timingUncertain?: boolean;
  matchReason?: string;
};

/**
 * Merge sequential window passes over remaining lines.
 * Failed windows contribute nothing (no invented equal slots).
 * First successful match for a global line index wins.
 */
export function mergeWindowPassResults(
  allLines: string[],
  passes: WindowPassResult<TimedLineDraft>[],
  windowOffsetMs: number[],
): {
  drafts: TimedLineDraft[];
  failedWindows: number[];
  appliedWindows: number[];
} {
  const drafts: TimedLineDraft[] = allLines.map((ja) => ({
    ja,
    startMs: null,
    endMs: null,
    timingStatus: "unmatched",
    timingUncertain: true,
    matchReason: "pending_window",
  }));
  const filled = new Array(allLines.length).fill(false);
  const failedWindows: number[] = [];
  const appliedWindows: number[] = [];

  const remaining = () => {
    const idx: number[] = [];
    for (let i = 0; i < allLines.length; i++) {
      if (!filled[i]) idx.push(i);
    }
    return idx;
  };

  for (const pass of passes) {
    const targets = remaining();
    if (!pass.ok || !pass.items?.length) {
      failedWindows.push(pass.windowIndex);
      continue;
    }
    const offset = windowOffsetMs[pass.windowIndex] ?? 0;
    let any = false;
    const n = Math.min(pass.items.length, targets.length);
    for (let j = 0; j < n; j++) {
      const item = pass.items[j];
      const gi = targets[j];
      if (filled[gi]) continue;
      const status =
        item.timingStatus ||
        (item.startMs == null || item.endMs == null
          ? "unmatched"
          : item.timingUncertain
            ? "needs_review"
            : "proposed");
      if (status === "unmatched" || item.startMs == null || item.endMs == null) {
        continue;
      }
      drafts[gi] = {
        ja: allLines[gi],
        startMs: Math.max(0, Math.round(item.startMs + offset)),
        endMs: Math.max(
          Math.round(item.startMs + offset) + 1,
          Math.round(item.endMs + offset),
        ),
        timingStatus: status,
        timingUncertain:
          Boolean(item.timingUncertain) || status === "needs_review",
        matchReason: item.matchReason || `window_${pass.windowIndex}`,
      };
      filled[gi] = true;
      any = true;
    }
    if (any) appliedWindows.push(pass.windowIndex);
  }

  for (let i = 0; i < drafts.length; i++) {
    if (!filled[i] && drafts[i].matchReason === "pending_window") {
      drafts[i] = {
        ...drafts[i],
        matchReason: failedWindows.length
          ? "unmatched_after_failed_or_empty_windows"
          : "unmatched",
      };
    }
  }

  return { drafts, failedWindows, appliedWindows };
}

/** Guard: proportional character budgets are forbidden for window assignment. */
export function assertNotCharProportionalSplit(
  lineLengths: number[],
  assignedBudgets: number[],
): void {
  if (lineLengths.length !== assignedBudgets.length || !lineLengths.length) {
    return;
  }
  const totalChars = lineLengths.reduce((a, b) => a + b, 0);
  const totalBudget = assignedBudgets.reduce((a, b) => a + b, 0);
  if (totalChars <= 0 || totalBudget <= 0) return;
  let maxAbs = 0;
  for (let i = 0; i < lineLengths.length; i++) {
    const expected = (lineLengths[i] / totalChars) * totalBudget;
    maxAbs = Math.max(maxAbs, Math.abs(assignedBudgets[i] - expected));
  }
  if (maxAbs <= 1 && lineLengths.length >= 2) {
    throw new Error(
      "char_proportional_split_forbidden: do not equal-split windows by character count",
    );
  }
}
