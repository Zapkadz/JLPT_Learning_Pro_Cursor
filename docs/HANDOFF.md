# AI Handoff

## Last Updated

2026-09-18 (KAI-038 DONE; next KAI-039)

## Current Branch

`feat/kaiwa-memory`

## Current Task

**KAI-039** — Assemble segment clips onto video timeline for review/export (`capture_mode` honesty).

## Exact Next Action

Build assembly job/service that places recorded clips at segment start/end with silence/gaps; wire review/export to assembled learner track. Then KAI-040/041 polish.

## Last Completed

**KAI-038** — Segment studio UI with on-video script overlay + clip controls. Evidence: `docs/kaiwa/evidence/kai-038/REPORT.md`. Verify: **103/103**.

## How to try now

1. Upload video → edit timed subtitles → prep → start practice.
2. Studio defaults to **Theo đoạn**; after mic ready, speak looking at overlay.
3. Continuous remains under mode picker (advanced).

## Blockers

- Full Gate A ACCEPTED still needs KAI-039–046 + device checklist.
- Gate B: KAI-023 / credentials.

## Safety

- Do not stage grammar dirty files.
- Do not label assembled audio as continuous.
