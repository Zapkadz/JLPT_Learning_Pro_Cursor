# AI Handoff

## Last Updated

2026-09-18 (KAI-024 reference leakage)

## Current Branch

`feat/kaiwa-memory`

## Current Task

**Ops blockers (unchanged):** live PA sample / Gate B corpus / KAI-076 clips.

Independent coding without those inputs is largely exhausted (leakage heuristic shipped; WebM decode still deferred).

## Exact Next Action

1. Set `AZURE_SPEECH_KEY` + redacted dump → `npm run kaiwa:pronunciation-live-check -- --sample …`
2. Fill KAI-023 corpus + dual raters
3. Optional: KAI-076 held-out media
4. Later: wire decoded lesson reference PCM into `audioQualityService` (needs decode path)

## Last Completed

- KAI-024 reference leakage NCC heuristic (`reference_leakage`, never pronunciation 0)
- KAI-026 live-check harness; KAI-023 framework; KAI-065–075; KAI-076 PARTIAL

## Verification

- `npm test` **151/151** PASS

## Blockers

- Live provider sample, corpus/raters, KAI-076 evidence
- Grammar dirty — exclude from Kaiwa commits

## Safety

- Do not invent live API JSON or Gate B release claims.
- Do not commit secrets or private media.
