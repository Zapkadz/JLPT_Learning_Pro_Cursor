import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import {
  GATE_B_PILOT_THRESHOLDS,
  GATE_B_RUBRIC_ID,
  checkSpeakerDisjointSplits,
  evaluateFlagRates,
  parseGateBCorpusManifest,
} from "../../shared/kaiwa/gateBBenchmark";
import { RUBRIC_VERSION } from "../../shared/kaiwa/assessment";

const evidence = join(process.cwd(), "docs/kaiwa/evidence/kai-023");

test("KAI-023 evidence pack and rubric id align with assessment", () => {
  for (const f of [
    "REPORT.md",
    "THRESHOLDS.json",
    "RUBRIC.md",
    "RATER-PROTOCOL.md",
    "BUDGET-AND-PROVIDER.md",
    "corpus.plan.json",
    "utterances.example.json",
  ]) {
    assert.ok(existsSync(join(evidence, f)), f);
  }
  assert.equal(GATE_B_RUBRIC_ID, RUBRIC_VERSION);
  assert.equal(GATE_B_PILOT_THRESHOLDS.minConfirmedCorrectFlagRate, 0.9);
  assert.equal(GATE_B_PILOT_THRESHOLDS.maxFalseFlagRateOnAcceptable, 0.05);
});

test("KAI-023 THRESHOLDS.json matches locked pilot constants", () => {
  const t = JSON.parse(
    readFileSync(join(evidence, "THRESHOLDS.json"), "utf8"),
  );
  assert.equal(t.rubricId, GATE_B_RUBRIC_ID);
  assert.equal(
    t.minConfirmedCorrectFlagRate,
    GATE_B_PILOT_THRESHOLDS.minConfirmedCorrectFlagRate,
  );
  assert.equal(
    t.maxFalseFlagRateOnAcceptable,
    GATE_B_PILOT_THRESHOLDS.maxFalseFlagRateOnAcceptable,
  );
  assert.equal(t.minCleanCoverage, GATE_B_PILOT_THRESHOLDS.minCleanCoverage);
  assert.equal(
    t.maxPilotProviderUsd,
    GATE_B_PILOT_THRESHOLDS.maxPilotProviderUsd,
  );
});

test("KAI-023 example manifest parses and speakers are split-disjoint", () => {
  const raw = JSON.parse(
    readFileSync(join(evidence, "utterances.example.json"), "utf8"),
  );
  const manifest = parseGateBCorpusManifest(raw);
  assert.equal(manifest.utterances.length, 3);
  const report = checkSpeakerDisjointSplits(manifest.utterances);
  assert.equal(report.ok, true, report.violations.join("; "));
  assert.deepEqual(report.speakersBySplit.held_out, ["spk-vn-03"]);
});

test("KAI-023 rejects speaker leaking into held_out", () => {
  const report = checkSpeakerDisjointSplits([
    {
      utteranceId: "a",
      speakerId: "same",
      split: "calibration",
      license: "own_recording",
      referenceJa: "あ",
      inGit: false,
    },
    {
      utteranceId: "b",
      speakerId: "same",
      split: "held_out",
      license: "own_recording",
      referenceJa: "い",
      inGit: false,
    },
  ]);
  assert.equal(report.ok, false);
  assert.ok(report.violations.some((v) => v.includes("same")));
});

test("KAI-023 flag-rate eval meets and fails pilot thresholds honestly", () => {
  const pass = evaluateFlagRates({
    flagsShown: 100,
    flagsConfirmedCorrect: 92,
    acceptableTakes: 100,
    falseFlagsOnAcceptable: 3,
  });
  assert.equal(pass.meetsPilotThresholds, true);
  assert.equal(pass.confirmedCorrectRate, 0.92);
  assert.equal(pass.falseFlagRateOnAcceptable, 0.03);

  const fail = evaluateFlagRates({
    flagsShown: 100,
    flagsConfirmedCorrect: 80,
    acceptableTakes: 100,
    falseFlagsOnAcceptable: 10,
  });
  assert.equal(fail.meetsPilotThresholds, false);
  assert.ok(fail.reasons.includes("confirmed_correct_below_threshold"));
  assert.ok(fail.reasons.includes("false_flag_above_threshold"));

  const empty = evaluateFlagRates({
    flagsShown: 0,
    flagsConfirmedCorrect: 0,
    acceptableTakes: 0,
    falseFlagsOnAcceptable: 0,
  });
  assert.equal(empty.meetsPilotThresholds, false);
  assert.equal(empty.confirmedCorrectRate, null);
});

test("KAI-023 corpus plan has 30 utterance slots", () => {
  const plan = JSON.parse(
    readFileSync(join(evidence, "corpus.plan.json"), "utf8"),
  );
  assert.equal(plan.slots.length, 30);
  assert.equal(plan.targetTakesMin, 150);
});
