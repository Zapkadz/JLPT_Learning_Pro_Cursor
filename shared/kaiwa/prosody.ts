/**
 * Relative F0 / timing prosody foundation (KAI-027).
 * Never labels Japanese pitch accent; never uses absolute pitch as ability.
 * Teacher/benchmark calibration deferred to KAI-023.
 */

import { synthesizePcmInt16Le } from "./audioQuality";

export type ProsodyStatus =
  | "ready"
  | "unavailable"
  | "not_assessable"
  | "uncertain";

export type ContourDirection = "rising" | "falling" | "flat" | "unknown";

export type ProsodySegmentReport = {
  segmentId: string | null;
  status: ProsodyStatus;
  reason: string | null;
  timing: {
    plannedMs: number | null;
    observedMs: number | null;
    driftMs: number | null;
    /** >1 = slower than plan; null if not comparable. */
    stretchRatio: number | null;
  };
  f0: {
    /** Median F0 in Hz among voiced frames — diagnostic only, not a score. */
    medianHz: number | null;
    voicedRatio: number;
    /** Median-centered log2 contour samples (relative shape). */
    relativeContour: number[];
    direction: ContourDirection;
  };
  /** Always null — pitch-accent diagnosis requires lexicon + KAI-023. */
  pitchAccentLabel: null;
  /** Always null — absolute pitch / timbre / gender are not ability scores. */
  abilityScore: null;
  messageVi: string;
};

export type ProsodyReport = {
  engine: "kaiwa-prosody-v1-provisional";
  status: ProsodyStatus;
  reason: string | null;
  calibrated: false;
  teacherCompared: false;
  segments: ProsodySegmentReport[];
  messageVi: string;
};

const FRAME_MS = 25;
const HOP_MS = 10;
const F0_MIN = 70;
const F0_MAX = 400;
const VOICED_CORR_MIN = 0.35;
const ENERGY_MIN = 0.02;
const FLAT_SLOPE = 0.15;

function readMonoSamples(
  pcm: Uint8Array | Buffer,
  channels: number,
): Float64Array {
  const ch = Math.max(1, channels);
  const byteLen = pcm.byteLength - (pcm.byteLength % (2 * ch));
  const view = new DataView(pcm.buffer, pcm.byteOffset, byteLen);
  const frames = byteLen / (2 * ch);
  const out = new Float64Array(frames);
  for (let i = 0; i < frames; i++) {
    out[i] = view.getInt16(i * ch * 2, true) / 32768;
  }
  return out;
}

function frameEnergy(frame: Float64Array): number {
  let s = 0;
  for (let i = 0; i < frame.length; i++) s += frame[i] * frame[i];
  return Math.sqrt(s / Math.max(1, frame.length));
}

/** Autocorrelation F0 estimate; null if unvoiced / out of range. */
export function estimateF0Hz(
  frame: Float64Array,
  sampleRateHz: number,
): number | null {
  const energy = frameEnergy(frame);
  if (energy < ENERGY_MIN) return null;

  const minLag = Math.floor(sampleRateHz / F0_MAX);
  const maxLag = Math.min(
    Math.floor(sampleRateHz / F0_MIN),
    frame.length - 1,
  );
  if (maxLag <= minLag) return null;

  let bestLag = -1;
  let bestCorr = 0;
  let energy0 = 0;
  for (let i = 0; i < frame.length; i++) energy0 += frame[i] * frame[i];
  if (energy0 < 1e-12) return null;

  for (let lag = minLag; lag <= maxLag; lag++) {
    let corr = 0;
    const n = frame.length - lag;
    for (let i = 0; i < n; i++) corr += frame[i] * frame[i + lag];
    corr /= energy0;
    if (corr > bestCorr) {
      bestCorr = corr;
      bestLag = lag;
    }
  }

  if (bestLag < 0 || bestCorr < VOICED_CORR_MIN) return null;
  const hz = sampleRateHz / bestLag;
  if (hz < F0_MIN || hz > F0_MAX) return null;
  return hz;
}

function median(values: number[]): number | null {
  if (!values.length) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function contourDirection(relative: number[]): ContourDirection {
  if (relative.length < 3) return "unknown";
  const n = relative.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += relative[i];
    sumXY += i * relative[i];
    sumXX += i * i;
  }
  const denom = n * sumXX - sumX * sumX;
  if (Math.abs(denom) < 1e-9) return "flat";
  const slope = (n * sumXY - sumX * sumY) / denom;
  if (Math.abs(slope) < FLAT_SLOPE / n) return "flat";
  return slope > 0 ? "rising" : "falling";
}

export type AnalyzeProsodyOpts = {
  sampleRateHz: number;
  channels?: number;
  segmentId?: string | null;
  plannedMs?: number | null;
  /** When alignment is weak, refuse affirmative rhythm claims. */
  alignmentStatus?: string | null;
};

