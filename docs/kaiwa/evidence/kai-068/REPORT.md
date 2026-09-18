# KAI-068 — stable-ts direct alignment spike (CPU)

Date: 2026-09-18  
Status: **DONE** (measured; TTS fixtures only)

## Environment

| Item | Value |
| --- | --- |
| Package | `stable-ts` 2.19.1 |
| Whisper model | `base` (`KAIWA_WHISPER_MODEL`) |
| Device | CPU |
| API | `model.align(audio, text, language="ja")` |
| Fixtures | KAI-066 `tts-clean-01/02`, `tts-longgap-01` |
| Script | `scripts/kaiwa/spike_stable_ts.py` |
| Note | Needs `ffmpeg` on **PATH** (WinError 2 without it). Pin `torchaudio==2.5.1` with torch 2.5.1 on this machine. |

## Results vs peers (median \|ΔspeechStart\|)

| Clip | Greedy (KAI-066) | Qwen FA (KAI-067) | **stable-ts (KAI-068)** | stable-ts latency |
| --- | --- | --- | --- | --- |
| tts-clean-01 | 198 ms | 68 ms | **28 ms** | 4.2 s |
| tts-clean-02 | 227 ms | 21 ms | **53 ms** | 0.75 s |
| tts-longgap-01 | 122 ms | 40 ms | **62 ms** | 1.4 s |

Unmatched lines: **0** on all three. Full JSON: `results.json`.

## Interpretation

- On this legal TTS mini-set, **stable-ts and Qwen FA are in the same ballpark** and both beat greedy Whisper-match.
- stable-ts is **much faster** cold-path than Qwen FA on CPU (no 120 s model load of Qwen thinker).
- Still **not** anime/BGM evidence. Do not pick production winner until KAI-069 + broader corpus.

## Next

- KAI-069 WhisperX JA CTC contrast (+ bake-off decision note).
