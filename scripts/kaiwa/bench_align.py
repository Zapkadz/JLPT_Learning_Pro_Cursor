#!/usr/bin/env python3
"""
KAI-066 forced-align benchmark harness.

- Uses production align_script_sidecar.align_words_to_lines + Whisper path
- GT speech windows via silencedetect on per-line TTS (not whole-file duration)
- Writes fixtures + baseline_greedy.json under docs/kaiwa/evidence/kai-066/

Usage (repo root):
  set FFMPEG_PATH=...
  python scripts/kaiwa/bench_align.py --write-fixtures --run-baseline
"""

from __future__ import annotations

import argparse
import asyncio
import json
import os
import statistics
import subprocess
import sys
import tempfile
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
EVIDENCE = ROOT / "docs" / "kaiwa" / "evidence" / "kai-066"
FIX = EVIDENCE / "fixtures"
sys.path.insert(0, str(Path(__file__).resolve().parent))
from align_script_sidecar import align_words_to_lines  # noqa: E402

VOICE = "ja-JP-NanamiNeural"
WHISPER_MODEL = os.environ.get("KAIWA_WHISPER_MODEL", "base")
GAP_CLEAN_MS = 600
GAP_LONG_MS = 3000

PACKS = {
    "tts-clean-01": {
        "category": "clean_tts",
        "lines": [
            "こんにちは。",
            "今日はいい天気ですね。",
            "一緒に散歩しませんか。",
        ],
        "gapMs": GAP_CLEAN_MS,
    },
    "tts-clean-02": {
        "category": "clean_tts",
        "lines": [
            "おはようございます。",
            "コーヒーを一杯ください。",
            "ありがとうございます。",
        ],
        "gapMs": GAP_CLEAN_MS,
    },
    "tts-longgap-01": {
        "category": "long_gap",
        "lines": [
            "こんにちは。",
            "しばらくぶりですね。",
        ],
        "gapMs": GAP_LONG_MS,
    },
}


def resolve_ffmpeg() -> str:
    env = os.environ.get("FFMPEG_PATH") or os.environ.get("KAIWA_FFMPEG_PATH")
    if env and Path(env).exists():
        return env
    winget = (
        Path(os.environ.get("LOCALAPPDATA", ""))
        / "Microsoft"
        / "WinGet"
        / "Links"
        / "ffmpeg.exe"
    )
    if winget.exists():
        return str(winget)
    from shutil import which

    found = which("ffmpeg")
    if found:
        return found
    raise SystemExit("ffmpeg not found")


def resolve_ffprobe(ffmpeg: str) -> str:
    for name in ("ffprobe.exe", "ffprobe"):
        p = Path(ffmpeg).with_name(name)
        if p.exists():
            return str(p)
    from shutil import which

    found = which("ffprobe")
    if found:
        return found
    raise SystemExit("ffprobe not found")


def run(cmd: list[str]) -> None:
    subprocess.run(cmd, check=True, capture_output=True)


def duration_ms(ffprobe: str, path: Path) -> int:
    out = subprocess.check_output(
        [
            ffprobe,
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=noprint_wrappers=1:nokey=1",
            str(path),
        ],
        text=True,
    ).strip()
    return int(round(float(out) * 1000))


def speech_bounds_ms(ffmpeg: str, wav: Path, total_ms: int) -> tuple[int, int]:
    """Return approximate speech start/end via silencedetect; fallback full file."""
    noise = "-30dB"
    dur = "0.15"
    proc = subprocess.run(
        [
            ffmpeg,
            "-hide_banner",
            "-i",
            str(wav),
            "-af",
            f"silencedetect=noise={noise}:d={dur}",
            "-f",
            "null",
            "-",
        ],
        capture_output=True,
        text=True,
    )
    err = proc.stderr or ""
    silence_starts: list[float] = []
    silence_ends: list[float] = []
    for line in err.splitlines():
        if "silence_start:" in line:
            try:
                silence_starts.append(float(line.split("silence_start:")[1].split()[0]))
            except (IndexError, ValueError):
                pass
        if "silence_end:" in line:
            try:
                silence_ends.append(float(line.split("silence_end:")[1].split()[0]))
            except (IndexError, ValueError):
                pass

    # Heuristic: speech starts at first silence_end (after leading silence),
    # or 0 if no leading silence; ends at last silence_start before EOF or total.
    start_s = 0.0
    if silence_ends and (not silence_starts or silence_starts[0] < 0.05):
        start_s = silence_ends[0]
    elif silence_ends and silence_starts and silence_starts[0] > 0.05:
        # audio begins with speech then silence
        start_s = 0.0

    end_s = total_ms / 1000.0
    if silence_starts:
        # last silence that begins before end → speech ended there
        for s in reversed(silence_starts):
            if s > start_s + 0.05:
                end_s = s
                break

    start_ms = max(0, int(round(start_s * 1000)))
    end_ms = min(total_ms, int(round(end_s * 1000)))
    if end_ms <= start_ms + 50:
        return 0, total_ms
    return start_ms, end_ms


