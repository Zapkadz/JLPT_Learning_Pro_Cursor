#!/usr/bin/env python3
"""Video-only ASR sidecar for KAI-056/062 (Whisper → draft text+times)."""

from __future__ import annotations

import argparse
import json
import sys


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--wav", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--model", default="base")
    args = ap.parse_args()

    from faster_whisper import WhisperModel

    model = WhisperModel(args.model, device="cpu", compute_type="int8")
    segments_iter, info = model.transcribe(
        args.wav,
        language="ja",
        word_timestamps=True,
        vad_filter=True,
        vad_parameters=dict(min_silence_duration_ms=400),
        condition_on_previous_text=False,
        beam_size=5,
    )
    out_segs = []
    for seg in segments_iter:
        text = (seg.text or "").strip()
        if not text:
            continue
        # Prefer word span if present (tighter than segment envelope)
        if seg.words:
            start_ms = int(round(float(seg.words[0].start) * 1000))
            end_ms = int(round(float(seg.words[-1].end) * 1000))
        else:
            start_ms = int(round(float(seg.start) * 1000))
            end_ms = int(round(float(seg.end) * 1000))
        if end_ms <= start_ms:
            end_ms = start_ms + 300
        out_segs.append(
            {
                "ja": text[:4000],
                "startMs": start_ms,
                "endMs": end_ms,
                "timingUncertain": True,
            }
        )

    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(
            {
                "segments": out_segs,
                "engine": f"faster-whisper:{args.model}",
                "language": getattr(info, "language", "ja"),
                "empty": len(out_segs) == 0,
            },
            f,
            ensure_ascii=False,
        )
    if not out_segs:
        print(
            "ASR returned 0 segments — music/noise/overlap or model too small.",
            file=sys.stderr,
        )
        return 3
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
