/**
 * Kaiwa durable worker process.
 * Claims DB-backed jobs, heartbeats the lease, completes idempotently.
 *
 * Usage: npx tsx server/workers/kaiwa/worker.ts
 * Env: DB_PATH, KAIWA_WORKER_ID, KAIWA_LEASE_MS, KAIWA_POLL_MS
 */
import Database from "better-sqlite3";
import { readFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { createJobService } from "../../modules/kaiwa/jobs";

const dbPath = resolve(process.env.DB_PATH || "data/kotoba.sqlite");
mkdirSync(dirname(dbPath), { recursive: true });
const db = new Database(dbPath);
db.exec(
  readFileSync(new URL("../../schema.sql", import.meta.url), "utf8"),
);
// Apply kaiwa migrations (idempotent IF NOT EXISTS).
db.exec(
  readFileSync(
    new URL("../../modules/kaiwa/migration.sql", import.meta.url),
    "utf8",
  ),
);

const jobs = createJobService(db);
const workerId = process.env.KAIWA_WORKER_ID || `worker-${randomUUID()}`;
const leaseMs = Number(process.env.KAIWA_LEASE_MS || 30_000);
const pollMs = Number(process.env.KAIWA_POLL_MS || 500);
let stopping = false;

async function handleJob(job: {
  id: string;
  kind: string;
  payload: string;
  payload_version: number;
}) {
  // Placeholder handlers — real media work lands in later KAI tasks.
  // Echo/noop kinds exist for queue verification.
  if (job.kind === "noop" || job.kind === "echo") {
    const payload = JSON.parse(job.payload || "{}");
    jobs.heartbeat(workerId, job.id, { step: "echo" }, leaseMs);
    jobs.complete(workerId, job.id, {
      echo: payload,
      payloadVersion: job.payload_version,
      workerId,
    });
    return;
  }
  jobs.failJob(
    workerId,
    job.id,
    {
      code: "unsupported_kind",
      message: `Worker chưa hỗ trợ kind=${job.kind}`,
    },
    { retry: false },
  );
}

async function loop() {
  console.log(`Kaiwa worker ${workerId} polling ${dbPath}`);
  while (!stopping) {
    try {
      jobs.releaseExpiredLeases();
      const job = jobs.claimNext(workerId, undefined, leaseMs);
      if (!job) {
        await new Promise((r) => setTimeout(r, pollMs));
        continue;
      }
      console.log(`claimed ${job.id} kind=${job.kind}`);
      await handleJob(job);
    } catch (e) {
      console.error(
        "worker loop error",
        e instanceof Error ? e.message : "unknown",
      );
      await new Promise((r) => setTimeout(r, pollMs));
    }
  }
  db.close();
}

process.on("SIGINT", () => {
  stopping = true;
});
process.on("SIGTERM", () => {
  stopping = true;
});

void loop();
