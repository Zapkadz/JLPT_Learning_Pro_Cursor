import { useEffect, useRef, useState } from "react";
import { Link, useBlocker, useNavigate, useParams } from "react-router-dom";
import { Plus, Trash2, Upload, Check, ArrowRight } from "lucide-react";
import { api, post } from "../lib/api";
import { Field, PageHead, Status, Modal, Loading } from "../components/ui";
import {
  deckSchema,
  validationMessage,
  parseImport,
  importPlaceholder,
  renderTemplate,
  levels,
  kinds,
  kindLabels,
  typeLabels,
  questionTypes,
  allowedType,
  type Note,
  type Deck,
} from "../../shared/domain";
import { useAuth } from "../App";
import { suggestKanjiQuestion } from "../../shared/generate";
const blank = (): Note => ({ term: "", reading: "", meaning: "", example: "" });
const initial = {
  title: "",
  description: "",
  kind: "vocabulary",
  level: "N5",
  front: "{term}",
  back: "{reading}\n{meaning}\n{example}",
  notes: [blank()],
  version: 0,
};
export function DeckEditor() {
  const { id } = useParams();
  const { user } = useAuth();
  const draftKey = `kotoba-draft-${user?.id || "pending"}-${id || "new"}`;
  const [draft, setDraft] = useState<typeof initial>(initial);
  const [ready, setReady] = useState(!id);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");
  const [mode, setMode] = useState("manual");
  const [raw, setRaw] = useState("");
  const [delimiter, setDelimiter] = useState("\t");
  const [rowDelimiter, setRowDelimiter] = useState("\n");
  const [header, setHeader] = useState(false);
  const [limit, setLimit] = useState(20);
  const saved = useRef(false);
  const errorRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const blocker = useBlocker(() => dirty && !saved.current);
  const parsed = parseImport(raw, delimiter, rowDelimiter, header);
  useEffect(() => {
    if (Object.keys(fieldErrors).length)
      (
        document.querySelector('[aria-invalid="true"]') as HTMLElement | null
      )?.focus();
  }, [fieldErrors]);
  useEffect(() => {
    let live = true;
    const draftText = sessionStorage.getItem(draftKey);
    if (draftText) {
      try {
        const restored = JSON.parse(draftText);
        if (restored && Array.isArray(restored.notes)) {
          setDraft(restored);
          setDirty(true);
          setNotice("Đã khôi phục bản nháp trên thiết bị này.");
          setReady(true);
          return;
        }
      } catch {
        sessionStorage.removeItem(draftKey);
      }
    }
    if (id)
      api<Deck>(`/decks/${id}`)
        .then((d) => {
          if (live) {
            setDraft({ ...d, notes: d.notes });
            setReady(true);
          }
        })
        .catch((e) => {
          if (live) setError(e.message);
        });
    else {
      setDraft(initial);
      setReady(true);
    }
    return () => {
      live = false;
    };
  }, [id, draftKey]);
  useEffect(() => {
    if (dirty) {
      try {
        sessionStorage.setItem(draftKey, JSON.stringify(draft));
      } catch {
        setNotice(
          "Không thể lưu bản nháp trên thiết bị. Hãy lưu bộ thẻ trước khi đóng trang.",
        );
      }
    }
    const handler = (e: BeforeUnloadEvent) => {
      if (dirty && !saved.current) e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [draft, dirty, draftKey]);
  function change(patch: Partial<typeof initial>) {
    setDraft((d) => ({ ...d, ...patch }));
    setDirty(true);
  }
  function updateNote(index: number, patch: Partial<Note>) {
    change({
      notes: draft.notes.map((n, i) => (i === index ? { ...n, ...patch } : n)),
    });
  }
  async function save() {
    const result = deckSchema.safeParse(draft);
    if (!result.success) {
      setError(validationMessage(result.error.issues));
      setFieldErrors(
        Object.fromEntries(
          result.error.issues.map((i) => [i.path.join("."), i.message]),
        ),
      );
      errorRef.current?.focus();
      return;
    }
    setBusy(true);
    setError("");
    setFieldErrors({});
    try {
      const result = id
        ? await api(`/decks/${id}`, {
            method: "PUT",
            body: JSON.stringify(draft),
          })
        : await post("/decks", draft);
      saved.current = true;
      setDirty(false);
      sessionStorage.removeItem(draftKey);
      navigate(`/decks/${result.id}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (!ready && !error) return <Loading />;
  return (
    <>
      <Link className="back-link" to={id ? `/decks/${id}` : "/decks"}>
        ← {id ? "Chi tiết bộ thẻ" : "Bộ thẻ của bạn"}
      </Link>
      <PageHead
        title={id ? "Chỉnh sửa bộ thẻ" : "Tạo một bộ thẻ mới"}
        description="Biến tài liệu của bạn thành những điều nhớ lâu."
      >
        <button className="btn" disabled={busy || !ready} onClick={save}>
          <Check size={18} />
          {busy ? "Đang lưu…" : "Lưu bộ thẻ"}
        </button>
      </PageHead>
      <div ref={errorRef} tabIndex={-1}>
        <Status>{error}</Status>
      </div>
      <Status tone="info">{notice}</Status>
      {draft.kind === "kanji" && (
        <section className="panel generation-panel">
          <div>
            <h2>Tạo gợi ý câu hỏi từ Kanji</h2>
            <p className="muted">
              Cần từ, một cách đọc hiragana và câu ví dụ chứa từ đó. Gợi ý chưa
              được dùng trong bài luyện cho đến khi bạn kiểm tra và xác nhận
              từng câu.
            </p>
          </div>
          <button
            className="btn secondary"
            disabled={busy}
            onClick={() => {
              const results = draft.notes.map(suggestKanjiQuestion);
              const added = results.filter(
                (r, i) => r.note.question && !draft.notes[i].question,
              ).length;
              change({ notes: results.map((r) => r.note) });
              setMode("manual");
              setNotice(
                `Đã gợi ý ${added} câu. ${results
                  .filter((r) => r.reason)
                  .slice(0, 3)
                  .map((r) => `${r.note.term || "Thẻ trống"}: ${r.reason}`)
                  .join(" ")} Mở phần câu hỏi để kiểm tra và xác nhận.`,
              );
            }}
          >
            Gợi ý câu hỏi
          </button>
        </section>
      )}
      <div className="editor-layout">
        <div>
          <section className="panel form-grid">
            <Field label="Tên bộ thẻ" error={fieldErrors.title}>
              <input
                value={draft.title}
                maxLength={120}
                placeholder="Ví dụ: Minna no Nihongo — Bài 1"
                onChange={(e) => change({ title: e.target.value })}
              />
            </Field>
            <Field label="Mô tả">
              <input
                value={draft.description}
                maxLength={1000}
                placeholder="Bạn muốn ghi nhớ điều gì?"
                onChange={(e) => change({ description: e.target.value })}
              />
            </Field>
            <div className="two-fields">
              <Field label="Phân môn">
                <select
                  value={draft.kind}
                  onChange={(e) => change({ kind: e.target.value })}
                >
                  {kinds.map((k) => (
                    <option value={k} key={k}>
                      {kindLabels[k]}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Cấp độ">
                <select
                  value={draft.level}
                  onChange={(e) => change({ level: e.target.value })}
                >
                  {levels.map((l) => (
                    <option key={l}>{l}</option>
                  ))}
                </select>
              </Field>
            </div>
          </section>
          <div className="editor-tabs" role="group" aria-label="Cách nhập thẻ">
            <button
              className={mode === "manual" ? "active" : ""}
              onClick={() => setMode("manual")}
            >
              Nhập từng thẻ
            </button>
            <button
              className={mode === "import" ? "active" : ""}
              onClick={() => setMode("import")}
            >
              <Upload size={17} /> Nhập hàng loạt
            </button>
          </div>
          {mode === "import" ? (
            <section className="panel import-panel">
              <h2>Dán tài liệu, tạo thẻ nhanh</h2>
              <p className="muted">
                Không có hàng tiêu đề: từ → nghĩa → cách đọc → ví dụ. Hai trường
                đầu bắt buộc.
              </p>
              <div className="two-fields">
                <Field label="Giữa các trường">
                  <select
                    value={
                      ["\t", ",", ";", "|"].includes(delimiter)
                        ? delimiter
                        : "custom"
                    }
                    onChange={(e) =>
                      setDelimiter(
                        e.target.value === "custom" ? "::" : e.target.value,
                      )
                    }
                  >
                    <option value={"\t"}>Tab (Excel / Sheets)</option>
                    <option value=",">Dấu phẩy</option>
                    <option value=";">Chấm phẩy</option>
                    <option value="|">Dấu |</option>
                    <option value="custom">Tùy chỉnh</option>
                  </select>
                </Field>
                <Field label="Giữa các thẻ">
                  <select
                    value={
                      ["\n", ";"].includes(rowDelimiter)
                        ? rowDelimiter
                        : "custom"
                    }
                    onChange={(e) =>
                      setRowDelimiter(
                        e.target.value === "custom" ? "##" : e.target.value,
                      )
                    }
                  >
                    <option value={"\n"}>Dòng mới</option>
                    <option value=";">Chấm phẩy</option>
                    <option value="custom">Tùy chỉnh</option>
                  </select>
                </Field>
              </div>
              {!["\t", ",", ";", "|"].includes(delimiter) && (
                <Field label="Dấu phân cách trường tùy chỉnh">
                  <input
                    value={delimiter}
                    onChange={(e) => setDelimiter(e.target.value)}
                  />
                </Field>
              )}
              {!["\n", ";"].includes(rowDelimiter) && (
                <Field label="Dấu phân cách thẻ tùy chỉnh">
                  <input
                    value={rowDelimiter}
                    onChange={(e) => setRowDelimiter(e.target.value)}
                  />
                </Field>
              )}
              <Field label="Nội dung nhập">
                <textarea
                  className="resize-none"
                  style={{ resize: "none" }}
                  rows={8}
                  value={raw}
                  onChange={(e) => setRaw(e.target.value)}
                  placeholder={importPlaceholder(
                    delimiter,
                    rowDelimiter,
                    header,
                  )}
                />
              </Field>
              <div className="import-actions">
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={header}
                    onChange={(e) => setHeader(e.target.checked)}
                  />{" "}
                  Dòng đầu là tên cột
                </label>
                <label className="file-button">
                  <Upload size={17} /> Chọn TXT / CSV / TSV
                  <input
                    type="file"
                    accept=".txt,.csv,.tsv"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      if (
                        f.size > 2_000_000 ||
                        !/\.(txt|csv|tsv)$/i.test(f.name)
                      ) {
                        setError("Chọn tệp TXT, CSV hoặc TSV dưới 2 MB.");
                        return;
                      }
                      try {
                        setRaw(await f.text());
                        if (f.name.endsWith(".csv")) setDelimiter(",");
                        if (f.name.endsWith(".tsv")) setDelimiter("\t");
                        setError("");
                      } catch {
                        setError("Không đọc được tệp. Hãy thử dán nội dung.");
                      }
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>
              <details>
                <summary>Định dạng có câu hỏi trắc nghiệm</summary>
                <p>
                  Dùng hàng tiêu đề:{" "}
                  <code>
                    term,meaning,reading,example,question,type,option1,option2,option3,option4,answer,explanation
                  </code>
                  . answer từ 1–4. type: {questionTypes.join(", ")}. Trường chứa
                  dấu phẩy cần đặt trong dấu ngoặc kép.
                </p>
                <button
                  className="text-button"
                  onClick={() => {
                    setDelimiter(",");
                    setRowDelimiter("\n");
                    setHeader(true);
                    setRaw(
                      "term,meaning,reading,example,question,type,option1,option2,option3,option4,answer,explanation\n学校,Trường học,がっこう,学校へ行きます。,毎日【学校】へ行きます。,reading,がこう,がっこう,がっこ,かっこう,2,学校 đọc がっこう: có âm ngắt và trường âm.",
                    );
                    change({ kind: "kanji" });
                  }}
                >
                  Dùng ví dụ Kanji
                </button>
              </details>
              <div className="import-preview">
                <h3>Xem trước · {parsed.notes.length} thẻ</h3>
                {parsed.duplicates > 0 && (
                  <Status tone="info">
                    Đã bỏ {parsed.duplicates} dòng trùng trong dữ liệu nhập.
                  </Status>
                )}
                {raw && parsed.errors.length > 0 && (
                  <Status>{parsed.errors.slice(0, 5).join(" ")}</Status>
                )}
                {parsed.notes.slice(0, 5).map((n, i) => (
                  <div className="preview-row" key={i}>
                    <strong lang="ja">{n.term}</strong>
                    <span>{n.reading}</span>
                    <span>{n.meaning}</span>
                  </div>
                ))}
                {parsed.notes.length > 5 && (
                  <small>Và {parsed.notes.length - 5} thẻ khác.</small>
                )}
                <button
                  className="btn"
                  disabled={!parsed.notes.length || !!parsed.errors.length}
                  onClick={() => {
                    const existing = draft.notes.filter(
                      (n) => n.term.trim() || n.meaning.trim(),
                    );
                    if (existing.length + parsed.notes.length > 500) {
                      setError("Mỗi bộ tối đa 500 thẻ.");
                      return;
                    }
                    change({ notes: [...existing, ...parsed.notes] });
                    setNotice(
                      `Đã thêm ${parsed.notes.length} thẻ vào bản nháp. Lưu bộ thẻ để hoàn tất.`,
                    );
                    setRaw("");
                    setMode("manual");
                  }}
                >
                  Thêm {parsed.notes.length} thẻ vào bộ <ArrowRight size={18} />
                </button>
              </div>
            </section>
          ) : (
            <>
              <div className="section-head">
                <h2>{draft.notes.length} thẻ trong bộ</h2>
                <span className="muted">Tối đa 500 thẻ</span>
              </div>
              {draft.notes.slice(0, limit).map((n, i) => (
                <section className="panel note-editor" key={n.id || i}>
                  <div className="section-head">
                    <span className="note-number">THẺ {i + 1}</span>
                    <button
                      className="icon-btn"
                      aria-label={`Xóa thẻ ${i + 1} khỏi bản nháp`}
                      disabled={draft.notes.length === 1}
                      onClick={() =>
                        change({
                          notes: draft.notes.filter((_, index) => index !== i),
                        })
                      }
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                  <div className="two-fields">
                    <Field
                      label="Từ / cấu trúc"
                      error={fieldErrors[`notes.${i}.term`]}
                    >
                      <input
                        lang="ja"
                        value={n.term}
                        maxLength={300}
                        onChange={(e) =>
                          updateNote(i, { term: e.target.value })
                        }
                        placeholder="学校"
                      />
                    </Field>
                    <Field
                      label="Nghĩa"
                      error={fieldErrors[`notes.${i}.meaning`]}
                    >
                      <input
                        value={n.meaning}
                        maxLength={1000}
                        onChange={(e) =>
                          updateNote(i, { meaning: e.target.value })
                        }
                        placeholder="Trường học"
                      />
                    </Field>
                    <Field label="Cách đọc">
                      <input
                        lang="ja"
                        value={n.reading}
                        maxLength={300}
                        onChange={(e) =>
                          updateNote(i, { reading: e.target.value })
                        }
                        placeholder="がっこう"
                      />
                    </Field>
                    <Field label="Ví dụ trong ngữ cảnh">
                      <input
                        lang="ja"
                        value={n.example}
                        maxLength={2000}
                        onChange={(e) =>
                          updateNote(i, { example: e.target.value })
                        }
                        placeholder="毎日、学校へ行きます。"
                      />
                    </Field>
                  </div>
                  {draft.kind !== "kana" && (
                    <details>
                      <summary>
                        Câu hỏi luyện tập{" "}
                        {n.question ? "· Đã có nội dung" : "(tùy chọn)"}
                      </summary>
                      <label className="checkbox">
                        <input
                          type="checkbox"
                          checked={!!n.question}
                          onChange={(e) =>
                            updateNote(i, {
                              question: e.target.checked
                                ? {
                                    type:
                                      draft.kind === "kanji"
                                        ? "reading"
                                        : draft.kind === "grammar"
                                          ? "grammar"
                                          : "context",
                                    prompt: "",
                                    options: ["", "", "", ""],
                                    answer: 0,
                                    explanation: "",
                                  }
                                : undefined,
                            })
                          }
                        />{" "}
                        Thêm câu hỏi cho thẻ này
                      </label>
                      {n.question && (
                        <div className="form-grid">
                          {n.question.reviewed === false && (
                            <Status tone="info">
                              Câu gợi ý chưa được kiểm tra. Đối chiếu cách đọc,
                              bốn lựa chọn và lời giải trước khi đưa vào bài
                              luyện.
                            </Status>
                          )}
                          <label className="checkbox">
                            <input
                              type="checkbox"
                              checked={n.question.reviewed !== false}
                              onChange={(e) =>
                                updateNote(i, {
                                  question: {
                                    ...n.question!,
                                    reviewed: e.target.checked,
                                  },
                                })
                              }
                            />{" "}
                            Tôi đã kiểm tra: chỉ một đáp án đúng trong ngữ cảnh
                            này.
                          </label>
                          <Field label="Dạng câu">
                            <select
                              value={n.question.type}
                              onChange={(e) =>
                                updateNote(i, {
                                  question: {
                                    ...n.question!,
                                    type: e.target.value as any,
                                  },
                                })
                              }
                            >
                              {questionTypes
                                .filter((t) =>
                                  allowedType(draft.kind, draft.level, t),
                                )
                                .map((t) => (
                                  <option key={t} value={t}>
                                    {typeLabels[t]}
                                  </option>
                                ))}
                            </select>
                          </Field>
                          <Field label="Câu hỏi (dùng 【 】 để đánh dấu từ cần hỏi)">
                            <textarea
                              className="resize-none"
                              style={{ resize: "none" }}
                              rows={3}
                              lang="ja"
                              value={n.question.prompt}
                              onChange={(e) =>
                                updateNote(i, {
                                  question: {
                                    ...n.question!,
                                    prompt: e.target.value,
                                  },
                                })
                              }
                            />
                          </Field>
                          <div className="two-fields">
                            {n.question.options.map((option, j) => (
                              <Field label={`Lựa chọn ${j + 1}`} key={j}>
                                <input
                                  lang="ja"
                                  value={option}
                                  onChange={(e) =>
                                    updateNote(i, {
                                      question: {
                                        ...n.question!,
                                        options: n.question!.options.map(
                                          (o, k) =>
                                            k === j ? e.target.value : o,
                                        ),
                                      },
                                    })
                                  }
                                />
                              </Field>
                            ))}
                          </div>
                          <Field label="Đáp án đúng">
                            <select
                              value={n.question.answer}
                              onChange={(e) =>
                                updateNote(i, {
                                  question: {
                                    ...n.question!,
                                    answer: Number(e.target.value),
                                  },
                                })
                              }
                            >
                              {[0, 1, 2, 3].map((a) => (
                                <option key={a} value={a}>
                                  Lựa chọn {a + 1}
                                </option>
                              ))}
                            </select>
                          </Field>
                          <Field label="Giải thích đáp án và các bẫy">
                            <textarea
                              className="resize-none"
                              style={{ resize: "none" }}
                              rows={3}
                              value={n.question.explanation}
                              onChange={(e) =>
                                updateNote(i, {
                                  question: {
                                    ...n.question!,
                                    explanation: e.target.value,
                                  },
                                })
                              }
                            />
                          </Field>
                        </div>
                      )}
                    </details>
                  )}
                </section>
              ))}
              {draft.notes.length > limit && (
                <button
                  className="btn secondary"
                  onClick={() => setLimit((v) => v + 20)}
                >
                  Hiện thêm thẻ
                </button>
              )}
              <button
                className="add-note"
                disabled={draft.notes.length >= 500}
                onClick={() => {
                  change({ notes: [...draft.notes, blank()] });
                  setLimit(draft.notes.length + 1);
                }}
              >
                <Plus size={19} /> Thêm thẻ
              </button>
            </>
          )}
        </div>
        <aside className="editor-aside">
          <section className="panel">
            <h2>Mẫu thẻ của bạn</h2>
            <p className="muted">
              Tùy chỉnh nội dung ở hai mặt. Chỉ dùng các trường bên dưới.
            </p>
            <div className="token-list">
              {["term", "reading", "meaning", "example"].map((t) => (
                <code key={t}>{`{${t}}`}</code>
              ))}
            </div>
            <Field label="Mặt trước">
              <textarea
                className="resize-none"
                style={{ resize: "none" }}
                rows={2}
                value={draft.front}
                onChange={(e) => change({ front: e.target.value })}
              />
            </Field>
            <Field label="Mặt sau">
              <textarea
                className="resize-none"
                style={{ resize: "none" }}
                rows={4}
                value={draft.back}
                onChange={(e) => change({ back: e.target.value })}
              />
            </Field>
            <div className="mini-flashcard">
              <small>XEM TRƯỚC MẶT TRƯỚC</small>
              <p lang="ja">
                {renderTemplate(draft.front, draft.notes[0]) || "学校"}
              </p>
            </div>
            <p className="tip-copy">
              Nên giữ mặt trước là câu hỏi. Cách đọc và nghĩa ở mặt sau giúp bạn
              chủ động gợi nhớ.
            </p>
          </section>
          <button className="btn full" disabled={busy || !ready} onClick={save}>
            {busy ? "Đang lưu…" : "Lưu bộ thẻ"}
          </button>
        </aside>
      </div>
      <Modal
        open={blocker.state === "blocked"}
        title="Rời bản nháp chưa lưu?"
        onClose={() => blocker.state === "blocked" && blocker.reset()}
      >
        <p>
          Thay đổi chưa được lưu vào bộ thẻ. Bản nháp vẫn được giữ trên thiết bị
          này để bạn tiếp tục sau.
        </p>
        <div className="button-row">
          <button
            className="btn secondary"
            onClick={() => blocker.state === "blocked" && blocker.reset()}
          >
            Tiếp tục chỉnh sửa
          </button>
          <button
            className="btn"
            onClick={() => blocker.state === "blocked" && blocker.proceed()}
          >
            Rời trang
          </button>
        </div>
      </Modal>
    </>
  );
}
