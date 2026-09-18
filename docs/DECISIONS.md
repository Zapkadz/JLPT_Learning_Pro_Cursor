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

---

## ADR-008 — Grammar course progress denominator and XP entity

Date: 2026-09-15
Status: Accepted

### Context

Only Lesson 1 (5 groups) is published while the canonical course is 141 groups. XP must not double on re-check/reveal/SRS same day.

### Decision

- Course `read` / `practiced` denominators use **`progressDenominator = targetGroups` (141)**, never `publishedGroups`.
- Counts only include pattern IDs present in currently loaded (published) content; orphan DB rows do not inflate metrics; data rows are not deleted.
- XP/heatmap entity key is `grammar:{patternId}` (shared with grammar SRS card reviews). One unique per pattern per day.
- Grammar check inserts `grammar_events` only when the response was not previously `exposed` (reveal or prior check). Export includes `grammar.events`.

### Reason

Master Requirement §§39–40, 42; ADR-003 consequences; Lesson 1 pilot G09.

### Consequences

UI may show e.g. `1 / 141` while only 5 groups are learnable; published exercise totals stay separate.

### Do Not

Do not switch the denominator to published-only without a product decision. Do not reset `grammar_progress` / completed sessions on content revision bumps.

### Related Files

`server/modules/grammar/router.ts`, `server/app.ts` (`/api/stats`, `/api/export`), `src/features/grammar/Grammar.tsx`

---

## ADR-009 — JA→VI practice furigana (optional structured ruby)

Date: 2026-09-16
Status: Accepted (N2-L01-FURI-001; product choice **B**, all 26 lessons)

### Context

Learning examples already use structured `ruby[]` + a furigana toggle. JA→VI practice prompts were plain Japanese only. Master Requirement §21 forbids embedding readings in raw JA (`日本(にほん)`). PLAN task N2-L01-FURI-001 needed a product decision.

### Decision

- **Policy B:** JA→VI practice may show furigana **optionally** via the same user toggle (`kotoba-grammar-reading`).
- Store readings as optional `promptRuby` on `ja-vi` exercises (parallel to example `ruby`); `prompt` stays clean raw Japanese; `promptRuby[].text` must concatenate to `prompt`.
- Apply across **all 26 published lessons** (not Lesson 1 only).
- Public DTO may include `promptRuby` (not private). Answers / origin still stripped.
- VI→JA and order modes do not gain prompt furigana in this task.

### Reason

Matches grammar-n2 PLAN (“Câu Nhật có furigana tùy chọn” for JA→VI) and Master §21 structured-data rule without forcing readings on every learner.

### Consequences

Content generators must emit `promptRuby` for new JA→VI items. Legacy sessions without `promptRuby` still render plain `prompt`.

### Do Not

Do not write furigana into `prompt` strings. Do not claim teacher-verified readings.

### Related Files

`shared/grammar/types.ts`, `server/modules/grammar/content.ts`, `src/features/grammar/Grammar.tsx`, `scripts/gen-n2-ja-vi-prompt-ruby.mjs`, `docs/PLAN.md` (N2-L01-FURI-001)

---

## ADR-010 — Kaiwa is a Kotoba module extension, not a separate app

Date: 2026-09-17
Status: Accepted (product / architecture intent; **application code not yet implemented**)

### Context

Kaiwa Studio needs video dubbing / speaking practice. The repo already has React + Express + SQLite, auth, stats, backup, and UX contracts.

### Decision

Build Kaiwa as an extension of Kotoba: planned layout `src/features/kaiwa/`, `shared/kaiwa/`, `server/modules/kaiwa/`, `server/workers/kaiwa/`, `server/modules/kaiwa/providers/`. Reuse auth, navigation patterns, DESIGN.md / UX-CONTRACT, and ownership checks. Do not spawn a second product/backend.

### Reason

Matches ADR-001/002 reuse pattern; reduces duplicate identity, progress, and ops surfaces.

### Consequences

Kaiwa must respect existing cookie sessions, origin checks, and per-owner data boundaries. Large media stays outside SQLite (see ADR-012).

### Do Not

Do not create a separate Kaiwa deployable or parallel auth stack. Do not treat planning docs as shipped code.

