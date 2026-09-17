# KAI-015 — Speech capability (not_configured stub)

Date: 2026-09-18  
Status: DONE for Gate A honesty path; **live ASR/translate adapters deferred** until credentials + verified provider.

## Delivered

- `GET /api/kaiwa/capabilities/speech` → `not_configured` (even if env keys present — adapter not wired)
- `POST …/transcriptions` and `…/translations` → **503** `speech_not_configured` (no fake drafts)
- Edit UI banner points users to manual SRT/VI
- Manual transcript path (KAI-013) remains the working path

## Deferred

- Real provider adapter, draft overwrite rules, live cost/version logging

## Verification

- `npm test` **72/72** (includes `tests/kaiwa/speech-capability.test.ts`)
- `npm run build` OK
