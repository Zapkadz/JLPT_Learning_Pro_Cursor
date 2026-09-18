# Kaiwa Japanese feedback rubric (draft)

**Rubric id:** `kaiwa-ja-rubric-draft-001`  
**Locked with:** KAI-023 (2026-09-18)  
**Locale:** `ja-JP`

## Dimensions (learner-facing)

| Dimension | Allowed evidence | Forbidden |
| --- | --- | --- |
| Audio quality | Local DSP → `not_assessable` + reason | Pronunciation `0` for mic failure |
| Coverage / completion | Alignment + optional STT coverage | Blaming learner for data_gap |
| Pronunciation | Provider fields verified live for ja-JP only | ASR confidence as score |
| Rhythm / timing | Relative duration vs reference when alignment confident | Extreme time-warp hiding errors |
| Intonation (relative) | Relative F0 contour notes | Azure ProsodyScore; absolute pitch; gender |
| Pitch-accent word error | **Out of scope** until lexicon + teacher labels | Guessing from F0 alone |

## Flag kinds for raters

`acceptable` · `error_chouon` · `error_sokuon` · `error_rhythm` · `error_intonation_relative` · `error_coverage_skip` · `not_assessable_audio` · `disagreement_pending`

## Presentation rules (product)

1. Status must be explicit: `ready` | `unavailable` | `not_assessable` | `failed` (+ reason).
2. Metrics nullable; no fake `0`/`100`.
3. Show coverage of assessable regions; do not average non-assessable into an overall JLPT score.
4. Max 1–3 priorities per take; each points to evidence + A/B listen.
5. Vietnamese coaching may restate structured evidence only (no phonetics-from-text inventing).

## Version bump

After dual-rater adjudication on calibration, bump `RUBRIC_VERSION` in `shared/kaiwa/assessment.ts` and record ADR. Do not silently change meanings under the same id.
