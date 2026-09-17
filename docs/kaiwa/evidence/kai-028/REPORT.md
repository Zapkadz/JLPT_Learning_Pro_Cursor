# KAI-028 — Assessment aggregate (cache / coverage / idempotency)

Date: 2026-09-18

## Delivered

- `shared/kaiwa/assessmentAggregate.ts` — merges quality + alignment + pronunciation + prosody
- `overallScore` always `null`; `charged` always `false`
- Coverage counts only assessable regions; priorities capped at 1–3
- Fingerprint + rubricVersion cache; repeat POST → `reused: true` (no re-charge)
- Different rubricVersion writes new assessment; previous kept in `assessmentHistory` (last 5)
- `POST/GET /kaiwa/attempts/:id/assessment` (auto-runs missing layers)

## Honesty bounds

Does not invent pronunciation scores or a 0–100 total. Live provider spend still N/A.

## Verification

- `npm test` **99/99**
- `npm run build` OK
