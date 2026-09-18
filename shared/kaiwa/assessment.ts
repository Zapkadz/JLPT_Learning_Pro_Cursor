/**
 * Pronunciation / segment assessment evidence schema (KAI-026).
 * Live ja-JP provider fields must be verified before scores are exposed.
 * ASR confidence is NEVER a pronunciation score.
 */

export type AssessmentStatus =
  | "pending"
  | "ready"
  | "unavailable"
  | "not_assessable"
  | "failed";

export type AssessmentReason =
  | "missing_credentials"
  | "provider_not_wired"
  | "empty_audio"
  | "low_alignment"
  | "data_gap"
  | "quality_gate"
  | "provider_timeout"
  | "budget_exhausted"
  | "parse_rejected"
  | "prosody_locale_unsupported";

export type SegmentAssessmentMetrics = {
  accuracy: number | null;
  fluency: number | null;
  completeness: number | null;
  /** Coverage of planned speech — not a pronunciation grade. */
  coverage: number | null;
  timingDriftMs: number | null;
  /** Relative F0 only when calibrated; never absolute pitch ability. */
  f0ContourScore: number | null;
};

export type SegmentAssessment = {
  segmentId: string;
  status: AssessmentStatus;
  reason: AssessmentReason | null;
  provider: { id: string; modelVersion: string; locale: "ja-JP" } | null;
  metrics: SegmentAssessmentMetrics;
  /**
   * Provider ASR/recognition confidence if present — MUST NOT be copied into
   * accuracy or any learner-facing pronunciation score.
   */
  asrConfidence: number | null;
  evidence: {
    startMs: number;
    endMs: number;
    notes: string[];
  } | null;
  /** Affirmative phoneme error labels — empty unless provider returned real ones. */
  phonemeErrors: never[];
  rubricVersion: string;
};

export type AttemptPronunciationReport = {
  engine: "kaiwa-pronunciation-v1-stub";
  attemptId: string;
  status: AssessmentStatus;
  reason: AssessmentReason | null;
  rubricVersion: string;
  locale: "ja-JP";
  liveProviderUsed: false;
  budget: {
    maxSegments: number;
    maxWallMs: number;
    usedSegments: number;
  };
  segments: SegmentAssessment[];
  messageVi: string;
};

export const RUBRIC_VERSION = "kaiwa-ja-rubric-draft-001";
export const DEFAULT_BUDGET = { maxSegments: 200, maxWallMs: 60_000 };

export function emptyMetrics(): SegmentAssessmentMetrics {
  return {
    accuracy: null,
    fluency: null,
    completeness: null,
    coverage: null,
    timingDriftMs: null,
    f0ContourScore: null,
  };
}

/**
 * Normalize a hypothetical provider JSON blob.
 * Drops ProsodyScore for ja-JP; never maps RecognitionConfidence → accuracy.
 */
