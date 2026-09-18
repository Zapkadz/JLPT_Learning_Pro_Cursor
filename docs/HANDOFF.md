# AI Handoff

## Last Updated

2026-09-18 (KAI-023 Gate B framework DONE)

## Current Branch

`feat/kaiwa-memory`

## Current Task

**Next READY (needs input):** collect licensed takes + dual raters for KAI-023 corpus **or** provide speech credentials for live ja-JP field verify (KAI-003 checklist / KAI-026).

KAI-076 remains **PARTIAL** (user held-out align metrics). Forced-align **KAI-065–075** DONE. **KAI-023** framework DONE.

## Exact Next Action

1. Fill Gate B corpus locally (license + speaker splits) per `docs/kaiwa/evidence/kai-023/` — audio outside git.
2. Or set speech provider env keys and run KAI-003 live checklist (redacted JSON under `docs/kaiwa/evidence/kai-003/live/`).
3. Optional: finish KAI-076 align held-out under `%USERPROFILE%\kaiwa-held-out\`.

Do **not** start KAI-035. Do **not** claim Gate B release (KAI-034).

## Last Completed

- KAI-023: benchmark manifest schemas, locked pilot thresholds, rubric, rater protocol, budget policy (`npm test` **143/143**)

## Verification

- `npx tsx --test tests/kaiwa/gate-b-benchmark.test.ts` PASS
- `npm test` **143/143** PASS

## Blockers

- Labeled ≥150 takes + dual raters (ops).
- Live provider credentials for ja-JP field verify.
- KAI-076 user align evidence still empty.
- Grammar dirty — exclude from Kaiwa commits.

## Safety

- Do not claim anime fixed / Gate B shipped.
- Do not commit private media or secrets.
