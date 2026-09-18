import { randomUUID } from "node:crypto";
import type Database from "better-sqlite3";
import { dayKey } from "../../../shared/domain";

/**
 * Gate A activity: record take finalization without granting deck/grammar XP.
 * Idempotent on (owner_id, event_key, day) UNIQUE — retries do not double-count.
 */
export function recordFinalizeActivity(
  db: Database.Database,
  input: {
    ownerId: string;
    attemptId: string;
    speakingMs: number;
    occurredAt?: string;
  },
) {
  const occurredAt = input.occurredAt || new Date().toISOString();
  const day = dayKey(new Date(occurredAt));
  const eventKey = `finalize:${input.attemptId}`;
  const speakingMs = Math.max(0, Math.floor(input.speakingMs) || 0);
  try {
    db.prepare(
      `INSERT INTO kaiwa_activity_events(
        id,owner_id,attempt_id,event_key,speaking_ms,occurred_at,day
      ) VALUES(?,?,?,?,?,?,?)`,
    ).run(
      randomUUID(),
      input.ownerId,
      input.attemptId,
      eventKey,
      speakingMs,
      occurredAt,
      day,
    );
    return { inserted: true, eventKey, day, speakingMs };
  } catch {
    return { inserted: false, eventKey, day, speakingMs };
  }
}

export function listActivityHistory(
  db: Database.Database,
  ownerId: string,
  limit = 50,
) {
  const events = db
    .prepare(
      `SELECT e.id, e.attempt_id, e.event_key, e.speaking_ms, e.occurred_at, e.day,
              a.project_id, a.completion, a.record_state, a.duration_ms,
              p.title AS project_title
       FROM kaiwa_activity_events e
       LEFT JOIN kaiwa_attempts a ON a.id = e.attempt_id
       LEFT JOIN kaiwa_projects p ON p.id = a.project_id
       WHERE e.owner_id=?
       ORDER BY e.occurred_at DESC
       LIMIT ?`,
    )
    .all(ownerId, Math.min(200, Math.max(1, limit))) as Record<
    string,
    unknown
  >[];

  const attempts = db
    .prepare(
      `SELECT a.id, a.project_id, a.record_state, a.completion, a.duration_ms,
              a.created_at, a.finalized_at, p.title AS project_title
       FROM kaiwa_attempts a
       JOIN kaiwa_projects p ON p.id = a.project_id
       WHERE a.owner_id=?
       ORDER BY COALESCE(a.finalized_at, a.created_at) DESC
       LIMIT ?`,
    )
    .all(ownerId, Math.min(200, Math.max(1, limit))) as Record<
    string,
    unknown
  >[];

  const byDay = db
    .prepare(
      `SELECT day, COUNT(*) AS takes, COALESCE(SUM(speaking_ms),0) AS speaking_ms
       FROM kaiwa_activity_events
       WHERE owner_id=?
       GROUP BY day
       ORDER BY day DESC
       LIMIT 60`,
    )
    .all(ownerId) as { day: string; takes: number; speaking_ms: number }[];

  return {
    events,
    attempts,
    byDay,
    today: dayKey(),
    timezone: "Asia/Ho_Chi_Minh",
    xpNote:
      "Kaiwa chưa cộng vào XP thẻ/ngữ pháp — xem ADR-018. Speaking XP (030b) chưa bật.",
  };
}
