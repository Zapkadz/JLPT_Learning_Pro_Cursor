import { test } from "node:test";
import assert from "node:assert/strict";
import { suggestKanjiQuestion } from "../shared/generate";
test("generated distractors require context and remain unreviewed", () => {
  const note = {
    term: "学校",
    reading: "がっこう",
    meaning: "Trường học",
    example: "毎日、学校へ行きます。",
  };
  const generated = suggestKanjiQuestion(note).note.question!;
  assert.equal(generated.reviewed, false);
  assert.equal(generated.options.length, 4);
  assert.equal(new Set(generated.options).size, 4);
  assert.ok(generated.prompt.includes("【学校】"));
  assert.equal(
    suggestKanjiQuestion({ ...note, example: "" }).note.question,
    undefined,
  );
  assert.equal(
    suggestKanjiQuestion({ ...note, reading: "がっこう / がくこう" }).note
      .question,
    undefined,
  );
});
