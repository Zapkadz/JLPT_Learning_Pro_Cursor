#!/usr/bin/env python3
"""Video-only ASR sidecar for KAI-056 (Whisper segments → draft text+times)."""

from __future__ import annotations

import argparse
import json
import sys


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--wav", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--model", default="tiny")
    args = ap.parse_args()

    from faster_whisper import WhisperModel

    model = WhisperModel(args.model, device="cpu", compute_type="int8")
    segments_iter, info = model.transcribe(
        args.wav,
        language="ja",
        word_timestamps=False,
        vad_filter=True,
    )
    out_segs = []
    for seg in segments_iter:
        text = (seg.text or "").strip()
        if not text:
            continue
        start_ms = int(round(float(seg.start) * 1000))
        end_ms = int(round(float(seg.end) * 1000))
        if end_ms <= start_ms:
            end_ms = start_ms + 300
        # ASR text is hypothesis — always mark uncertain for user review
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
            },
            f,
            ensure_ascii=False,
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
