# AI Handoff

## Last Updated

2026-09-17 (KAI-008 DONE → next: KAI-009)

## Current Branch

`feat/kaiwa-memory` @ latest push

## Current Task

**KAI-009** — probe real media format/codec/duration; reject bad files (needs ffprobe or equivalent).

## Exact Next Action

Implement KAI-009: content-based probe (not extension-only), distinguish unsupported vs corrupt, CPU/RAM/time limits. If `ffprobe` missing on machine, record tool dependency clearly and use pluggable probe adapter.

## Safety

- Do not stage grammar dirty files.
- Do not commit user media.
