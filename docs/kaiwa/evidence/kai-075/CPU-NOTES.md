# KAI-075 — CPU / smoke notes

Date: 2026-09-18

## Machine profile (pilot)

- Target: CPU-first (~i5 class, ~16 GB RAM). No CUDA assumed.
- Default align: **stable-ts** + Whisper weights `base` (`KAIWA_WHISPER_MODEL`).
- First smoke / align downloads model weights (hundreds of MB) — allow several minutes.

## Capability vs import

| State | Meaning |
|-------|---------|
| `ready` | ffmpeg + package import **and** smoke inference passed (or mock) |
| `degraded` | import OK but smoke skipped (`KAIWA_ALIGN_SMOKE=skip` / unit tests) |
| `not_configured` | missing ffmpeg/package **or** smoke failed |

## Commands

```bash
npm run kaiwa:speech-env
# forces KAIWA_ALIGN_SMOKE=1 and prints smoke + capability
```

Optional env:

- `KAIWA_ALIGN_SMOKE=1` — force smoke on capability resolve
- `KAIWA_ALIGN_SMOKE=skip` — never smoke (status stays degraded if packages present)
- `KAIWA_PYTHON` — Python with stable-ts / faster-whisper / qwen-asr

## Honesty

Smoke on silence proves the runtime loads and runs — **not** anime/BGM quality.
