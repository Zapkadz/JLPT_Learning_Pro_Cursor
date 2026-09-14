import { z } from "zod";
z.setErrorMap((issue, ctx) => ({
  message:
    issue.code === "too_small"
      ? `Cần ít nhất ${issue.minimum} ${issue.type === "string" ? "ký tự" : "mục"}.`
      : issue.code === "too_big"
        ? `Tối đa ${issue.maximum} ${issue.type === "string" ? "ký tự" : "mục"}.`
        : issue.code === "invalid_string"
          ? "Định dạng chưa hợp lệ."
          : issue.code === "invalid_type"
            ? "Vui lòng nhập giá trị hợp lệ."
            : issue.code === "invalid_enum_value"
              ? "Hãy chọn một giá trị trong danh sách."
              : ctx.defaultError,
}));
export function validationMessage(issues: z.ZodIssue[]) {
  const labels: Record<string, string> = {
    title: "Tên bộ thẻ",
    notes: "Thẻ",
    term: "Từ / cấu trúc",
    meaning: "Nghĩa",
    reading: "Cách đọc",
    example: "Ví dụ",
    question: "Câu hỏi",
    prompt: "Nội dung câu hỏi",
    options: "Lựa chọn",
    answer: "Đáp án",
    explanation: "Lời giải",
    front: "Mặt trước",
    back: "Mặt sau",
    email: "Email",
    password: "Mật khẩu",
    name: "Tên",
    level: "Cấp độ",
    kind: "Phân môn",
    dailyGoal: "Mục tiêu",
    retention: "Mức ghi nhớ",
  };
  return issues
    .map(
      (i) =>
        `${i.path.map((p) => (typeof p === "number" ? p + 1 : labels[p] || p)).join(" · ")}: ${i.message}`,
    )
    .join(" ");
}
export const levels = ["N5", "N4", "N3", "N2", "N1"] as const;
export const kinds = ["vocabulary", "kanji", "grammar", "kana"] as const;
export const kindLabels: Record<string, string> = {
  vocabulary: "Từ vựng",
  kanji: "Kanji",
  grammar: "Ngữ pháp",
  kana: "Kana",
};
export const questionTypes = [
  "reading",
  "orthography",
  "context",
  "paraphrase",
  "usage",
  "formation",
  "grammar",
  "order",
  "text",
] as const;
export const typeLabels: Record<string, string> = {
  reading: "Cách đọc Kanji",
  orthography: "Chọn chữ đúng",
  context: "Từ trong ngữ cảnh",
  paraphrase: "Diễn đạt tương đương",
  usage: "Cách dùng từ",
  formation: "Cấu tạo từ",
  grammar: "Chọn dạng ngữ pháp",
  order: "Sắp xếp câu ★",
  text: "Ngữ pháp văn bản",
};
export function allowedType(kind: string, level: string, type: string) {
  return kind === "kanji"
    ? type === "reading" || (type === "orthography" && level !== "N1")
    : kind === "vocabulary"
      ? ["context", "paraphrase"].includes(type) ||
        (type === "usage" && level !== "N5") ||
        (type === "formation" && level === "N2")
      : kind === "grammar" && ["grammar", "order", "text"].includes(type);
}
export const questionSchema = z
  .object({
    reviewed: z.boolean().optional(),
    type: z.enum(questionTypes),
    prompt: z.string().trim().min(5).max(3000),
    options: z.array(z.string().trim().min(1).max(500)).length(4),
    answer: z.number().int().min(0).max(3),
    explanation: z.string().trim().min(5).max(3000),
  })
  .refine(
    (q) => new Set(q.options.map((s) => s.normalize("NFKC"))).size === 4,
    "Bốn lựa chọn phải khác nhau.",
  );
export const noteSchema = z.object({
  term: z.string().trim().min(1).max(300),
  reading: z.string().trim().max(300).default(""),
  meaning: z.string().trim().min(1).max(1000),
  example: z.string().trim().max(2000).default(""),
  question: questionSchema.optional(),
});
export const deckSchema = z
  .object({
    title: z.string().trim().min(1).max(120),
    description: z.string().trim().max(1000).default(""),
    kind: z.enum(kinds),
    level: z.enum(levels),
    front: z.string().min(1).max(500).default("{term}"),
    back: z.string().min(1).max(500).default("{reading}\n{meaning}\n{example}"),
    notes: z.array(noteSchema).min(1).max(500),
  })
  .superRefine((d, ctx) => {
    for (const [i, n] of d.notes.entries())
      if (n.question && !allowedType(d.kind, d.level, n.question.type))
        ctx.addIssue({
          code: "custom",
          message: "Dạng câu không phù hợp phân môn/cấp độ.",
          path: ["notes", i, "question"],
        });
    for (const side of ["front", "back"] as const)
      if (
        !/\{(term|reading|meaning|example)\}/.test(d[side]) ||
        /\{(?!term\}|reading\}|meaning\}|example\})[^}]*\}/.test(d[side])
      )
        ctx.addIssue({
          code: "custom",
          message: "Mẫu dùng {term}, {reading}, {meaning}, {example}.",
          path: [side],
        });
  });
