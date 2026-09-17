# AI Handoff

## Last Updated

2026-09-17 (KAI-012 DONE → next: KAI-013)

## Current Branch

`feat/kaiwa-memory`

## Current Task

**KAI-013** — SRT/VTT parser + manual transcript editor; timeline split/merge.

## Exact Next Action

Implement shared SRT/VTT parse/validate (BOM/CRLF/HTML-safe, end>start, duration bounds, overlap flags) + project edit UI `/kaiwa/projects/:id/edit`.

## Last Completed

**KAI-012** — synthetic fixtures + upload→prepare→Range slice. Evidence: `docs/kaiwa/evidence/kai-012/REPORT.md`. Verify: `npm test` **38/38**.

## Safety

- Do not stage grammar dirty files.
- Do not commit user media / large derived outputs.
