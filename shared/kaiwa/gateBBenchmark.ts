/**
 * Gate B benchmark contracts (KAI-023).
 * Locks pilot thresholds and manifest shape before held-out evaluation.
 * Does not invent scores or commit private audio.
 */

import { z } from "zod";

/** Same id as assessment.ts until teacher adjudication bumps it. */
export const GATE_B_RUBRIC_ID = "kaiwa-ja-rubric-draft-001";

export const gateBSplitSchema = z.enum([
  "train",
  "calibration",
  "held_out",
]);
export type GateBSplit = z.infer<typeof gateBSplitSchema>;

export const gateBLicenseSchema = z.enum([
  "own_recording",
  "cc_by",
  "cc_by_sa",
  "cc0",
  "licensed_explicit",
  "synthetic_tts",
  "pending_rights",
]);
export type GateBLicense = z.infer<typeof gateBLicenseSchema>;

/** Labels raters may assign — no pitch-accent word claims without lexicon. */
export const gateBLabelKindSchema = z.enum([
  "acceptable",
  "error_chouon",
  "error_sokuon",
  "error_rhythm",
  "error_intonation_relative",
  "error_coverage_skip",
  "not_assessable_audio",
  "disagreement_pending",
]);
export type GateBLabelKind = z.infer<typeof gateBLabelKindSchema>;

export const gateBUtteranceSchema = z.object({
  utteranceId: z.string().min(1).max(80),
  speakerId: z.string().min(1).max(80),
  split: gateBSplitSchema,
  license: gateBLicenseSchema,
  licenseNote: z.string().max(500).optional(),
  referenceJa: z.string().min(1).max(500),
  /** Absolute path outside git, or relative under evidence only if inGit. */
  audioPath: z.string().min(1).optional(),
  inGit: z.boolean(),
  intendedContrast: z
    .enum([
      "chouon",
      "sokuon",
      "rhythm",
      "question_vs_statement",
      "clean_ok",
      "noise",
      "silence",
      "acted_emotion",
      "other",
    ])
    .optional(),
  notes: z.string().max(1000).optional(),
});
export type GateBUtterance = z.infer<typeof gateBUtteranceSchema>;

export const gateBRaterLabelSchema = z.object({
  utteranceId: z.string().min(1),
  raterId: z.string().min(1).max(40),
  labels: z.array(gateBLabelKindSchema).min(1),
  noteVi: z.string().max(1000).optional(),
  ratedAt: z.string().datetime().optional(),
});
export type GateBRaterLabel = z.infer<typeof gateBRaterLabelSchema>;

export const gateBAdjudicationSchema = z.object({
  utteranceId: z.string().min(1),
  finalLabels: z.array(gateBLabelKindSchema).min(1),
  method: z.enum(["consensus", "third_rater", "lead_override"]),
  note: z.string().max(1000).optional(),
});
export type GateBAdjudication = z.infer<typeof gateBAdjudicationSchema>;

/**
 * Pilot thresholds from PLAN §10.3 — locked before peeking held-out scores.
 * Changing these after held-out evaluation requires a new ADR + re-run.
 */
export const GATE_B_PILOT_THRESHOLDS = {
  rubricId: GATE_B_RUBRIC_ID,
  lockedAt: "2026-09-18",
  source: "docs/kaiwa/PLAN.md §10.3",
  /** Confirmed-correct concrete error flags among flags shown to learners. */
  minConfirmedCorrectFlagRate: 0.9,
  /** False flags on rater-"acceptable" speech. */
  maxFalseFlagRateOnAcceptable: 0.05,
  /**
   * Minimum fraction of clean speech segments that must receive some
   * assessable status (not silent drop). Locked before final eval.
   */
  minCleanCoverage: 0.85,
  /** Soft cost cap for pilot provider calls (USD); stop and report). */
  maxPilotProviderUsd: 25,
  /** Soft latency target for one segment assess (ms wall); report only. */
  targetSegmentAssessP95Ms: 8000,
  plannedUtterances: 30,
  plannedTakesMin: 150,
  minRaters: 2,
} as const;

