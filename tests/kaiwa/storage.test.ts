import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import type { AddressInfo } from "node:net";
import { createApp } from "../../server/app";
import { LocalMediaStorage } from "../../server/modules/kaiwa/storage";

async function withServer(
  run: (base: string, cookie: string, mediaRoot: string) => Promise<void>,
  opts: { quotaBytes?: number } = {},
) {
  const dir = mkdtempSync(join(tmpdir(), "kaiwa-store-"));
  const dbPath = join(dir, "t.sqlite");
  const mediaRoot = join(dir, "kaiwa-media");
  // createApp derives media from db dirname; set env for this process section
  const prevQuota = process.env.KAIWA_QUOTA_BYTES;
  if (opts.quotaBytes != null)
    process.env.KAIWA_QUOTA_BYTES = String(opts.quotaBytes);
  const { app, db } = createApp(dbPath);
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
        email: `store-${Date.now()}-${Math.random().toString(16).slice(2)}@example.test`,
        name: "Store QA",
        password: "Test-only-password-2026",
      }),
    });
    assert.equal(reg.status, 201);
    const cookie = reg.headers.getSetCookie?.()[0]?.split(";")[0] || "";
    await run(base, cookie, mediaRoot);
  } finally {
    if (prevQuota === undefined) delete process.env.KAIWA_QUOTA_BYTES;
    else process.env.KAIWA_QUOTA_BYTES = prevQuota;
    await new Promise<void>((resolveClose) => server.close(() => resolveClose()));
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

test("local media storage rejects path escape and stays under root", () => {
  const root = mkdtempSync(join(tmpdir(), "kaiwa-fs-"));
  try {
    const store = new LocalMediaStorage(root);
    const key = store.createKey("source", "webm");
    assert.match(key, /^source\/[0-9a-f]{2}\/[0-9a-f]+\.webm$/);
    store.writeFile(key, Buffer.from("abc"));
    const path = store.resolvePath(key);
    assert.ok(path.startsWith(resolve(root)));
    assert.throws(() => store.resolvePath("../secret.bin"));
    assert.throws(() => store.resolvePath("..\\secret.bin"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("kaiwa quota reservation blocks second upload over limit and release frees space", async () => {
  await withServer(
    async (base, cookie, mediaRoot) => {
      const first = await api(base, cookie, "/kaiwa/assets/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "source", bytes: 800, ext: "bin" }),
      });
      assert.equal(first.status, 201);
      const a1 = (await first.json()) as { id: string; storage_key: string };
      assert.ok(!a1.storage_key.includes(".."));
      assert.ok(resolve(mediaRoot, a1.storage_key).startsWith(resolve(mediaRoot)));

      const second = await api(base, cookie, "/kaiwa/assets/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "source", bytes: 800, ext: "bin" }),
      });
      assert.equal(second.status, 413);

      const released = await api(base, cookie, "/kaiwa/assets/" + a1.id, {
        method: "DELETE",
      });
      assert.equal(released.status, 200);

      const third = await api(base, cookie, "/kaiwa/assets/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "source", bytes: 800, ext: "bin" }),
      });
      assert.equal(third.status, 201);
    },
    { quotaBytes: 1000 },
  );
});

test("kaiwa asset content GET/HEAD/Range require owner and support byte ranges", async () => {
  await withServer(async (base, cookie, mediaRoot) => {
    const reserved = await api(base, cookie, "/kaiwa/assets/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "source", bytes: 16, ext: "bin" }),
    });
    const asset = (await reserved.json()) as { id: string; storage_key: string };
    const payload = Buffer.from("0123456789abcdef");

    const put = await api(base, cookie, `/kaiwa/assets/${asset.id}/content`, {
      method: "PUT",
      headers: { "Content-Type": "application/octet-stream" },
      body: payload,
    });
    assert.equal(put.status, 200);
    assert.ok(existsSync(join(mediaRoot, asset.storage_key)));

    const other = await fetch(base + "/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "http://127.0.0.1:5173",
      },
      body: JSON.stringify({
        email: `other-store-${Date.now()}@example.test`,
        name: "Other",
        password: "Test-only-password-2026",
      }),
    });
    const otherCookie = other.headers.getSetCookie?.()[0]?.split(";")[0] || "";
    const leak = await api(
      base,
      otherCookie,
      `/kaiwa/assets/${asset.id}/content`,
    );
    assert.equal(leak.status, 404);

    const head = await api(base, cookie, `/kaiwa/assets/${asset.id}/content`, {
      method: "HEAD",
    });
    assert.equal(head.status, 200);
    assert.equal(head.headers.get("content-length"), "16");
    assert.equal(head.headers.get("accept-ranges"), "bytes");

    const full = await api(base, cookie, `/kaiwa/assets/${asset.id}/content`);
    assert.equal(full.status, 200);
    assert.deepEqual(Buffer.from(await full.arrayBuffer()), payload);

    const ranged = await api(base, cookie, `/kaiwa/assets/${asset.id}/content`, {
      headers: { Range: "bytes=2-5" },
    });
    assert.equal(ranged.status, 206);
    assert.equal(ranged.headers.get("content-range"), "bytes 2-5/16");
    assert.equal(Buffer.from(await ranged.arrayBuffer()).toString(), "2345");
  });
});
