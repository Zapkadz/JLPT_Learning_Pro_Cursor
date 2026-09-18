#!/usr/bin/env python3
"""
KAI-052 spike: Whisper word-timestamps + keep user script text (Engine A).

Generates a short legal JA TTS fixture (edge-tts), builds known ground-truth
timings via ffmpeg concat + silence, then measures |Δstart|/|Δend| vs Whisper.

Usage (from repo root):
  set FFMPEG_PATH=%LOCALAPPDATA%\\Microsoft\\WinGet\\Links\\ffmpeg.exe
  python scripts/kaiwa/spike_script_align.py

Outputs under docs/kaiwa/evidence/kai-052/:
  fixtures/spike_ja.wav, fixtures/script.txt, results.json
"""

from __future__ import annotations

import asyncio
import json
import os
import re
import subprocess
import sys
import tempfile
from pathlib import Path

SCRIPT_LINES = [
    "こんにちは。",
    "今日はいい天気ですね。",
    "一緒に散歩しませんか。",
]
SILENCE_MS = 700
VOICE = "ja-JP-NanamiNeural"
WHISPER_MODEL = os.environ.get("KAIWA_WHISPER_MODEL", "base")


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
    raise SystemExit("ffmpeg not found — set FFMPEG_PATH")


def resolve_ffprobe(ffmpeg: str) -> str:
    p = Path(ffmpeg).with_name("ffprobe.exe")
    if p.exists():
        return str(p)
    p2 = Path(ffmpeg).with_name("ffprobe")
    if p2.exists():
        return str(p2)
    from shutil import which

    found = which("ffprobe")
    if found:
        return found
    raise SystemExit("ffprobe not found next to ffmpeg")


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


async def synth_line(text: str, out_mp3: Path) -> None:
    import edge_tts

    communicate = edge_tts.Communicate(text, VOICE)
    await communicate.save(str(out_mp3))


def normalize_ja(s: str) -> str:
    s = s.lower()
    s = re.sub(r"[\s　、。．，,.！？!?「」『』（）()]+", "", s)
    return s


