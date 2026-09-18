import { useEffect, useMemo, useRef, useState } from "react";
import {
  createCaptureMachine,
  reduceCapture,
  shouldLockPlayback,
  type CaptureMachine,
} from "./recorderMachine";
import { openMicStream, stopStream } from "./micPreflight";
import {
  createChunkJournal,
  DEFAULT_JOURNAL_LIMIT_BYTES,
  sha256Hex,
  type ChunkJournal,
} from "./chunkJournal";
import { assembleAndFinalize, syncJournalToServer } from "./attemptUpload";
import { currentAndNext } from "../../../shared/kaiwa/liveOverlay";
import type { KaiwaSegment } from "../../../shared/kaiwa/types";

type HelpPrefs = { furigana: boolean; romaji: boolean; vi: boolean };

type Props = {
  attemptId: string;
  videoUrl: string | null;
  segments?: KaiwaSegment[];
  prefs?: HelpPrefs;
  deviceId?: string;
  onSaved?: (completion: string) => void;
  journalLimitBytes?: number;
};

const COUNTDOWN_SEC = 3;

export function ContinuousRecorder({
  attemptId,
  videoUrl,
  segments = [],
  prefs = { furigana: true, romaji: false, vi: true },
  deviceId,
  onSaved,
  journalLimitBytes = DEFAULT_JOURNAL_LIMIT_BYTES,
}: Props) {
  const [machine, setMachine] = useState<CaptureMachine>(() =>
    createCaptureMachine("ready"),
  );
  const [count, setCount] = useState(COUNTDOWN_SEC);
  const [error, setError] = useState("");
  const [uploadNote, setUploadNote] = useState("");
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [tMs, setTMs] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunkIndexRef = useRef(0);
  const journalRef = useRef<ChunkJournal>(createChunkJournal());
  const clocksRef = useRef<{
    t0Perf: number;
    samples: { perf: number; video: number }[];
  }>({ t0Perf: 0, samples: [] });
  const sampleTimer = useRef(0);
  const finalizingRef = useRef(false);

  const overlay = useMemo(
    () => currentAndNext(segments, tMs),
    [segments, tMs],
  );

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
    const v = videoRef.current;
    if (!v) return;
    const onTime = () => setTMs(Math.round(v.currentTime * 1000));
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("seeked", onTime);
    return () => {
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("seeked", onTime);
    };
  }, [videoUrl]);

  useEffect(() => {
    return () => {
      window.clearInterval(sampleTimer.current);
      stopStream(streamRef.current);
      streamRef.current = null;
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [blobUrl]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const lock = shouldLockPlayback(machine.state);
    if (lock) {
      v.playbackRate = 1;
      v.addEventListener("ratechange", () => {
        if (v.playbackRate !== 1) v.playbackRate = 1;
      });
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

  async function persistChunk(blob: Blob) {
    const buf = new Uint8Array(await blob.arrayBuffer());
    if (!buf.byteLength) return;
    const used = await journalRef.current.usageBytes(attemptId);
    if (used + buf.byteLength > journalLimitBytes) {
      throw new Error(
        "Bộ nhớ tạm trên máy đã đầy. Đã dừng thu an toàn. Hãy thử lại khi còn dung lượng.",
      );
    }
    const index = chunkIndexRef.current++;
    const checksum = await sha256Hex(buf);
    await journalRef.current.append(attemptId, index, buf, checksum);
    // Background upload — best effort; finalize will resume
    void syncJournalToServer(attemptId, journalRef.current).catch(() => {
      setUploadNote("Mất mạng tạm thời — chunk vẫn giữ trên máy, sẽ gửi lại lúc chốt.");
    });
  }

  async function beginRecording() {
    const v = videoRef.current;
    if (!v) {
      dispatch({ type: "FAIL", reason: "Thiếu video." });
      return;
    }
    dispatch({ type: "COUNTDOWN_DONE" });
    try {
      await journalRef.current.clear(attemptId);
      chunkIndexRef.current = 0;
      const stream = await openMicStream(deviceId);
      streamRef.current = stream;
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const rec = new MediaRecorder(stream, { mimeType: mime });
      rec.ondataavailable = (ev) => {
        if (ev.data.size) {
          void persistChunk(ev.data).catch((e) => {
            setError((e as Error).message);
            dispatch({ type: "INTERRUPT" });
            void finalize("interrupted");
          });
        }
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
      v.muted = true;
      v.volume = 0;
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
    if (kind === "completed") dispatch({ type: "EOF" });
    else if (kind === "partial") dispatch({ type: "STOP" });
    else dispatch({ type: "INTERRUPT" });

    const v = videoRef.current;
    window.clearInterval(sampleTimer.current);
    try {
      v?.pause();
      if (v) {
        v.muted = false;
        v.volume = 1;
      }
    } catch {
      /* ignore */
    }
    const rec = recorderRef.current;
    await new Promise<void>((resolve) => {
      if (!rec || rec.state === "inactive") {
        resolve();
        return;
      }
      rec.onstop = () => resolve();
      try {
        rec.stop();
      } catch {
        resolve();
      }
    });
    // Allow last ondataavailable to flush
    await new Promise((r) => setTimeout(r, 100));
    stopStream(streamRef.current);
    streamRef.current = null;
    recorderRef.current = null;

    const durationMs = Math.round((v?.currentTime || 0) * 1000);
    setUploadNote("Đang đồng bộ chunk lên máy chủ…");

    try {
      await syncJournalToServer(attemptId, journalRef.current, {
        onProgress: (p) =>
          setUploadNote(`Đã gửi ${p.uploadedCount}/${p.localCount} chunk`),
      });

      const local = await journalRef.current.list(attemptId);
      if (
        (kind === "completed" || kind === "partial") &&
        local.length === 0
      ) {
        throw new Error("Không có dữ liệu audio — không báo đã lưu.");
      }

      const parts: BlobPart[] = [];
      for (const meta of local) {
        const d = await journalRef.current.get(attemptId, meta.index);
        if (d) parts.push(d.slice());
      }
      if (parts.length) {
        if (blobUrl) URL.revokeObjectURL(blobUrl);
        setBlobUrl(
          URL.createObjectURL(new Blob(parts, { type: "audio/webm" })),
        );
      }

      const res = await assembleAndFinalize(attemptId, {
        completion: kind,
        durationMs,
        clocks: {
          engine: "video+perf",
          samples: clocksRef.current.samples.slice(0, 200),
        },
        device: { deviceId: deviceId || null },
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Chốt bản thu thất bại.");

      await journalRef.current.clear(attemptId);
      dispatch({ type: "FINALIZE_OK", completion: kind });
      setUploadNote("Đã chốt bản thu trên máy chủ.");
      onSaved?.(kind);
    } catch (e) {
      setError((e as Error).message);
      dispatch({ type: "FAIL", reason: (e as Error).message });
      setUploadNote("");
    } finally {
      finalizingRef.current = false;
    }
  }

  function onStop() {
    if (machine.state === "countdown") {
      dispatch({ type: "STOP" });
      return;
    }
    void finalize("partial");
  }

  function onVideoEnded() {
    if (machine.state !== "recording") return;
    void finalize("completed");
  }

  return (
    <div className="panel kaiwa-recorder">
      <div className="kaiwa-recorder-status" aria-live="assertive">
        Trạng thái thu: <strong>{machine.state}</strong>
        {machine.completion ? ` · ${machine.completion}` : ""}
        {segments.length > 0 && overlay.index >= 0 ? (
          <span>
            {" "}
            · lời {overlay.index + 1}/{segments.length}
          </span>
        ) : null}
      </div>

      {videoUrl ? (
        <div className="kaiwa-seg-stage">
          <video
            ref={videoRef}
            className="kaiwa-record-video"
            src={videoUrl}
            playsInline
            preload="metadata"
            onEnded={onVideoEnded}
          />
          {(overlay.current || overlay.next) && (
            <div className="kaiwa-script-overlay" lang="ja">
              {overlay.current ? (
                <>
                  <div className="kaiwa-script-ja">
                    {overlay.current.ja || "(trống)"}
                  </div>
                  {prefs.vi && overlay.current.vi ? (
                    <div className="kaiwa-script-vi">{overlay.current.vi}</div>
                  ) : null}
                </>
              ) : (
                <div className="kaiwa-script-ja kaiwa-script-upcoming">
                  Sắp tới: {overlay.next?.ja || "…"}
                </div>
              )}
              {overlay.current && overlay.next ? (
                <div className="kaiwa-script-next">
                  Tiếp: {overlay.next.ja || "(trống)"}
                </div>
              ) : null}
            </div>
          )}
        </div>
      ) : null}

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
            Sẵn sàng (cần attempt mới để thu lại)
          </button>
        )}
      </div>

      {uploadNote && <p role="status">{uploadNote}</p>}
      {error && <p role="alert">{error}</p>}
      {blobUrl && machine.state === "saved" && (
        <audio controls src={blobUrl} preload="metadata" />
      )}
      <p className="kaiwa-privacy-note">
        Thu liên tục không dừng theo câu — nhìn lời trên video. Chunk journal cục
        bộ rồi upload; chỉ báo đã lưu sau khi lắp audio hợp lệ.
      </p>
    </div>
  );
}
