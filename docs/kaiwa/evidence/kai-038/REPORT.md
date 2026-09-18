# KAI-038 — Segment studio UI

Date: 2026-09-18

## Delivered

- `SegmentStudio.tsx` — video + **script overlay**, clip controls (Nghe mẫu / Thu / Nghe mình / Trước / Tiếp / Bỏ qua / Kết thúc)
- Studio mode picker: default **Theo đoạn**; Liên tục = advanced
- Prep `start-practice` sends `captureMode: "segment"`
- Progress chips N/M; upload clip via KAI-037 APIs

## Honesty

Continuous mode still available; notes that live overlay polish is KAI-041. Assembled take labeling remains KAI-039.

## Verification

- `npm run build` OK
- UI source test + segment-clips API tests PASS (full suite run in commit step)
