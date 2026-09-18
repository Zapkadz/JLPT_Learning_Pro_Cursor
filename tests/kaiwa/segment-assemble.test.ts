import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { AddressInfo } from "node:net";
import { createApp } from "../../server/app";
import {
  buildSegmentTimeline,
  buildSilentWav,
} from "../../shared/kaiwa/segmentAssemble";

test("timeline plan: gaps silence, overlap flagged, duration matches max end", () => {
  const plan = buildSegmentTimeline(
    [
      { id: "a", startMs: 0, endMs: 500 },
      { id: "b", startMs: 800, endMs: 1200 },
      { id: "c", startMs: 1100, endMs: 1500 },
    ],
    [
      { segmentId: "a", status: "recorded", audioAssetId: "x" },
      { segmentId: "b", status: "recorded", audioAssetId: "y" },
      { segmentId: "c", status: "pending", audioAssetId: null },
    ],
  );
  assert.equal(plan.durationMs, 1500);
  assert.equal(plan.placements[1].gapBeforeMs, 300);
  assert.equal(plan.hasOverlap, true);
  assert.equal(plan.placements[2].overlapWithPrevious, true);
  assert.ok(plan.gapTotalMs >= 300);
  assert.equal(plan.pending, 1);
  assert.equal(plan.recordedOrPartial, 2);
});

test("silent wav duration roughly matches requested ms", () => {
  const wav = buildSilentWav(1000, 48_000);
  assert.equal(wav.toString("ascii", 0, 4), "RIFF");
  assert.equal(wav.toString("ascii", 8, 12), "WAVE");
  const dataSize = wav.readUInt32LE(40);
  assert.equal(dataSize, 48_000 * 2);
  assert.equal(wav.length, 44 + dataSize);
});

async function withServer(
  run: (base: string, cookie: string) => Promise<void>,
) {
  const dir = mkdtempSync(join(tmpdir(), "kaiwa-segasm-"));
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
        email: `asm-${Date.now()}@example.test`,
        name: "Asm",
        password: "Test-only-password-2026",
      }),
    });
    const cookie =
      reg.headers.getSetCookie?.()[0]?.split(";")[0] || "";
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

test("assemble-segments: gap timeline, honesty metadata, idempotent, export-ready", async () => {
  await withServer(async (base, cookie) => {
    const created = await api(base, cookie, "/kaiwa/projects", {
      method: "POST",
      body: JSON.stringify({ title: "Assemble" }),
    });
    const project = (await created.json()) as { id: string };
    await api(base, cookie, `/kaiwa/projects/${project.id}/draft`, {
      method: "PUT",
      body: JSON.stringify({
        expectedRevisionVersion: 1,
        payload: {
          segments: [
            { id: "s1", startMs: 0, endMs: 400, ja: "あ" },
            { id: "s2", startMs: 700, endMs: 1100, ja: "い" },
            { id: "s3", startMs: 1000, endMs: 1400, ja: "う" },
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
        body: JSON.stringify({
          publish: true,
          expectedRevisionVersion: 1,
          captureMode: "segment",
        }),
      },
    );
    assert.equal(start.status, 201);
    const attempt = (await start.json()) as { id: string };

    const payload = Buffer.from("clip-one-bytes-ok");
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
          durationMs: 400,
        }),
      },
    );
    assert.equal(rec.status, 201);

    await api(base, cookie, `/kaiwa/attempts/${attempt.id}/segment-clips/s2`, {
      method: "POST",
      body: JSON.stringify({ action: "skip", reason: "gap-test" }),
    });

    const asm = await api(
      base,
      cookie,
      `/kaiwa/attempts/${attempt.id}/assemble-segments`,
      { method: "POST", body: "{}" },
    );
    assert.ok(asm.status === 201 || asm.status === 200, `status ${asm.status}`);
    const body = (await asm.json()) as {
      assembly: string;
      captureMode: string;
      durationMs: number;
      hasOverlap: boolean;
      gapTotalMs: number;
      audioAssetId: string;
      completion: string;
      progress: { pending: number; recorded: number; skipped: number };
    };
    assert.equal(body.assembly, "segment_timeline");
    assert.equal(body.captureMode, "segment");
    assert.notEqual(body.captureMode, "continuous");
    assert.equal(body.durationMs, 1400);
    assert.equal(body.hasOverlap, true);
    assert.ok(body.gapTotalMs >= 300);
    assert.equal(body.completion, "partial");
    assert.ok(body.audioAssetId);
    assert.equal(body.progress.pending, 1);

    const again = await api(
      base,
      cookie,
      `/kaiwa/attempts/${attempt.id}/assemble-segments`,
      { method: "POST", body: "{}" },
    );
    const againBody = (await again.json()) as { reused: boolean };
    assert.equal(againBody.reused, true);

    const detail = await api(base, cookie, `/kaiwa/attempts/${attempt.id}`);
    const att = (await detail.json()) as {
      audio_asset_id: string | null;
      finalized_at: string | null;
      clocks_json: string;
      device_json: string;
    };
    assert.ok(att.finalized_at);
    assert.equal(att.audio_asset_id, body.audioAssetId);
    const clocks = JSON.parse(att.clocks_json) as {
      assembly: string;
      captureMode: string;
    };
    assert.equal(clocks.assembly, "segment_timeline");
    assert.equal(clocks.captureMode, "segment");
    const device = JSON.parse(att.device_json) as { captureMode: string };
    assert.equal(device.captureMode, "segment");

    const exp = await api(
      base,
      cookie,
      `/kaiwa/attempts/${attempt.id}/exports`,
      { method: "POST", body: "{}" },
    );
    assert.ok(
      exp.status === 200 || exp.status === 201,
      `export ${exp.status} ${await exp.text()}`,
    );
  });
});
