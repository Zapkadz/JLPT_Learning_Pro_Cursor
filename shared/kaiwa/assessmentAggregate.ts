/**
 * Attempt assessment aggregate (KAI-028).
 * Combines quality / alignment / pronunciation / prosody without inventing scores.
 * Idempotent by rubric+engine fingerprint; never overwrites a different version.
 */

import type { AudioQualityReport } from "./audioQuality";
import type { AlignmentReport } from "./alignment";
import type { AttemptPronunciationReport } from "./assessment";
import type { ProsodyReport } from "./prosody";
import { RUBRIC_VERSION } from "./assessment";

export const ASSESSMENT_ENGINE = "kaiwa-assessment-v1";

export type AggregateLayerStatus =
  | "ready"
  | "unavailable"
  | "not_assessable"
  | "missing"
  | "failed";

export type SegmentAggregate = {
  segmentId: string;
  status: AggregateLayerStatus;
  reason: string | null;
  pronunciation: {
    status: AggregateLayerStatus;
    accuracy: number | null;
    fluency: number | null;
    completeness: number | null;
  };
  prosody: {
    status: AggregateLayerStatus;
    direction: string | null;
    stretchRatio: number | null;
    pitchAccentLabel: null;
  };
  listen: {
    startMs: number | null;
    endMs: number | null;
  };
};

export type AttemptAssessment = {
  engine: typeof ASSESSMENT_ENGINE;
  rubricVersion: string;
  fingerprint: string;
  attemptId: string;
  status: AggregateLayerStatus;
  layers: {
    quality: AggregateLayerStatus;
    alignment: AggregateLayerStatus;
    pronunciation: AggregateLayerStatus;
    prosody: AggregateLayerStatus;
  };
  coverage: {
    plannedSegments: number;
    assessableSegments: number;
    assessableRatio: number | null;
    plannedMs: number;
    alignedMs: number;
    missingSpeechMs: number;
    dataGapMs: number;
  };
  /** Explicit: no single 0–100 until rubric calibrated (KAI-023). */
  overallScore: null;
  segments: SegmentAggregate[];
  priorities: Array<{
    segmentId: string | null;
    kind: string;
    messageVi: string;
  }>;
  messageVi: string;
  charged: false;
};

export type AggregateInputs = {
  attemptId: string;
  quality: AudioQualityReport | null;
  alignment: AlignmentReport | null;
  pronunciation: AttemptPronunciationReport | null;
  prosody: ProsodyReport | null;
  segmentIds: string[];
  rubricVersion?: string;
};

function layerFromQuality(
  q: AudioQualityReport | null,
): AggregateLayerStatus {
  if (!q) return "missing";
  if (q.verdict === "assessable") return "ready";
  if (q.verdict === "unavailable") return "unavailable";
  return "not_assessable";
}

function layerAlign(a: AlignmentReport | null): AggregateLayerStatus {
  if (!a) return "missing";
  if (a.segments.some((s) => s.status === "aligned")) return "ready";
  return "not_assessable";
}

function layerPron(
  p: AttemptPronunciationReport | null,
): AggregateLayerStatus {
  if (!p) return "missing";
  if (p.status === "ready") return "ready";
  if (p.status === "failed") return "failed";
  if (p.status === "not_assessable") return "not_assessable";
  return "unavailable";
}

function layerProsody(p: ProsodyReport | null): AggregateLayerStatus {
  if (!p) return "missing";
  if (p.status === "ready") return "ready";
  if (p.status === "not_assessable") return "not_assessable";
  return "unavailable";
}

