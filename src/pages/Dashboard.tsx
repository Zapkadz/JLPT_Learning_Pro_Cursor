import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  ArrowRight,
  Plus,
  Layers,
  GraduationCap,
  Flame,
  Settings,
  Leaf,
  ChevronRight,
} from "lucide-react";
import { useData, post } from "../lib/api";
import {
  Loading,
  ErrorState,
  PageHead,
  ProgressRing,
  Status,
} from "../components/ui";
import { Heatmap } from "../components/Heatmap";
import { kindLabels, type Deck } from "../../shared/domain";
export const starters = [
  {
    id: "vocabulary",
    title: "Những từ đầu tiên",
    symbol: "初",
    description: "Từ vựng cơ bản, dùng trong giao tiếp hằng ngày.",
  },
  {
    id: "kanji",
    title: "Kanji trong đời sống",
    symbol: "生",
    description: "Học cách đọc và nhận diện chữ trong ngữ cảnh.",
  },
  {
    id: "grammar",
    title: "Ngữ pháp nền tảng",
    symbol: "文",
    description: "Mẫu câu ngắn, giải thích rõ, thực hành ngay.",
  },
];
export function Dashboard() {
  const { data: s, error, reload } = useData("/stats");
  const decks = useData<Deck[]>("/decks");
  const [busy, setBusy] = useState("");
  const [actionError, setError] = useState("");
  const navigate = useNavigate();
  if (error || decks.error)
    return (
      <ErrorState
        message={error || decks.error}
        retry={() => {
          reload();
          decks.reload();
        }}
      />
    );
  if (!s || !decks.data) return <Loading />;
  return (
    <>
      <PageHead
        title="Mỗi ngày một chút, tiến xa hơn."
        description="Bắt đầu bằng những kiến thức cần ôn lại hôm nay."
      >
        <Link className="btn" to="/decks/new">
          <Plus size={18} /> Tạo bộ thẻ
        </Link>
      </PageHead>
      <section className="focus-banner">
        <div>
          <h2>Hôm nay, bạn học gì?</h2>
          <p>Ôn đúng lúc để ghi nhớ lâu hơn.</p>
          <Link to={decks.data.length ? "/review" : "/decks"} className="btn">
            {decks.data.length ? "Bắt đầu ôn tập" : "Chọn bộ thẻ đầu tiên"}
            <ArrowRight size={19} />
          </Link>
        </div>
        <div className="day-art" aria-hidden="true">
          <div className="orbit" />
          <span lang="ja">日</span>
          <div className="day-message">
            <b lang="ja">
              一歩ずつ
              <br />
              前へ
            </b>
            <hr />
            Từng bước nhỏ,
            <br />
            đi xa hơn.
          </div>
        </div>
      </section>
      <div className="stats-row">
        {[
          { label: "Thẻ cần ôn", value: s.due, Icon: Layers },
          { label: "Đã học hôm nay", value: s.todayCount, Icon: GraduationCap },
          { label: "Chuỗi hiện tại", value: `${s.streak} ngày`, Icon: Flame },
        ].map(({ label, value, Icon }, i) => (
          <section className="stat" key={label}>
            <span className={`stat-icon tone-${i}`}>
              <Icon />
            </span>
            <div>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          </section>
        ))}
      </div>
      <div className="dashboard-columns">
        <section className="panel">
          <div className="section-head">
            <h2>Bộ thẻ của bạn</h2>
            <Link to="/decks">
              Xem tất cả <ArrowRight size={15} />
            </Link>
          </div>
          {decks.data.length ? (
            <div className="deck-rows">
              {decks.data.slice(0, 3).map((d) => (
                <Link to={`/decks/${d.id}`} className="deck-row" key={d.id}>
                  <span className={`deck-symbol ${d.kind}`} lang="ja">
                    {d.kind === "grammar"
                      ? "文"
                      : d.kind === "kanji"
                        ? "字"
                        : "語"}
                  </span>
                  <span className="row-copy">
                    <strong>{d.title}</strong>
                    <small>
                      {d.count} thẻ · {kindLabels[d.kind]} · Đã ôn {d.learned}
                    </small>
                  </span>
                  <span className="level">{d.level}</span>
                  <ChevronRight size={17} />
                </Link>
              ))}
            </div>
          ) : (
            <>
              <p className="starter-hint">
                Chọn một bộ khởi đầu để thêm vào thư viện.
              </p>
              <div className="deck-rows">
                {starters.map((d) => (
                  <button
                    className="deck-row"
                    key={d.id}
                    disabled={!!busy}
                    onClick={async () => {
                      setBusy(d.id);
                      try {
                        const result = await post(`/starters/${d.id}`, {
                          level: "N5",
                        });
                        navigate(`/decks/${result.id}`);
                      } catch (e) {
                        setError((e as Error).message);
                      } finally {
                        setBusy("");
                      }
                    }}
                  >
                    <span className={`deck-symbol ${d.id}`} lang="ja">
                      {d.symbol}
                    </span>
                    <span className="row-copy">
                      <strong>{busy === d.id ? "Đang thêm…" : d.title}</strong>
                      <small>{d.description}</small>
                    </span>
                    <span className="level">N5</span>
                    <ChevronRight size={17} />
                  </button>
                ))}
              </div>
            </>
          )}
          <Status>{actionError}</Status>
        </section>
        <section className="panel goal-panel">
          <div className="section-head">
            <h2>Mục tiêu mỗi ngày</h2>
            <Link to="/settings" className="icon-btn" aria-label="Đổi mục tiêu">
              <Settings size={18} />
            </Link>
          </div>
          <ProgressRing value={s.todayCount} goal={s.settings.dailyGoal} />
          <p>Từng bước nhỏ tạo nên thói quen lớn.</p>
          <div className="goal-tip">
            <Leaf size={24} />
            <span>
              {s.todayCount >= s.settings.dailyGoal
                ? "Bạn đã hoàn thành mục tiêu hôm nay. Làm tốt lắm!"
                : "Hãy bắt đầu ôn tập để tiến gần hơn đến mục tiêu hôm nay nhé!"}
            </span>
          </div>
        </section>
      </div>
      <Heatmap activity={s.heatmap} today={s.today} />
    </>
  );
}