### Related Files

`docs/kaiwa/PLAN.md`, `docs/PRODUCT.md`, `docs/PROJECT-CONTEXT.md`

---

## ADR-011 — Full-video continuous dubbing before character role-play

Date: 2026-09-17
Status: Accepted — **amended by ADR-019 (2026-09-18)**

### Context

Both continuous full-video dubbing and single-character role-play were considered for speaking practice.

### Decision

Ship **full-video dubbing** first (Gate A usable product; Gate B validated Japanese feedback). **Character role-play** is Gate C / KAI-035 and must not start before Gate B.

**Original (2026-09-17):** While recording, video does not auto-stop per sentence; segments are for post-record analysis only.

**Amendment (ADR-019):** Gate A must also ship an honest **per-segment practice mode** (script overlay + record per line) as the **default learning path**. Continuous mode remains available as advanced/challenge. Do **not** claim a stitched segment take is the same as a continuous take — label `capture_mode` honestly.

### Reason

User-locked product priority for role-play deferral stands. 2026-09-18 device feedback: continuous studio without on-screen script-at-cue makes speaking impractical.

### Consequences

KAI-001–034 remain on the dubbing path (not role-play). KAI-036+ implement segment studio before Gate A ACCEPTED.

### Do Not

Do not require character selection in the Gate A/B flow. Do not market assembled segment audio as “một lần thu liên tục” without `capture_mode` honesty.

### Related Files

`docs/kaiwa/PLAN.md`, `docs/kaiwa/TASKS.md`, `docs/PLAN.md`, ADR-019

---

## ADR-012 — Source media and raw microphone stay separate; exports are versioned outputs

Date: 2026-09-17
Status: Accepted (intent; schema/storage land in later KAI tasks)

### Context

Dubbing needs reliable re-mix, re-export, and assessment without destroying originals.

### Decision

Persist **source video** and **raw microphone** audio as separate private assets. Derived mixes / MP4 exports are versioned outputs. SQLite stores metadata and pointers only — not large media as base64/blobs.

### Reason

Enables independent export vs assessment pipelines and safe reprocessing.

### Consequences

Private per-owner storage + Range-authenticated reads are required before claiming Gate A.

### Do Not

Do not overwrite raw mic when exporting. Do not store large media in SQLite.

### Related Files

`docs/kaiwa/PLAN.md` (§5–6)

---

## ADR-013 — Transcript revisions are immutable for existing attempts

Date: 2026-09-17
Status: Accepted (intent; implementation in KAI-005+)

### Context

Learners may edit subtitles after practicing. Old takes must remain graded/reviewed against the text they used.

### Decision

Transcript content is **immutable/versioned**. Each take/attempt references the transcript revision in force at capture time. Edits create a new revision; they do not mutate history used by past takes.

### Reason

Prevents silent score/review drift and supports reproducible feedback.

### Consequences

UI must publish/select revisions explicitly before a new take when text changes.

### Do Not

Do not rewrite historical attempt transcript snapshots in place.

### Related Files

`docs/kaiwa/PLAN.md`, `docs/kaiwa/TASKS.md` (KAI-005, KAI-016)

---

## ADR-014 — Assessment must not block playback or export

Date: 2026-09-17
Status: Accepted

### Context

Scoring providers may be unavailable, slow, or wrong. Learners still need to hear takes and export MP4.

### Decision

**Export** and **assessment** are independent jobs/pipelines. Scoring failure or UNAVAILABLE results must not block playback or export. Japanese scores must not be faked (no ASR-confidence-as-pronunciation, no waveform-similarity-as-intonation, no absolute pitch/timbre as ability). Insufficient evidence → UNAVAILABLE / NOT ASSESSABLE + reason — never invent 0. Azure prosody is **not** assumed to be a Japanese intonation solution; provider capability requires spike/verify (KAI-003). Manual subtitle + record + playback + export must work without external APIs.

### Reason

Gate A usability and learner trust; Gate B requires honest evidence.

### Consequences

UI must separate “export ready” from “score ready”. KAI-003 must verify providers before locking scoring ADRs.

### Do Not

