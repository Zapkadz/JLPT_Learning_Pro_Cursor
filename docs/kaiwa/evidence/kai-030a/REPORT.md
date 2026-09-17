# KAI-030a — Take history / activity (Gate A)

Date: 2026-09-18

## Delivered

- `recordFinalizeActivity` on successful finalize (`finalize:{attemptId}`, day=`Asia/Ho_Chi_Minh`), idempotent UNIQUE
- `GET /api/kaiwa/history` — events, attempts, byDay; explicit note Kaiwa not in deck/grammar XP
- UI `/kaiwa/history` + library link
- **ADR-018** — Gate A = history only; speaking XP deferred to 030b; no injection into `/api/stats`

## Verification

- `npm test` includes `tests/kaiwa/history.test.ts` (idempotent event, XP unchanged)
- `npm run build` OK
