# Project Decisions

Long-lived “why” decisions. Not a changelog. Only entries with repository or explicit requirement evidence.

---

## ADR-001 — Single-server React + Express + SQLite

Date: 2026-09-11 (documented in PRODUCT/README; still matches code)  
Status: Accepted

### Context

Need a personal JLPT study app that runs on one machine without cloud SaaS dependencies.

### Decision

Use React + Vite SPA, Express REST, SQLite WAL (`better-sqlite3`), cookie sessions.

### Reason

Fits local/single-server deployment; shared Zod domain; simple backup story.

### Consequences

Multi-instance scale needs Postgres / shared rate-limit later (documented, not implemented).

### Do Not

Do not introduce a second parallel backend/database “just for Grammar N2”.

### Related Files

`package.json`, `server/app.ts`, `docs/PRODUCT.md`, `README.md`

---

## ADR-002 — Grammar N2 is a module extension, not a rewrite

Date: 2026-09-13 / reinforced by Master Requirement 2026-09-14  
Status: Accepted

### Context

Need a full N2 grammar course UX while Kotoba already has decks, FSRS, practice, stats.

### Decision

Add `content/grammar/n2`, `shared/grammar`, `server/modules/grammar`, `src/features/grammar` on top of existing auth/SRS/stats. Reuse UI primitives and FSRS for optional pattern cards.

### Reason

Master Requirement §46 and implementation rules: reuse architecture; avoid parallel systems.

### Consequences

Grammar progress/events must integrate carefully with heatmap/XP entity keys.

### Do Not

Do not rebuild flashcards/auth/SRS from scratch for this module. Do not clone third-party site branding.

### Related Files

`docs/requirements/GRAMMAR-N2-MASTER-REQUIREMENT.md`, `docs/grammar-n2/IMPLEMENTATION-RULES.md`, `server/modules/grammar/*`

---

## ADR-003 — Canonical course structure is Shinkanzen 26 / 141

Date: 2026-09-13 (grammar plan); locked in Master Requirement  
Status: Accepted

### Context

External sites may list different pattern counts (e.g. 151 on NhatKanji).

### Decision

Kotoba canonical totals: **26 lessons**, **141 grammar groups**, **30 exercises/group** (4230 target). Do not force data to match 151.

### Reason

Shinkanzen Master N2 is course-structure authority per Master Requirement §1 / §7.

### Consequences

UI progress denominators use 141 targets; published content counts are separate actuals. Inventory/mapping work remains for all 141 IDs.

### Do Not

Do not “fix” UI by hard-coding 151→141 without root-cause analysis. Do not treat NhatKanji article count as canonical grouping.

### Related Files

`content/grammar/n2/manifest.json`, `docs/grammar-n2/PLAN.md`, Master Requirement

---

## ADR-004 — Content vs UX vs structure source roles

Date: Master Requirement  
Status: Accepted

### Context

Three references exist: Shinkanzen PDF, NhatKanji site, Tiếng Nhật Đơn Giản materials.

### Decision

- Structure: Shinkanzen  
- Function/UX reference: NhatKanji (not pixel clone, not content scrape)  
- Primary content: Tiếng Nhật Đơn Giản (with source metadata)  

### Reason

Avoid mixed authorities and copyright/UX cloning issues.

### Consequences

SOURCE-MAPPING must record match status across sources; one canonical group may map to multiple articles.

### Do Not

Do not let website article count redefine group count. Do not ship copyrighted full PDF/scan in public bundles.

### Related Files

Master Requirement §1–4; planned `SOURCE-MAPPING.md`

---

## ADR-005 — Translation grading is matched / needs_review

Date: 2026-09-13 (implemented in `grade()`)  
Status: Accepted

### Context

Japanese/Vietnamese translations admit valid variants.

### Decision

Server returns `matched` or `needs_review` for translation modes; ordering uses `correct`/`incorrect`. Self-review required for completion when `needs_review`. Reveal ≠ independent mastery/XP.

### Reason

Master Requirement and UX-CONTRACT: do not mark all non-equal strings wrong; no fake AI authority in v1.

### Consequences

Completion logic and XP rules must respect reveal/check flags.

### Do Not

Do not auto-convert translation scores into FSRS ratings without an approved rule.

### Related Files

`server/modules/grammar/content.ts`, `UX-CONTRACT.md`, grammar tests

---

## ADR-006 — Immutable content revisions + stable pattern IDs

Date: 2026-09-13  
Status: Accepted

### Context

Edits to exercises/theory must not silently invalidate history or allow answer leaks via stale clients.

### Decision

Store pattern JSON snapshots in `grammar_content_revisions`. Changing content requires revision increment (startup compares). Keep pattern IDs stable (`sai`, …). One session per user/pattern/revision.

### Reason

Protect attempts/history; enable safe content updates.

### Consequences

Semantic Lesson 1 polish must bump revision; old sessions remain exportable.

### Do Not

Do not silently mutate published revision payloads. Do not remap IDs to “clean up” naming without migration + user approval.

### Related Files

`server/modules/grammar/router.ts`, `migration.sql`, `lesson-01.json`

---

## ADR-007 — Repository is persistent AI memory

Date: 2026-09-14  
Status: Accepted

### Context

Chat history is lost across accounts/models/machines.

### Decision

Maintain `docs/PROJECT-CONTEXT.md`, `PLAN.md`, `PROGRESS.md`, `HANDOFF.md`, `DECISIONS.md`, `AI-BOOTSTRAP.md` and `.cursor/rules/project-memory.mdc`. Agents must update these after verified work.

### Reason

User requirement for cross-account continuity.

### Consequences

Slight doc overhead per task; HANDOFF must stay factual.

### Do Not

Do not treat conversation memory as SoT. Do not fabricate verification or counts.

### Related Files

`docs/AI-BOOTSTRAP.md`, `.cursor/rules/project-memory.mdc`
