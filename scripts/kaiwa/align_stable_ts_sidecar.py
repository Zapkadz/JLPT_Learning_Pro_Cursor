#!/usr/bin/env python3
"""stable-ts forced-align sidecar (KAI-070 default per ADR-021a)."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from align_line_map import words_to_line_segments


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--wav", required=True)
    ap.add_argument("--script", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--model", default="base")
    args = ap.parse_args()

    with open(args.script, encoding="utf-8") as f:
        payload = json.load(f)
    lines = payload.get("lines") or []
    if not lines:
        print("empty script lines", file=sys.stderr)
        return 2

    import stable_whisper

    model = stable_whisper.load_model(args.model, device="cpu")
    text = "\n".join(lines)
    result = model.align(str(args.wav), text, language="ja")

    words: list[dict] = []
    for seg in result.segments or []:
        for w in getattr(seg, "words", None) or []:
            words.append(
                {
                    "word": getattr(w, "word", "") or "",
                    "start": float(getattr(w, "start", 0) or 0),
                    "end": float(getattr(w, "end", 0) or 0),
                }
            )
    if not words and result.segments:
        for seg in result.segments:
            words.append(
                {
                    "word": getattr(seg, "text", "") or "",
                    "start": float(getattr(seg, "start", 0) or 0),
                    "end": float(getattr(seg, "end", 0) or 0),
                }
            )

    aligned = words_to_line_segments(words, lines)
    out = {
        "segments": aligned,
        "engine": f"stable-ts:{args.model}",
        "wordCount": len(words),
    }
    Path(args.out).write_text(
        json.dumps(out, ensure_ascii=False), encoding="utf-8"
    )
    if not words:
        print("no stable-ts words — align will be unmatched", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
