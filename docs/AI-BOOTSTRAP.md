# AI Bootstrap Procedure

This file is a **procedure**, not live project state.
Live state lives in `HANDOFF.md`, `PLAN.md`, and `PROGRESS.md` (and module TASKS when named).

Use when:

- opening the project on a new Cursor account;
- starting a new chat with no prior context;
- switching models;
- continuing on another machine.

**Do not start coding** until the checklist below is done and you have produced the restoration report.

---

## Checklist (in order)

1. Run `git status` (record branch, dirty files, or “not a git repository”).
2. If git exists: note current branch; run `git remote -v`; run `git log --oneline --decorate -20`.
3. Read Project Rules under `.cursor/rules/` (at least `project-memory.mdc`, `development-workflow.mdc`, Karpathy guidelines).
4. Read `docs/HANDOFF.md` **first** among docs.
5. Read `docs/PROJECT-CONTEXT.md`.
6. Read `docs/PLAN.md`.
7. Read `docs/PROGRESS.md`.
8. Read `docs/DECISIONS.md`.
9. Read **active module** docs named in HANDOFF / PLAN:
   - If Grammar N2: `docs/requirements/GRAMMAR-N2-MASTER-REQUIREMENT.md`, `docs/grammar-n2/IMPLEMENTATION-RULES.md` (historical progress as needed).
   - If Kaiwa: `docs/kaiwa/PLAN.md`, `docs/kaiwa/TASKS.md`, `docs/kaiwa/IMPLEMENTATION-RULES.md`.
10. Read source/tests named in HANDOFF “Files To Read” for the **current task only**.
11. Compare docs ↔ git ↔ code for obvious contradictions.
12. If contradictions exist: trust repository code + git for factual implementation; mark docs stale; do not silently invent reconciliation. Do not describe planned modules as shipped.

---

## Required output before continuing work

After the checklist, reply with:

## Current Project State

## Current Phase

## Current Task

## Last Completed Work

## Git State

## Important Decisions

## Known Issues / Blockers

## Verification State

## Exact Next Action

Then end with exactly:

`CONTEXT RESTORED — READY TO CONTINUE`

---

## Hard rules during bootstrap

- Do **not** implement features during bootstrap.
- Do **not** update PLAN/PROGRESS/HANDOFF during bootstrap unless the user asked you to fix stale memory **and** you verified facts.
- Do **not** invent commit hashes, test passes, or content counts.
- If a fact is missing: write `UNKNOWN` / `NOT VERIFIED` / `NEEDS VALIDATION`.
- After bootstrap, follow autonomous commit/push/continue in `development-workflow.mdc` for approved PLAN/TASKS work.
