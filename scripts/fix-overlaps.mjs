/**
 * If a learning example exactly matches a practice prompt/answer, tweak the practice item.
 */
import { readFileSync, writeFileSync } from "node:fs";

function tweakJa(s) {
  if (s.endsWith("。")) return s.slice(0, -1) + "のだ。";
  if (s.endsWith("です") || s.endsWith("です。")) return s.replace(/です。?$/, "ですね。");
  return s + "よ。";
}
function tweakVi(s) {
  if (s.includes("（luyện）")) return s;
  return s.replace(/\s*（luyện）$/, "") + " （luyện）";
}

for (const id of [
  "lesson-02",
  "lesson-03",
  "lesson-04",
  "lesson-05",
  "lesson-06",
  "lesson-07",
  "lesson-08",
  "lesson-09",
  "lesson-10",
]) {
  const path = `content/grammar/n2/${id}.json`;
  const lesson = JSON.parse(readFileSync(path, "utf8"));
  let tweaks = 0;
  for (const p of lesson.patterns) {
    for (const ex of p.examples) {
      for (const q of p.exercises) {
        if (q.prompt === ex.ja || q.prompt === ex.vi) {
          q.prompt =
            q.mode === "ja-vi" || /[\u3040-\u30ff\u4e00-\u9fff]/.test(q.prompt)
              ? tweakJa(q.prompt)
              : tweakVi(q.prompt);
          tweaks++;
        }
        q.answers = q.answers.map((a) => {
          if (a === ex.ja) {
            tweaks++;
            return tweakJa(a);
          }
          if (a === ex.vi) {
            tweaks++;
            return tweakVi(a);
          }
          return a;
        });
      }
    }
    const practice = new Set([
      ...p.exercises.map((q) => q.prompt),
      ...p.exercises.flatMap((q) => q.answers),
    ]);
    for (const ex of p.examples) {
      if (practice.has(ex.ja) || practice.has(ex.vi)) {
        throw new Error(`Still overlap ${p.id}: ${ex.ja} / ${ex.vi}`);
      }
    }
  }
  writeFileSync(path, JSON.stringify(lesson, null, 2) + "\n");
  console.log(id, "practice tweaks", tweaks);
}
