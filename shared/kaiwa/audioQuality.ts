/**
 * Provisional audio quality gate (KAI-024).
 * Operates on PCM Int16 LE mono samples — never invents pronunciation scores.
 * DSP cutoffs below remain provisional until calibrated on the KAI-023 corpus;
 * Gate B *feedback* rates are locked in shared/kaiwa/gateBBenchmark.ts.
 */

export type AudioQualityVerdict =
  | "assessable"
  | "not_assessable"
  | "unavailable";

export type AudioQualityReason =
  | "silence"
  | "clipping"
  | "too_short"
  | "empty"
  | "decode_unavailable"
  | "reference_leakage_unverified"
  | "provisional_ok";

export type AudioQualityReport = {
  verdict: AudioQualityVerdict;
  reasons: AudioQualityReason[];
  metrics: {
    durationMs: number;
    sampleRateHz: number;
    channels: number;
    rms: number;
    peak: number;
    silenceRatio: number;
    clippingRatio: number;
  };
  /** Explicit: this is not a pronunciation score. */
  pronunciationScore: null;
  engine: "kaiwa-audio-quality-v1-provisional";
  messageVi: string;
};

export type QualityThresholds = {
  minDurationMs: number;
  silenceRms: number;
  silenceRatioMax: number;
  clippingAbs: number;
  clippingRatioMax: number;
};

/** DSP cutoffs provisional until calibrated on KAI-023 corpus. */
export const PROVISIONAL_THRESHOLDS: QualityThresholds = {
  minDurationMs: 400,
  silenceRms: 0.01,
  silenceRatioMax: 0.92,
  clippingAbs: 0.99,
  clippingRatioMax: 0.02,
};

function messageFor(
  verdict: AudioQualityVerdict,
  reasons: AudioQualityReason[],
): string {
  if (verdict === "assessable") {
    return "Chất lượng bản thu tạm đạt để cân nhắc chấm (ngưỡng tạm thời). Đây không phải điểm phát âm.";
  }
  if (reasons.includes("decode_unavailable")) {
    return "Chưa giải mã được PCM từ tệp — không kết luận chất lượng; không gán điểm phát âm 0.";
  }
  if (reasons.includes("silence")) {
    return "Bản thu quá im lặng — hãy thu lại. Không chấm phát âm trên tín hiệu thiếu.";
  }
  if (reasons.includes("clipping")) {
    return "Phát hiện clipping mạnh — hạ mức micro và thu lại. Không chấm phát âm trên tín hiệu méo.";
  }
  if (reasons.includes("too_short") || reasons.includes("empty")) {
    return "Bản thu quá ngắn hoặc trống — không đủ để chấm.";
  }
  return "Chưa đủ tin cậy để chấm — không gán điểm phát âm.";
}

/**
 * Analyze PCM Int16 little-endian mono (or interleaved; uses first channel if stereo).
 */
export function analyzePcmInt16Le(
  pcm: Uint8Array | Buffer,
  opts: {
    sampleRateHz: number;
    channels?: number;
    thresholds?: QualityThresholds;
  },
): AudioQualityReport {
  const thresholds = opts.thresholds ?? PROVISIONAL_THRESHOLDS;
  const channels = Math.max(1, opts.channels ?? 1);
  const sampleRateHz = opts.sampleRateHz;
  const reasons: AudioQualityReason[] = [];

  const byteLen = pcm.byteLength - (pcm.byteLength % (2 * channels));
  if (byteLen < 4) {
    return {
      verdict: "not_assessable",
      reasons: ["empty"],
      metrics: {
        durationMs: 0,
        sampleRateHz,
        channels,
        rms: 0,
        peak: 0,
        silenceRatio: 1,
        clippingRatio: 0,
      },
      pronunciationScore: null,
      engine: "kaiwa-audio-quality-v1-provisional",
      messageVi: messageFor("not_assessable", ["empty"]),
    };
  }

  const view = new DataView(
    pcm.buffer,
    pcm.byteOffset,
    byteLen,
  );
  const frameCount = byteLen / (2 * channels);
  let sumSq = 0;
  let peak = 0;
  let silent = 0;
  let clipped = 0;

  for (let i = 0; i < frameCount; i++) {
    const s = view.getInt16(i * channels * 2, true) / 32768;
    const a = Math.abs(s);
    sumSq += s * s;
    if (a > peak) peak = a;
    if (a < thresholds.silenceRms) silent++;
    if (a >= thresholds.clippingAbs) clipped++;
  }

  const rms = Math.sqrt(sumSq / Math.max(1, frameCount));
  const silenceRatio = silent / Math.max(1, frameCount);
  const clippingRatio = clipped / Math.max(1, frameCount);
  const durationMs = Math.round((frameCount / sampleRateHz) * 1000);

  if (durationMs < thresholds.minDurationMs) reasons.push("too_short");
  if (silenceRatio >= thresholds.silenceRatioMax) reasons.push("silence");
  if (clippingRatio >= thresholds.clippingRatioMax) reasons.push("clipping");

  // Reference leakage: not computed without paired reference correlation.
  // Do not invent leakage — leave unverified and do not fail solely on this.
  const verdict: AudioQualityVerdict =
    reasons.length === 0 ? "assessable" : "not_assessable";
  if (verdict === "assessable") reasons.push("provisional_ok");

  return {
    verdict,
    reasons,
    metrics: {
      durationMs,
      sampleRateHz,
      channels,
      rms,
      peak,
      silenceRatio,
      clippingRatio,
    },
    pronunciationScore: null,
    engine: "kaiwa-audio-quality-v1-provisional",
    messageVi: messageFor(verdict, reasons),
  };
}

export function unavailableDecodeReport(
  sampleRateHz = 48000,
): AudioQualityReport {
  return {
    verdict: "unavailable",
    reasons: ["decode_unavailable", "reference_leakage_unverified"],
    metrics: {
      durationMs: 0,
      sampleRateHz,
      channels: 1,
      rms: 0,
      peak: 0,
      silenceRatio: 0,
      clippingRatio: 0,
    },
    pronunciationScore: null,
    engine: "kaiwa-audio-quality-v1-provisional",
    messageVi: messageFor("unavailable", ["decode_unavailable"]),
  };
}

/** Build Int16 LE PCM buffer for tests. */
export function synthesizePcmInt16Le(
  frames: number,
  fill: (i: number) => number,
): Buffer {
  const buf = Buffer.alloc(frames * 2);
  for (let i = 0; i < frames; i++) {
    const x = Math.max(-1, Math.min(1, fill(i)));
    buf.writeInt16LE(Math.round(x * 32767), i * 2);
  }
  return buf;
}
