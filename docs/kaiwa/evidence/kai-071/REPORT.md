# KAI-071 — Windowed long-video script-align

Date: 2026-09-18  
Status: **DONE**

## Delivered

1. `shared/kaiwa/alignWindows.ts` — time-based overlapping windows; optional anchors → line/audio regions; merge that **skips failed windows**; guard against character-proportional splits.
2. `server/modules/kaiwa/scriptAlign.ts` — for long audio (default ≥180s, `KAIWA_ALIGN_WINDOW_MIN_MS`): slice WAV per window (`KAIWA_ALIGN_WINDOW_MS` / `KAIWA_ALIGN_OVERLAP_MS`), align remaining unmatched lines, offset times; failed slice/engine → continue without inventing slots.
3. Request `anchors?: { lineIndex, atMs }[]` on script-align (Point Sync–style).
4. Job/revision metadata: `windowCount`, `failedWindows`.

## Acceptance

| Criterion | Evidence |
|-----------|----------|
| Không chia đều theo số chữ | `assertNotCharProportionalSplit` + `regionsFromAnchors` |
| Lỗi một cửa sổ không lan im lặng | `mergeWindowPassResults` skips `ok:false` |
| Overlap windows | `planAlignWindows` step = window − overlap |

## Verification

- `tests/kaiwa/align-windows.test.ts`
- Full `npm test` + `npm run build`

## Config

| Env | Default |
|-----|---------|
| `KAIWA_ALIGN_WINDOW_MS` | 90000 |
| `KAIWA_ALIGN_OVERLAP_MS` | 15000 |
| `KAIWA_ALIGN_WINDOW_MIN_MS` | 180000 |

## Not claimed

Anime/BGM quality; waveform editor (KAI-073); practice padding split (KAI-074).
