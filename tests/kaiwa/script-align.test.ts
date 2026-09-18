import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { AddressInfo } from "node:net";
import { createApp } from "../../server/app";
import { resolveSpeechCapability } from "../../server/modules/kaiwa/speechCapability";
import { buildFixtureSet } from "./fixtures/generate";

function minimalMp4(): Buffer {
  const set = buildFixtureSet();
  const short = set.find((f) => f.kind === "short");
  assert.ok(short);
  return short!.bytes;
}

async function withServer(
  run: (base: string, cookieA: string, cookieB: string) => Promise<void>,
  env: Record<string, string | undefined> = {},
) {
  const prev: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(env)) {
    prev[k] = process.env[k];
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  const dir = mkdtempSync(join(tmpdir(), "kaiwa-align-"));
  const { app, db } = createApp(join(dir, "t.sqlite"));
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((r) => server.once("listening", r));
  try {
    const { port } = server.address() as AddressInfo;
    const base = `http://127.0.0.1:${port}/api`;
    async function register(email: string) {
      const reg = await fetch(base + "/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://127.0.0.1:5173",
        },
        body: JSON.stringify({
          email,
          name: "Align QA",
          password: "Test-only-password-2026",
        }),
      });
      return reg.headers.getSetCookie?.()[0]?.split(";")[0] || "";
    }
    const cookieA = await register(`align-a-${Date.now()}@example.test`);
    const cookieB = await register(`align-b-${Date.now()}@example.test`);
    await run(base, cookieA, cookieB);
  } finally {
    await new Promise<void>((r) => server.close(() => r()));
    db.close();
    rmSync(dir, { recursive: true, force: true });
    for (const [k, v] of Object.entries(prev)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
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

test("scriptAlign capability: mock ready; without mock+ffmpeg not_configured path exists", () => {
  const mock = resolveSpeechCapability({
    ...process.env,
    KAIWA_SCRIPT_ALIGN_ENGINE: "mock",
  });
  assert.equal(mock.scriptAlign.status, "ready");
  assert.ok(mock.scriptAlign.engine);

  const off = resolveSpeechCapability({
    FFMPEG_PATH: "",
    KAIWA_FFMPEG_PATH: "",
    LOCALAPPDATA: "C:\\nonexistent-localappdata-kaiwa",
    KAIWA_SCRIPT_ALIGN_ENGINE: "stable_ts",
  });
  assert.equal(off.scriptAlign.status, "not_configured");
});

test("scriptAlign engine pref defaults to stable_ts (ADR-021a)", async () => {
  const { resolveScriptAlignEnginePref } = await import(
    "../../server/modules/kaiwa/speechCapability"
  );
  assert.equal(resolveScriptAlignEnginePref({}), "stable_ts");
  assert.equal(
    resolveScriptAlignEnginePref({ KAIWA_SCRIPT_ALIGN_ENGINE: "qwen_fa" }),
    "qwen_fa",
  );
  assert.equal(
    resolveScriptAlignEnginePref({ KAIWA_SCRIPT_ALIGN_ENGINE: "whisper" }),
    "whisper",
  );
});

test("script-align mock writes draft with source_json; stale version 409; ownership 404", async () => {
  await withServer(
    async (base, cookieA, cookieB) => {
      const data = minimalMp4();
      const reserved = await api(base, cookieA, "/kaiwa/assets/reservations", {
        method: "POST",
        body: JSON.stringify({ kind: "source", bytes: data.length, ext: "mp4" }),
      });
      const asset = (await reserved.json()) as { id: string };
      await api(base, cookieA, `/kaiwa/assets/${asset.id}/content`, {
        method: "PUT",
        headers: { "Content-Type": "video/mp4" },
        body: new Uint8Array(data),
      });

      const created = await api(base, cookieA, "/kaiwa/projects", {
        method: "POST",
        body: JSON.stringify({ title: "Align proj", sourceAssetId: asset.id }),
      });
      const project = (await created.json()) as { id: string };
      await api(base, cookieA, `/kaiwa/projects/${project.id}/prepare-media`, {
        method: "POST",
        body: "{}",
      });

      const align = await api(
        base,
        cookieA,
        `/kaiwa/projects/${project.id}/script-align`,
        {
          method: "POST",
          body: JSON.stringify({
            expectedRevisionVersion: 1,
            text: "こんにちは。\n今日はいい天気ですね。",
          }),
        },
      );
      const alignText = await align.text();
      assert.equal(align.status, 201, alignText);
      const body = JSON.parse(alignText) as {
        jobId: string;
        alignEngine: string;
        revision: {
          version: number;
          payload: { segments: { ja: string; timingUncertain?: boolean }[] };
          source_json: { source?: string; alignEngine?: string };
        };
      };
      assert.equal(body.alignEngine, "mock_equal_slots");
      assert.equal(body.revision.source_json.source, "script_align");
      assert.equal(body.revision.payload.segments.length, 2);
      assert.equal(body.revision.payload.segments[0].ja, "こんにちは。");
      assert.equal(body.revision.payload.segments[0].timingUncertain, true);

      const stale = await api(
        base,
        cookieA,
        `/kaiwa/projects/${project.id}/script-align`,
        {
          method: "POST",
          body: JSON.stringify({
            expectedRevisionVersion: 1,
            text: "古い",
          }),
        },
      );
      assert.equal(stale.status, 409);

      const peer = await api(
        base,
        cookieB,
        `/kaiwa/projects/${project.id}/script-align`,
        {
          method: "POST",
          body: JSON.stringify({
            expectedRevisionVersion: 99,
            text: "こんにちは。",
          }),
        },
      );
      assert.ok(peer.status === 404 || peer.status === 403);
    },
    { KAIWA_SCRIPT_ALIGN_ENGINE: "mock" },
  );
});

test("script-align returns 503 when not_configured", async () => {
  await withServer(
    async (base, cookieA) => {
      const created = await api(base, cookieA, "/kaiwa/projects", {
        method: "POST",
        body: JSON.stringify({ title: "No align" }),
      });
      const project = (await created.json()) as { id: string };
      const res = await api(
        base,
        cookieA,
        `/kaiwa/projects/${project.id}/script-align`,
        {
          method: "POST",
          body: JSON.stringify({
            expectedRevisionVersion: 1,
            text: "こんにちは。",
          }),
        },
      );
      assert.equal(res.status, 503);
      const j = (await res.json()) as { error: string };
      assert.ok(j.error);
    },
    {
      KAIWA_SCRIPT_ALIGN_ENGINE: "whisper",
      FFMPEG_PATH: "C:\\nonexistent\\ffmpeg.exe",
      KAIWA_FFMPEG_PATH: "",
      LOCALAPPDATA: "C:\\nonexistent-localappdata-kaiwa",
    },
  );
});
