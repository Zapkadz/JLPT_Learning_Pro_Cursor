#!/usr/bin/env python3
"""KAI-065 regression: align_words_to_lines without Whisper (synthetic words)."""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from align_script_sidecar import align_words_to_lines


def test_no_end_stretch_across_30s_gap() -> None:
    words = [
        {"word": "こんにちは", "start": 0.5, "end": 1.0},
        {"word": "ありがとう", "start": 30.0, "end": 30.8},
    ]
    lines = ["こんにちは", "ありがとう"]
    r = align_words_to_lines(words, lines)
    assert r[0]["startMs"] is not None
    assert r[0]["endMs"] is not None
    # Must stay near speech (~1s + pad), NOT stretched to ~29.8s
    assert r[0]["endMs"] < 5000, r[0]
    assert r[0]["endMs"] - r[0]["startMs"] < 3000, r[0]
    assert r[1]["startMs"] is not None
    assert r[1]["startMs"] >= 29000


def test_kanji_kana_mismatch_does_not_swallow_all() -> None:
    # ASR emits kana; script uses kanji — old greedy could assign line0 a huge span.
    words = [
        {"word": "きょう", "start": 0.5, "end": 0.9},
        {"word": "は", "start": 0.9, "end": 1.0},
        {"word": "いい", "start": 2.0, "end": 2.3},
        {"word": "てんき", "start": 2.3, "end": 2.8},
        {"word": "ですね", "start": 2.8, "end": 3.2},
        {"word": "ありがとう", "start": 4.0, "end": 4.6},
    ]
    lines = ["今日はいい天気ですね", "ありがとう"]
    r = align_words_to_lines(words, lines)
    assert len(r) == 2
    # First line may be unmatched OR needs_review — must NOT claim end past line2 speech start
    if r[0]["endMs"] is not None and r[1]["startMs"] is not None:
        assert r[0]["endMs"] < r[1]["startMs"] + 500, r
    # Second line should still get a chance at timing when words remain
    # (either proposed/needs_review with times, or unmatched — but not both null solely because line0 ate all)
    statuses = {r[0].get("timingStatus"), r[1].get("timingStatus")}
    assert "unmatched" in statuses or r[1]["startMs"] is not None, r


def test_unmatched_keeps_null_times() -> None:
    words = [{"word": "hello", "start": 0.1, "end": 0.2}]
    lines = ["これはまったく別の日本語です"]
    r = align_words_to_lines(words, lines)
    assert r[0]["startMs"] is None
    assert r[0]["endMs"] is None
    assert r[0]["timingStatus"] == "unmatched"


def main() -> int:
    test_no_end_stretch_across_30s_gap()
    test_kanji_kana_mismatch_does_not_swallow_all()
    test_unmatched_keeps_null_times()
    print("align_regression_ok")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
