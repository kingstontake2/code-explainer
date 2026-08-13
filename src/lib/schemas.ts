import { z } from "zod";

export const audienceSchema = z.enum(["beginner", "technical"]);

export const explainRequestSchema = z.object({
  code: z.string().min(1, "Code snippet is required"),
  language: z.string().optional(),
  audience: audienceSchema,
});

export const explainResponseSchema = z.object({
  explanation: z.string().min(1),
  complexity: z.string().min(1),
  notes: z.string().min(1),
});

export type ExplainRequestInput = z.infer<typeof explainRequestSchema>;
export type ExplainResponseOutput = z.infer<typeof explainResponseSchema>;
