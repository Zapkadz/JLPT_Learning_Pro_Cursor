import { z } from "zod";
export const modes = ["vi-ja", "ja-vi", "order"] as const;
export type Mode = (typeof modes)[number];
export const modeLabels: Record<Mode, string> = {
  "vi-ja": "Việt → Nhật",
  "ja-vi": "Nhật → Việt",
  order: "Sắp xếp câu",
};
const base = {
  id: z.string(),
  prompt: z.string().min(1),
  hint: z.string(),
  explanation: z.string().min(5),
  answers: z.array(z.string().min(1)).min(1),
  origin: z.enum(["source", "source-adapted", "authored"]).optional(),
  sourceNote: z.string().min(1).optional(),
};
export const exerciseSchema = z.discriminatedUnion("mode", [
  z.object({ ...base, mode: z.literal("vi-ja") }),
  z.object({ ...base, mode: z.literal("ja-vi") }),
  z.object({
    ...base,
    mode: z.literal("order"),
    tokens: z.array(z.object({ id: z.string(), text: z.string() })).length(4),
    acceptedOrders: z.array(z.array(z.string()).length(4)).min(1),
    starIndex: z.number().int().min(0).max(3),
  }),
]);
export type Exercise = z.infer<typeof exerciseSchema>;
export type PublicExercise = Pick<Exercise, "id" | "mode" | "prompt"> & {
  tokens?: { id: string; text: string }[];
  starIndex?: number;
};
export const patternSchema = z.object({
  id: z.string(),
  title: z.string(),
  meaning: z.string(),
  variants: z.array(z.string()).default([]),
  structures: z.array(z.string()),
  explanation: z.string(),
  usage: z.string(),
  cautions: z.array(z.string()),
  contrast: z.string(),
  examples: z.array(
    z.object({
      ja: z.string(),
      reading: z.string(),
      vi: z.string(),
      ruby: z.array(
        z.object({ text: z.string(), reading: z.string().optional() }),
      ),
    }),
  ),
  source: z.object({
    pdfPage: z.number(),
    printedPage: z.number(),
    urls: z.array(z.string().url()).default([]),
  }),
  reviewStatus: z.literal("agent_reviewed"),
  revision: z.number(),
  exercises: z.array(exerciseSchema),
});
export type Pattern = z.infer<typeof patternSchema>;
export type PatternSummary = Pick<Pattern, "id" | "title" | "meaning"> & {
  count: number;
  read: boolean;
  completed: number;
  variants?: string[];
};
export type PatternDetail = Omit<Pattern, "exercises"> & {
  counts: Record<Mode, number>;
  read: boolean;
  provenance: string;
  lessonId: string;
  lessonNumber: number;
  lessonTitle: string;
};
export type ResponseState = {
  answer: string | string[];
  version: number;
  result?: "matched" | "needs_review" | "correct" | "incorrect" | "revealed";
  solution?: string;
  explanation?: string;
  hint?: string;
  selfReviewed?: boolean;
  exposed?: boolean;
};
export type Session = {
  id: string;
  patternId: string;
  revision: number;
  questions: PublicExercise[];
  responses: Record<string, ResponseState>;
  completed: boolean;
};
export type Course = {
  title: string;
  targetGroups: number;
  targetExercises: number;
  publishedGroups: number;
  publishedExercises: number;
  read: number;
  practiced: number;
  lessons: {
    id: string;
    number: number;
    title: string;
    groupCount: number;
    published: boolean;
  }[];
};
