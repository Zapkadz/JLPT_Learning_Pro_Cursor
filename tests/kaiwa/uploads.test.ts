import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { AddressInfo } from "node:net";
import { createApp } from "../../server/app";

async function withServer(
  run: (base: string, cookie: string) => Promise<void>,
) {
  const dir = mkdtempSync(join(tmpdir(), "kaiwa-up-"));
  const prev = process.env.KAIWA_QUOTA_BYTES;
  process.env.KAIWA_QUOTA_BYTES = String(10_000_000);
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
        email: `up-${Date.now()}-${Math.random().toString(16).slice(2)}@example.test`,
        name: "Up QA",
        password: "Test-only-password-2026",
      }),
    });
    assert.equal(reg.status, 201);
    const cookie = reg.headers.getSetCookie?.()[0]?.split(";")[0] || "";
    await run(base, cookie);
  } finally {
    if (prev === undefined) delete process.env.KAIWA_QUOTA_BYTES;
    else process.env.KAIWA_QUOTA_BYTES = prev;
    await new Promise<void>((r) => server.close(() => r()));
    db.close();
    rmSync(dir, { recursive: true, force: true });
  }
}

function api(base: string, cookie: string, path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("Origin", "http://127.0.0.1:5173");
  headers.set("Cookie", cookie);
  return fetch(base + path, { ...init, headers });
}

function sha256(buf: Buffer) {
  return createHash("sha256").update(buf).digest("hex");
}

test("kaiwa chunked upload duplicate hash ok, mismatch conflicts, missing blocks complete", async () => {
  await withServer(async (base, cookie) => {
    const payload = Buffer.from("ABCDEFGHIJKLMNOP"); // 16 bytes
    const chunkSize = 8;
    const created = await api(base, cookie, "/kaiwa/uploads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        purpose: "source",
        bytes: payload.length,
        chunkSize,
        checksum: sha256(payload),
        ext: "bin",
      }),
    });
    assert.equal(created.status, 201);
    const upload = (await created.json()) as {
      id: string;
      chunk_count: number;
      asset_id: string;
    };
    assert.equal(upload.chunk_count, 2);

    const c0 = payload.subarray(0, 8);
    const c1 = payload.subarray(8);
    const put0 = await api(base, cookie, `/kaiwa/uploads/${upload.id}/chunks/0`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/octet-stream",
        "X-Checksum-Sha256": sha256(c0),
      },
      body: c0,
    });
    assert.equal(put0.status, 200);

    const dup = await api(base, cookie, `/kaiwa/uploads/${upload.id}/chunks/0`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/octet-stream",
        "X-Checksum-Sha256": sha256(c0),
      },
      body: c0,
    });
    assert.equal(dup.status, 200);
    assert.equal(((await dup.json()) as { duplicate: boolean }).duplicate, true);

    const conflict = await api(
      base,
      cookie,
      `/kaiwa/uploads/${upload.id}/chunks/0`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/octet-stream",
          "X-Checksum-Sha256": sha256(Buffer.from("XXXXXXXX")),
        },
        body: Buffer.from("XXXXXXXX"),
      },
    );
    assert.equal(conflict.status, 409);

    const early = await api(base, cookie, `/kaiwa/uploads/${upload.id}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    assert.equal(early.status, 409);

    const put1 = await api(base, cookie, `/kaiwa/uploads/${upload.id}/chunks/1`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/octet-stream",
        "X-Checksum-Sha256": sha256(c1),
      },
      body: c1,
    });
    assert.equal(put1.status, 200);

    const done = await api(base, cookie, `/kaiwa/uploads/${upload.id}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    assert.equal(done.status, 200);
    const asset = (await done.json()) as {
      id: string;
      processing_status: string;
      bytes: number;
    };
    assert.equal(asset.processing_status, "ready");
    assert.equal(asset.bytes, 16);

    const content = await api(base, cookie, `/kaiwa/assets/${asset.id}/content`);
    assert.equal(content.status, 200);
    assert.deepEqual(Buffer.from(await content.arrayBuffer()), payload);
  });
});

test("kaiwa upload cancel releases quota reservation", async () => {
  await withServer(async (base, cookie) => {
    const created = await api(base, cookie, "/kaiwa/uploads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ purpose: "source", bytes: 4096, chunkSize: 1024 }),
    });
    const upload = (await created.json()) as { id: string };
    const cancelled = await api(base, cookie, `/kaiwa/uploads/${upload.id}`, {
      method: "DELETE",
    });
    assert.equal(cancelled.status, 200);
    const usage = await api(base, cookie, "/kaiwa/storage/usage");
    const body = (await usage.json()) as { usedBytes: number };
    assert.equal(body.usedBytes, 0);
  });
});
