import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
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
  getLesson,
  lessonsById,
  allPatterns,
  isLessonPublished,
} from "../../server/modules/grammar/content";
import type {
  Exercise,
  Session,
  ResponseState,
} from "../../shared/grammar/types";
import { patternSchema } from "../../shared/grammar/types";

const inventory = JSON.parse(
  readFileSync(
    new URL("../../content/grammar/n2/inventory.json", import.meta.url),
    "utf8",
  ),
) as {
  targetGroups: number;
  groups: {
    lessonId: string;
    lessonNumber: number;
    groupId: string;
    ordinal: number;
    canonicalPattern: string | null;
    matchStatus: string;
    contentStatus: string;
    reviewStatus?: string;
    sourceUrls: string[];
  }[];
};

test("N2 canonical inventory has 141 unique group IDs and matches manifest", () => {
  assert.equal(inventory.targetGroups, 141);
  assert.equal(inventory.groups.length, 141);
  assert.equal(new Set(inventory.groups.map((g) => g.groupId)).size, 141);
  assert.equal(
    inventory.groups.reduce((n, g) => {
      const lesson = manifest.lessons.find((l) => l.id === g.lessonId);
      assert.ok(lesson, g.lessonId);
      assert.equal(g.lessonNumber, lesson.number);
      return n + 1;
    }, 0),
    141,
  );
  for (const l of manifest.lessons) {
    const rows = inventory.groups.filter((g) => g.lessonId === l.id);
    assert.equal(rows.length, l.groupCount, l.id);
    assert.equal(
      new Set(rows.map((g) => g.ordinal)).size,
      l.groupCount,
      l.id + " ordinals",
    );
  }
  const l1Ids = ["sai", "saishite", "totan", "omouto", "kanai"];
  assert.deepEqual(
    inventory.groups
      .filter((g) => g.lessonId === "lesson-01")
      .map((g) => g.groupId)
      .sort(),
    [...l1Ids].sort(),
  );
  assert.deepEqual(
    lesson.patterns.map((p) => p.id).sort(),
    [...l1Ids].sort(),
  );
  const l1 = inventory.groups.filter((g) => g.lessonId === "lesson-01");
  for (const g of l1) {
    assert.ok(g.sourceUrls.length >= 1, g.groupId + " sourceUrls");
    assert.equal(g.matchStatus, "full-match", g.groupId);
  }
  assert.equal(
    l1.find((g) => g.groupId === "saishite")!.sourceUrls.length,
    2,
  );
  const mappedL2to5 = inventory.groups.filter(
    (g) => g.lessonNumber >= 2 && g.lessonNumber <= 5,
  );
  assert.equal(mappedL2to5.length, 21);
  for (const g of mappedL2to5) {
    assert.ok(g.canonicalPattern, g.groupId);
    assert.ok(g.sourceUrls.length >= 1, g.groupId + " sourceUrls");
    assert.ok(
      g.matchStatus === "full-match" || g.matchStatus === "partial-match",
      g.groupId,
    );
    assert.equal(g.contentStatus, "imported", g.groupId);
    assert.equal(g.reviewStatus, "agent_reviewed", g.groupId);
  }
  const mappedL6to10 = inventory.groups.filter(
    (g) => g.lessonNumber >= 6 && g.lessonNumber <= 10,
  );
  assert.equal(mappedL6to10.length, 24);
  for (const g of mappedL6to10) {
    assert.ok(g.canonicalPattern, g.groupId);
    assert.ok(g.sourceUrls.length >= 1, g.groupId + " sourceUrls");
    assert.equal(g.matchStatus, "full-match", g.groupId);
    assert.equal(g.contentStatus, "imported", g.groupId);
    assert.equal(g.reviewStatus, "agent_reviewed", g.groupId);
  }
  const mappedL11to15 = inventory.groups.filter(
    (g) => g.lessonNumber >= 11 && g.lessonNumber <= 15,
  );
  assert.equal(mappedL11to15.length, 27);
  for (const g of mappedL11to15) {
    assert.ok(g.canonicalPattern, g.groupId);
    assert.ok(g.sourceUrls.length >= 1, g.groupId + " sourceUrls");
    assert.ok(
      g.matchStatus === "full-match" || g.matchStatus === "partial-match",
      g.groupId,
    );
    assert.equal(g.contentStatus, "imported", g.groupId);
    assert.equal(g.reviewStatus, "agent_reviewed", g.groupId);
  }
  const mappedL16to20 = inventory.groups.filter(
    (g) => g.lessonNumber >= 16 && g.lessonNumber <= 20,
  );
  assert.equal(mappedL16to20.length, 28);
  for (const g of mappedL16to20) {
    assert.ok(g.canonicalPattern, g.groupId);
    assert.ok(g.sourceUrls.length >= 1, g.groupId + " sourceUrls");
    assert.ok(
      g.matchStatus === "full-match" || g.matchStatus === "partial-match",
      g.groupId,
    );
    assert.equal(g.contentStatus, "imported", g.groupId);
    assert.equal(g.reviewStatus, "agent_reviewed", g.groupId);
  }
  const mappedL21to26 = inventory.groups.filter(
    (g) => g.lessonNumber >= 21 && g.lessonNumber <= 26,
  );
  assert.equal(mappedL21to26.length, 36);
  for (const g of mappedL21to26) {
    assert.ok(g.canonicalPattern, g.groupId);
    assert.ok(g.sourceUrls.length >= 1, g.groupId + " sourceUrls");
    assert.ok(
      g.matchStatus === "full-match" || g.matchStatus === "partial-match",
      g.groupId,
    );
    assert.equal(g.contentStatus, "not-imported", g.groupId);
  }
  assert.equal(
    inventory.groups.filter(
      (g) =>
        g.canonicalPattern &&
        g.sourceUrls.length >= 1 &&
        (g.matchStatus === "full-match" || g.matchStatus === "partial-match"),
    ).length,
    141,
  );
  assert.equal(
    inventory.groups.filter((g) => g.matchStatus === "needs-review").length,
    0,
  );
});

