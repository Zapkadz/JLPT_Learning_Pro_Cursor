import { useEffect, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  Eye,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { api, post, useData } from "../../lib/api";
import {
  PageHead,
  Status,
  Loading,
  ErrorState,
  Field,
} from "../../components/ui";
import {
  modes,
  modeLabels,
  type Course,
  type PatternSummary,
  type PatternDetail,
  type Session,
  type PublicExercise,
  type ResponseState,
  type Mode,
} from "../../../shared/grammar/types";
import "./grammar.css";
export function GrammarCourse() {
  const { data, error, reload } = useData<Course>("/grammar/courses/n2");
  if (error) return <ErrorState message={error} retry={reload} />;
  if (!data) return <Loading />;
  const startLesson = data.lessons.find((l) => l.published);
  return (
    <div className="grammar-page">
      <div className="grammar-eyebrow">LỘ TRÌNH HỌC · N2</div>
      <PageHead
        title="Hiểu cách dùng. Viết thành câu."
        description="Học từng nhóm ngữ pháp, rồi thực hành trong ngữ cảnh."
      />
      <section className="grammar-hero">
        <div>
          <span className="badge">SHINKANZEN · 文法</span>
          <h2>{data.title}</h2>
          <p>
            {data.targetGroups} nhóm · {data.lessons.length} bài · mục tiêu{" "}
            {data.targetExercises.toLocaleString("vi-VN")} câu luyện
          </p>
          {startLesson ? (
            <Link
              className="btn primary"
              to={"/grammar/n2/lessons/" + startLesson.id}
            >
              Học bài {startLesson.number} <ArrowRight size={17} />
            </Link>
          ) : (
            <span className="btn primary" aria-disabled="true">
              Chưa có bài sẵn sàng
            </span>
          )}
        </div>
        <div className="grammar-hero-mark" lang="ja">
          文<span>一歩ずつ、身につける。</span>
        </div>
      </section>
      <div className="grammar-metrics">
        <div>
          <strong>
            {data.read}
            <small> / {data.targetGroups}</small>
          </strong>
          <span>Mẫu đã đọc</span>
        </div>
        <div>
          <strong>
            {data.practiced}
            <small> / {data.targetGroups}</small>
          </strong>
          <span>Mẫu đã luyện đủ</span>
        </div>
        <div>
          <strong>{data.publishedExercises}</strong>
          <span>Câu luyện hiện có · {data.publishedGroups} nhóm</span>
        </div>
      </div>
      <div className="grammar-section-head">
        <h2>Các bài học</h2>
        <span className="muted">Học theo thứ tự hoặc chọn bài bạn cần</span>
      </div>
      <div className="grammar-lesson-grid">
        {data.lessons.map((l) =>
          l.published ? (
            <Link
              className="grammar-lesson"
              key={l.id}
              to={"/grammar/n2/lessons/" + l.id}
            >
              <span className="grammar-number">
                {String(l.number).padStart(2, "0")}
              </span>
              <div>
                <small>BÀI {l.number}</small>
                <h3>{l.title}</h3>
                <span>{l.groupCount} nhóm ngữ pháp · Sẵn sàng học</span>
              </div>
              <ChevronRight size={18} />
            </Link>
          ) : (
            <div className="grammar-lesson unpublished" key={l.id}>
              <span className="grammar-number">
                {String(l.number).padStart(2, "0")}
              </span>
              <div>
                <small>BÀI {l.number}</small>
                <h3>{l.title}</h3>
                <span>{l.groupCount} nhóm · Đang biên soạn</span>
              </div>
            </div>
          ),
        )}
      </div>
    </div>
  );
}
type LessonData = {
  id: string;
  titleJa: string;
  provenance: string;
  patterns: PatternSummary[];
};
export function GrammarLesson() {
  const { lessonId } = useParams();
  const { data, error, reload } = useData<LessonData>(
    "/grammar/lessons/" + lessonId,
  );
  const [search, setSearch] = useState("");
  if (error) return <ErrorState message={error} retry={reload} />;
  if (!data) return <Loading />;
  const shown = data.patterns.filter((p) =>
    (p.title + " " + p.meaning)
      .toLocaleLowerCase()
      .includes(search.toLocaleLowerCase()),
  );
  return (
    <div className="grammar-page">
      <Link className="back-link" to="/grammar/n2">
        ← Khóa ngữ pháp N2
      </Link>
      <div className="grammar-eyebrow">BÀI 01 · THỜI ĐIỂM</div>
      <PageHead
        title="Vừa mới… thì đã…"
        description="Năm cách diễn tả thời điểm, năm sắc thái khác nhau."
      />
      <div className="grammar-lesson-banner">
        <BookOpen />
        <div>
          <h2 lang="ja">{data.titleJa}</h2>
          <p>
            {data.patterns.length} nhóm ngữ pháp ·{" "}
            {data.patterns.reduce((n, p) => n + p.count, 0)} câu luyện · Học tự
            do
          </p>
        </div>
      </div>
      <Field label="Tìm mẫu trong bài">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm theo mẫu tiếng Nhật hoặc nghĩa tiếng Việt"
        />
      </Field>
      <div className="grammar-pattern-list">
        {shown.map((p, i) => (
          <article className="grammar-pattern-row" key={p.id}>
            <span className="grammar-number">
              {String(data.patterns.indexOf(p) + 1).padStart(2, "0")}
            </span>
            <Link to={"/grammar/n2/patterns/" + p.id}>
              <h2 lang="ja">{p.title}</h2>
              <p>{p.meaning}</p>
              <small>
                {p.read ? "✓ Đã đọc" : "Chưa đọc"} · Đã kiểm tra {p.completed}/
                {p.count} câu
              </small>
            </Link>
            <Link
              className="btn secondary"
              to={"/grammar/n2/patterns/" + p.id + "/exercises"}
            >
              Làm bài tập <ArrowRight size={16} />
            </Link>
          </article>
        ))}
      </div>
      {!shown.length && (
        <Status tone="info">Không tìm thấy mẫu phù hợp.</Status>
      )}
      <div className="grammar-note">
        <Sparkles size={18} />
        <p>
          Đọc để phân biệt sắc thái. Làm bài để tập dùng đúng ngữ cảnh. Bạn
          không cần hoàn thành mẫu trước để mở mẫu tiếp theo.
        </p>
      </div>
      <p className="grammar-provenance">{data.provenance}</p>
    </div>
  );
}
export function GrammarPattern() {
  const { patternId } = useParams();
  const { data, error, reload } = useData<PatternDetail>(
    "/grammar/patterns/" + patternId,
  );
  const [message, setMessage] = useState(""),
    [actionError, setActionError] = useState(""),
    [pending, setPending] = useState(false);
  const [reading, setReading] = useState(
    () => localStorage.getItem("kotoba-grammar-reading") === "true",
  );
  async function act(type: "read" | "srs") {
    setPending(true);
    setActionError("");
    try {
      if (type === "read") {
        await api("/grammar/patterns/" + patternId + "/progress", {
          method: "PUT",
          body: "{}",
        });
        reload();
        setMessage("Đã đánh dấu đọc.");
      } else {
        const r = await post<{ added: boolean }>(
          "/grammar/patterns/" + patternId + "/srs",
        );
        setMessage(
          r.added
            ? "Đã thêm mẫu vào lịch ôn FSRS."
            : "Mẫu này đã có trong lịch ôn.",
        );
      }
    } catch (e) {
      setActionError((e as Error).message);
    } finally {
      setPending(false);
    }
  }
  if (error) return <ErrorState message={error} retry={reload} />;
  if (!data) return <Loading />;
  return (
    <div className="grammar-page">
      <Link
        className="back-link"
        to={"/grammar/n2/lessons/" + data.lessonId}
      >
        ← Bài {data.lessonNumber} · {data.lessonTitle}
      </Link>
      <div className="grammar-eyebrow">N2 · HỌC CÁCH DÙNG</div>
      <PageHead title={data.title} description={data.meaning}>
        <Link
          className="btn primary"
          to={"/grammar/n2/patterns/" + patternId + "/exercises"}
        >
          Làm bài tập <ArrowRight size={17} />
        </Link>
      </PageHead>
      <div className="grammar-actions">
        <button
          className="btn secondary"
          disabled={pending || data.read}
          onClick={() => act("read")}
        >
          <Check size={16} />
          {data.read ? "Đã đọc" : "Đánh dấu đã đọc"}
        </button>
        <button
          className="btn secondary"
          disabled={pending}
          onClick={() => act("srs")}
        >
          Thêm vào ôn tập
        </button>
        <button
          className="btn secondary"
          aria-pressed={reading}
          onClick={() => {
            setReading(!reading);
            localStorage.setItem("kotoba-grammar-reading", String(!reading));
          }}
        >
          <Eye size={16} />
          {reading ? "Ẩn" : "Hiện"} furigana
        </button>
      </div>
      <Status tone="success">{message}</Status>
      <Status>{actionError}</Status>
      <div className="grammar-detail-grid">
        <section className="panel grammar-structure">
          <h2>Cấu trúc</h2>
          {data.structures.map((s) => (
            <div className="grammar-formula" lang="ja" key={s}>
              {s}
            </div>
          ))}
        </section>
        <section className="panel">
          <h2>Giải nghĩa</h2>
          <p>{data.explanation}</p>
        </section>
        <section className="panel">
          <h2>Phạm vi sử dụng</h2>
          <p>{data.usage}</p>
        </section>
        <section className="panel">
          <h2>Lưu ý khi dùng</h2>
          <ul>
            {data.cautions.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </section>
      </div>
      <section className="grammar-comparison">
        <h2>Phân biệt cho rõ</h2>
        <p>{data.contrast}</p>
      </section>
      <div className="grammar-section-head">
        <h2>Đặt vào một câu</h2>
        <span className="muted">Ví dụ minh họa</span>
      </div>
      {data.examples.map((e) => (
        <article className="panel grammar-example" key={e.ja}>
          <p lang="ja" className={reading ? "ruby-visible" : "ruby-hidden"}>
            {e.ruby.map((t, i) =>
              t.reading ? (
                <ruby key={i}>
                  {t.text}
                  <rt>{t.reading}</rt>
                </ruby>
              ) : (
                <span key={i}>{t.text}</span>
              ),
            )}
          </p>

          <p>{e.vi}</p>
        </article>
      ))}
      <section className="grammar-practice-cta">
        <div>
          <h2>Đến lượt bạn dùng mẫu này.</h2>
          <p>
            {data.counts["vi-ja"]} câu Việt → Nhật · {data.counts["ja-vi"]} câu
            Nhật → Việt · {data.counts.order} câu sắp xếp
          </p>
        </div>
        <Link
          className="btn primary"
          to={"/grammar/n2/patterns/" + patternId + "/exercises"}
        >
          Bắt đầu luyện <ArrowRight size={16} />
        </Link>
      </section>
      <p className="grammar-provenance">
        Tham chiếu PDF trang {data.source.pdfPage} (trang in{" "}
        {data.source.printedPage}). {data.provenance}
      </p>
    </div>
  );
}
const resultLabels: Record<string, string> = {
  matched: "Khớp đáp án đã biên soạn",
  needs_review: "Khác đáp án mẫu · hãy tự đối chiếu",
  correct: "Đúng thứ tự câu",
  incorrect: "Thứ tự chưa đúng",
  revealed: "Đã xem đáp án",
};
function ExerciseCard({
  q,
  number,
  sessionId,
  initial,
  onResult,
}: {
  q: PublicExercise;
  number: number;
  sessionId: string;
  initial?: ResponseState;
  onResult: (id: string, r: ResponseState) => void;
}) {
  const key = "grammar-draft:" + sessionId + ":" + q.id;
  const [answer, setAnswer] = useState<string | string[]>(() => {
    try {
      const value = sessionStorage.getItem(key);
      return value
        ? JSON.parse(value)
        : (initial?.answer ?? (q.mode === "order" ? [] : ""));
    } catch {
      return initial?.answer ?? (q.mode === "order" ? [] : "");
    }
  });
  const [response, setResponse] = useState<ResponseState>(
    initial || { answer: q.mode === "order" ? [] : "", version: 0 },
  );
  const current = useRef(response),
    lastSaved = useRef(JSON.stringify(response.answer)),
    latest = useRef(answer),
    queue = useRef<Promise<void>>(Promise.resolve());
  const [saving, setSaving] = useState(false),
    [error, setError] = useState(""),
    [saved, setSaved] = useState(true);
  const [conflict, setConflict] = useState(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  function change(value: string | string[]) {
    latest.current = value;
    setAnswer(value);
    setSaved(false);
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
    } catch {
      setError(
        "Không lưu được bản nháp trên trình duyệt. Hãy giữ trang này mở đến khi lưu máy chủ thành công.",
      );
    }
  }
  function persist(
    action: "save" | "check" | "hint" | "reveal" | "self-review",
    value = latest.current,
  ) {
    setSaving(true);
    queue.current = queue.current
      .catch(() => {})
      .then(async () => {
        if (action === "save" && lastSaved.current === JSON.stringify(value))
          return;
        try {
          const r = await api<ResponseState>(
            "/grammar/sessions/" + sessionId + "/responses/" + q.id,
            {
              method: "PUT",
              body: JSON.stringify({
                answer: value,
                version: current.current.version,
                action,
              }),
            },
          );
          current.current = r;
          lastSaved.current = JSON.stringify(value);
          onResult(q.id, r);
          if (mounted.current) {
            setResponse(r);
            setError("");
            setConflict(false);
            setSaved(JSON.stringify(latest.current) === JSON.stringify(value));
          }
          if (JSON.stringify(latest.current) === JSON.stringify(value))
            try {
              sessionStorage.removeItem(key);
            } catch {
              /* Server save succeeded. */
            }
        } catch (e) {
          if (mounted.current) {
            setError((e as Error).message);
            setConflict((e as { status?: number }).status === 409);
            setSaved(false);
          }
        }
      })
      .finally(() => {
        if (mounted.current) setSaving(false);
      });
    return queue.current;
  }
  const persistRef = useRef(persist);
  persistRef.current = persist;
  useEffect(() => {
    if (lastSaved.current === JSON.stringify(answer)) return;
    const timer = setTimeout(
      () => void persistRef.current("save", answer),
      650,
    );
    return () => clearTimeout(timer);
  }, [answer]);
  const order = Array.isArray(answer) ? answer : [];
  const valid =
    q.mode === "order"
      ? order.length === 4
      : typeof answer === "string" && !!answer.trim();
  const currentResult =
    JSON.stringify(answer) === JSON.stringify(response.answer)
      ? response.result
      : undefined;
  return (
    <article className="panel grammar-exercise">
      <div className="grammar-exercise-heading">
        <span className="grammar-question-number">{number}</span>
        <span>
          {q.mode === "vi-ja"
            ? "TIẾNG VIỆT"
            : q.mode === "ja-vi"
              ? "日本語"
              : "SẮP XẾP THÀNH CÂU"}
        </span>
        <small aria-live="polite">
          {saving ? "Đang lưu…" : saved ? "Đã lưu" : "Chưa lưu"}
        </small>
      </div>
      <p className="grammar-prompt" lang={q.mode === "ja-vi" ? "ja" : "vi"}>
        {q.prompt}
      </p>
      {q.mode === "order" ? (
        <>
          <div className="grammar-slots" aria-label="Câu của bạn">
            {[0, 1, 2, 3].map((i) => (
              <button
                key={i}
                className={i === q.starIndex ? "star-slot" : ""}
                aria-label={
                  "Ô " +
                  (i + 1) +
                  (order[i]
                    ? " · " +
                      q.tokens?.find((t) => t.id === order[i])?.text +
                      " · nhấn để bỏ"
                    : " · trống")
                }
                disabled={!order[i]}
                onClick={() => change(order.filter((_, j) => j !== i))}
              >
                {i === q.starIndex && <span className="grammar-star">★</span>}
                {q.tokens?.find((t) => t.id === order[i])?.text || "…"}
              </button>
            ))}
          </div>
          <div className="grammar-token-bank">
            {q.tokens?.map((t) => (
              <button
                key={t.id}
                lang="ja"
                disabled={order.includes(t.id)}
                onClick={() => change([...order, t.id])}
              >
                {t.text}
              </button>
            ))}
          </div>
          <small className="muted">
            Chọn mảnh theo thứ tự; nhấn ô đã chọn để trả lại. Kiểm tra cả bốn
            mảnh, không chỉ vị trí ★.
          </small>
        </>
      ) : (
        <Field
          label={
            "Bản dịch của bạn (" +
            (q.mode === "vi-ja" ? "日本語" : "tiếng Việt") +
            ")"
          }
        >
          <textarea
            className="resize-none"
            rows={3}
            value={typeof answer === "string" ? answer : ""}
            lang={q.mode === "vi-ja" ? "ja" : "vi"}
            placeholder={
              q.mode === "vi-ja"
                ? "Viết câu tiếng Nhật, dùng mẫu đang học…"
                : "Viết ý nghĩa câu bằng tiếng Việt…"
            }
            onChange={(e) => change(e.target.value)}
          />
        </Field>
      )}
      <div className="grammar-exercise-actions">
        <button
          className="btn primary"
          disabled={!valid || saving}
          onClick={() => void persist("check")}
        >
          <Check size={16} />
          Kiểm tra
        </button>
        <button
          className="btn secondary"
          disabled={saving}
          onClick={() => void persist("hint")}
        >
          Gợi ý
        </button>
        <button
          className="btn secondary"
          disabled={saving}
          onClick={() => void persist("reveal")}
        >
          <Eye size={16} />
          Xem đáp án
        </button>
        <button
          className="btn secondary"
          disabled={saving}
          onClick={() => change(q.mode === "order" ? [] : "")}
        >
          <RotateCcw size={15} />
          Làm lại
        </button>
      </div>
      {response.hint && <Status tone="info">Gợi ý: {response.hint}</Status>}
      {error && (
        <>
          <Status>{error}</Status>
          <button
            className="btn secondary"
            onClick={async () => {
              if (!conflict) {
                void persist("save");
                return;
              }
              try {
                const fresh = await api<Session>(
                  "/grammar/sessions/" + sessionId,
                );
                const r = fresh.responses[q.id] || {
                  answer: q.mode === "order" ? [] : "",
                  version: 0,
                };
                current.current = r;
                lastSaved.current = JSON.stringify(r.answer);
                setResponse(r);
                setConflict(false);
                setError(
                  "Đã tải trạng thái mới và giữ nội dung bạn đang nhập. Nhấn Thử lưu lại để lưu nội dung này.",
                );
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          >
            {conflict ? "Tải trạng thái mới, giữ bản nháp" : "Thử lưu lại"}
          </button>
        </>
      )}
      {currentResult && (
        <div
          className={
            "grammar-feedback " +
            (["correct", "matched"].includes(currentResult) ? "positive" : "")
          }
          role="status"
        >
          <strong>{resultLabels[currentResult]}</strong>
          {response.solution && (
            <p lang={q.mode === "vi-ja" || q.mode === "order" ? "ja" : "vi"}>
              {response.solution}
            </p>
          )}
          <p>{response.explanation}</p>
          {currentResult === "needs_review" && (
            <>
              <p>
                Bản dịch khác mẫu vẫn có thể đúng. Đối chiếu ý nghĩa, cấu trúc
                và sắc thái; ứng dụng không tự chấm sai bản dịch này.
              </p>
              <button
                className="btn secondary"
                disabled={saving || response.selfReviewed}
                onClick={() => void persist("self-review")}
              >
                {response.selfReviewed
                  ? "✓ Đã tự đối chiếu"
                  : "Tôi đã tự đối chiếu"}
              </button>
            </>
          )}
          {response.exposed && (
            <small>Làm lại sau khi xem lời giải không được tính thêm XP.</small>
          )}
        </div>
      )}
    </article>
  );
}
export function GrammarExercises() {
  const { patternId } = useParams();
  const [params, setParams] = useSearchParams();
  const mode = (
    modes.includes(params.get("mode") as Mode) ? params.get("mode") : "vi-ja"
  ) as Mode;
  const [session, setSession] = useState<Session | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState("");
  const detail = useData<PatternDetail>("/grammar/patterns/" + patternId);
  useEffect(() => {
    let active = true;
    setSession(null);
    setError("");
    post<Session>("/grammar/patterns/" + patternId + "/sessions")
      .then((s) => {
        if (active) setSession(s);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [patternId]);
  if (error && !session)
    return <ErrorState message={error} retry={() => location.reload()} />;
  if (detail.error)
    return <ErrorState message={detail.error} retry={detail.reload} />;
  if (!session || !detail.data) return <Loading />;
  const count = (m: Mode) =>
    session.questions.filter((q) => q.mode === m).length;
  const checked = Object.values(session.responses).filter(
    (r) => r.result && r.result !== "revealed",
  ).length;
  return (
    <div className="grammar-page">
      <Link className="back-link" to={"/grammar/n2/patterns/" + patternId}>
        ← Quay lại mẫu ngữ pháp
      </Link>
      <div className="grammar-eyebrow">BÀI 01 · THỰC HÀNH</div>
      <PageHead title={detail.data.title} description={detail.data.meaning} />
      <div className="grammar-exercise-progress">
        <span>
          Đã kiểm tra{" "}
          <strong>
            {checked}/{session.questions.length}
          </strong>{" "}
          câu
        </span>
        <span>
          {session.completed
            ? "✓ Đã luyện đủ ba phần"
            : "Tiến độ được lưu theo tài khoản"}
        </span>
      </div>
      <div className="grammar-tabs" role="tablist" aria-label="Dạng bài tập">
        {modes.map((m) => (
          <button
            key={m}
            id={"tab-" + m}
            role="tab"
            aria-selected={mode === m}
            aria-controls={"panel-" + m}
            tabIndex={mode === m ? 0 : -1}
            onKeyDown={(e) => {
              if (["ArrowLeft", "ArrowRight"].includes(e.key)) {
                e.preventDefault();
                const next =
                  modes[
                    (modes.indexOf(m) + (e.key === "ArrowRight" ? 1 : 2)) % 3
                  ];
                setParams({ mode: next }, { replace: true });
                document.getElementById("tab-" + next)?.focus();
              }
            }}
            onClick={() => setParams({ mode: m }, { replace: true })}
          >
            {modeLabels[m]} <span>{count(m)}</span>
          </button>
        ))}
      </div>
      <div className="grammar-instruction">
        {mode === "order"
          ? "Chọn bốn mảnh để ghép thành câu đúng với ý nghĩa đã cho."
          : "Viết bản dịch của bạn trước khi xem đáp án. Kết quả so với mẫu là gợi ý đối chiếu, không thay thế đánh giá của giáo viên."}
      </div>
      {modes.map((m) => (
        <section
          key={m}
          id={"panel-" + m}
          role="tabpanel"
          aria-labelledby={"tab-" + m}
          hidden={mode !== m}
        >
          {session.questions
            .filter((q) => q.mode === m)
            .map((q, i) => (
              <ExerciseCard
                key={session.id + q.id}
                q={q}
                number={i + 1}
                sessionId={session.id}
                initial={session.responses[q.id]}
                onResult={(id, r) =>
                  setSession((s) =>
                    s
                      ? {
                          ...s,
                          responses: { ...s.responses, [id]: r },
                          completed:
                            JSON.stringify(s.responses[id]?.answer) ===
                            JSON.stringify(r.answer)
                              ? s.completed
                              : false,
                        }
                      : s,
                  )
                }
              />
            ))}
        </section>
      ))}
      <Status>{error}</Status>
      <Status tone="success">{notice}</Status>
      <div className="grammar-complete">
        <p>
          Hoàn thành khi đã kiểm tra cả ba dạng và tự đối chiếu các bản dịch
          khác mẫu. “Đã luyện đủ” không có nghĩa đã thành thạo.
        </p>
        <button
          className="btn primary"
          disabled={busy || session.completed}
          onClick={async () => {
            setBusy(true);
            setError("");
            try {
              const s = await post<Session>(
                "/grammar/sessions/" + session.id + "/complete",
              );
              setSession(s);
              setNotice("Đã lưu: bạn đã luyện đủ ba phần của mẫu này.");
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          {session.completed ? "Đã luyện đủ" : "Hoàn thành ba phần"}
        </button>
      </div>
    </div>
  );
}
