# KAI-069 — WhisperX JA CTC contrast + bake-off note

Date: 2026-09-18  
Status: **DONE** (TTS fixtures only)

## Environment

| Item | Value |
| --- | --- |
| Package | `whisperx` 3.8.6 |
| Align | `load_align_model(language_code="ja")` + `whisperx.align` |
| Mode | One full-audio window + known concatenated script (forced-style) |
| Device | CPU |
| Script | `scripts/kaiwa/spike_whisperx_align.py` |
| Caveat | Install pulled `torch~=2.8.0` — may conflict with earlier spikes’ torch pins |

## Median \|ΔspeechStart\| bake-off (same GT)

| Clip | Greedy | Qwen FA | stable-ts | **WhisperX JA** |
| --- | --- | --- | --- | --- |
| tts-clean-01 | 198 | 68 | 28 | **13** |
| tts-clean-02 | 227 | **21** | 53 | 114 |
| tts-longgap-01 | 122 | **40** | 62 | 42.5 |

Unmatched: 0 for WhisperX on these three. Latency ~2–3.5 s/clip after ~30 s model load.

## Limitations (project docs + this run)

- Overlapping speech / OOV characters are known WhisperX weaknesses — **not** exercised here.
- Mapping still uses greedy token→line after CTC (same family of post-process as other spikes).
- **Not** anime/BGM evidence.

## Provisional recommendation (for KAI-070)

1. **Do not keep production greedy Whisper-match** as the quality path.
2. **Practical CPU default candidate: stable-ts** — competitive accuracy, fast, already Whisper-adjacent to current stack.
3. **Quality option: Qwen3-ForcedAligner** — strong on these clips; cold load ~2 min on CPU; better if GPU worker appears later.
4. **WhisperX** — keep as contrast / optional; mixed per-clip; heavier deps; torch pin pain.
5. **Swap production only in KAI-070** after adapter + draft-candidate path; re-measure on broader corpus (pending KAI-066 slots) before calling anime “fixed”.

## Next

- **KAI-070** integrate chosen engine (start with stable-ts adapter behind flag; optional Qwen).
