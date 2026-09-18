import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { AddressInfo } from "node:net";
import { createApp } from "../../server/app";
import { dayKey } from "../../shared/domain";

function sha(buf: Buffer) {
  return createHash("sha256").update(buf).digest("hex");
}

function minimalWebm(pad = 64): Buffer {
  return Buffer.concat([
    Buffer.from([0x1a, 0x45, 0xdf, 0xa3]),
    Buffer.from("webm"),
    Buffer.alloc(pad, 0x42),
  ]);
}

async function withServer(
  run: (base: string, cookie: string) => Promise<void>,
) {
  const dir = mkdtempSync(join(tmpdir(), "kaiwa-hist-"));
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
        email: `hist-${Date.now()}@example.test`,
        name: "Hist QA",
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

test("finalize writes idempotent activity; history lists; stats XP untouched", async () => {
  await withServer(async (base, cookie) => {
    const statsBefore = await api(base, cookie, "/stats");
    assert.equal(statsBefore.status, 200);
    const before = (await statsBefore.json()) as { xp: number };

    const created = await api(base, cookie, "/kaiwa/projects", {
      method: "POST",
      body: JSON.stringify({ title: "History" }),
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
    const audio = minimalWebm(96);
    await api(base, cookie, `/kaiwa/attempts/${attempt.id}/chunks/0`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/octet-stream",
        "X-Checksum-Sha256": sha(audio),
      },
      body: new Uint8Array(audio),
    });

    const fin1 = await api(
      base,
      cookie,
      `/kaiwa/attempts/${attempt.id}/finalize`,
      {
        method: "POST",
        body: JSON.stringify({
          completion: "completed",
          durationMs: 3200,
          assemble: true,
        }),
      },
    );
    assert.equal(fin1.status, 200);

    const fin2 = await api(
      base,
      cookie,
      `/kaiwa/attempts/${attempt.id}/finalize`,
      {
        method: "POST",
        body: JSON.stringify({
          completion: "completed",
          durationMs: 3200,
          assemble: true,
        }),
      },
    );
    assert.equal(fin2.status, 200);
    const reused = (await fin2.json()) as { finalize?: { reused?: boolean } };
    assert.equal(reused.finalize?.reused ?? true, true);

    const hist = await api(base, cookie, "/kaiwa/history");
    assert.equal(hist.status, 200);
    const body = (await hist.json()) as {
      events: { attempt_id: string; event_key: string; day: string }[];
      attempts: { id: string }[];
      today: string;
      timezone: string;
      xpNote: string;
    };
    assert.equal(body.timezone, "Asia/Ho_Chi_Minh");
    assert.equal(body.today, dayKey());
    assert.ok(body.xpNote.includes("XP"));
    const finalizeEvents = body.events.filter(
      (e) => e.event_key === `finalize:${attempt.id}`,
    );
    assert.equal(finalizeEvents.length, 1);
    assert.equal(finalizeEvents[0].day, dayKey());
    assert.ok(body.attempts.some((a) => a.id === attempt.id));

    const statsAfter = await api(base, cookie, "/stats");
    const after = (await statsAfter.json()) as { xp: number };
    assert.equal(after.xp, before.xp);
  });
});
