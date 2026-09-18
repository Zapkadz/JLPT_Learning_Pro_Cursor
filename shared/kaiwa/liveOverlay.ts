/**
 * Pick current (+ next) timed subtitle for continuous overlay (KAI-041).
 * KAI-074: optional early-show uses derived starts — never mutates transcript ends.
 */

import type { KaiwaSegment } from "./types";
import {
  DEFAULT_PRACTICE_TIMING,
  overlayShowAtMs,
  speechBounds,
  type PracticeTimingConfig,
} from "./practiceTiming";

export type TimedLine = {
  id: string;
  startMs: number;
  endMs: number;
  ja?: string;
  vi?: string;
};

/** Index of the line active at tMs, or -1 if before first / empty. */
export function activeSegmentIndex(
  segments: TimedLine[],
  tMs: number,
): number {
  if (!segments.length) return -1;
  const t = Math.max(0, Math.round(tMs));
  if (t < segments[0].startMs) return -1;
  for (let i = 0; i < segments.length; i++) {
    const s = segments[i];
    if (t >= s.startMs && t < s.endMs) return i;
  }
  let last = -1;
  for (let i = 0; i < segments.length; i++) {
    if (t >= segments[i].startMs) last = i;
  }
  return last;
}

export function currentAndNext(
  segments: TimedLine[],
  tMs: number,
): { current: TimedLine | null; next: TimedLine | null; index: number } {
  const index = activeSegmentIndex(segments, tMs);
  if (index < 0) {
    return {
      current: null,
      next: segments[0] ?? null,
      index: -1,
    };
  }
  return {
    current: segments[index] ?? null,
    next: segments[index + 1] ?? null,
    index,
  };
}

/**
 * Build overlay timeline: early-show advances display start only.
 * Transcript speech end is unchanged (KAI-074).
 */
export function segmentsForOverlay(
  segments: KaiwaSegment[],
  cfg: PracticeTimingConfig = DEFAULT_PRACTICE_TIMING,
): TimedLine[] {
  let prevSpeechEnd = 0;
  return segments.map((s) => {
    const speech = speechBounds(s);
    const early = overlayShowAtMs(s, cfg);
    const startMs = Math.max(early, prevSpeechEnd);
    prevSpeechEnd = speech.endMs;
    return {
      id: s.id,
      startMs,
      endMs: speech.endMs,
      ja: s.ja,
      vi: s.vi,
    };
  });
}
