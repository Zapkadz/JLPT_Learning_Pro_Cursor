import { useEffect, useRef, useState } from "react";
import { post } from "../../lib/api";
import {
  createCaptureMachine,
  reduceCapture,
  shouldLockPlayback,
  type CaptureMachine,
} from "./recorderMachine";
import { openMicStream, stopStream } from "./micPreflight";

type Props = {
  attemptId: string;
  videoUrl: string | null;
  deviceId?: string;
  onSaved?: (completion: string) => void;
};

const COUNTDOWN_SEC = 3;

export function ContinuousRecorder({
  attemptId,
  videoUrl,
  deviceId,
  onSaved,
}: Props) {
  const [machine, setMachine] = useState<CaptureMachine>(() =>
    createCaptureMachine("ready"),
  );
  const [count, setCount] = useState(COUNTDOWN_SEC);
  const [error, setError] = useState("");
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const clocksRef = useRef<{ t0Perf: number; samples: { perf: number; video: number }[] }>({
    t0Perf: 0,
    samples: [],
  });
  const sampleTimer = useRef(0);
  const finalizingRef = useRef(false);

  function dispatch(
    event: Parameters<typeof reduceCapture>[1],
  ): CaptureMachine {
    let next!: CaptureMachine;
    setMachine((prev) => {
      next = reduceCapture(prev, event);
      return next;
    });
    return next;
  }

  useEffect(() => {
    return () => {
      window.clearInterval(sampleTimer.current);
      stopStream(streamRef.current);
      streamRef.current = null;
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [blobUrl]);

  // Lock seek / rate while recording
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const lock = shouldLockPlayback(machine.state);
    if (lock) {
      v.playbackRate = 1;
      const blockSeek = () => {
        /* browser may still seek via UI — re-clamp on timeupdate if needed */
      };
      v.addEventListener("ratechange", () => {
        if (v.playbackRate !== 1) v.playbackRate = 1;
      });
      void blockSeek;
    }
    v.controls = !lock;
  }, [machine.state]);

  useEffect(() => {
    if (machine.state !== "countdown") return;
    setCount(COUNTDOWN_SEC);
    let n = COUNTDOWN_SEC;
    const id = window.setInterval(() => {
      n -= 1;
      setCount(n);
      if (n <= 0) {
        window.clearInterval(id);
        void beginRecording();
      }
    }, 1000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [machine.state === "countdown"]);

  async function beginRecording() {
    const v = videoRef.current;
    if (!v) {
      dispatch({ type: "FAIL", reason: "Thiếu video." });
      return;
    }
    dispatch({ type: "COUNTDOWN_DONE" });
    try {
      const stream = await openMicStream(deviceId);
      streamRef.current = stream;
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const rec = new MediaRecorder(stream, { mimeType: mime });
      chunksRef.current = [];
      rec.ondataavailable = (ev) => {
        if (ev.data.size) chunksRef.current.push(ev.data);
      };
      recorderRef.current = rec;
      clocksRef.current = { t0Perf: performance.now(), samples: [] };
      sampleTimer.current = window.setInterval(() => {
        clocksRef.current.samples.push({
          perf: performance.now() - clocksRef.current.t0Perf,
          video: v.currentTime,
        });
      }, 500) as unknown as number;

      rec.start(250);
      v.currentTime = 0;
      v.playbackRate = 1;
      await v.play();
    } catch (e) {
      dispatch({ type: "FAIL", reason: (e as Error).message });
    }
  }

  async function finalize(kind: "completed" | "partial" | "interrupted") {
    if (finalizingRef.current) return;
    finalizingRef.current = true;
    const v = videoRef.current;
    window.clearInterval(sampleTimer.current);
    try {
      v?.pause();
    } catch {
      /* ignore */
    }
    const rec = recorderRef.current;
    const blob = await new Promise<Blob>((resolve) => {
      if (!rec || rec.state === "inactive") {
        resolve(new Blob(chunksRef.current, { type: "audio/webm" }));
        return;
      }
      rec.onstop = () =>
        resolve(new Blob(chunksRef.current, { type: rec.mimeType || "audio/webm" }));
      try {
        rec.stop();
      } catch {
        resolve(new Blob(chunksRef.current, { type: "audio/webm" }));
      }
    });
    stopStream(streamRef.current);
    streamRef.current = null;
    recorderRef.current = null;

    const durationMs = Math.round((v?.currentTime || 0) * 1000);
    if (blobUrl) URL.revokeObjectURL(blobUrl);
    const url = URL.createObjectURL(blob);
    setBlobUrl(url);

    try {
      await post(`/kaiwa/attempts/${attemptId}/finalize`, {
        completion: kind,
        durationMs,
        clocks: {
          engine: "video+perf",
          samples: clocksRef.current.samples.slice(0, 200),
        },
        device: { deviceId: deviceId || null },
      });
      dispatch({ type: "FINALIZE_OK", completion: kind });
      onSaved?.(kind);
    } catch (e) {
      setError((e as Error).message);
      dispatch({ type: "FAIL", reason: (e as Error).message });
    } finally {
      finalizingRef.current = false;
    }
  }

  function onStop() {
    const next = dispatch({ type: "STOP" });
    if (next.state === "finalizing") void finalize("partial");
  }

  function onVideoEnded() {
    if (machine.state !== "recording") return;
    dispatch({ type: "EOF" });
    void finalize("completed");
  }

  return (
    <div className="panel kaiwa-recorder">
      <div className="kaiwa-recorder-status" aria-live="assertive">
        Trạng thái thu: <strong>{machine.state}</strong>
        {machine.completion ? ` · ${machine.completion}` : ""}
      </div>

      {videoUrl && (
        <video
          ref={videoRef}
          className="kaiwa-record-video"
          src={videoUrl}
          playsInline
          preload="metadata"
          onEnded={onVideoEnded}
        />
      )}

      {machine.state === "countdown" && (
        <p className="kaiwa-countdown" aria-live="assertive">
          Bắt đầu sau {count}…
        </p>
      )}

      <div className="kaiwa-actions">
        {(machine.state === "ready" || machine.state === "idle") && (
          <button
            type="button"
            className="btn"
            onClick={() => dispatch({ type: "START_COUNTDOWN" })}
          >
            Bắt đầu thu liên tục
          </button>
        )}
        {(machine.state === "countdown" || machine.state === "recording") && (
          <button type="button" className="btn danger-solid" onClick={onStop}>
            Kết thúc
          </button>
        )}
        {(machine.state === "saved" || machine.state === "failed") && (
          <button
            type="button"
            className="btn secondary"
            onClick={() => {
              finalizingRef.current = false;
              dispatch({ type: "RESET" });
              dispatch({ type: "READY" });
            }}
          >
            Thu lại (lần mới cần tạo attempt)
          </button>
        )}
      </div>

      {error && <p role="alert">{error}</p>}
      {blobUrl && machine.state === "saved" && (
        <audio controls src={blobUrl} preload="metadata" />
      )}
      <p className="kaiwa-privacy-note">
        Thu liên tục theo đồng hồ video — không dừng theo từng câu. Chunk journal /
        upload nền → KAI-019.
      </p>
    </div>
  );
}
