import { Router } from "express";
import type Database from "better-sqlite3";
import { readFileSync } from "node:fs";
import { randomUUID, randomInt } from "node:crypto";
import { z } from "zod";
import { createEmptyCard } from "ts-fsrs";
import { dayKey } from "../../../shared/domain";
import { manifest, grade, publicExercise, getLesson, getPattern, allPatterns } from "./content";
import type {
  Exercise,
  ResponseState,
  Session,
} from "../../../shared/grammar/types";
type StoredSession = {
  id: string;
  user_id: string;
  pattern_id: string;
  revision: number;
  questions: string;
  responses: string;
  completed_at: string | null;
};
const answerSchema = z.union([
  z.string().max(3000),
  z.array(z.string().max(30)).max(4),
]);
export class GrammarError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
function fail(status: number, message: string): never {
  throw new GrammarError(status, message);
}
export function grammarModule(db: Database.Database) {
  db.transaction(() => {
    db.exec(readFileSync(new URL("./migration.sql", import.meta.url), "utf8"));
    for (const p of allPatterns()) {
      const old = db
        .prepare(
          "SELECT content FROM grammar_content_revisions WHERE pattern_id=? AND revision=?",
        )
        .get(p.id, p.revision) as { content: string } | undefined;
      const content = JSON.stringify(p);
      if (old && old.content !== content)
        throw new Error(
          "Grammar content changed without revision increment: " + p.id,
        );
      db.prepare(
        "INSERT OR IGNORE INTO grammar_content_revisions VALUES(?,?,?)",
      ).run(p.id, p.revision, content);
    }
    db.prepare("INSERT OR IGNORE INTO schema_migrations VALUES(?,?)").run(
      "grammar-001",
      new Date().toISOString(),
    );
  })();
  const router = Router();
  const pattern = (id: string) =>
    getPattern(id)?.pattern || fail(404, "Không tìm thấy mẫu ngữ pháp.");
  const patternLesson = (id: string) =>
    getPattern(id)?.lesson || fail(404, "Không tìm thấy mẫu ngữ pháp.");
  const own = (id: string, uid: string) =>
    db
      .prepare("SELECT * FROM grammar_sessions WHERE id=? AND user_id=?")
      .get(id, uid) as StoredSession | undefined;
  const required = (id: string, uid: string) =>
    own(id, uid) || fail(404, "Không tìm thấy bài làm.");
  const visible = (s: StoredSession): Session => ({
    id: s.id,
    patternId: s.pattern_id,
    revision: s.revision,
    questions: (JSON.parse(s.questions) as Exercise[]).map(publicExercise),
    responses: JSON.parse(s.responses),
    completed: !!s.completed_at,
  });
  const read = (uid: string, id: string) =>
    !!db
      .prepare(
        "SELECT read_at FROM grammar_progress WHERE user_id=? AND pattern_id=?",
      )
      .get(uid, id);
  router.get("/courses/n2", (_, res) => {
    const uid: string = res.locals.user.id;
    const patterns = allPatterns();
    const liveIds = new Set(patterns.map((p) => p.id));
    const readRows = db
      .prepare("SELECT pattern_id FROM grammar_progress WHERE user_id=?")
      .all(uid) as { pattern_id: string }[];
    const practicedRows = db
      .prepare(
        "SELECT DISTINCT pattern_id FROM grammar_sessions WHERE user_id=? AND completed_at IS NOT NULL",
      )
      .all(uid) as { pattern_id: string }[];
    res.json({
      ...manifest,
      publishedGroups: patterns.length,
      publishedExercises: patterns.reduce(
        (n, p) => n + p.exercises.length,
        0,
      ),
      // Course progress denominator is always targetGroups (141), not publishedGroups.
      progressDenominator: manifest.targetGroups,
      read: readRows.filter((r) => liveIds.has(r.pattern_id)).length,
      practiced: practicedRows.filter((r) => liveIds.has(r.pattern_id)).length,
    });
  });
  router.get("/lessons/:id", (req, res) => {
    const entry = manifest.lessons.find((l) => l.id === req.params.id);
    if (!entry) fail(404, "Không tìm thấy bài học.");
    const content = getLesson(entry.id);
    if (!entry.published || !content)
      fail(404, "Bài học này đang được biên soạn.");
    const uid: string = res.locals.user.id;
    res.json({
      id: content.id,
      titleJa: content.titleJa,
      provenance: content.provenance,
      patterns: content.patterns.map((p) => {
        const s = db
          .prepare(
            "SELECT responses FROM grammar_sessions WHERE user_id=? AND pattern_id=? AND revision=?",
          )
          .get(uid, p.id, p.revision) as { responses: string } | undefined;
        return {
          id: p.id,
          title: p.title,
          meaning: p.meaning,
          variants: p.variants,
          count: p.exercises.length,
          read: read(uid, p.id),
          completed: s
            ? Object.values(
                JSON.parse(s.responses) as Record<string, ResponseState>,
              ).filter((r) => r.result && r.result !== "revealed").length
            : 0,
        };
      }),
    });
  });
  router.get("/patterns/:id", (req, res) => {
    const lookup = getPattern(req.params.id);
    if (!lookup) fail(404, "Không tìm thấy mẫu ngữ pháp.");
    const { exercises, ...p } = lookup.pattern;
    const lessonMeta = manifest.lessons.find((l) => l.id === lookup.lesson.id);
    if (!lessonMeta) fail(404, "Không tìm thấy bài học.");
    res.json({
      ...p,
      read: read(res.locals.user.id, p.id),
      provenance: lookup.lesson.provenance,
      lessonId: lookup.lesson.id,
      lessonNumber: lessonMeta.number,
      lessonTitle: lessonMeta.title,
      counts: Object.fromEntries(
        ["vi-ja", "ja-vi", "order"].map((m) => [
          m,
          exercises.filter((q) => q.mode === m).length,
        ]),
      ),
    });
  });
  router.put("/patterns/:id/progress", (req, res) => {
    const p = pattern(req.params.id);
    db.prepare("INSERT OR IGNORE INTO grammar_progress VALUES(?,?,?)").run(
      res.locals.user.id,
      p.id,
      new Date().toISOString(),
    );
    res.json({ read: true });
  });
  router.post("/patterns/:id/sessions", (req, res) => {
    const p = pattern(req.params.id),
      uid: string = res.locals.user.id;
    let s = db
      .prepare(
        "SELECT * FROM grammar_sessions WHERE user_id=? AND pattern_id=? AND revision=?",
      )
      .get(uid, p.id, p.revision) as StoredSession | undefined;
    if (!s) {
      const id = randomUUID();
      const questions = p.exercises.map((q) => {
        if (q.mode !== "order") return q;
        const tokens = [...q.tokens];
        for (let i = tokens.length - 1; i > 0; i--) {
          const j = randomInt(i + 1);
          [tokens[i], tokens[j]] = [tokens[j], tokens[i]];
        }
        return { ...q, tokens };
      });
      db.prepare(
        "INSERT INTO grammar_sessions(id,user_id,pattern_id,revision,questions,created_at) VALUES(?,?,?,?,?,?)",
      ).run(
        id,
        uid,
        p.id,
        p.revision,
        JSON.stringify(questions),
        new Date().toISOString(),
      );
      s = required(id, uid);
    }
    res.json(visible(s));
  });
  router.get("/sessions/:id", (req, res) =>
    res.json(visible(required(req.params.id, res.locals.user.id))),
  );
  const updateSchema = z.object({
    version: z.number().int().min(0),
    answer: answerSchema,
    action: z
      .enum(["save", "check", "hint", "reveal", "self-review"])
      .default("save"),
  });
  router.put("/sessions/:id/responses/:qid", (req, res) => {
    const input = updateSchema.parse(req.body),
      uid: string = res.locals.user.id;
    const result = db.transaction(() => {
      const s = required(req.params.id, uid);
      const q =
        (JSON.parse(s.questions) as Exercise[]).find(
          (q) => q.id === req.params.qid,
        ) || fail(404, "Câu không thuộc bài làm.");
      const responses: Record<string, ResponseState> = JSON.parse(s.responses);
      const old = responses[q.id] || {
        answer: q.mode === "order" ? [] : "",
        version: 0,
      };
      if (old.version !== input.version)
        fail(
          409,
          "Bài làm đã thay đổi ở nơi khác. Nội dung của bạn vẫn được giữ; tải bản mới trước khi lưu.",
        );
      if (
        q.mode === "order"
          ? !Array.isArray(input.answer)
          : typeof input.answer !== "string"
      )
        fail(422, "Dạng câu trả lời không phù hợp.");
      if (
        q.mode === "order" &&
        Array.isArray(input.answer) &&
        (new Set(input.answer).size !== input.answer.length ||
          input.answer.some((id) => !q.tokens.some((t) => t.id === id)))
      )
        fail(422, "Mảnh câu không hợp lệ.");
      const changed =
        JSON.stringify(old.answer) !== JSON.stringify(input.answer);
      const r: ResponseState = {
        ...old,
        answer: input.answer,
        version: old.version + 1,
      };
      if (changed) {
        delete r.result;
        delete r.selfReviewed;
        db.prepare(
          "UPDATE grammar_sessions SET completed_at=NULL WHERE id=?",
        ).run(s.id);
      }
      if (input.action === "hint") r.hint = q.hint;
      if (input.action === "reveal") {
        r.solution = q.answers[0];
        r.explanation = q.explanation;
        r.exposed = true;
        if (!r.result) r.result = "revealed";
      }
      if (input.action === "self-review") {
        if (old.result !== "needs_review" || changed)
          fail(422, "Hãy kiểm tra bản dịch trước khi tự đối chiếu.");
        r.selfReviewed = true;
      }
      if (input.action === "check") {
        if (
          typeof input.answer === "string"
            ? !input.answer.trim()
            : input.answer.length !== 4
        )
          fail(422, "Hãy hoàn thành câu trả lời trước khi kiểm tra.");
        r.result = grade(q, input.answer);
        r.solution = q.answers[0];
        r.explanation = q.explanation;
        if (!old.exposed)
          db.prepare(
            "INSERT OR IGNORE INTO grammar_events VALUES(?,?,?,?,?,?)",
          ).run(randomUUID(), uid, s.pattern_id, q.id, s.id, dayKey());
        r.exposed = true;
      }
      if (old.result)
        db.prepare(
          "INSERT INTO grammar_response_history(session_id,question_id,response,created_at) VALUES(?,?,?,?)",
        ).run(s.id, q.id, JSON.stringify(old), new Date().toISOString());
      responses[q.id] = r;
      db.prepare("UPDATE grammar_sessions SET responses=? WHERE id=?").run(
        JSON.stringify(responses),
        s.id,
      );
      return r;
    })();
    res.json(result);
  });
  router.post("/sessions/:id/complete", (req, res) => {
    const s = required(req.params.id, res.locals.user.id);
    const responses: Record<string, ResponseState> = JSON.parse(s.responses);
    const done = (JSON.parse(s.questions) as Exercise[]).every((q) => {
      const r = responses[q.id];
      return (
        r &&
        (r.result === "correct" ||
          r.result === "incorrect" ||
          r.result === "matched" ||
          (r.result === "needs_review" && r.selfReviewed))
      );
    });
    if (!done)
      fail(
        422,
        "Hãy làm và kiểm tra đủ ba phần; bản dịch khác mẫu cần được tự đối chiếu.",
      );
    db.prepare(
      "UPDATE grammar_sessions SET completed_at=COALESCE(completed_at,?) WHERE id=?",
    ).run(new Date().toISOString(), s.id);
    res.json(visible(required(s.id, res.locals.user.id)));
  });
  router.post("/patterns/:id/srs", (req, res) => {
    const p = pattern(req.params.id),
      uid: string = res.locals.user.id;
    const result = db.transaction(() => {
      const old = db
        .prepare(
          "SELECT card_id FROM grammar_srs_links WHERE user_id=? AND pattern_id=?",
        )
        .get(uid, p.id) as { card_id: string } | undefined;
      if (old) return { added: false, cardId: old.card_id };
      const deckId = randomUUID(),
        noteId = randomUUID(),
        cardId = randomUUID(),
        now = new Date();
      db.prepare(
        "INSERT INTO decks(id,user_id,title,description,kind,level,front,back,created_at) VALUES(?,?,?,?,?,?,?,?,?)",
      ).run(
        deckId,
        uid,
        "N2 · " + p.title,
        "Mẫu từ bài " +
          (manifest.lessons.find((l) => l.id === patternLesson(p.id).id)
            ?.number ?? "?") +
          " · học ngữ pháp",
        "grammar",
        "N2",
        "{term}",
        "{meaning}\n{example}",
        now.toISOString(),
      );
      db.prepare("INSERT INTO notes VALUES(?,?,?)").run(
        noteId,
        deckId,
        JSON.stringify({
          term: p.title,
          meaning:
            p.meaning + "\n" + p.structures.join("\n") + "\n" + p.explanation,
          reading: "",
          example: p.examples[0].ja + "\n" + p.examples[0].vi,
        }),
      );
      db.prepare(
        "INSERT INTO cards(id,note_id,user_id,schedule,due) VALUES(?,?,?,?,?)",
      ).run(
        cardId,
        noteId,
        uid,
        JSON.stringify(createEmptyCard(now)),
        now.toISOString(),
      );
      db.prepare("INSERT INTO grammar_srs_links VALUES(?,?,?)").run(
        uid,
        p.id,
        cardId,
      );
      return { added: true, cardId };
    })();
    res.json(result);
  });
  return router;
}
