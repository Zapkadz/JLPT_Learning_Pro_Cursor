# KAI-023 — Dual-rater protocol

## Roles

- **Rater A / Rater B:** Japanese-competent reviewers; independent first pass.
- **Lead:** Adjudicates disagreements (`consensus` | `third_rater` | `lead_override`).

## Process

1. Freeze rubric text + `THRESHOLDS.json` **before** scoring held_out.
2. Label **calibration** first; tune UI copy / allow-lists only on calibration.
3. Each take gets ≥1 label from the allowed set (see RUBRIC.md).
4. If A ≠ B on any concrete error flag: mark `disagreement_pending`, then adjudicate.
5. Only adjudicated labels count toward confirmed-correct / false-flag rates.
6. **held_out** speakers never appear in train or calibration.
7. Do not drop large fractions of data to “pass” thresholds — report sample size and uncertainty.

## Recording labels (metrics-only JSON)

Store outside git or as redacted JSON under `docs/kaiwa/evidence/kai-023/labels/` (no audio). Shape: `gateBRaterLabelSchema` / `gateBAdjudicationSchema` in `shared/kaiwa/gateBBenchmark.ts`.

## Independence

Raters must not see model flags on the first pass of held_out. Calibration may show model output for debugging after independent labels exist.
