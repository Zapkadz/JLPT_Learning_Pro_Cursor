/**
 * KAI-073 — lock / drag-edit / realign merge / undo for script timings.
 *
 * Locked lines keep their speech window when a partial realign runs.
 * Practice padding stays UI-only (KAI-074).
 */

import type { KaiwaSegment } from "./types";

export function isTimingLocked(seg: Pick<KaiwaSegment, "timingLocked">): boolean {
  return Boolean(seg.timingLocked);
}

/** Clamp a dragged start/end so end > start and optional neighbor bounds. */
export function clampTimingEdit(
  startMs: number,
  endMs: number,
  opts?: { minStart?: number; maxEnd?: number; minDurMs?: number },
): { startMs: number; endMs: number } {
  const minDur = opts?.minDurMs ?? 80;
  let s = Math.max(0, Math.round(startMs));
  let e = Math.max(s + minDur, Math.round(endMs));
  if (opts?.minStart != null) s = Math.max(opts.minStart, s);
  if (opts?.maxEnd != null) e = Math.min(opts.maxEnd, e);
  if (e < s + minDur) e = s + minDur;
  return { startMs: s, endMs: e };
}

export function applySegmentTiming(
  seg: KaiwaSegment,
  startMs: number,
  endMs: number,
): KaiwaSegment {
  const next = clampTimingEdit(startMs, endMs);
  return {
    ...seg,
    startMs: next.startMs,
    endMs: next.endMs,
    speechStartMs: next.startMs,
    speechEndMs: next.endMs,
    timingStatus:
      seg.timingStatus === "unmatched" ? "needs_review" : seg.timingStatus || "proposed",
    timingUncertain: false,
    assessable: true,
    assessableReason: null,
    timingReason: "manual_waveform",
  };
}

export function toggleTimingLock(seg: KaiwaSegment, locked?: boolean): KaiwaSegment {
  const next = locked ?? !seg.timingLocked;
  return { ...seg, timingLocked: next };
}

export type RealignMergeOptions = {
  /** Inclusive start index of lines that may receive new timings. */
  rangeStart?: number;
  /** Exclusive end index. Default: all. */
  rangeEnd?: number;
};

/**
 * Merge machine realign into previous segments.
 * - Locked lines always keep previous timing (even inside range).
 * - Outside range: keep previous.
 * - Inside range + unlocked: take aligned timing when present.
 */
export function mergeRealignPreservingLocks(
  previous: KaiwaSegment[],
  aligned: KaiwaSegment[],
  opts: RealignMergeOptions = {},
): { segments: KaiwaSegment[]; changedIds: string[]; preservedIds: string[] } {
  const rangeStart = opts.rangeStart ?? 0;
  const rangeEnd = opts.rangeEnd ?? previous.length;
  const changedIds: string[] = [];
  const preservedIds: string[] = [];

  const segments = previous.map((prev, i) => {
    const inRange = i >= rangeStart && i < rangeEnd;
    if (!inRange || isTimingLocked(prev)) {
      preservedIds.push(prev.id);
      return prev;
    }
    const next = aligned[i];
    if (!next) {
      preservedIds.push(prev.id);
      return prev;
    }
    changedIds.push(prev.id);
    return {
      ...prev,
      startMs: next.startMs,
      endMs: next.endMs,
      speechStartMs: next.speechStartMs ?? next.startMs,
      speechEndMs: next.speechEndMs ?? next.endMs,
      timingStatus: next.timingStatus,
      timingUncertain: next.timingUncertain,
      timingReason: next.timingReason,
      assessable: next.assessable,
      assessableReason: next.assessableReason,
      // keep lock false; id/vi/tokens from prev
      timingLocked: prev.timingLocked,
    };
  });

  return { segments, changedIds, preservedIds };
}

/** Anchors from locked lines for Point Sync–style realign between locks. */
export function anchorsFromLocks(
  segments: KaiwaSegment[],
): { lineIndex: number; atMs: number }[] {
  const out: { lineIndex: number; atMs: number }[] = [];
  for (let i = 0; i < segments.length; i++) {
    const s = segments[i];
    if (!isTimingLocked(s)) continue;
    if (!(s.endMs > s.startMs)) continue;
    out.push({ lineIndex: i, atMs: s.startMs });
  }
  return out;
}

/** Indices strictly between two locked lines (or whole unlocked span). */
export function rangeBetweenLocks(
  segments: KaiwaSegment[],
  focusIndex: number,
): { rangeStart: number; rangeEnd: number } {
  let left = -1;
  let right = segments.length;
  for (let i = focusIndex; i >= 0; i--) {
    if (isTimingLocked(segments[i])) {
      left = i;
      break;
    }
  }
  for (let i = focusIndex; i < segments.length; i++) {
    if (isTimingLocked(segments[i])) {
      right = i;
      break;
    }
  }
  const rangeStart = left < 0 ? 0 : left + 1;
  const rangeEnd = right;
  if (rangeStart >= rangeEnd) {
    return { rangeStart: focusIndex, rangeEnd: focusIndex + 1 };
  }
  return { rangeStart, rangeEnd };
}

export type TimingSnapshot = KaiwaSegment[];

export function pushTimingUndo(
  stack: TimingSnapshot[],
  current: TimingSnapshot,
  limit = 30,
): TimingSnapshot[] {
  const next = [...stack, current.map((s) => ({ ...s }))];
  if (next.length > limit) next.splice(0, next.length - limit);
  return next;
}

export function popTimingUndo(
  stack: TimingSnapshot[],
): { stack: TimingSnapshot[]; restored: TimingSnapshot | null } {
  if (!stack.length) return { stack, restored: null };
  const restored = stack[stack.length - 1];
  return { stack: stack.slice(0, -1), restored };
}

/** Count how many segments kept identical speech windows after a merge. */
export function countUnchangedTimings(
  before: KaiwaSegment[],
  after: KaiwaSegment[],
): number {
  let n = 0;
  const len = Math.min(before.length, after.length);
  for (let i = 0; i < len; i++) {
    if (
      before[i].id === after[i].id &&
      before[i].startMs === after[i].startMs &&
      before[i].endMs === after[i].endMs
    ) {
      n += 1;
    }
  }
  return n;
}