export function parseProviderPronunciationPayload(
  raw: unknown,
  opts?: { locale?: "ja-JP"; budget?: { maxSegments: number } },
): {
  ok: boolean;
  reason: AssessmentReason | null;
  segments: SegmentAssessment[];
} {
  const locale = opts?.locale ?? "ja-JP";
  const maxSeg = opts?.budget?.maxSegments ?? DEFAULT_BUDGET.maxSegments;

  if (!raw || typeof raw !== "object") {
    return { ok: false, reason: "parse_rejected", segments: [] };
  }
  const obj = raw as Record<string, unknown>;

  if (obj.ProsodyScore != null && locale === "ja-JP") {
    // Prosody assessment documented en-US only — reject using it for JA.
    return { ok: false, reason: "prosody_locale_unsupported", segments: [] };
  }

  const list = Array.isArray(obj.Segments)
    ? obj.Segments
    : Array.isArray(obj.segments)
      ? obj.segments
      : null;
  if (!list) {
    return { ok: false, reason: "parse_rejected", segments: [] };
  }
  if (list.length > maxSeg) {
    return { ok: false, reason: "budget_exhausted", segments: [] };
  }

  const segments: SegmentAssessment[] = [];
  for (const item of list) {
    if (!item || typeof item !== "object") continue;
    const s = item as Record<string, unknown>;
    const id = String(s.Id ?? s.id ?? s.segmentId ?? "");
    if (!id) continue;

    const asrConfidence =
      typeof s.RecognitionConfidence === "number"
        ? s.RecognitionConfidence
        : typeof s.Confidence === "number"
          ? s.Confidence
          : null;

    const accuracy =
      typeof s.AccuracyScore === "number"
        ? s.AccuracyScore
        : typeof s.accuracy === "number"
          ? s.accuracy
          : null;
    const fluency =
      typeof s.FluencyScore === "number"
        ? s.FluencyScore
        : typeof s.fluency === "number"
          ? s.fluency
          : null;
    const completeness =
      typeof s.CompletenessScore === "number"
        ? s.CompletenessScore
        : typeof s.completeness === "number"
          ? s.completeness
          : null;

    const metrics = emptyMetrics();
    metrics.accuracy = accuracy;
    metrics.fluency = fluency;
    metrics.completeness = completeness;
    // Never use asrConfidence as accuracy fallback

    const phonemes = s.Phonemes ?? s.phonemes;
    const phonemeErrors: never[] = [];
    void phonemes;

    segments.push({
      segmentId: id,
      status:
        accuracy != null || fluency != null || completeness != null
          ? "ready"
          : "unavailable",
      reason:
        accuracy != null || fluency != null || completeness != null
          ? null
          : "parse_rejected",
      provider: {
        id: String(obj.providerId ?? "unverified"),
        modelVersion: String(obj.modelVersion ?? "unknown"),
        locale: "ja-JP",
      },
      metrics,
      asrConfidence,
      evidence: null,
      phonemeErrors,
      rubricVersion: RUBRIC_VERSION,
    });
  }

  return { ok: true, reason: null, segments };
}

export function notConfiguredAttemptReport(
  attemptId: string,
  segmentIds: string[],
  alignmentHints?: Array<{
    segmentId: string;
    status: string;
    startMs: number;
    endMs: number;
  }>,
): AttemptPronunciationReport {
  const byId = new Map(
    (alignmentHints ?? []).map((h) => [h.segmentId, h] as const),
  );
  const segments: SegmentAssessment[] = segmentIds.map((segmentId) => {
    const hint = byId.get(segmentId);
    let reason: AssessmentReason = "provider_not_wired";
    let status: AssessmentStatus = "unavailable";
    if (hint?.status === "data_gap") {
      reason = "data_gap";
      status = "not_assessable";
    } else if (
      hint?.status === "uncertain" ||
      hint?.status === "missing_speech"
    ) {
      reason = "low_alignment";
      status = "not_assessable";
    }
    return {
      segmentId,
      status,
      reason,
      provider: null,
      metrics: emptyMetrics(),
      asrConfidence: null,
      evidence: hint
        ? {
            startMs: hint.startMs,
            endMs: hint.endMs,
            notes: [`alignment:${hint.status}`],
          }
        : null,
      phonemeErrors: [],
      rubricVersion: RUBRIC_VERSION,
    };
  });

  return {
    engine: "kaiwa-pronunciation-v1-stub",
    attemptId,
    status: "unavailable",
    reason: "provider_not_wired",
    rubricVersion: RUBRIC_VERSION,
    locale: "ja-JP",
    liveProviderUsed: false,
    budget: {
      ...DEFAULT_BUDGET,
      usedSegments: segments.length,
    },
    segments,
    messageVi:
      "Chưa kết nối provider chấm phát âm ja-JP. Không gán điểm giả; ASR confidence không phải điểm phát âm. Vẫn nghe lại / xuất được.",
  };
}

/** Simulate adapter timeout — honest failed, no invented scores. */
export function timeoutAssessment(
  attemptId: string,
): AttemptPronunciationReport {
  return {
    engine: "kaiwa-pronunciation-v1-stub",
    attemptId,
    status: "failed",
    reason: "provider_timeout",
    rubricVersion: RUBRIC_VERSION,
    locale: "ja-JP",
    liveProviderUsed: false,
    budget: { ...DEFAULT_BUDGET, usedSegments: 0 },
    segments: [],
    messageVi:
      "Provider chấm phát âm quá hạn — giữ bản thu; thử lại sau. Không gán điểm 0.",
  };
}
