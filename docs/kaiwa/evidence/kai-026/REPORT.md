# KAI-026 — Pronunciation evidence schema + stub adapter

Date: 2026-09-18

## Delivered

- `shared/kaiwa/assessment.ts` — segment/attempt evidence schema (KAI-003 draft)
- Parser rejects ja-JP `ProsodyScore`; never maps ASR `RecognitionConfidence` → accuracy
- Empty phonemes → no invented mora errors; budget / timeout helpers
- `POST/GET /kaiwa/attempts/:id/pronunciation` → `unavailable` / `provider_not_wired`
- Capability surface includes `pronunciation.not_configured` + `prosodySupportedForJaJp: false`
- Alignment hints mark `data_gap` / low alignment as `not_assessable` (not fake scores)

## Honesty bounds

No live ja-JP provider call until a redacted dump is verified. Field allow-list remains empty of live evidence.

## Live verify harness (2026-09-18)

- `npm run kaiwa:pronunciation-live-check` — credential-honest; exit 0 on `missing_credentials`
- `--sample <json>` parses redacted dumps under ja-JP rules (reject ProsodyScore; no ASR→accuracy)
- Docs: `docs/kaiwa/evidence/kai-026/live/README.md`
- Code: `shared/kaiwa/pronunciationLiveCheck.ts`

Live sample artifact: **PENDING** (needs keys + dump under `kai-003/live/`).

## Verification

- Live harness unit tests + `npm test`
- Earlier: `npm test` **89/89**; `npm run build` OK
