import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { AddressInfo } from "node:net";
import { createApp } from "../../server/app";
import { MemoryChunkJournal, sha256Hex } from "../../src/features/kaiwa/chunkJournal";

function sha(buf: Buffer | Uint8Array) {
  return createHash("sha256").update(buf).digest("hex");
}

/** Minimal EBML/WebM header so assemble accepts the payload. */
function minimalWebm(extra = "audio-payload"): Buffer {
  return Buffer.concat([
    Buffer.from([0x1a, 0x45, 0xdf, 0xa3]),
    Buffer.from("webm"),
    Buffer.from(extra),
  ]);
}

async function withServer(
  run: (base: string, cookie: string) => Promise<void>,
) {
  const dir = mkdtempSync(join(tmpdir(), "kaiwa-jrn-"));
  const { app, db } = createApp(join(dir, "t.sqlite"));
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((r) => server.once("listening", r));
  try {
    const { port } = server.address() as AddressInfo;
    const base = `http://127.0.0.1:${port}/api`;
    const reg = await fetch(base + "/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "http://127.0.0.1:5173",
      },
      body: JSON.stringify({
        email: `jrn-${Date.now()}@example.test`,
        name: "Journal QA",
        password: "Test-only-password-2026",
      }),
    });
    const cookie = reg.headers.getSetCookie?.()[0]?.split(";")[0] || "";
    await run(base, cookie);
  } finally {
    await new Promise<void>((r) => server.close(() => r()));
    db.close();
    rmSync(dir, { recursive: true, force: true });
  }
}

function api(base: string, cookie: string, path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("Origin", "http://127.0.0.1:5173");
  headers.set("Cookie", cookie);
  if (init.body && !headers.has("Content-Type") && !(init.body instanceof Uint8Array))
    headers.set("Content-Type", "application/json");
  return fetch(base + path, { ...init, headers });
}

async function startAttempt(base: string, cookie: string) {
  const created = await api(base, cookie, "/kaiwa/projects", {
    method: "POST",
    body: JSON.stringify({ title: "Journal" }),
  });
  const project = (await created.json()) as { id: string };
  const start = await api(
    base,
    cookie,
    `/kaiwa/projects/${project.id}/start-practice`,
    {
      method: "POST",
      body: JSON.stringify({ publish: true, expectedRevisionVersion: 1 }),
    },
  );
  return (await start.json()) as { id: string };
}

test("memory journal append/list/order and usage", async () => {
  const j = new MemoryChunkJournal();
  const a = new Uint8Array([1, 2, 3]);
  const b = new Uint8Array([4, 5]);
  await j.append("att", 0, a, await sha256Hex(a));
  await j.append("att", 1, b, await sha256Hex(b));
  const list = await j.list("att");
  assert.deepEqual(
    list.map((c) => c.index),
    [0, 1],
  );
  assert.equal(await j.usageBytes("att"), 5);
});

test("attempt chunks resume: duplicate ok; finalize without audio rejected", async () => {
  await withServer(async (base, cookie) => {
    const attempt = await startAttempt(base, cookie);
    const p0 = minimalWebm("part0");
    const p1 = Buffer.from("part1-more-bytes!!");

    const put0 = await api(base, cookie, `/kaiwa/attempts/${attempt.id}/chunks/0`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/octet-stream",
        "X-Checksum-Sha256": sha(p0),
      },
      body: new Uint8Array(p0),
    });
    assert.equal(put0.status, 200);

    const mid = await api(base, cookie, `/kaiwa/attempts/${attempt.id}/upload-state`);
    const midBody = (await mid.json()) as { receivedIndexes: number[] };
    assert.deepEqual(midBody.receivedIndexes, [0]);

    // Resume: skip 0, send 1
    const put1 = await api(base, cookie, `/kaiwa/attempts/${attempt.id}/chunks/1`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/octet-stream",
        "X-Checksum-Sha256": sha(p1),
      },
      body: new Uint8Array(p1),
    });
    assert.equal(put1.status, 200);

    const dup = await api(base, cookie, `/kaiwa/attempts/${attempt.id}/chunks/0`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/octet-stream",
        "X-Checksum-Sha256": sha(p0),
      },
      body: new Uint8Array(p0),
    });
    assert.equal(dup.status, 200);
    assert.equal(((await dup.json()) as { duplicate: boolean }).duplicate, true);

    // Finalize without assemble → 409
    const badFin = await api(base, cookie, `/kaiwa/attempts/${attempt.id}/finalize`, {
      method: "POST",
      body: JSON.stringify({ completion: "partial", durationMs: 100 }),
    });
    assert.equal(badFin.status, 409);

    const assembled = await api(
      base,
      cookie,
      `/kaiwa/attempts/${attempt.id}/assemble-audio`,
      { method: "POST", body: "{}" },
    );
    assert.equal(assembled.status, 201);

    const fin = await api(base, cookie, `/kaiwa/attempts/${attempt.id}/finalize`, {
      method: "POST",
      body: JSON.stringify({ completion: "partial", durationMs: 1200 }),
    });
    assert.equal(fin.status, 200);
    const got = await api(base, cookie, `/kaiwa/attempts/${attempt.id}`);
    const row = (await got.json()) as {
      record_state: string;
      audio_asset_id: string | null;
      completion: string;
    };
    assert.equal(row.record_state, "saved");
    assert.equal(row.completion, "partial");
    assert.ok(row.audio_asset_id);
  });
});

test("garbage audio assemble rejects — never claims saved", async () => {
  await withServer(async (base, cookie) => {
    const attempt = await startAttempt(base, cookie);
    const junk = Buffer.from("not-a-media-container!!!!!");
    await api(base, cookie, `/kaiwa/attempts/${attempt.id}/chunks/0`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/octet-stream",
        "X-Checksum-Sha256": sha(junk),
      },
      body: new Uint8Array(junk),
    });
    const assembled = await api(
      base,
      cookie,
      `/kaiwa/attempts/${attempt.id}/assemble-audio`,
      { method: "POST", body: "{}" },
    );
    assert.equal(assembled.status, 422);
  });
});