export type Note = z.infer<typeof noteSchema> & { id?: string };
export type Deck = Omit<z.infer<typeof deckSchema>, "notes"> & {
  notes: Note[];
  id: string;
  count: number;
  learned: number;
  version: number;
};
export type Question = z.infer<typeof questionSchema> & {
  id: string;
  level: string;
  kind: string;
  source: string;
};
export function renderTemplate(template: string, note: Note) {
  return template
    .replace(/\{(term|reading|meaning|example)\}/g, (_, key: keyof Note) =>
      String(note[key] || ""),
    )
    .trim();
}
export function decodeImportDelimiter(value: string) {
  return value.replace(/\\r\\n|\\n|\\r|\\t/g, (part) =>
    part === "\\t" ? "\t" : "\n",
  );
}
export function importPlaceholder(field: string, row: string, header = false) {
  const fields = decodeImportDelimiter(field);
  const rows = decodeImportDelimiter(row);
  const data = [
    ["学校", "Trường học", "がっこう", "学校へ行きます。"],
    ["先生", "Giáo viên", "せんせい", "先生に聞きます。"],
  ];
  if (header) data.unshift(["term", "meaning", "reading", "example"]);
  return data
    .map((values) =>
      values
        .map((value) =>
          (fields && value.includes(fields)) ||
          (rows && value.includes(rows)) ||
          value.includes('"')
            ? '"' + value.replace(/"/g, '""') + '"'
            : value,
        )
        .join(fields),
    )
    .join(rows);
}
export function parseImport(
  raw: string,
  fieldDelimiter = "\t",
  rowDelimiter = "\n",
  hasHeader = false,
) {
  fieldDelimiter = decodeImportDelimiter(fieldDelimiter);
  rowDelimiter = decodeImportDelimiter(rowDelimiter);
  const errors: string[] = [];
  const notes: Note[] = [];
  let duplicates = 0;
  if (!fieldDelimiter || !rowDelimiter || fieldDelimiter === rowDelimiter)
    return {
      notes,
      errors: ["Hai dấu phân cách phải khác nhau và không được để trống."],
      duplicates,
    };
  // Tokenize both separators together: a blank-line row separator must win
  // over a single-newline field separator. Quoted values preserve separators.
  const text = raw.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
  const rows: string[][] = [];
  let row: string[] = [],
    value = "",
    quoted = false;
  const finishField = () => {
    row.push(value);
    value = "";
  };
  const finishRow = () => {
    finishField();
    if (row.some((cell) => cell.trim())) rows.push(row);
    row = [];
  };
  for (let i = 0; i < text.length;) {
    if (text[i] === '"' && (quoted || value === "")) {
      if (quoted && text[i + 1] === '"') {
        value += '"';
        i += 2;
        continue;
      }
      quoted = !quoted;
      i++;
      continue;
    }
    if (!quoted && text.startsWith(rowDelimiter, i)) {
      finishRow();
      i += rowDelimiter.length;
      continue;
    }
    if (!quoted && text.startsWith(fieldDelimiter, i)) {
      finishField();
      i += fieldDelimiter.length;
      continue;
    }
    value += text[i++];
  }
  if (quoted)
    errors.push("Dấu ngoặc kép chưa đóng. Hãy kiểm tra nội dung nhập.");
  finishRow();
  const seen = new Set<string>();
  let headers: string[] = [];
  if (hasHeader)
    headers = (rows.shift() || []).map((v) => v.trim().toLowerCase());
  if (rows.length > 500) errors.push("Tối đa 500 thẻ mỗi lần nhập.");
  rows.slice(0, 500).forEach((row, i) => {
    const line = i + 1 + (hasHeader ? 1 : 0);
    const get = (key: string, idx: number) =>
      row[hasHeader ? headers.indexOf(key) : idx]?.trim() || "";
    const data: Record<string, unknown> = {
      term: get("term", 0),
      meaning: get("meaning", 1),
      reading: get("reading", 2),
      example: get("example", 3),
    };
    if (hasHeader && get("question", 4))
      data.question = {
        prompt: get("question", 4),
        type: get("type", 5) || "reading",
        options: [1, 2, 3, 4].map((j) => get("option" + j, 5 + j)),
        answer: Number(get("answer", 10)) - 1,
        explanation: get("explanation", 11),
      };
    const parsed = noteSchema.safeParse(data);
    if (!parsed.success) {
      errors.push(`Thẻ ${line}: ${validationMessage(parsed.error.issues)}`);
      return;
    }
    const key = [parsed.data.term, parsed.data.reading, parsed.data.meaning]
      .map((x) => x.normalize("NFKC"))
      .join("|");
    if (seen.has(key)) {
      duplicates++;
      return;
    }
    seen.add(key);
    notes.push(parsed.data);
  });
  return { notes, errors, duplicates };
}
export function dayKey(date = new Date(), timezone = "Asia/Ho_Chi_Minh") {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
export function streakFromDays(days: string[], today = dayKey()) {
  const set = new Set(days);
  let cursor = new Date(today + "T12:00:00Z");
  if (!set.has(today)) cursor.setUTCDate(cursor.getUTCDate() - 1);
  let n = 0;
  while (set.has(cursor.toISOString().slice(0, 10))) {
    n++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return n;
}