Do not hard-commit Azure (or any vendor) as the Japanese intonation solution in ADR before KAI-003 evidence. Do not block export on scoring errors.

### Related Files

`docs/kaiwa/PLAN.md`, `docs/kaiwa/TASKS.md` (KAI-003, KAI-022–029)

---

## ADR-015 — Kaiwa pilot limits, privacy/retention, and integration boundaries

Date: 2026-09-17
Status: Accepted (KAI-001 audit; config defaults — not load-tested capacity)

### Context

KAI-001 surveyed auth, nav, stats, backup, middleware, migrations, and media gaps. Pilot limits and privacy rules needed locking before spikes and schema work so implementers do not hard-code conflicting magic numbers or leak media via `dist/`.

### Decision

1. **Pilot config defaults** (env/config, not scattered literals): max source **10 minutes**, max upload **250 MB**, containers MP4/WebM (probe-enforced later), storage quota **2 GB/user**, incomplete upload TTL **24h**, soft-deleted project GC after **30 days**, **1** concurrent heavy media job per user (worker global concurrency separate). Desktop Chrome/Edge are the only Gate A **recording** claim until KAI-004 matrix says otherwise.
2. **Integration**: mount Kaiwa under existing cookie auth like Grammar; keep global JSON body limit **2 MB**; binary upload on separate routes; SQLite metadata only; media under private root outside web/static paths; authenticated Range streaming only.
3. **Privacy**: media private per owner; no provider auto-send; disclose before external audio leave; no audio/transcript/credentials in normal logs.
4. **Progress**: do not fold Kaiwa into existing XP/heatmap entity keys until KAI-030 ADR; use dedicated activity events with idempotent keys.
5. **Backup gap acknowledged**: `npm run backup` is SQLite-only today; Gate A requires DB+media restore (tracked for ops tasks).
6. **Error contract**: stable machine `code` + Vietnamese `error` message for quota/unsupported/conflict/unavailable; assessment UNAVAILABLE must not block export (ADR-014).

### Reason

Gives KAI-002+ a fixed envelope and prevents accidental public media or XP pollution while spikes proceed.

### Consequences

KAI-005/006/008 must read these defaults from config. Changing limits requires updating this ADR + PLAN §3.4. Capture/provider choices remain open (OD-001/OD-002) until KAI-002/003.

### Do Not

Do not raise global `express.json` limit for video. Do not serve Kaiwa files from `dist/`. Do not lock Azure or any scoring vendor here. Do not treat these defaults as proven capacity without KAI-002/011 evidence.

### Related Files

`docs/kaiwa/evidence/KAI-001-integration-audit.md`, `docs/kaiwa/PLAN.md`, `server/app.ts`, `server/backup.ts`

---

## ADR-016 — Kaiwa continuous capture stack (MediaRecorder + video clock)

Date: 2026-09-17
Status: Accepted (KAI-002 spike; Chromium lab evidence; 10‑minute metrics to be attached in evidence folder)

### Context

Gate A needs continuous full-video dubbing without per-sentence auto-stop. PLAN §8 forbids using MediaRecorder chunk counts as the timeline. KAI-002 required a harness and head/mid/tail drift evidence.

### Decision

1. **Capture:** Use browser **`MediaRecorder`** on the **raw microphone** track (not the mixed lesson audio). Prefer MIME **`audio/webm;codecs=opus`** when `isTypeSupported`.
2. **Clock:** Source of truth is lesson/proxy **`video.currentTime`**, mapped with **`performance.now()`** (monotonic) from a recorded `t0Perf`/`t0Video`. Persist offsets, sample-rate/codec metadata, and interruption events. **Never** derive media time from chunk index or `timeslice`.
3. **Journaling:** `timeslice` chunks may be used for upload/resume buffering only; a chunk is not proof of a playable standalone media file (KAI-019/020 must remux/validate).
4. **AudioWorklet PCM journal:** Not adopted for pilot unless MediaRecorder crash-recovery proves insufficient.
5. **Pilot claim:** Desktop Chromium/Edge first (ADR-015). Other browsers need KAI-004 matrix before promising recording support.

### Reason

