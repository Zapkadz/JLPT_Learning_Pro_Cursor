# KAI-001 — Integration / architecture audit

Date: 2026-09-17
Branch: `feat/kaiwa-memory`
Status: DONE (documentation / audit only — **no application behaviour change**)
Related ADRs: ADR-010–014 (scope/media/transcript/assessment); **ADR-015** (pilot limits, privacy/retention, error/progress integration).

## 1. Executive summary

Kotoba today is a single Express + SQLite + React SPA with cookie sessions. Grammar N2 is the existing module-extension pattern (`server/modules/grammar` + additive `migration.sql` + mount under `/api` after auth). **Kaiwa code does not exist yet** (`src/features/kaiwa`, `shared/kaiwa`, `server/modules/kaiwa`, `server/workers/kaiwa` absent).

Kaiwa must reuse auth, ownership, Helmet/origin checks, DESIGN/UX patterns, and additive migrations. It **cannot** reuse the 2 MB `express.json` body path for video; it needs a separate binary upload surface, private media storage outside SQLite, and a durable worker/job layer that does not exist today. Online SQLite backup (`npm run backup`) does **not** cover media files — Gate A requires an extended backup/restore story (KAI-031 area).

## 2. Integration points

| Area | Current fact (evidence) | Kaiwa implication |
|------|-------------------------|-------------------|
| Auth | Cookie `kotoba_session` HttpOnly/SameSite=strict; hashed token in `sessions`; middleware after public auth routes sets `res.locals.user` or 401 (`server/app.ts` ~228–247) | Mount `/api/kaiwa` **after** the same auth middleware (mirror Grammar at line 248). No second auth stack. |
| Ownership | Decks/cards/attempts: `… WHERE id=? AND user_id=?` → 404 if missing (`ownDeck`, `ownCard`, `ownAttempt`). Grammar sessions: `user_id=?` on every read/write (`server/modules/grammar/router.ts`) | Every Kaiwa project/asset/attempt/job/export must check `owner_id === res.locals.user.id`. Never rely on “hidden” nav alone. |
| Navigation | `src/App.tsx` `nav` array + `src/main.tsx` `createBrowserRouter` children | Add `/kaiwa` (+ nested routes from PLAN §4.2) to router and one sidebar entry; keep title mapping via `startsWith`. |
| Stats / XP | `GET /api/stats` merges reviews, practice attempts, `grammar_events` with keys `card:`, `question:`, `grammar:` (`server/app.ts` ~688–759). Day key `Asia/Ho_Chi_Minh` via `shared/domain` | Do **not** silently inject Kaiwa into existing XP until KAI-030 ADR. Prefer separate `kaiwa_activity_events` + optional streak contribution later. Upload/view/wait must not grant XP (PLAN §11.1). |
| Personal export | `GET /api/export` JSON (`kotoba-backup.json`) includes decks/cards/reviews/attempts + grammar tables (~769–809) | Later: either extend export with Kaiwa **metadata** only, or document that media is out-of-band. Do not base64 video into JSON. |
| Online backup | `server/backup.ts`: `better-sqlite3` `.backup()` of `DB_PATH` only; refuses overwrite | Gate A needs DB **plus** private media tree + manifest. KAI-031. |
| Middleware | Helmet; `express.json({ limit: "2mb" })`; `/api` rate limit 600/min; mutation Origin + Sec-Fetch-Site checks; 413 message “Tối đa 2 MB” (~100–127, ~826–827) | Keep JSON limit. Add dedicated binary routes (chunk PUT) with own size/rate policy. Ensure 413 messaging distinguishes JSON vs media quota. |
| File upload | **None** today (no multer/multipart routes found) | Greenfield upload pipeline (KAI-008). |
| Static / media leak | Production serves `dist/` SPA only (`express.static` + SPA fallback ~814–816). No public uploads directory | Store Kaiwa media **outside** `dist/` and web root; serve only via authenticated `GET /api/kaiwa/assets/:id/content` with Range. |
| DB bootstrap | `createApp` always `db.exec(schema.sql)` (`IF NOT EXISTS`). Grammar runs additive `migration.sql` + `schema_migrations` key `grammar-001` on module load | Kaiwa: `server/modules/kaiwa/migration.sql` + version keys `kaiwa-00x`; never rewrite core tables destructively. |
| Jobs / workers | Sync Express only; no queue. `server/index.ts` single process listen | Introduce DB-backed jobs + separate worker process (KAI-007). Do not run FFmpeg/ASR inside request handlers. |
| Config / env | `DB_PATH`, `PORT`, `HOST`, `APP_ORIGIN`, `NODE_ENV` | Add Kaiwa config (see ADR-015): media root, max duration/bytes, quotas, draft TTL, concurrent jobs — env/config file, not scattered magic numbers. |
| Account deletion | No delete-account API; deck delete cascades via FK | Kaiwa project delete = soft tombstone + job cancel + deferred media GC (PLAN §6). Document retention until account-deletion product exists. |
| Error shape | `{ error: string }` + Zod 400; GrammarError/HttpError | Shared Kaiwa error codes (quota, unsupported codec, upload conflict, UNAVAILABLE assessment) in `shared/kaiwa` — map to stable `error` + optional `code` without breaking existing clients. |
| Tests | `npm test` = `tests/*.test.ts` + `tests/grammar/*.test.ts` only (`package.json`) | When adding `tests/kaiwa/`, update the test script or call explicitly (IMPLEMENTATION-RULES §5). |

