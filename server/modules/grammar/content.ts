import { readFileSync } from "node:fs";
import { z } from "zod";
import {
  patternSchema,
  type Exercise,
  type PublicExercise,
} from "../../../shared/grammar/types";
export const lesson = z
  .object({
    id: z.string(),
    titleJa: z.string(),
    revision: z.number(),
    provenance: z.string(),
    patterns: z.array(patternSchema),
  })
  .parse(
    JSON.parse(
      readFileSync(
        new URL("../../../content/grammar/n2/lesson-01.json", import.meta.url),
        "utf8",
      ),
    ),
  );
export const manifest = z
  .object({
    id: z.string(),
    title: z.string(),
    targetGroups: z.number(),
    targetExercises: z.number(),
    lessons: z.array(
      z.object({
        id: z.string(),
        number: z.number(),
        title: z.string(),
        groupCount: z.number(),
        published: z.boolean(),
      }),
    ),
  })
  .parse(
    JSON.parse(
      readFileSync(
        new URL("../../../content/grammar/n2/manifest.json", import.meta.url),
        "utf8",
      ),
    ),
  );
export function normalizeTranslation(text: string) {
  return text
    .normalize("NFC")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[。.!！?？]+$/u, "");
}
export function grade(q: Exercise, answer: string | string[]) {
  if (q.mode === "order") {
    if (
      !Array.isArray(answer) ||
      answer.length !== 4 ||
      new Set(answer).size !== 4 ||
      answer.some((id) => !q.tokens.some((t) => t.id === id))
    )
      return "incorrect" as const;
    const sentence = answer
      .map((id) => q.tokens.find((t) => t.id === id)!.text)
      .join("");
    return q.acceptedOrders.some(
      (order) =>
        order.map((id) => q.tokens.find((t) => t.id === id)!.text).join("") ===
        sentence,
    )
      ? ("correct" as const)
      : ("incorrect" as const);
  }
  return typeof answer === "string" &&
    q.answers.some(
      (a) => normalizeTranslation(a) === normalizeTranslation(answer),
    )
    ? ("matched" as const)
    : ("needs_review" as const);
}
export function publicExercise(q: Exercise): PublicExercise {
  return {
    id: q.id,
    mode: q.mode,
    prompt: q.prompt,
    ...(q.mode === "order" ? { tokens: q.tokens, starIndex: q.starIndex } : {}),
  };
}
// Content revisions are immutable; changing JSON requires a revision bump.