test("N2 multi-lesson loader loads published content only", () => {
  assert.equal(lessonsById.size, 20);
  assert.equal(getLesson("lesson-01")?.id, "lesson-01");
  assert.equal(getLesson("lesson-02")?.id, "lesson-02");
  assert.equal(getLesson("lesson-10")?.id, "lesson-10");
  assert.equal(getLesson("lesson-15")?.id, "lesson-15");
  assert.equal(getLesson("lesson-20")?.id, "lesson-20");
  assert.equal(getLesson("lesson-21"), undefined);
  assert.equal(isLessonPublished("lesson-01"), true);
  assert.equal(isLessonPublished("lesson-02"), true);
  assert.equal(isLessonPublished("lesson-10"), true);
  assert.equal(isLessonPublished("lesson-15"), true);
  assert.equal(isLessonPublished("lesson-20"), true);
  assert.equal(isLessonPublished("lesson-21"), false);
  assert.equal(allPatterns().length, 105);
  assert.ok(allPatterns().some((p) => p.id === "sai"));
  assert.ok(allPatterns().some((p) => p.id === "l02-g01"));
  assert.ok(allPatterns().some((p) => p.id === "l05-g04"));
  assert.ok(allPatterns().some((p) => p.id === "l06-g01"));
  assert.ok(allPatterns().some((p) => p.id === "l10-g04"));
  assert.ok(allPatterns().some((p) => p.id === "l11-g01"));
  assert.ok(allPatterns().some((p) => p.id === "l15-g06"));
  assert.ok(allPatterns().some((p) => p.id === "l16-g01"));
  assert.ok(allPatterns().some((p) => p.id === "l20-g06"));
  for (const entry of manifest.lessons) {
    if (entry.published) assert.ok(getLesson(entry.id), entry.id);
    else assert.equal(getLesson(entry.id), undefined, entry.id);
  }
});

test("N2 additive metadata is optional and public DTO still strips private fields", () => {
  for (const p of lesson.patterns) {
    assert.ok(Array.isArray(p.variants));
    assert.ok(Array.isArray(p.source.urls));
  }
  const sample = lesson.patterns[0]!;
  const enriched = patternSchema.parse({
    ...JSON.parse(JSON.stringify(sample)),
    variants: ["際に", "際は", "ご際"],
    source: {
      ...sample.source,
      urls: [
        "https://www.tiengnhatdongian.com/ngu-phap-n3-n2-sai-ni-khi-luc-trong-truong-hop-nhan-dip/",
      ],
    },
    exercises: sample.exercises.map((q, i) =>
      i === 0
        ? {
            ...q,
            origin: "authored",
            sourceNote: "Lesson 1 pilot authored item",
          }
        : q,
    ),
  });
  assert.ok(enriched.variants.includes("ご際"));
  assert.equal(enriched.source.urls.length, 1);
  assert.equal(enriched.exercises[0]!.origin, "authored");
  assert.equal(
    enriched.exercises[0]!.sourceNote,
    "Lesson 1 pilot authored item",
  );
  const dto = publicExercise(enriched.exercises[0]!);
  for (const key of [
    "answers",
    "acceptedOrders",
    "explanation",
    "hint",
    "origin",
    "sourceNote",
  ])
    assert.ok(!(key in dto), key);
  assert.deepEqual(Object.keys(dto).sort(), ["id", "mode", "prompt"]);
});