## 3. Pilot limits (locked as **config defaults** — ADR-015)

| Limit | Default (pilot) | Notes |
|-------|-----------------|-------|
| Max source duration | 10 minutes | PLAN §3.4; re-validate KAI-002/KAI-011 |
| Max upload bytes | 250 MB | Per source file; server-enforced |
| Allowed containers (claim) | MP4, WebM | Real codec/probe in KAI-009 — reject by content not extension |
| Concurrent jobs / user | 1 heavy media job (transcode/export) | Tunable; global worker concurrency separate |
| Storage quota / user | 2 GB private media | Includes source, proxy, raw mic, exports; reservation on upload start |
| Draft / incomplete upload TTL | 24 hours | Expired uploads GC’d; attempts with server-acked chunks follow attempt lifecycle |
| Capture browsers (Gate A claim) | Desktop Chrome / Edge only until matrix passes | Mobile: UI ok; recording support only after KAI-004 evidence |
| Record speed | 1× only while recording | Prep may allow slower listen |
| External API | Optional | Manual subtitle + record + playback + export must work offline of providers |

These are **configuration starting points**, not verified capacity. Changing them requires ADR/PLAN update, not silent code edits.

## 4. Migration / rollback sketch

**Forward (KAI-005+):**

1. Additive SQL under `server/modules/kaiwa/migration.sql` (tables from PLAN §6).
2. Register `schema_migrations` versions (`kaiwa-001`, …) like Grammar.
3. Mount `kaiwaModule(db)` beside Grammar after auth.
4. Media root: e.g. `data/kaiwa-media/` (gitignored) or `KAIWA_MEDIA_ROOT`; keys server-generated; never under `dist/`.

**Rollback:**

- Code rollback: disable mount / feature flag; leave tables in place (safe).
- Data rollback: do **not** DROP tables with user media references in production without backup.
- Media GC only after tombstone + no FK references + retention window.
- SQLite backup alone is insufficient — restore runbook must pair DB backup with media snapshot.

**Non-goals for early migrations:** no destructive rewrite of `users`/`decks`/`grammar_*`; no storing blobs in SQLite.

## 5. Likely files / routes to touch (by later tasks)

### Client

| Path | Why |
|------|-----|
| `src/main.tsx` | Register `/kaiwa/*` routes |
| `src/App.tsx` | Sidebar nav entry |
| `src/features/kaiwa/**` | Library, upload, editor, studio, attempt, history (new) |
| `src/lib/api.ts` | May need binary upload helpers (not JSON-only) |
| `src/styles.css` / feature CSS | Tokens from DESIGN.md |

### Server / shared

