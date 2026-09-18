# AI Handoff

## Last Updated

2026-09-18 (KAI-036 DONE; next KAI-037)

## Current Branch

`feat/kaiwa-memory`

## Current Task

**KAI-037** — Schema/API: `capture_mode`, segment clip assets, N/M progress, ownership.

## Exact Next Action

Implement additive migration + repository/API for per-segment clips on an attempt; tests for ownership and versioning. Then KAI-038 UI.

## Last Completed

**KAI-036** — Segment studio UX spec (ADR-019). Evidence: `docs/kaiwa/evidence/kai-036/`. USAGE + CHECKLIST + UX-SPEC updated.

## Blockers

- Gate A ACCEPTED waits for KAI-037–046 + device PASS on segment mode.
- Gate B depth: KAI-023 / speech credentials.

## Safety

- Do not stage grammar dirty files.
- Do not claim assembled segment audio is continuous.
- Do not invent pronunciation scores.
- Do not start KAI-035 before Gate B.
