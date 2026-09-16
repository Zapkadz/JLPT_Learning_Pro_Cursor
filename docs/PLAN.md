# PLAN — Kotoba active task queue

Last updated: 2026-09-16  
This file is the **active** task source of truth for agents.  
Module design history remains in `docs/grammar-n2/PLAN.md` (do not treat that file as the live queue).

## Current Goal

Grammar N2 per Master Requirement. **N2-L11-BATCH DONE** (Lessons 11–15 on `feat/n2-l11-batch`; commit/PR pending). Next: **N2-L16-BATCH** (needs approval) or **N2-L01-FURI-001**.

## Current Milestone

**Phase 1+ Grammar N2** — Lessons 1–15 on feature branch; awaiting commit/PR then L16+ / furigana decision.

## Status legend

`TODO` | `IN_PROGRESS` | `BLOCKED` | `DONE`

---

## Milestone M-MEM — Project memory

| ID | Description | Status | Dependencies | Acceptance summary |
|----|-------------|--------|--------------|-------------------|
| MEM-001 | Create/update PROJECT-CONTEXT, PLAN, PROGRESS, HANDOFF, DECISIONS, AI-BOOTSTRAP + project-memory rule | DONE | — | New AI can restore context from repo alone; no app code changed |

---

## Milestone N2 — Grammar N2 (from Master Requirement + audit)

Formal requirement: `docs/requirements/GRAMMAR-N2-MASTER-REQUIREMENT.md`.

### Phase gate

Implementation of N2-* coding tasks requires **explicit user approval**. Until then: keep `BLOCKED` / do not start.

### Active / near-term tasks

| ID | Description | Status | Dependencies | Acceptance summary |
|----|-------------|--------|--------------|-------------------|
| N2-GIT-000 | Restore git repository / remote for this workspace copy | DONE | User approved push | `main` tracks `origin/main` on github.com/Zapkadz/JLPT_Learning_Pro_Cursor |
| N2-AUDIT-001 | Lock audit findings (141≠151 root cause, L1 counts, scale notes) into PROGRESS/HANDOFF | DONE | MEM-001 done; user OK to proceed docs/impl | Findings documented; no hard-coded 151→141 “fix” |
| N2-MAP-001 | Canonical inventory skeleton: 26 lessons × 141 group IDs (keep L1 IDs) | DONE | N2-AUDIT-001 | SOURCE-MAPPING + inventory.json list 141; L1 IDs unchanged |
| N2-MAP-002 | Map Tiếng Nhật Đơn Giản sources → groups (match status) | DONE | N2-MAP-001 | **141/141** mapped; partials documented; content still L1-only |
| N2-ARCH-001 | Multi-lesson content loader (no parallel stack) | DONE | N2-MAP-002 | Unpublished → 404; published from JSON; L1 regression 13/13 |
| N2-ARCH-002 | Additive metadata (variants/source/origin) via Zod | DONE | N2-ARCH-001 | Optional fields; public DTO strips answers/origin; L1 JSON still parses |
| N2-L01-GOLD-001 | Lesson 1 theory/examples golden template | DONE | N2-MAP-002, N2-ARCH-002 | 3 examples/group + variants/urls; rev 4; no practice overlap |
| N2-L01-FURI-001 | Close furigana gaps (scope needs product decision for JA→VI practice) | TODO | Decision + N2-L01-GOLD-001 | Policy applied; raw JA stays clean |
| N2-L01-GOLD-002 | Lesson 1 exercise bank QA (10/10/10 substantive + origin) | DONE | N2-L01-GOLD-001 | Validators pass; hints not full answers; rev 5 |
| N2-L01-UX-001 | Remove Lesson-1 hardcoding; statuses from API/manifest | DONE | N2-ARCH-001 | CTA/back-link from published lesson + pattern lesson metadata; no `lesson-01` in Grammar UI |
| N2-L01-PROG-001 | Align progress semantics without resetting user data | DONE | N2-L01-UX-001 | No double XP; denominator = 141; ADR-008 |
| N2-TEST-001 | Golden template validators + representative Playwright grammar journey | DONE | N2-L01-* | `npm test` 14/14; grammar e2e 1/1; merged PR #6 |
| N2-E2E-001 | Fix legacy `app.spec` under Playwright webServer | DONE | N2-TEST-001 | Full `test:e2e` 2/2 |
| N2-L02-BATCH | Lessons 2–5 content + exercises + validate | DONE | N2-TEST-001 | 21 groups / 630 ex; §71 validators; published |
| N2-L06-BATCH | Lessons 6–10 | DONE | N2-L02-BATCH | 24 groups / 720 ex; §71 validators; published (PR #9 merged) |
| N2-L11-BATCH | Lessons 11–15 | DONE | N2-L06-BATCH | 27 groups / 810 ex; §71 validators; published (commit/PR pending) |
| N2-L16-BATCH | Lessons 16–20 | TODO | N2-L11-BATCH | Same |
| N2-L21-BATCH | Lessons 21–26 | TODO | N2-L16-BATCH | Same |
| N2-FULL-ACC | Full-course acceptance (Master §73) | TODO | All lesson batches | 26/141/4230 validated with evidence — not placeholders |

### Historical Lesson 1 pilot (already shipped — detail in `docs/grammar-n2/PROGRESS.md`)

Tracked there as G04–G10 DONE (agent_reviewed Lesson 1). Not re-listed as active work. Remaining legacy item **G03** (full per-group inventory beyond manifest counts) maps forward to **N2-MAP-001**.

---

## Explicitly out of queue (do not invent tasks for)

- Cloning NhatKanji UI/branding  
- Audio/TTS infrastructure  
- Authoritative AI grading  
- Redesigning core FSRS for non-grammar decks  
- Declaring 4230 exercises complete via placeholders  
