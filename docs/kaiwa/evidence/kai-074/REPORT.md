# KAI-074 — Speech timing vs practice / overlay padding

Date: 2026-09-18  
Status: **DONE**

## Delivered

1. `shared/kaiwa/practiceTiming.ts` — `speechBounds`, `practiceBounds` (lead-in/trail clamped before next speech), `overlayShowAtMs`; env overrides.
2. Optional `speechStartMs` / `speechEndMs` on segments; align writes them equal to speech `start`/`end`.
3. Segment studio records/plays **practice** window; overlay label shows speech vs thu separately.
4. Continuous overlay uses `segmentsForOverlay` (early-show) without mutating transcript ends.

## Acceptance

| Criterion | Evidence |
|-----------|----------|
| Transcript end ≠ kéo tới câu kế | `practiceBounds` clamps; segment `endMs` unchanged in tests |
| Practice/overlay = config only | UI derives windows; not written into draft ends |

## Verification

- `tests/kaiwa/practice-timing.test.ts`
- `npm test` **131/131**; `npm run build` OK

## Config

| Env | Default |
|-----|---------|
| `KAIWA_PRACTICE_LEAD_IN_MS` | 200 |
| `KAIWA_PRACTICE_TRAIL_MS` | 150 |
| `KAIWA_OVERLAY_EARLY_SHOW_MS` | 400 |
| `KAIWA_PRACTICE_MIN_GAP_MS` | 40 |
