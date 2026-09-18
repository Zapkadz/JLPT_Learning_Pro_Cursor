/**
 * KAI-064/070/075 — print local ffmpeg + align/ASR readiness for Kaiwa.
 * Forces align smoke (KAIWA_ALIGN_SMOKE=1) so capability `ready` matches evidence.
 */
process.env.KAIWA_ALIGN_SMOKE = process.env.KAIWA_ALIGN_SMOKE || "1";
process.env.KAIWA_UNDER_TEST = "0";

import {
  clearSpeechCapabilityCaches,
  resolveFfmpegPath,
  resolveScriptAlignEnginePref,
  resolveSpeechCapability,
  runAlignEngineSmoke,
} from "../server/modules/kaiwa/speechCapability.ts";

clearSpeechCapabilityCaches();

const ffmpeg = resolveFfmpegPath();
const enginePref = resolveScriptAlignEnginePref();
const smoke =
  enginePref === "mock"
    ? { ok: true, detail: "mock" }
    : runAlignEngineSmoke(process.env, enginePref);
const cap = resolveSpeechCapability();

console.log("Kaiwa speech env check (KAI-064/070/075)");
console.log("ffmpeg:", ffmpeg ?? "(not found)");
console.log("alignEnginePref:", enginePref);
console.log(
  "alignSmoke:",
  smoke.ok ? "passed" : smoke.skipped ? "skipped" : "failed",
  "|",
  smoke.detail,
);
console.log(
  "scriptAlign:",
  cap.scriptAlign.status,
  "|",
  cap.scriptAlign.engine ?? "-",
  "| smoke=",
  cap.scriptAlign.smoke ?? "-",
);
console.log("  ", cap.scriptAlign.messageVi);
console.log("transcription:", cap.transcription.status);
console.log("  ", cap.transcription.messageVi);
console.log(
  "pronunciation:",
  cap.pronunciation.status,
  "(expected not_configured at Gate A)",
);

const ok =
  cap.scriptAlign.status === "ready" && cap.transcription.status === "ready";

if (!ok) {
  console.log(`
Not ready for auto sync/ASR. Manual SRT/VTT / soạn tay vẫn dùng được.
Tips:
- Install ffmpeg (WinGet Gyan.FFmpeg) or set FFMPEG_PATH
- Default align: pip install stable-ts  (KAIWA_SCRIPT_ALIGN_ENGINE=stable_ts)
- Optional: pip install qwen-asr  (KAIWA_SCRIPT_ALIGN_ENGINE=qwen_fa)
- Legacy: pip install faster-whisper  (KAIWA_SCRIPT_ALIGN_ENGINE=whisper)
- ASR v2 still needs faster-whisper
- KAI-075: ready requires smoke inference (this script sets KAIWA_ALIGN_SMOKE=1)
- CPU: Whisper/stable-ts base model is fine on ~16GB RAM; first run downloads weights
- Restart terminal / npm run dev after setting User env
`);
  process.exit(2);
}

console.log(`
OK — Đồng bộ script (v1) và ASR (v2) capability = ready trên máy này.
Engine align: ${cap.scriptAlign.engine}
Smoke: ${cap.scriptAlign.smoke}
`);
