import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { AddressInfo } from "node:net";
import { createApp } from "../../server/app";
import {
  lesson,
  manifest,
  grade,
  publicExercise,
  normalizeTranslation,
} from "../../server/modules/grammar/content";
import type {
  Exercise,
  Session,
  ResponseState,
} from "../../shared/grammar/types";
test("N2 content coverage, no duplicate prompts, valid answer/token permutations and private DTO", () => {
  assert.equal(manifest.lessons.length, 26);
  assert.equal(
    manifest.lessons.reduce((n, l) => n + l.groupCount, 0),
    141,
  );
  assert.equal(manifest.targetExercises, 4230);
  assert.equal(lesson.patterns.length, 5);
  const all = lesson.patterns.flatMap((p) => p.exercises);
  assert.equal(all.length, 150);
  assert.equal(new Set(all.map((q) => q.id)).size, 150);
  for (const p of lesson.patterns) {
    for (const mode of ["vi-ja", "ja-vi", "order"])
      assert.equal(p.exercises.filter((q) => q.mode === mode).length, 10);
    assert.equal(p.reviewStatus, "agent_reviewed");
  }
  assert.equal(new Set(all.map((q) => q.prompt)).size, 150);
  for (const q of all) {
    assert.ok(q.explanation.length > 15);
    const dto = publicExercise(q);
    for (const key of ["answers", "acceptedOrders", "explanation", "hint"])
      assert.ok(!(key in dto));
    if (q.mode === "order") {
      assert.equal(new Set(q.tokens.map((t) => t.id)).size, 4);
      for (const order of q.acceptedOrders) {
        assert.equal(grade(q, order), "correct");
        assert.equal(
          order
            .map(
              (id: string): string => q.tokens.find((t) => t.id === id)!.text,
            )
            .join(""),
          q.answers[0],
        );
      }
      assert.equal(grade(q, ["0", "0", "1", "2"]), "incorrect");
      assert.equal(grade(q, ["3", "2", "1", "0"]), "incorrect");
    } else {
      assert.equal(grade(q, q.answers[0]), "matched");
      assert.equal(
        grade(q, "Một bản dịch khác vẫn có thể đúng"),
        "needs_review",
      );
    }
  }
  assert.notEqual(
    normalizeTranslation("không làm"),
    normalizeTranslation("làm"),
  );
  assert.notEqual(normalizeTranslation("có"), normalizeTranslation("co"));
});
test("grammar ownership, resume, conflict, reveal, completion, XP and FSRS idempotency", async (t) => {
  const { app, db } = createApp(":memory:");
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((r) => server.once("listening", r));
  t.after(() => {
    server.close();
    db.close();
  });
  const base =
    "http://127.0.0.1:" + (server.address() as AddressInfo).port + "/api";
  async function request(
    path: string,
    method = "GET",
    body?: unknown,
    cookie = "",
  ) {
    const r = await fetch(base + path, {
      method,
      headers: { "Content-Type": "application/json", Cookie: cookie },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    return {
      status: r.status,
      data: await r.json(),
      cookie: r.headers.get("set-cookie")?.split(";")[0] || "",
    };
  }
  const a = await request("/auth/register", "POST", {
    name: "Grammar A",
    email: "grammar-a@example.test",
    password: "Strong-test-password!",
  });
  const b = await request("/auth/register", "POST", {
    name: "Grammar B",
    email: "grammar-b@example.test",
    password: "Strong-test-password!",
  });
  const call = (path: string, method = "GET", body?: unknown) =>
    request(path, method, body, a.cookie);
  assert.equal((await request("/grammar/courses/n2")).status, 401);
  const s = (await call("/grammar/patterns/sai/sessions", "POST"))
    .data as Session;
  assert.equal(s.questions.length, 30);
  assert.ok(!JSON.stringify(s).includes("acceptedOrders"));
  assert.ok(!JSON.stringify(s).includes("answers"));
  assert.equal(
    (await call("/grammar/patterns/sai/sessions", "POST")).data.id,
    s.id,
  );
  assert.equal(
    (await request("/grammar/sessions/" + s.id, "GET", undefined, b.cookie))
      .status,
    404,
  );
  assert.equal(
    (
      await request(
        "/grammar/sessions/" + s.id + "/responses/sai-vi-ja-01",
        "PUT",
        { version: 0, answer: "test", action: "save" },
        b.cookie,
      )
    ).status,
    404,
  );
  const path = "/grammar/sessions/" + s.id + "/responses/";
  const first = s.questions[0];
  const saved = await call(path + first.id, "PUT", {
    version: 0,
    answer: "Câu đang viết",
    action: "save",
  });
  assert.equal(saved.status, 200);
  assert.equal(
    (
      await call(path + first.id, "PUT", {
        version: 0,
        answer: "ghi đè",
        action: "save",
      })
    ).status,
    409,
  );
  assert.equal(
    (await call("/grammar/sessions/" + s.id)).data.responses[first.id].answer,
    "Câu đang viết",
  );
  const checked = await call(path + first.id, "PUT", {
    version: 1,
    answer: "Câu khác mẫu",
    action: "check",
  });
  assert.equal(checked.data.result, "needs_review");
  assert.equal(
    (await call("/grammar/sessions/" + s.id + "/complete", "POST")).status,
    422,
  );
  const exportBefore = await call("/export");
  assert.ok(
    !JSON.stringify(exportBefore.data.grammar).includes("acceptedOrders"),
  );
  assert.ok(
    !JSON.stringify(exportBefore.data.grammar).includes("sai-vi-ja-02"),
  );
  const source = lesson.patterns[0].exercises;
  for (const q of source) {
    let previous: ResponseState | undefined = (
      await call("/grammar/sessions/" + s.id)
    ).data.responses[q.id];
    const answer = q.mode === "order" ? q.acceptedOrders[0] : q.answers[0];
    const result = await call(path + q.id, "PUT", {
      version: previous?.version || 0,
      answer,
      action: "check",
    });
    assert.equal(result.status, 200, q.id);
  }
  assert.equal(
    (await call("/grammar/sessions/" + s.id + "/complete", "POST")).status,
    200,
  );
  assert.equal((await call("/grammar/courses/n2")).data.practiced, 1);
  const stats = await call("/stats");
  assert.equal(stats.data.todayUnique, 1);
  assert.equal(stats.data.xp, 10);
  const l1 = await call("/grammar/patterns/sai/srs", "POST"),
    l2 = await call("/grammar/patterns/sai/srs", "POST");
  assert.equal(l1.data.cardId, l2.data.cardId);
  assert.equal(l2.data.added, false);
  const cardId = l1.data.cardId;
  db.prepare("INSERT INTO reviews VALUES(?,?,?,?,?,?,?)").run(
    "grammar-review",
    "" +
      (
        db.prepare("SELECT user_id FROM cards WHERE id=?").get(cardId) as {
          user_id: string;
        }
      ).user_id,
    cardId,
    3,
    new Date().toISOString(),
    stats.data.today,
    "{}",
  );
  assert.equal((await call("/stats")).data.todayUnique, 1);
  let previous = (await call("/grammar/sessions/" + s.id)).data.responses[
    first.id
  ];
  await call(path + first.id, "PUT", {
    version: previous.version,
    answer: "",
    action: "save",
  });
  assert.equal((await call("/grammar/courses/n2")).data.practiced, 0);
  assert.ok(
    (
      db.prepare("SELECT count(*) n FROM grammar_response_history").get() as {
        n: number;
      }
    ).n > 0,
  );
  const second = (await call("/grammar/patterns/totan/sessions", "POST"))
    .data as Session;
  const q = second.questions[0];
  const revealed = await call(
    "/grammar/sessions/" + second.id + "/responses/" + q.id,
    "PUT",
    { version: 0, answer: "", action: "reveal" },
  );
  assert.equal(revealed.data.result, "revealed");
  assert.equal((await call("/stats")).data.xp, 10);
});
test("grammar migration, restart and backup restore preserve user data and content snapshots", async () => {
  const dir = mkdtempSync(join(tmpdir(), "kotoba-grammar-"));
  try {
    const path = join(dir, "db.sqlite");
    let { db } = createApp(path);
    db.prepare("INSERT INTO users VALUES(?,?,?,?,?,?)").run(
      "keep",
      "keep@example.test",
      "Keep",
      "hash",
      "{}",
      "2026-09-13",
    );
    db.close();
    ({ db } = createApp(path));
    assert.equal(
      (
        db.prepare("SELECT name FROM users WHERE id=?").get("keep") as {
          name: string;
        }
      ).name,
      "Keep",
    );
    assert.equal(
      (
        db
          .prepare("SELECT count(*) n FROM grammar_content_revisions")
          .get() as { n: number }
      ).n,
      5,
    );
    assert.equal(db.pragma("integrity_check", { simple: true }), "ok");
    const restoredPath = join(dir, "restored.sqlite");
    await db.backup(restoredPath);
    db.close();
    const restored = createApp(restoredPath).db;
    assert.equal(restored.pragma("integrity_check", { simple: true }), "ok");
    assert.equal(
      (
        restored.prepare("SELECT name FROM users WHERE id='keep'").get() as {
          name: string;
        }
      ).name,
      "Keep",
    );
    assert.equal(
      (
        restored
          .prepare("SELECT count(*) n FROM grammar_content_revisions")
          .get() as { n: number }
      ).n,
      5,
    );
    restored.close();
  } finally {
    rmSync(dir, { recursive: true });
  }
});
