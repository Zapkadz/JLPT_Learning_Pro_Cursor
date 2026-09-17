import type Database from "better-sqlite3";
import { randomUUID } from "node:crypto";
import { KaiwaError } from "./repository";

export type KaiwaJobState =
  | "queued"
  | "running"
  | "succeeded"
  | "failed"
  | "cancelled";

export type KaiwaJobRow = {
  id: string;
  owner_id: string;
  kind: string;
  payload_version: number;
  payload: string;
  idempotency_key: string | null;
  state: string;
  retry_count: number;
  lease_owner: string | null;
  lease_until: string | null;
  progress_json: string;
  error_code: string | null;
  error_message: string | null;
  result_json: string | null;
  created_at: string;
  updated_at: string;
};

const DEFAULT_LEASE_MS = 30_000;
const DEFAULT_MAX_RETRIES = 3;

function fail(status: number, message: string): never {
  throw new KaiwaError(status, message);
}

export function createJobService(db: Database.Database) {
  function ensureResultColumn() {
    const cols = db.prepare("PRAGMA table_info(kaiwa_jobs)").all() as {
      name: string;
    }[];
    if (!cols.some((c) => c.name === "result_json")) {
      db.exec("ALTER TABLE kaiwa_jobs ADD COLUMN result_json TEXT");
    }
  }
  ensureResultColumn();

  function getJob(jobId: string): KaiwaJobRow | undefined {
    return db
      .prepare("SELECT * FROM kaiwa_jobs WHERE id=?")
      .get(jobId) as KaiwaJobRow | undefined;
  }

  function ownJob(ownerId: string, jobId: string): KaiwaJobRow {
    const row = db
      .prepare("SELECT * FROM kaiwa_jobs WHERE id=? AND owner_id=?")
      .get(jobId, ownerId) as KaiwaJobRow | undefined;
    if (!row) fail(404, "Không tìm thấy công việc Kaiwa.");
    return row;
  }

  /** Expire leases so a dead worker's jobs become claimable again. */
  function releaseExpiredLeases(now = new Date().toISOString()) {
    db.prepare(
      `UPDATE kaiwa_jobs
       SET state='queued', lease_owner=NULL, lease_until=NULL, updated_at=?
       WHERE state='running' AND lease_until IS NOT NULL AND lease_until < ?`,
    ).run(now, now);
  }

  function enqueue(input: {
    ownerId: string;
    kind: string;
    payload: unknown;
    payloadVersion?: number;
    idempotencyKey?: string | null;
  }): KaiwaJobRow {
    const payloadVersion = input.payloadVersion ?? 1;
    const now = new Date().toISOString();
    if (input.idempotencyKey) {
      const existing = db
        .prepare(
          "SELECT * FROM kaiwa_jobs WHERE owner_id=? AND idempotency_key=?",
        )
        .get(input.ownerId, input.idempotencyKey) as KaiwaJobRow | undefined;
      if (existing) return existing;
    }
    const id = randomUUID();
    try {
      db.prepare(
        `INSERT INTO kaiwa_jobs(
          id,owner_id,kind,payload_version,payload,idempotency_key,state,
          retry_count,progress_json,created_at,updated_at
        ) VALUES(?,?,?,?,?,?,?,0,'{}',?,?)`,
      ).run(
        id,
        input.ownerId,
        input.kind,
        payloadVersion,
        JSON.stringify(input.payload ?? {}),
        input.idempotencyKey ?? null,
        "queued",
        now,
        now,
      );
    } catch (e) {
      if (input.idempotencyKey) {
        const again = db
          .prepare(
            "SELECT * FROM kaiwa_jobs WHERE owner_id=? AND idempotency_key=?",
          )
          .get(input.ownerId, input.idempotencyKey) as KaiwaJobRow | undefined;
        if (again) return again;
      }
      throw e;
    }
    return getJob(id)!;
  }

  function claimNext(
    workerId: string,
    kinds?: string[],
    leaseMs = DEFAULT_LEASE_MS,
  ): KaiwaJobRow | null {
    return db.transaction(() => {
      releaseExpiredLeases();
      const now = Date.now();
      const nowIso = new Date(now).toISOString();
      const leaseUntil = new Date(now + leaseMs).toISOString();
      let row: KaiwaJobRow | undefined;
      if (kinds && kinds.length > 0) {
        const placeholders = kinds.map(() => "?").join(",");
        row = db
          .prepare(
            `SELECT * FROM kaiwa_jobs
             WHERE state='queued' AND kind IN (${placeholders})
             ORDER BY created_at ASC LIMIT 1`,
          )
          .get(...kinds) as KaiwaJobRow | undefined;
      } else {
        row = db
          .prepare(
            `SELECT * FROM kaiwa_jobs WHERE state='queued'
             ORDER BY created_at ASC LIMIT 1`,
          )
          .get() as KaiwaJobRow | undefined;
      }
      if (!row) return null;
      const result = db
        .prepare(
          `UPDATE kaiwa_jobs
           SET state='running', lease_owner=?, lease_until=?, updated_at=?
           WHERE id=? AND state='queued'`,
        )
        .run(workerId, leaseUntil, nowIso, row.id);
      if (result.changes !== 1) return null;
      return getJob(row.id)!;
    })();
  }

  function heartbeat(
    workerId: string,
    jobId: string,
    progress?: unknown,
    leaseMs = DEFAULT_LEASE_MS,
  ): KaiwaJobRow {
    const job = getJob(jobId);
    if (!job) fail(404, "Không tìm thấy công việc.");
    if (job.state !== "running" || job.lease_owner !== workerId)
      fail(409, "Không giữ lease của công việc này.");
    const now = Date.now();
    db.prepare(
      `UPDATE kaiwa_jobs SET lease_until=?, progress_json=?, updated_at=? WHERE id=?`,
    ).run(
      new Date(now + leaseMs).toISOString(),
      JSON.stringify(progress ?? JSON.parse(job.progress_json || "{}")),
      new Date(now).toISOString(),
      jobId,
    );
    return getJob(jobId)!;
  }

  /**
   * Idempotent success: repeating complete with same worker after success is a no-op return.
   * Prevents double-publish when worker retries after crash mid-ack.
   */
  function complete(
    workerId: string,
    jobId: string,
    result: unknown,
  ): KaiwaJobRow {
    return db.transaction(() => {
      const job = getJob(jobId);
      if (!job) fail(404, "Không tìm thấy công việc.");
      if (job.state === "succeeded") return job;
      if (job.state === "cancelled") fail(409, "Công việc đã bị hủy.");
      if (job.state !== "running" || job.lease_owner !== workerId)
        fail(409, "Không giữ lease để hoàn tất công việc.");
      const now = new Date().toISOString();
      db.prepare(
        `UPDATE kaiwa_jobs
         SET state='succeeded', result_json=?, lease_owner=NULL, lease_until=NULL,
             error_code=NULL, error_message=NULL, updated_at=?
         WHERE id=? AND state='running' AND lease_owner=?`,
      ).run(JSON.stringify(result ?? {}), now, jobId, workerId);
      const done = getJob(jobId)!;
      if (done.state !== "succeeded")
        fail(409, "Không thể đánh dấu hoàn tất (đã bị chiếm lại).");
      return done;
    })();
  }

  function failJob(
    workerId: string,
    jobId: string,
    error: { code: string; message: string },
    opts: { retry?: boolean; maxRetries?: number } = {},
  ): KaiwaJobRow {
    return db.transaction(() => {
      const job = getJob(jobId);
      if (!job) fail(404, "Không tìm thấy công việc.");
      if (job.state === "succeeded" || job.state === "cancelled") return job;
      if (job.state !== "running" || job.lease_owner !== workerId)
        fail(409, "Không giữ lease để ghi lỗi công việc.");
      const maxRetries = opts.maxRetries ?? DEFAULT_MAX_RETRIES;
      const now = new Date().toISOString();
      const canRetry =
        opts.retry !== false && job.retry_count < maxRetries;
      if (canRetry) {
        db.prepare(
          `UPDATE kaiwa_jobs
           SET state='queued', retry_count=retry_count+1, lease_owner=NULL,
               lease_until=NULL, error_code=?, error_message=?, updated_at=?
           WHERE id=?`,
        ).run(error.code, error.message, now, jobId);
      } else {
        db.prepare(
          `UPDATE kaiwa_jobs
           SET state='failed', lease_owner=NULL, lease_until=NULL,
               error_code=?, error_message=?, updated_at=?
           WHERE id=?`,
        ).run(error.code, error.message, now, jobId);
      }
      return getJob(jobId)!;
    })();
  }

  function cancel(ownerId: string, jobId: string): KaiwaJobRow {
    const job = ownJob(ownerId, jobId);
    if (job.state === "succeeded") return job;
    if (job.state === "cancelled") return job;
    const now = new Date().toISOString();
    db.prepare(
      `UPDATE kaiwa_jobs
       SET state='cancelled', lease_owner=NULL, lease_until=NULL, updated_at=?,
           error_code=COALESCE(error_code,'cancelled'),
           error_message=COALESCE(error_message,'Người dùng đã hủy.')
       WHERE id=? AND owner_id=? AND state IN ('queued','running')`,
    ).run(now, jobId, ownerId);
    return ownJob(ownerId, jobId);
  }

  return {
    enqueue,
    claimNext,
    heartbeat,
    complete,
    failJob,
    cancel,
    getJob,
    ownJob,
    releaseExpiredLeases,
  };
}

export type JobService = ReturnType<typeof createJobService>;