function normalizeQaText(s: string): string {
  return s.normalize("NFKC").replace(/\s+/g, "").toLowerCase();
}

test("N2 Lesson 1 golden template validators (examples, 10/10/10, origin, hints)", () => {
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
    assert.ok(p.examples.length >= 3, p.id + " examples");
    assert.ok(p.variants.length >= 1, p.id + " variants");
    assert.ok(p.source.urls.length >= 1, p.id + " source.urls");
    assert.equal(p.revision, 5, p.id + " revision");
    const practice = new Set([
      ...p.exercises.map((q) => q.prompt),
      ...p.exercises.flatMap((q) => q.answers),
    ]);
    for (const ex of p.examples) {
      assert.ok(!practice.has(ex.ja), p.id + " example overlaps practice JA");
      assert.ok(!practice.has(ex.vi), p.id + " example overlaps practice VI");
      assert.equal(ex.ruby.map((t) => t.text).join(""), ex.ja);
    }
  }
  assert.equal(lesson.revision, 5);
  assert.equal(new Set(all.map((q) => q.prompt)).size, 150);
  for (const q of all) {
    assert.equal(q.origin, "authored", q.id + " origin");
    assert.ok(q.sourceNote && q.sourceNote.length >= 1, q.id + " sourceNote");
    assert.ok(q.hint.trim().length >= 1, q.id + " hint");
    assert.ok(q.explanation.length > 15);
    const hintNorm = normalizeQaText(q.hint);
    for (const answer of q.answers) {
      const answerNorm = normalizeQaText(answer);
      assert.notEqual(hintNorm, answerNorm, q.id + " hint equals answer");
      assert.ok(
        !answerNorm.includes(hintNorm) || hintNorm.length < 8,
        q.id + " hint embeds full answer",
      );
      assert.ok(
        !hintNorm.includes(answerNorm) || answerNorm.length < 4,
        q.id + " hint contains full answer",
      );
    }
    const dto = publicExercise(q);
    for (const key of [
      "answers",
      "acceptedOrders",
      "explanation",
      "hint",
      "origin",
      "sourceNote",
    ])
      assert.ok(!(key in dto), key);
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

test("N2 Lessons 2–20 published groups meet golden DoD (10/10/10, origin, examples)", () => {
  const batch = [
    "lesson-02",
    "lesson-03",
    "lesson-04",
    "lesson-05",
    "lesson-06",
    "lesson-07",
    "lesson-08",
    "lesson-09",
    "lesson-10",
    "lesson-11",
    "lesson-12",
    "lesson-13",
    "lesson-14",
    "lesson-15",
    "lesson-16",
    "lesson-17",
    "lesson-18",
    "lesson-19",
    "lesson-20",
  ].map((id) => getLesson(id)!);
  assert.equal(batch.length, 19);
  const all = batch.flatMap((l) => l.patterns.flatMap((p) => p.exercises));
  assert.equal(all.length, 3000);
  assert.equal(new Set(all.map((q) => q.id)).size, 3000);
  assert.equal(new Set(all.map((q) => q.prompt)).size, 3000);
  for (const l of batch) {
    assert.equal(l.revision, 1, l.id);
    for (const p of l.patterns) {
      for (const mode of ["vi-ja", "ja-vi", "order"])
        assert.equal(
          p.exercises.filter((q) => q.mode === mode).length,
          10,
          p.id + " " + mode,
        );
      assert.equal(p.reviewStatus, "agent_reviewed");
      assert.ok(p.examples.length >= 3, p.id);
      assert.ok(p.variants.length >= 1, p.id);
      assert.ok(p.source.urls.length >= 1, p.id);
      assert.equal(p.revision, 1, p.id);
      const practice = new Set([
        ...p.exercises.map((q) => q.prompt),
        ...p.exercises.flatMap((q) => q.answers),
      ]);
      for (const ex of p.examples) {
        assert.ok(!practice.has(ex.ja), p.id + " example JA overlap");
        assert.ok(!practice.has(ex.vi), p.id + " example VI overlap");
        assert.equal(ex.ruby.map((t) => t.text).join(""), ex.ja);
      }
    }
  }
  for (const q of all) {
    assert.equal(q.origin, "authored", q.id);
    assert.ok(q.sourceNote && q.sourceNote.length >= 1, q.id);
    assert.ok(q.explanation.length > 15, q.id);
    const hintNorm = normalizeQaText(q.hint);
    for (const answer of q.answers) {
      const answerNorm = normalizeQaText(answer);
      assert.notEqual(hintNorm, answerNorm, q.id);
      assert.ok(
        !hintNorm.includes(answerNorm) || answerNorm.length < 4,
        q.id + " hint contains answer",
      );
    }
    if (q.mode === "order") {
      assert.equal(grade(q, q.acceptedOrders[0]!), "correct", q.id);
    } else {
      assert.equal(grade(q, q.answers[0]!), "matched", q.id);
    }
  }
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
  const course = await call("/grammar/courses/n2");
  assert.equal(course.status, 200);
  assert.equal(course.data.publishedGroups, 105);
  assert.equal(course.data.publishedExercises, 3150);
  assert.equal(course.data.targetGroups, 141);
  assert.equal(course.data.progressDenominator, 141);
  assert.equal(course.data.progressDenominator, course.data.targetGroups);
  assert.notEqual(course.data.progressDenominator, course.data.publishedGroups);
  assert.equal(course.data.read, 0);
  assert.equal(course.data.practiced, 0);
  const markRead = await call("/grammar/patterns/sai/progress", "PUT");
  assert.equal(markRead.status, 200);
  assert.equal((await call("/grammar/courses/n2")).data.read, 1);
  assert.equal((await call("/stats")).data.xp, 0);
  // Orphan progress rows for unpublished pattern IDs must not inflate course read.
  db.prepare("INSERT INTO grammar_progress VALUES(?,?,?)").run(
    (
      db
        .prepare("SELECT id FROM users WHERE email=?")
        .get("grammar-a@example.test") as { id: string }
    ).id,
    "ghost-pattern",
    new Date().toISOString(),
  );
  assert.equal((await call("/grammar/courses/n2")).data.read, 1);
  const unpublished = await call("/grammar/lessons/lesson-21");
  assert.equal(unpublished.status, 404);
  assert.match(unpublished.data.error, /biên soạn/);
  const unknownLesson = await call("/grammar/lessons/lesson-99");
  assert.equal(unknownLesson.status, 404);
  const publishedLesson = await call("/grammar/lessons/lesson-01");
  assert.equal(publishedLesson.status, 200);
  assert.equal(publishedLesson.data.patterns.length, 5);
  assert.equal(publishedLesson.data.number, 1);
  assert.ok(publishedLesson.data.title);
  assert.ok(Array.isArray(publishedLesson.data.patterns[0].variants));
  const lesson02 = await call("/grammar/lessons/lesson-02");
  assert.equal(lesson02.status, 200);
  assert.equal(lesson02.data.patterns.length, 6);
  assert.equal(lesson02.data.number, 2);
  const lesson06 = await call("/grammar/lessons/lesson-06");
  assert.equal(lesson06.status, 200);
  assert.equal(lesson06.data.patterns.length, 5);
  assert.equal(lesson06.data.number, 6);
  const patternDetail = await call("/grammar/patterns/sai");
  assert.equal(patternDetail.status, 200);
  assert.equal(patternDetail.data.lessonId, "lesson-01");
  assert.equal(patternDetail.data.lessonNumber, 1);
  assert.equal(patternDetail.data.lessonTitle, "Thời điểm · Ngay sau khi");
  assert.ok(Array.isArray(patternDetail.data.variants));
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
  // Re-check after answer change must not grant another XP for the same pattern/day.
  let previousXp = (await call("/grammar/sessions/" + s.id)).data.responses[
    first.id
  ];
  const recheck = await call(path + first.id, "PUT", {
    version: previousXp.version,
    answer: "Câu khác mẫu lần hai",
    action: "check",
  });
  assert.equal(recheck.status, 200);
  assert.equal((await call("/stats")).data.xp, 10);
  const exportAfter = await call("/export");
  assert.ok(Array.isArray(exportAfter.data.grammar.events));
  assert.ok(exportAfter.data.grammar.events.length >= 1);
  assert.ok(
    !JSON.stringify(exportAfter.data.grammar.events).includes("acceptedOrders"),
  );
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
      105,
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
      105,
    );
    restored.close();
  } finally {
    rmSync(dir, { recursive: true });
  }
});
