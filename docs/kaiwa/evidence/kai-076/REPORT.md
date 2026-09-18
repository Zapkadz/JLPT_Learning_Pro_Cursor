# KAI-076 — Held-out / anime user evidence

Date: 2026-09-18  
Status: **PARTIAL** — scaffold DONE; user measurements **PENDING**

## Delivered (agent)

| Artifact | Role |
|----------|------|
| `RUNBOOK.md` | How to evaluate private clips without committing media |
| `RESULTS.template.json` | Metrics-only schema |
| `scripts/kaiwa/held_out_summary.py` | Summarize private `results.json` |
| `npm run kaiwa:held-out` | Wrapper |

## Pending (user)

1. Run ≥1 clean-dialogue personal/anime clip outside git.
2. Fill `results.json` under `KAIWA_HELD_OUT_DIR`.
3. Optionally copy metrics-only JSON into this folder as `results.user.json`.
4. Agent then marks KAI-076 **DONE** with real medians (no anime “fixed” claim).

## Honesty

- No held-out median claimed in this REPORT.
- Heavy BGM must stay a separate bucket.
- Gate A speakable remains ACCEPTED independent of this work.
