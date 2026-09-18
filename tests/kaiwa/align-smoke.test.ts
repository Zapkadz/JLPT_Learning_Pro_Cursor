import { test } from "node:test";
import assert from "node:assert/strict";
import {
  clearSpeechCapabilityCaches,
  resolveScriptAlignCapability,
  shouldRunAlignSmoke,
} from "../../server/modules/kaiwa/speechCapability";

test("KAI-075 smoke gate: skip under test; mock ready; force smoke flag", () => {
  clearSpeechCapabilityCaches();
  assert.equal(
    shouldRunAlignSmoke({
      KAIWA_ALIGN_SMOKE: "",
      npm_lifecycle_event: "test",
    }),
    false,
  );
  assert.equal(shouldRunAlignSmoke({ KAIWA_ALIGN_SMOKE: "1" }), true);
  assert.equal(shouldRunAlignSmoke({ KAIWA_ALIGN_SMOKE: "skip" }), false);

  const off = resolveScriptAlignCapability({
    FFMPEG_PATH: "",
    KAIWA_FFMPEG_PATH: "",
    LOCALAPPDATA: "C:\\nonexistent",
    KAIWA_SCRIPT_ALIGN_ENGINE: "stable_ts",
    KAIWA_ALIGN_SMOKE: "skip",
  });
  assert.equal(off.status, "not_configured");

  const mock = resolveScriptAlignCapability({
    KAIWA_SCRIPT_ALIGN_ENGINE: "mock",
    KAIWA_ALIGN_SMOKE: "skip",
  });
  assert.equal(mock.status, "ready");
  assert.equal(mock.smoke, "mock");
});
