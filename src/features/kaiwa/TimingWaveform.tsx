import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

type Props = {
  audioUrl: string | null;
  startMs: number;
  endMs: number;
  /** Visible ruler span */
  viewStartMs: number;
  viewEndMs: number;
  locked?: boolean;
  disabled?: boolean;
  onChange: (startMs: number, endMs: number) => void;
  onPreview?: (ms: number) => void;
};

type Handle = "start" | "end" | null;

/**
 * Lightweight timing waveform + drag handles (KAI-073).
 * Peaks load best-effort from audio/video URL; falls back to flat track.
 */
export function TimingWaveform({
  audioUrl,
  startMs,
  endMs,
  viewStartMs,
  viewEndMs,
  locked,
  disabled,
  onChange,
  onPreview,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [peaks, setPeaks] = useState<Float32Array | null>(null);
  const dragRef = useRef<Handle>(null);

  const span = Math.max(1, viewEndMs - viewStartMs);

  useEffect(() => {
    if (!audioUrl) {
      setPeaks(null);
      return;
    }
    let cancelled = false;
    const ac = new AbortController();
    (async () => {
      try {
        const res = await fetch(audioUrl, { signal: ac.signal });
        if (!res.ok) return;
        const buf = await res.arrayBuffer();
        const ctx = new AudioContext();
        try {
          const audio = await ctx.decodeAudioData(buf.slice(0));
          const ch = audio.getChannelData(0);
          const bins = 240;
          const out = new Float32Array(bins);
          const slice = Math.max(1, Math.floor(ch.length / bins));
          for (let i = 0; i < bins; i++) {
            let peak = 0;
            const base = i * slice;
            for (let j = 0; j < slice && base + j < ch.length; j++) {
              peak = Math.max(peak, Math.abs(ch[base + j]));
            }
            out[i] = peak;
          }
          if (!cancelled) setPeaks(out);
        } finally {
          await ctx.close().catch(() => undefined);
        }
      } catch {
        if (!cancelled) setPeaks(null);
      }
    })();
    return () => {
      cancelled = true;
      ac.abort();
    };
  }, [audioUrl]);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const w = c.width;
    const h = c.height;
    const g = c.getContext("2d");
    if (!g) return;
    g.clearRect(0, 0, w, h);
    g.fillStyle = "#1a1a1a";
    g.fillRect(0, 0, w, h);
    g.fillStyle = "#4a90d9";
    if (peaks && peaks.length) {
      const barW = w / peaks.length;
      for (let i = 0; i < peaks.length; i++) {
        const ph = Math.max(1, peaks[i] * (h - 4));
        g.fillRect(i * barW, (h - ph) / 2, Math.max(1, barW - 0.5), ph);
      }
    } else {
      g.fillStyle = "#333";
      g.fillRect(0, h / 2 - 1, w, 2);
    }
    const x0 = ((startMs - viewStartMs) / span) * w;
    const x1 = ((endMs - viewStartMs) / span) * w;
    g.fillStyle = "rgba(47, 111, 237, 0.28)";
    g.fillRect(x0, 0, Math.max(2, x1 - x0), h);
    g.strokeStyle = locked ? "#c9a227" : "#2f6fed";
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(x0, 0);
    g.lineTo(x0, h);
    g.moveTo(x1, 0);
    g.lineTo(x1, h);
    g.stroke();
  }, [peaks, startMs, endMs, viewStartMs, span, locked]);

  function msFromClientX(clientX: number): number {
    const el = trackRef.current;
    if (!el) return startMs;
    const r = el.getBoundingClientRect();
    const t = Math.min(1, Math.max(0, (clientX - r.left) / Math.max(1, r.width)));
    return Math.round(viewStartMs + t * span);
  }

  function onPointerDown(which: Handle, e: ReactPointerEvent) {
    if (disabled || locked || !which) return;
    e.preventDefault();
    dragRef.current = which;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }

  function onPointerMove(e: ReactPointerEvent) {
    const which = dragRef.current;
    if (!which) return;
    const ms = msFromClientX(e.clientX);
    if (which === "start") {
      onChange(Math.min(ms, endMs - 80), endMs);
    } else {
      onChange(startMs, Math.max(ms, startMs + 80));
    }
    onPreview?.(ms);
  }

  function onPointerUp() {
    dragRef.current = null;
  }

  const startPct = ((startMs - viewStartMs) / span) * 100;
  const endPct = ((endMs - viewStartMs) / span) * 100;

  return (
    <div
      className={`kaiwa-waveform ${locked ? "locked" : ""}`}
      ref={trackRef}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <canvas
        ref={canvasRef}
        className="kaiwa-waveform-canvas"
        width={640}
        height={56}
        aria-hidden
      />
      <button
        type="button"
        className="kaiwa-waveform-handle start"
        style={{ left: `${startPct}%` }}
        aria-label="Kéo mốc bắt đầu"
        disabled={disabled || locked}
        onPointerDown={(e) => onPointerDown("start", e)}
      />
      <button
        type="button"
        className="kaiwa-waveform-handle end"
        style={{ left: `${endPct}%` }}
        aria-label="Kéo mốc kết thúc"
        disabled={disabled || locked}
        onPointerDown={(e) => onPointerDown("end", e)}
      />
    </div>
  );
}
