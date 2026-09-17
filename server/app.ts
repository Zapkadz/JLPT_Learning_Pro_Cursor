import { grammarModule, GrammarError } from "./modules/grammar/router";
import { kaiwaModule, KaiwaError } from "./modules/kaiwa/module";
import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import Database from "better-sqlite3";
import { readFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  randomBytes,
  randomUUID,
  createHash,
  scrypt as scryptCallback,
  timingSafeEqual,
  randomInt,
} from "node:crypto";
import { promisify } from "node:util";
import { z } from "zod";
import { createEmptyCard, fsrs, type Grade } from "ts-fsrs";
import {
  deckSchema,
  validationMessage,
  dayKey,
  streakFromDays,
  renderTemplate,
  levels,
  type Note,
  type Question,
} from "../shared/domain";
import { bank, starterDecks, starterNotes } from "./content";
import { kanaRows, kanaGroups } from "../shared/kana";
const scrypt = promisify(scryptCallback);
type Row = Record<string, any>;
const settingsSchema = z.object({
  dailyGoal: z.number().int().min(5).max(200),
  level: z.enum(levels),
  retention: z.number().min(0.8).max(0.97),
});
const defaults = { dailyGoal: 20, level: "N5", retention: 0.9 };
const hash = (value: string) =>
  createHash("sha256").update(value).digest("hex");