export function analyzeProsodyPcm(
  pcm: Uint8Array | Buffer,
  opts: AnalyzeProsodyOpts,
): ProsodySegmentReport {
  const sampleRateHz = opts.sampleRateHz;
  const channels = opts.channels ?? 1;
  const segmentId = opts.segmentId ?? null;
  const plannedMs = opts.plannedMs ?? null;
  const align = opts.alignmentStatus ?? null;

  if (
    align === "data_gap" ||
    align === "uncertain" ||
    align === "missing_speech" ||
    align === "out_of_range"
  ) {
    return {
      segmentId,
      status: "not_assessable",
      reason: `alignment_${align}`,
      timing: {
        plannedMs,
        observedMs: null,
        driftMs: null,
        stretchRatio: null,
      },
      f0: {
        medianHz: null,
        voicedRatio: 0,
        relativeContour: [],
        direction: "unknown",
      },
      pitchAccentLabel: null,
      abilityScore: null,
      messageVi:
        "Căn chỉnh chưa đủ tin cậy — không kết luận nhịp/ngữ điệu; không gắn nhãn pitch accent.",
    };
  }

  const samples = readMonoSamples(pcm, channels);
  const frameLen = Math.max(1, Math.round((sampleRateHz * FRAME_MS) / 1000));
  const hop = Math.max(1, Math.round((sampleRateHz * HOP_MS) / 1000));
  const f0s: number[] = [];
  let frames = 0;

  for (let start = 0; start + frameLen <= samples.length; start += hop) {
    const frame = samples.subarray(start, start + frameLen);
    frames++;
    const f0 = estimateF0Hz(frame, sampleRateHz);
    if (f0 != null) f0s.push(f0);
  }

  const observedMs = Math.round((samples.length / sampleRateHz) * 1000);
  const voicedRatio = frames > 0 ? f0s.length / frames : 0;
  const med = median(f0s);
  const relativeContour =
    med && med > 0 ? f0s.map((hz) => Math.log2(hz / med)) : [];
  const direction = contourDirection(relativeContour);

  let driftMs: number | null = null;
  let stretchRatio: number | null = null;
  if (plannedMs != null && plannedMs > 0) {
    driftMs = observedMs - plannedMs;
    stretchRatio = observedMs / plannedMs;
  }

  if (samples.length < sampleRateHz * 0.2) {
    return {
      segmentId,
      status: "not_assessable",
      reason: "too_short",
      timing: { plannedMs, observedMs, driftMs, stretchRatio },
      f0: {
        medianHz: med,
        voicedRatio,
        relativeContour: [],
        direction: "unknown",
      },
      pitchAccentLabel: null,
      abilityScore: null,
      messageVi: "Đoạn quá ngắn — không đủ để đo nhịp/F0 tương đối.",
    };
  }

  if (voicedRatio < 0.08 || med == null) {
    return {
      segmentId,
      status: "not_assessable",
      reason: "unvoiced",
      timing: { plannedMs, observedMs, driftMs, stretchRatio },
      f0: {
        medianHz: null,
        voicedRatio,
        relativeContour: [],
        direction: "unknown",
      },
      pitchAccentLabel: null,
      abilityScore: null,
      messageVi:
        "Vùng hữu thanh quá ít — để trống ngữ điệu; không phạt cao độ tuyệt đối.",
    };
  }

  return {
    segmentId,
    status: "ready",
    reason: null,
    timing: { plannedMs, observedMs, driftMs, stretchRatio },
    f0: {
      medianHz: med,
      voicedRatio,
      relativeContour: relativeContour.slice(0, 64),
      direction,
    },
    pitchAccentLabel: null,
    abilityScore: null,
    messageVi: `F0 tương đối: hướng ${direction} (chưa hiệu chỉnh giáo viên; không phải pitch accent).`,
  };
}

export function unavailableProsodyReport(
  reason = "decode_unavailable",
): ProsodyReport {
  return {
    engine: "kaiwa-prosody-v1-provisional",
    status: "unavailable",
    reason,
    calibrated: false,
    teacherCompared: false,
    segments: [],
    messageVi:
      "Chưa giải mã PCM — không vẽ F0 giả; không gắn nhãn pitch accent. Nghe/xuất vẫn dùng được.",
  };
}

export function buildAttemptProsodyReport(
  segments: ProsodySegmentReport[],
): ProsodyReport {
  const anyReady = segments.some((s) => s.status === "ready");
  const allBlocked =
    segments.length > 0 &&
    segments.every(
      (s) => s.status === "not_assessable" || s.status === "unavailable",
    );
  return {
    engine: "kaiwa-prosody-v1-provisional",
    status: anyReady ? "ready" : allBlocked ? "not_assessable" : "unavailable",
    reason: anyReady ? null : "provisional_local_only",
    calibrated: false,
    teacherCompared: false,
    segments,
    messageVi: anyReady
      ? "Phân tích nhịp/F0 tương đối tạm thời (chưa đối chiếu giáo viên / KAI-023). Không phải điểm pitch accent."
      : "Chưa đủ tín hiệu hữu thanh để công bố nhịp/ngữ điệu.",
  };
}

export { synthesizePcmInt16Le };
