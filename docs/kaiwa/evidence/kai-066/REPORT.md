# KAI-066 — Benchmark harness + greedy baseline

Date: 2026-09-18  
Status: **DONE**

## Deliverables

| Item | Path |
| --- | --- |
| Spec | `BENCHMARK-SPEC.md` |
| Manifest schema | `manifest.schema.json` |
| 30-clip plan | `corpus.plan.json` (4 in-git + pending slots) |
| Harness | `scripts/kaiwa/bench_align.py` |
| npm | `npm run kaiwa:bench-align` |
| Fixtures (legal TTS) | `fixtures/tts-*.wav` + `.gt.json` |
| Synthetic stress | `fixtures/synth-kanji-kana-01.*` |
| Baseline | `baseline_greedy.json` |

## Honesty notes

- GT for TTS = **speechStart/speechEnd** from ffmpeg `silencedetect` on each line before concat — **not** whole-file duration (D5).
- Scoring calls **production** `align_script_sidecar.py` CLI (same as server).
- Categories reported separately (`clean_tts` / `long_gap` / `kanji_kana_stress`).
- Private/anime clips: fill pending slots with `inGit=false` paths outside repo.

## Baseline (Whisper `base`, this machine, 2026-09-18)

| Category | Clips | median \|ΔspeechStart\| | unmatched | cascadeSuspect |
| --- | --- | --- | --- | --- |
| clean_tts | 2 | **212.5 ms** | 0 | false |
| long_gap | 1 | **122 ms** | 0 | false |
| kanji_kana_stress | 1 | **3180 ms** (on the 1 “matched” line) | 1 | false |

Interpretation:

- Clean TTS starts are usable-ish but **not** yet ≤150 ms median target on speech GT.
- Long gap no longer end-stretches (KAI-065) — second line still lands near GT.
- Kanji/kana synthetic case still fails matching (line1 unmatched; line2 mis-timed) — bake-off engines must beat this.

Latency (sidecar wall): ~2.5–3.6 s/clip on this CPU for short packs.

## Verify

```bat
python scripts/kaiwa/bench_align.py --write-fixtures --run-baseline
```

## Next

- **KAI-067** Qwen3-ForcedAligner spike on the same fixtures / score path.
- Fill pending corpus slots when legal/private media available.
