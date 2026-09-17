import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { AddressInfo } from "node:net";
import { createApp } from "../../server/app";
import {
  aggregateAttemptAssessment,
  canReuseAssessment,
  assessmentFingerprint,
  ASSESSMENT_ENGINE,
} from "../../shared/kaiwa/assessmentAggregate";
import { RUBRIC_VERSION } from "../../shared/kaiwa/assessment";

test("aggregate keeps overallScore null and exposes coverage", () => {
  const a = aggregateAttemptAssessment({
    attemptId: "att1",
    quality: null,
    alignment: {
      engine: "kaiwa-align-v1",
      attemptDurationMs: 2000,
      completion: "completed",
      tailMissing: false,
      offsetMs: 0,
      segments: [
        {
          segmentId: "s1",
          alignedStartMs: 0,
          alignedEndMs: 800,
          padBeforeMs: 80,
          padAfterMs: 80,
          status: "aligned",
          reason: null,
          listen: {
            referenceStartMs: 0,
            referenceEndMs: 800,
            learnerStartMs: 0,
            learnerEndMs: 800,
          },
          phonemeClaimsAllowed: false,
        },
        {
          segmentId: "s2",
          alignedStartMs: 1500,
          alignedEndMs: 2000,
          padBeforeMs: 0,
          padAfterMs: 0,
          status: "data_gap",
          reason: "beyond_duration",
          listen: {
            referenceStartMs: 1500,
            referenceEndMs: 2000,
            learnerStartMs: 1500,
            learnerEndMs: 2000,
          },
          phonemeClaimsAllowed: false,
        },
      ],
      coverage: {
        plannedMs: 1600,
        alignedMs: 800,
        missingSpeechMs: 0,
        dataGapMs: 500,
        uncertainCount: 0,
      },
      messageVi: "ok",
    },
    pronunciation: {
      engine: "kaiwa-pronunciation-v1-stub",
      attemptId: "att1",
      status: "unavailable",
      reason: "provider_not_wired",
      rubricVersion: RUBRIC_VERSION,
      locale: "ja-JP",
      liveProviderUsed: false,
      budget: { maxSegments: 200, maxWallMs: 60000, usedSegments: 2 },
      segments: [
        {
          segmentId: "s1",
          status: "unavailable",
          reason: "provider_not_wired",
          provider: null,
          metrics: {
            accuracy: null,
            fluency: null,
            completeness: null,
            coverage: null,
            timingDriftMs: null,
            f0ContourScore: null,
          },
          asrConfidence: null,
          evidence: null,
          phonemeErrors: [],
          rubricVersion: RUBRIC_VERSION,
        },
        {
          segmentId: "s2",
          status: "not_assessable",
          reason: "data_gap",
          provider: null,
          metrics: {
            accuracy: null,
            fluency: null,
            completeness: null,
            coverage: null,
            timingDriftMs: null,
            f0ContourScore: null,
          },
          asrConfidence: null,
          evidence: null,
          phonemeErrors: [],
          rubricVersion: RUBRIC_VERSION,
        },
      ],
      messageVi: "stub",
    },
    prosody: null,
    segmentIds: ["s1", "s2"],
  });

  assert.equal(a.overallScore, null);
  assert.equal(a.charged, false);
  assert.equal(a.engine, ASSESSMENT_ENGINE);
  assert.equal(a.coverage.plannedSegments, 2);
  assert.equal(a.segments[1].status, "not_assessable");
  assert.equal(a.segments[1].reason, "data_gap");
  assert.equal(a.segments[0].pronunciation.accuracy, null);
  assert.ok(a.priorities.length <= 3);
});

test("canReuseAssessment rejects different rubric version", () => {
  const base = aggregateAttemptAssessment({
    attemptId: "x",
    quality: null,
    alignment: null,
    pronunciation: null,
    prosody: null,
    segmentIds: [],
  });
  assert.equal(
    canReuseAssessment(base, base.fingerprint, base.rubricVersion),
    true,
  );
  assert.equal(
    canReuseAssessment(base, base.fingerprint, "other-rubric"),
    false,
  );
  assert.equal(
    canReuseAssessment(base, "other-fp", base.rubricVersion),
    false,
  );
});

test("fingerprint changes when layer inputs change", () => {
  const a = assessmentFingerprint(RUBRIC_VERSION, { quality: null });
  const b = assessmentFingerprint(RUBRIC_VERSION, {
    quality: { verdict: "assessable" },
  });
  assert.notEqual(a, b);
});

async function withServer(
  run: (base: string, cookie: string) => Promise<void>,
) {
  const dir = mkdtempSync(join(tmpdir(), "kaiwa-assess-"));
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
        email: `assess-${Date.now()}@example.test`,
        name: "Assess QA",
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

test("POST assessment is idempotent (reused) and never charges", async () => {
  await withServer(async (base, cookie) => {
    const created = await api(base, cookie, "/kaiwa/projects", {
      method: "POST",
      body: JSON.stringify({ title: "Assess agg" }),
    });
    const project = (await created.json()) as { id: string };
    await api(base, cookie, `/kaiwa/projects/${project.id}/draft`, {
      method: "PUT",
      body: JSON.stringify({
        expectedRevisionVersion: 1,
        payload: {
          segments: [
            { id: "a", startMs: 0, endMs: 500, ja: "はい" },
            { id: "b", startMs: 600, endMs: 1200, ja: "いいえ" },
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
    const buf = Buffer.from("assess-mic");
    const hash = createHash("sha256").update(buf).digest("hex");
    await api(base, cookie, `/kaiwa/attempts/${attempt.id}/chunks`, {
      method: "POST",
      body: JSON.stringify({
        index: 0,
        byteLength: buf.length,
        sha256: hash,
        contentBase64: buf.toString("base64"),
      }),
    });
    await api(base, cookie, `/kaiwa/attempts/${attempt.id}/finalize`, {
      method: "POST",
      body: JSON.stringify({
        completion: "completed",
        durationMs: 1500,
        chunkCount: 1,
      }),
    });

    const first = await api(
      base,
      cookie,
      `/kaiwa/attempts/${attempt.id}/assessment`,
      { method: "POST", body: "{}" },
    );
    assert.equal(first.status, 201);
    const r1 = (await first.json()) as {
      fingerprint: string;
      charged: boolean;
      overallScore: number | null;
      reused: boolean;
      rubricVersion: string;
    };
    assert.equal(r1.charged, false);
    assert.equal(r1.overallScore, null);
    assert.equal(r1.reused, false);

    const second = await api(
      base,
      cookie,
      `/kaiwa/attempts/${attempt.id}/assessment`,
      { method: "POST", body: "{}" },
    );
    assert.equal(second.status, 200);
    const r2 = (await second.json()) as {
      fingerprint: string;
      reused: boolean;
      charged: boolean;
    };
    assert.equal(r2.reused, true);
    assert.equal(r2.fingerprint, r1.fingerprint);
    assert.equal(r2.charged, false);

    const otherRubric = await api(
      base,
      cookie,
      `/kaiwa/attempts/${attempt.id}/assessment`,
      {
        method: "POST",
        body: JSON.stringify({ rubricVersion: "kaiwa-ja-rubric-draft-002" }),
      },
    );
    assert.equal(otherRubric.status, 201);
    const r3 = (await otherRubric.json()) as {
      rubricVersion: string;
      reused: boolean;
    };
    assert.equal(r3.rubricVersion, "kaiwa-ja-rubric-draft-002");
    assert.equal(r3.reused, false);
  });
});
