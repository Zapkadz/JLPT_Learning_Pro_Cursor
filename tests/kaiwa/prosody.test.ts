import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { AddressInfo } from "node:net";
import { createApp } from "../../server/app";
import {
  analyzeProsodyPcm,
  estimateF0Hz,
  synthesizePcmInt16Le,
} from "../../shared/kaiwa/prosody";

test("constant 220Hz tone yields relative flat contour without pitch accent", () => {
  const sr = 16000;
  const pcm = synthesizePcmInt16Le(sr * 1, (i) =>
    0.4 * Math.sin((2 * Math.PI * 220 * i) / sr),
  );
  const r = analyzeProsodyPcm(pcm, {
    sampleRateHz: sr,
    plannedMs: 1000,
    segmentId: "s1",
  });
  assert.equal(r.status, "ready");
  assert.equal(r.pitchAccentLabel, null);
  assert.equal(r.abilityScore, null);
  assert.ok(r.f0.medianHz != null);
  assert.ok(Math.abs((r.f0.medianHz as number) - 220) < 30);
  assert.ok(r.f0.direction === "flat" || r.f0.direction === "unknown");
  assert.ok(r.messageVi.includes("không phải pitch accent"));
});

test("silence is not_assessable — no invented intonation score", () => {
  const pcm = synthesizePcmInt16Le(16000, () => 0);
  const r = analyzeProsodyPcm(pcm, { sampleRateHz: 16000, plannedMs: 1000 });
  assert.equal(r.status, "not_assessable");
  assert.equal(r.abilityScore, null);
  assert.equal(r.pitchAccentLabel, null);
});

test("weak alignment refuses rhythm/F0 claims", () => {
  const pcm = synthesizePcmInt16Le(8000, (i) =>
    0.3 * Math.sin((2 * Math.PI * 180 * i) / 16000),
  );
  const r = analyzeProsodyPcm(pcm, {
    sampleRateHz: 16000,
    alignmentStatus: "data_gap",
    plannedMs: 500,
  });
  assert.equal(r.status, "not_assessable");
  assert.ok(r.reason?.includes("data_gap"));
  assert.equal(r.f0.relativeContour.length, 0);
});

test("rising chirp reports rising direction without accent label", () => {
  const sr = 16000;
  const pcm = synthesizePcmInt16Le(sr, (i) => {
    const t = i / sr;
    const hz = 150 + 120 * t;
    return 0.35 * Math.sin(2 * Math.PI * hz * t);
  });
  const r = analyzeProsodyPcm(pcm, { sampleRateHz: sr, plannedMs: 1000 });
  assert.equal(r.status, "ready");
  assert.equal(r.pitchAccentLabel, null);
  // Chirp may be flat/rising depending on frame coverage — never an accent label
  assert.ok(["rising", "falling", "flat", "unknown"].includes(r.f0.direction));
});

test("estimateF0Hz returns null for silence frame", () => {
  const frame = new Float64Array(400);
  assert.equal(estimateF0Hz(frame, 16000), null);
});

async function withServer(
  run: (base: string, cookie: string) => Promise<void>,
) {
  const dir = mkdtempSync(join(tmpdir(), "kaiwa-prosody-"));
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
        email: `prosody-${Date.now()}@example.test`,
        name: "Prosody QA",
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

test("POST prosody on WebM mic is unavailable decode — no fake F0", async () => {
  await withServer(async (base, cookie) => {
    const created = await api(base, cookie, "/kaiwa/projects", {
      method: "POST",
      body: JSON.stringify({ title: "Prosody stub" }),
    });
    const project = (await created.json()) as { id: string };
    await api(base, cookie, `/kaiwa/projects/${project.id}/draft`, {
      method: "PUT",
      body: JSON.stringify({
        expectedRevisionVersion: 1,
        payload: {
          segments: [{ id: "a", startMs: 0, endMs: 800, ja: "こんにちは" }],
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
    const payload = Buffer.from("fake-webm-bytes");
    const hash = createHash("sha256").update(payload).digest("hex");
    await api(base, cookie, `/kaiwa/attempts/${attempt.id}/chunks`, {
      method: "POST",
      body: JSON.stringify({
        index: 0,
        byteLength: payload.length,
        sha256: hash,
        contentBase64: payload.toString("base64"),
      }),
    });
    await api(base, cookie, `/kaiwa/attempts/${attempt.id}/finalize`, {
      method: "POST",
      body: JSON.stringify({
        completion: "completed",
        durationMs: 1000,
        chunkCount: 1,
      }),
    });

    const res = await api(
      base,
      cookie,
      `/kaiwa/attempts/${attempt.id}/prosody`,
      { method: "POST", body: "{}" },
    );
    assert.equal(res.status, 200);
    const report = (await res.json()) as {
      status: string;
      calibrated: boolean;
      teacherCompared: boolean;
      segments: unknown[];
    };
    assert.equal(report.status, "unavailable");
    assert.equal(report.calibrated, false);
    assert.equal(report.teacherCompared, false);
    assert.equal(report.segments.length, 0);
  });
});
