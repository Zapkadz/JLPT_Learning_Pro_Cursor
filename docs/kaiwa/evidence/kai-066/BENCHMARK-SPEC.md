# KAI-066 — Forced-align benchmark harness

Date: 2026-09-18  
Status: **DONE** (harness + legal mini-set + greedy baseline). Full 30-clip corpus = plan only until media arrives (outside git).

## 1. Goals

1. Evaluate align engines with the **same production adapter** (`scripts/kaiwa/align_script_sidecar.py`).
2. Ground truth = **speech windows**, not whole-file TTS duration (fixes D5).
3. Schema ready for ≥30 clips / ~300 lines; personal/anime media stays **out of git**.
4. Record **baseline** of current greedy Whisper-match (post–KAI-065).

## 2. Layout

| Path | Role |
| --- | --- |
| `scripts/kaiwa/bench_align.py` | Generate legal TTS pack + run sidecar + score |
| `docs/kaiwa/evidence/kai-066/manifest.schema.json` | Clip manifest schema |
| `docs/kaiwa/evidence/kai-066/corpus.plan.json` | 30-clip target plan (slots; many `pending`) |
| `docs/kaiwa/evidence/kai-066/fixtures/` | In-git legal mini fixtures (generated) |
| `docs/kaiwa/evidence/kai-066/baseline_greedy.json` | Latest baseline metrics |
| `docs/kaiwa/evidence/kai-066/REPORT.md` | This report |

External clips: point `audioPath` / `groundTruthPath` to absolute paths under a local folder (e.g. `%USERPROFILE%/kaiwa-bench-private/`). Never commit those files.

## 3. Ground-truth method (in-git TTS)

For each script line:

1. Synthesize with `edge-tts` (`ja-JP-NanamiNeural`).
2. Convert to mono 16 kHz WAV.
3. Detect **speech** start/end via `silencedetect` (ffmpeg) on that line alone — **not** “duration of file including lead-in silence”.
4. Concatenate lines with fixed silence gaps; map speech windows onto the concat timeline.

GT fields per line: `speechStartMs`, `speechEndMs`, `ja`, `gtMethod=silencedetect_tts`.

Human waveform GT for anime/user clips: fill the same fields by ear; set `gtMethod=waveform_human`.

## 4. Metrics

Per clip / aggregate:

- `matchedLines` / `unmatchedLines` / `cascadeSuspect` (unmatched streak after a long wrong window)
- median / p95 `|ΔspeechStart|`, `|ΔspeechEnd|` on lines with both GT and proposed timing
- Latency wall-clock; peak RSS optional later

Categories must be reported **separately** (do not average anime BGM into clean TTS).

## 5. Acceptance targets (discussion — not claimed)

See ADR-021 / FORCE-ALIGN-V1-SPEC §5. Baseline below is **measurement only**.

## 6. Baseline (greedy production sidecar, this machine)

Command:

```bat
set FFMPEG_PATH=%LOCALAPPDATA%\Microsoft\WinGet\Links\ffmpeg.exe
set KAIWA_WHISPER_MODEL=base
python scripts/kaiwa/bench_align.py --write-fixtures --run-baseline
```

Results written to `baseline_greedy.json` (2026-09-18): clean_tts median |ΔspeechStart| **212.5 ms**; long_gap **122 ms**; kanji_kana_stress still fails (1 unmatched). See REPORT.md §Baseline.

## 7. Next

- KAI-067 / 068 / 069 plug engines into the same score path.
- Fill `corpus.plan.json` pending slots with legal or private (out-of-git) clips.
