import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { AddressInfo } from "node:net";
import { createApp } from "../../server/app";
import {
  alignSegmentsToAttempt,
  splitLongSegment,
} from "../../shared/kaiwa/alignment";

test("aligned segments keep edge padding and forbid phoneme claims", () => {
  const report = alignSegmentsToAttempt(
    [{ id: "s1", startMs: 1000, endMs: 2000, ja: "こんにちは" }],
    { attemptDurationMs: 5000, offsetMs: 0, edgePadMs: 80 },
  );
  assert.equal(report.segments.length, 1);
  const s = report.segments[0];
  assert.equal(s.status, "aligned");
  assert.equal(s.alignedStartMs, 920);
  assert.equal(s.alignedEndMs, 2080);
  assert.equal(s.phonemeClaimsAllowed, false);
  assert.equal(s.listen.learnerStartMs, s.alignedStartMs);
});

test("beyond duration after interrupt is data_gap not missing_speech blame", () => {
  const report = alignSegmentsToAttempt(
    [
      { id: "a", startMs: 0, endMs: 1000 },
      { id: "b", startMs: 4000, endMs: 5000 },
    ],
    {
      attemptDurationMs: 2000,
      completion: "interrupted",
      tailMissing: true,
    },
  );
  assert.equal(report.segments[0].status, "aligned");
  assert.equal(report.segments[1].status, "data_gap");
  assert.ok(report.coverage.dataGapMs > 0);
  assert.equal(report.segments[1].phonemeClaimsAllowed, false);
});

test("partial EOF clip yields uncertain without affirmative phoneme errors", () => {
  const report = alignSegmentsToAttempt(
    [{ id: "c", startMs: 1500, endMs: 3000 }],
    { attemptDurationMs: 2000, completion: "interrupted", tailMissing: true },
  );
  assert.equal(report.segments[0].status, "uncertain");
  assert.ok(report.segments[0].reason?.includes("không chắc"));
});

test("splitLongSegment windows without inventing word boundaries", () => {
  const parts = splitLongSegment(
    { id: "long", startMs: 0, endMs: 25000 },
    10000,
  );
  assert.equal(parts.length, 3);
  assert.equal(parts[0].endMs, 10000);
  assert.equal(parts[2].endMs, 25000);
});

function sha(buf: Buffer) {
  return createHash("sha256").update(buf).digest("hex");
}

async function withServer(
  run: (base: string, cookie: string) => Promise<void>,
) {
  const dir = mkdtempSync(join(tmpdir(), "kaiwa-al-"));
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
        email: `al-${Date.now()}@example.test`,
        name: "Align QA",
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

test("POST alignment persists report for attempt with revision segments", async () => {
  await withServer(async (base, cookie) => {
    const created = await api(base, cookie, "/kaiwa/projects", {
      method: "POST",
      body: JSON.stringify({ title: "Align" }),
    });
    const project = (await created.json()) as { id: string };

    await api(base, cookie, `/kaiwa/projects/${project.id}/draft`, {
      method: "PUT",
      body: JSON.stringify({
        expectedRevisionVersion: 1,
        payload: {
          segments: [
            {
              id: "seg-1",
              startMs: 500,
              endMs: 1500,
              ja: "テスト",
              reviewState: "draft",
              assessable: true,
            },
          ],
        },
      }),
    });

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
    const webm = Buffer.concat([
      Buffer.from([0x1a, 0x45, 0xdf, 0xa3]),
      Buffer.from("webm"),
      Buffer.alloc(48, 2),
    ]);
    await api(base, cookie, `/kaiwa/attempts/${attempt.id}/chunks/0`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/octet-stream",
        "X-Checksum-Sha256": sha(webm),
      },
      body: new Uint8Array(webm),
    });
    await api(base, cookie, `/kaiwa/attempts/${attempt.id}/finalize`, {
      method: "POST",
      body: JSON.stringify({
        completion: "completed",
        durationMs: 3000,
        assemble: true,
      }),
    });

    const al = await api(
      base,
      cookie,
      `/kaiwa/attempts/${attempt.id}/alignment`,
      { method: "POST", body: JSON.stringify({ offsetMs: 0 }) },
    );
    assert.equal(al.status, 200);
    const report = (await al.json()) as {
      segments: { status: string; phonemeClaimsAllowed: boolean }[];
      engine: string;
    };
    assert.equal(report.engine, "kaiwa-align-v1");
    assert.equal(report.segments[0].status, "aligned");
    assert.equal(report.segments[0].phonemeClaimsAllowed, false);

    const get = await api(
      base,
      cookie,
      `/kaiwa/attempts/${attempt.id}/alignment`,
    );
    assert.equal(get.status, 200);
  });
});
