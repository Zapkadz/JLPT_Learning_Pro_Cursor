# KAI-067 — Qwen3-ForcedAligner-0.6B spike (CPU)

Date: 2026-09-18  
Status: **DONE** (measured on this machine; TTS fixtures only)

## Environment

| Item | Value |
| --- | --- |
| Package | `qwen-asr` 0.0.6 |
| Model | `Qwen/Qwen3-ForcedAligner-0.6B` |
| Device | **CPU** (`torch.float32`, `device_map=cpu`) — no CUDA on this box |
| Torch | 2.5.1+cpu |
| Fixtures | KAI-066 legal TTS (`tts-clean-01/02`, `tts-longgap-01`) |
| Script | `scripts/kaiwa/spike_qwen_forced_align.py` |
| Scoring | Same `score_alignment` as `bench_align.py` (speech-window GT) |

Install note: `jinja2` had to be upgraded to ≥3.1 for import after `qwen-asr` pulled MarkupSafe 3.x.

## Results vs greedy baseline (KAI-066)

| Clip | Greedy median \|Δstart\| | **Qwen FA** median \|Δstart\| | Qwen unmatched | Qwen latency |
| --- | --- | --- | --- | --- |
| tts-clean-01 | 198 ms | **68 ms** | 0 | 26.6 s |
| tts-clean-02 | 227 ms | **21 ms** | 0 | 9.4 s |
| tts-longgap-01 | 122 ms | **40 ms** | 0 | 2.0 s |

Cold model load ~**120 s** on CPU. Full JSON: `results.json`.

## Interpretation

- On clean JA TTS with speech-window GT, **Qwen FA beats greedy Whisper-match** on start error for all three in-git packs; no unmatched lines.
- Still **not** an anime/BGM claim. Mapping is greedy token→line after align of concatenated script.
- CPU is usable for short clips; production may still want GPU worker later (ADR-021).

## Next

- KAI-068 stable-ts on the same fixtures for bake-off table.
- Do not swap production engine until KAI-068/069 + ADR amend.