| Path | Why |
|------|-----|
| `server/app.ts` | Mount `/api/kaiwa`; do **not** raise global JSON 2 MB |
| `server/modules/kaiwa/**` | Routes, services, repos, migration (new) |
| `server/workers/kaiwa/**` | Probe/transcode/export/ASR/score/cleanup (new) |
| `shared/kaiwa/**` | Zod contracts (new) |
| `server/backup.ts` / ops docs | Extend for media (Gate A) |
| `package.json` | Worker script; include `tests/kaiwa` in test glob |
| `.gitignore` | Media roots, temp exports |

### Planned HTTP (all under `/api/kaiwa`, auth + owner)

See PLAN §7: projects, uploads/chunks, assets content, revisions, attempts/finalize, assessments, exports, jobs.

### Planned UI routes

`/kaiwa`, `/kaiwa/new`, `/kaiwa/projects/:id`, `/edit`, `/studio`, `/kaiwa/attempts/:id`, `/kaiwa/history`.

## 6. Privacy / retention / error contracts (KAI-001 decisions)

1. **Private by default** — no guessable public URLs; Range streaming only with session + ownership.
2. **Provider send is opt-in / explicit** — UI discloses vendor retention before ASR/scoring upload; never auto-send every new video.
3. **Raw source + raw mic immutable**; derived assets versioned (ADR-012).
4. **Transcript revisions immutable for attempts** (ADR-013).
5. **Assessment failures never block playback/export** (ADR-014); status `UNAVAILABLE` / `NOT_ASSESSABLE` + reason — never fake 0.
6. **Logs** — no raw audio, full transcripts, or credentials in normal logs.
7. **Retention (pilot defaults)** — soft-deleted projects retained 30 days then GC; orphan temp/upload objects per TTL; exports retained while attempt exists unless user deletes; exact GC worker in KAI-006/KAI-031.
8. **No account wipe API today** — document gap; do not invent silent cross-user deletes.

## 7. Open decisions (not blocked for KAI-002)

| ID | Decision | Owner role | Needed by |
|----|----------|------------|-----------|
| OD-001 | Capture stack (MediaRecorder vs AudioWorklet journal) after spike metrics | Media/Frontend | KAI-002 → ADR |
| OD-002 | Japanese pronunciation/prosody provider capability map | Speech/Japanese | KAI-003 → ADR (do **not** lock Azure now) |
| OD-003 | Exact desktop/mobile browser support matrix | UX/QA | KAI-004 |
| OD-004 | Object storage vs local FS beyond pilot | Backend/Ops | After Gate A local FS proven |
| OD-005 | Whether `/api/export` includes Kaiwa metadata | PM/Architect | Before Gate A export completeness |
| OD-006 | How Kaiwa speaking time contributes to streak/XP | PM + KAI-030 | Before progress ship |
| OD-007 | Feature flag / kill-switch for Kaiwa routes in production | Ops | Before first deploy |
| OD-008 | Account deletion + media purge product flow | PM | Not Gate A blocker if project-level delete works |

## 8. Risks / non-goals

- **Risk:** 600 req/min global API limit may throttle chunked uploads — measure in KAI-008; possibly separate limiter.
- **Risk:** Single-process server cannot host long FFmpeg — worker mandatory before promising Gate A.
- **Risk:** Backup story incomplete until media included.
- **Non-goal:** Character role-play (KAI-035) before Gate B.
- **Non-goal:** Changing Grammar/FSRS/stats behaviour in KAI-001–004.
- **Non-goal:** Committing user media or provider credentials.

## 9. Verification (this task)

- Read-only survey of `server/app.ts`, `schema.sql`, `backup.ts`, `modules/grammar/*`, `src/App.tsx`, `src/main.tsx`, `package.json`, `docs/kaiwa/PLAN.md`.
- Confirmed absence of Kaiwa application directories.
- No production module behaviour changed for this task.
- Deliverables: this evidence file + ADR-015 + TASKS/PROGRESS/HANDOFF updates.

## 10. Next task

**KAI-002** — continuous capture spike (codec/mic/clock/latency/10‑minute drift), after this evidence is committed.
