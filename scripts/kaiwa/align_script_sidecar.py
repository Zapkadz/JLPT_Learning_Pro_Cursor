#!/usr/bin/env python3
"""Whisper word-timestamp align sidecar for KAI-053/061 (keeps user script text)."""

from __future__ import annotations

import argparse
import json
import re
import sys


def normalize_ja(s: str) -> str:
    s = s.lower()
    s = re.sub(r"[\s　、。．，,.！？!?「」『』（）()【】\[\]…・]+", "", s)
    return s


def align_words_to_lines(words: list[dict], lines: list[str]) -> list[dict]:
    """Greedy match; keep script text; pad ends slightly for speakable windows."""
    results = []
    wi = 0
    n = len(words)
    pad_ms = 120
    for line in lines:
        target = normalize_ja(line)
        if not target:
            continue
        if wi >= n:
            results.append(
                {
                    "ja": line,
                    "startMs": None,
                    "endMs": None,
                    "timingUncertain": True,
                }
            )
            continue
        start_i = wi
        acc = ""
        end_i = wi
        while wi < n and target not in acc and not (
            len(acc) >= 2 and target.startswith(acc)
        ):
            acc += normalize_ja(words[wi]["word"])
            end_i = wi
            wi += 1
            if len(acc) > len(target) + 16:
                break
            if target in acc or acc.startswith(target):
                break
        if start_i == end_i and wi == start_i and wi < n:
            end_i = wi
            wi += 1
        span = words[start_i : end_i + 1]
        if not span:
            results.append(
                {
                    "ja": line,
                    "startMs": None,
                    "endMs": None,
                    "timingUncertain": True,
                }
            )
            continue
        start_ms = max(0, int(round(span[0]["start"] * 1000)) - pad_ms)
        end_ms = int(round(span[-1]["end"] * 1000)) + pad_ms
        if end_ms <= start_ms:
            end_ms = start_ms + 400
        covered = normalize_ja("".join(w["word"] for w in span))
        ratio = 0.0
        if target and covered:
            # crude overlap: shared prefix length / max len
            m = 0
            for a, b in zip(target, covered):
                if a == b:
                    m += 1
                else:
                    break
            ratio = m / max(len(target), 1)
        uncertain = (
            target not in covered
            and covered not in target
            and ratio < 0.5
        )
        results.append(
            {
                "ja": line,
                "startMs": start_ms,
                "endMs": end_ms,
                "timingUncertain": uncertain,
            }
        )
    return results


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

    from faster_whisper import WhisperModel

    model = WhisperModel(args.model, device="cpu", compute_type="int8")
    # Use known script as initial prompt to bias ASR toward user dialogue
    prompt = " ".join(lines[:8])[:224]
    segments, _info = model.transcribe(
        args.wav,
        language="ja",
        word_timestamps=True,
        vad_filter=True,
        vad_parameters=dict(min_silence_duration_ms=350),
        condition_on_previous_text=False,
        beam_size=5,
        initial_prompt=prompt,
    )
    words: list[dict] = []
    for seg in segments:
        if seg.words:
            for w in seg.words:
                words.append(
                    {
                        "word": w.word,
                        "start": float(w.start),
                        "end": float(w.end),
                    }
                )

    aligned = align_words_to_lines(words, lines)
    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(
            {
                "segments": aligned,
                "engine": f"faster-whisper:{args.model}",
                "wordCount": len(words),
            },
            f,
            ensure_ascii=False,
        )
    if not words:
        print("no whisper words — align will be uncertain", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
