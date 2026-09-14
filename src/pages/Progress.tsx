import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Flame,
  GraduationCap,
  Layers,
  Download,
  Trophy,
  ArrowUpRight,
  Check,
} from "lucide-react";
import { useAuth } from "../App";
import { api, useData, dateTime } from "../lib/api";
import {
  Field,
  PageHead,
  Loading,
  ErrorState,
  Status,
  ProgressRing,
  Empty,
} from "../components/ui";
import { Heatmap } from "../components/Heatmap";
import { kindLabels, levels } from "../../shared/domain";
export function Progress() {
  const { data: s, error, reload } = useData("/stats");
  const history = useData<any[]>("/attempts");
  if (error) return <ErrorState message={error} retry={reload} />;
  if (!s) return <Loading />;
  const learned = s.totals.reduce((n: number, t: any) => n + t.learned, 0);
  return (
    <>
      <PageHead
        title="Từng ngày học, từng bước trưởng thành."
        description="Nhìn lại những nỗ lực nhỏ đã tích lũy thành hành trình của bạn."
      />
      <div className="stats-row">
        {[
          { Icon: Flame, label: "Chuỗi hiện tại", value: `${s.streak} ngày` },
          { Icon: GraduationCap, label: "Kiến thức đã ôn", value: learned },
          { Icon: Layers, label: "Lượt ôn thẻ", value: s.totalReviews },
        ].map(({ Icon, label, value }) => (
          <section className="stat" key={label}>
            <span className="stat-icon">
              <Icon />
            </span>
            <div>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          </section>
        ))}
      </div>
      <Heatmap activity={s.heatmap} today={s.today} />
      <div className="dashboard-columns progress-columns">
        <section className="panel">
          <h2>Kho kiến thức đang lớn dần</h2>
          <p className="muted">
            “Đã ôn” nghĩa là đã thực hành ít nhất một lần, chưa đồng nghĩa thành
            thạo.
          </p>
          <div className="knowledge-list">
            {["vocabulary", "kanji", "grammar", "kana"].map((kind) => {
              const row = s.totals.find((t: any) => t.kind === kind) || {
                added: 0,
                learned: 0,
              };
              return (
                <div key={kind}>
                  <div className="section-head">
                    <strong>{kindLabels[kind]}</strong>
                    <span>
                      {row.learned} đã ôn / {row.added} đã thêm
                    </span>
                  </div>
                  <progress max={Math.max(row.added, 1)} value={row.learned} />
                </div>
              );
            })}
          </div>
          <div className="xp-row">
            <Trophy />
            <div>
              <strong>
                {s.xp} XP · Cấp hành trình {Math.floor(s.xp / 200) + 1}
              </strong>
              <small>
                10 XP cho mỗi kiến thức duy nhất trong một ngày. Cấp hành trình
                không phải cấp JLPT.
              </small>
            </div>
          </div>
        </section>
        <section className="panel goal-panel">
          <h2>Hôm nay, bạn đã tiến thêm</h2>
          <ProgressRing value={s.todayCount} goal={s.settings.dailyGoal} />
          <p>{s.todayUnique} kiến thức duy nhất đã luyện</p>
          <Link to="/review" className="btn secondary">
            Tiếp tục ôn tập <ArrowUpRight size={17} />
          </Link>
        </section>
      </div>
      <section className="panel history-panel">
        <div className="section-head">
          <h2>Những bài luyện gần đây</h2>
          <Link to="/practice">Làm bài mới →</Link>
        </div>
        {history.error ? (
          <ErrorState message={history.error} retry={history.reload} />
        ) : !history.data ? (
          <Loading />
        ) : history.data.length ? (
          <div className="history-list">
            {history.data.map((a) => (
              <Link to={`/practice?attempt=${a.id}`} key={a.id}>
                <span className="level">{a.level}</span>
                <strong>{kindLabels[a.kind]}</strong>
                <span>{dateTime(a.date)}</span>
                <b>
                  {a.score}/{a.total} đúng
                </b>
                <ArrowUpRight size={17} />
              </Link>
            ))}
          </div>
        ) : (
          <Empty
            title="Chưa có bài luyện đã nộp"
            to="/practice"
            label="Làm bài đầu tiên"
          >
            Kết quả và lời giải sẽ được lưu ở đây sau khi bạn nộp bài.
          </Empty>
        )}
      </section>
    </>
  );
}
export function SettingsPage() {
  const { user, setUser } = useAuth();
  const [settings, setSettings] = useState(user!.settings);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  return (
    <>
      <PageHead
        title="Nhịp học phù hợp với bạn."
        description="Bắt đầu vừa sức. Sự đều đặn quan trọng hơn một ngày học thật nhiều."
      />
      <div className="settings-layout">
        <form
          noValidate
          className="panel settings-form"
          onSubmit={async (e) => {
            e.preventDefault();
            if (
              settings.dailyGoal < 5 ||
              settings.dailyGoal > 200 ||
              !Number.isInteger(settings.dailyGoal) ||
              settings.retention < 0.8 ||
              settings.retention > 0.97
            ) {
              setError("Mục tiêu từ 5–200 lượt; mức ghi nhớ từ 80–97%.");
              return;
            }
            setBusy(true);
            setError("");
            setMessage("");
            try {
              const next = await api("/settings", {
                method: "PUT",
                body: JSON.stringify(settings),
              });
              setUser({ ...user!, settings: next });
              setMessage("Đã lưu nhịp học của bạn.");
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <h2>Mục tiêu & ôn tập</h2>
          <Field
            label="Mục tiêu mỗi ngày"
            hint="Số lượt ôn thẻ và câu hỏi được trả lời. Từ 5 đến 200 lượt."
          >
            <input
              type="number"
              min={5}
              max={200}
              value={settings.dailyGoal}
              onChange={(e) =>
                setSettings({ ...settings, dailyGoal: Number(e.target.value) })
              }
            />
          </Field>
          <Field label="Cấp độ đang hướng tới">
            <select
              value={settings.level}
              onChange={(e) =>
                setSettings({ ...settings, level: e.target.value })
              }
            >
              {levels.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </Field>
          <Field
            label={`Mức ghi nhớ mong muốn: ${Math.round(settings.retention * 100)}%`}
            hint="FSRS dùng mức này để lập lịch tiếp theo. Tăng mức ghi nhớ thường làm tăng khối lượng ôn. Khởi đầu gợi ý: 90%."
          >
            <input
              type="range"
              min={80}
              max={97}
              value={Math.round(settings.retention * 100)}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  retention: Number(e.target.value) / 100,
                })
              }
            />
          </Field>
          <Status>{error}</Status>
          <Status tone="success">{message}</Status>
          <button className="btn" disabled={busy}>
            <Check size={18} />
            {busy ? "Đang lưu…" : "Lưu cài đặt"}
          </button>
        </form>
        <div className="form-grid">
          <section className="panel">
            <h2>Tài khoản của bạn</h2>
            <dl className="profile">
              <dt>Tên</dt>
              <dd>{user!.name}</dd>
              <dt>Email</dt>
              <dd>{user!.email}</dd>
              <dt>Múi giờ thống kê</dt>
              <dd>Việt Nam · UTC+7</dd>
            </dl>
          </section>
          <section className="panel">
            <h2>Dữ liệu thuộc về bạn</h2>
            <p className="muted">
              Tải bản JSON gồm bộ thẻ, lịch FSRS, lịch sử ôn và kết quả luyện
              tập. Tệp không chứa mật khẩu hay phiên đăng nhập.
            </p>
            <a className="btn secondary" href="/api/export" download>
              <Download size={17} /> Xuất dữ liệu học
            </a>
            <small className="block-note">
              Giữ tệp ở nơi riêng tư. Khôi phục toàn bộ bản sao lưu là tác vụ
              quản trị máy chủ trong bản hiện tại.
            </small>
          </section>
          <section className="panel">
            <h2>Cách hệ thống ghi nhận</h2>
            <p>
              Ngày học được tính theo giờ Việt Nam. Heatmap đếm kiến thức duy
              nhất trong ngày; ôn lại cùng một kiến thức không làm tăng XP của
              ngày đó.
            </p>
            <a
              href="https://docs.ankiweb.net/deck-options.html#fsrs"
              target="_blank"
              rel="noreferrer"
            >
              Tìm hiểu FSRS trong Anki ↗
            </a>
          </section>
        </div>
      </div>
    </>
  );
}
