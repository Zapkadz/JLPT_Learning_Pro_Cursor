# KAI-026 — Live ja-JP pronunciation field verify

Status: **harness READY**; **live sample PENDING** until credentials + redacted dump.

## Goal

Confirm which score fields Azure (or other) actually returns for `ja-JP` before wiring the production adapter. Never invent payloads.

## Commands

```bat
npm run kaiwa:pronunciation-live-check
```

Without keys → exits **0**, status `missing_credentials`.

With a redacted dump (no audio, strip subscription ids):

```bat
npm run kaiwa:pronunciation-live-check -- --sample path\to\redacted.json
```

## Capture procedure (when keys exist)

1. Run vendor SDK/REST pronunciation assessment for one licensed JA utterance.
2. Save JSON; remove keys, URLs with tokens, and any audio blobs.
3. Place under `docs/kaiwa/evidence/kai-003/live/` (preferred) or local path.
4. Re-run with `--sample`.
5. Record allow-listed fields in `FIELD-ALLOWLIST.md` (create when first live sample lands).

## Rules

- `ProsodyScore` must not drive Japanese intonation (ADR-017).
- `RecognitionConfidence` must not become AccuracyScore.
- Empty phoneme arrays → no mora error claims.
- Harness sets `liveProviderCalled: false` until an explicit SDK path is added and verified.

## Related

`shared/kaiwa/pronunciationLiveCheck.ts`, `shared/kaiwa/assessment.ts`, KAI-003 REPORT §9, KAI-023 thresholds.