Lab harness on Chromium showed Opus/WebM available and head/mid/tail drift within ≈100 ms on a 20 s synthetic run using the video/perf mapping. Matches PLAN continuous-dubbing UX and keeps raw mic separate for assessment (ADR-012).

### Consequences

Studio implementation (KAI-017–020) must follow this clock contract. Drift regressions need harness re-run. 10‑minute and real-mic matrices remain operational follow-ups recorded in `docs/kaiwa/evidence/kai-002/`.

### Do Not

Do not stitch per-sentence recordings to fake continuity. Do not treat ASR timestamps as the capture clock. Do not commit user recordings to git.

### Related Files

`docs/kaiwa/evidence/kai-002/`, `scripts/kaiwa/run-capture-spike.mjs`, `docs/kaiwa/PLAN.md` §8

---

## ADR-017 — Japanese assessment capability contract (no fake scores; no Azure prosody for ja-JP)

Date: 2026-09-17
Status: Accepted (KAI-003; live provider samples still **UNAVAILABLE** without credentials)

### Context

Gate B needs trustworthy Japanese feedback. Product rules already forbid fake metrics. Public Azure docs state pronunciation assessment includes `ja-JP`, but **prosody assessment is en-US only**. No speech API credentials were available in the KAI-003 environment for live field verification.

### Decision

1. Assessment results must use explicit statuses: `ready` | `unavailable` | `not_assessable` | `failed`, with machine-readable `reason` when not ready. Never substitute `0`/`100`/random values.
2. **Forbidden mappings:** ASR confidence → pronunciation; waveform similarity → intonation; absolute pitch/timbre/gender → ability; Azure **ProsodyScore** → Japanese intonation.
3. Azure (or any vendor) may be integrated **only after** a live ja-JP payload is verified and fields are allow-listed in the adapter capability map. Vendor choice remains open until that verify.
4. Gate A must work with assessment `not_configured` / `unavailable`.
5. Relative F0 / timing may be explored in-house as **non-pitch-accent** hints; word-level pitch-accent errors require lexicon + teacher-validated labels.

### Reason

Prevents shipping misleading speaking scores and matches PLAN §10 / ADR-014.

### Consequences

KAI-023–029 implement against this contract. Live sample evidence must be appended under `docs/kaiwa/evidence/kai-003/live/` when credentials exist.

### Do Not

Do not lock Azure as the sole provider in code or ADR. Do not enable `EnableProsodyAssessment` as a Japanese intonation feature. Do not block export on assessment failure.

### Related Files

`docs/kaiwa/evidence/kai-003/REPORT.md`, `docs/kaiwa/PLAN.md` §10, ADR-014

---

## ADR-018 — Kaiwa progress is separate from deck/grammar XP (Gate A = history only)

Date: 2026-09-18
Status: Accepted (KAI-030a)

### Context

Gate A needs take history and honest activity logging. Existing `/api/stats` XP/heatmap uses `card:` / `question:` / `grammar:` keys. Folding Kaiwa into those keys would silently change the meaning of “cards/grammar studied” and could award XP for upload/wait/finalize without validated speaking quality.

### Decision

1. **Gate A (KAI-030a):** Persist `kaiwa_activity_events` on successful finalize with idempotent key `finalize:{attemptId}` and day key `Asia/Ho_Chi_Minh`. Expose `GET /api/kaiwa/history` + UI. Project-level attempt lists remain.
2. **Do not** add Kaiwa events into `/api/stats` XP, heatmap, or streak until a later ADR explicitly enables optional contribution.
3. **KAI-030b (deferred):** Active speaking-time XP / streak contribution only after assessment quality gates (KAI-024+) justify the metric; retries must not double-count (already enforced by UNIQUE).
4. Upload, view, prepare, and wait **never** create activity events that imply practice XP.

### Reason

Keeps deck/grammar numbers stable; gives learners a Kaiwa history surface for Gate A without fake speaking scores.

### Consequences

Progress page / streak UI stay unchanged for Kaiwa until 030b. History page must show an explicit note that Kaiwa is not counted in card/grammar XP.

### Do Not

Do not inject Kaiwa into existing XP entity keys. Do not invent speaking XP from duration alone for marketing streak claims before 030b.

