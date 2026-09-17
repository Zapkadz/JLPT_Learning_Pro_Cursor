# KAI-025 — Utterance / timeline alignment foundation

Date: 2026-09-18

## Delivered

- `shared/kaiwa/alignment.ts` — video-clock alignment with edge padding; statuses `aligned` / `uncertain` / `missing_speech` / `data_gap` / `out_of_range` / `skipped`
- Beyond attempt duration after interrupt → `data_gap` (not learner `missing_speech`)
- Partial EOF clip → `uncertain`; `phonemeClaimsAllowed` always `false`
- Long segments → window markers without inventing word/syllable cuts
- A/B listen seek targets (`reference*` / `learner*`) on video clock
- `POST/GET /kaiwa/attempts/:id/alignment`; report stored on `clocks_json.alignment`

## Honesty bounds

Synthetic / revision-timeline foundation only. No live ASR force-align. Does not invent phoneme errors or pronunciation scores.

## Verification

- `npm test` **81/81**
- `npm run build` OK
