import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api, post } from "../../lib/api";
import { Status } from "../../components/ui";
import { openMicStream, stopStream } from "./micPreflight";
import type { KaiwaSegment } from "../../../shared/kaiwa/types";

type ClipRow = {
  id: string;
  segmentId: string;
  version: number;
  status: string;
  audioAssetId: string | null;
  skipReason: string | null;
  durationMs: number | null;
};

type ClipsPayload = {
  captureMode: string;
  segmentIds: string[];
  progress: {
    total: number;
    recorded: number;
    skipped: number;
    partial: number;
    pending: number;
  };
  clips: ClipRow[];
};

type HelpPrefs = { furigana: boolean; romaji: boolean; vi: boolean };

type Props = {
  attemptId: string;
  videoUrl: string | null;
  segments: KaiwaSegment[];
  deviceId?: string;
  prefs: HelpPrefs;
  onFinished?: () => void;
};

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const s = String(reader.result || "");
      const i = s.indexOf(",");
      resolve(i >= 0 ? s.slice(i + 1) : s);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export function SegmentStudio({
  attemptId,
  videoUrl,
  segments,
  deviceId,
  prefs,
  onFinished,
}: Props) {
  const [clipsData, setClipsData] = useState<ClipsPayload | null>(null);
  const [idx, setIdx] = useState(0);
  const [busy, setBusy] = useState(false);
  const [recording, setRecording] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const stopTimer = useRef(0);

  const reloadClips = useCallback(async () => {
    const data = await api<ClipsPayload>(
      `/kaiwa/attempts/${attemptId}/segment-clips`,
    );
    setClipsData(data);
    return data;
  }, [attemptId]);

  useEffect(() => {
    void reloadClips().catch((e) =>
      setError(e instanceof Error ? e.message : "Không tải được tiến độ đoạn."),
    );
  }, [reloadClips]);

  useEffect(() => {
    return () => {
      window.clearTimeout(stopTimer.current);
      stopStream(streamRef.current);
      streamRef.current = null;
    };
  }, []);

  const clipBySeg = useMemo(() => {
    const m = new Map<string, ClipRow>();
    for (const c of clipsData?.clips ?? []) m.set(c.segmentId, c);
    return m;
  }, [clipsData]);

  const seg = segments[idx] ?? null;
  const clip = seg ? clipBySeg.get(seg.id) : undefined;

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !seg) return;
    v.currentTime = Math.max(0, seg.startMs / 1000);
    v.pause();
  }, [seg?.id, seg?.startMs]);

  async function playOriginal() {
    const v = videoRef.current;
    if (!v || !seg) return;
    setNote("Đang nghe mẫu đoạn…");
    v.currentTime = seg.startMs / 1000;
    await v.play().catch(() => undefined);
    const endSec = seg.endMs / 1000;
    const onTime = () => {
      if (v.currentTime >= endSec - 0.05) {
        v.pause();
        v.removeEventListener("timeupdate", onTime);
        setNote("");
      }
    };
    v.addEventListener("timeupdate", onTime);
  }

  async function playMine() {
    if (!clip?.audioAssetId) {
      setNote("Chưa có bản thu đoạn này.");
      return;
    }
    const url = `/api/kaiwa/assets/${clip.audioAssetId}/content`;
    const a = new Audio(url);
    setNote("Đang nghe giọng mình…");
    a.onended = () => setNote("");
    await a.play().catch(() => setNote("Không phát được clip."));
  }

  async function startRecord() {
    if (!seg || recording || busy) return;
    setError("");
    setBusy(true);
    try {
      const stream = await openMicStream(deviceId);
      streamRef.current = stream;
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const rec = new MediaRecorder(stream, { mimeType: mime });
      chunksRef.current = [];
      rec.ondataavailable = (ev) => {
        if (ev.data.size > 0) chunksRef.current.push(ev.data);
      };
      recorderRef.current = rec;
      const v = videoRef.current;
      const windowMs = Math.max(200, seg.endMs - seg.startMs);
      if (v) {
        v.currentTime = seg.startMs / 1000;
        v.playbackRate = 1;
        await v.play().catch(() => undefined);
      }
      rec.start(250);
      setRecording(true);
      setNote(`Đang thu đoạn ${idx + 1}/${segments.length} — nhìn lời trên video.`);
      stopTimer.current = window.setTimeout(() => {
        void stopRecord(false);
      }, windowMs + 150);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không mở được micro.");
      stopStream(streamRef.current);
      streamRef.current = null;
    } finally {
      setBusy(false);
    }
  }

  async function stopRecord(partial: boolean) {
    window.clearTimeout(stopTimer.current);
    const rec = recorderRef.current;
    const v = videoRef.current;
    v?.pause();
    if (!rec || rec.state === "inactive") {
      setRecording(false);
      return;
    }
    setBusy(true);
    await new Promise<void>((resolve) => {
      rec.onstop = () => resolve();
      rec.stop();
    });
    stopStream(streamRef.current);
    streamRef.current = null;
    recorderRef.current = null;
    setRecording(false);
    try {
      if (!seg) return;
      const blob = new Blob(chunksRef.current, {
        type: rec.mimeType || "audio/webm",
      });
      chunksRef.current = [];
      const contentBase64 = await blobToBase64(blob);
      const data = await post<ClipsPayload>(
        `/kaiwa/attempts/${attemptId}/segment-clips/${seg.id}`,
        {
          action: "record",
          contentBase64,
          durationMs: Math.max(0, seg.endMs - seg.startMs),
          partial,
        },
      );
      setClipsData(data);
      const latest = data.clips.find((c) => c.segmentId === seg.id);
      setNote(
        partial
          ? "Đã lưu bản thu dở đoạn."
          : latest && latest.version > 1
            ? `Đã lưu bản mới (v${latest.version}). Bản cũ vẫn giữ trong lịch sử.`
            : "Đã lưu đoạn.",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không lưu được clip.");
    } finally {
      setBusy(false);
    }
  }

  async function skip() {
    if (!seg || busy || recording) return;
    setBusy(true);
    setError("");
    try {
      const data = await post<ClipsPayload>(
        `/kaiwa/attempts/${attemptId}/segment-clips/${seg.id}`,
        { action: "skip", reason: "user_skip" },
      );
      setClipsData(data);
      setNote("Đã bỏ qua đoạn này — không tính là đã nói.");
      goNext(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không bỏ qua được.");
    } finally {
      setBusy(false);
    }
  }

  async function endSession() {
    if (busy || recording) return;
    setBusy(true);
    setError("");
    try {
      const result = await post<{
        note?: string;
        assembly?: string;
        captureMode?: string;
      }>(`/kaiwa/attempts/${attemptId}/assemble-segments`, {});
      if (result.note) setNote(result.note);
      onFinished?.();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Không ghép được bản nghe — thử lại.",
      );
    } finally {
      setBusy(false);
    }
  }

  function goNext(data?: ClipsPayload) {
    const source = data ?? clipsData;
    if (!source) {
      setIdx((i) => Math.min(i + 1, segments.length - 1));
      return;
    }
    const by = new Map(source.clips.map((c) => [c.segmentId, c.status]));
    for (let i = idx + 1; i < segments.length; i++) {
      const st = by.get(segments[i].id);
      if (!st || st === "pending") {
        setIdx(i);
        return;
      }
    }
    setNote("Đã hết đoạn pending. Bạn có thể thu lại hoặc kết thúc phiên.");
  }

  function goPrev() {
    setIdx((i) => Math.max(0, i - 1));
  }

  const progress = clipsData?.progress;

  return (
    <div className="panel kaiwa-segment-studio">
      <div className="kaiwa-seg-progress">
        Đoạn <strong>{segments.length ? idx + 1 : 0}</strong> / {segments.length}
        {clip?.version ? (
          <span>
            {" "}
            · bản thu <strong>v{clip.version}</strong>
          </span>
        ) : null}
        {progress ? (
          <span>
            {" "}
            · Đã thu {progress.recorded}/{progress.total}
            {progress.skipped ? ` · bỏ qua ${progress.skipped}` : ""}
          </span>
        ) : null}
      </div>

      <div className="kaiwa-seg-stage">
        {videoUrl ? (
          <video
            ref={videoRef}
            className="kaiwa-record-video"
            src={videoUrl}
            playsInline
            preload="metadata"
          />
        ) : (
          <Status tone="info">Chưa có video proxy để tua theo đoạn.</Status>
        )}
        {seg && (
          <div className="kaiwa-script-overlay" lang="ja">
            <small>
              {String(seg.startMs).padStart(0)}ms → {seg.endMs}ms
            </small>
            <div className="kaiwa-script-ja">{seg.ja || "(trống)"}</div>
            {prefs.vi && seg.vi ? (
              <div className="kaiwa-script-vi">{seg.vi}</div>
            ) : null}
          </div>
        )}
      </div>

      <div className="kaiwa-seg-controls">
        <button
          type="button"
          className="btn secondary"
          disabled={!seg || busy || recording}
          onClick={() => void playOriginal()}
        >
          Nghe mẫu đoạn
        </button>
        {!recording ? (
          <button
            type="button"
            className="btn"
            disabled={!seg || busy || !videoUrl}
            onClick={() => void startRecord()}
          >
            {clip?.status === "recorded" || clip?.status === "partial"
              ? "Thu lại"
              : "Thu đoạn này"}
          </button>
        ) : (
          <button
            type="button"
            className="btn"
            disabled={busy}
            onClick={() => void stopRecord(true)}
          >
            Dừng sớm
          </button>
        )}
        <button
          type="button"
          className="btn secondary"
          disabled={!clip?.audioAssetId || busy || recording}
          onClick={() => void playMine()}
        >
          Nghe giọng mình
        </button>
        <button
          type="button"
          className="btn secondary"
          disabled={idx <= 0 || busy || recording}
          onClick={goPrev}
        >
          Trước
        </button>
        <button
          type="button"
          className="btn secondary"
          disabled={idx >= segments.length - 1 || busy || recording}
          onClick={() => goNext()}
        >
          Tiếp
        </button>
        <button
          type="button"
          className="btn secondary"
          disabled={!seg || busy || recording}
          onClick={() => void skip()}
        >
          Bỏ qua
        </button>
        <button
          type="button"
          className="btn secondary"
          disabled={busy || recording}
          onClick={() => void endSession()}
        >
          Kết thúc phiên
        </button>
      </div>

      {clip?.status === "skipped" && (
        <Status tone="info">Đã bỏ qua đoạn này — không tính là đã nói.</Status>
      )}
      {note && <Status tone="info">{note}</Status>}
      {error && <Status tone="error">{error}</Status>}

      <ul className="kaiwa-seg-status-list">
        {segments.map((s, i) => {
          const c = clipBySeg.get(s.id);
          const st = c?.status ?? "pending";
          return (
            <li key={s.id}>
              <button
                type="button"
                className={
                  i === idx ? "kaiwa-seg-chip active" : "kaiwa-seg-chip"
                }
                disabled={busy || recording}
                onClick={() => setIdx(i)}
              >
                {i + 1}. {st}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
