/**
 * KAI-074 — speech timing (transcript) vs practice / overlay padding (UI only).
 *
 * Segment `startMs`/`endMs` (and optional `speechStartMs`/`speechEndMs`) are speech spans.
 * Practice lead-in/trail and overlay early-show must NOT be written into transcript ends.
 */

import type { KaiwaSegment } from "./types";

export type PracticeTimingConfig = {
  /** Extra ms before speech start when recording / seeking sample. */
  leadInMs: number;
  /** Extra ms after speech end when recording (clamped before next speech). */
  trailMs: number;
  /** Show overlay this many ms before speech start (continuous mode). */
  overlayEarlyShowMs: number;
  /** Minimum gap left before the next line's speech start. */
  minGapBeforeNextMs: number;
};

export const DEFAULT_PRACTICE_TIMING: PracticeTimingConfig = {
  leadInMs: 200,
  trailMs: 150,
  overlayEarlyShowMs: 400,
  minGapBeforeNextMs: 40,
};

export function resolvePracticeTimingEnv(
  env: NodeJS.ProcessEnv = process.env,
): PracticeTimingConfig {
  const num = (key: string, fallback: number) => {
    const raw = env[key]?.trim();
    if (!raw) return fallback;
    const n = Number(raw);
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : fallback;
  };
  return {
    leadInMs: num("KAIWA_PRACTICE_LEAD_IN_MS", DEFAULT_PRACTICE_TIMING.leadInMs),
    trailMs: num("KAIWA_PRACTICE_TRAIL_MS", DEFAULT_PRACTICE_TIMING.trailMs),
    overlayEarlyShowMs: num(
      "KAIWA_OVERLAY_EARLY_SHOW_MS",
      DEFAULT_PRACTICE_TIMING.overlayEarlyShowMs,
    ),
    minGapBeforeNextMs: num(
      "KAIWA_PRACTICE_MIN_GAP_MS",
      DEFAULT_PRACTICE_TIMING.minGapBeforeNextMs,
    ),
  };
}

type SpeechFields = Pick<
  KaiwaSegment,
  "startMs" | "endMs" | "speechStartMs" | "speechEndMs"
>;

/** Canonical speech window stored on the segment (never practice-padded). */
export function speechBounds(seg: SpeechFields): {
  startMs: number;
  endMs: number;
} {
  const startMs =
    seg.speechStartMs != null ? seg.speechStartMs : seg.startMs;
  const endMs = seg.speechEndMs != null ? seg.speechEndMs : seg.endMs;
  return {
    startMs: Math.max(0, startMs),
    endMs: Math.max(startMs + 1, endMs),
  };
}

/**
 * Studio record / sample window derived from speech + config.
 * Clamped so practice trail does not invade the next line's speech start.
 * Does not mutate the segment.
 */
export function practiceBounds(
  seg: SpeechFields,
  next: SpeechFields | null | undefined,
  cfg: PracticeTimingConfig = DEFAULT_PRACTICE_TIMING,
): { startMs: number; endMs: number } {
  const speech = speechBounds(seg);
  let startMs = Math.max(0, speech.startMs - cfg.leadInMs);
  let endMs = speech.endMs + cfg.trailMs;
  if (next) {
    const nextSpeech = speechBounds(next);
    const limit = nextSpeech.startMs - cfg.minGapBeforeNextMs;
    if (Number.isFinite(limit)) {
      endMs = Math.min(endMs, Math.max(speech.endMs, limit));
    }
  }
  if (endMs <= startMs) endMs = startMs + 1;
  return { startMs, endMs };
}

/**
 * Effective overlay activation time = speech start − early show (UI only).
 */
export function overlayShowAtMs(
  seg: SpeechFields,
  cfg: PracticeTimingConfig = DEFAULT_PRACTICE_TIMING,
): number {
  const speech = speechBounds(seg);
  return Math.max(0, speech.startMs - cfg.overlayEarlyShowMs);
}

/** Copy speech into optional speech* fields without changing practice config. */
export function withSpeechFields(seg: KaiwaSegment): KaiwaSegment {
  const { startMs, endMs } = speechBounds(seg);
  return {
    ...seg,
    startMs,
    endMs,
    speechStartMs: startMs,
    speechEndMs: endMs,
  };
}
