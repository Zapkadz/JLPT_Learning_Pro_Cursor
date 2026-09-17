# AI Handoff

## Last Updated

2026-09-18 (KAI-014 DONE → next: KAI-016)

## Current Branch

`feat/kaiwa-memory`

## Current Task

**KAI-016** — Prep/learn screen: synced transcript, independent help layers, publish revision snapshot for takes.

## Exact Next Action

Add `/kaiwa/projects/:id/prep` (or hub prep section): click segment → seek; furigana/romaji/VI toggles; allow practice start without transcript with clear “chưa đủ chuẩn chấm” copy; attempt pins reviewed revision.

## Last Completed

**KAI-014** — token model, Hepburn exceptions, editor toggles, stale-on-JA-change. Evidence: `docs/kaiwa/evidence/kai-014/REPORT.md`. Verify: `npm test` **48/48**, build OK.

## Safety

- Do not stage grammar dirty files.
- Do not commit user media / large derived outputs.
