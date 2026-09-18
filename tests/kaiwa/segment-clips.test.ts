import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { AddressInfo } from "node:net";
import { createApp } from "../../server/app";
import {
  progressFromClips,
  summarizeSegmentProgress,
} from "../../shared/kaiwa/segmentClips";

test("progress helpers count pending/recorded/skipped", () => {
  const p = summarizeSegmentProgress([
    "recorded",
    "skipped",
    "pending",
    "partial",
  ]);
  assert.equal(p.total, 4);
  assert.equal(p.recorded, 1);
  assert.equal(p.skipped, 1);
  assert.equal(p.pending, 1);
  assert.equal(p.partial, 1);
  const from = progressFromClips(["a", "b", "c"], [
    { segmentId: "a", status: "recorded" },
  ]);
  assert.equal(from.pending, 2);
  assert.equal(from.recorded, 1);
});

async function withServer(
  run: (base: string, cookie: string, cookieB?: string) => Promise<void>,
  twoUsers = false,
) {
  const dir = mkdtempSync(join(tmpdir(), "kaiwa-segclip-"));
  const { app, db } = createApp(join(dir, "t.sqlite"));
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((r) => server.once("listening", r));
  try {
    const { port } = server.address() as AddressInfo;
    const base = `http://127.0.0.1:${port}/api`;
    async function reg(email: string) {
      const res = await fetch(base + "/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://127.0.0.1:5173",
        },
        body: JSON.stringify({
          email,
          name: "SegClip",
          password: "Test-only-password-2026",
        }),
      });
      return res.headers.getSetCookie?.()[0]?.split(";")[0] || "";
    }
    const cookie = await reg(`seg-${Date.now()}@example.test`);
    const cookieB = twoUsers
      ? await reg(`segb-${Date.now()}@example.test`)
      : undefined;
    await run(base, cookie, cookieB);
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

