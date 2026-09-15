import { existsSync, readFileSync } from "node:fs";
import { z } from "zod";
import {
  patternSchema,
  type Exercise,
  type Pattern,
  type PublicExercise,
} from "../../../shared/grammar/types";

const lessonSchema = z.object({
  id: z.string(),
  titleJa: z.string(),
  revision: z.number(),
  provenance: z.string(),
  patterns: z.array(patternSchema),
});

export type LessonContent = z.infer<typeof lessonSchema>;

export type PatternLookup = {
  pattern: Pattern;
  lesson: LessonContent;
};

const contentDir = new URL("../../../content/grammar/n2/", import.meta.url);

function lessonPath(lessonId: string) {
  return new URL(`${lessonId}.json`, contentDir);
}

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
    JSON.parse(readFileSync(new URL("manifest.json", contentDir), "utf8")),
  );

function loadPublishedLesson(lessonId: string): LessonContent {
  const path = lessonPath(lessonId);
  if (!existsSync(path)) {
    throw new Error(
      `Published grammar lesson is missing content file: ${lessonId}.json`,
    );
  }
  const parsed = lessonSchema.parse(
    JSON.parse(readFileSync(path, "utf8")),
  );
  if (parsed.id !== lessonId) {
    throw new Error(
      `Grammar lesson file id mismatch: expected ${lessonId}, got ${parsed.id}`,
    );
  }
  return parsed;
}

/** Published lessons only — unpublished entries stay in the manifest without JSON. */
export const lessonsById: ReadonlyMap<string, LessonContent> = new Map(
  manifest.lessons
    .filter((entry) => entry.published)
    .map((entry) => [entry.id, loadPublishedLesson(entry.id)]),
);

export const patternsById: ReadonlyMap<string, PatternLookup> = (() => {
  const map = new Map<string, PatternLookup>();
  for (const lesson of lessonsById.values()) {
    for (const pattern of lesson.patterns) {
      if (map.has(pattern.id)) {
        throw new Error(`Duplicate grammar pattern id: ${pattern.id}`);
      }
      map.set(pattern.id, { pattern, lesson });
    }
  }
  return map;
})();

/** Lesson 1 content — kept for existing imports/tests. Prefer getLesson / patternsById. */
export const lesson =
  lessonsById.get("lesson-01") ||
  (() => {
    throw new Error("Published lesson-01 is required");
  })();

export function getLesson(id: string): LessonContent | undefined {
  return lessonsById.get(id);
}

export function getPattern(id: string): PatternLookup | undefined {
  return patternsById.get(id);
}

export function allPatterns(): Pattern[] {
  return [...patternsById.values()].map((entry) => entry.pattern);
}

export function isLessonPublished(id: string): boolean {
  return !!manifest.lessons.find((entry) => entry.id === id)?.published;
}

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
