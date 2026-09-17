/**
 * Local-only mic preflight for Kaiwa studio.
 * Never uploads test audio to external providers.
 */

export type PreflightState =
  | "idle"
  | "requesting"
  | "ready"
  | "denied"
  | "no_device"
  | "error"
  | "disconnected";

export type MicDevice = { deviceId: string; label: string };

export async function listInputDevices(): Promise<MicDevice[]> {
  if (!navigator.mediaDevices?.enumerateDevices) return [];
  const devices = await navigator.mediaDevices.enumerateDevices();
  return devices
    .filter((d) => d.kind === "audioinput")
    .map((d, i) => ({
      deviceId: d.deviceId,
      label: d.label || `Micro ${i + 1}`,
    }));
}

export async function openMicStream(
  deviceId?: string,
): Promise<MediaStream> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw Object.assign(new Error("Trình duyệt không hỗ trợ micro."), {
      code: "unsupported",
    });
  }
  try {
    return await navigator.mediaDevices.getUserMedia({
      audio: deviceId
        ? { deviceId: { exact: deviceId }, echoCancellation: true }
        : { echoCancellation: true },
      video: false,
    });
  } catch (e) {
    const name = (e as DOMException).name || "";
    if (name === "NotAllowedError" || name === "PermissionDeniedError") {
      throw Object.assign(new Error("Bạn đã từ chối quyền micro."), {
        code: "denied",
      });
    }
    if (name === "NotFoundError" || name === "DevicesNotFoundError") {
      throw Object.assign(new Error("Không tìm thấy thiết bị micro."), {
        code: "no_device",
      });
    }
    throw Object.assign(
      new Error((e as Error).message || "Không mở được micro."),
      { code: "error" },
    );
  }
}

export function stopStream(stream: MediaStream | null) {
  if (!stream) return;
  for (const t of stream.getTracks()) {
    try {
      t.stop();
    } catch {
      /* ignore */
    }
  }
}

/** Meter analyser — levels only; do not connect to loudspeaker destination. */
export function createMeter(
  stream: MediaStream,
): {
  level: () => number;
  close: () => void;
} {
  const ctx = new AudioContext();
  const source = ctx.createMediaStreamSource(stream);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 256;
  source.connect(analyser);
  // Intentionally NOT connected to ctx.destination (no loopback to speakers).
  const data = new Uint8Array(analyser.frequencyBinCount);
  return {
    level: () => {
      analyser.getByteTimeDomainData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) {
        const v = (data[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / data.length);
      return Math.min(1, rms * 4);
    },
    close: () => {
      try {
        source.disconnect();
        analyser.disconnect();
        void ctx.close();
      } catch {
        /* ignore */
      }
    },
  };
}

/** Short in-memory test clip — kept local, never uploaded. */
export async function recordTestClip(
  stream: MediaStream,
  ms = 1200,
): Promise<Blob> {
  const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
    ? "audio/webm;codecs=opus"
    : MediaRecorder.isTypeSupported("audio/webm")
      ? "audio/webm"
      : "";
  const recorder = new MediaRecorder(
    stream,
    mime ? { mimeType: mime } : undefined,
  );
  const chunks: BlobPart[] = [];
  recorder.ondataavailable = (ev) => {
    if (ev.data.size) chunks.push(ev.data);
  };
  recorder.start(100);
  await new Promise((r) => setTimeout(r, ms));
  return new Promise((resolve, reject) => {
    recorder.onerror = () => reject(new Error("Thử thu thất bại."));
    recorder.onstop = () =>
      resolve(new Blob(chunks, { type: recorder.mimeType || "audio/webm" }));
    recorder.stop();
  });
}
