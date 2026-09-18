# AI Handoff

## Last Updated

2026-09-18 (KAI-026 live verify harness)

## Current Branch

`feat/kaiwa-memory`

## Current Task

**Ops blockers (no further Gate B coding without input):**

1. Speech credentials + redacted live dump → `npm run kaiwa:pronunciation-live-check -- --sample …`
2. Licensed Gate B corpus + dual raters (`docs/kaiwa/evidence/kai-023/`)
3. Optional: KAI-076 align held-out clips

## Exact Next Action

Provide **AZURE_SPEECH_KEY** (local env only) and/or a redacted ja-JP pronunciation JSON dump, **or** fill benchmark corpus. Do not start KAI-034/035.

## Last Completed

- KAI-026 live field-verify harness (`kaiwa:pronunciation-live-check`) — honest `missing_credentials`
- KAI-023 Gate B framework
- KAI-065–075; KAI-076 PARTIAL

## Verification

- `npm run kaiwa:pronunciation-live-check` → `missing_credentials` exit 0
- `npm test` **148/148** PASS

## Blockers

- Live provider sample PENDING
- Corpus/raters PENDING
- KAI-076 user evidence empty
- Grammar dirty — exclude from Kaiwa commits

## Safety

- Do not invent live API JSON or Gate B release claims.
- Do not commit secrets or private media.
