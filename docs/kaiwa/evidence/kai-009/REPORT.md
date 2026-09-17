# KAI-009 — Media probe

Date: 2026-09-17
Status: DONE

## Approach

Pluggable probe:

1. **sniff** (default) — magic/header ISO-BMFF + EBML; distinguishes `corrupt` vs `unsupported`; reads MP4 `mvhd` duration when present in prefix.
2. **ffprobe** — optional via `FFPROBE_PATH` / `KAIWA_USE_FFPROBE=1`; structured spawn with timeout + buffer cap (no shell string concat).

Pilot limits (ADR-015): MP4/WebM only, max 10 minutes, require video track → `too_long` / `unsupported` / `no_av_track`.

API: `POST /api/kaiwa/assets/:id/probe` → 200 ok / 422 rejected with `{ result }`.

## Verification

`npm test` includes `tests/kaiwa/probe.test.ts` (fake extension, truncated, minimal MP4, HTTP probe).

## Note

This environment has no system `ffprobe`. Production should set `FFPROBE_PATH` for full codec metadata; sniff remains a safe fallback and test engine.