async def synth_line(text: str, out_mp3: Path) -> None:
    import edge_tts

    await edge_tts.Communicate(text, VOICE).save(str(out_mp3))


def build_pack(
    ffmpeg: str,
    ffprobe: str,
    clip_id: str,
    lines: list[str],
    gap_ms: int,
    out_dir: Path,
) -> dict:
    out_dir.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="kai066-") as tmp:
        tmp_path = Path(tmp)
        pieces: list[Path] = []
        gt_segments: list[dict] = []
        cursor = 0
        for i, line in enumerate(lines):
            mp3 = tmp_path / f"l{i}.mp3"
            wav = tmp_path / f"l{i}.wav"
            asyncio.run(synth_line(line, mp3))
            run(
                [
                    ffmpeg,
                    "-y",
                    "-i",
                    str(mp3),
                    "-ac",
                    "1",
                    "-ar",
                    "16000",
                    str(wav),
                ]
            )
            file_ms = duration_ms(ffprobe, wav)
            local_start, local_end = speech_bounds_ms(ffmpeg, wav, file_ms)
            gt_segments.append(
                {
                    "ja": line,
                    "speechStartMs": cursor + local_start,
                    "speechEndMs": cursor + local_end,
                    "fileDurationMs": file_ms,
                    "gtMethod": "silencedetect_tts",
                }
            )
            pieces.append(wav)
            cursor += file_ms
            if i < len(lines) - 1:
                sil = tmp_path / f"sil{i}.wav"
                run(
                    [
                        ffmpeg,
                        "-y",
                        "-f",
                        "lavfi",
                        "-i",
                        "anullsrc=r=16000:cl=mono",
                        "-t",
                        f"{gap_ms / 1000:.3f}",
                        str(sil),
                    ]
                )
                pieces.append(sil)
                cursor += gap_ms

        list_file = tmp_path / "concat.txt"
        list_file.write_text(
            "".join(f"file '{p.as_posix()}'\n" for p in pieces),
            encoding="utf-8",
        )
        wav_out = out_dir / f"{clip_id}.wav"
        run(
            [
                ffmpeg,
                "-y",
                "-f",
                "concat",
                "-safe",
                "0",
                "-i",
                str(list_file),
                "-c",
                "copy",
                str(wav_out),
            ]
        )
        gt_path = out_dir / f"{clip_id}.gt.json"
        script_path = out_dir / f"{clip_id}.script.txt"
        script_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
        payload = {
            "clipId": clip_id,
            "gtMethod": "silencedetect_tts",
            "segments": gt_segments,
            "totalMs": cursor,
            "gapMs": gap_ms,
            "voice": VOICE,
            "honesty": "speechStart/End from silencedetect per line; not whole-file duration",
        }
        gt_path.write_text(
            json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8"
        )
        return {
            "clipId": clip_id,
            "wav": str(wav_out),
            "gt": str(gt_path),
            "script": str(script_path),
            "lines": lines,
        }


