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

No live ja-JP provider call. Field verification against real Azure/other payloads and KAI-023 benchmark remain deferred.

## Verification

- `npm test` **89/89**
- `npm run build` OK
