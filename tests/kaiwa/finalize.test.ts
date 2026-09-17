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

function minimalWebm(): Buffer {
  return Buffer.concat([
    Buffer.from([0x1a, 0x45, 0xdf, 0xa3]),
    Buffer.from("webm"),
    Buffer.from("finalize-audio-body-xxxxxxxx"),
  ]);
}

async function withServer(
  run: (base: string, cookie: string) => Promise<void>,
) {
  const dir = mkdtempSync(join(tmpdir(), "kaiwa-fin-"));
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
        email: `fin-${Date.now()}@example.test`,
        name: "Fin QA",
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

test("attempt finalize is idempotent after assemble; requires audio for partial", async () => {
  await withServer(async (base, cookie) => {
    const created = await api(base, cookie, "/kaiwa/projects", {
      method: "POST",
      body: JSON.stringify({ title: "Finalize" }),
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
    const attempt = (await start.json()) as { id: string };

    const noAudio = await api(
      base,
      cookie,
      `/kaiwa/attempts/${attempt.id}/finalize`,
      {
        method: "POST",
        body: JSON.stringify({ completion: "partial", durationMs: 100 }),
      },
    );
    assert.equal(noAudio.status, 409);

    const webm = minimalWebm();
    await api(base, cookie, `/kaiwa/attempts/${attempt.id}/chunks/0`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/octet-stream",
        "X-Checksum-Sha256": sha(webm),
      },
      body: new Uint8Array(webm),
    });
    const assembled = await api(
      base,
      cookie,
      `/kaiwa/attempts/${attempt.id}/assemble-audio`,
      { method: "POST", body: "{}" },
    );
    assert.equal(assembled.status, 201);

    const fin = await api(base, cookie, `/kaiwa/attempts/${attempt.id}/finalize`, {
      method: "POST",
      body: JSON.stringify({
        completion: "partial",
        durationMs: 1500,
        clocks: { engine: "video+perf", samples: [{ perf: 0, video: 0 }] },
      }),
    });
    assert.equal(fin.status, 200);

    const again = await api(
      base,
      cookie,
      `/kaiwa/attempts/${attempt.id}/finalize`,
      {
        method: "POST",
        body: JSON.stringify({
          completion: "completed",
          durationMs: 9999,
        }),
      },
    );
    assert.equal(again.status, 200);

    const got = await api(base, cookie, `/kaiwa/attempts/${attempt.id}`);
    const data = (await got.json()) as {
      completion: string;
      duration_ms: number;
      record_state: string;
    };
    assert.equal(data.completion, "partial");
    assert.equal(data.duration_ms, 1500);
    assert.equal(data.record_state, "saved");
  });
});
