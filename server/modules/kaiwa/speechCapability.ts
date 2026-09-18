/**
 * KAI-015/053 speech + script-align capability surface.
 * Without ffmpeg (and whisper unless mock): scriptAlign stays not_configured.
 */

import { existsSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

export type SpeechCapabilityStatus =
  | "not_configured"
  | "ready"
  | "degraded"
  | "unavailable";

export type SpeechCapability = {
  transcription: {
    status: SpeechCapabilityStatus;
    providers: string[];
    messageVi: string;
  };
  translation: {
    status: SpeechCapabilityStatus;
    providers: string[];
    messageVi: string;
  };
  pronunciation: {
    status: SpeechCapabilityStatus;
    providers: string[];
    messageVi: string;
    /** ProsodyScore must not be used for ja-JP (en-US only per Azure docs). */
    prosodySupportedForJaJp: false;
  };
  scriptAlign: {
    status: SpeechCapabilityStatus;
    providers: string[];
    messageVi: string;
    engine: string | null;
  };
  credentialsPresent: boolean;
  liveTestsAllowed: boolean;
};

export function resolveFfmpegPath(
  env: NodeJS.ProcessEnv = process.env,
): string | null {
  const fromEnv = env.FFMPEG_PATH?.trim() || env.KAIWA_FFMPEG_PATH?.trim();
  if (fromEnv && existsSync(fromEnv)) return fromEnv;
  const winget = join(
    env.LOCALAPPDATA || "",
    "Microsoft",
    "WinGet",
    "Links",
    "ffmpeg.exe",
  );
  if (winget && existsSync(winget)) return winget;
  return null;
}

let whisperImportCache: boolean | null = null;

function canImportFasterWhisper(env: NodeJS.ProcessEnv): boolean {
  if (whisperImportCache != null) return whisperImportCache;
  const python =
    env.KAIWA_PYTHON?.trim() || env.PYTHON?.trim() || "python";
  const r = spawnSync(
    python,
    ["-c", "from faster_whisper import WhisperModel"],
    { encoding: "utf8", timeout: 30_000 },
  );
  whisperImportCache = r.status === 0;
  return whisperImportCache;
}

export function resolveScriptAlignCapability(
  env: NodeJS.ProcessEnv = process.env,
): {
  status: SpeechCapabilityStatus;
  providers: string[];
  messageVi: string;
  engine: string | null;
} {
  const ffmpeg = resolveFfmpegPath(env);
  const enginePref = env.KAIWA_SCRIPT_ALIGN_ENGINE?.trim() || "whisper";

  if (enginePref === "mock") {
    return {
      status: "ready",
      providers: ["mock"],
      engine: "mock_equal_slots",
      messageVi:
        "Đồng bộ script (mock) sẵn sàng — chỉ dùng cho kiểm thử; mốc thời gian tạm.",
    };
  }

  if (!ffmpeg) {
    return {
      status: "not_configured",
      providers: [],
      engine: null,
      messageVi:
        "Chưa cấu hình tự động (thiếu ffmpeg). Hãy nhập SRT/VTT hoặc soạn tay.",
    };
  }

  if (!canImportFasterWhisper(env)) {
    return {
      status: "not_configured",
      providers: [],
      engine: null,
      messageVi:
        "Chưa cấu hình Whisper (faster-whisper). Hãy nhập SRT/VTT hoặc soạn tay.",
    };
  }

  return {
    status: "ready",
    providers: ["faster-whisper"],
    engine: `faster-whisper:${env.KAIWA_WHISPER_MODEL?.trim() || "tiny"}`,
    messageVi:
      "Có thể đồng bộ lời thoại với video (Whisper). Kết quả là bản nháp — hãy kiểm tra mốc thời gian.",
  };
}

export function resolveSpeechCapability(
  env: NodeJS.ProcessEnv = process.env,
): SpeechCapability {
  const hasAsr =
    Boolean(env.KAIWA_ASR_API_KEY?.trim()) ||
    Boolean(env.AZURE_SPEECH_KEY?.trim());
  const hasTranslate =
    Boolean(env.KAIWA_TRANSLATE_API_KEY?.trim()) ||
    Boolean(env.AZURE_TRANSLATOR_KEY?.trim());

  // Live ASR/translate adapters not wired — even with keys, report not_configured
  // until a verified provider adapter lands (Gate B / later KAI-015/056).
  void hasAsr;
  void hasTranslate;

  const scriptAlign = resolveScriptAlignCapability(env);

  return {
    transcription: {
      status: "not_configured",
      providers: [],
      messageVi:
        "Chưa cấu hình ASR. Hãy nhập phụ đề thủ công (SRT/VTT hoặc soạn tay).",
    },
    translation: {
      status: "not_configured",
      providers: [],
      messageVi:
        "Chưa cấu hình dịch tự động. Hãy nhập bản dịch Việt thủ công nếu cần.",
    },
    pronunciation: {
      status: "not_configured",
      providers: [],
      messageVi:
        "Chưa cấu hình chấm phát âm ja-JP. Nghe lại / xuất vẫn dùng được; không gán điểm giả.",
      prosodySupportedForJaJp: false,
    },
    scriptAlign,
    credentialsPresent: hasAsr || hasTranslate,
    liveTestsAllowed: false,
  };
}
