import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { AddressInfo } from "node:net";
import { createApp } from "../../server/app";
import { resolveSpeechCapability } from "../../server/modules/kaiwa/speechCapability";

test("resolveSpeechCapability is not_configured without live adapter", () => {
  const cap = resolveSpeechCapability({
    KAIWA_ASR_API_KEY: "fake",
    AZURE_SPEECH_KEY: "fake",
    FFMPEG_PATH: "C:\\nonexistent\\ffmpeg.exe",
    KAIWA_FFMPEG_PATH: "",
    LOCALAPPDATA: "C:\\nonexistent-localappdata-kaiwa",
    KAIWA_SCRIPT_ALIGN_ENGINE: "whisper",
  });
  assert.equal(cap.transcription.status, "not_configured");
  assert.equal(cap.translation.status, "not_configured");
  assert.equal(cap.scriptAlign.status, "not_configured");
  assert.ok(cap.scriptAlign.messageVi.includes("SRT") || cap.scriptAlign.messageVi.includes("soạn tay"));
  assert.equal(cap.liveTestsAllowed, false);
  assert.equal(cap.credentialsPresent, true);
  assert.ok(cap.transcription.messageVi.includes("thủ công"));
});

async function withServer(
  run: (base: string, cookie: string) => Promise<void>,
) {
  const dir = mkdtempSync(join(tmpdir(), "kaiwa-speech-"));
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
        email: `speech-${Date.now()}@example.test`,
        name: "Speech QA",
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

test("speech capability API and auto routes stay honest without provider", async () => {
  await withServer(async (base, cookie) => {
    const capRes = await api(base, cookie, "/kaiwa/capabilities/speech");
    assert.equal(capRes.status, 200);
    const cap = (await capRes.json()) as {
      transcription: { status: string };
      scriptAlign: { status: string; messageVi: string };
      liveTestsAllowed: boolean;
    };
    assert.equal(cap.transcription.status, "not_configured");
    assert.equal(cap.liveTestsAllowed, false);
    assert.ok(cap.scriptAlign?.status, "scriptAlign capability present");
    if (cap.scriptAlign.status === "not_configured") {
      assert.ok(
        /SRT|soạn tay|thủ công|ffmpeg|Whisper/i.test(cap.scriptAlign.messageVi),
      );
    }

    const created = await api(base, cookie, "/kaiwa/projects", {
      method: "POST",
      body: JSON.stringify({ title: "Speech stub" }),
    });
    const project = (await created.json()) as { id: string };

    const tr = await api(
      base,
      cookie,
      `/kaiwa/projects/${project.id}/transcriptions`,
      { method: "POST", body: "{}" },
    );
    assert.equal(tr.status, 503);
    const trBody = (await tr.json()) as { code: string };
    assert.equal(trBody.code, "speech_not_configured");

    const tl = await api(
      base,
      cookie,
      `/kaiwa/projects/${project.id}/translations`,
      { method: "POST", body: "{}" },
    );
    assert.equal(tl.status, 503);
  });
});
