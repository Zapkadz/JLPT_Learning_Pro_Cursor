# PROGRESS — factual completion log

Last updated: 2026-09-18
Rule: **never** write targets as completed counts.

## Current Status

- Product core (auth, decks, FSRS review, kana, JLPT practice, stats/export): **shipped in repo** (see README).
- Grammar N2: **26 / 141 / 4230** published on `main`; N2-FULL-ACC automated PASS; N2-L01-FURI-001 merged (PR #14 @ `7b1e324`); teacher review still PENDING.
- Persistent project memory: MEM-001 DONE; **KAI-MEM-001 DONE** (2026-09-17) — Kaiwa integrated into root memory + autonomous workflow.
- **Kaiwa Studio:** KAI-001–014, KAI-016–022, KAI-030a, KAI-031–032 DONE. Gate A **pending device evidence (KAI-033)**. KAI-015 / KAI-030b deferred.
- Git: `feat/kaiwa-memory`.
- Local unrelated WIP: grammar revision bumps may remain dirty — exclude from Kaiwa commits.

## TARGET vs ACTUAL (Grammar N2)

| Metric | TARGET | ACTUAL (re-verified 2026-09-16 after N2-FULL-ACC on `main` + evidence branch) |
|--------|--------|-----------------------------------------------|
| Lessons in manifest | 26 | 26 rows; **all published** |
| Lessons published / learnable | 26 | **26** |
| Canonical groups | 141 | **141** implemented |
| Exercises | 4230 | **4230** validated (unique IDs + prompts) |
| Learning examples (published) | richer set | **3 per group** |
| TNĐG URLs | 141 mapped | **DONE** — 7 partial-match rows |
| Independent teacher review | desired | **Not done** (`agent_reviewed` only) |

Lesson 1 pattern IDs: `sai`, `saishite`, `totan`, `omouto`, `kanai` (on `main` after FURI: content revision as committed in PR #14; local dirty bumps may differ — trust git for facts).
Lessons 2–26: `lXX-gYY` IDs; all published.

partial-match: `l04-g05`, `l04-g06`, `l13-g02`, `l13-g05`, `l18-g03`, `l23-g06`, `l26-g02`.

## Completed Work (evidence-based)

### Core product 1.0 (pre-existing)

Result: Local full-stack app as described in `README.md`, `DESIGN.md`, `docs/PRODUCT.md`.
Important areas: `src/`, `server/app.ts`, `shared/domain.ts`, `tests/api.test.ts`, `tests/app.spec.ts`.

### Grammar N2 Lesson 1 pilot (documented 2026-09-13 in `docs/grammar-n2/PROGRESS.md`)

| Legacy ID | Result |
|-----------|--------|
| G04–G10 | Lesson 1 content, API, UI, practice modes, progress/SRS/export, acceptance for pilot scope |

### MEM-001 (2026-09-14) — DONE

Root project memory docs + `.cursor/rules/project-memory.mdc`.

### N2-GIT-000 (2026-09-14) — DONE

Git init + push to `origin/main`.

### N2-AUDIT-001 (2026-09-14) — DONE

Re-verified against repository (no app code changes):

- **151 vs 141:** Kotoba UI/API use `targetGroups: 141`. No `151` in `src/` or content. **151** is NhatKanji reference count in `docs/grammar-n2/PLAN.md` only.
- L1: 5 groups × 30 = 150; each group 10 vi-ja + 10 ja-vi + 10 order; 150 unique exercise IDs and prompts; 0 reverse VI↔JA pairs; 0 learning↔practice overlaps (exact/substring); 0 one-token near-dups; order structures valid.
- Learning examples: 1 per group with structured ruby; practice JA→VI: plain text, no ruby fields.
- Source metadata: pattern `source.pdfPage/printedPage` + lesson `provenance`; no Tiếng Nhật Đơn Giản URLs; no exercise `origin`.
- Progress/SRS keyed by stable `pattern_id` strings; stats entity `grammar:{patternId}`.
- Scale gap: `content.ts` hardcodes `lesson-01.json`; UI hardcodes Bài 01 paths; SOURCE-MAPPING missing.
- Tests: `tests/grammar/grammar.test.ts` (3 cases); no Playwright grammar journey file.

### N2-L01-FURI-001 (2026-09-16) — DONE

- Product decision **B**: optional JA→VI furigana via structured `promptRuby` + shared toggle (`kotoba-grammar-reading`); all 26 lessons.
- ADR-009 recorded.
- Schema/DTO/UI: `shared/grammar/types.ts`, `publicExercise`, practice screen toggle + ruby render.
- Content: `scripts/gen-n2-ja-vi-prompt-ruby.mjs` (Kuroshiro) filled **1410** ja-vi items; raw `prompt` unchanged.
- Verification: `npm test` **16/16** (new FURI validator); `npm run build` OK.
- Merged PR #14 into `main` (`7b1e324`). Readings are agent-generated — not teacher-verified.

### N2-FULL-ACC (2026-09-16) — DONE (automated; teacher PENDING)

- Merged PR #12; branch `feat/n2-full-acc`.
- Added `scripts/n2-full-acceptance.mjs` (hard fail on §73 content/scale violations).
- Report: `docs/grammar-n2/FULL-ACCEPTANCE.md` + `FULL-ACCEPTANCE-EVIDENCE.json`.
- Evidence: 26/141/4230; unique IDs/prompts 4230; `npm test` **15/15**; `npm run build` OK; `test:e2e` **2/2**.
- Explicitly **not** claiming independent teacher review (§23).
- Merged PR #13 (`902e0f0`).

### N2-L21-BATCH (2026-09-16) — DONE

- Authored + published Lessons 21–26: 36 groups × 30 exercises = **1080** (plus 3 examples/group).
- Files: `lesson-21.json`…`lesson-26.json`; manifest all `published: true`; inventory `imported` / `agent_reviewed`.
- Generators: `scripts/gen-n2-l21-batch.mjs`, `scripts/n2-batch/lesson21.mjs`…`lesson26.mjs`.
- Course totals on branch: **26 lessons / 141 groups / 4230 exercises**.
- Tests: DoD L2–26; unpublished path now only `lesson-99`; progressDenominator === publishedGroups (141).
- Branch: merged via PR #12 into `main` (`1d229f6`).
- Verification: `npm test` **15/15 pass**; `npm run build` OK.
- Note: still `agent_reviewed` only — **N2-FULL-ACC** teacher review not claimed.

### N2-L16-BATCH (2026-09-16) — DONE

- Authored + published Lessons 16–20: 28 groups × 30 exercises = **840** (plus 3 examples/group).
- Files: `lesson-16.json`…`lesson-20.json`; manifest `published: true`; inventory `imported` / `agent_reviewed`.
- Generators: `scripts/gen-n2-l16-batch.mjs`, `scripts/n2-batch/lesson16.mjs`…`lesson20.mjs`.
- Tests: 20 published lessons / 105 patterns / 3150 exercises; DoD L2–20.
- Branch: merged via PR #11 into `main` (`80c6da9`).
- Verification: `npm test` **15/15 pass**; `npm run build` OK.
- Note: still `agent_reviewed` only.

### N2-L11-BATCH (2026-09-16) — DONE

- Authored + published Lessons 11–15: 27 groups × 30 exercises = **810** (plus 3 examples/group).
- Files: `lesson-11.json`…`lesson-15.json`; manifest `published: true`; inventory `imported` / `agent_reviewed`.
- Generators: `scripts/gen-n2-l11-batch.mjs`, `scripts/n2-batch/lesson11.mjs`…`lesson15.mjs` (prompt uniquify post-step).
- Tests: 15 published lessons / 77 patterns / 2310 exercises; DoD L2–15; unpublished = lesson-16.
- Branch: `feat/n2-l11-batch` @ `7cefe8f` / docs `c3881ad`; PR #10.
- Verification: `npm test` **15/15 pass**; `npm run build` OK.
- Note: still `agent_reviewed` only.

### N2-L06-BATCH (2026-09-16) — DONE

- Authored + published Lessons 6–10: 24 groups × 30 exercises = **720** (plus 3 examples/group).
- Files: `lesson-06.json`…`lesson-10.json`; manifest `published: true`; inventory `imported` / `agent_reviewed`.
- Generators: `scripts/gen-n2-l06-batch.mjs`, `scripts/n2-batch/lesson06.mjs`…`lesson10.mjs`; `fix-overlaps.mjs` 0 tweaks.
- Tests: 10 published lessons / 50 patterns / 1500 exercises; DoD L2–10; inventory L6–10 assertions.
- Branch: merged via PR #9 into `main` (`63cc9c8`).
- Verification: `npm test` **15/15 pass**; `npm run build` OK.
- Note: still `agent_reviewed` only.

### N2-L02-BATCH (2026-09-16) — DONE

- Authored + published Lessons 2–5: 21 groups × 30 exercises = **630** (plus 3 examples/group).
- Files: `lesson-02.json`…`lesson-05.json`; manifest `published: true`; inventory `imported` / `agent_reviewed`.
- Generators: `scripts/gen-n2-l02-batch.mjs`, `scripts/n2-batch/*`, `scripts/fix-overlaps.mjs` (dedupe example↔practice).
- UI/API: lesson payload includes `number`/`title`; Grammar lesson/exercise eyebrows no longer hard-code Bài 01.
- Tests: multi-lesson loader (5 published / 26 patterns); L2–5 golden DoD; course counts 26/780; revisions snapshot 26.
- Branch: merged via PR #8 into `main` (`962a4d6`).
- Verification: `npm test` **15/15 pass** (on feature branch before merge).
- Note: still `agent_reviewed` only — not teacher-verified; target 4230 not complete.

### N2-E2E-001 (2026-09-16) — DONE

- Root cause: unfinished quiz answers opened “Nộp bài còn câu trống?” modal; spec never reached `.result-summary`.
- Fixed `tests/app.spec.ts`: wait for `.answer.selected`, submit via `.quiz-controls`, handle confirm modal, use 5-question quiz.
- Branch: `feat/fix-app-spec-e2e` @ `5ce2bde`; PR https://github.com/Zapkadz/JLPT_Learning_Pro_Cursor/pull/7.
- Verification: `npm run test:e2e` **2/2 pass**.

### N2-TEST-001 (2026-09-15) — DONE

- Renamed Lesson 1 coverage test to golden template validators (examples / 10+10+10 / origin / hints).
- Added `tests/grammar.spec.ts`: register → grammar course → lesson 1 → pattern → furigana + read → one exercise each mode → reload preserves 3/30 → SRS.
- `playwright.config.ts`: `webServer` runs `npm run dev` with temp `DB_PATH` when CI.
- Branch: `feat/n2-test-001` @ `1d04a9b`; PR https://github.com/Zapkadz/JLPT_Learning_Pro_Cursor/pull/6.
- Verification: `npm test` **14/14**; `npx playwright test tests/grammar.spec.ts` **1 passed** (~6.6s).
- Known: full `npm run test:e2e` still fails on legacy `tests/app.spec.ts` (quiz `.result-summary`); out of TEST-001 grammar scope.

### N2-L01-PROG-001 (2026-09-15) — DONE

- Course API exposes `progressDenominator` (= `targetGroups` 141, not `publishedGroups`).
- `read` / `practiced` count only live published pattern IDs (orphan rows ignored; not deleted).
- UI metrics use `progressDenominator` and label “mục tiêu khóa”.
- `/api/export` includes `grammar.events` (XP/heatmap source).
- ADR-008 documents denominator + `grammar:{patternId}` XP entity + no-reset on revision.
- Tests: denominator contract; mark-read ≠ XP; orphan filter; re-check ≠ double XP; export events.
- Branch: `feat/n2-l01-prog-001` @ `a3c171d`; PR https://github.com/Zapkadz/JLPT_Learning_Pro_Cursor/pull/5.
- Verification: `npm test` **14/14 pass**.

### N2-L01-GOLD-002 (2026-09-15) — DONE

- Tagged all 150 Lesson 1 exercises with `origin: "authored"` + `sourceNote: "Lesson 1 pilot authored"`.
- Bumped lesson/pattern revision **4 → 5**; updated provenance note.
- Strengthened coverage validators: origin required; hints must not equal or contain full answers; public DTO strips origin/sourceNote.
- QA audit: 0 hint↔answer leaks; short form hints (`Nの ＋ 際`) kept as structural cues.
- Branch: `feat/n2-l01-gold-002` @ `4ab81a2`; PR https://github.com/Zapkadz/JLPT_Learning_Pro_Cursor/pull/4.
- Verification: `npm test` **14/14 pass**.

### N2-L01-GOLD-001 (2026-09-15) — DONE

- Enriched Lesson 1 learning examples to **3 per group** with structured ruby.
- Filled `variants` + `source.urls` from inventory; bumped lesson/pattern revision **3 → 4**.
- UI: show variants on pattern detail.
- Tests: ≥3 examples, no exact overlap with practice prompts/answers, ruby text joins to `ja`.
- Merged via PR #3 into `main` (`a1a7bcb`).

### N2-L01-UX-001 (2026-09-15) — DONE

- Course hero CTA uses first `published` lesson from API.
- Pattern detail returns `lessonId` / `lessonNumber` / `lessonTitle`; back-link uses those.
- SRS deck blurb uses lesson number from manifest.
- No `lesson-01` string left in `Grammar.tsx`.

### N2-ARCH-002 (2026-09-15) — DONE

- Extended `patternSchema` with `variants` (default `[]`) and `source.urls` (default `[]`).
- Extended exercises with optional `origin` (`source` | `source-adapted` | `authored`) and `sourceNote`.
- Lesson 1 JSON unchanged; still parses. `publicExercise` strips answers/origin/sourceNote.
- Lesson list API returns `variants`. Branch: `feat/n2-arch-002-metadata`.

### N2-ARCH-001 (2026-09-15) — DONE

- Replaced hard-coded `lesson-01.json` load with manifest-driven loader.
- Only `published: true` lessons are loaded; missing published file fails at startup.
- Router: `GET /lessons/:id` unpublished/unknown → 404; course counts from `allPatterns()`.
- Branch: `feat/n2-arch-001-loader`. No L2–26 content JSON added.

### N2-MAP-002 L21–26 batch (2026-09-15) — DONE (141/141)

- Filled final 36 `canonicalPattern`s (L22–26 from 3A TOC; L21 from Quizlet/mylittlewordland).
- Mapped TNĐG URLs; `l23-g06` / `l26-g02` marked `partial-match`.
- Inventory test updated to assert 141 mapped / 0 `needs-review`.

### N2-MAP-002 L16–20 batch (2026-09-15) — DONE (105/141 cumulative at time)

- Filled `canonicalPattern` for lessons 16–20 from 3A TOC.
- Mapped TNĐG URLs; `l18-g03` (かねる) marked `partial-match`.

### N2-MAP-002 L11–15 batch (2026-09-15) — DONE (77/141 cumulative at time)

- Filled `canonicalPattern` for lessons 11–15 from 3A TOC.
- Mapped TNĐG URLs; `l13-g02` / `l13-g05` marked `partial-match`.

### N2-MAP-002 L6–10 batch (2026-09-14) — DONE (50/141 cumulative at time)

- Filled `canonicalPattern` for lessons 6–10 from 3A TOC.
- Mapped TNĐG URLs (all full-match in this batch).

### N2-MAP-002 L2–5 batch (2026-09-14) — DONE (26/141 cumulative at time)

- Filled `canonicalPattern` for lessons 2–5 from 3A Shinkanzen TOC.
- Mapped TNĐG URLs; `l04-g05` / `l04-g06` marked `partial-match`.

### N2-MAP-002 L1 batch (2026-09-14)

- Mapped Lesson 1 groups to Tiếng Nhật Đơn Giản URLs in `inventory.json`.

### KAI-009 (2026-09-17) — DONE

Pluggable media probe (sniff default + optional ffprobe), pilot limits, `POST /assets/:id/probe`, corrupt vs unsupported.
Evidence: `docs/kaiwa/evidence/kai-009/REPORT.md`. Verify: `npm test` **32/32**.

### KAI-008 (2026-09-17) — DONE

Chunked binary upload (`/api/kaiwa/uploads`) with SHA-256 per chunk, duplicate-safe, checksum conflict, incomplete-complete blocked, cancel frees quota; JSON 2MB limit unchanged (raw route only).
Verify: `npm test` **29/29**.

### KAI-007 (2026-09-17) — DONE

DB job queue with lease reclaim after worker death, idempotent complete, retries, readable terminal errors, `npm run kaiwa:worker` noop/echo handler.
Verify: `npm test` **27/27**.

### KAI-006 (2026-09-17) — DONE

Private `LocalMediaStorage` under `data/.../kaiwa-media` (env `KAIWA_MEDIA_ROOT`); server-generated keys; quota reservation + release; auth GET/HEAD/Range on `/api/kaiwa/assets/:id/content`. Migration marker `kaiwa-002`.
Verify: `npm test` **24/24**.

### KAI-005 (2026-09-17) — DONE

Additive `kaiwa-001` migration; `shared/kaiwa` Zod; repository + `/api/kaiwa` project/draft/revision/attempt routes; owner isolation; optimistic conflict; attempt pins reviewed revision.
Verify: `npm test` **21/21**.

### KAI-033 packaging (2026-09-18) — PARTIAL (device BLOCKED)

Gate A checklist, USAGE-GATE-A, release/rollback notes, `npm run kaiwa:gate-a-preflight` (70/70 + build), review scoring honesty banner. **Gate A not accepted** until CHECKLIST device rows PASS.

### KAI-032 (2026-09-18) — DONE

Cross-account ownership isolation for project/attempt/export/history; unauth reject; security evidence index + manual a11y checklist for Gate A. Evidence: `docs/kaiwa/evidence/kai-032/REPORT.md`. Verify: **70/70**; build OK.

### KAI-031 (2026-09-18) — DONE

Soft-delete project cancels jobs + GC tombstoned assets; `backup --with-media` + MANIFEST verify; ops snapshot; redactForLog. Evidence: `docs/kaiwa/evidence/kai-031/REPORT.md`. Verify: **68/68**; build OK.

### KAI-030a (2026-09-18) — DONE

Take history + `kaiwa_activity_events` on finalize (idempotent); `/kaiwa/history`; ADR-018 separates Kaiwa from deck/grammar XP. Evidence: `docs/kaiwa/evidence/kai-030a/REPORT.md`. Verify: **65/65**; build OK.

### KAI-022 (2026-09-18) — DONE

Export MP4 with mix snapshot, idempotent per fingerprint, private download; ffmpeg mix when `FFMPEG_PATH` set else synthetic container. Evidence: `docs/kaiwa/evidence/kai-022/REPORT.md`. Verify: **64/64**; build OK.

### KAI-021 (2026-09-18) — DONE

Review page `/kaiwa/attempts/:id` with dual-gain mix (video original + mic learner), mix persist via `PATCH …/mix`, project attempt list, re-record creates new attempt. Evidence: `docs/kaiwa/evidence/kai-021/REPORT.md`. Verify: **63/63**; build OK.

### KAI-020 (2026-09-18) — DONE

Finalize take service: auto-assemble, mic-only validation, head/mid/tail Range check, interrupted/`tailMissing` honesty, idempotent.
Evidence: `docs/kaiwa/evidence/kai-020/REPORT.md`. Verify: `npm test` **62/62**.

### KAI-019 (2026-09-18) — DONE

IndexedDB/memory journal; attempt chunk upload resume; assemble WebM/Ogg gate; finalize requires audio for saved completed/partial.
Evidence: `docs/kaiwa/evidence/kai-019/REPORT.md`. Verify: `npm test` **59/59**; build OK.

### KAI-018 (2026-09-18) — DONE

Capture state machine; continuous MediaRecorder + video clock; countdown; early stop=partial / EOF=completed; idempotent finalize. Journal upload deferred to KAI-019.
Evidence: `docs/kaiwa/evidence/kai-018/REPORT.md`. Verify: `npm test` **56/56**; build OK.

### KAI-017 (2026-09-18) — DONE

Mic preflight: permission/device/meter/local test clip; no speaker loopback; stop on leave; no external provider.
Evidence: `docs/kaiwa/evidence/kai-017/REPORT.md`. Verify: `npm test` **52/52**; build OK.

### KAI-016 (2026-09-18) — DONE

Prep screen (seek sync + help toggles); `start-practice` publishes and pins immutable revision; empty transcript still startable with honesty copy; studio shell shows snapshot.
Evidence: `docs/kaiwa/evidence/kai-016/REPORT.md`. Verify: `npm test` **50/50**; build OK.

### KAI-014 (2026-09-18) — DONE

Segment tokens + readingStale; Hepburn romaji exceptions; independent furigana/romaji/VI toggles (romaji default off); manual overrides persist.
Evidence: `docs/kaiwa/evidence/kai-014/REPORT.md`. Verify: `npm test` **48/48**; build OK.

### KAI-013 (2026-09-17) — DONE

Shared SRT/VTT parser (BOM/CRLF/HTML-safe/overlaps) + transcript editor with split/merge/save/publish.
Evidence: `docs/kaiwa/evidence/kai-013/REPORT.md`. Verify: `npm test` **42/42**; build OK.

### KAI-012 (2026-09-17) — DONE

Synthetic fixture set (short/long/vertical/silent/weird/corrupt) + vertical-slice upload resume → prepare → Range; corrupt rejected.
Evidence: `docs/kaiwa/evidence/kai-012/REPORT.md`. Verify: `npm test` **38/38**.

### KAI-011 (2026-09-17) — DONE

Kaiwa library/upload/project UI; chunked resume; `prepare-media`; cookie-auth Range `<video>`.
Evidence: `docs/kaiwa/evidence/kai-011/REPORT.md`. Verify: `npm test` **34/34**; `npm run build` OK.

### KAI-010 (2026-09-17) — DONE (passthrough foundation)

`POST /assets/:id/prepare-playback`: probe gate → immutable source → proxy copy + identity timeline mapping. `LocalMediaStorage.copyFile` for sharded dirs. ffmpeg normalize / binary thumbnail deferred (`FFMPEG_PATH`).
Evidence: `docs/kaiwa/evidence/kai-010/REPORT.md`. Verify: kaiwa tests **17/17**.

### KAI-004 (2026-09-17) — DONE (UX spec)

Wireflows, recorder axes, data-loss copy, loading/empty/error/offline, browser claim matrix.
Evidence: `docs/kaiwa/evidence/kai-004/UX-SPEC.md`. No production UI code.

### KAI-003 (2026-09-17) — DONE (capability spike; no live API)

ja-JP capability map from public vendor docs; forbidden fake metrics; fallback without API; benchmark outline.
Live samples: **UNAVAILABLE** (`missing_credentials`). ADR-017. Evidence: `docs/kaiwa/evidence/kai-003/REPORT.md`.

### KAI-002 (2026-09-17) — DONE (spike / ADR)

Continuous capture harness + Chromium lab metrics (20s / 120s / **600s**). Drift ≤100 ms head/mid/tail on synthetic video/mic.
Evidence: `docs/kaiwa/evidence/kai-002/`. ADR-016: MediaRecorder + Opus/WebM + video/perf clock.
No product UI/API shipped; no user media committed.

### KAI-001 (2026-09-17) — DONE (audit / ADR only)

Integration survey of auth, nav, stats, backup, middleware, migrations, media gaps.
Evidence: `docs/kaiwa/evidence/KAI-001-integration-audit.md`.
ADR-015: pilot limits, privacy/retention, integration boundaries.
**No** Kaiwa application directories, migrations, or behaviour changes to existing modules.

### KAI-MEM-001 (2026-09-17) — DONE (documentation / memory only)

Integrated approved Kaiwa plan into central project memory and autonomous workflow:

- Root: `PRODUCT.md`, `PROJECT-CONTEXT.md`, `PLAN.md`, `PROGRESS.md`, `HANDOFF.md`, `DECISIONS.md` (ADR-010…014), `AI-BOOTSTRAP.md`
- Rules: `.cursor/rules/development-workflow.mdc`, `project-memory.mdc`
- Module sources of truth unchanged in role: `docs/kaiwa/PLAN.md`, `TASKS.md`, `IMPLEMENTATION-RULES.md` (DOC-001/002/003)

**Not done:** any Kaiwa application code, migration, dependency, UI, or Gate A/B acceptance.

### DOC-001 / DOC-002 / DOC-003 (2026-09-17) — DONE (Kaiwa docs only)

Planning / tasks / implementation-rules present under `docs/kaiwa/`. These are **not** product feature completions.

## Verification History

| When | What | Result | Evidence |
|------|------|--------|----------|
| 2026-09-18 | KAI-033 Gate A docs + preflight | preflight OK (70/70 + build); device PENDING | `docs/kaiwa/evidence/kai-033/` |
| 2026-09-18 | KAI-032 security / ownership QA | **70/70** npm test; build OK | `docs/kaiwa/evidence/kai-032/REPORT.md` |
| 2026-09-18 | KAI-031 backup/soft-delete/GC | **68/68** npm test; build OK | `docs/kaiwa/evidence/kai-031/REPORT.md` |
| 2026-09-18 | KAI-030a history + ADR-018 | **65/65** npm test; build OK | `docs/kaiwa/evidence/kai-030a/REPORT.md` |
| 2026-09-18 | KAI-022 export MP4 + download | **64/64** npm test; build OK | `docs/kaiwa/evidence/kai-022/REPORT.md` |
| 2026-09-18 | KAI-021 review dual-gain + take history | **63/63** npm test; build OK | `docs/kaiwa/evidence/kai-021/REPORT.md` |
| 2026-09-18 | KAI-020 finalize take | **62/62** npm test | `docs/kaiwa/evidence/kai-020/REPORT.md` |
| 2026-09-18 | KAI-019 journal + chunk resume | **59/59** npm test; build OK | `docs/kaiwa/evidence/kai-019/REPORT.md` |
| 2026-09-18 | KAI-018 continuous recorder | **56/56** npm test; build OK | `docs/kaiwa/evidence/kai-018/REPORT.md` |
| 2026-09-18 | KAI-017 mic preflight | **52/52** npm test; build OK | `docs/kaiwa/evidence/kai-017/REPORT.md` |
| 2026-09-18 | KAI-016 prep + snapshot | **50/50** npm test; build OK | `docs/kaiwa/evidence/kai-016/REPORT.md` |
| 2026-09-18 | KAI-014 reading/romaji layers | **48/48** npm test; build OK | `docs/kaiwa/evidence/kai-014/REPORT.md` |
| 2026-09-17 | KAI-013 SRT/VTT + editor | **42/42** npm test; build OK | `docs/kaiwa/evidence/kai-013/REPORT.md` |
| 2026-09-17 | KAI-012 fixtures + vertical slice | **38/38** npm test | `docs/kaiwa/evidence/kai-012/REPORT.md` |
| 2026-09-17 | KAI-011 upload UI + prepare-media | **34/34** npm test; build OK | `docs/kaiwa/evidence/kai-011/REPORT.md` |
| 2026-09-17 | KAI-010 proxy/timeline passthrough | **17/17** kaiwa tests | `docs/kaiwa/evidence/kai-010/REPORT.md` |
| 2026-09-17 | KAI-009 media probe | **32/32** npm test | `server/modules/kaiwa/probe/*` |
| 2026-09-17 | KAI-008 chunked upload | **29/29** npm test | `server/modules/kaiwa/uploads.ts` |
| 2026-09-17 | KAI-007 durable jobs + worker | **27/27** npm test | `server/modules/kaiwa/jobs.ts`, `server/workers/kaiwa/worker.ts` |
| 2026-09-17 | KAI-006 private storage + quota + Range | **24/24** npm test | `server/modules/kaiwa/storage.ts`, `assets.ts` |
| 2026-09-17 | KAI-005 schema/contracts/repository | **21/21** npm test | `shared/kaiwa`, `server/modules/kaiwa`, `tests/kaiwa` |
| 2026-09-17 | KAI-004 UX specification | wireflow/spec DONE | `docs/kaiwa/evidence/kai-004/UX-SPEC.md` |
| 2026-09-17 | KAI-003 scoring capability spike | docs map; live UNAVAILABLE; ADR-017 | `docs/kaiwa/evidence/kai-003/REPORT.md` |
| 2026-09-17 | KAI-002 capture spike 20s/120s/600s | drift ≤100 ms PASS; ADR-016 | `docs/kaiwa/evidence/kai-002/` |
| 2026-09-17 | KAI-001 integration audit + ADR-015 | docs evidence; no app code | `docs/kaiwa/evidence/KAI-001-integration-audit.md` |
| 2026-09-17 | KAI-MEM-001 memory/rules integration | docs consistency audit + `git diff --check` | `feat/kaiwa-memory` `8391ada` |
| 2026-09-16 | N2-L01-FURI-001 JA→VI promptRuby (ADR-009) | **16/16 pass**; build OK; merged PR #14 | `7b1e324` |
| 2026-09-16 | N2-FULL-ACC automated §73 evidence | acceptance PASS; **15/15**; e2e **2/2**; build OK | PR #13 merged `902e0f0` |
| 2026-09-16 | N2-L21-BATCH Lessons 21–26 publish | **15/15 pass**; build OK | PR #12 merged `1d229f6` |
| 2026-09-16 | N2-L16-BATCH Lessons 16–20 publish | **15/15 pass**; build OK | `npm test`; `npm run build` on `feat/n2-l16-batch` |
| 2026-09-16 | N2-L11-BATCH Lessons 11–15 publish | **15/15 pass**; build OK | `npm test`; `npm run build` on `feat/n2-l11-batch` |
| 2026-09-16 | N2-L06-BATCH Lessons 6–10 publish | **15/15 pass**; build OK | `npm test`; `npm run build` on `feat/n2-l06-batch` |
| 2026-09-16 | N2-L02-BATCH Lessons 2–5 publish | **15/15 pass** | `npm test` |
| 2026-09-16 | N2-E2E-001 fix legacy app.spec | **2/2 pass** | `npm run test:e2e` |
| 2026-09-15 | N2-TEST-001 golden validators + grammar Playwright | **14/14** unit; grammar e2e **1/1** | `npm test`; `playwright test tests/grammar.spec.ts` |
| 2026-09-15 | N2-L01-PROG-001 progress denominator + XP export | **14/14 pass** | `npm test` |
| 2026-09-15 | N2-L01-GOLD-002 origin + hint validators + rev 5 | **14/14 pass** | `npm test` |
| 2026-09-15 | N2-L01-GOLD-001 examples/variants + rev 4 | **14/14 pass** | `npm test` (re-verified) |
| 2026-09-15 | N2-L01-UX-001 + pattern lesson metadata | **14/14 pass** | `npm test` |
| 2026-09-15 | N2-ARCH-002 additive Zod metadata + DTO strip | **14/14 pass** | `npm test` |
| 2026-09-15 | N2-ARCH-001 multi-lesson loader after PR merge | **13/13 pass** | `npm test` on `main` |
| 2026-09-15 | N2-MAP-002 L21–26 + inventory test | **12/12 pass** | `npm test` |
| 2026-09-15 | N2-MAP-002 L16–20 + inventory test | **12/12 pass** | `npm test` |
| 2026-09-15 | N2-MAP-002 L11–15 + inventory test | **12/12 pass** | `npm test` |
| 2026-09-14 | N2-MAP-002 L6–10 + inventory test | **12/12 pass** | `npm test` |
| 2026-09-14 | N2-MAP-002 L2–5 + inventory test | **12/12 pass** | `npm test` |
| 2026-09-14 | N2-MAP-002 L1 + inventory test | **12/12 pass** | `npm test` |
| 2026-09-14 | N2-MAP-001 inventory test | **12/12 pass** (with full suite) | `npm test` after MAP-001 |
| 2026-09-14 | `npm test` | **11/11 pass** (earlier same calendar day) | Prior session |
| 2026-09-14 | `npm run build` / `test:e2e` / `format:check` | **NOT RUN** during N2-AUDIT-001 | — |

## Known Incomplete Work

- Kaiwa **KAI-033** Gate A device acceptance. KAI-015 ASR deferred; KAI-030b speaking XP deferred.
- KAI-010 ffmpeg normalize / thumbnail binary still deferred until `FFMPEG_PATH` (passthrough proxy OK for UI).
- Independent teacher review of N2 content / furigana readings (language QA).
- Possible local grammar content `revision` bump still uncommitted (separate from Kaiwa).

## Known Issues

- Dual trackers: `docs/grammar-n2/*` (history) vs root PLAN/PROGRESS (active).
- UX-CONTRACT cites `server/index.ts` for CRUD; implementation is `server/app.ts`.
- `premium-audit.json` stale `projectRoot` path.
- L2–26 learning examples may use simplified single-span ruby after overlap fixes in some regenerated paths — structured ruby preferred on re-author.
- JA→VI `promptRuby` readings from Kuroshiro are agent-generated; may need teacher correction.

## Blockers

1. Human teacher/reviewer required for true independent Grammar N2 language / reading verification (does **not** block Kaiwa KAI-001).
2. **KAI-033 Gate A**: real-device Chrome/Edge capture + full-flow evidence required before accepting Gate A.
3. No Kaiwa hard blocker for automated tasks through KAI-032.