test("segment clips: default captureMode, record, skip, re-record versions, ownership", async () => {
  await withServer(async (base, cookie, cookieB) => {
    const created = await api(base, cookie, "/kaiwa/projects", {
      method: "POST",
      body: JSON.stringify({ title: "Seg clips" }),
    });
    const project = (await created.json()) as { id: string };
    await api(base, cookie, `/kaiwa/projects/${project.id}/draft`, {
      method: "PUT",
      body: JSON.stringify({
        expectedRevisionVersion: 1,
        payload: {
          segments: [
            { id: "s1", startMs: 0, endMs: 500, ja: "あ" },
            { id: "s2", startMs: 600, endMs: 1200, ja: "い" },
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
    assert.equal(start.status, 201);
    const attempt = (await start.json()) as {
      id: string;
      captureMode: string;
    };
    assert.equal(attempt.captureMode, "segment");

    const listed = await api(
      base,
      cookie,
      `/kaiwa/attempts/${attempt.id}/segment-clips`,
    );
    const list0 = (await listed.json()) as {
      progress: { total: number; pending: number };
      captureMode: string;
    };
    assert.equal(list0.captureMode, "segment");
    assert.equal(list0.progress.total, 2);
    assert.equal(list0.progress.pending, 2);

    const payload = Buffer.from("seg-clip-bytes");
    const hash = createHash("sha256").update(payload).digest("hex");
    const rec = await api(
      base,
      cookie,
      `/kaiwa/attempts/${attempt.id}/segment-clips/s1`,
      {
        method: "POST",
        body: JSON.stringify({
          action: "record",
          contentBase64: payload.toString("base64"),
          sha256: hash,
          durationMs: 480,
        }),
      },
    );
    assert.equal(rec.status, 201);
    const afterRec = (await rec.json()) as {
      progress: { recorded: number; pending: number };
      clips: Array<{ segmentId: string; version: number; status: string }>;
    };
    assert.equal(afterRec.progress.recorded, 1);
    assert.equal(afterRec.clips.find((c) => c.segmentId === "s1")?.version, 1);

    const skip = await api(
      base,
      cookie,
      `/kaiwa/attempts/${attempt.id}/segment-clips/s2`,
      {
        method: "POST",
        body: JSON.stringify({ action: "skip", reason: "too hard" }),
      },
    );
    assert.equal(skip.status, 201);
    const afterSkip = (await skip.json()) as {
      progress: { skipped: number; recorded: number; pending: number };
    };
    assert.equal(afterSkip.progress.skipped, 1);
    assert.equal(afterSkip.progress.pending, 0);

    const rec2 = await api(
      base,
      cookie,
      `/kaiwa/attempts/${attempt.id}/segment-clips/s1`,
      {
        method: "POST",
        body: JSON.stringify({
          action: "record",
          contentBase64: Buffer.from("seg-clip-v2").toString("base64"),
          durationMs: 500,
        }),
      },
    );
    const afterV2 = (await rec2.json()) as {
      clips: Array<{ segmentId: string; version: number }>;
    };
    assert.equal(afterV2.clips.find((c) => c.segmentId === "s1")?.version, 2);

    assert.ok(cookieB);
    const peer = await api(
      base,
      cookieB!,
      `/kaiwa/attempts/${attempt.id}/segment-clips`,
    );
    assert.equal(peer.status, 404);
  }, true);
});

test("re-record keeps other segment clips and version history", async () => {
  await withServer(async (base, cookie) => {
    const created = await api(base, cookie, "/kaiwa/projects", {
      method: "POST",
      body: JSON.stringify({ title: "Re-record" }),
    });
    const project = (await created.json()) as { id: string };
    await api(base, cookie, `/kaiwa/projects/${project.id}/draft`, {
      method: "PUT",
      body: JSON.stringify({
        expectedRevisionVersion: 1,
        payload: {
          segments: [
            { id: "s1", startMs: 0, endMs: 400, ja: "あ" },
            { id: "s2", startMs: 500, endMs: 900, ja: "い" },
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

    async function rec(seg: string, bytes: string) {
      const payload = Buffer.from(bytes);
      return api(base, cookie, `/kaiwa/attempts/${attempt.id}/segment-clips/${seg}`, {
        method: "POST",
        body: JSON.stringify({
          action: "record",
          contentBase64: payload.toString("base64"),
          sha256: createHash("sha256").update(payload).digest("hex"),
          durationMs: 400,
        }),
      });
    }

    const r1 = await rec("s1", "clip-s1-v1");
    assert.equal(r1.status, 201);
    const after1 = (await r1.json()) as {
      clips: Array<{ segmentId: string; version: number; audioAssetId: string }>;
    };
    const s1v1 = after1.clips.find((c) => c.segmentId === "s1")!;
    assert.equal(s1v1.version, 1);

    const r2 = await rec("s2", "clip-s2-only");
    const after2 = (await r2.json()) as {
      clips: Array<{ segmentId: string; version: number; audioAssetId: string }>;
    };
    const s2 = after2.clips.find((c) => c.segmentId === "s2")!;
    assert.ok(s2.audioAssetId);

    const r1b = await rec("s1", "clip-s1-v2-new");
    const afterR = (await r1b.json()) as {
      clips: Array<{ segmentId: string; version: number; audioAssetId: string }>;
      progress: { recorded: number };
    };
    const s1v2 = afterR.clips.find((c) => c.segmentId === "s1")!;
    const s2still = afterR.clips.find((c) => c.segmentId === "s2")!;
    assert.equal(s1v2.version, 2);
    assert.notEqual(s1v2.audioAssetId, s1v1.audioAssetId);
    assert.equal(s2still.audioAssetId, s2.audioAssetId);
    assert.equal(afterR.progress.recorded, 2);

    const hist = await api(
      base,
      cookie,
      `/kaiwa/attempts/${attempt.id}/segment-clips/s1/history`,
    );
    assert.equal(hist.status, 200);
    const history = (await hist.json()) as {
      takes: Array<{ version: number; audioAssetId: string | null }>;
    };
    assert.equal(history.takes.length, 2);
    assert.equal(history.takes[0].version, 1);
    assert.equal(history.takes[0].audioAssetId, s1v1.audioAssetId);
    assert.equal(history.takes[1].version, 2);
    assert.equal(history.takes[1].audioAssetId, s1v2.audioAssetId);

    // Old v1 asset still readable
    const oldAsset = await api(
      base,
      cookie,
      `/kaiwa/assets/${s1v1.audioAssetId}/content`,
    );
    assert.equal(oldAsset.status, 200);
  });
});
