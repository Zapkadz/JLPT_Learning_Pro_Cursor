import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { AddressInfo } from "node:net";
import { createApp } from "../../server/app";
import {
  analyzePcmInt16Le,
  synthesizePcmInt16Le,
} from "../../shared/kaiwa/audioQuality";

test("silence PCM is not_assessable — never a pronunciation 0", () => {
  const pcm = synthesizePcmInt16Le(48000, () => 0);
  const r = analyzePcmInt16Le(pcm, { sampleRateHz: 48000 });
  assert.equal(r.verdict, "not_assessable");
  assert.ok(r.reasons.includes("silence"));
  assert.equal(r.pronunciationScore, null);
});

test("clipped sine is not_assessable for clipping", () => {
  const pcm = synthesizePcmInt16Le(48000, (i) =>
    Math.sin((2 * Math.PI * 440 * i) / 48000) > 0 ? 1 : -1,
  );
  const r = analyzePcmInt16Le(pcm, { sampleRateHz: 48000 });
  assert.equal(r.verdict, "not_assessable");
  assert.ok(r.reasons.includes("clipping"));
  assert.equal(r.pronunciationScore, null);
});

test("moderate speech-like PCM is assessable under provisional thresholds", () => {
  const pcm = synthesizePcmInt16Le(48000, (i) => {
    const env = 0.3 + 0.2 * Math.sin(i / 2000);
    return env * Math.sin((2 * Math.PI * 220 * i) / 48000);
  });
  const r = analyzePcmInt16Le(pcm, { sampleRateHz: 48000 });
  assert.equal(r.verdict, "assessable");
  assert.equal(r.pronunciationScore, null);
  assert.ok(r.messageVi.includes("không phải điểm phát âm"));
});

function sha(buf: Buffer) {
  return createHash("sha256").update(buf).digest("hex");
}

async function withServer(
  run: (base: string, cookie: string) => Promise<void>,
) {
  const dir = mkdtempSync(join(tmpdir(), "kaiwa-aq-"));
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
        email: `aq-${Date.now()}@example.test`,
        name: "AQ QA",
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

test("webm mic quality check returns unavailable decode — export still independent", async () => {
  await withServer(async (base, cookie) => {
    const created = await api(base, cookie, "/kaiwa/projects", {
      method: "POST",
      body: JSON.stringify({ title: "AQ" }),
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
    const webm = Buffer.concat([
      Buffer.from([0x1a, 0x45, 0xdf, 0xa3]),
      Buffer.from("webm"),
      Buffer.alloc(64, 1),
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
        durationMs: 1000,
        assemble: true,
      }),
    });

    const q = await api(
      base,
      cookie,
      `/kaiwa/attempts/${attempt.id}/audio-quality`,
      { method: "POST", body: "{}" },
    );
    assert.equal(q.status, 200);
    const report = (await q.json()) as {
      verdict: string;
      pronunciationScore: null;
      reasons: string[];
    };
    assert.equal(report.verdict, "unavailable");
    assert.equal(report.pronunciationScore, null);
    assert.ok(report.reasons.includes("decode_unavailable"));

    // Export must still work (ADR-014)
    const exp = await api(
      base,
      cookie,
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
  });
});
