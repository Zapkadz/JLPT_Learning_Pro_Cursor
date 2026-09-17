import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { AddressInfo } from "node:net";
import { createApp } from "../../server/app";
import {
  parseProviderPronunciationPayload,
  notConfiguredAttemptReport,
  timeoutAssessment,
} from "../../shared/kaiwa/assessment";
import { resolveSpeechCapability } from "../../server/modules/kaiwa/speechCapability";

test("ASR confidence is never copied into accuracy", () => {
  const parsed = parseProviderPronunciationPayload({
    providerId: "fixture",
    modelVersion: "t",
    Segments: [
      {
        Id: "s1",
        RecognitionConfidence: 0.99,
        // no AccuracyScore — must stay null, not 0.99
      },
    ],
  });
  assert.equal(parsed.ok, true);
  assert.equal(parsed.segments.length, 1);
  assert.equal(parsed.segments[0].asrConfidence, 0.99);
  assert.equal(parsed.segments[0].metrics.accuracy, null);
  assert.equal(parsed.segments[0].phonemeErrors.length, 0);
});

test("ProsodyScore on ja-JP payload is rejected", () => {
  const parsed = parseProviderPronunciationPayload({
    ProsodyScore: 80,
    Segments: [{ Id: "s1", AccuracyScore: 70 }],
  });
  assert.equal(parsed.ok, false);
  assert.equal(parsed.reason, "prosody_locale_unsupported");
});

test("budget_exhausted when segment list exceeds max", () => {
  const segments = Array.from({ length: 5 }, (_, i) => ({
    Id: `s${i}`,
    AccuracyScore: 50,
  }));
  const parsed = parseProviderPronunciationPayload(
    { Segments: segments },
    { budget: { maxSegments: 3 } },
  );
  assert.equal(parsed.ok, false);
  assert.equal(parsed.reason, "budget_exhausted");
});

test("empty phonemes do not invent mora errors", () => {
  const parsed = parseProviderPronunciationPayload({
    Segments: [
      { Id: "s1", AccuracyScore: 60, Phonemes: [] },
      { Id: "s2", AccuracyScore: 55, Phonemes: null },
    ],
  });
  assert.equal(parsed.ok, true);
  for (const s of parsed.segments) {
    assert.equal(s.phonemeErrors.length, 0);
    assert.equal(s.metrics.accuracy, s.segmentId === "s1" ? 60 : 55);
  }
});

test("timeout assessment is failed without invented scores", () => {
  const r = timeoutAssessment("a1");
  assert.equal(r.status, "failed");
  assert.equal(r.reason, "provider_timeout");
  assert.equal(r.liveProviderUsed, false);
  assert.equal(r.segments.length, 0);
});

test("notConfigured respects data_gap vs provider_not_wired", () => {
  const r = notConfiguredAttemptReport("a1", ["x", "y"], [
    {
      segmentId: "x",
      status: "aligned",
      startMs: 0,
      endMs: 500,
    },
    {
      segmentId: "y",
      status: "data_gap",
      startMs: 4000,
      endMs: 5000,
    },
  ]);
  assert.equal(r.status, "unavailable");
  assert.equal(r.reason, "provider_not_wired");
  assert.equal(r.segments[0].reason, "provider_not_wired");
  assert.equal(r.segments[1].status, "not_assessable");
  assert.equal(r.segments[1].reason, "data_gap");
  assert.equal(r.segments[0].metrics.accuracy, null);
});

test("speech capability includes pronunciation not_configured", () => {
  const cap = resolveSpeechCapability({});
  assert.equal(cap.pronunciation.status, "not_configured");
  assert.equal(cap.pronunciation.prosodySupportedForJaJp, false);
});

async function withServer(
  run: (base: string, cookie: string) => Promise<void>,
) {
  const dir = mkdtempSync(join(tmpdir(), "kaiwa-pron-"));
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
        email: `pron-${Date.now()}@example.test`,
        name: "Pron QA",
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

test("POST pronunciation returns unavailable stub; never invents scores", async () => {
  await withServer(async (base, cookie) => {
    const created = await api(base, cookie, "/kaiwa/projects", {
      method: "POST",
      body: JSON.stringify({ title: "Pron stub" }),
    });
    const project = (await created.json()) as { id: string };

    await api(base, cookie, `/kaiwa/projects/${project.id}/draft`, {
      method: "PUT",
      body: JSON.stringify({
        expectedRevisionVersion: 1,
        payload: {
          segments: [
            { id: "a", startMs: 0, endMs: 800, ja: "こんにちは" },
            { id: "b", startMs: 900, endMs: 1600, ja: "元気ですか" },
          ],
        },
      }),
    });

    const start = await api(base, cookie, `/kaiwa/projects/${project.id}/start-practice`, {
      method: "POST",
      body: JSON.stringify({ publish: true, expectedRevisionVersion: 1 }),
    });
    assert.equal(start.status, 201);
    const attempt = (await start.json()) as { id: string };

    const hash = createHash("sha256").update("pron-mic").digest("hex");
    await api(base, cookie, `/kaiwa/attempts/${attempt.id}/chunks`, {
      method: "POST",
      body: JSON.stringify({
        index: 0,
        byteLength: 8,
        sha256: hash,
        contentBase64: Buffer.from("pron-mic").toString("base64"),
      }),
    });
    await api(base, cookie, `/kaiwa/attempts/${attempt.id}/finalize`, {
      method: "POST",
      body: JSON.stringify({
        completion: "completed",
        durationMs: 2000,
        chunkCount: 1,
      }),
    });

    await api(base, cookie, `/kaiwa/attempts/${attempt.id}/alignment`, {
      method: "POST",
      body: "{}",
    });

    const pron = await api(
      base,
      cookie,
      `/kaiwa/attempts/${attempt.id}/pronunciation`,
      { method: "POST", body: "{}" },
    );
    assert.equal(pron.status, 200);
    const report = (await pron.json()) as {
      status: string;
      liveProviderUsed: boolean;
      segments: Array<{
        metrics: { accuracy: number | null };
        asrConfidence: number | null;
        phonemeErrors: unknown[];
      }>;
      messageVi: string;
    };
    assert.equal(report.status, "unavailable");
    assert.equal(report.liveProviderUsed, false);
    assert.equal(report.segments.length, 2);
    for (const s of report.segments) {
      assert.equal(s.metrics.accuracy, null);
      assert.equal(s.asrConfidence, null);
      assert.equal(s.phonemeErrors.length, 0);
    }
    assert.ok(report.messageVi.includes("Không gán điểm giả"));

    const again = await api(
      base,
      cookie,
      `/kaiwa/attempts/${attempt.id}/pronunciation`,
    );
    assert.equal(again.status, 200);
  });
});
