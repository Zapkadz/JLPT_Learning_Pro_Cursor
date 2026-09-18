import { z } from "zod";

export const kaiwaProjectStatusSchema = z.enum([
  "draft",
  "processing",
  "ready",
  "failed",
  "deleted",
]);

export const kaiwaRevisionStateSchema = z.enum(["draft", "reviewed"]);

export const kaiwaAttemptCompletionSchema = z.enum([
  "completed",
  "partial",
  "interrupted",
  "failed",
]);

export const kaiwaAssessmentStatusSchema = z.enum([
  "pending",
  "ready",
  "unavailable",
  "not_assessable",
  "failed",
]);

export const kaiwaRubyTokenSchema = z.object({
  surface: z.string().min(1).max(80),
  reading: z.string().max(120).optional(),
  romaji: z.string().max(120).optional(),
  manual: z.boolean().optional(),
});

export const kaiwaSegmentSchema = z.object({
  id: z.string().min(1).max(64),
  startMs: z.number().int().nonnegative(),
  endMs: z.number().int().positive(),
  ja: z.string().max(4000),
  vi: z.string().max(4000).optional(),
  tokens: z.array(kaiwaRubyTokenSchema).max(500).optional(),
  /** True when JA changed and furigana/romaji need user review. */
  readingStale: z.boolean().optional(),
  reviewState: z.enum(["draft", "reviewed"]).default("draft"),
  speakerLabel: z.string().max(120).nullable().optional(),
  assessable: z.boolean().default(true),
  assessableReason: z.string().max(500).nullable().optional(),
  /** Set by script-align / ASR when timing is weak — user should edit. */
  timingUncertain: z.boolean().optional(),
});

export const kaiwaRevisionPayloadSchema = z.object({
  segments: z.array(kaiwaSegmentSchema).max(2000),
});

export const kaiwaRevisionSourceSchema = z
  .object({
    source: z
      .enum(["manual", "import_srt", "script_align", "asr"])
      .optional(),
    alignEngine: z.string().max(120).optional(),
    alignConfidence: z.number().nullable().optional(),
    provider: z.string().max(120).optional(),
    generatedAt: z.string().max(64).optional(),
  })
  .passthrough();

export const createKaiwaProjectSchema = z.object({
  title: z.string().trim().min(1).max(200),
  sourceAssetId: z.string().uuid().optional(),
});

export const patchKaiwaProjectSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  expectedVersion: z.number().int().nonnegative(),
  sourceAssetId: z.string().uuid().optional(),
  proxyAssetId: z.string().uuid().nullable().optional(),
  status: kaiwaProjectStatusSchema.optional(),
});

export const saveKaiwaDraftSchema = z.object({
  expectedRevisionVersion: z.number().int().nonnegative(),
  payload: kaiwaRevisionPayloadSchema,
  source: kaiwaRevisionSourceSchema.optional(),
});

export const scriptAlignRequestSchema = z.object({
  expectedRevisionVersion: z.number().int().nonnegative(),
  text: z.string().min(1).max(200_000),
});

export const publishKaiwaRevisionSchema = z.object({
  expectedRevisionVersion: z.number().int().nonnegative(),
});

export type KaiwaSegment = z.infer<typeof kaiwaSegmentSchema>;
export type KaiwaRevisionPayload = z.infer<typeof kaiwaRevisionPayloadSchema>;
export type KaiwaRubyToken = z.infer<typeof kaiwaRubyTokenSchema>;
export type KaiwaRevisionSource = z.infer<typeof kaiwaRevisionSourceSchema>;
