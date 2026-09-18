#!/usr/bin/env python3
"""
KAI-068 spike: stable-ts direct alignment on KAI-066 fixtures.

Usage:
  python scripts/kaiwa/spike_stable_ts.py
"""

from __future__ import annotations

import json
import os
import re
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
EVIDENCE = ROOT / "docs" / "kaiwa" / "evidence" / "kai-068"
FIX = ROOT / "docs" / "kaiwa" / "evidence" / "kai-066" / "fixtures"
sys.path.insert(0, str(Path(__file__).resolve().parent))
from bench_align import score_alignment  # noqa: E402

WHISPER_MODEL = os.environ.get("KAIWA_WHISPER_MODEL", "base")


def normalize_ja(s: str) -> str:
    s = s.lower()
    return re.sub(r"[\s　、。．，,.！？!?「」『』（）()【】\[\]…・]+", "", s)


def result_to_line_segments(result, lines: list[str]) -> list[dict]:
    words = []
    for seg in result.segments or []:
        for w in getattr(seg, "words", None) or []:
            words.append(
                {
                    "text": getattr(w, "word", "") or "",
                    "start": float(getattr(w, "start", 0) or 0),
                    "end": float(getattr(w, "end", 0) or 0),
                }
            )
    if not words and result.segments:
        for seg in result.segments:
            words.append(
                {
                    "text": getattr(seg, "text", "") or "",
                    "start": float(getattr(seg, "start", 0) or 0),
                    "end": float(getattr(seg, "end", 0) or 0),
                }
            )

    results = []
    wi = 0
    for line in lines:
        target = normalize_ja(line)
        if not target:
            continue
        if wi >= len(words):
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
        while wi < len(words):
            acc += normalize_ja(words[wi]["text"])
            end_i = wi
            wi += 1
            if target in acc or acc.startswith(target):
                break
            if len(acc) > len(target) + 16:
                break
        span = words[start_i : end_i + 1]
        covered = normalize_ja("".join(x["text"] for x in span))
        matched = target in covered or covered in target or (
            len(target) >= 2 and acc.startswith(target)
        )
        if not matched or not span:
            wi = min(start_i + 1, len(words))
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


def main() -> int:
    import stable_whisper

    EVIDENCE.mkdir(parents=True, exist_ok=True)
    print(f"Loading stable-ts Whisper {WHISPER_MODEL} ...")
    t0 = time.time()
    model = stable_whisper.load_model(WHISPER_MODEL, device="cpu")
    print(f"load_sec={time.time() - t0:.1f}")

    out_clips = []
    for clip_id in ("tts-clean-01", "tts-clean-02", "tts-longgap-01"):
        wav = FIX / f"{clip_id}.wav"
        gt = json.loads((FIX / f"{clip_id}.gt.json").read_text(encoding="utf-8"))
        lines = [
            ln.strip()
            for ln in (FIX / f"{clip_id}.script.txt")
            .read_text(encoding="utf-8")
            .splitlines()
            if ln.strip()
        ]
        text = "\n".join(lines)
        print("aligning", clip_id)
        t1 = time.time()
        try:
            result = model.align(str(wav), text, language="ja")
            latency = time.time() - t1
            aligned = result_to_line_segments(result, lines)
            score = score_alignment(aligned, gt["segments"])
            row = {
                "clipId": clip_id,
                "engine": f"stable-ts:{WHISPER_MODEL}",
                "device": "cpu",
                "latencySec": round(latency, 2),
                **score,
                "aligned": aligned,
            }
            out_clips.append(row)
            print(
                clip_id,
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
                    "clipId": clip_id,
                    "error": str(e)[:800],
                    "engine": f"stable-ts:{WHISPER_MODEL}",
                }
            )
            print("FAIL", clip_id, e)

    summary = {
        "generatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "engine": f"stable-ts:{WHISPER_MODEL}",
        "device": "cpu",
        "clips": out_clips,
        "note": "Legal TTS only; stable-ts model.align(audio, text)",
    }
    path = EVIDENCE / "results.json"
    path.write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    print("wrote", path)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
