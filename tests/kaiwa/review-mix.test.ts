import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { AddressInfo } from "node:net";
import { createApp } from "../../server/app";

async function withServer(
  run: (base: string, cookie: string) => Promise<void>,
) {
  const dir = mkdtempSync(join(tmpdir(), "kaiwa-review-"));
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
        email: `review-${Date.now()}@example.test`,
        name: "Review QA",
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
  if (init.body && !headers.has("Content-Type"))
    headers.set("Content-Type", "application/json");
  return fetch(base + path, { ...init, headers });
}

test("mix prefs persist; re-record creates a new attempt id", async () => {
  await withServer(async (base, cookie) => {
    const created = await api(base, cookie, "/kaiwa/projects", {
      method: "POST",
      body: JSON.stringify({ title: "Review mix" }),
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
    assert.equal(start.status, 201);
    const first = (await start.json()) as { id: string; project_id: string };
    assert.ok(first.id);

    const patched = await api(base, cookie, `/kaiwa/attempts/${first.id}/mix`, {
      method: "PATCH",
      body: JSON.stringify({
        originalGain: 0.25,
        learnerGain: 0.8,
        keep: true,
      }),
    });
    assert.equal(patched.status, 200);
    const afterMix = (await patched.json()) as { device_json: string };
    const device = JSON.parse(afterMix.device_json || "{}") as {
      mix?: { originalGain: number; learnerGain: number; keep: boolean };
    };
    assert.equal(device.mix?.originalGain, 0.25);
    assert.equal(device.mix?.learnerGain, 0.8);
    assert.equal(device.mix?.keep, true);

    const reload = await api(base, cookie, `/kaiwa/attempts/${first.id}`);
    assert.equal(reload.status, 200);
    const reloaded = (await reload.json()) as { device_json: string };
    const device2 = JSON.parse(reloaded.device_json || "{}") as {
      mix?: { originalGain: number; keep: boolean };
    };
    assert.equal(device2.mix?.originalGain, 0.25);
    assert.equal(device2.mix?.keep, true);

    const secondRes = await api(
      base,
      cookie,
      `/kaiwa/projects/${project.id}/attempts`,
      { method: "POST", body: "{}" },
    );
    assert.equal(secondRes.status, 201);
    const second = (await secondRes.json()) as { id: string };
    assert.notEqual(second.id, first.id);

    const listed = await api(
      base,
      cookie,
      `/kaiwa/projects/${project.id}/attempts`,
    );
    assert.equal(listed.status, 200);
    const body = (await listed.json()) as { attempts: { id: string }[] };
    assert.equal(body.attempts.length, 2);
    assert.ok(body.attempts.some((a) => a.id === first.id));
    assert.ok(body.attempts.some((a) => a.id === second.id));
  });
});
