import type { Note } from "./domain";
const voiced: Record<string, string> = {
  か: "が",
  き: "ぎ",
  く: "ぐ",
  け: "げ",
  こ: "ご",
  さ: "ざ",
  し: "じ",
  す: "ず",
  せ: "ぜ",
  そ: "ぞ",
  た: "だ",
  ち: "ぢ",
  つ: "づ",
  て: "で",
  と: "ど",
  は: "ば",
  ひ: "び",
  ふ: "ぶ",
  へ: "べ",
  ほ: "ぼ",
};
const paired = {
  ...voiced,
  ...Object.fromEntries(Object.entries(voiced).map(([a, b]) => [b, a])),
};
/** Suggest from the supplied reading, never assert dictionary correctness. Human review is required. */
export function suggestKanjiQuestion(note: Note): {
  note: Note;
  reason?: string;
} {
  if (note.question)
    return { note, reason: "Đã có câu hỏi; giữ nguyên nội dung." };
  const reading = note.reading.normalize("NFKC").trim();
  if (!/^[\u3041-\u3096ー]{2,}$/.test(reading))
    return {
      note,
      reason: "Cần một cách đọc hiragana duy nhất (ít nhất hai ký tự).",
    };
  if (
    !/[\u3400-\u9fff]/.test(note.term) ||
    !note.example.includes(note.term) ||
    note.example.trim() === note.term
  )
    return {
      note,
      reason: "Cần câu ví dụ có chứa đúng từ Kanji để khóa ngữ cảnh.",
    };
  const candidates = new Map<string, string>();
  const add = (text: string, why: string) => {
    if (text !== reading && text.length >= 2 && !candidates.has(text))
      candidates.set(text, why);
  };
  [...reading].forEach((c, i) => {
    const replace = (s: string) =>
      reading.slice(0, i) + s + reading.slice(i + 1);
    if ("ういー".includes(c) && i > 0)
      add(replace(""), "Bỏ một ký tự có thể biểu thị âm dài.");
    if (c === "っ") add(replace(""), "Bỏ âm ngắt っ.");
    if ("ゃゅょ".includes(c))
      add(
        replace({ ゃ: "や", ゅ: "ゆ", ょ: "よ" }[c]!),
        "Nhầm kana nhỏ thành kana lớn.",
      );
    if (paired[c]) add(replace(paired[c]), "Nhầm âm hữu thanh/vô thanh.");
  });
  if (candidates.size < 3)
    return {
      note,
      reason: "Chưa đủ ba phương án nhiễu có quy tắc. Hãy bổ sung thủ công.",
    };
  const distractors = [...candidates].slice(0, 3);
  return {
    note: {
      ...note,
      question: {
        type: "reading",
        prompt: note.example.replace(note.term, `【${note.term}】`),
        options: [reading, ...distractors.map(([v]) => v)],
        answer: 0,
        reviewed: false,
        explanation: `Theo cách đọc bạn cung cấp, ${note.term} đọc là ${reading}. ${distractors.map(([v, why]) => `${v}: ${why}`).join(" ")} Gợi ý tự sinh: cần đối chiếu từ điển và ngữ cảnh trước khi xác nhận; không dùng nếu phương án khác cũng là cách đọc hợp lệ.`,
      },
    },
  };
}
