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
  const dir = mkdtempSync(join(tmpdir(), "kaiwa-prep-"));
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
        email: `prep-${Date.now()}@example.test`,
        name: "Prep QA",
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

test("start-practice publishes snapshot; later draft edits do not change attempt", async () => {
  await withServer(async (base, cookie) => {
    const created = await api(base, cookie, "/kaiwa/projects", {
      method: "POST",
      body: JSON.stringify({ title: "Prep snap" }),
    });
    const project = (await created.json()) as { id: string };

    await api(base, cookie, `/kaiwa/projects/${project.id}/draft`, {
      method: "PUT",
      body: JSON.stringify({
        expectedRevisionVersion: 1,
        payload: {
          segments: [
            { id: "a", startMs: 0, endMs: 800, ja: "こんにちは" },
          ],
        },
      }),
    });

    const start = await api(base, cookie, `/kaiwa/projects/${project.id}/start-practice`, {
      method: "POST",
      body: JSON.stringify({ publish: true, expectedRevisionVersion: 1 }),
    });
    assert.equal(start.status, 201);
    const attempt = (await start.json()) as {
      id: string;
      revision_id: string;
      assessableReady: boolean;
      revision: { version: number; state: string; payload: { segments: { ja: string }[] } };
    };
    assert.equal(attempt.assessableReady, true);
    assert.equal(attempt.revision.state, "reviewed");
    assert.equal(attempt.revision.payload.segments[0].ja, "こんにちは");
    const pinnedRevision = attempt.revision_id;

    // Later draft edit on new draft head
    const active = await api(
      base,
      cookie,
      `/kaiwa/projects/${project.id}/active-revision`,
    );
    const head = (await active.json()) as { version: number; state: string };
    assert.equal(head.state, "draft");
    await api(base, cookie, `/kaiwa/projects/${project.id}/draft`, {
      method: "PUT",
      body: JSON.stringify({
        expectedRevisionVersion: head.version,
        payload: {
          segments: [{ id: "b", startMs: 0, endMs: 500, ja: "変わった" }],
        },
      }),
    });

    const again = await api(base, cookie, `/kaiwa/attempts/${attempt.id}`);
    const snap = (await again.json()) as {
      revision_id: string;
      revision: { payload: { segments: { ja: string }[] } };
    };
    assert.equal(snap.revision_id, pinnedRevision);
    assert.equal(snap.revision.payload.segments[0].ja, "こんにちは");
  });
});

test("start-practice without transcript still creates attempt with assessableMessage", async () => {
  await withServer(async (base, cookie) => {
    const created = await api(base, cookie, "/kaiwa/projects", {
      method: "POST",
      body: JSON.stringify({ title: "Empty prep" }),
    });
    const project = (await created.json()) as { id: string };
    const start = await api(base, cookie, `/kaiwa/projects/${project.id}/start-practice`, {
      method: "POST",
      body: JSON.stringify({ publish: true, expectedRevisionVersion: 1 }),
    });
    assert.equal(start.status, 201);
    const attempt = (await start.json()) as {
      assessableReady: boolean;
      assessableMessage: string | null;
    };
    assert.equal(attempt.assessableReady, false);
    assert.ok(attempt.assessableMessage?.includes("chưa đủ chuẩn"));
  });
});
