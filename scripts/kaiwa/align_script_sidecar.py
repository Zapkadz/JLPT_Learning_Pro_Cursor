#!/usr/bin/env python3
"""Whisper word-timestamp align sidecar (KAI-053/061; KAI-065: no end-stretch, honest unmatched)."""

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
    """Greedy match; keep script text; do NOT stretch ends into next-line gaps (KAI-065).

    Unmatched / failed lines keep startMs/endMs = null and timingStatus=unmatched.
    Overlapping windows are clamped (not stretched).
    """
    results: list[dict] = []
    wi = 0
    n = len(words)
    pad_start_ms = 80
    pad_end_ms = 80
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
                    "timingStatus": "unmatched",
                    "matchReason": "no_words_left",
                }
            )
            continue
        start_i = wi
        acc = ""
        end_i = wi
        while wi < n:
            acc += normalize_ja(words[wi]["word"])
            end_i = wi
            wi += 1
            if target in acc or acc.startswith(target):
                break
            if len(acc) > len(target) + 16:
                break
        span = words[start_i : end_i + 1]
        if not span:
            results.append(
                {
                    "ja": line,
                    "startMs": None,
                    "endMs": None,
                    "timingUncertain": True,
                    "timingStatus": "unmatched",
                    "matchReason": "empty_span",
                }
            )
            continue
        start_ms = max(0, int(round(span[0]["start"] * 1000)) - pad_start_ms)
        end_ms = int(round(span[-1]["end"] * 1000)) + pad_end_ms
        if end_ms <= start_ms:
            end_ms = start_ms + 400
        covered = normalize_ja("".join(w["word"] for w in span))
        ratio = 0.0
        if target and covered:
            m = 0
            for a, b in zip(target, covered):
                if a == b:
                    m += 1
                else:
                    break
            ratio = m / max(len(target), 1)
        matched = (
            target in covered
            or covered in target
            or ratio >= 0.5
            or (len(target) >= 2 and acc.startswith(target))
        )
        if not matched:
            # Do not consume future lines' audio as a fake success window.
            # Rewind word cursor so later lines can still try.
            wi = start_i
            results.append(
                {
                    "ja": line,
                    "startMs": None,
                    "endMs": None,
                    "timingUncertain": True,
                    "timingStatus": "unmatched",
                    "matchReason": "text_mismatch",
                }
            )
            # Advance at least one word to avoid infinite loop on stubborn mismatch.
            if wi < n:
                wi += 1
            continue
        uncertain = (
            target not in covered
            and covered not in target
            and ratio < 0.85
        )
        results.append(
            {
                "ja": line,
                "startMs": start_ms,
                "endMs": end_ms,
                "timingUncertain": uncertain,
                "timingStatus": "needs_review" if uncertain else "proposed",
                "matchReason": "ok",
            }
        )

    # Clamp overlaps only (never stretch into silence toward next line).
    for i in range(len(results) - 1):
        cur = results[i]
        nxt = results[i + 1]
        if (
            cur.get("startMs") is None
            or cur.get("endMs") is None
            or nxt.get("startMs") is None
        ):
            continue
        max_end = int(nxt["startMs"]) - 1
        if cur["endMs"] > max_end and max_end > cur["startMs"]:
            cur["endMs"] = max_end
            cur["timingUncertain"] = True
            if cur.get("timingStatus") == "proposed":
                cur["timingStatus"] = "needs_review"
            cur["matchReason"] = "clamped_overlap"
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