### Related Files

`server/modules/kaiwa/activity.ts`, `docs/kaiwa/TASKS.md` (KAI-030), ADR-008, ADR-015

---

## ADR-019 — Segment practice is default; continuous is advanced (speakable studio)

Date: 2026-09-18
Status: Accepted (product direction from user device feedback; implementation = KAI-036+)

### Context

Gate A continuous studio (KAI-017–022) works technically, but on-device feedback (2026-09-18) showed learners cannot comfortably speak: script lives in a list **below** the player, not as an on-video cue for the current utterance. User requested a Dub-Stage-style flow: after upload + timed subtitles, **N segments → N short recordings**, with script overlay, replay original / record / replay take / next line.

ADR-011 previously forbade stitching per-sentence recordings to fake a continuous take. That honesty rule remains; the product gap is **learnability**, not role-play (still Gate C).

### Decision

1. **Two capture modes** on the same project/revision/attempt model:
   - `segment` (default): practice one subtitle window at a time; show JA (+ optional furigana/VI/romaji) overlaid on video for the active clip; controls: nghe mẫu đoạn · thu lại · nghe mình · tiếp / trước · bỏ qua.
   - `continuous` (advanced): full-video take kept; **must** show live current+next script overlay synced to video clock (not list-only).
2. **Gate A ACCEPTED** requires device PASS on **segment mode** (speakable path). Continuous-only checklist is insufficient.
3. **Export / review:** Segment mode may assemble learner audio onto the video timeline (silence or keep original in gaps). Persist `capture_mode` / `assembly` metadata. Never label assembled audio as continuous capture.
4. **Re-record one segment** without wiping other clips is in scope for segment mode (partially lifts PLAN §3.3 “thu đè một vùng” for this mode only).
5. **Large scripts (e.g. 90+ lines):** support skip, subset practice, and clear N/M progress — do not force recording all lines in one sitting.
6. Character role-play remains **KAI-035 / Gate C** after Gate B.

### Reason

Speaking practice fails if the learner cannot see what to say at the cue. Line-by-line matches user mental model and still feeds segment-level assessment (KAI-025–029).

### Consequences

New backlog KAI-036–047. Pause treating KAI-033 continuous device sign-off as the sole Gate A unlock. Update PLAN §1–4, UX-SPEC, USAGE, CHECKLIST. Continuous stack (KAI-018–022) stays; it is not deleted.

### Do Not

Do not start Gate C role-play early. Do not invent pronunciation scores. Do not claim stitched takes are continuous. Do not remove continuous mode without a later ADR.

### Related Files

`docs/kaiwa/PLAN.md`, `docs/kaiwa/TASKS.md`, `docs/kaiwa/evidence/kai-004/UX-SPEC.md`, ADR-011

---

## ADR-020 ? Auto subtitle timing: script-sync (v1) then ASR (v2)

Date: 2026-09-18
Status: Accepted (product direction from user; **implementation = KAI-050+**, not started)

### Context

Manual timed subtitles (SRT/VTT / editor, KAI-013) work for Gate A speakable studio, but learners still spend heavy effort setting start/end per line. User request (2026-09-18):

1. **v1.0 ? Script sync:** Upload video + provide **untimed** dialogue text (not necessarily SRT/VTT) ? system assigns times by matching text to speech in the video.
2. **v2.0 ? Auto transcript:** Upload video only ? system produces timed subtitles (ASR) without a user script.

Existing KAI-015 is a **not_configured stub**; live ASR/align adapters were deferred pending credentials. ADR-012 (immutable revisions) and ADR-014 (no fake scores; manual path without providers) still apply.

### Decision

