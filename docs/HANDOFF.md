# AI Handoff

## Last Updated

2026-09-17 (KAI-013 DONE → next: KAI-014)

## Current Branch

`feat/kaiwa-memory`

## Current Task

**KAI-014** — Furigana, romaji, Vietnamese translation layers (manual edit + independent toggles).

## Exact Next Action

Extend segment model / editor for reading+romaji+VI overrides; persist prefs (furigana on, romaji off); ruby layout; tests for exception readings.

## Last Completed

**KAI-013** — SRT/VTT parse/validate + `/kaiwa/projects/:id/edit`. Evidence: `docs/kaiwa/evidence/kai-013/REPORT.md`. Verify: `npm test` **42/42**, build OK.

## Safety

- Do not stage grammar dirty files.
- Do not commit user media / large derived outputs.
