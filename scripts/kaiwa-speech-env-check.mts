/**
 * KAI-064 — print local ffmpeg + Whisper readiness for Kaiwa sync/ASR.
 * Does not claim Gate A device PASS.
 */
import { resolveFfmpegPath, resolveSpeechCapability } from "../server/modules/kaiwa/speechCapability.ts";

const ffmpeg = resolveFfmpegPath();
const cap = resolveSpeechCapability();

console.log("Kaiwa speech env check (KAI-064)");
console.log("ffmpeg:", ffmpeg ?? "(not found)");
console.log("scriptAlign:", cap.scriptAlign.status, "|", cap.scriptAlign.engine ?? "-");
console.log("  ", cap.scriptAlign.messageVi);
console.log("transcription:", cap.transcription.status);
console.log("  ", cap.transcription.messageVi);
console.log("pronunciation:", cap.pronunciation.status, "(expected not_configured at Gate A)");

const ok =
  cap.scriptAlign.status === "ready" && cap.transcription.status === "ready";

if (!ok) {
  console.log(`
Not ready for auto sync/ASR. Manual SRT/VTT / soạn tay vẫn dùng được cho Gate A.
Tips:
- Install ffmpeg (WinGet Gyan.FFmpeg) or set FFMPEG_PATH
- pip install faster-whisper
- Restart terminal / npm run dev after setting User env
`);
  process.exit(2);
}

console.log(`
OK — Đồng bộ script (v1) và ASR (v2) capability = ready trên máy này.
Restart npm run dev nếu process cũ chưa thấy FFMPEG_PATH.
Gate A device checklist (KAI-046) vẫn cần bạn chạy Chrome/Edge.
`);