export const gateBCorpusManifestSchema = z.object({
  schemaVersion: z.literal(1),
  rubricId: z.string().min(1),
  thresholdsLockedAt: z.string().min(1),
  utterances: z.array(gateBUtteranceSchema),
});
export type GateBCorpusManifest = z.infer<typeof gateBCorpusManifestSchema>;

export type SplitSpeakerReport = {
  ok: boolean;
  violations: string[];
  speakersBySplit: Record<GateBSplit, string[]>;
};

/** Each speaker appears in at most one split (train / calibration / held_out). */
export function checkSpeakerDisjointSplits(
  utterances: GateBUtterance[],
): SplitSpeakerReport {
  const speakersBySplit: Record<GateBSplit, Set<string>> = {
    train: new Set(),
    calibration: new Set(),
    held_out: new Set(),
  };
  const splitOf = new Map<string, GateBSplit>();
  const violations: string[] = [];
  for (const u of utterances) {
    speakersBySplit[u.split].add(u.speakerId);
    const prev = splitOf.get(u.speakerId);
    if (prev && prev !== u.split) {
      violations.push(
        `speaker ${u.speakerId} in both ${prev} and ${u.split}`,
      );
    } else {
      splitOf.set(u.speakerId, u.split);
    }
  }
  return {
    ok: violations.length === 0,
    violations: [...new Set(violations)],
    speakersBySplit: {
      train: [...speakersBySplit.train].sort(),
      calibration: [...speakersBySplit.calibration].sort(),
      held_out: [...speakersBySplit.held_out].sort(),
    },
  };
}

export function parseGateBCorpusManifest(raw: unknown): GateBCorpusManifest {
  return gateBCorpusManifestSchema.parse(raw);
}

export type FlagEvalCounts = {
  flagsShown: number;
  flagsConfirmedCorrect: number;
  acceptableTakes: number;
  falseFlagsOnAcceptable: number;
};

export type FlagEvalRates = {
  confirmedCorrectRate: number | null;
  falseFlagRateOnAcceptable: number | null;
  meetsPilotThresholds: boolean;
  reasons: string[];
};

/** Compute rates from adjudicated counts — never invents labels. */
export function evaluateFlagRates(c: FlagEvalCounts): FlagEvalRates {
  const reasons: string[] = [];
  const confirmedCorrectRate =
    c.flagsShown > 0 ? c.flagsConfirmedCorrect / c.flagsShown : null;
  const falseFlagRateOnAcceptable =
    c.acceptableTakes > 0
      ? c.falseFlagsOnAcceptable / c.acceptableTakes
      : null;

  if (confirmedCorrectRate === null) {
    reasons.push("no_flags_shown");
  } else if (
    confirmedCorrectRate < GATE_B_PILOT_THRESHOLDS.minConfirmedCorrectFlagRate
  ) {
    reasons.push("confirmed_correct_below_threshold");
  }

  if (falseFlagRateOnAcceptable === null) {
    reasons.push("no_acceptable_takes");
  } else if (
    falseFlagRateOnAcceptable >
    GATE_B_PILOT_THRESHOLDS.maxFalseFlagRateOnAcceptable
  ) {
    reasons.push("false_flag_above_threshold");
  }

  const meetsPilotThresholds =
    confirmedCorrectRate !== null &&
    falseFlagRateOnAcceptable !== null &&
    confirmedCorrectRate >=
      GATE_B_PILOT_THRESHOLDS.minConfirmedCorrectFlagRate &&
    falseFlagRateOnAcceptable <=
      GATE_B_PILOT_THRESHOLDS.maxFalseFlagRateOnAcceptable;

  return {
    confirmedCorrectRate,
    falseFlagRateOnAcceptable,
    meetsPilotThresholds,
    reasons,
  };
}
