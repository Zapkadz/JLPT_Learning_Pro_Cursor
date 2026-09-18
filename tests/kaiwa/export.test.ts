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
  const dir = mkdtempSync(join(tmpdir(), "kaiwa-exp-"));
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
        email: `exp-${Date.now()}@example.test`,
        name: "Export QA",
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

async function finalizedAttempt(base: string, cookie: string) {
  const created = await api(base, cookie, "/kaiwa/projects", {
    method: "POST",
    body: JSON.stringify({ title: "Export" }),
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
  const audio = minimalWebm(128);
  const put = await api(base, cookie, `/kaiwa/attempts/${attempt.id}/chunks/0`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/octet-stream",
      "X-Checksum-Sha256": sha(audio),
    },
    body: new Uint8Array(audio),
  });
  assert.equal(put.status, 200);
  const fin = await api(base, cookie, `/kaiwa/attempts/${attempt.id}/finalize`, {
    method: "POST",
    body: JSON.stringify({
      completion: "completed",
      durationMs: 2500,
      assemble: true,
    }),
  });
  assert.equal(fin.status, 200);
  return attempt;
}

test("export snapshots mix, is idempotent, download is private", async () => {
  await withServer(async (base, cookie) => {
    const attempt = await finalizedAttempt(base, cookie);

    const first = await api(
      base,
      cookie,
      `/kaiwa/attempts/${attempt.id}/exports`,
      {
        method: "POST",
        body: JSON.stringify({
          originalGain: 0.4,
          learnerGain: 0.9,
          offsetMs: 0,
        }),
      },
    );
    assert.equal(first.status, 201);
    const exp1 = (await first.json()) as {
      id: string;
      state: string;
      asset_id: string;
      mix_json: string;
      engine: string;
    };
    assert.equal(exp1.state, "ready");
    assert.ok(exp1.asset_id);
    const mix = JSON.parse(exp1.mix_json) as {
      originalGain: number;
      learnerGain: number;
    };
    assert.equal(mix.originalGain, 0.4);
    assert.equal(mix.learnerGain, 0.9);

    const second = await api(
      base,
      cookie,
      `/kaiwa/attempts/${attempt.id}/exports`,
      {
        method: "POST",
        body: JSON.stringify({
          originalGain: 0.4,
          learnerGain: 0.9,
          offsetMs: 0,
        }),
      },
    );
    assert.equal(second.status, 200);
    const exp2 = (await second.json()) as { id: string; asset_id: string };
    assert.equal(exp2.id, exp1.id);
    assert.equal(exp2.asset_id, exp1.asset_id);

    const otherMix = await api(
      base,
      cookie,
      `/kaiwa/attempts/${attempt.id}/exports`,
      {
        method: "POST",
        body: JSON.stringify({
          originalGain: 0.1,
          learnerGain: 1,
          offsetMs: 0,
        }),
      },
    );
    assert.equal(otherMix.status, 201);
    const exp3 = (await otherMix.json()) as { id: string };
    assert.notEqual(exp3.id, exp1.id);

    const dl = await api(base, cookie, `/kaiwa/exports/${exp1.id}/download`);
    assert.equal(dl.status, 200);
    assert.ok(
      (dl.headers.get("content-type") || "").includes("video/mp4") ||
        (dl.headers.get("content-type") || "").includes("octet-stream"),
    );
    const body = Buffer.from(await dl.arrayBuffer());
    assert.ok(body.length > 16);
    assert.equal(body.subarray(4, 8).toString("ascii"), "ftyp");

    const anon = await fetch(base + `/kaiwa/exports/${exp1.id}/download`, {
      headers: { Origin: "http://127.0.0.1:5173" },
    });
    assert.ok(anon.status === 401 || anon.status === 403);

    // Assessment/scoring is not required — export succeeded without any score job.
    assert.ok(exp1.engine);
  });
});
