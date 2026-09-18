#!/usr/bin/env python3
"""
KAI-069 contrast: WhisperX Japanese CTC align on KAI-066 fixtures.

Forced-align style: one full-audio window + known script text → word timings → lines.
Documents vocab/overlap limits; does not claim anime quality.

Usage:
  set PATH to include ffmpeg
  python scripts/kaiwa/spike_whisperx_align.py
"""

from __future__ import annotations

import json
import re
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
EVIDENCE = ROOT / "docs" / "kaiwa" / "evidence" / "kai-069"
FIX = ROOT / "docs" / "kaiwa" / "evidence" / "kai-066" / "fixtures"
sys.path.insert(0, str(Path(__file__).resolve().parent))
from bench_align import score_alignment  # noqa: E402


def normalize_ja(s: str) -> str:
    s = s.lower()
    return re.sub(r"[\s　、。．，,.！？!?「」『』（）()【】\[\]…・]+", "", s)


def words_to_line_segments(words: list[dict], lines: list[str]) -> list[dict]:
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
            acc += normalize_ja(words[wi].get("word") or words[wi].get("text") or "")
            end_i = wi
            wi += 1
            if target in acc or acc.startswith(target):
                break
            if len(acc) > len(target) + 16:
                break
        span = words[start_i : end_i + 1]
        covered = normalize_ja(
            "".join((x.get("word") or x.get("text") or "") for x in span)
        )
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
        start_ms = int(round(float(span[0]["start"]) * 1000))
        end_ms = int(round(float(span[-1]["end"]) * 1000))
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
    import whisperx

    EVIDENCE.mkdir(parents=True, exist_ok=True)
    device = "cpu"
    print("Loading WhisperX JA align model ...")
    t0 = time.time()
    model_a, metadata = whisperx.load_align_model(
        language_code="ja", device=device
    )
    print(f"load_sec={time.time() - t0:.1f} meta_keys={list(metadata.keys()) if isinstance(metadata, dict) else type(metadata)}")

    out_clips = []
    for clip_id in ("tts-clean-01", "tts-clean-02", "tts-longgap-01"):
        wav = str(FIX / f"{clip_id}.wav")
        gt = json.loads((FIX / f"{clip_id}.gt.json").read_text(encoding="utf-8"))
        lines = [
            ln.strip()
            for ln in (FIX / f"{clip_id}.script.txt")
            .read_text(encoding="utf-8")
            .splitlines()
            if ln.strip()
        ]
        print("aligning", clip_id)
        t1 = time.time()
        try:
            audio = whisperx.load_audio(wav)
            duration = len(audio) / 16000.0
            segments = [
                {
                    "start": 0.0,
                    "end": duration,
                    "text": "".join(lines),
                }
            ]
            aligned_raw = whisperx.align(
                segments,
                model_a,
                metadata,
                audio,
                device,
                return_char_alignments=False,
            )
            latency = time.time() - t1
            word_list = []
            for seg in aligned_raw.get("segments") or []:
                for w in seg.get("words") or []:
                    if w.get("start") is None or w.get("end") is None:
                        continue
                    word_list.append(
                        {
                            "word": w.get("word") or "",
                            "start": float(w["start"]),
                            "end": float(w["end"]),
                        }
                    )
            aligned = words_to_line_segments(word_list, lines)
            score = score_alignment(aligned, gt["segments"])
            row = {
                "clipId": clip_id,
                "engine": "whisperx:ja-ctc",
                "device": device,
                "latencySec": round(latency, 2),
                "wordCount": len(word_list),
                **score,
                "aligned": aligned,
            }
            out_clips.append(row)
            print(
                clip_id,
                "median_dstart",
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
                    "engine": "whisperx:ja-ctc",
                }
            )
            print("FAIL", clip_id, e)

    summary = {
        "generatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "engine": "whisperx:ja-ctc",
        "device": device,
        "clips": out_clips,
        "limitations": [
            "WhisperX documents issues with overlapping speech and OOV characters",
            "This spike uses one full-window segment + known script (not ASR-first)",
            "Legal TTS only — not anime/BGM",
        ],
        "provisionalBakeOff": {
            "preferForQualityOnCleanTts": "Qwen3-ForcedAligner or stable-ts (similar accuracy)",
            "preferForCpuLatency": "stable-ts",
            "contrastOnly": "whisperx",
            "doNotSwapProductionUntil": "KAI-070 + broader corpus / anime sample outside git",
        },
    }
    path = EVIDENCE / "results.json"
    path.write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    print("wrote", path)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