def write_synthetic_kanji_case(out_dir: Path) -> dict:
    """Word-level synthetic stress (no audio) — scores via align_words_to_lines only."""
    out_dir.mkdir(parents=True, exist_ok=True)
    clip_id = "synth-kanji-kana-01"
    words = [
        {"word": "きょう", "start": 0.5, "end": 0.9},
        {"word": "は", "start": 0.9, "end": 1.0},
        {"word": "いい", "start": 2.0, "end": 2.3},
        {"word": "てんき", "start": 2.3, "end": 2.8},
        {"word": "ですね", "start": 2.8, "end": 3.2},
        {"word": "ありがとう", "start": 4.0, "end": 4.6},
    ]
    lines = ["今日はいい天気ですね", "ありがとう"]
    gt = {
        "clipId": clip_id,
        "gtMethod": "synthetic_words",
        "segments": [
            {
                "ja": lines[0],
                "speechStartMs": 500,
                "speechEndMs": 3200,
                "gtMethod": "synthetic_words",
            },
            {
                "ja": lines[1],
                "speechStartMs": 4000,
                "speechEndMs": 4600,
                "gtMethod": "synthetic_words",
            },
        ],
        "words": words,
    }
    path = out_dir / f"{clip_id}.gt.json"
    path.write_text(json.dumps(gt, ensure_ascii=False, indent=2), encoding="utf-8")
    (out_dir / f"{clip_id}.script.txt").write_text(
        "\n".join(lines) + "\n", encoding="utf-8"
    )
    return {"clipId": clip_id, "gt": str(path), "lines": lines, "words": words}


def score_alignment(
    aligned: list[dict], gt_segments: list[dict]
) -> dict:
    deltas_start: list[int] = []
    deltas_end: list[int] = []
    matched = 0
    unmatched = 0
    rows = []
    for a, g in zip(aligned, gt_segments):
        status = a.get("timingStatus") or (
            "unmatched" if a.get("startMs") is None else "proposed"
        )
        if a.get("startMs") is None or a.get("endMs") is None or status == "unmatched":
            unmatched += 1
            rows.append(
                {
                    "ja": g["ja"],
                    "status": "unmatched",
                    "gtSpeechStartMs": g["speechStartMs"],
                    "gtSpeechEndMs": g["speechEndMs"],
                }
            )
            continue
        matched += 1
        ds = abs(int(a["startMs"]) - int(g["speechStartMs"]))
        de = abs(int(a["endMs"]) - int(g["speechEndMs"]))
        deltas_start.append(ds)
        deltas_end.append(de)
        rows.append(
            {
                "ja": g["ja"],
                "status": status,
                "predStartMs": a["startMs"],
                "predEndMs": a["endMs"],
                "gtSpeechStartMs": g["speechStartMs"],
                "gtSpeechEndMs": g["speechEndMs"],
                "absDeltaStartMs": ds,
                "absDeltaEndMs": de,
            }
        )

    def pct(vals: list[int], p: float) -> float | None:
        if not vals:
            return None
        s = sorted(vals)
        idx = min(len(s) - 1, max(0, int(round((p / 100) * (len(s) - 1)))))
        return float(s[idx])

    # cascade suspect: first line window covers later GT starts while later unmatched
    cascade = False
    if aligned and gt_segments and aligned[0].get("endMs") is not None:
        if len(gt_segments) > 1 and aligned[0]["endMs"] > gt_segments[1]["speechStartMs"] + 500:
            if any(
                (a.get("startMs") is None) for a in aligned[1:]
            ):
                cascade = True

    return {
        "matchedLines": matched,
        "unmatchedLines": unmatched,
        "cascadeSuspect": cascade,
        "medianAbsDeltaStartMs": float(statistics.median(deltas_start))
        if deltas_start
        else None,
        "medianAbsDeltaEndMs": float(statistics.median(deltas_end))
        if deltas_end
        else None,
        "p95AbsDeltaStartMs": pct(deltas_start, 95),
        "p95AbsDeltaEndMs": pct(deltas_end, 95),
        "lines": rows,
    }


