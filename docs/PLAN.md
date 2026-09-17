# PLAN — Kotoba active task queue

Last updated: 2026-09-17
This file is the **active** project-level task source of truth for agents.
Detailed module backlogs live in module files (do not duplicate every row here).

## Current Goal

**Kaiwa Studio** — deliver Gate A (usable full-video continuous dubbing), then Gate B (validated Japanese learning feedback). Character role-play (Gate C / KAI-035) is **out of scope** until Gate B.

## Current Milestone

**KAIWA STUDIO** — design/risk validation → data/media foundation → transcript → record/export → assessment → Gate A/B.

## Status legend

`TODO` | `IN_PROGRESS` | `BLOCKED` | `DONE`

---

## Milestone KAIWA — Kaiwa Studio

| Pointer | Value |
|---------|--------|
| Module scope | `docs/kaiwa/PLAN.md` |
| Detailed backlog / dependency graph | `docs/kaiwa/TASKS.md` |
| Module implementation rules | `docs/kaiwa/IMPLEMENTATION-RULES.md` |
| Current objective | Gate A → Gate B |
| **Current executable task** | **KAI-018** (next; KAI-017 DONE) |
| Next after KAI-001 | KAI-002 (KAI-003 may run early in parallel when deps allow) |
| Do not start | **KAI-035** before Gate B |

### Phase overview (detail in `docs/kaiwa/TASKS.md`)

| Phase | Tasks | Focus |
|-------|-------|--------|
| Risk / architecture spikes | KAI-001–004 | Integration audit, capture, scoring, UX |
| Data + media foundation | KAI-005–012 | Schema, storage, jobs, upload, probe/proxy |
| Transcript + Japanese support | KAI-013–016 | SRT/manual, furigana/romaji/VI, ASR optional |
| Full-video record / review / export | KAI-017–022 | Continuous capture, takes, MP4 export |
| Japanese assessment | KAI-023–029 | Evidence-based scoring (no fake metrics) |
| Progress / ops / QA / gates | KAI-030–034 | Gate A then Gate B |
| Later planning only | KAI-035 | Character role-play — after Gate B |

Planning docs DOC-001 / DOC-002 / DOC-003 are DONE (documentation only ≠ product done).

---

## Milestone M-MEM — Project memory

| ID | Description | Status | Dependencies | Acceptance summary |
|----|-------------|--------|--------------|-------------------|
| MEM-001 | Create/update PROJECT-CONTEXT, PLAN, PROGRESS, HANDOFF, DECISIONS, AI-BOOTSTRAP + project-memory rule | DONE | — | New AI can restore context from repo alone |
| KAI-MEM-001 | Integrate approved Kaiwa plan into root memory + autonomous workflow rules | DONE | Kaiwa DOC-001–003 | Root PLAN/HANDOFF point at KAI-001; no fake Kaiwa app code |

---

## Milestone N2 — Grammar N2 (maintenance / history)

Formal requirement: `docs/requirements/GRAMMAR-N2-MASTER-REQUIREMENT.md`.
Content scale **26 / 141 / 4230** published on `main`; N2-FULL-ACC automated PASS; N2-L01-FURI-001 merged (PR #14). Teacher independent review: **PENDING**.

Not the active coding queue unless the user re-prioritizes Grammar over Kaiwa.

### Completed N2 tasks (summary)

| ID | Status | Note |
|----|--------|------|
| N2-GIT-000 … N2-FULL-ACC | DONE | See `docs/PROGRESS.md` |
| N2-L01-FURI-001 | DONE | ADR-009; merged PR #14 |
| Teacher language review | PENDING | Does not block Kaiwa |

Historical Lesson 1 pilot detail: `docs/grammar-n2/PROGRESS.md`.

---

## Explicitly out of queue (do not invent tasks for)

- Cloning NhatKanji UI/branding
- Declaring Grammar 4230 “teacher complete” without independent review
- Starting Kaiwa character role-play (KAI-035) before Gate B
- Treating Kaiwa planning docs as shipped product features
- Fake Japanese scoring (ASR confidence as pronunciation, etc.)