class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
function fail(status: number, message: string): never {
  throw new HttpError(status, message);
}
function shuffle<T>(items: T[]) {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function publicUser(u: Row) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    settings: JSON.parse(u.settings),
  };
}
export function createApp(
  dbPath = process.env.DB_PATH || "data/kotoba.sqlite",
) {
  if (dbPath !== ":memory:")
    mkdirSync(dirname(resolve(dbPath)), { recursive: true });
  const db = new Database(dbPath);
  db.exec(readFileSync(new URL("./schema.sql", import.meta.url), "utf8"));
  const app = express();
  const production = process.env.NODE_ENV === "production";
  if (production && !process.env.APP_ORIGIN)
    throw new Error("Production requires APP_ORIGIN (HTTPS origin).");
  const origins = new Set([
    process.env.APP_ORIGIN || "http://127.0.0.1:5173",
    ...(!production
      ? [
          "http://localhost:5173",
          "http://127.0.0.1:3001",
          "http://localhost:3001",
        ]
      : []),
  ]);
  app.use(
    helmet({
      contentSecurityPolicy: production ? undefined : false,
      strictTransportSecurity: production ? undefined : false,
    }),
  );
  app.use(express.json({ limit: "2mb" }));
  app.use(cookieParser());
  app.use(
    "/api",
    rateLimit({
      windowMs: 60_000,
      limit: 600,
      standardHeaders: "draft-8",
      legacyHeaders: false,
      message: {
        error: "Bạn thao tác quá nhanh. Vui lòng thử lại sau một phút.",
      },
    }),
  );
  app.use("/api", (req, res, next) => {
    res.set("Cache-Control", "no-store");
    if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
      if (req.get("Sec-Fetch-Site") === "cross-site")
        return next(new HttpError(403, "Yêu cầu khác nguồn bị từ chối."));
      const origin = req.get("Origin");
      if (origin && !origins.has(origin))
        return next(new HttpError(403, "Nguồn yêu cầu không được phép."));
    }
    next();
  });
  const authLimiter = rateLimit({
    windowMs: 15 * 60_000,
    limit: 30,
    skipSuccessfulRequests: true,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { error: "Quá nhiều lần đăng nhập. Vui lòng đợi 15 phút." },
  });
  function session(res: Response, uid: string) {
    const token = randomBytes(32).toString("hex");
    db.prepare("DELETE FROM sessions WHERE expires < ?").run(
      new Date().toISOString(),
    );
    db.prepare("INSERT INTO sessions VALUES(?,?,?)").run(
      hash(token),
      uid,
      new Date(Date.now() + 30 * 86400_000).toISOString(),
    );
    res.cookie("kotoba_session", token, {
      httpOnly: true,
      sameSite: "strict",
      secure: production,
      maxAge: 30 * 86400_000,
      path: "/",
    });
  }
  app.get("/api/health", (_, res) => res.json({ status: "ok" }));
  app.post("/api/auth/register", authLimiter, async (req, res) => {
    const data = z
      .object({
        email: z
          .string()
          .trim()
          .email()
          .max(254)
          .transform((v) => v.toLowerCase()),
        name: z.string().trim().min(1).max(60),
        password: z.string().min(10).max(128),
      })
      .parse(req.body);
    if (db.prepare("SELECT id FROM users WHERE email=?").get(data.email))
      fail(409, "Email đã được sử dụng. Hãy đăng nhập.");
    const salt = randomBytes(16).toString("hex");
    const key = (await scrypt(data.password, salt, 64)) as Buffer;
    const id = randomUUID();
    try {
      db.prepare("INSERT INTO users VALUES(?,?,?,?,?,?)").run(
        id,
        data.email,
        data.name,
        `${salt}:${key.toString("hex")}`,
        JSON.stringify(defaults),
        new Date().toISOString(),
      );
    } catch (e) {
      if (db.prepare("SELECT id FROM users WHERE email=?").get(data.email))
        fail(409, "Email đã được sử dụng.");
      throw e;
    }
    session(res, id);
    res
      .status(201)
      .json(
        publicUser(db.prepare("SELECT * FROM users WHERE id=?").get(id) as Row),
      );
  });
  app.post("/api/auth/login", authLimiter, async (req, res) => {
    const data = z
      .object({
        email: z
          .string()
          .trim()
          .email()
          .max(254)
          .transform((v) => v.toLowerCase()),
        password: z.string().min(1).max(128),
      })
      .parse(req.body);
    const user = db
      .prepare("SELECT * FROM users WHERE email=?")
      .get(data.email) as Row | undefined;
    const [salt, key] = (
      user?.password || "00000000000000000000000000000000:" + "0".repeat(128)
    ).split(":");
    const check = (await scrypt(data.password, salt, 64)) as Buffer;
    if (!user || !timingSafeEqual(check, Buffer.from(key, "hex")))
      fail(401, "Email hoặc mật khẩu chưa đúng.");
    session(res, user.id);
    res.json(publicUser(user));
  });
  app.post("/api/auth/logout", (req, res) => {
    if (req.cookies.kotoba_session)
      db.prepare("DELETE FROM sessions WHERE token=?").run(
        hash(req.cookies.kotoba_session),
      );
    res.clearCookie("kotoba_session", {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      secure: production,
    });
    res.json({ ok: true });
  });
  app.use("/api", (req, res, next) => {
    const token = req.cookies.kotoba_session;
    const user =
      typeof token === "string"
        ? (db
            .prepare(
              "SELECT u.* FROM users u JOIN sessions s ON s.user_id=u.id WHERE s.token=? AND s.expires>?",
            )
            .get(hash(token), new Date().toISOString()) as Row)
        : undefined;
    if (!user)
      return next(
        new HttpError(
          401,
          "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
        ),
      );
    res.locals.user = user;
    next();
  });
  app.use("/api/grammar", grammarModule(db));
  app.use("/api/kaiwa", kaiwaModule(db));
  app.get("/api/me", (_, res) => res.json(publicUser(res.locals.user)));
  function ownDeck(id: unknown, uid: string) {
    const row = db
      .prepare("SELECT * FROM decks WHERE id=? AND user_id=?")
      .get(id, uid) as Row | undefined;
    if (!row) fail(404, "Không tìm thấy bộ thẻ trong tài khoản của bạn.");
    return row;
  }
  function notesOf(id: string): Note[] {
    return (
      db
        .prepare("SELECT id,data FROM notes WHERE deck_id=? ORDER BY rowid")
        .all(id) as Row[]
    ).map((n) => ({ ...JSON.parse(n.data), id: n.id }));
  }
  function addNote(deckId: string, uid: string, note: Note, id = randomUUID()) {
    const schedule = createEmptyCard();
    db.prepare("INSERT INTO notes VALUES(?,?,?)").run(
      id,
      deckId,
      JSON.stringify(note),
    );
    db.prepare(
      "INSERT INTO cards(id,note_id,user_id,schedule,due) VALUES(?,?,?,?,?)",
    ).run(
      randomUUID(),
      id,
      uid,
      JSON.stringify(schedule),
      schedule.due.toISOString(),
    );
  }
  function createDeck(uid: string, input: unknown) {
    const data = deckSchema.parse(input);
    const id = randomUUID();
    db.transaction(() => {
      db.prepare(
        "INSERT INTO decks(id,user_id,title,description,kind,level,front,back,created_at) VALUES(?,?,?,?,?,?,?,?,?)",
      ).run(
        id,
        uid,
        data.title,
        data.description,
        data.kind,
        data.level,
        data.front,
        data.back,
        new Date().toISOString(),
      );
      data.notes.forEach((n) => addNote(id, uid, n));
    })();
    return id;
  }
  app.get("/api/decks", (_, res) => {
    res.json(
      db
        .prepare(
          "SELECT d.*, COUNT(c.id) AS count, COALESCE(SUM(CASE WHEN c.version>0 THEN 1 ELSE 0 END),0) AS learned FROM decks d LEFT JOIN notes n ON n.deck_id=d.id LEFT JOIN cards c ON c.note_id=n.id WHERE d.user_id=? GROUP BY d.id ORDER BY d.created_at DESC",
        )
        .all(res.locals.user.id),
    );
  });
  app.post("/api/decks", (req, res) =>
    res.status(201).json({ id: createDeck(res.locals.user.id, req.body) }),
  );
  app.get("/api/decks/:id", (req, res) => {
    const d = ownDeck(req.params.id, res.locals.user.id);
    res.json({ ...d, notes: notesOf(d.id) });
  });
  app.put("/api/decks/:id", (req, res) => {
    const uid = res.locals.user.id;
    const old = ownDeck(req.params.id, uid);
    const data = deckSchema.parse(req.body);
    const version = z.number().int().parse(req.body.version);
    if (version !== old.version)
      fail(409, "Bộ thẻ đã được thay đổi ở nơi khác. Tải lại trước khi lưu.");
    const ids = z
      .array(z.string().uuid().optional())
      .parse(req.body.notes.map((n: Row) => n.id));
    if (new Set(ids.filter(Boolean)).size !== ids.filter(Boolean).length)
      fail(400, "ID thẻ bị trùng.");
    const existing = new Set(notesOf(old.id).map((n) => n.id));
    for (const id of ids)
      if (id && !existing.has(id)) fail(400, "Thẻ không thuộc bộ này.");
    db.transaction(() => {
      db.prepare(
        "UPDATE decks SET title=?,description=?,kind=?,level=?,front=?,back=?,version=version+1 WHERE id=?",
      ).run(
        data.title,
        data.description,
        data.kind,
        data.level,
        data.front,
        data.back,
        old.id,
      );
      data.notes.forEach((n, i) => {
        if (ids[i])
          db.prepare("UPDATE notes SET data=? WHERE id=?").run(
            JSON.stringify(n),
            ids[i],
          );
        else addNote(old.id, uid, n);
      });
      for (const id of existing)
        if (!ids.includes(id))
          db.prepare("DELETE FROM notes WHERE id=?").run(id);
    })();
    res.json({ id: old.id });
  });
  app.delete("/api/decks/:id", (req, res) => {
    const d = ownDeck(req.params.id, res.locals.user.id);
    db.prepare("DELETE FROM decks WHERE id=?").run(d.id);
    res.json({ ok: true });
  });
  app.get("/api/starters", (_, res) => res.json(starterDecks));
  app.post("/api/starters/:id", (req, res) => {
    const kind = z
      .enum(["kanji", "vocabulary", "grammar"])
      .parse(req.params.id);
    const level = z.enum(levels).parse(req.body.level || "N5");
    const seed = starterDecks.find((s) => s.id === kind)!;
    const title = `${seed.title} · ${level}`;
    const existing = db
      .prepare("SELECT id FROM decks WHERE user_id=? AND title=?")
      .get(res.locals.user.id, title) as Row | undefined;
    const id =
      existing?.id ||
      createDeck(res.locals.user.id, {
        ...seed,
        title,
        level,
        front: "{term}",
        back: "{reading}\n{meaning}\n{example}",
        notes: starterNotes(kind, level),
      });
    res.json({ id });
  });
  app.post("/api/kana", (req, res) => {
    const { group, katakana } = z
      .object({ group: z.number().int().min(0).max(2), katakana: z.boolean() })
      .parse(req.body);
    const title = `${katakana ? "Katakana" : "Hiragana"} · ${kanaGroups[group].name}`;
    const old = db
      .prepare("SELECT id FROM decks WHERE user_id=? AND title=?")
      .get(res.locals.user.id, title) as Row | undefined;
    res.json({
      id:
        old?.id ||
        createDeck(res.locals.user.id, {
          title,
          kind: "kana",
          level: "N5",
          description:
            "Thẻ nhận diện kana. Âm đọc chỉ hiện sau khi tự gợi nhớ.",
          front: "{term}",
          back: "{meaning}",
          notes: kanaRows(group, katakana),
        }),
    });
  });
  function ownCard(id: unknown, uid: string) {
    const c = db
      .prepare(
        "SELECT c.*,n.data,d.front,d.back,d.title FROM cards c JOIN notes n ON n.id=c.note_id JOIN decks d ON d.id=n.deck_id WHERE c.id=? AND c.user_id=?",
      )
      .get(id, uid) as Row | undefined;
    if (!c) fail(404, "Không tìm thấy thẻ.");
    return c;
  }
  function scheduler(u: Row) {
    return fsrs({
      request_retention: JSON.parse(u.settings).retention,
      enable_fuzz: false,
    });
  }
  app.get("/api/review", (req, res) => {
    const uid = res.locals.user.id;
    const deckId = typeof req.query.deck === "string" ? req.query.deck : null;
    if (deckId) ownDeck(deckId, uid);
    const now = new Date().toISOString();
    const rows = db
      .prepare(
        "SELECT c.*,n.data,d.front,d.title FROM cards c JOIN notes n ON n.id=c.note_id JOIN decks d ON d.id=n.deck_id WHERE c.user_id=? AND c.due<=? AND (? IS NULL OR d.id=?) ORDER BY CASE WHEN c.version>0 THEN 0 ELSE 1 END,c.due LIMIT 50",
      )
      .all(uid, now, deckId, deckId) as Row[];
    res.json(
      rows.map((c) => ({
        id: c.id,
        version: c.version,
        title: c.title,
        front: renderTemplate(c.front, JSON.parse(c.data)),
        isNew: c.version === 0,
      })),
    );
  });
  app.post("/api/review/:id/reveal", (req, res) => {
    const c = ownCard(req.params.id, res.locals.user.id);
    if (c.due > new Date().toISOString()) fail(409, "Thẻ chưa đến hạn ôn.");
    if (req.body.version !== c.version)
      fail(409, "Lịch thẻ đã thay đổi. Tải lại hàng đợi.");
    db.prepare("UPDATE cards SET revealed_version=version WHERE id=?").run(
      c.id,
    );
    const schedules = scheduler(res.locals.user).repeat(
      JSON.parse(c.schedule),
      new Date(),
    );
    res.json({
      back: renderTemplate(c.back, JSON.parse(c.data)),
      intervals: [1, 2, 3, 4].map((r) => ({
        rating: r,
        due: schedules[r as Grade].card.due.toISOString(),
      })),
    });
  });
  app.post("/api/review/:id", (req, res) => {
    const { rating, version, requestId } = z
      .object({
        rating: z.number().int().min(1).max(4),
        version: z.number().int(),
        requestId: z.string().uuid(),
      })
      .parse(req.body);
    const uid = res.locals.user.id;
    const prev = db
      .prepare("SELECT * FROM reviews WHERE id=?")
      .get(requestId) as Row | undefined;
    if (prev) {
      if (
        prev.user_id !== uid ||
        prev.card_id !== req.params.id ||
        prev.rating !== rating
      )
        fail(409, "Mã yêu cầu đã được dùng.");
      return res.json({ ok: true, duplicate: true });
    }
    const c = ownCard(req.params.id, uid);
    if (c.version !== version || c.revealed_version !== version)
      fail(409, "Hãy mở đáp án của phiên bản thẻ hiện tại trước khi đánh giá.");
    const now = new Date();
    if (c.due > now.toISOString()) fail(409, "Thẻ chưa đến hạn ôn.");
    const result = scheduler(res.locals.user).repeat(
      JSON.parse(c.schedule),
      now,
    )[rating as Grade];
    db.transaction(() => {
      db.prepare(
        "UPDATE cards SET schedule=?,due=?,version=version+1,revealed_version=NULL WHERE id=?",
      ).run(JSON.stringify(result.card), result.card.due.toISOString(), c.id);
      db.prepare("INSERT INTO reviews VALUES(?,?,?,?,?,?,?)").run(
        requestId,
        uid,
        c.id,
        rating,
        now.toISOString(),
        dayKey(now),
        JSON.stringify(result.log),
      );
    })();
    res.json({ ok: true, due: result.card.due });
  });
  app.get("/api/practice/catalog", (_, res) =>
    res.json(
      levels.map((level) => ({
        level,
        counts: Object.fromEntries(
          ["kanji", "vocabulary", "grammar"].map((kind) => [
            kind,
            bank.filter((q) => q.kind === kind && q.level === level).length,
          ]),
        ),
      })),
    ),
  );
  function visibleAttempt(row: Row) {
    return {
      id: row.id,
      createdAt: row.created_at,
      questions: (JSON.parse(row.questions) as Question[]).map(
        ({ id, type, prompt, options, level, kind, source }) => ({
          id,
          type,
          prompt,
          options,
          level,
          kind,
          source,
        }),
      ),
    };
  }
  app.post("/api/practice", (req, res) => {
    const data = z
      .object({
        kind: z.enum(["kanji", "vocabulary", "grammar"]),
        level: z.enum(levels),
        count: z.number().int().min(1).max(30),
        deckId: z.string().uuid().optional(),
        type: z.string().optional(),
      })
      .parse(req.body);
    let candidates: Question[];
    if (data.deckId) {
      const deck = ownDeck(data.deckId, res.locals.user.id);
      if (deck.kind !== data.kind || deck.level !== data.level)
        fail(400, "Bộ thẻ khác phân môn hoặc cấp độ đã chọn.");
      candidates = notesOf(deck.id)
        .filter((n) => n.question && n.question.reviewed !== false)
        .map((n) => ({
          ...n.question!,
          id: n.id!,
          kind: deck.kind,
          level: deck.level,
          source: "Học liệu cá nhân · chưa kiểm duyệt độc lập",
        }));
    } else
      candidates = bank.filter(
        (q) => q.kind === data.kind && q.level === data.level,
      );
    if (data.type) candidates = candidates.filter((q) => q.type === data.type);
    if (!candidates.length)
      fail(
        422,
        "Chưa có câu hỏi đủ dữ kiện cho lựa chọn này. Bổ sung câu hỏi, 4 lựa chọn và lời giải trong bộ thẻ.",
      );
    const questions = shuffle(candidates)
      .slice(0, data.count)
      .map((q) => {
        const choices = shuffle(
          q.options.map((text, i) => ({ text, correct: i === q.answer })),
        );
        return {
          ...q,
          options: choices.map((c) => c.text),
          answer: choices.findIndex((c) => c.correct),
        };
      });
    const id = randomUUID();
    db.prepare(
      "INSERT INTO attempts(id,user_id,questions,created_at) VALUES(?,?,?,?)",
    ).run(
      id,
      res.locals.user.id,
      JSON.stringify(questions),
      new Date().toISOString(),
    );
    res.json(
      visibleAttempt(
        db.prepare("SELECT * FROM attempts WHERE id=?").get(id) as Row,
      ),
    );
  });
  function ownAttempt(id: unknown, uid: string) {
    const row = db
      .prepare("SELECT * FROM attempts WHERE id=? AND user_id=?")
      .get(id, uid) as Row | undefined;
    if (!row) fail(404, "Không tìm thấy phiên bài tập.");
    return row;
  }
  function resultOf(row: Row) {
    return {
      ...visibleAttempt(row),
      questions: JSON.parse(row.questions),
      answers: JSON.parse(row.answers),
      score: row.score,
      completedAt: row.completed_at,
    };
  }
  app.get("/api/practice/:id", (req, res) => {
    const row = ownAttempt(req.params.id, res.locals.user.id);
    res.json(row.completed_at ? resultOf(row) : visibleAttempt(row));
  });
  app.post("/api/practice/:id/retry", (req, res) => {
    const old = ownAttempt(req.params.id, res.locals.user.id);
    if (!old.completed_at) fail(409, "Hãy nộp bài trước khi luyện lại.");
    const all = JSON.parse(old.questions) as Question[];
    const answers = JSON.parse(old.answers) as number[];
    const wrong = all.filter((q, i) => q.answer !== answers[i]);
    const questions = shuffle(wrong.length ? wrong : all).map((q) => {
      const choices = shuffle(
        q.options.map((text, i) => ({ text, correct: i === q.answer })),
      );
      return {
        ...q,
        options: choices.map((c) => c.text),
        answer: choices.findIndex((c) => c.correct),
      };
    });
    const id = randomUUID();
    db.prepare(
      "INSERT INTO attempts(id,user_id,questions,created_at) VALUES(?,?,?,?)",
    ).run(
      id,
      res.locals.user.id,
      JSON.stringify(questions),
      new Date().toISOString(),
    );
    res.json(visibleAttempt(ownAttempt(id, res.locals.user.id)));
  });
  app.post("/api/practice/:id/submit", (req, res) => {
    const row = ownAttempt(req.params.id, res.locals.user.id);
    if (row.completed_at) return res.json(resultOf(row));
    const qs = JSON.parse(row.questions) as Question[];
    const answers = z
      .array(z.number().int().min(-1).max(3))
      .length(qs.length)
      .parse(req.body.answers);
    const score = qs.filter((q, i) => q.answer === answers[i]).length;
    const now = new Date();
    db.prepare(
      "UPDATE attempts SET answers=?,score=?,completed_at=?,day=? WHERE id=?",
    ).run(
      JSON.stringify(answers),
      score,
      now.toISOString(),
      dayKey(now),
      row.id,
    );
    res.json(resultOf(ownAttempt(row.id, res.locals.user.id)));
  });
  app.get("/api/attempts", (_, res) =>
    res.json(
      (
        db
          .prepare(
            "SELECT id,score,completed_at,questions FROM attempts WHERE user_id=? AND completed_at IS NOT NULL ORDER BY completed_at DESC LIMIT 50",
          )
          .all(res.locals.user.id) as Row[]
      ).map((r) => ({
        id: r.id,
        score: r.score,
        total: JSON.parse(r.questions).length,
        kind: JSON.parse(r.questions)[0].kind,
        level: JSON.parse(r.questions)[0].level,
        date: r.completed_at,
      })),
    ),
  );
  app.get("/api/stats", (_, res) => {
    const uid = res.locals.user.id;
    const today = dayKey();
    const reviews = db
      .prepare("SELECT card_id,day,rating FROM reviews WHERE user_id=?")
      .all(uid) as Row[];
    const attempts = db
      .prepare(
        "SELECT questions,answers,day FROM attempts WHERE user_id=? AND completed_at IS NOT NULL",
      )
      .all(uid) as Row[];
    const activity: Record<string, Set<string>> = {};
    const touches: Record<string, number> = {};
    const add = (day: string, key: string) => {
      (activity[day] ??= new Set()).add(key);
      touches[day] = (touches[day] || 0) + 1;
    };
    const grammarLinks = db
      .prepare(
        "SELECT card_id,pattern_id FROM grammar_srs_links WHERE user_id=?",
      )
      .all(uid) as { card_id: string; pattern_id: string }[];
    const linked = new Map(grammarLinks.map((l) => [l.card_id, l.pattern_id]));
    reviews.forEach((r) =>
      add(
        r.day,
        linked.has(r.card_id)
          ? "grammar:" + linked.get(r.card_id)
          : "card:" + r.card_id,
      ),
    );
    const grammarEvents = db
      .prepare("SELECT day,pattern_id FROM grammar_events WHERE user_id=?")
      .all(uid) as { day: string; pattern_id: string }[];
    grammarEvents.forEach((e) => add(e.day, "grammar:" + e.pattern_id));
    attempts.forEach((a) =>
      (JSON.parse(a.questions) as Question[]).forEach((q, i) => {
        if (JSON.parse(a.answers)[i] >= 0) add(a.day, "question:" + q.id);
      }),
    );
    const heatmap = Object.fromEntries(
      Object.entries(activity).map(([k, v]) => [k, v.size]),
    );
    const totals = db
      .prepare(
        "SELECT d.kind,COUNT(c.id) AS added,COALESCE(SUM(CASE WHEN c.version>0 THEN 1 ELSE 0 END),0) AS learned FROM decks d JOIN notes n ON n.deck_id=d.id JOIN cards c ON c.note_id=n.id WHERE d.user_id=? GROUP BY d.kind",
      )
      .all(uid);
    const due = (
      db
        .prepare("SELECT COUNT(*) AS n FROM cards WHERE user_id=? AND due<=?")
        .get(uid, new Date().toISOString()) as Row
    ).n;
    const next = (
      db
        .prepare("SELECT MIN(due) AS due FROM cards WHERE user_id=? AND due>?")
        .get(uid, new Date().toISOString()) as Row
    ).due;
    res.json({
      today,
      heatmap,
      touches,
      streak: streakFromDays(Object.keys(activity), today),
      todayCount: touches[today] || 0,
      todayUnique: heatmap[today] || 0,
      totalReviews: reviews.length,
      due,
      next,
      totals,
      xp: Object.values(heatmap).reduce((a, b) => a + b, 0) * 10,
      settings: JSON.parse(res.locals.user.settings),
    });
  });
  app.put("/api/settings", (req, res) => {
    const data = settingsSchema.parse(req.body);
    db.prepare("UPDATE users SET settings=? WHERE id=?").run(
      JSON.stringify(data),
      res.locals.user.id,
    );
    res.json(data);
  });
  app.get("/api/export", (_, res) => {
    const uid = res.locals.user.id;
    const decks = (
      db.prepare("SELECT * FROM decks WHERE user_id=?").all(uid) as Row[]
    ).map((d) => ({ ...d, notes: notesOf(d.id) }));
    res.set("Content-Disposition", 'attachment; filename="kotoba-backup.json"');
    res.json({
      version: 1,
      exportedAt: new Date().toISOString(),
      grammar: {
        progress: db
          .prepare(
            "SELECT pattern_id,read_at FROM grammar_progress WHERE user_id=?",
          )
          .all(uid),
        sessions: db
          .prepare(
            "SELECT id,pattern_id,revision,responses,completed_at FROM grammar_sessions WHERE user_id=?",
          )
          .all(uid),
        events: db
          .prepare(
            "SELECT id,pattern_id,question_id,session_id,day FROM grammar_events WHERE user_id=?",
          )
          .all(uid),
        history: db
          .prepare(
            "SELECT h.* FROM grammar_response_history h JOIN grammar_sessions s ON s.id=h.session_id WHERE s.user_id=?",
          )
          .all(uid),
      },
      profile: publicUser(res.locals.user),
      decks,
      cards: db.prepare("SELECT * FROM cards WHERE user_id=?").all(uid),
      reviews: db.prepare("SELECT * FROM reviews WHERE user_id=?").all(uid),
      attempts: db
        .prepare(
          "SELECT * FROM attempts WHERE user_id=? AND completed_at IS NOT NULL",
        )
        .all(uid),
    });
  });
  app.use("/api", (_, res) =>
    res.status(404).json({ error: "Không tìm thấy API." }),
  );
  if (production) {
    app.use(express.static(resolve("dist")));
    app.get("/{*path}", (_, res) => res.sendFile(resolve("dist/index.html")));
  }
  app.use(
    (error: unknown, _req: Request, res: Response, _next: NextFunction) => {
      if (error instanceof z.ZodError)
        return res.status(400).json({
          error: validationMessage(error.issues),
        });
      if (
        error instanceof HttpError ||
        error instanceof GrammarError ||
        error instanceof KaiwaError
      )
        return res.status(error.status).json({ error: error.message });
      if ((error as Row)?.type === "entity.too.large")
        return res.status(413).json({ error: "Dữ liệu quá lớn. Tối đa 2 MB." });
      if (error instanceof SyntaxError)
        return res.status(400).json({ error: "JSON không hợp lệ." });
      console.error(
        "Unhandled API error",
        error instanceof Error ? error.message : "unknown",
      );
      res.status(500).json({
        error:
          "Không thể xử lý lúc này. Dữ liệu nhập được giữ lại; vui lòng thử lại.",
      });
    },
  );
  return { app, db };
}
