import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, RotateCcw, Check, Eye } from "lucide-react";
import { post, useData, dateTime } from "../lib/api";
import { Loading, ErrorState, PageHead, Status, Empty } from "../components/ui";
type CardView = {
  id: string;
  version: number;
  title: string;
  front: string;
  isNew: boolean;
};
export function Review() {
  const [params] = useSearchParams();
  const query = params.get("deck");
  const { data, error, reload } = useData<CardView[]>(
    `/review${query ? "?deck=" + query : ""}`,
  );
  const [index, setIndex] = useState(0);
  const [back, setBack] = useState<{
    back: string;
    intervals: { rating: number; due: string }[];
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setError] = useState("");
  const [done, setDone] = useState(0);
  const request = useRef("");
  const card = data?.[index];
  useEffect(() => {
    setIndex(0);
    setBack(null);
  }, [data]);
  async function reveal() {
    if (!card || busy) return;
    setBusy(true);
    setError("");
    try {
      setBack(
        await post(`/review/${card.id}/reveal`, { version: card.version }),
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function rate(rating: number) {
    if (!card || !back || busy) return;
    setBusy(true);
    setError("");
    request.current ||= crypto.randomUUID();
    try {
      await post(`/review/${card.id}`, {
        version: card.version,
        rating,
        requestId: request.current,
      });
      request.current = "";
      setBack(null);
      setDone((v) => v + 1);
      setIndex((v) => v + 1);
    } catch (e) {
      setError((e as Error).message);
      request.current = "";
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (
        e.isComposing ||
        ["INPUT", "TEXTAREA", "SELECT", "BUTTON", "A"].includes(
          (e.target as HTMLElement).tagName,
        ) ||
        e.ctrlKey ||
        e.altKey ||
        e.metaKey
      )
        return;
      if (e.code === "Space" && !back) {
        e.preventDefault();
        void reveal();
      } else if (back && ["1", "2", "3", "4"].includes(e.key)) {
        e.preventDefault();
        void rate(Number(e.key));
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  });
  if (error) return <ErrorState message={error} retry={reload} />;
  if (!data) return <Loading />;
  const interval = (due: string) => {
    const minutes = Math.max(
      1,
      Math.round((new Date(due).getTime() - Date.now()) / 60000),
    );
    return minutes < 60
      ? `${minutes} phút`
      : minutes < 1440
        ? `${Math.round(minutes / 60)} giờ`
        : `${Math.round(minutes / 1440)} ngày`;
  };
  return (
    <>
      <PageHead
        title="Một lần gợi nhớ, một bước tiến."
        description="Thử trả lời trong đầu trước khi mở mặt sau. Không cần vội."
      />
      <div className="study-container">
        {card ? (
          <>
            <div className="study-top">
              <Link to="/decks">← Kết thúc phiên</Link>
              <span>{card.title}</span>
              <span>
                {index + 1} / {data.length}
              </span>
            </div>
            <progress
              className="study-progress"
              value={index}
              max={data.length}
            />
            <section className="flashcard">
              <span className="flashcard-label">
                {card.isNew ? "THẺ MỚI" : "ĐẾN HẠN ÔN"} · CHỦ ĐỘNG GỢI NHỚ
              </span>
              <div className="flashcard-front" lang="ja">
                {card.front}
              </div>
              {back ? (
                <div className="flashcard-back" lang="ja">
                  {back.back}
                </div>
              ) : (
                <p className="muted">Bạn còn nhớ cách đọc và ý nghĩa không?</p>
              )}
            </section>
            <Status>{actionError}</Status>
            {back ? (
              <>
                <p className="rating-intro">
                  Bạn đã nhớ như thế nào? Đánh giá trung thực để lịch ôn phù hợp
                  hơn.
                </p>
                <div className="rating-buttons">
                  {[
                    { name: "Quên", hint: "Không nhớ", tone: "again" },
                    { name: "Khó", hint: "Nhớ nhưng khó", tone: "hard" },
                    { name: "Được", hint: "Nhớ đúng", tone: "good" },
                    { name: "Dễ", hint: "Nhớ nhanh", tone: "easy" },
                  ].map((r, i) => (
                    <button
                      key={r.name}
                      className={`rating ${r.tone}`}
                      disabled={busy}
                      onClick={() => rate(i + 1)}
                    >
                      <small>
                        {i + 1} · {r.hint}
                      </small>
                      <strong>{r.name}</strong>
                      <span>{interval(back.intervals[i].due)}</span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="reveal-action">
                <button className="btn" disabled={busy} onClick={reveal}>
                  <Eye size={18} />
                  {busy ? "Đang mở…" : "Hiện đáp án"}
                </button>
                <small>Hoặc nhấn phím Space</small>
              </div>
            )}
            <p className="study-foot">
              FSRS · Mỗi thẻ có lịch riêng · {done} lượt đã hoàn thành trong
              phiên
            </p>
          </>
        ) : (
          <section className="panel">
            <Empty
              title={
                done ? "Bạn đã hoàn thành lượt ôn này!" : "Chưa có thẻ đến hạn"
              }
              to="/decks"
              label={done ? "Về bộ thẻ" : "Chọn hoặc tạo bộ thẻ"}
            >
              {done
                ? `Bạn đã gợi nhớ ${done} lần. Những thẻ cần học lại sẽ xuất hiện khi đến hạn.`
                : "Thêm một bộ thẻ để bắt đầu, hoặc quay lại khi có lịch ôn mới."}
            </Empty>
            <div className="button-row centered">
              <button className="btn secondary" onClick={reload}>
                <RotateCcw size={17} /> Kiểm tra thẻ đến hạn
              </button>
              <Link to="/progress" className="text-button">
                Xem tiến độ <ArrowRight size={17} />
              </Link>
            </div>
            <NextReview />
          </section>
        )}
      </div>
    </>
  );
}
function NextReview() {
  const { data } = useData("/stats");
  return data?.next ? (
    <p className="center muted">
      <Check size={15} /> Lịch ôn gần nhất: {dateTime(data.next)}
    </p>
  ) : null;
}
