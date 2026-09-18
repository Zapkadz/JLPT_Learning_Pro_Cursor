/**
 * KAI-015/053/070 speech + script-align capability surface.
 * Default align engine: stable_ts (ADR-021a). Optional: qwen_fa, whisper, mock.
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

export type ScriptAlignEnginePref =
  | "stable_ts"
  | "qwen_fa"
  | "whisper"
  | "mock";

export function resolveScriptAlignEnginePref(
  env: NodeJS.ProcessEnv = process.env,
): ScriptAlignEnginePref {
  const raw = (env.KAIWA_SCRIPT_ALIGN_ENGINE?.trim() || "stable_ts").toLowerCase();
  if (raw === "mock") return "mock";
  if (raw === "qwen_fa" || raw === "qwen" || raw === "qwen3") return "qwen_fa";
  if (raw === "whisper" || raw === "faster-whisper" || raw === "greedy")
    return "whisper";
  if (raw === "stable_ts" || raw === "stable-ts" || raw === "stable")
    return "stable_ts";
  // Unknown → ADR-021a default
  return "stable_ts";
}

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

const importCache = new Map<string, boolean>();

function canImportPythonModule(
  env: NodeJS.ProcessEnv,
  code: string,
  cacheKey: string,
): boolean {
  const hit = importCache.get(cacheKey);
  if (hit != null) return hit;
  const python =
    env.KAIWA_PYTHON?.trim() || env.PYTHON?.trim() || "python";
  const r = spawnSync(python, ["-c", code], {
    encoding: "utf8",
    timeout: 45_000,
  });
  const ok = r.status === 0;
  importCache.set(cacheKey, ok);
  return ok;
}

function canImportFasterWhisper(env: NodeJS.ProcessEnv): boolean {
  return canImportPythonModule(
    env,
    "from faster_whisper import WhisperModel",
    "faster_whisper",
  );
}

function canImportStableTs(env: NodeJS.ProcessEnv): boolean {
  return canImportPythonModule(
    env,
    "import stable_whisper",
    "stable_whisper",
  );
}

function canImportQwenFa(env: NodeJS.ProcessEnv): boolean {
  return canImportPythonModule(
    env,
    "from qwen_asr import Qwen3ForcedAligner",
    "qwen_asr",
  );
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
  const enginePref = resolveScriptAlignEnginePref(env);
  const model = env.KAIWA_WHISPER_MODEL?.trim() || "base";

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

  if (enginePref === "stable_ts") {
    if (!canImportStableTs(env)) {
      return {
        status: "not_configured",
        providers: [],
        engine: null,
        messageVi:
          "Chưa cài stable-ts (pip install stable-ts). Hoặc đặt KAIWA_SCRIPT_ALIGN_ENGINE=whisper / qwen_fa. Vẫn dùng SRT/VTT hoặc soạn tay.",
      };
    }
    return {
      status: "ready",
      providers: ["stable-ts"],
      engine: `stable-ts:${model}`,
      messageVi:
        "Có thể đồng bộ lời thoại với video (stable-ts). Kết quả là bản nháp — hãy kiểm tra mốc thời gian. Anime/BGM vẫn có thể lệch.",
    };
  }

  if (enginePref === "qwen_fa") {
    if (!canImportQwenFa(env)) {
      return {
        status: "not_configured",
        providers: [],
        engine: null,
        messageVi:
          "Chưa cài qwen-asr (pip install qwen-asr). Hoặc đặt KAIWA_SCRIPT_ALIGN_ENGINE=stable_ts. Vẫn dùng SRT/VTT hoặc soạn tay.",
      };
    }
    return {
      status: "ready",
      providers: ["qwen-forced-aligner"],
      engine: `qwen-fa:${env.KAIWA_QWEN_FA_MODEL?.trim() || "Qwen/Qwen3-ForcedAligner-0.6B"}`,
      messageVi:
        "Có thể đồng bộ (Qwen ForcedAligner). Cold start CPU có thể chậm. Bản nháp — hãy kiểm tra mốc.",
    };
  }

  // whisper (legacy greedy)
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
    engine: `faster-whisper:${model}`,
    messageVi:
      "Có thể đồng bộ lời thoại với video (Whisper greedy — legacy). Nên dùng stable_ts. Kết quả là bản nháp.",
  };
}

export function resolveTranscriptionCapability(
  env: NodeJS.ProcessEnv = process.env,
): {
  status: SpeechCapabilityStatus;
  providers: string[];
  messageVi: string;
  engine: string | null;
} {
  const ffmpeg = resolveFfmpegPath(env);
  const enginePref = env.KAIWA_ASR_ENGINE?.trim() || "whisper";

  if (enginePref === "mock") {
    return {
      status: "ready",
      providers: ["mock"],
      engine: "mock_asr",
      messageVi:
        "ASR mock sẵn sàng (kiểm thử). Chữ máy có thể sai — phải duyệt bản nháp.",
    };
  }

  if (!ffmpeg) {
    return {
      status: "not_configured",
      providers: [],
      engine: null,
      messageVi:
        "Chưa cấu hình ASR (thiếu ffmpeg). Hãy nhập phụ đề thủ công (SRT/VTT hoặc soạn tay).",
    };
  }

  if (!canImportFasterWhisper(env)) {
    return {
      status: "not_configured",
      providers: [],
      engine: null,
      messageVi:
        "Chưa cấu hình ASR (thiếu faster-whisper). Hãy nhập phụ đề thủ công (SRT/VTT hoặc soạn tay).",
    };
  }

  return {
    status: "ready",
    providers: ["faster-whisper"],
    engine: `faster-whisper:${env.KAIWA_WHISPER_MODEL?.trim() || "base"}`,
    messageVi:
      "Có thể tự tạo phụ đề từ video (ASR). Anime/BGM dễ sai hoặc trống — nên dùng Đồng bộ script nếu đã có lời; luôn duyệt bản nháp.",
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

  void hasAsr;
  void hasTranslate;

  const scriptAlign = resolveScriptAlignCapability(env);
  const transcription = resolveTranscriptionCapability(env);

  return {
    transcription: {
      status: transcription.status,
      providers: transcription.providers,
      messageVi: transcription.messageVi,
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
