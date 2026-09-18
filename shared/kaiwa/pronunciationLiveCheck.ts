/**
 * KAI-026 live pronunciation field-verify helpers.
 * Never invents ja-JP scores. Credentials absent → missing_credentials.
 */

import { readFileSync, existsSync } from "node:fs";
import {
  parseProviderPronunciationPayload,
  type AssessmentReason,
} from "./assessment";
import { GATE_B_PILOT_THRESHOLDS } from "./gateBBenchmark";

export type PronunciationCredStatus =
  | "missing_credentials"
  | "credentials_present";

export type FieldInventory = {
  topLevelKeys: string[];
  hasProsodyScore: boolean;
  hasAccuracyScore: boolean;
  hasFluencyScore: boolean;
  hasCompletenessScore: boolean;
  hasRecognitionConfidence: boolean;
  segmentCount: number;
  phonemeArraysNonEmpty: number;
  parseOk: boolean;
  parseReason: AssessmentReason | null;
  /** Fields that may be exposed after live confirm — never ASR confidence. */
  allowListedScoreFields: string[];
  forbiddenIfUsedAsJaIntonation: string[];
};

export function detectPronunciationCredentials(
  env: NodeJS.ProcessEnv = process.env,
): {
  status: PronunciationCredStatus;
  keyPresent: boolean;
  regionPresent: boolean;
  region: string | null;
} {
  const keyPresent = Boolean(
    env.AZURE_SPEECH_KEY?.trim() || env.KAIWA_SPEECH_KEY?.trim(),
  );
  const region =
    env.AZURE_SPEECH_REGION?.trim() ||
    env.KAIWA_SPEECH_REGION?.trim() ||
    null;
  return {
    status: keyPresent ? "credentials_present" : "missing_credentials",
    keyPresent,
    regionPresent: Boolean(region),
    region,
  };
}

export function inventoryPronunciationPayload(raw: unknown): FieldInventory {
  const topLevelKeys =
    raw && typeof raw === "object" && !Array.isArray(raw)
      ? Object.keys(raw as object).sort()
      : [];
  const obj =
    raw && typeof raw === "object" && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : {};
  const list = Array.isArray(obj.Segments)
    ? obj.Segments
    : Array.isArray(obj.segments)
      ? obj.segments
      : [];

  let phonemeArraysNonEmpty = 0;
  let hasAccuracyScore = false;
  let hasFluencyScore = false;
  let hasCompletenessScore = false;
  let hasRecognitionConfidence = false;

  for (const item of list) {
    if (!item || typeof item !== "object") continue;
    const s = item as Record<string, unknown>;
    if (s.AccuracyScore != null || s.accuracy != null) hasAccuracyScore = true;
    if (s.FluencyScore != null || s.fluency != null) hasFluencyScore = true;
    if (s.CompletenessScore != null || s.completeness != null)
      hasCompletenessScore = true;
    if (s.RecognitionConfidence != null || s.Confidence != null)
      hasRecognitionConfidence = true;
    const ph = s.Phonemes ?? s.phonemes;
    if (Array.isArray(ph) && ph.length > 0) phonemeArraysNonEmpty += 1;
  }

  const parsed = parseProviderPronunciationPayload(raw, {
    locale: "ja-JP",
    budget: { maxSegments: GATE_B_PILOT_THRESHOLDS.plannedTakesMin },
  });

  const allowListedScoreFields: string[] = [];
  if (hasAccuracyScore) allowListedScoreFields.push("AccuracyScore");
  if (hasFluencyScore) allowListedScoreFields.push("FluencyScore");
  if (hasCompletenessScore) allowListedScoreFields.push("CompletenessScore");

  return {
    topLevelKeys,
    hasProsodyScore: obj.ProsodyScore != null,
    hasAccuracyScore,
    hasFluencyScore,
    hasCompletenessScore,
    hasRecognitionConfidence,
    segmentCount: list.length,
    phonemeArraysNonEmpty,
    parseOk: parsed.ok,
    parseReason: parsed.reason,
    allowListedScoreFields,
    forbiddenIfUsedAsJaIntonation: ["ProsodyScore"],
  };
}

export type LiveCheckResult = {
  status:
    | "missing_credentials"
    | "sample_verified"
    | "sample_rejected"
    | "credentials_present_awaiting_sample";
  credentials: ReturnType<typeof detectPronunciationCredentials>;
  inventory: FieldInventory | null;
  message: string;
  liveProviderCalled: false;
};

/**
 * Credential-honest check. Does not call cloud APIs (no fabricated live JSON).
 * Pass a redacted dump via samplePath after a manual/SDK capture.
 */
export function runPronunciationLiveCheck(opts?: {
  env?: NodeJS.ProcessEnv;
  samplePath?: string | null;
}): LiveCheckResult {
  const env = opts?.env ?? process.env;
  const credentials = detectPronunciationCredentials(env);
  const samplePath = opts?.samplePath?.trim() || null;

  if (samplePath) {
    if (!existsSync(samplePath)) {
      return {
        status: "sample_rejected",
        credentials,
        inventory: null,
        message: `Sample file not found: ${samplePath}`,
        liveProviderCalled: false,
      };
    }
    let raw: unknown;
    try {
      raw = JSON.parse(readFileSync(samplePath, "utf8"));
    } catch {
      return {
        status: "sample_rejected",
        credentials,
        inventory: null,
        message: "Sample JSON parse failed",
        liveProviderCalled: false,
      };
    }
    const inventory = inventoryPronunciationPayload(raw);
    if (!inventory.parseOk) {
      return {
        status: "sample_rejected",
        credentials,
        inventory,
        message: `Parser rejected sample: ${inventory.parseReason}`,
        liveProviderCalled: false,
      };
    }
    return {
      status: "sample_verified",
      credentials,
      inventory,
      message:
        "Sample parsed under ja-JP rules (ProsodyScore rejected; ASR confidence not mapped to accuracy).",
      liveProviderCalled: false,
    };
  }

  if (credentials.status === "missing_credentials") {
    return {
      status: "missing_credentials",
      credentials,
      inventory: null,
      message:
        "AZURE_SPEECH_KEY / KAIWA_SPEECH_KEY unset — no live call; no invented scores.",
      liveProviderCalled: false,
    };
  }

  return {
    status: "credentials_present_awaiting_sample",
    credentials,
    inventory: null,
    message:
      "Credentials present but live HTTP/SDK call is not wired in this harness. Capture a redacted JSON dump and re-run with --sample <path>.",
    liveProviderCalled: false,
  };
}
