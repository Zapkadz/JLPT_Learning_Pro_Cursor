import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { AddressInfo } from "node:net";
import { createApp } from "../../server/app";

function sha(buf: Buffer) {
  return createHash("sha256").update(buf).digest("hex");
}

function minimalWebm(pad = 64): Buffer {
  const extra = Buffer.alloc(pad, 0x42);
  return Buffer.concat([
    Buffer.from([0x1a, 0x45, 0xdf, 0xa3]),
    Buffer.from("webm"),
    extra,
  ]);
}

async function withServer(
  run: (base: string, cookie: string) => Promise<void>,
) {
  const dir = mkdtempSync(join(tmpdir(), "kaiwa-f20-"));
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
        email: `f20-${Date.now()}@example.test`,
        name: "F20 QA",
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
  if (
    init.body &&
    !headers.has("Content-Type") &&
    !(init.body instanceof Uint8Array)
  )
    headers.set("Content-Type", "application/json");
  return fetch(base + path, { ...init, headers });
}

async function startAttempt(base: string, cookie: string) {
  const created = await api(base, cookie, "/kaiwa/projects", {
    method: "POST",
    body: JSON.stringify({ title: "F20" }),
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

test("finalize auto-assembles, Range head/mid/tail readable, mic kind only", async () => {
  await withServer(async (base, cookie) => {
    const attempt = await startAttempt(base, cookie);
    const webm = minimalWebm(128);
    await api(base, cookie, `/kaiwa/attempts/${attempt.id}/chunks/0`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/octet-stream",
        "X-Checksum-Sha256": sha(webm),
      },
      body: new Uint8Array(webm),
    });

    const fin = await api(base, cookie, `/kaiwa/attempts/${attempt.id}/finalize`, {
      method: "POST",
      body: JSON.stringify({
        completion: "completed",
        durationMs: 2500,
        clocks: { engine: "video+perf" },
      }),
    });
    assert.equal(fin.status, 200);
    const body = (await fin.json()) as {
      audio_asset_id: string;
      record_state: string;
      finalize: { micOnly: boolean; reused: boolean };
    };
    assert.equal(body.record_state, "saved");
    assert.equal(body.finalize.micOnly, true);
    assert.ok(body.audio_asset_id);

    const asset = await api(base, cookie, `/kaiwa/assets/${body.audio_asset_id}`);
    // no dedicated GET asset meta — use content ranges
    const size = webm.length;
    const head = await api(
      base,
      cookie,
      `/kaiwa/assets/${body.audio_asset_id}/content`,
      { headers: { Range: "bytes=0-7" } },
    );
    assert.equal(head.status, 206);
    const midStart = Math.floor(size / 2);
    const mid = await api(
      base,
      cookie,
      `/kaiwa/assets/${body.audio_asset_id}/content`,
      { headers: { Range: `bytes=${midStart}-${midStart + 3}` } },
    );
    assert.equal(mid.status, 206);
    const tail = await api(
      base,
      cookie,
      `/kaiwa/assets/${body.audio_asset_id}/content`,
      { headers: { Range: `bytes=${size - 8}-${size - 1}` } },
    );
    assert.equal(tail.status, 206);

    const again = await api(
      base,
      cookie,
      `/kaiwa/attempts/${attempt.id}/finalize`,
      {
        method: "POST",
        body: JSON.stringify({ completion: "completed", durationMs: 1 }),
      },
    );
    assert.equal(again.status, 200);
    const againBody = (await again.json()) as {
      finalize: { reused: boolean };
      duration_ms: number;
    };
    assert.equal(againBody.finalize.reused, true);
    assert.equal(againBody.duration_ms, 2500);
    void asset;
  });
});

test("missing chunk gap blocks finalize completed/partial", async () => {
  await withServer(async (base, cookie) => {
    const attempt = await startAttempt(base, cookie);
    const a = minimalWebm(32);
    const c = minimalWebm(32);
    await api(base, cookie, `/kaiwa/attempts/${attempt.id}/chunks/0`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/octet-stream",
        "X-Checksum-Sha256": sha(a),
      },
      body: new Uint8Array(a),
    });
    await api(base, cookie, `/kaiwa/attempts/${attempt.id}/chunks/2`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/octet-stream",
        "X-Checksum-Sha256": sha(c),
      },
      body: new Uint8Array(c),
    });
    const fin = await api(base, cookie, `/kaiwa/attempts/${attempt.id}/finalize`, {
      method: "POST",
      body: JSON.stringify({ completion: "partial", durationMs: 1000 }),
    });
    assert.equal(fin.status, 409);
  });
});

test("interrupted without audio records tailMissing honestly", async () => {
  await withServer(async (base, cookie) => {
    const attempt = await startAttempt(base, cookie);
    const fin = await api(base, cookie, `/kaiwa/attempts/${attempt.id}/finalize`, {
      method: "POST",
      body: JSON.stringify({ completion: "interrupted", durationMs: 400 }),
    });
    assert.equal(fin.status, 200);
    const body = (await fin.json()) as {
      record_state: string;
      completion: string;
      finalize: { tailMissing: boolean };
      clocks_json?: string;
    };
    assert.equal(body.completion, "interrupted");
    assert.equal(body.record_state, "interrupted");
    assert.equal(body.finalize.tailMissing, true);
  });
});
