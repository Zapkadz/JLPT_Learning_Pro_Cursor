#!/usr/bin/env python3
"""
KAI-067 spike: Qwen3-ForcedAligner-0.6B on KAI-066 fixtures (CPU-first).

Uses the same GT + score_alignment helpers as bench_align.py.
Does NOT claim anime quality.

Usage:
  python scripts/kaiwa/spike_qwen_forced_align.py
"""

from __future__ import annotations

import json
import os
import re
import sys
import time
from pathlib import Path

import torch

ROOT = Path(__file__).resolve().parents[2]
EVIDENCE = ROOT / "docs" / "kaiwa" / "evidence" / "kai-067"
FIX = ROOT / "docs" / "kaiwa" / "evidence" / "kai-066" / "fixtures"
sys.path.insert(0, str(Path(__file__).resolve().parent))
from bench_align import score_alignment  # noqa: E402

MODEL_ID = os.environ.get(
    "KAIWA_QWEN_FA_MODEL", "Qwen/Qwen3-ForcedAligner-0.6B"
)


def normalize_ja(s: str) -> str:
    s = s.lower()
    return re.sub(r"[\s　、。．，,.！？!?「」『』（）()【】\[\]…・]+", "", s)


def items_to_line_segments(items: list, lines: list[str]) -> list[dict]:
    """Map Qwen token/char timings onto script lines (keep user ja text)."""
    if not items:
        return [
            {
                "ja": line,
                "startMs": None,
                "endMs": None,
                "timingStatus": "unmatched",
                "timingUncertain": True,
            }
            for line in lines
        ]

    # Flatten item text for greedy consume
    flat = []
    for it in items:
        text = getattr(it, "text", None)
        if text is None and isinstance(it, dict):
            text = it.get("text", "")
            start = float(it.get("start_time", 0))
            end = float(it.get("end_time", 0))
        else:
            start = float(getattr(it, "start_time", 0))
            end = float(getattr(it, "end_time", 0))
        flat.append({"text": str(text or ""), "start": start, "end": end})

    results = []
    wi = 0
    for line in lines:
        target = normalize_ja(line)
        if not target:
            continue
        if wi >= len(flat):
            results.append(
                {
                    "ja": line,
                    "startMs": None,
                    "endMs": None,
                    "timingStatus": "unmatched",
                    "timingUncertain": True,
                }
            )
            continue
        start_i = wi
        acc = ""
        end_i = wi
        while wi < len(flat):
            acc += normalize_ja(flat[wi]["text"])
            end_i = wi
            wi += 1
            if target in acc or acc.startswith(target):
                break
            if len(acc) > len(target) + 16:
                break
        span = flat[start_i : end_i + 1]
        covered = normalize_ja("".join(x["text"] for x in span))
        matched = target in covered or covered in target or (
            len(target) >= 2 and acc.startswith(target)
        )
        if not matched or not span:
            wi = start_i + 1 if start_i < len(flat) else wi
            results.append(
                {
                    "ja": line,
                    "startMs": None,
                    "endMs": None,
                    "timingStatus": "unmatched",
                    "timingUncertain": True,
                }
            )
            continue
        start_ms = int(round(span[0]["start"] * 1000))
        end_ms = int(round(span[-1]["end"] * 1000))
        if end_ms <= start_ms:
            end_ms = start_ms + 400
        results.append(
            {
                "ja": line,
                "startMs": start_ms,
                "endMs": end_ms,
                "timingStatus": "proposed",
                "timingUncertain": False,
            }
        )
    return results


def load_aligner():
    from qwen_asr import Qwen3ForcedAligner

    # CPU-first (this machine has no CUDA). Prefer float32 on CPU.
    dtype = torch.float32
    device_map = "cpu"
    print(f"Loading {MODEL_ID} dtype={dtype} device_map={device_map} ...")
    t0 = time.time()
    model = Qwen3ForcedAligner.from_pretrained(
        MODEL_ID,
        dtype=dtype,
        device_map=device_map,
    )
    print(f"load_sec={time.time() - t0:.1f}")
    return model


def run_clip(model, clip_id: str) -> dict:
    wav = FIX / f"{clip_id}.wav"
    gt_path = FIX / f"{clip_id}.gt.json"
    script_path = FIX / f"{clip_id}.script.txt"
    if not wav.exists() or not gt_path.exists():
        raise FileNotFoundError(clip_id)
    lines = [
        ln.strip()
        for ln in script_path.read_text(encoding="utf-8").splitlines()
        if ln.strip()
    ]
    gt = json.loads(gt_path.read_text(encoding="utf-8"))
    text = "".join(lines)  # script order, punctuation kept in lines join via empty?
    # Prefer joining with nothing for JA continuity; keep line punctuation from each line.
    text = "".join(lines)

    t0 = time.time()
    results = model.align(audio=str(wav), text=text, language="Japanese")
    latency = time.time() - t0
    # results[0] is ForcedAlignResult or list of items
    raw0 = results[0]
    items = getattr(raw0, "items", raw0)
    if hasattr(items, "items") and not isinstance(items, list):
        items = list(items)
    aligned = items_to_line_segments(list(items), lines)
    score = score_alignment(aligned, gt["segments"])
    return {
        "clipId": clip_id,
        "engine": MODEL_ID,
        "device": "cpu",
        "latencySec": round(latency, 2),
        **score,
        "aligned": aligned,
    }


def main() -> int:
    EVIDENCE.mkdir(parents=True, exist_ok=True)
    clips = ["tts-clean-01", "tts-clean-02", "tts-longgap-01"]
    model = load_aligner()
    out_clips = []
    for cid in clips:
        print("aligning", cid)
        try:
            row = run_clip(model, cid)
            out_clips.append(row)
            print(
                cid,
                "medianΔstart",
                row.get("medianAbsDeltaStartMs"),
                "unmatched",
                row.get("unmatchedLines"),
                "lat",
                row.get("latencySec"),
            )
        except Exception as e:
            out_clips.append(
                {
                    "clipId": cid,
                    "error": str(e)[:500],
                    "engine": MODEL_ID,
                    "device": "cpu",
                }
            )
            print("FAIL", cid, e)

    summary = {
        "generatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "model": MODEL_ID,
        "device": "cpu",
        "torch": torch.__version__,
        "cuda": torch.cuda.is_available(),
        "clips": out_clips,
        "note": "Legal TTS fixtures only; not anime. Map token timings → lines greedily.",
    }
    path = EVIDENCE / "results.json"
    path.write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    print("wrote", path)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
