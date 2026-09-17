# AI Handoff

## Last Updated

2026-09-18 (KAI-030a DONE → next: KAI-031)

## Current Branch

`feat/kaiwa-memory`

## Current Task

**KAI-031** — Media backup/restore, quota cleanup, delete sync with jobs/assets.

## Exact Next Action

Extend backup to cover private media + manifest; soft-delete project cancels jobs and GC; safe logging (no tokens/audio); document retention.

## Last Completed

**KAI-030a** — History API/UI, finalize activity events (idempotent), ADR-018 (no deck/grammar XP). Evidence: `docs/kaiwa/evidence/kai-030a/REPORT.md`. Verify: **65/65**.

## Safety

- Do not stage grammar dirty files.
- Do not commit user media / large derived outputs.
