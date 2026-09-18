import { test } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import {
  detectPronunciationCredentials,
  inventoryPronunciationPayload,
  runPronunciationLiveCheck,
} from "../../shared/kaiwa/pronunciationLiveCheck";

const liveDir = join(process.cwd(), "docs/kaiwa/evidence/kai-026/live");
const docSample = join(liveDir, "sample.documentation-shape.json");

test("KAI-026 live harness: missing credentials is honest", () => {
  const r = runPronunciationLiveCheck({
    env: { ...process.env, AZURE_SPEECH_KEY: "", KAIWA_SPEECH_KEY: "" },
  });
  assert.equal(r.status, "missing_credentials");
  assert.equal(r.liveProviderCalled, false);
});

test("KAI-026 live harness: documentation sample verifies under ja-JP rules", () => {
  assert.ok(existsSync(join(liveDir, "README.md")));
  assert.ok(existsSync(docSample));
  const r = runPronunciationLiveCheck({ samplePath: docSample });
  assert.equal(r.status, "sample_verified");
  assert.ok(r.inventory);
  assert.equal(r.inventory!.hasProsodyScore, false);
  assert.ok(r.inventory!.allowListedScoreFields.includes("AccuracyScore"));
  assert.equal(r.inventory!.phonemeArraysNonEmpty, 0);
});

test("KAI-026 inventory rejects ProsodyScore for ja-JP", () => {
  const inv = inventoryPronunciationPayload({
    ProsodyScore: 50,
    Segments: [{ Id: "1", AccuracyScore: 1 }],
  });
  assert.equal(inv.parseOk, false);
  assert.equal(inv.parseReason, "prosody_locale_unsupported");
});

test("KAI-026 credentials detect key without inventing live call", () => {
  const d = detectPronunciationCredentials({
    AZURE_SPEECH_KEY: "x",
    AZURE_SPEECH_REGION: "eastasia",
  });
  assert.equal(d.status, "credentials_present");
  const r = runPronunciationLiveCheck({
    env: { AZURE_SPEECH_KEY: "x", AZURE_SPEECH_REGION: "eastasia" },
  });
  assert.equal(r.status, "credentials_present_awaiting_sample");
  assert.equal(r.liveProviderCalled, false);
});

test("KAI-026 npm script exits 0 without credentials", () => {
  const r = spawnSync(
    "npm",
    ["run", "kaiwa:pronunciation-live-check"],
    {
      encoding: "utf8",
      shell: true,
      env: {
        ...process.env,
        AZURE_SPEECH_KEY: "",
        KAIWA_SPEECH_KEY: "",
      },
    },
  );
  assert.equal(r.status, 0, r.stderr || r.stdout);
  assert.match(r.stdout || "", /missing_credentials/);
});
