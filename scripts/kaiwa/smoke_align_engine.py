#!/usr/bin/env python3
"""KAI-075 — minimal forced-align smoke (load model + align 1 short line)."""

from __future__ import annotations

import argparse
import struct
import sys
import tempfile
import wave
from pathlib import Path


def write_silence_wav(path: Path, seconds: float = 0.6, sr: int = 16000) -> None:
    n = int(sr * seconds)
    with wave.open(str(path), "w") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes(struct.pack("<" + "h" * n, *([0] * n)))


def smoke_stable_ts(model_name: str) -> int:
    import stable_whisper

    with tempfile.TemporaryDirectory() as td:
        wav = Path(td) / "silence.wav"
        write_silence_wav(wav)
        model = stable_whisper.load_model(model_name, device="cpu")
        model.align(str(wav), "こんにちは", language="ja")
    print("smoke_ok:stable_ts")
    return 0


def smoke_qwen(model_name: str) -> int:
    import torch
    from qwen_asr import Qwen3ForcedAligner

    with tempfile.TemporaryDirectory() as td:
        wav = Path(td) / "silence.wav"
        write_silence_wav(wav)
        aligner = Qwen3ForcedAligner.from_pretrained(
            model_name,
            dtype=torch.float32,
            device_map="cpu",
        )
        aligner.align(audio=str(wav), text="こんにちは", language="ja")
    print("smoke_ok:qwen_fa")
    return 0


def smoke_whisper(model_name: str) -> int:
    from faster_whisper import WhisperModel

    with tempfile.TemporaryDirectory() as td:
        wav = Path(td) / "silence.wav"
        write_silence_wav(wav)
        model = WhisperModel(model_name, device="cpu", compute_type="int8")
        list(model.transcribe(str(wav), language="ja"))
    print("smoke_ok:whisper")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--engine", required=True, choices=["stable_ts", "qwen_fa", "whisper"])
    ap.add_argument("--model", default="base")
    args = ap.parse_args()
    try:
        if args.engine == "stable_ts":
            return smoke_stable_ts(args.model)
        if args.engine == "qwen_fa":
            return smoke_qwen(args.model)
        return smoke_whisper(args.model)
    except Exception as e:
        print(f"smoke_fail:{type(e).__name__}:{e}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
