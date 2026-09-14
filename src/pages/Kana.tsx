import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { kanaGroups, kanaRows } from "../../shared/kana";
import { post } from "../lib/api";
import { PageHead, Status } from "../components/ui";
export function Kana() {
  const [katakana, setKatakana] = useState(false);
  const [group, setGroup] = useState(0);
  const [show, setShow] = useState(false);
  const [selected, setSelected] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  return (
    <>
      <PageHead
        title="Bắt đầu từ những nét chữ."
        description="Làm quen với kana, rồi đưa vào lịch ôn để ghi nhớ vững hơn."
      >
        <button
          className="btn"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              const d = await post("/kana", { group, katakana });
              navigate(`/review?deck=${d.id}`);
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? "Đang tạo thẻ…" : "Học nhóm âm này"}
          <ArrowRight size={18} />
        </button>
      </PageHead>
      <Status>{error}</Status>
      <section className="panel">
        <div className="section-head">
          <div className="segmented" role="group" aria-label="Bảng chữ">
            <button
              className={!katakana ? "active" : ""}
              onClick={() => {
                setKatakana(false);
                setSelected("");
              }}
            >
              Hiragana <span lang="ja">あ</span>
            </button>
            <button
              className={katakana ? "active" : ""}
              onClick={() => {
                setKatakana(true);
                setSelected("");
              }}
            >
              Katakana <span lang="ja">ア</span>
            </button>
          </div>
          <button className="text-button" onClick={() => setShow(!show)}>
            {show ? <EyeOff size={17} /> : <Eye size={17} />}{" "}
            {show ? "Ẩn romaji" : "Hiện romaji"}
          </button>
        </div>
        <div className="filter-tabs" role="group" aria-label="Nhóm âm">
          {kanaGroups.map((g, i) => (
            <button
              key={g.name}
              className={group === i ? "active" : ""}
              onClick={() => {
                setGroup(i);
                setSelected("");
              }}
            >
              {g.name}
            </button>
          ))}
        </div>
        <p className="muted">Nhìn chữ, thử nhớ âm, rồi chạm để kiểm tra.</p>
        <div className="kana-grid">
          {kanaRows(group, katakana).map((n, i) => (
            <button
              key={i}
              className={
                selected === n.term ? "kana-cell selected" : "kana-cell"
              }
              onClick={() => setSelected(selected === n.term ? "" : n.term)}
              aria-label={`Chữ ${n.term}; nhấn để xem âm`}
            >
              <strong lang="ja">{n.term}</strong>
              <span>{show || selected === n.term ? n.meaning : "·"}</span>
            </button>
          ))}
        </div>
        <p className="kana-note">
          {selected
            ? `${selected} → ${kanaRows(group, katakana).find((n) => n.term === selected)?.meaning}`
            : "Chọn một chữ để xem cách đọc."}
        </p>
      </section>
      <div className="two-columns kana-lessons">
        <section className="panel">
          <h2>Chữ nhỏ, khác biệt lớn</h2>
          <p lang="ja" className="japanese-example">
            きゃ ≠ きや　・　がっこう
          </p>
          <p>
            ゃ・ゅ・ょ nhỏ kết hợp với âm trước. っ nhỏ tạo một nhịp ngắt trước
            phụ âm tiếp theo; không đọc thành “tsu”.
          </p>
        </section>
        <section className="panel">
          <h2>Để ý trường âm & trợ từ</h2>
          <p lang="ja" className="japanese-example">
            おばさん ≠ おばあさん　・　コーヒー
          </p>
          <p>
            Âm dài thêm một mora. Katakana thường dùng ー. は và へ khi là trợ
            từ đọc là wa và e; を thường đọc o. ぢ/じ và づ/ず thường trùng âm
            trong tiếng Nhật chuẩn, nhưng khác cách viết.
          </p>
        </section>
      </div>
    </>
  );
}