def align_words_to_lines(
    words: list[dict], lines: list[str]
) -> list[dict]:
    """Greedy match; stretch ends into silence before next line (KAI-063)."""
    results = []
    wi = 0
    n = len(words)
    pad_start_ms = 80
    pad_end_ms = 80
    lead_before_next_ms = 80
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
                    "reason": "no_words_left",
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
                    "reason": "empty_span",
                }
            )
            continue
        start_ms = max(0, int(round(span[0]["start"] * 1000)) - pad_start_ms)
        end_ms = int(round(span[-1]["end"] * 1000)) + pad_end_ms
        if end_ms <= start_ms:
            end_ms = start_ms + 400
        covered = normalize_ja("".join(w["word"] for w in span))
        uncertain = target not in covered and not covered.startswith(
            target[: max(2, len(target) // 2)]
        )
        results.append(
            {
                "ja": line,
                "startMs": start_ms,
                "endMs": end_ms,
                "timingUncertain": uncertain,
                "whisperSpan": "".join(w["word"] for w in span),
            }
        )
    for i in range(len(results) - 1):
        cur = results[i]
        nxt = results[i + 1]
        if (
            cur.get("startMs") is None
            or cur.get("endMs") is None
            or nxt.get("startMs") is None
        ):
            continue
        soft_end = int(nxt["startMs"]) - lead_before_next_ms
        if soft_end <= cur["startMs"]:
            continue
        if cur["endMs"] < soft_end:
            cur["endMs"] = soft_end
        elif cur["endMs"] >= int(nxt["startMs"]):
            cur["endMs"] = soft_end
            cur["timingUncertain"] = True
    return results


def main() -> int:
    repo = Path(__file__).resolve().parents[2]
    out_dir = repo / "docs" / "kaiwa" / "evidence" / "kai-052"
    fix_dir = out_dir / "fixtures"
    fix_dir.mkdir(parents=True, exist_ok=True)

    ffmpeg = resolve_ffmpeg()
    ffprobe = resolve_ffprobe(ffmpeg)
    print(f"ffmpeg={ffmpeg}")
    print(f"model={WHISPER_MODEL}")

    with tempfile.TemporaryDirectory(prefix="kai052-") as tmp:
        tmp_path = Path(tmp)
        line_wavs: list[Path] = []
        gt: list[dict] = []
        cursor = 0

        for i, line in enumerate(SCRIPT_LINES):
            mp3 = tmp_path / f"line{i}.mp3"
            wav = tmp_path / f"line{i}.wav"
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
            dur = duration_ms(ffprobe, wav)
            gt.append(
                {
                    "ja": line,
                    "startMs": cursor,
                    "endMs": cursor + dur,
                }
            )
            line_wavs.append(wav)
            cursor += dur
            if i < len(SCRIPT_LINES) - 1:
                sil = tmp_path / f"sil{i}.wav"
                run(
                    [
                        ffmpeg,
                        "-y",
                        "-f",
                        "lavfi",
                        "-i",
                        f"anullsrc=r=16000:cl=mono",
                        "-t",
                        f"{SILENCE_MS / 1000:.3f}",
                        str(sil),
                    ]
                )
                line_wavs.append(sil)
                cursor += SILENCE_MS

        # concat
        list_file = tmp_path / "concat.txt"
        list_file.write_text(
            "".join(f"file '{p.as_posix()}'\n" for p in line_wavs),
            encoding="utf-8",
        )
        spike_wav = fix_dir / "spike_ja.wav"
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
                str(spike_wav),
            ]
        )

        (fix_dir / "script.txt").write_text(
            "\n".join(SCRIPT_LINES) + "\n", encoding="utf-8"
        )
        (fix_dir / "ground_truth.json").write_text(
            json.dumps(gt, ensure_ascii=False, indent=2), encoding="utf-8"
        )

        from faster_whisper import WhisperModel

        print("Loading Whisper (first run may download model)...")
        model = WhisperModel(WHISPER_MODEL, device="cpu", compute_type="int8")
        segments, info = model.transcribe(
            str(spike_wav),
            language="ja",
            word_timestamps=True,
            vad_filter=True,
        )
        words: list[dict] = []
        asr_text_parts: list[str] = []
        for seg in segments:
            asr_text_parts.append(seg.text)
            if seg.words:
                for w in seg.words:
                    words.append(
                        {
                            "word": w.word,
                            "start": float(w.start),
                            "end": float(w.end),
                        }
                    )

        aligned = align_words_to_lines(words, SCRIPT_LINES)

        deltas = []
        for a, g in zip(aligned, gt):
            if a["startMs"] is None or a["endMs"] is None:
                continue
            d_start = abs(a["startMs"] - g["startMs"])
            d_end = abs(a["endMs"] - g["endMs"])
            deltas.append(
                {
                    "ja": g["ja"],
                    "gtStartMs": g["startMs"],
                    "gtEndMs": g["endMs"],
                    "predStartMs": a["startMs"],
                    "predEndMs": a["endMs"],
                    "absDeltaStartMs": d_start,
                    "absDeltaEndMs": d_end,
                    "timingUncertain": a.get("timingUncertain", False),
                    "whisperSpan": a.get("whisperSpan"),
                }
            )

        def median(xs: list[int]) -> float | None:
            if not xs:
                return None
            s = sorted(xs)
            m = len(s) // 2
            return float(s[m]) if len(s) % 2 else (s[m - 1] + s[m]) / 2

        start_ds = [d["absDeltaStartMs"] for d in deltas]
        end_ds = [d["absDeltaEndMs"] for d in deltas]
        summary = {
            "engine": "faster-whisper+script-match",
            "model": WHISPER_MODEL,
            "language": info.language,
            "ffmpeg": ffmpeg,
            "voice": VOICE,
            "silenceGapMs": SILENCE_MS,
            "asrHypothesis": "".join(asr_text_parts).strip(),
            "lineCount": len(SCRIPT_LINES),
            "measuredLines": len(deltas),
            "medianAbsDeltaStartMs": median(start_ds),
            "medianAbsDeltaEndMs": median(end_ds),
            "maxAbsDeltaStartMs": max(start_ds) if start_ds else None,
            "maxAbsDeltaEndMs": max(end_ds) if end_ds else None,
            "keepUserScriptText": True,
            "deltas": deltas,
            "aligned": aligned,
            "groundTruth": gt,
        }

        results_path = out_dir / "results.json"
        results_path.write_text(
            json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8"
        )
        summary_print = {
            k: summary[k]
            for k in (
                "medianAbsDeltaStartMs",
                "medianAbsDeltaEndMs",
                "maxAbsDeltaStartMs",
                "maxAbsDeltaEndMs",
                "measuredLines",
                "asrHypothesis",
            )
        }
        sys.stdout.buffer.write(
            (json.dumps(summary_print, ensure_ascii=False, indent=2) + "\n").encode(
                "utf-8", errors="replace"
            )
        )
        print(f"wrote {results_path}")
        print(f"wrote {spike_wav}")
        return 0


if __name__ == "__main__":
    sys.exit(main())
