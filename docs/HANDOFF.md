# AI Handoff

## Last Updated

2026-09-18 (KAI-021 DONE → next: KAI-022)

## Current Branch

`feat/kaiwa-memory`

## Current Task

**KAI-022** — Export MP4 job + private download; snapshot mix from review.

## Exact Next Action

Add export job for finalized attempts (mix snapshot), private download endpoint, idempotent restart; wire review UI export CTA.

## Last Completed

**KAI-021** — Review page dual-gain mix, take history, keep flag, re-record → new attempt. Evidence: `docs/kaiwa/evidence/kai-021/REPORT.md`. Verify: **63/63**.

## Safety

- Do not stage grammar dirty files.
- Do not commit user media / large derived outputs.
