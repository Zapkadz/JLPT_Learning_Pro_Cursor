/**
 * KAI-015 speech automation capability surface.
 * Without credentials: always not_configured — manual transcript remains the path.
 */

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
  credentialsPresent: boolean;
  liveTestsAllowed: boolean;
};

export function resolveSpeechCapability(
  env: NodeJS.ProcessEnv = process.env,
): SpeechCapability {
  const hasAsr =
    Boolean(env.KAIWA_ASR_API_KEY?.trim()) ||
    Boolean(env.AZURE_SPEECH_KEY?.trim());
  const hasTranslate =
    Boolean(env.KAIWA_TRANSLATE_API_KEY?.trim()) ||
    Boolean(env.AZURE_TRANSLATOR_KEY?.trim());

  // Live adapters not wired in this stub — even with keys, report not_configured
  // until a verified provider adapter lands (Gate B / later KAI-015 slice).
  void hasAsr;
  void hasTranslate;

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
    credentialsPresent: hasAsr || hasTranslate,
    liveTestsAllowed: false,
  };
}
