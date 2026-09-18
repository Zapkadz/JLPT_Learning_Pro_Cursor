#!/usr/bin/env python3
"""Qwen3 ForcedAligner sidecar (KAI-070 optional via KAIWA_SCRIPT_ALIGN_ENGINE=qwen_fa)."""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

import torch

from align_line_map import words_to_line_segments

MODEL_ID = os.environ.get(
    "KAIWA_QWEN_FA_MODEL", "Qwen/Qwen3-ForcedAligner-0.6B"
)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--wav", required=True)
    ap.add_argument("--script", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--model", default=MODEL_ID)
    args = ap.parse_args()

    with open(args.script, encoding="utf-8") as f:
        payload = json.load(f)
    lines = payload.get("lines") or []
    if not lines:
        print("empty script lines", file=sys.stderr)
        return 2

    from qwen_asr import Qwen3ForcedAligner

    dtype = torch.float32
    device_map = "cpu"
    if torch.cuda.is_available():
        dtype = torch.bfloat16
        device_map = "cuda:0"

    model = Qwen3ForcedAligner.from_pretrained(
        args.model, dtype=dtype, device_map=device_map
    )
    text = "".join(lines)
    results = model.align(audio=str(args.wav), text=text, language="Japanese")
    raw0 = results[0]
    items = getattr(raw0, "items", raw0)
    words: list[dict] = []
    for it in list(items):
        if isinstance(it, dict):
            words.append(
                {
                    "word": str(it.get("text") or ""),
                    "start": float(it.get("start_time", 0)),
                    "end": float(it.get("end_time", 0)),
                }
            )
        else:
            words.append(
                {
                    "word": str(getattr(it, "text", "") or ""),
                    "start": float(getattr(it, "start_time", 0)),
                    "end": float(getattr(it, "end_time", 0)),
                }
            )

    aligned = words_to_line_segments(words, lines)
    out = {
        "segments": aligned,
        "engine": f"qwen-fa:{args.model}",
        "wordCount": len(words),
    }
    Path(args.out).write_text(
        json.dumps(out, ensure_ascii=False), encoding="utf-8"
    )
    if not words:
        print("no qwen words — align will be unmatched", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
