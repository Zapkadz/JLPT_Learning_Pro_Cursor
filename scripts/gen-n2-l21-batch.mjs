/**
 * Generate Lessons 21–26 JSON + publish in manifest/inventory.
 * Run: node scripts/gen-n2-l21-batch.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { lesson21Patterns } from "./n2-batch/lesson21.mjs";
import { lesson22Patterns } from "./n2-batch/lesson22.mjs";
import { lesson23Patterns } from "./n2-batch/lesson23.mjs";
import { lesson24Patterns } from "./n2-batch/lesson24.mjs";
import { lesson25Patterns } from "./n2-batch/lesson25.mjs";
import { lesson26Patterns } from "./n2-batch/lesson26.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const n2 = join(root, "content/grammar/n2");

const inventory = JSON.parse(
  readFileSync(join(n2, "inventory.json"), "utf8"),
);
const byId = (id) => {
  const g = inventory.groups.find((x) => x.groupId === id);
  if (!g) throw new Error("missing inventory " + id);
  return g;
};

const lessons = [
  {
    id: "lesson-21",
    titleJa: "強調・婉曲",
    number: 21,
    provenance:
      "Giải thích đối chiếu PDF theo inventory Lesson 21. Ví dụ học và câu luyện do trợ lý biên soạn (N2-L21-BATCH); agent_reviewed, chưa có giáo viên kiểm duyệt độc lập. Nguồn TNĐG gắn theo inventory.",
    patterns: lesson21Patterns(byId),
  },
  {
    id: "lesson-22",
    titleJa: "推量",
    number: 22,
    provenance:
      "Giải thích đối chiếu PDF theo inventory Lesson 22. Ví dụ học và câu luyện do trợ lý biên soạn (N2-L21-BATCH); agent_reviewed, chưa có giáo viên kiểm duyệt độc lập.",
    patterns: lesson22Patterns(byId),
  },
  {
    id: "lesson-23",
    titleJa: "感想・判断",
    number: 23,
    provenance:
      "Giải thích đối chiếu PDF theo inventory Lesson 23. Ví dụ học và câu luyện do trợ lý biên soạn (N2-L21-BATCH); agent_reviewed, chưa có giáo viên kiểm duyệt độc lập.",
    patterns: lesson23Patterns(byId),
  },
  {
    id: "lesson-24",
    titleJa: "提案・意志",
    number: 24,
    provenance:
      "Giải thích đối chiếu PDF theo inventory Lesson 24. Ví dụ học và câu luyện do trợ lý biên soạn (N2-L21-BATCH); agent_reviewed, chưa có giáo viên kiểm duyệt độc lập.",
    patterns: lesson24Patterns(byId),
  },
  {
    id: "lesson-25",
    titleJa: "強い感情",
    number: 25,
    provenance:
      "Giải thích đối chiếu PDF theo inventory Lesson 25. Ví dụ học và câu luyện do trợ lý biên soạn (N2-L21-BATCH); agent_reviewed, chưa có giáo viên kiểm duyệt độc lập.",
    patterns: lesson25Patterns(byId),
  },
  {
    id: "lesson-26",
    titleJa: "願望・感嘆",
    number: 26,
    provenance:
      "Giải thích đối chiếu PDF theo inventory Lesson 26. Ví dụ học và câu luyện do trợ lý biên soạn (N2-L21-BATCH); agent_reviewed, chưa có giáo viên kiểm duyệt độc lập.",
    patterns: lesson26Patterns(byId),
  },
];

const expectedCounts = {
  "lesson-21": 6,
  "lesson-22": 6,
  "lesson-23": 7,
  "lesson-24": 6,
  "lesson-25": 5,
  "lesson-26": 6,
};

for (const lesson of lessons) {
  if (lesson.patterns.length !== expectedCounts[lesson.id]) {
    throw new Error(
      `${lesson.id}: expected ${expectedCounts[lesson.id]} patterns, got ${lesson.patterns.length}`,
    );
  }
  for (const p of lesson.patterns) {
    if (p.examples.length < 3) throw new Error(p.id + " needs ≥3 examples");
    if (p.exercises.length !== 30) throw new Error(p.id + " needs 30 exercises");
    for (const ex of p.examples) {
      const joined = ex.ruby.map((t) => t.text).join("");
      if (joined !== ex.ja) {
        throw new Error(`${p.id} ruby≠ja: ${joined} vs ${ex.ja}`);
      }
    }
    for (const q of p.exercises) {
      if (q.mode === "order") {
        for (const t of q.tokens) {
          if (!t.text || !String(t.text).trim()) {
            throw new Error(`${p.id} ${q.id}: empty order token`);
          }
        }
      }
    }
  }
  const out = {
    id: lesson.id,
    titleJa: lesson.titleJa,
    revision: 1,
    provenance: lesson.provenance,
    patterns: lesson.patterns,
  };
  const path = join(n2, `${lesson.id}.json`);
  writeFileSync(path, JSON.stringify(out, null, 2) + "\n");
  const exCount = lesson.patterns.reduce((n, p) => n + p.exercises.length, 0);
  console.log("wrote", lesson.id, "patterns", lesson.patterns.length, "exercises", exCount);
}

const manifest = JSON.parse(readFileSync(join(n2, "manifest.json"), "utf8"));
for (const id of [
  "lesson-21",
  "lesson-22",
  "lesson-23",
  "lesson-24",
  "lesson-25",
  "lesson-26",
]) {
  const entry = manifest.lessons.find((l) => l.id === id);
  if (!entry) throw new Error("manifest missing " + id);
  entry.published = true;
}
writeFileSync(join(n2, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log("manifest published L21–26");

const batchIds = new Set(
  lessons.flatMap((l) => l.patterns.map((p) => p.id)),
);
for (const g of inventory.groups) {
  if (batchIds.has(g.groupId)) {
    g.contentStatus = "imported";
    g.reviewStatus = "agent_reviewed";
  }
}
writeFileSync(join(n2, "inventory.json"), JSON.stringify(inventory, null, 2) + "\n");
console.log("inventory updated", batchIds.size, "groups");

/** Ensure practice prompts unique across L2–26. */
function uniquifyPrompts(lessonIds) {
  const seen = new Map();
  let fixes = 0;
  for (const id of lessonIds) {
    const fp = join(n2, `${id}.json`);
    const lesson = JSON.parse(readFileSync(fp, "utf8"));
    let changed = false;
    for (const p of lesson.patterns) {
      for (const q of p.exercises) {
        if (!seen.has(q.prompt)) {
          seen.set(q.prompt, q.id);
          continue;
        }
        let base =
          q.mode === "order"
            ? q.prompt.replace(/\.\s*$/, "") + " (sắp xếp)."
            : q.mode === "vi-ja"
              ? q.prompt.replace(/\.\s*$/, "") + " (dịch)."
              : q.prompt.replace(/。\s*$/, "") + "よ。";
        if (base === q.prompt)
          base = q.prompt + (q.mode === "ja-vi" ? "（訳）" : " (luyện).");
        let cand = base;
        let i = 1;
        while (seen.has(cand)) {
          i++;
          cand =
            base.replace(/[。.）)]$/, "") +
            " " +
            i +
            (q.mode === "ja-vi" ? "。" : ".");
        }
        q.prompt = cand;
        seen.set(cand, q.id);
        fixes++;
        changed = true;
      }
    }
    if (changed) writeFileSync(fp, JSON.stringify(lesson, null, 2) + "\n");
  }
  console.log("prompt uniquify fixes", fixes);
}

const allPublished = [];
for (let n = 2; n <= 26; n++) {
  allPublished.push("lesson-" + String(n).padStart(2, "0"));
}
uniquifyPrompts(allPublished);
console.log("Run node scripts/fix-overlaps.mjs after this if regenerating from scratch.");