1. Ship as a **new product milestone** after Gate A speakable path is usable; **do not block** Gate A ACCEPTED / KAI-046 device sign-off.
2. **v1 before v2.** v1 keeps human-authored words (higher trust for dubbing) and only automates **timing**. v2 adds full ASR text+timing.
3. **Both paths write draft revisions only.** User must review/edit in the existing transcript editor before publish / start-practice. Never silently overwrite a newer manual draft (KAI-015 rule).
4. **Technical shape for v1:** extract reference audio (ffmpeg) ? **forced alignment** or **ASR word timestamps + text alignment** against the supplied script ? emit `segments[]` with `startMs`/`endMs`. Preferred spike candidates documented in the auto-subtitle spec; vendor not locked until KAI-052 spike PASS.
5. **Technical shape for v2:** ASR with word/segment timestamps ? sentence segmentation ? same draft review UI. Extends live KAI-015 transcription adapter.
6. **Honesty:** UI labels `source=manual | script_align | asr`; confidence/uncertain flags on weak windows; never claim teacher verified. Timing errors ? user fix, not fake perfect sync.
7. **Privacy:** opt-in before audio leaves the machine; disclose provider; no audio/transcript in normal logs (ADR-015).
8. Manual SRT/VTT/editor remains the **always-available** path when credentials or jobs fail.

### Reason

Dubbing needs reliable cue windows. Automating timing (v1) unlocks segment studio for scripts that already exist as plain text. Full ASR (v2) is harder (errors invent wrong words) and must stay reviewable.

### Consequences

Backlog **KAI-050?058**. Update `docs/kaiwa/PLAN.md`, TASKS, USAGE. Spike (KAI-052) may change provider choice; update this ADR only if product shape changes.

### Do Not

- Do not invent timed subtitles client-side without audio analysis.
- Do not skip draft review / auto-publish into practice snapshots.
- Do not treat ASR confidence as pronunciation score (ADR-014).
- Do not replace Gate B pronunciation work with this feature.
- Do not start Gate C role-play from this ADR.

### Related Files

`docs/kaiwa/evidence/kai-050/AUTO-SUBTITLE-SPEC.md`, `docs/kaiwa/PLAN.md`, `docs/kaiwa/TASKS.md`, ADR-012, ADR-014, ADR-015, KAI-013/015

---

## ADR-021 — Forced alignment v1 redesign (replace greedy Whisper-match)

Date: 2026-09-18  
Status: Accepted (product direction from user; implementation = **KAI-065+**)

### Context

Gate A speakable (ADR-019) is **ACCEPTED**. ADR-020 v1 shipped as Whisper ASR word timestamps + greedy string match (`align_script_sidecar.py`) plus end-stretch. Independent review reproduced algorithmic failures:

1. Kanji/kana mismatch can assign one line a window spanning many utterances; later lines lose timestamps.
2. End-stretch to next start without silence checks can expand a 0.5–1 s utterance to ~30 s while `timingUncertain=false`.
3. Backend maps `null` start/end to `0` + placeholder duration — unmatched lines look timed and pile at t=0.
4. Re-align rebuilds segments from `ja` only → drops stable IDs, VI, furigana/romaji.
5. Old TTS spike GT used whole-file duration and duplicated align logic ≠ production sidecar.

Padding / larger Whisper models alone cannot fix error propagation. User prioritizes **rebuild v1 forced alignment** before further v2 ASR work.

### Decision

1. **v1 remains “keep user script text; assign timing only.”** v2 ASR stays deferred for this milestone.
2. **Product flow reference:** Subtitle Edit (plain-text → forced align → review unmatched) + Point Sync (lock anchors, realign between). Editor later: waveform scrub, lock line, realign selection / between locks.
3. **Engine bake-off (same JA fixtures + same script), order:**
   - Primary quality candidate: **Qwen3-ForcedAligner-0.6B** (official JA; direct audio+text).
   - Practical baseline: **stable-ts** `align` / `align_words`.
   - Contrast: **WhisperX Japanese CTC** (document vocabulary/overlap limits).
   - Reserve: Montreal Forced Aligner Japanese if dictionary control needed.