def run_whisper_sidecar(
    ffmpeg: str, wav: Path, lines: list[str], model: str
) -> tuple[list[dict], float]:
    script = {"lines": lines}
    with tempfile.TemporaryDirectory(prefix="kai066-run-") as tmp:
        tmp_path = Path(tmp)
        script_path = tmp_path / "script.json"
        out_path = tmp_path / "out.json"
        script_path.write_text(json.dumps(script, ensure_ascii=False), encoding="utf-8")
        sidecar = Path(__file__).resolve().parent / "align_script_sidecar.py"
        t0 = time.time()
        proc = subprocess.run(
            [
                sys.executable,
                str(sidecar),
                "--wav",
                str(wav),
                "--script",
                str(script_path),
                "--out",
                str(out_path),
                "--model",
                model,
            ],
            capture_output=True,
            text=True,
            env={**os.environ, "PYTHONIOENCODING": "utf-8"},
        )
        latency = time.time() - t0
        if proc.returncode != 0:
            raise RuntimeError(
                f"sidecar failed: {proc.stderr[:500] or proc.stdout[:500]}"
            )
        raw = json.loads(out_path.read_text(encoding="utf-8"))
        return raw.get("segments") or [], latency


def run_baseline(ffmpeg: str, ffprobe: str) -> dict:
    FIX.mkdir(parents=True, exist_ok=True)
    clips_out = []
    # synthetic first (no whisper)
    syn = write_synthetic_kanji_case(FIX)
    gt = json.loads(Path(syn["gt"]).read_text(encoding="utf-8"))
    aligned = align_words_to_lines(gt["words"], syn["lines"])
    syn_score = score_alignment(aligned, gt["segments"])
    clips_out.append(
        {
            "clipId": syn["clipId"],
            "category": "kanji_kana_stress",
            "engine": "production_align_words_to_lines",
            "latencySec": 0,
            **syn_score,
        }
    )

    for clip_id, meta in PACKS.items():
        built = build_pack(
            ffmpeg,
            ffprobe,
            clip_id,
            meta["lines"],
            meta["gapMs"],
            FIX,
        )
        gt = json.loads(Path(built["gt"]).read_text(encoding="utf-8"))
        segs, latency = run_whisper_sidecar(
            ffmpeg, Path(built["wav"]), built["lines"], WHISPER_MODEL
        )
        score = score_alignment(segs, gt["segments"])
        clips_out.append(
            {
                "clipId": clip_id,
                "category": meta["category"],
                "engine": f"faster-whisper:{WHISPER_MODEL}+production_sidecar",
                "latencySec": round(latency, 2),
                **score,
            }
        )

    by_cat: dict[str, list] = {}
    for c in clips_out:
        by_cat.setdefault(c["category"], []).append(c)

    summary = {
        "generatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "whisperModel": WHISPER_MODEL,
        "honesty": "GT=silencedetect_tts speech windows or synthetic_words; production sidecar",
        "clips": clips_out,
        "byCategory": {
            cat: {
                "clipCount": len(items),
                "medianAbsDeltaStartMs": statistics.median(
                    [
                        x["medianAbsDeltaStartMs"]
                        for x in items
                        if x["medianAbsDeltaStartMs"] is not None
                    ]
                )
                if any(x["medianAbsDeltaStartMs"] is not None for x in items)
                else None,
                "unmatchedTotal": sum(x["unmatchedLines"] for x in items),
                "cascadeSuspectAny": any(x["cascadeSuspect"] for x in items),
            }
            for cat, items in by_cat.items()
        },
    }
    out = EVIDENCE / "baseline_greedy.json"
    out.write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(summary["byCategory"], ensure_ascii=False, indent=2))
    print("wrote", out)
    return summary


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--write-fixtures", action="store_true")
    ap.add_argument("--run-baseline", action="store_true")
    args = ap.parse_args()
    if not args.write_fixtures and not args.run_baseline:
        ap.print_help()
        return 2
    ffmpeg = resolve_ffmpeg()
    ffprobe = resolve_ffprobe(ffmpeg)
    print(f"ffmpeg={ffmpeg} model={WHISPER_MODEL}")
    if args.write_fixtures and not args.run_baseline:
        FIX.mkdir(parents=True, exist_ok=True)
        for clip_id, meta in PACKS.items():
            build_pack(
                ffmpeg, ffprobe, clip_id, meta["lines"], meta["gapMs"], FIX
            )
            print("wrote pack", clip_id)
        write_synthetic_kanji_case(FIX)
        print("wrote synth-kanji-kana-01")
        return 0
    if args.run_baseline:
        run_baseline(ffmpeg, ffprobe)
    return 0


if __name__ == "__main__":
    # Fix: run_whisper_sidecar returns tuple — patch callers already unpack
    raise SystemExit(main())