export function assessmentFingerprint(
  rubricVersion: string,
  inputs: {
    quality?: unknown;
    alignment?: unknown;
    pronunciation?: unknown;
    prosody?: unknown;
  },
): string {
  // Stable content hash without crypto dependency in shared — simple FNV-ish
  const raw = JSON.stringify({
    rubricVersion,
    engine: ASSESSMENT_ENGINE,
    q: inputs.quality ?? null,
    a: inputs.alignment ?? null,
    p: inputs.pronunciation ?? null,
    o: inputs.prosody ?? null,
  });
  let h = 2166136261;
  for (let i = 0; i < raw.length; i++) {
    h ^= raw.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `v1-${(h >>> 0).toString(16)}`;
}

export function aggregateAttemptAssessment(
  inputs: AggregateInputs,
): AttemptAssessment {
  const rubricVersion = inputs.rubricVersion ?? RUBRIC_VERSION;
  const fingerprint = assessmentFingerprint(rubricVersion, {
    quality: inputs.quality,
    alignment: inputs.alignment,
    pronunciation: inputs.pronunciation,
    prosody: inputs.prosody,
  });

  const layers = {
    quality: layerFromQuality(inputs.quality),
    alignment: layerAlign(inputs.alignment),
    pronunciation: layerPron(inputs.pronunciation),
    prosody: layerProsody(inputs.prosody),
  };

  const alignById = new Map(
    (inputs.alignment?.segments ?? []).map((s) => [s.segmentId, s] as const),
  );
  const pronById = new Map(
    (inputs.pronunciation?.segments ?? []).map(
      (s) => [s.segmentId, s] as const,
    ),
  );
  const prosById = new Map(
    (inputs.prosody?.segments ?? [])
      .filter((s) => s.segmentId)
      .map((s) => [s.segmentId as string, s] as const),
  );

  const ids =
    inputs.segmentIds.length > 0
      ? inputs.segmentIds
      : [
          ...new Set([
            ...alignById.keys(),
            ...pronById.keys(),
            ...prosById.keys(),
          ]),
        ];

  const segments: SegmentAggregate[] = ids.map((segmentId) => {
    const al = alignById.get(segmentId);
    const pr = pronById.get(segmentId);
    const po = prosById.get(segmentId);

    let status: AggregateLayerStatus = "unavailable";
    let reason: string | null = "layers_incomplete";

    if (al?.status === "data_gap") {
      status = "not_assessable";
      reason = "data_gap";
    } else if (
      al?.status === "uncertain" ||
      al?.status === "missing_speech"
    ) {
      status = "not_assessable";
      reason = al.status;
    } else if (layers.quality === "not_assessable") {
      status = "not_assessable";
      reason = "quality_gate";
    } else if (pr?.status === "ready" || po?.status === "ready") {
      status = "ready";
      reason = null;
    } else if (pr?.status === "unavailable" || layers.pronunciation === "unavailable") {
      status = "unavailable";
      reason = pr?.reason ?? "provider_not_wired";
    } else if (al?.status === "aligned") {
      status = "unavailable";
      reason = "awaiting_scoring_provider";
    }

    return {
      segmentId,
      status,
      reason,
      pronunciation: {
        status: pr
          ? pr.status === "ready"
            ? "ready"
            : pr.status === "not_assessable"
              ? "not_assessable"
              : pr.status === "failed"
                ? "failed"
                : "unavailable"
          : "missing",
        accuracy: pr?.metrics.accuracy ?? null,
        fluency: pr?.metrics.fluency ?? null,
        completeness: pr?.metrics.completeness ?? null,
      },
      prosody: {
        status: po
          ? po.status === "ready"
            ? "ready"
            : po.status === "not_assessable"
              ? "not_assessable"
              : "unavailable"
          : "missing",
        direction: po?.f0.direction ?? null,
        stretchRatio: po?.timing.stretchRatio ?? null,
        pitchAccentLabel: null,
      },
      listen: {
        startMs: al?.listen.learnerStartMs ?? null,
        endMs: al?.listen.learnerEndMs ?? null,
      },
    };
  });

  const assessableSegments = segments.filter(
    (s) => s.status === "ready",
  ).length;
  const plannedSegments = segments.length;
  const coverage = {
    plannedSegments,
    assessableSegments,
    assessableRatio:
      plannedSegments > 0 ? assessableSegments / plannedSegments : null,
    plannedMs: inputs.alignment?.coverage.plannedMs ?? 0,
    alignedMs: inputs.alignment?.coverage.alignedMs ?? 0,
    missingSpeechMs: inputs.alignment?.coverage.missingSpeechMs ?? 0,
    dataGapMs: inputs.alignment?.coverage.dataGapMs ?? 0,
  };

  const priorities: AttemptAssessment["priorities"] = [];
  if (layers.quality === "not_assessable" || layers.quality === "unavailable") {
    priorities.push({
      segmentId: null,
      kind: "quality",
      messageVi:
        inputs.quality?.messageVi ??
        "Chất lượng bản thu chưa đủ — hãy thu lại trước khi chấm.",
    });
  }
  for (const s of segments) {
    if (priorities.length >= 3) break;
    if (s.status === "not_assessable" && s.reason === "data_gap") {
      priorities.push({
        segmentId: s.segmentId,
        kind: "data_gap",
        messageVi: `Đoạn ${s.segmentId}: thiếu dữ liệu thu (không phải bỏ câu).`,
      });
    } else if (s.pronunciation.status === "unavailable") {
      priorities.push({
        segmentId: s.segmentId,
        kind: "pronunciation",
        messageVi: `Đoạn ${s.segmentId}: chưa có provider chấm phát âm — không gán điểm giả.`,
      });
    }
  }

  const anyReady = segments.some((s) => s.status === "ready");
  const status: AggregateLayerStatus = anyReady
    ? "ready"
    : layers.quality === "not_assessable"
      ? "not_assessable"
      : "unavailable";

  return {
    engine: ASSESSMENT_ENGINE,
    rubricVersion,
    fingerprint,
    attemptId: inputs.attemptId,
    status,
    layers,
    coverage,
    overallScore: null,
    segments,
    priorities: priorities.slice(0, 3),
    messageVi: anyReady
      ? "Tổng hợp tạm thời theo lớp có sẵn — chưa có điểm tổng 100 (chờ KAI-023)."
      : "Chưa đủ lớp chấm để công bố phản hồi phát âm; nghe/xuất vẫn dùng được.",
    charged: false,
  };
}

/** Decide whether a stored assessment can be reused (idempotent, no re-charge). */
export function canReuseAssessment(
  stored: AttemptAssessment | null,
  nextFingerprint: string,
  nextRubricVersion: string,
): boolean {
  if (!stored) return false;
  if (stored.rubricVersion !== nextRubricVersion) return false;
  if (stored.engine !== ASSESSMENT_ENGINE) return false;
  return stored.fingerprint === nextFingerprint;
}
