import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import Database from "better-sqlite3";
import { readFileSync } from "node:fs";
import { createJobService } from "../../server/modules/kaiwa/jobs";

function openDb() {
  const dir = mkdtempSync(join(tmpdir(), "kaiwa-jobs-"));
  const db = new Database(join(dir, "t.sqlite"));
  db.exec(
    readFileSync(new URL("../../server/schema.sql", import.meta.url), "utf8"),
  );
  db.exec(
    readFileSync(
      new URL("../../server/modules/kaiwa/migration.sql", import.meta.url),
      "utf8",
    ),
  );
  db.prepare(
    "INSERT INTO users VALUES(?,?,?,?,?,?)",
  ).run("u1", "a@test", "A", "x", "{}", new Date().toISOString());
  return { db, dir };
}

test("kaiwa job lease expires and another worker can reclaim", () => {
  const { db, dir } = openDb();
  try {
    const jobs = createJobService(db);
    const job = jobs.enqueue({
      ownerId: "u1",
      kind: "noop",
      payload: { n: 1 },
      payloadVersion: 1,
      idempotencyKey: "idem-1",
    });
    assert.equal(job.payload_version, 1);
    assert.equal(job.state, "queued");

    const again = jobs.enqueue({
      ownerId: "u1",
      kind: "noop",
      payload: { n: 99 },
      idempotencyKey: "idem-1",
    });
    assert.equal(again.id, job.id);

    const claimed = jobs.claimNext("worker-a", undefined, 50);
    assert.ok(claimed);
    assert.equal(claimed!.state, "running");
    assert.equal(claimed!.lease_owner, "worker-a");

    // Simulate dead worker: force lease into the past
    db.prepare(
      "UPDATE kaiwa_jobs SET lease_until=? WHERE id=?",
    ).run(new Date(Date.now() - 1000).toISOString(), claimed!.id);

    const reclaimed = jobs.claimNext("worker-b", undefined, 30_000);
    assert.ok(reclaimed);
    assert.equal(reclaimed!.id, claimed!.id);
    assert.equal(reclaimed!.lease_owner, "worker-b");
  } finally {
    db.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test("kaiwa job complete is idempotent and does not double-publish", () => {
  const { db, dir } = openDb();
  try {
    const jobs = createJobService(db);
    const job = jobs.enqueue({
      ownerId: "u1",
      kind: "echo",
      payload: { hello: "world" },
    });
    const claimed = jobs.claimNext("w1")!;
    const first = jobs.complete("w1", claimed.id, { outputKey: "out-1" });
    assert.equal(first.state, "succeeded");
    assert.equal(JSON.parse(first.result_json || "{}").outputKey, "out-1");

    const second = jobs.complete("w1", claimed.id, { outputKey: "out-2" });
    assert.equal(second.state, "succeeded");
    assert.equal(JSON.parse(second.result_json || "{}").outputKey, "out-1");

    const count = db
      .prepare("SELECT COUNT(*) AS n FROM kaiwa_jobs WHERE id=?")
      .get(job.id) as { n: number };
    assert.equal(count.n, 1);
  } finally {
    db.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test("kaiwa job failure records readable error after retries exhausted", () => {
  const { db, dir } = openDb();
  try {
    const jobs = createJobService(db);
    const job = jobs.enqueue({ ownerId: "u1", kind: "noop", payload: {} });
    let current = jobs.claimNext("w1")!;
    for (let i = 0; i < 3; i++) {
      current = jobs.failJob(
        "w1",
        current.id,
        { code: "boom", message: "Lỗi thử nghiệm" },
        { maxRetries: 3 },
      );
      if (current.state === "queued") current = jobs.claimNext("w1")!;
    }
    current = jobs.failJob(
      "w1",
      current.id,
      { code: "boom", message: "Lỗi thử nghiệm cuối" },
      { maxRetries: 3 },
    );
    assert.equal(current.state, "failed");
    assert.equal(current.error_code, "boom");
    assert.match(current.error_message || "", /cuối|thử nghiệm/);
  } finally {
    db.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
