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
  const dir = mkdtempSync(join(tmpdir(), "kaiwa-read-"));
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
        email: `read-${Date.now()}@example.test`,
        name: "Read QA",
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

test("manual reading/romaji tokens persist across draft reload", async () => {
  await withServer(async (base, cookie) => {
    const created = await api(base, cookie, "/kaiwa/projects", {
      method: "POST",
      body: JSON.stringify({ title: "Reading persist" }),
    });
    const project = (await created.json()) as { id: string };
    const draft = await api(base, cookie, `/kaiwa/projects/${project.id}/draft`, {
      method: "PUT",
      body: JSON.stringify({
        expectedRevisionVersion: 1,
        payload: {
          segments: [
            {
              id: "s1",
              startMs: 0,
              endMs: 1000,
              ja: "学校は",
              vi: "trường học",
              tokens: [
                {
                  surface: "学校",
                  reading: "がっこう",
                  romaji: "gakkou",
                  manual: true,
                },
                {
                  surface: "は",
                  reading: "は",
                  romaji: "wa",
                  manual: true,
                },
              ],
              readingStale: false,
            },
          ],
        },
      }),
    });
    assert.equal(draft.status, 200);

    const loaded = await api(
      base,
      cookie,
      `/kaiwa/projects/${project.id}/active-revision`,
    );
    assert.equal(loaded.status, 200);
    const body = (await loaded.json()) as {
      payload: {
        segments: {
          tokens: { romaji: string; manual?: boolean }[];
          vi?: string;
        }[];
      };
    };
    assert.equal(body.payload.segments[0].vi, "trường học");
    assert.equal(body.payload.segments[0].tokens[1].romaji, "wa");
    assert.equal(body.payload.segments[0].tokens[0].manual, true);
  });
});
