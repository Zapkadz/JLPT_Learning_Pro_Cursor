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
  | "reference_leakage"
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
    /** Peak |normalized cross-corr| vs reference; null if no reference. */
    leakageCorr: number | null;
    leakageLagMs: number | null;
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
  /**
   * Peak |NCC| above this → reference_leakage (speaker playback into mic).
   * Conservative until corpus calibration.
   */
  leakageCorrMin: number;
  /** Search ± this many ms for delayed leak. */
  leakageMaxLagMs: number;
};

/** DSP cutoffs provisional until calibrated on KAI-023 corpus. */
export const PROVISIONAL_THRESHOLDS: QualityThresholds = {
  minDurationMs: 400,
  silenceRms: 0.01,
  silenceRatioMax: 0.92,
  clippingAbs: 0.99,
  clippingRatioMax: 0.02,
  leakageCorrMin: 0.85,
  leakageMaxLagMs: 80,
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
  if (reasons.includes("reference_leakage")) {
    return "Phát hiện tiếng mẫu lọt vào micro (tương quan cao với reference) — tắt loa/tai nghe hoặc hạ volume mẫu rồi thu lại. Không tính là đã nói đủ.";
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

function pcmToMonoFloat(
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

/**
 * Peak absolute normalized cross-correlation of mic vs reference over ±maxLag.
 * Returns null if either signal is too short/silent to compare.
 */
export function estimateReferenceLeakage(
  micPcm: Uint8Array | Buffer,
  referencePcm: Uint8Array | Buffer,
  opts: {
    sampleRateHz: number;
    channels?: number;
    referenceChannels?: number;
    maxLagMs?: number;
  },
): { corr: number; lagMs: number } | null {
  const channels = Math.max(1, opts.channels ?? 1);
  const refCh = Math.max(1, opts.referenceChannels ?? 1);
  const mic = pcmToMonoFloat(micPcm, channels);
  const ref = pcmToMonoFloat(referencePcm, refCh);
  const n = Math.min(mic.length, ref.length);
  if (n < 800) return null;

  const maxFrames = Math.min(n, Math.floor(opts.sampleRateHz * 2));
  const a = mic.subarray(0, maxFrames);
  const b = ref.subarray(0, maxFrames);
  const len = a.length;

  let meanA = 0;
  let meanB = 0;
  for (let i = 0; i < len; i++) {
    meanA += a[i];
    meanB += b[i];
  }
  meanA /= len;
  meanB /= len;

  let varA = 0;
  let varB = 0;
  for (let i = 0; i < len; i++) {
    const da = a[i] - meanA;
    const db = b[i] - meanB;
    varA += da * da;
    varB += db * db;
  }
  if (varA < 1e-8 || varB < 1e-8) return null;

  const maxLag = Math.min(
    Math.floor(((opts.maxLagMs ?? 80) / 1000) * opts.sampleRateHz),
    Math.floor(len / 4),
  );

  let best = 0;
  let bestLag = 0;
  for (let lag = -maxLag; lag <= maxLag; lag++) {
    let sum = 0;
    let count = 0;
    const i0 = Math.max(0, -lag);
    const i1 = Math.min(len, len - lag);
    for (let i = i0; i < i1; i++) {
      sum += (a[i] - meanA) * (b[i + lag] - meanB);
      count++;
    }
    if (count < 400) continue;
    const corr = sum / Math.sqrt(varA * varB);
    if (Math.abs(corr) > Math.abs(best)) {
      best = corr;
      bestLag = lag;
    }
  }

  return {
    corr: best,
    lagMs: Math.round((bestLag / opts.sampleRateHz) * 1000),
  };
}

/**
 * Analyze PCM Int16 little-endian mono (or interleaved; uses first channel if stereo).
 * Optional reference PCM enables conservative speaker-leakage detection.
 */
export function analyzePcmInt16Le(
  pcm: Uint8Array | Buffer,
  opts: {
    sampleRateHz: number;
    channels?: number;
    thresholds?: QualityThresholds;
    referencePcm?: Uint8Array | Buffer | null;
    referenceChannels?: number;
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
        leakageCorr: null,
        leakageLagMs: null,
      },
      pronunciationScore: null,
      engine: "kaiwa-audio-quality-v1-provisional",
      messageVi: messageFor("not_assessable", ["empty"]),
    };
  }

  const view = new DataView(pcm.buffer, pcm.byteOffset, byteLen);
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

  let leakageCorr: number | null = null;
  let leakageLagMs: number | null = null;
  if (opts.referencePcm && opts.referencePcm.byteLength >= 4) {
    const leak = estimateReferenceLeakage(pcm, opts.referencePcm, {
      sampleRateHz,
      channels,
      referenceChannels: opts.referenceChannels ?? 1,
      maxLagMs: thresholds.leakageMaxLagMs,
    });
    if (leak) {
      leakageCorr = leak.corr;
      leakageLagMs = leak.lagMs;
      if (Math.abs(leak.corr) >= thresholds.leakageCorrMin) {
        reasons.push("reference_leakage");
      }
    }
  }

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
      leakageCorr,
      leakageLagMs,
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
      leakageCorr: null,
      leakageLagMs: null,
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
