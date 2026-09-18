#!/usr/bin/env python3
"""Shared JA normalize + word timings → script lines (KAI-070)."""

from __future__ import annotations

import re


def normalize_ja(s: str) -> str:
    s = s.lower()
    return re.sub(r"[\s　、。．，,.！？!?「」『』（）()【】\[\]…・]+", "", s)


def words_to_line_segments(
    words: list[dict],
    lines: list[str],
    *,
    text_key: str = "word",
) -> list[dict]:
    """Map [{word|text, start, end}] (seconds) onto script lines; keep user ja."""
    results: list[dict] = []
    wi = 0
    n = len(words)
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
            w = words[wi]
            acc += normalize_ja(str(w.get(text_key) or w.get("text") or w.get("word") or ""))
            end_i = wi
            wi += 1
            if target in acc or acc.startswith(target):
                break
            if len(acc) > len(target) + 16:
                break
        span = words[start_i : end_i + 1]
        covered = normalize_ja(
            "".join(
                str(x.get(text_key) or x.get("text") or x.get("word") or "")
                for x in span
            )
        )
        matched = target in covered or covered in target or (
            len(target) >= 2 and acc.startswith(target)
        )
        if not matched or not span:
            wi = min(start_i + 1, n)
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
            continue
        start_ms = int(round(float(span[0]["start"]) * 1000))
        end_ms = int(round(float(span[-1]["end"]) * 1000))
        if end_ms <= start_ms:
            end_ms = start_ms + 400
        uncertain = (
            target not in covered
            and covered not in target
            and (len(target) == 0 or len(covered) / max(len(target), 1) < 0.85)
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
    return results
