import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import type { AddressInfo } from "node:net";
import { createApp } from "../server/app";
test("auth, ownership, import, FSRS, quiz grading and persistence invariants", async (t) => {
  const { app, db } = createApp(":memory:");
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api`;
  t.after(() => {
    server.close();
    db.close();
  });
  const call = async (
    path: string,
    method = "GET",
    body?: unknown,
    cookie = "",
    headers: Record<string, string> = {},
  ) => {
    const res = await fetch(base + path, {
      method,
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie,
        ...headers,
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    return {
      status: res.status,
      data: await res.json(),
      cookie: res.headers.get("set-cookie")?.split(";")[0] || "",
    };
  };
  assert.equal((await call("/decks")).status, 401);
  const a = await call("/auth/register", "POST", {
    email: "a@example.test",
    password: "Test-pass-12345",
    name: "Learner A",
  });
  assert.equal(a.status, 201);
  assert.ok(a.cookie);
  const b = await call("/auth/register", "POST", {
    email: "b@example.test",
    password: "Test-pass-12345",
    name: "Learner B",
  });
  assert.equal(b.status, 201);
  assert.equal(
    (
      await call("/auth/login", "POST", {
        email: "a@example.test",
        password: "incorrect",
      })
    ).status,
    401,
  );
  assert.equal(
    (
      await call(
        "/settings",
        "PUT",
        { dailyGoal: 10, level: "N5", retention: 0.9 },
        a.cookie,
        { Origin: "https://untrusted.test" },
      )
    ).status,
    403,
  );
  const created = await call(
    "/decks",
    "POST",
    {
      title: "Kanji riêng",
      kind: "kanji",
      level: "N5",
      notes: [{ term: "学校", reading: "がっこう", meaning: "Trường học" }],
    },
    a.cookie,
  );
  assert.equal(created.status, 201);
  const id = created.data.id;
  assert.equal(
    (await call(`/decks/${id}`, "GET", undefined, b.cookie)).status,
    404,
  );
  assert.equal(
    (await call(`/decks/${id}`, "DELETE", undefined, b.cookie)).status,
    404,
  );
  const before = await call("/stats", "GET", undefined, a.cookie);
  assert.equal(before.data.due, 1);
  assert.equal(before.data.totalReviews, 0);
  assert.equal(before.data.streak, 0);
  const queue = await call("/review", "GET", undefined, a.cookie);
  const card = queue.data[0];
  assert.equal(card.front, "学校");
  assert.equal(card.back, undefined);
  assert.equal(
    (
      await call(
        `/review/${card.id}`,
        "POST",
        { rating: 3, version: 0, requestId: randomUUID() },
        a.cookie,
      )
    ).status,
    409,
  );
  assert.equal(
    (await call(`/review/${card.id}/reveal`, "POST", { version: 0 }, b.cookie))
      .status,
    404,
  );
  const reveal = await call(
    `/review/${card.id}/reveal`,
    "POST",
    { version: 0 },
    a.cookie,
  );
  assert.equal(reveal.status, 200);
  assert.ok(reveal.data.back.includes("がっこう"));
  assert.equal(reveal.data.intervals.length, 4);
  const payload = { rating: 3, version: 0, requestId: randomUUID() };
  assert.equal(
    (await call(`/review/${card.id}`, "POST", payload, a.cookie)).status,
    200,
  );
  assert.equal(
    (await call(`/review/${card.id}`, "POST", payload, a.cookie)).data
      .duplicate,
    true,
  );
  assert.equal(
    (
      await call(
        `/review/${card.id}`,
        "POST",
        { ...payload, requestId: randomUUID() },
        a.cookie,
      )
    ).status,
    409,
  );
  const stats = await call("/stats", "GET", undefined, a.cookie);
  assert.equal(stats.data.totalReviews, 1);
  assert.equal(stats.data.streak, 1);
  assert.equal(stats.data.todayUnique, 1);
  const detail = await call(`/decks/${id}`, "GET", undefined, a.cookie);
  assert.equal(
    (
      await call(
        `/decks/${id}`,
        "PUT",
        { ...detail.data, title: "Đã sửa" },
        a.cookie,
      )
    ).status,
    200,
  );
  assert.equal(
    (await call(`/decks/${id}`, "PUT", detail.data, a.cookie)).status,
    409,
  );
  assert.equal(
    (db.prepare("SELECT version FROM cards WHERE id=?").get(card.id) as any)
      .version,
    1,
  );
  assert.equal(
    (
      await call(
        "/practice",
        "POST",
        { kind: "kanji", level: "N5", count: 10, deckId: id },
        a.cookie,
      )
    ).status,
    422,
  );
  const quiz = await call(
    "/practice",
    "POST",
    { kind: "kanji", level: "N2", count: 10 },
    a.cookie,
  );
  assert.equal(quiz.status, 200);
  assert.equal(quiz.data.questions.length, 2);
  assert.ok(
    quiz.data.questions.every(
      (q: any) =>
        q.answer === undefined &&
        q.explanation === undefined &&
        q.reading === undefined &&
        q.meaning === undefined,
    ),
  );
  assert.equal(
    (await call(`/practice/${quiz.data.id}`, "GET", undefined, b.cookie))
      .status,
    404,
  );
  const snapshot = JSON.parse(
    (
      db
        .prepare("SELECT questions FROM attempts WHERE id=?")
        .get(quiz.data.id) as any
    ).questions,
  );
  const answers = snapshot.map((q: any) => q.answer);
  const result = await call(
    `/practice/${quiz.data.id}/submit`,
    "POST",
    { answers },
    a.cookie,
  );
  assert.equal(result.data.score, 2);
  const again = await call(
    `/practice/${quiz.data.id}/submit`,
    "POST",
    { answers: [-1, -1] },
    a.cookie,
  );
  assert.equal(again.data.score, 2);
  const retry = await call(
    `/practice/${quiz.data.id}/retry`,
    "POST",
    {},
    a.cookie,
  );
  assert.equal(retry.data.questions.length, 2);
  assert.equal(retry.data.questions[0].answer, undefined);
  const exported = await call("/export", "GET", undefined, a.cookie);
  assert.equal(exported.data.profile.password, undefined);
  assert.equal(exported.data.sessions, undefined);
  assert.equal(exported.data.reviews.length, 1);
  assert.equal((await call("/auth/logout", "POST", {}, a.cookie)).status, 200);
  assert.equal((await call("/me", "GET", undefined, a.cookie)).status, 401);
});
