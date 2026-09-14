import { useRef, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  Plus,
  Search,
  X,
  ArrowRight,
  ChevronRight,
  Pencil,
  Trash2,
  BookOpen,
} from "lucide-react";
import { api, post, useData } from "../lib/api";
import {
  PageHead,
  Loading,
  ErrorState,
  Empty,
  Status,
  Modal,
} from "../components/ui";
import { kindLabels, levels, type Deck } from "../../shared/domain";
import { starters } from "./Dashboard";
export function DeckList() {
  const { data, error, reload } = useData<Deck[]>("/decks");
  const [params, setParams] = useSearchParams();
  const query = params.get("q") || "";
  const [limit, setLimit] = useState(20);
  const [level, setLevel] = useState("N5");
  const [busy, setBusy] = useState("");
  const [actionError, setError] = useState("");
  const ref = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  if (error) return <ErrorState message={error} retry={reload} />;
  if (!data) return <Loading />;
  const filtered = data.filter((d) =>
    `${d.title} ${d.description}`
      .normalize("NFKC")
      .toLowerCase()
      .includes(query.normalize("NFKC").toLowerCase()),
  );
  return (
    <>
      <PageHead
        title="Bộ thẻ của bạn"
        description="Kiến thức của riêng bạn, được sắp xếp để nhớ lâu hơn."
      >
        <Link to="/decks/new" className="btn">
          <Plus size={18} /> Tạo bộ thẻ
        </Link>
      </PageHead>
      <div className="panel">
        <div className="list-toolbar">
          <div className="search-field">
            <Search size={19} />
            <input
              ref={ref}
              aria-label="Tìm bộ thẻ"
              placeholder="Tìm theo tên hoặc mô tả…"
              value={query}
              onChange={(e) => {
                setParams(e.target.value ? { q: e.target.value } : {});
                setLimit(20);
              }}
            />
            {query && (
              <button
                className="icon-btn"
                aria-label="Xóa tìm kiếm"
                onClick={() => {
                  setParams({});
                  ref.current?.focus();
                }}
              >
                <X size={18} />
              </button>
            )}
          </div>
          <span className="muted">{filtered.length} bộ thẻ</span>
        </div>
        {filtered.length ? (
          <div className="deck-rows">
            {filtered.slice(0, limit).map((d) => (
              <Link className="deck-row" to={`/decks/${d.id}`} key={d.id}>
                <span className={`deck-symbol ${d.kind}`} lang="ja">
                  {d.kind === "grammar"
                    ? "文"
                    : d.kind === "kanji"
                      ? "字"
                      : d.kind === "kana"
                        ? "あ"
                        : "語"}
                </span>
                <span className="row-copy">
                  <strong>{d.title}</strong>
                  <small>
                    {kindLabels[d.kind]} · {d.count} thẻ · Đã ôn {d.learned}
                  </small>
                </span>
                <span className="level">{d.level}</span>
                <ChevronRight size={18} />
              </Link>
            ))}
          </div>
        ) : (
          <Empty
            title={
              query
                ? "Chưa tìm thấy bộ thẻ phù hợp"
                : "Trang đầu tiên còn đang chờ bạn"
            }
            to={query ? undefined : "/decks/new"}
          >
            {query
              ? "Thử một từ khóa ngắn hơn."
              : "Tự tạo thẻ, nhập tài liệu hoặc chọn bộ khởi đầu bên dưới."}
          </Empty>
        )}
        {filtered.length > limit && (
          <button
            className="btn secondary"
            onClick={() => setLimit((n) => n + 20)}
          >
            Xem thêm
          </button>
        )}
      </div>
      <section className="starter-section">
        <div className="section-head">
          <div>
            <h2>Một điểm bắt đầu nhỏ</h2>
            <p className="muted">
              Bộ khởi đầu tự biên soạn. Có thể chỉnh sửa sau khi thêm.
            </p>
          </div>
          <label className="inline-field">
            Cấp độ{" "}
            <select value={level} onChange={(e) => setLevel(e.target.value)}>
              {levels.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="starter-grid">
          {starters.map((s) => (
            <article className="panel starter-card" key={s.id}>
              <span className={`deck-symbol ${s.id}`} lang="ja">
                {s.symbol}
              </span>
              <h3>{s.title}</h3>
              <p>{s.description}</p>
              <button
                className="text-button"
                disabled={!!busy}
                onClick={async () => {
                  setBusy(s.id);
                  try {
                    const d = await post(`/starters/${s.id}`, { level });
                    navigate(`/decks/${d.id}`);
                  } catch (e) {
                    setError((e as Error).message);
                  } finally {
                    setBusy("");
                  }
                }}
              >
                {busy === s.id ? "Đang thêm…" : `Thêm bộ ${level}`}
                <ArrowRight size={17} />
              </button>
            </article>
          ))}
        </div>
        <Status>{actionError}</Status>
      </section>
    </>
  );
}
export function DeckDetail() {
  const { id } = useParams();
  const { data: d, error, reload } = useData<Deck>(`/decks/${id}`);
  const [remove, setRemove] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionError, setError] = useState("");
  const [limit, setLimit] = useState(30);
  const navigate = useNavigate();
  if (error) return <ErrorState message={error} retry={reload} />;
  if (!d) return <Loading />;
  const ready = d.notes.filter(
    (n) => n.question && n.question.reviewed !== false,
  ).length;
  return (
    <>
      <Link className="back-link" to="/decks">
        ← Bộ thẻ của bạn
      </Link>
      <PageHead title={d.title} description={d.description}>
        <Link className="btn secondary" to={`/decks/${id}/edit`}>
          <Pencil size={17} /> Chỉnh sửa
        </Link>
        <Link className="btn" to={`/review?deck=${id}`}>
          Ôn bộ này <ArrowRight size={18} />
        </Link>
      </PageHead>
      <div className="detail-meta">
        <span className="level">{d.level}</span>
        <span>{kindLabels[d.kind]}</span>
        <span>{d.notes.length} thẻ</span>
        <span>{ready} câu hỏi đủ dữ kiện</span>
      </div>
      <section className="panel">
        <div className="section-head">
          <h2>Nội dung bộ thẻ</h2>
          <BookOpen size={20} />
        </div>
        <div className="note-list">
          {d.notes.slice(0, limit).map((n, i) => (
            <article key={n.id || i} className="note-row">
              <span className="note-number">{i + 1}</span>
              <div lang="ja">
                <strong>{n.term}</strong>
                <small>{n.reading}</small>
              </div>
              <div>
                <p>{n.meaning}</p>
                {n.example && <small lang="ja">{n.example}</small>}
              </div>
              {n.question && (
                <span className="question-indicator">Có câu hỏi</span>
              )}
            </article>
          ))}
        </div>
        {limit < d.notes.length && (
          <button
            className="btn secondary"
            onClick={() => setLimit((n) => n + 30)}
          >
            Xem thêm thẻ
          </button>
        )}
      </section>
      <div className="detail-actions">
        <p className="muted">
          Mẫu mặt trước: <code>{d.front}</code>
        </p>
        <button className="text-button danger" onClick={() => setRemove(true)}>
          <Trash2 size={16} /> Xóa bộ thẻ
        </button>
      </div>
      <Modal
        open={remove}
        title={`Xóa “${d.title}”?`}
        onClose={() => !busy && setRemove(false)}
      >
        <p>
          Toàn bộ thẻ và lịch ôn của bộ này sẽ bị xóa. Lịch sử hoạt động đã ghi
          nhận vẫn được giữ. Thao tác này không thể hoàn tác.
        </p>
        <Status>{actionError}</Status>
        <div className="button-row">
          <button
            className="btn secondary"
            disabled={busy}
            onClick={() => setRemove(false)}
          >
            Giữ lại
          </button>
          <button
            className="btn danger-solid"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await api(`/decks/${id}`, { method: "DELETE" });
                navigate("/decks");
              } catch (e) {
                setError((e as Error).message);
                setBusy(false);
              }
            }}
          >
            {busy ? "Đang xóa…" : "Xóa bộ thẻ"}
          </button>
        </div>
      </Modal>
    </>
  );
}
