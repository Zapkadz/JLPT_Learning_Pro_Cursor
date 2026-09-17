import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { AddressInfo } from "node:net";
import { createApp } from "../../server/app";
import { stripSubtitleMarkup } from "../../shared/kaiwa/subtitles";

function sha(buf: Buffer) {
  return createHash("sha256").update(buf).digest("hex");
}

function minimalWebm(pad = 48): Buffer {
  return Buffer.concat([
    Buffer.from([0x1a, 0x45, 0xdf, 0xa3]),
    Buffer.from("webm"),
    Buffer.alloc(pad, 0x41),
  ]);
}

async function withTwoUsers(
  run: (ctx: {
    base: string;
    cookieA: string;
    cookieB: string;
  }) => Promise<void>,
) {
  const dir = mkdtempSync(join(tmpdir(), "kaiwa-sec-"));
  const { app, db } = createApp(join(dir, "t.sqlite"));
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((r) => server.once("listening", r));
  try {
    const { port } = server.address() as AddressInfo;
    const base = `http://127.0.0.1:${port}/api`;
    async function register(tag: string) {
      const reg = await fetch(base + "/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://127.0.0.1:5173",
        },
        body: JSON.stringify({
          email: `sec-${tag}-${Date.now()}@example.test`,
          name: `Sec ${tag}`,
          password: "Test-only-password-2026",
        }),
      });
      assert.equal(reg.status, 201);
      return reg.headers.getSetCookie?.()[0]?.split(";")[0] || "";
    }
    const cookieA = await register("a");
    const cookieB = await register("b");
    await run({ base, cookieA, cookieB });
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

test("cross-account cannot read project, attempt, export, or history of peer", async () => {
  await withTwoUsers(async ({ base, cookieA, cookieB }) => {
    const created = await api(base, cookieA, "/kaiwa/projects", {
      method: "POST",
      body: JSON.stringify({ title: "Private A" }),
    });
    const project = (await created.json()) as { id: string };

    const start = await api(
      base,
      cookieA,
      `/kaiwa/projects/${project.id}/start-practice`,
      {
        method: "POST",
        body: JSON.stringify({ publish: true, expectedRevisionVersion: 1 }),
      },
    );
    const attempt = (await start.json()) as { id: string };
    const audio = minimalWebm();
    await api(base, cookieA, `/kaiwa/attempts/${attempt.id}/chunks/0`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/octet-stream",
        "X-Checksum-Sha256": sha(audio),
      },
      body: new Uint8Array(audio),
    });
    await api(base, cookieA, `/kaiwa/attempts/${attempt.id}/finalize`, {
      method: "POST",
      body: JSON.stringify({
        completion: "completed",
        durationMs: 1500,
        assemble: true,
      }),
    });
    const exp = await api(
      base,
      cookieA,
      `/kaiwa/attempts/${attempt.id}/exports`,
      {
        method: "POST",
        body: JSON.stringify({
          originalGain: 0.5,
          learnerGain: 1,
          offsetMs: 0,
        }),
      },
    );
    assert.ok(exp.status === 201 || exp.status === 200);
    const exportRow = (await exp.json()) as { id: string };

    assert.equal(
      (await api(base, cookieB, `/kaiwa/projects/${project.id}`)).status,
      404,
    );
    assert.equal(
      (await api(base, cookieB, `/kaiwa/attempts/${attempt.id}`)).status,
      404,
    );
    assert.equal(
      (await api(base, cookieB, `/kaiwa/exports/${exportRow.id}`)).status,
      404,
    );
    assert.equal(
      (
        await api(base, cookieB, `/kaiwa/exports/${exportRow.id}/download`)
      ).status,
      404,
    );
    assert.equal(
      (
        await api(base, cookieB, `/kaiwa/projects/${project.id}/attempts`)
      ).status,
      404,
    );

    const histB = await api(base, cookieB, "/kaiwa/history");
    assert.equal(histB.status, 200);
    const bodyB = (await histB.json()) as {
      attempts: { id: string }[];
      events: { attempt_id: string }[];
    };
    assert.ok(!bodyB.attempts.some((a) => a.id === attempt.id));
    assert.ok(!bodyB.events.some((e) => e.attempt_id === attempt.id));
  });
});

test("unauthenticated kaiwa routes reject; subtitle markup stays non-executable", async () => {
  await withTwoUsers(async ({ base }) => {
    const anon = await fetch(base + "/kaiwa/projects", {
      headers: { Origin: "http://127.0.0.1:5173" },
    });
    assert.ok(anon.status === 401 || anon.status === 403);

    const { text, stripped } = stripSubtitleMarkup(
      '<script>alert(1)</script>こんにちは <b onclick="x()">世界</b>',
    );
    assert.equal(stripped, true);
    assert.ok(!text.includes("<script"));
    assert.ok(!text.includes("onclick"));
    assert.ok(text.includes("こんにちは"));
  });
});
