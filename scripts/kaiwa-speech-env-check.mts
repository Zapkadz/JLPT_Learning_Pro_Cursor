/**
 * KAI-064/070 — print local ffmpeg + align/ASR readiness for Kaiwa.
 */
import {
  resolveFfmpegPath,
  resolveScriptAlignEnginePref,
  resolveSpeechCapability,
} from "../server/modules/kaiwa/speechCapability.ts";

const ffmpeg = resolveFfmpegPath();
const enginePref = resolveScriptAlignEnginePref();
const cap = resolveSpeechCapability();

console.log("Kaiwa speech env check (KAI-064/070)");
console.log("ffmpeg:", ffmpeg ?? "(not found)");
console.log("alignEnginePref:", enginePref);
console.log("scriptAlign:", cap.scriptAlign.status, "|", cap.scriptAlign.engine ?? "-");
console.log("  ", cap.scriptAlign.messageVi);
console.log("transcription:", cap.transcription.status);
console.log("  ", cap.transcription.messageVi);
console.log("pronunciation:", cap.pronunciation.status, "(expected not_configured at Gate A)");

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
- Restart terminal / npm run dev after setting User env
`);
  process.exit(2);
}

console.log(`
OK — Đồng bộ script (v1) và ASR (v2) capability = ready trên máy này.
Engine align: ${cap.scriptAlign.engine}
`);
