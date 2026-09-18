/**
 * KAI-026 — pronunciation live field-verify harness (credential-honest).
 * Usage:
 *   npm run kaiwa:pronunciation-live-check
 *   npm run kaiwa:pronunciation-live-check -- --sample path/to/redacted.json
 */
import {
  runPronunciationLiveCheck,
} from "../shared/kaiwa/pronunciationLiveCheck.ts";

const args = process.argv.slice(2);
let samplePath: string | null = null;
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--sample" && args[i + 1]) {
    samplePath = args[++i];
  }
}

const result = runPronunciationLiveCheck({ samplePath });

console.log("Kaiwa pronunciation live check (KAI-026)");
console.log("status:", result.status);
console.log(
  "credentials:",
  result.credentials.status,
  "| key=",
  result.credentials.keyPresent,
  "| region=",
  result.credentials.region ?? "(none)",
);
console.log("liveProviderCalled:", result.liveProviderCalled);
console.log(result.message);
if (result.inventory) {
  console.log("inventory:", JSON.stringify(result.inventory, null, 2));
}

if (result.status === "missing_credentials") {
  console.log(`
Next:
- Set AZURE_SPEECH_KEY + AZURE_SPEECH_REGION (never commit).
- Or drop a redacted live dump at docs/kaiwa/evidence/kai-003/live/ and:
  npm run kaiwa:pronunciation-live-check -- --sample <path>
- See docs/kaiwa/evidence/kai-026/live/README.md
`);
  process.exit(0);
}

if (result.status === "sample_rejected") {
  process.exit(2);
}

process.exit(0);
