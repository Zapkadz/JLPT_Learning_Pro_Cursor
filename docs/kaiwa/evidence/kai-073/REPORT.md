# KAI-073 — Waveform timing edit, lock, realign, undo

Date: 2026-09-18  
Status: **DONE**

## Delivered

1. `shared/kaiwa/timingEdit.ts` — lock, clamp drag, `mergeRealignPreservingLocks`, anchors from locks, range between locks, undo stack.
2. `timingLocked` on segment schema.
3. `TimingWaveform.tsx` — canvas peaks (best-effort from media URL) + drag start/end; preview seeks video.
4. Editor: Khóa mốc · chọn đoạn · Căn lại đoạn đã chọn · Căn giữa hai khóa · Hoàn tác mốc; merged draft written after realign so locks stick.

## Acceptance

| Criterion | Evidence |
|-----------|----------|
| 25/30 đúng giữ nguyên khi chỉ sửa 5 câu | `timing-edit.test.ts` — 25 locked preserved, 5 unlocked updated |
| Waveform drag / lock / realign / undo | UI source test + editor wiring |

## Verification

- `npm test` **135/135**
- `npm run build` OK

## Notes

- Waveform peaks require browser-decodable audio in the proxy; otherwise flat track + handles still work.
- Realign still needs `alignConsent` + speech capability (same as full script-align).