4. **Benchmark CPU-first** on the user’s machine (i5 / ~16 GB); no assume CUDA. GPU worker is a later deploy decision after numbers.
5. **Separate speech timing from practice padding:** store/propose `speechStart`/`speechEnd` (or equivalent); practice lead-in/out and overlay early-show are UI/config — never stretch transcript end to the next line’s speech.
6. **Per-line status:** `proposed` | `needs_review` | `unmatched`. Unmatched keeps text, **does not** invent 0–Ns placeholders presented as success. No uncalibrated “95% confidence” UI.
7. **Long video:** windowed alignment with overlap + stop applying failed windows; optional user anchors. Do not equal-split by character count.
8. **Preserve line identity:** on timing-only sync, keep segment `id`, `vi`, tokens/readings; only update timing fields (+ status). Candidate proposal may be stored before apply; revision/hash conflict rules remain (ADR-012).
9. **Ship order (TASKS):** (1) stop harmful behaviors in current path, (2) honest benchmark harness, (3) engine bake-off, (4) integrate winner, (5) anti-cascade + local fix UX, (6) held-out / user anime evidence. **Do not mark DONE from marketing claims.**

### Reason

User scripts are near-verbatim and ordered — ideal for forced alignment. Current greedy ASR-match cascades errors and invents timelines, making segment practice unusable on real anime/dialogue.

### Consequences

New backlog **KAI-065–076** (see `docs/kaiwa/TASKS.md` §9c). Spec: `docs/kaiwa/evidence/kai-065/FORCE-ALIGN-V1-SPEC.md`. Amends ADR-020 technical shape for v1 without changing “draft-only / manual fallback / privacy” rules.

### Do Not

- Do not block Gate A ACCEPTED on this redesign (already accepted).
- Do not resume v2 ASR priority until Phase 1–3 v1 evidence exists (unless user overrides).
- Do not commit private anime/user audio to git.
- Do not treat monotonic timestamps or Whisper end-stretch as proof of correct alignment.
- Do not LLM-rewrite user dialogue to “help match.”

### Related Files

`docs/kaiwa/evidence/kai-065/FORCE-ALIGN-V1-SPEC.md`, `docs/kaiwa/TASKS.md`, ADR-020, `scripts/kaiwa/align_script_sidecar.py`, `server/modules/kaiwa/scriptAlign.ts`

---

## ADR-021a — Provisional forced-align engine preference (bake-off note)

Date: 2026-09-18  
Status: Accepted (provisional; amend after broader corpus)

### Context

KAI-066–069 measured greedy Whisper-match vs Qwen3-ForcedAligner vs stable-ts vs WhisperX JA CTC on the same legal TTS fixtures + speech-window GT.

### Decision

1. Production v1 should move off greedy Whisper-match for timing quality.
2. **Default integration candidate for KAI-070 (CPU pilot): stable-ts `align`.**
3. **Optional quality backend: Qwen3-ForcedAligner-0.6B** (flag/env); expect slow cold start on CPU.
4. WhisperX remains contrast / non-default unless later evidence wins on held-out anime.
5. No anime quality claim until KAI-076 / private fixtures.

### Related

`docs/kaiwa/evidence/kai-069/REPORT.md`, ADR-021

---

## ADR-022 — Gate B pilot feedback thresholds locked (KAI-023)

Date: 2026-09-18
Status: Accepted

### Context

PLAN §10.3 proposed pilot rates for confirmed-correct flags and false flags. Shipping Gate B without freezing numbers before held-out evaluation invites silent threshold shopping.

### Decision

1. Lock pilot thresholds in `shared/kaiwa/gateBBenchmark.ts` and `docs/kaiwa/evidence/kai-023/THRESHOLDS.json`: ≥90% confirmed-correct flags; ≤5% false flags on acceptable; ≥85% clean coverage; ≤USD 25 pilot provider spend.
2. Speakers are disjoint across train / calibration / held_out.
3. Dual-rater + adjudication protocol is required before counting rates toward Gate B.
4. Changing thresholds after held-out scoring requires a new ADR and a fresh evaluation round.
5. Rubric id stays `kaiwa-ja-rubric-draft-001` until teacher adjudication bumps `RUBRIC_VERSION`.

### Consequences

KAI-034 must report against these numbers (or an ADR amendment). Live provider work (KAI-026) remains blocked on credentials but must not invent scores.

### Do Not

- Do not claim Gate B released.
- Do not commit private benchmark audio.
- Do not lower thresholds silently to pass marketing claims.

### Related Files

`docs/kaiwa/evidence/kai-023/`, `shared/kaiwa/gateBBenchmark.ts`, ADR-017


