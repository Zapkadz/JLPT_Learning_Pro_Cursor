# KAI-023 — Gate B benchmark framework

Date: 2026-09-18  
Status: **DONE** (framework locked). Labeled ≥150 takes + dual-rater fill = operational follow-up (outside git).

## Deliverables

| Path | Role |
| --- | --- |
| `shared/kaiwa/gateBBenchmark.ts` | Zod schemas, speaker-disjoint splits, pilot thresholds, flag-rate eval |
| `docs/kaiwa/evidence/kai-023/THRESHOLDS.json` | Frozen pilot numbers (PLAN §10.3) |
| `docs/kaiwa/evidence/kai-023/RUBRIC.md` | Rubric text for `kaiwa-ja-rubric-draft-001` |
| `docs/kaiwa/evidence/kai-023/RATER-PROTOCOL.md` | Two raters + adjudication |
| `docs/kaiwa/evidence/kai-023/BUDGET-AND-PROVIDER.md` | Cost / retention / send policy |
| `docs/kaiwa/evidence/kai-023/corpus.plan.json` | 30-utterance slot plan (many pending) |
| `docs/kaiwa/evidence/kai-023/utterances.example.json` | Synthetic schema example (no audio blobs) |

## Locked pilot thresholds (before held-out peek)

- Confirmed-correct flag rate ≥ **90%**
- False-flag rate on acceptable ≤ **5%**
- Clean coverage ≥ **85%**
- Pilot provider budget ≤ **USD 25**
- ≥ **2** Japanese-competent raters; splits by **speaker**

Changing thresholds after evaluating held-out requires a new ADR and a fresh evaluation round.

## What this does *not* claim

- No live provider scores verified.
- No anime / private media in git.
- No Gate B release (that is KAI-034).
- Rubric id remains `kaiwa-ja-rubric-draft-001` until teacher adjudication bumps it.

## Verification

`tests/kaiwa/gate-b-benchmark.test.ts` + full `npm test`.
