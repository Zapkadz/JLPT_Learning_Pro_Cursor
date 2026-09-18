# KAI-023 — Budget and provider send policy

## Pilot budget

| Cap | Value |
| --- | --- |
| External provider spend | ≤ **USD 25** for Gate B pilot (see `THRESHOLDS.json`) |
| Segment assess P95 (soft) | ≤ **8000 ms** — report, do not fake scores on timeout |

When budget is exhausted: assessment status `failed` / reason `budget_exhausted`; export and playback remain available (ADR-017).

## Before any external send

1. UI discloses provider name, region, and retention summary.
2. User action required — no auto-send of every new upload.
3. Prefer segment clips over whole-video blobs.
4. Never log raw audio, tokens, or subscription keys.
5. Credentials only via env (never commit).

## Data retention (pilot proposal)

- Provider: follow vendor default; prefer ephemeral / no training-use where configurable.
- Kotoba: keep assessment JSON + ownership; raw mic remains private storage with existing quota lifecycle.
- Benchmark corpus: local paths outside git unless license allows in-repo fixtures.

## Open vendor choice

Azure (or other) remains a **candidate** until live ja-JP field verify (KAI-003 checklist). Prosody assessment must not be presented as Japanese intonation.
