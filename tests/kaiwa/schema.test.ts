import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { AddressInfo } from "node:net";
import { createApp } from "../../server/app";
import { createKaiwaProjectSchema } from "../../shared/kaiwa/types";

async function withServer(
  run: (
    base: string,
    cookie: string,
    db: ReturnType<typeof createApp>["db"],
  ) => Promise<void>,
) {
  const dir = mkdtempSync(join(tmpdir(), "kaiwa-"));
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
        email: `kaiwa-${Date.now()}-${Math.random().toString(16).slice(2)}@example.test`,
        name: "Kaiwa QA",
        password: "Test-only-password-2026",
      }),
    });
    assert.equal(reg.status, 201);
    const cookie = reg.headers.getSetCookie?.()[0]?.split(";")[0] || "";
    assert.ok(cookie.includes("kotoba_session"));
    await run(base, cookie, db);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
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

test("kaiwa shared create schema rejects empty title", () => {
  assert.throws(() => createKaiwaProjectSchema.parse({ title: "  " }));
});

test("kaiwa migration applies and enforces owner isolation", async () => {
  await withServer(async (base, cookie, db) => {
    const migrated = db
      .prepare("SELECT version FROM schema_migrations WHERE version=?")
      .get("kaiwa-001") as { version: string } | undefined;
    assert.equal(migrated?.version, "kaiwa-001");

    const other = await fetch(base + "/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "http://127.0.0.1:5173",
      },
      body: JSON.stringify({
        email: `other-${Date.now()}@example.test`,
        name: "Other",
        password: "Test-only-password-2026",
      }),
    });
    const otherCookie = other.headers.getSetCookie?.()[0]?.split(";")[0] || "";

    const created = await api(base, cookie, "/kaiwa/projects", {
      method: "POST",
      body: JSON.stringify({ title: "Video luyện 1" }),
    });
    assert.equal(created.status, 201);
    const project = (await created.json()) as { id: string };
    assert.ok(project.id);

    const leak = await api(base, otherCookie, "/kaiwa/projects/" + project.id);
    assert.equal(leak.status, 404);
  });
});

test("kaiwa project patch conflicts on stale version", async () => {
  await withServer(async (base, cookie) => {
    const created = await api(base, cookie, "/kaiwa/projects", {
      method: "POST",
      body: JSON.stringify({ title: "A" }),
    });
    const project = (await created.json()) as { id: string; version: number };

    const ok = await api(base, cookie, "/kaiwa/projects/" + project.id, {
      method: "PATCH",
      body: JSON.stringify({ title: "B", expectedVersion: project.version }),
    });
    assert.equal(ok.status, 200);
    const updated = (await ok.json()) as { version: number };
    assert.equal(updated.version, project.version + 1);

    const stale = await api(base, cookie, "/kaiwa/projects/" + project.id, {
      method: "PATCH",
      body: JSON.stringify({ title: "C", expectedVersion: project.version }),
    });
    assert.equal(stale.status, 409);
  });
});

test("kaiwa attempt keeps published revision after later draft edits", async () => {
  await withServer(async (base, cookie) => {
    const created = await api(base, cookie, "/kaiwa/projects", {
      method: "POST",
      body: JSON.stringify({ title: "Rev lock" }),
    });
    const project = (await created.json()) as { id: string };

    const draft1 = await api(base, cookie, `/kaiwa/projects/${project.id}/draft`, {
      method: "PUT",
      body: JSON.stringify({
        expectedRevisionVersion: 1,
        payload: {
          segments: [
            { id: "s1", startMs: 0, endMs: 1000, ja: "こんにちは", vi: "Xin chào" },
          ],
        },
      }),
    });
    assert.equal(draft1.status, 200);

    const published = await api(
      base,
      cookie,
      `/kaiwa/projects/${project.id}/revisions`,
      {
        method: "POST",
        body: JSON.stringify({ expectedRevisionVersion: 1 }),
      },
    );
    assert.equal(published.status, 201);
    const reviewed = (await published.json()) as {
      id: string;
      version: number;
      state: string;
    };
    assert.equal(reviewed.state, "reviewed");
    assert.equal(reviewed.version, 1);

    const attemptRes = await api(
      base,
      cookie,
      `/kaiwa/projects/${project.id}/attempts`,
      { method: "POST", body: "{}" },
    );
    assert.equal(attemptRes.status, 201);
    const attempt = (await attemptRes.json()) as {
      id: string;
      revision_id: string;
    };
    assert.equal(attempt.revision_id, reviewed.id);

    const draft2 = await api(base, cookie, `/kaiwa/projects/${project.id}/draft`, {
      method: "PUT",
      body: JSON.stringify({
        expectedRevisionVersion: 2,
        payload: {
          segments: [
            {
              id: "s1",
              startMs: 0,
              endMs: 1000,
              ja: "こんばんは",
              vi: "Chào buổi tối",
            },
          ],
        },
      }),
    });
    assert.equal(draft2.status, 200);

    const again = await api(base, cookie, `/kaiwa/attempts/${attempt.id}`);
    assert.equal(again.status, 200);
    const stored = (await again.json()) as { revision_id: string };
    assert.equal(stored.revision_id, reviewed.id);
  });
});

test("kaiwa draft save conflicts on stale revision version", async () => {
  await withServer(async (base, cookie) => {
    const created = await api(base, cookie, "/kaiwa/projects", {
      method: "POST",
      body: JSON.stringify({ title: "Conflict draft" }),
    });
    const project = (await created.json()) as { id: string };

    const first = await api(base, cookie, `/kaiwa/projects/${project.id}/draft`, {
      method: "PUT",
      body: JSON.stringify({
        expectedRevisionVersion: 1,
        payload: { segments: [{ id: "a", startMs: 0, endMs: 500, ja: "あ" }] },
      }),
    });
    assert.equal(first.status, 200);

    const published = await api(
      base,
      cookie,
      `/kaiwa/projects/${project.id}/revisions`,
      { method: "POST", body: JSON.stringify({ expectedRevisionVersion: 1 }) },
    );
    assert.equal(published.status, 201);

    const afterPublish = await api(
      base,
      cookie,
      `/kaiwa/projects/${project.id}/draft`,
      {
        method: "PUT",
        body: JSON.stringify({
          expectedRevisionVersion: 1,
          payload: { segments: [] },
        }),
      },
    );
    assert.equal(afterPublish.status, 409);
  });
});
