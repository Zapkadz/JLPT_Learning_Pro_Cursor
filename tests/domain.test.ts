import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseImport,
  importPlaceholder,
  allowedType,
  dayKey,
  streakFromDays,
  deckSchema,
  questionSchema,
} from "../shared/domain";
import { bank, starterNotes } from "../server/content";
import { kanaRows } from "../shared/kana";
test("CSV preserves quoted commas, newlines, BOM and drops exact duplicates", () => {
  const result = parseImport(
    '\uFEFFterm,meaning,reading,example\r\n学校,"Trường, học",がっこう,"Dòng 1\nDòng 2"\r\n学校,"Trường, học",がっこう,"Dòng 1\nDòng 2"',
    ",",
    "\n",
    true,
  );
  assert.equal(result.errors.length, 0);
  assert.equal(result.notes.length, 1);
  assert.equal(result.notes[0].meaning, "Trường, học");
  assert.equal(result.notes[0].example, "Dòng 1\nDòng 2");
  assert.equal(result.duplicates, 1);
});
test("custom row separator respects quoted content; errors do not silently import", () => {
  const result = parseImport('猫::Mèo##犬::"Chó##trong ví dụ"', "::", "##");
  assert.equal(result.notes.length, 2);
  assert.equal(result.notes[1].meaning, "Chó##trong ví dụ");
  assert.ok(parseImport("猫").errors.length);
  assert.ok(parseImport("猫||Mèo", "||", "||").errors.length);
});
test("JLPT level/type matrix excludes N1 orthography and N5 usage", () => {
  assert.equal(allowedType("kanji", "N1", "orthography"), false);
  assert.equal(allowedType("vocabulary", "N5", "usage"), false);
  assert.equal(allowedType("vocabulary", "N2", "formation"), true);
  assert.equal(allowedType("vocabulary", "N3", "formation"), false);
  assert.equal(allowedType("grammar", "N1", "text"), true);
});
test("starter bank and all generated starter decks meet domain invariants", () => {
  assert.equal(bank.length, 32);
  for (const q of bank) {
    assert.ok(questionSchema.safeParse(q).success, q.id);
    assert.ok(allowedType(q.kind, q.level, q.type), q.id);
    assert.equal(new Set(q.options).size, 4);
  }
  for (const level of ["N5", "N4", "N3", "N2", "N1"])
    for (const kind of ["kanji", "vocabulary", "grammar"]) {
      assert.ok(
        deckSchema.safeParse({
          title: "Test",
          level,
          kind,
          notes: starterNotes(kind, level),
        }).success,
      );
    }
  assert.equal(kanaRows(0).length, 46);
  assert.equal(kanaRows(1).length, 25);
  assert.equal(kanaRows(2).length, 33);
  assert.equal(kanaRows(0, true)[0].term, "ア");
});
test("timezone boundary and streak preserve yesterday but break on a missing day", () => {
  assert.equal(dayKey(new Date("2026-09-10T17:01:00Z")), "2026-09-11");
  assert.equal(streakFromDays(["2026-09-09", "2026-09-10"], "2026-09-11"), 2);
  assert.equal(streakFromDays(["2026-09-09", "2026-09-11"], "2026-09-11"), 1);
  assert.equal(streakFromDays([], "2026-09-11"), 0);
});

test("custom newline and literal separators match the live placeholder", () => {
  for (const [field, row] of [
    ["\\n", "\\n\\n"],
    ["/n", "/n/n"],
    ["::", "##"],
    ["\t", "\n"],
  ]) {
    for (const header of [false, true]) {
      const result = parseImport(
        importPlaceholder(field, row, header),
        field,
        row,
        header,
      );
      assert.deepEqual(result.errors, []);
      assert.equal(result.notes.length, 2);
      assert.equal(result.notes[0].term, "学校");
      assert.equal(result.notes[0].meaning, "Trường học");
      assert.equal(result.notes[0].question, undefined);
    }
  }
  const windows = parseImport(
    "学校\r\nTrường học\r\n\r\n先生\r\nGiáo viên",
    "\\n",
    "\\n\\n",
  );
  assert.equal(windows.notes.length, 2);
  assert.deepEqual(windows.errors, []);
  const invalid = parseImport("学校", "\\n", "\\n\\n");
  assert.ok(invalid.errors.length);
  assert.ok(!invalid.errors.join().includes("Câu hỏi"));
  assert.ok(!invalid.errors.join().includes("answer"));
});
