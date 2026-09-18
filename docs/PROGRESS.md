# PROGRESS — factual completion log

Last updated: 2026-09-18
Rule: **never** write targets as completed counts.

## Current Status

- Product core (auth, decks, FSRS review, kana, JLPT practice, stats/export): **shipped in repo** (see README).
- Grammar N2: **26 / 141 / 4230** published on `main`; N2-FULL-ACC automated PASS; N2-L01-FURI-001 merged (PR #14 @ `7b1e324`); teacher review still PENDING.
- Persistent project memory: MEM-001 DONE; **KAI-MEM-001 DONE** (2026-09-17) — Kaiwa integrated into root memory + autonomous workflow.
- **Kaiwa Studio:** Gate A **ACCEPTED**. Forced-align **KAI-065–074** path DONE (incl. waveform KAI-073); next **KAI-075** smoke.
- Local speech env: `npm run kaiwa:speech-env` → ready.
- Git: `feat/kaiwa-memory`.
- Local unrelated WIP: grammar revision bumps may remain dirty — exclude from Kaiwa commits.

### KAI-072 (2026-09-18) — DONE

Editor filters (unmatched / needs_review), listen-with-context, studio + continuous skip unmatched windows. Evidence: `docs/kaiwa/evidence/kai-072/REPORT.md`. Verify: **123/123** + build OK.

### KAI-071 (2026-09-18) — DONE

Long-video overlapping align windows; failed windows skipped; optional anchors; no char-proportional split. Evidence: `docs/kaiwa/evidence/kai-071/REPORT.md`. Verify: **128/128** + build OK.

### KAI-074 (2026-09-18) — DONE

Speech vs practice/overlay padding (config-only; transcript end not stretched to next line). Evidence: `docs/kaiwa/evidence/kai-074/REPORT.md`. Verify: **131/131** + build OK.

### KAI-073 (2026-09-18) — DONE

Waveform drag, lock, realign selection / between locks, timing undo; 25/30 preserve test. Evidence: `docs/kaiwa/evidence/kai-073/REPORT.md`. Verify: **135/135** + build OK.

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

### KAI-059–062 (2026-09-18) — DONE

Device feedback: sync after apply; furigana/vi empty hints on overlays; Whisper default `base`; ASR empty → clear 422. Verify: `npm test` **120/120**.

### KAI-056–058 (2026-09-18) — DONE

v2 ASR: `POST …/transcriptions` (Whisper/mock) → draft `source=asr`; UI CTA + risk banner; USAGE/release notes. Evidence: `docs/kaiwa/evidence/kai-056/REPORT.md`.

### KAI-055 (2026-09-18) — DONE

USAGE-GATE-A + RELEASE-NOTES honesty for script-align v1; capability `scriptAlign` documented; manual fallback + no auto-publish. Evidence: `docs/kaiwa/evidence/kai-055/REPORT.md`. Verify: `npm test`; build OK.

### KAI-054 (2026-09-18) — DONE

Transcript editor: CTA đồng bộ + consent, calling `POST …/script-align`, machine-draft banner, uncertain segment hint. Verify: `npm test` **117/117**; build OK.

### KAI-053 (2026-09-18) — DONE

`POST /kaiwa/projects/:id/script-align`: enqueue `align_script`, ffmpeg extract + faster-whisper sidecar (or `KAIWA_SCRIPT_ALIGN_ENGINE=mock`), write draft + `source_json` (`script_align`), bump revision version on machine write (409 if stale), `timingUncertain` on segments, capability `scriptAlign`. Verify: `npm test` **117/117**; build OK.

### KAI-052 (2026-09-18) — DONE

Unblocked: winget ffmpeg + edge-tts JA fixture + `faster-whisper` (`tiny`). Engine A selected. Median |Δstart| **448 ms**, |Δend| **404 ms** (3/3 lines). Evidence: `docs/kaiwa/evidence/kai-052/` + `scripts/kaiwa/spike_script_align.py`.

### KAI-052 (2026-09-18) — BLOCKED (env) [superseded]

Env probe: no `FFMPEG_PATH`, no ffmpeg on PATH, no speech `.env`, no JA audio fixture. Provisional engine = Whisper word-timestamps + script match (vendor not locked). Timing measurement deferred. Evidence: `docs/kaiwa/evidence/kai-052/REPORT.md`. Do not start KAI-053 until unblocked.

### KAI-051 (2026-09-18) — DONE

Untimed script ingest: `parseUntimedScript` (plain / .txt / zero-time SRT text) → draft segments with placeholder times; transcript UI paste + `.txt`/`.md` upload. Verify: `npm test` **114/114**; `npm run build` OK.

### KAI-050 (2026-09-18) — DONE (plan/spec only)

ADR-020 + AUTO-SUBTITLE-SPEC for v1 script-sync / v2 ASR; backlog KAI-051–058. Evidence: `docs/kaiwa/evidence/kai-050/`. No app code.

### KAI-047 (2026-09-18) — DONE

USAGE-GATE-A + RELEASE-NOTES dual-mode / capture_mode honesty. Evidence: `docs/kaiwa/evidence/kai-047/REPORT.md`.

### KAI-045 (2026-09-18) — DONE

Gate A checklist + preflight require segment PASS; continuous advanced. Evidence: `docs/kaiwa/evidence/kai-045/REPORT.md`.

### KAI-044 (2026-09-18) — DONE

Review per-segment status + seek window + clip play. Evidence: `docs/kaiwa/evidence/kai-044/REPORT.md`. Verify: **110/110**.

### KAI-043 (2026-09-18) — DONE

Subset filters (all/missing/marked), resume first pending, localStorage marks. Evidence: `docs/kaiwa/evidence/kai-043/REPORT.md`. Verify: **109/109**.

### KAI-042 (2026-09-18) — DONE

Re-record versioning + history API; peer clips preserved. Evidence: `docs/kaiwa/evidence/kai-042/REPORT.md`. Verify: **109/109**.

### KAI-041 (2026-09-18) — DONE

Continuous recorder on-video overlay (current + next by clock). Evidence: `docs/kaiwa/evidence/kai-041/REPORT.md`. Verify: **108/108**.

### KAI-040 (2026-09-18) — DONE

Persist `kaiwa-capture-mode` preference; prep/start uses it; studio picker copy per ADR-019. Evidence: `docs/kaiwa/evidence/kai-040/REPORT.md`. Verify: **106/106**.

### KAI-039 (2026-09-18) — DONE

Assemble segment clips → full-duration learner mic track (`assembly=segment_timeline`); finalize + export; SegmentStudio end-session wires assemble. Evidence: `docs/kaiwa/evidence/kai-039/REPORT.md`. Verify: **106/106**.

### KAI-038 (2026-09-18) — DONE

Segment studio UI: overlay script, clip record/skip/nav, mode picker. Evidence: `docs/kaiwa/evidence/kai-038/REPORT.md`. Verify: **103/103**.

### KAI-037 (2026-09-18) — DONE

Segment clips table + APIs; default `captureMode=segment`; versioned re-record; ownership. Evidence: `docs/kaiwa/evidence/kai-037/REPORT.md`. Verify: **102/102**.

### KAI-036 (2026-09-18) — DONE (spec)

Segment studio UX spec (overlay, clip N/M, skip/subset); USAGE/CHECKLIST/UX-SPEC updated for ADR-019. Evidence: `docs/kaiwa/evidence/kai-036/`. Docs-only.

### KAI-029 (2026-09-18) — DONE (honest unavailable priorities)

Review UI assessment panel: ≤3 priorities, seek-to-evidence, null overall score, export unblocked on fail. Evidence: `docs/kaiwa/evidence/kai-029/REPORT.md`. Verify: **100/100**.

### KAI-028 (2026-09-18) — DONE

Assessment aggregate + idempotent cache by fingerprint/rubric; no overall score; no charge. Evidence: `docs/kaiwa/evidence/kai-028/REPORT.md`. Verify: **99/99**.

### KAI-027 (2026-09-18) — DONE (provisional local F0)

Relative F0/timing; unvoiced gaps blank; no pitch-accent labels; no ability score; teacherCompared false. Evidence: `docs/kaiwa/evidence/kai-027/REPORT.md`. Verify: **95/95**.

### KAI-026 (2026-09-18) — DONE (schema+stub; live deferred)

Evidence schema + pronunciation API stub; never maps ASR confidence → accuracy; rejects ja-JP ProsodyScore; no invented scores. Evidence: `docs/kaiwa/evidence/kai-026/REPORT.md`. Verify: **89/89**.

### KAI-025 (2026-09-18) — DONE (synthetic timeline)

Utterance/timeline alignment on video clock; edge padding; missing_speech vs data_gap; never allows phoneme claims; POST/GET `/attempts/:id/alignment`. Evidence: `docs/kaiwa/evidence/kai-025/REPORT.md`. Verify: **81/81**.

### KAI-024 (2026-09-18) — DONE (provisional)

PCM silence/clipping quality gate; WebM unavailable without decode; no pronunciation score invention; export independent. Evidence: `docs/kaiwa/evidence/kai-024/REPORT.md`. Verify: **76/76**.

### KAI-015 stub (2026-09-18) — DONE (live deferred)

Speech capability API `not_configured`; transcription/translation POST → 503; edit UI banner; manual path unchanged. Evidence: `docs/kaiwa/evidence/kai-015/REPORT.md`. Verify: **72/72**.

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
| 2026-09-18 | KAI-074 speech vs practice padding | 131/131 tests; build OK | `docs/kaiwa/evidence/kai-074/REPORT.md` |
| 2026-09-18 | KAI-071 windowed long-video script-align | 128/128 tests; build OK | `docs/kaiwa/evidence/kai-071/REPORT.md` |
| 2026-09-18 | KAI-072 editor/studio unmatched honesty | 123/123 tests; build OK | `docs/kaiwa/evidence/kai-072/REPORT.md` |
| 2026-09-18 | KAI-070 stable-ts default script-align | 122/122 tests; speech-env ready | `docs/kaiwa/evidence/kai-070/REPORT.md` |
| 2026-09-18 | KAI-069 WhisperX + ADR-021a bake-off | prefer stable-ts default; Qwen optional | `docs/kaiwa/evidence/kai-069/` |
| 2026-09-18 | KAI-068 stable-ts spike | median Δstart 28–53 ms on clean TTS | `docs/kaiwa/evidence/kai-068/` |
| 2026-09-18 | KAI-067 Qwen ForcedAligner CPU spike | median Δstart 21–68 ms on clean TTS | `docs/kaiwa/evidence/kai-067/` |
| 2026-09-18 | KAI-066 forced-align bench + greedy baseline | clean_tts median Δstart 212.5 ms; long_gap 122 ms | `docs/kaiwa/evidence/kai-066/` |
| 2026-09-18 | Gate A ACCEPTED (KAI-046 user sign-off) + ADR-021 | CHECKLIST §5; TASKS §9c | `docs/kaiwa/evidence/kai-033/CHECKLIST.md` |
| 2026-09-18 | KAI-065 Phase 1 align honesty | regression py OK; **121/121** tests | `docs/kaiwa/evidence/kai-065/REPORT.md` |
| 2026-09-18 | KAI-064 speech-env check script | `kaiwa:speech-env` exit 0 (ready) | `scripts/kaiwa-speech-env-check.mts` |
| 2026-09-18 | KAI-063 script-align end-stretch | median Δend **568 ms** (was 952); TTS only | `docs/kaiwa/evidence/kai-052/REPORT.md` §3c |
| 2026-09-18 | KAI-061 spike re-measure Whisper `base` | median Δstart 28 ms (TTS) | `docs/kaiwa/evidence/kai-052/REPORT.md` §3b |
| 2026-09-18 | KAI-059–062 sync UX + overlay help + Whisper base | `npm test` **120/120** | `ScriptHelpLayers.tsx` |
| 2026-09-18 | KAI-046 runbook + preflight re-verify | `kaiwa:gate-a-preflight` OK | `docs/kaiwa/evidence/kai-046/` |
| 2026-09-18 | KAI-056–058 ASR v2 API+UI+docs | `npm test`; build OK | `docs/kaiwa/evidence/kai-056/` |
| 2026-09-18 | KAI-055 script-align honesty USAGE | docs + capability tests | `docs/kaiwa/evidence/kai-055/` |
| 2026-09-18 | KAI-054 script-align UI | `npm test` **117/117**; build OK | `src/features/kaiwa/Kaiwa.tsx` |
| 2026-09-18 | KAI-053 align_script job + draft | `npm test` **117/117**; build OK | `server/modules/kaiwa/scriptAlign.ts` |
| 2026-09-18 | KAI-052 align spike DONE (Whisper+match) | median Δ 448/404 ms; TTS fixture | `docs/kaiwa/evidence/kai-052/` |
| 2026-09-18 | KAI-052 align spike BLOCKED (env) | Probe + provisional engine A | `docs/kaiwa/evidence/kai-052/REPORT.md` |
| 2026-09-18 | KAI-051 untimed script ingest | `npm test` **114/114**; build OK | `shared/kaiwa/subtitles.ts` |
| 2026-09-18 | KAI-050 ADR-020 auto-subtitle plan | Docs only | `docs/kaiwa/evidence/kai-050/` |
| 2026-09-18 | Gate A preflight + §0 fill + device runbook | **110/110**; preflight OK | `evidence/kai-033/`, `kai-046/` |
| 2026-09-18 | KAI-045/047 Gate A docs dual-mode | checklist content OK; suite at KAI-044 **110/110** | `evidence/kai-045/`, `kai-047/` |
| 2026-09-18 | KAI-044 review segment status | **110/110** npm test; build OK | `docs/kaiwa/evidence/kai-044/REPORT.md` |
| 2026-09-18 | KAI-043 subset + resume | **109/109** npm test; build OK | `docs/kaiwa/evidence/kai-043/REPORT.md` |
| 2026-09-18 | KAI-042 re-record + history | **109/109** npm test; build OK | `docs/kaiwa/evidence/kai-042/REPORT.md` |
| 2026-09-18 | KAI-041 continuous live overlay | **108/108** npm test; build OK | `docs/kaiwa/evidence/kai-041/REPORT.md` |
| 2026-09-18 | KAI-040 capture-mode preference | **106/106** npm test; build OK | `docs/kaiwa/evidence/kai-040/REPORT.md` |
| 2026-09-18 | KAI-039 assemble segment timeline | **106/106** npm test; build OK | `docs/kaiwa/evidence/kai-039/REPORT.md` |
| 2026-09-18 | KAI-038 segment studio UI | **103/103** npm test; build OK | `docs/kaiwa/evidence/kai-038/REPORT.md` |
| 2026-09-18 | KAI-037 segment clips API | **102/102** npm test; build OK | `docs/kaiwa/evidence/kai-037/REPORT.md` |
| 2026-09-18 | KAI-036 segment studio UX spec | Docs DONE | `docs/kaiwa/evidence/kai-036/` |
| 2026-09-18 | KAI-029 feedback UI | **100/100** npm test; build OK | `docs/kaiwa/evidence/kai-029/REPORT.md` |
| 2026-09-18 | KAI-028 assessment aggregate | **99/99** npm test; build OK | `docs/kaiwa/evidence/kai-028/REPORT.md` |
| 2026-09-18 | KAI-027 provisional relative F0/timing | **95/95** npm test; build OK | `docs/kaiwa/evidence/kai-027/REPORT.md` |
| 2026-09-18 | KAI-026 pronunciation schema+stub | **89/89** npm test; build OK | `docs/kaiwa/evidence/kai-026/REPORT.md` |
| 2026-09-18 | KAI-025 utterance/timeline alignment | **81/81** npm test; build OK | `docs/kaiwa/evidence/kai-025/REPORT.md` |
| 2026-09-18 | KAI-024 audio quality gate | **76/76** npm test; build OK | `docs/kaiwa/evidence/kai-024/REPORT.md` |
| 2026-09-18 | KAI-015 speech not_configured stub | **72/72** npm test; build OK | `docs/kaiwa/evidence/kai-015/REPORT.md` |
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
