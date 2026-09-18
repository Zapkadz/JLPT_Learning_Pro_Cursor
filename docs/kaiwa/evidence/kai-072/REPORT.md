# KAI-072 — Editor / studio unmatched honesty

Date: 2026-09-18  
Status: **DONE**

## Delivered

1. `shared/kaiwa/timingStatus.ts` — `isUnmatchedSegment`, `isSpeakableSegment`, counts, VI summary.
2. **Editor (`KaiwaEdit`):** filter Tất cả / Cần kiểm tra / Chưa khớp; summary banner; per-line banners; **Nghe ± ngữ cảnh** (neighbors when unmatched); Seek disabled for unmatched.
3. **Segment studio:** practice pool excludes unmatched; record blocked; chips labeled `chưa khớp`; banners when unmatched present.
4. **Continuous overlay:** only speakable segments drive live overlay index.

## Acceptance

| Criterion | Evidence |
|-----------|----------|
| UI trung thực | Filter + banners + align message via `summarizeAlignResultVi` |
| Studio không dùng unmatched làm cửa sổ thu | `isSpeakableSegment` gate in `SegmentStudio` + chip disable |
| Tests | `timing-status.test.ts`; segment-studio-ui source asserts |

## Verification

- `npm test` **123/123**
- `npm run build` OK

## Not in this task

- Waveform drag / lock / realign (KAI-073)
- Speech vs practice padding split (KAI-074)
