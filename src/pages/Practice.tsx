import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  RotateCcw,
  BookOpen,
} from "lucide-react";
import { api, post, useData } from "../lib/api";
import {
  Field,
  PageHead,
  Status,
  Loading,
  ErrorState,
  Modal,
} from "../components/ui";
import {
  levels,
  kindLabels,
  typeLabels,
  questionTypes,
  allowedType,
  type Deck,
  type Question,
} from "../../shared/domain";
type Attempt = {
  id: string;
  questions: Question[];
  score?: number;
  answers?: number[];
  completedAt?: string;
};
export function Practice() {
  const [params, setParams] = useSearchParams();
  const [kind, setKind] = useState("kanji");
  const [level, setLevel] = useState("N5");
  const [type, setType] = useState("");
  const [deckId, setDeckId] = useState("");
  const [count, setCount] = useState(10);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [index, setIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState(false);
  const decks = useData<Deck[]>("/decks");
  const catalog = useData<any[]>("/practice/catalog");
  const attemptId = params.get("attempt");
  useEffect(() => {
    const controller = new AbortController();
    if (!attemptId) {
      setAttempt(null);
      return;
    }
    setLoading(true);
    setError("");
    api<Attempt>(`/practice/${attemptId}`, { signal: controller.signal })
      .then((a) => {
        setAttempt(a);
        let saved: number[] | null = null;
        try {
          saved = JSON.parse(
            sessionStorage.getItem("answers-" + a.id) || "null",
          );
        } catch {
          /* Ignore invalid transient cache. */
        }
        setAnswers(
          a.answers ||
            (Array.isArray(saved) && saved.length === a.questions.length
              ? saved
              : a.questions.map(() => -1)),
        );
        setIndex(0);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [attemptId]);
  async function start() {
    setBusy(true);
    setError("");
    try {
      const result = await post("/practice", {
        kind,
        level,
        count,
        ...(deckId ? { deckId } : {}),
        ...(type ? { type } : {}),
      });
      setParams({ attempt: result.id });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function submit() {
    if (!attempt) return;
    setConfirm(false);
    setBusy(true);
    setError("");
    try {
      const result = await post(`/practice/${attempt.id}/submit`, { answers });
      setAttempt(result);
      sessionStorage.removeItem("answers-" + attempt.id);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const question = attempt?.questions[index];
  const submitted = !!attempt?.completedAt;
  const filteredDecks =
    decks.data?.filter((d) => d.kind === kind && d.level === level) || [];
  if (loading) return <Loading />;
  return (
    <>
      <PageHead
        title={
          submitted
            ? "Nhìn lại để nhớ lâu hơn."
            : attempt
              ? "Tập trung vào từng câu hỏi."
              : "Hiểu kiến thức. Làm chủ dạng đề."
        }
        description={
          attempt
            ? "Bài luyện tập độc lập · Kết quả không quy đổi sang điểm JLPT."
            : "Kanji, từ vựng và ngữ pháp — ba kỹ năng, ba không gian luyện tập."
        }
      />
      <Status>{error}</Status>
      {!attempt ? (
        <>
          <section className="panel practice-setup">
            <div
              className="subject-tabs"
              role="group"
              aria-label="Phân môn luyện tập"
            >
              {["kanji", "vocabulary", "grammar"].map((k, i) => (
                <button
                  key={k}
                  className={kind === k ? "active" : ""}
                  onClick={() => {
                    setKind(k);
                    setDeckId("");
                    setType("");
                  }}
                >
                  <span lang="ja">{["漢", "語", "文"][i]}</span>
                  <strong>{kindLabels[k]}</strong>
                  <small>
                    {
                      [
                        "Cách đọc & cách viết",
                        "Ý nghĩa & cách dùng",
                        "Cấu trúc & mạch văn",
                      ][i]
                    }
                  </small>
                </button>
              ))}
            </div>
            <div className="practice-settings">
              <Field label="Cấp độ JLPT">
                <select
                  value={level}
                  onChange={(e) => {
                    setLevel(e.target.value);
                    setDeckId("");
                    setType("");
                  }}
                >
                  {levels.map((l) => (
                    <option key={l}>{l}</option>
                  ))}
                </select>
              </Field>
              <Field label="Nguồn câu hỏi">
                <select
                  value={deckId}
                  onChange={(e) => setDeckId(e.target.value)}
                >
                  <option value="">Kho khởi đầu</option>
                  {filteredDecks.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.title}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Dạng câu hỏi">
                <select value={type} onChange={(e) => setType(e.target.value)}>
                  <option value="">Tất cả dạng phù hợp</option>
                  {questionTypes
                    .filter((t) => allowedType(kind, level, t))
                    .map((t) => (
                      <option key={t} value={t}>
                        {typeLabels[t]}
                      </option>
                    ))}
                </select>
              </Field>
              <Field label="Số câu tối đa">
                <select
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                >
                  {[5, 10, 20, 30].map((n) => (
                    <option key={n} value={n}>
                      {n} câu
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="practice-start">
              <p>
                <strong>
                  {kindLabels[kind]} · {level}
                </strong>
                <br />
                <span className="muted">
                  {deckId
                    ? "Chỉ dùng thẻ có đầy đủ câu hỏi và lời giải."
                    : `${catalog.data?.find((c) => c.level === level)?.counts[kind] ?? "…"} câu trong kho khởi đầu trước khi lọc dạng.`}{" "}
                  Không lặp câu để đủ số lượng.
                </span>
              </p>
              <button className="btn" disabled={busy} onClick={start}>
                {busy ? "Đang tạo bài…" : "Bắt đầu luyện tập"}
                <ArrowRight size={18} />
              </button>
            </div>
          </section>
          <div className="two-columns practice-guidance">
            <section>
              <h2>Học cả lý do mình nhầm.</h2>
              <p>
                Câu hỏi có ngữ cảnh, bốn lựa chọn và lời giải sau khi nộp. Chú ý
                trường âm, âm ngắt, âm ghép và cách kết hợp từ.
              </p>
            </section>
            <section>
              <h2>Tài liệu của bạn, bài luyện của bạn.</h2>
              <p>
                Thêm câu hỏi trong trình soạn bộ thẻ hoặc nhập CSV có cột đáp
                án. Câu thiếu dữ kiện sẽ không được đưa vào bài.
              </p>
              <a
                href="https://www.jlpt.jp/e/samples/forlearners.html"
                target="_blank"
                rel="noreferrer"
              >
                Tham khảo dạng câu JLPT chính thức ↗
              </a>
            </section>
          </div>
          {decks.error && (
            <ErrorState message={decks.error} retry={decks.reload} />
          )}
        </>
      ) : submitted ? (
        <>
          <section className="panel result-summary">
            <span className="result-icon">
              <Check size={30} />
            </span>
            <div>
              <h2>
                {attempt.score} / {attempt.questions.length} câu đúng
              </h2>
              <p>
                Điểm luyện tập:{" "}
                {Math.round(
                  ((attempt.score || 0) / attempt.questions.length) * 100,
                )}
                %. Xem lời giải để hiểu rõ từng lựa chọn.
              </p>
            </div>
            <button
              className="btn secondary"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  const next = await post(`/practice/${attempt.id}/retry`);
                  setParams({ attempt: next.id });
                } catch (e) {
                  setError((e as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              <RotateCcw size={17} />{" "}
              {(attempt.score || 0) < attempt.questions.length
                ? "Luyện lại câu sai"
                : "Làm lại bài này"}
            </button>
            <button className="text-button" onClick={() => setParams({})}>
              Chọn bài mới
            </button>
          </section>
          <div className="results-list">
            {attempt.questions.map((q, i) => {
              const correct = attempt.answers![i] === q.answer;
              return (
                <article className="panel result-question" key={q.id}>
                  <div className="section-head">
                    <span
                      className={`result-label ${correct ? "correct" : "incorrect"}`}
                    >
                      {correct
                        ? "✓ Đúng"
                        : attempt.answers![i] === -1
                          ? "— Bỏ trống"
                          : "✕ Cần ôn lại"}{" "}
                      · Câu {i + 1}
                    </span>
                    <span className="muted">{typeLabels[q.type]}</span>
                  </div>
                  <p className="question-text" lang="ja">
                    <JapanesePrompt text={q.prompt} />
                  </p>
                  <p>
                    Đáp án đúng:{" "}
                    <strong lang="ja">{q.options[q.answer]}</strong>
                    {!correct && attempt.answers![i] >= 0 && (
                      <>
                        {" "}
                        · Bạn chọn:{" "}
                        <span lang="ja">{q.options[attempt.answers![i]]}</span>
                      </>
                    )}
                  </p>
                  <div className="explanation">
                    <BookOpen size={19} />
                    <p>{q.explanation}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </>
      ) : (
        question && (
          <div className="quiz-layout">
            <section className="panel quiz-panel">
              <div className="section-head">
                <span>
                  {typeLabels[question.type]} · {question.level}
                </span>
                <strong>
                  Câu {index + 1} / {attempt.questions.length}
                </strong>
              </div>
              <p className="quiz-instruction">Chọn một đáp án phù hợp nhất.</p>
              <p className="question-text" lang="ja">
                <JapanesePrompt text={question.prompt} />
              </p>
              <fieldset className="answer-options">
                <legend className="sr-only">Đáp án câu {index + 1}</legend>
                {question.options.map((option, i) => (
                  <label
                    key={i}
                    className={
                      answers[index] === i ? "answer selected" : "answer"
                    }
                  >
                    <input
                      type="radio"
                      name={`answer-${index}`}
                      checked={answers[index] === i}
                      onChange={() => {
                        const next = answers.map((a, j) =>
                          j === index ? i : a,
                        );
                        setAnswers(next);
                        try {
                          sessionStorage.setItem(
                            "answers-" + attempt.id,
                            JSON.stringify(next),
                          );
                        } catch {
                          /* Answers remain in memory if session storage is unavailable. */
                        }
                      }}
                    />
                    <span className="answer-number">{i + 1}</span>
                    <span lang="ja">{option}</span>
                  </label>
                ))}
              </fieldset>
              <div className="quiz-controls">
                <button
                  className="btn secondary"
                  disabled={index === 0}
                  onClick={() => setIndex((v) => v - 1)}
                >
                  <ArrowLeft size={17} /> Câu trước
                </button>
                {index < attempt.questions.length - 1 ? (
                  <button
                    className="btn"
                    onClick={() => setIndex((v) => v + 1)}
                  >
                    Câu tiếp <ArrowRight size={17} />
                  </button>
                ) : (
                  <button
                    className="btn"
                    disabled={busy}
                    onClick={() =>
                      answers.includes(-1) ? setConfirm(true) : submit()
                    }
                  >
                    {busy ? "Đang chấm…" : "Nộp bài"}
                  </button>
                )}
              </div>
            </section>
            <aside className="panel quiz-nav">
              <h2>Tiến độ bài làm</h2>
              <p>
                {answers.filter((a) => a >= 0).length} / {answers.length} câu đã
                trả lời
              </p>
              <div className="question-nav">
                {attempt.questions.map((q, i) => (
                  <button
                    key={q.id}
                    aria-label={`Đến câu ${i + 1}${answers[i] >= 0 ? ", đã trả lời" : ""}`}
                    aria-current={i === index ? "step" : undefined}
                    className={`${answers[i] >= 0 ? "answered" : ""} ${i === index ? "current" : ""}`}
                    onClick={() => setIndex(i)}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <p className="muted">
                Có thể đổi đáp án trước khi nộp. Bài chưa nộp chưa được ghi vào
                tiến độ.
              </p>
              <button
                className="btn secondary full"
                disabled={busy}
                onClick={() =>
                  answers.includes(-1) ? setConfirm(true) : submit()
                }
              >
                Nộp bài
              </button>
              <button className="text-button" onClick={() => setParams({})}>
                Về chọn bài
              </button>
              <small>{question.source}</small>
            </aside>
          </div>
        )
      )}
      <Modal
        open={confirm}
        title="Nộp bài còn câu trống?"
        onClose={() => setConfirm(false)}
      >
        <p>
          Bạn còn {answers.filter((a) => a === -1).length} câu chưa trả lời. Câu
          trống không có điểm.
        </p>
        <div className="button-row">
          <button className="btn secondary" onClick={() => setConfirm(false)}>
            Tiếp tục làm
          </button>
          <button className="btn" onClick={submit}>
            Nộp bài
          </button>
        </div>
      </Modal>
    </>
  );
}
function JapanesePrompt({ text }: { text: string }) {
  return (
    <>
      {text
        .split(/(【[^】]+】)/)
        .map((part, i) =>
          part.startsWith("【") ? <u key={i}>{part.slice(1, -1)}</u> : part,
        )}
    </>
  );
}
