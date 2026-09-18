# AI Handoff

## Last Updated

2026-09-18 (KAI-053 align_script DONE — next KAI-054)

## Current Branch

`feat/kaiwa-memory`

## Current Task

**DONE:** KAI-053 `POST …/script-align` → draft with times + `source_json`.  
**Next code:** **KAI-054** UI “Đồng bộ lời thoại với video”.  
**Blocked human:** KAI-046 device.

## Exact Next Action

1. Implement **KAI-054**: CTA + opt-in copy, call script-align, show progress/result, open editor with machine draft banner.
2. Keep manual SRT/paste when `scriptAlign` is `not_configured`.
3. KAI-046 remains human Chrome/Edge Gate A.

## Last Completed

- KAI-053: `scriptAlign.ts`, Whisper sidecar, mock engine for tests, capability `scriptAlign`, 409 on stale version after machine write.
- KAI-052 spike measured (~0.4 s median).

## Blockers

- KAI-046 human device for Gate A ACCEPTED.
- Grammar local dirty files — do not stage with Kaiwa commits.

## Safety

- Do not stage grammar dirty files.
- Do not auto-publish machine drafts (ADR-012/014).
