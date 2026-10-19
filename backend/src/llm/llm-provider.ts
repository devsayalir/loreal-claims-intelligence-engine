import { z } from 'zod';

export const LLM_PROVIDER = Symbol('LLM_PROVIDER');

export interface AssessmentInput {
  productName: string;
  claimText: string;
  claimType: string;
  formulaDetails?: string | null;
  studyDesign?: string | null;
  sampleSize?: number | null;
  studyDuration?: string | null;
  evidenceText: string;
}

export const verdictSchema = z.object({
  justified: z.boolean(),
  confidenceScore: z
    .number()
    .transform((n) => Math.round(Math.min(100, Math.max(0, n)))),
  reasoning: z.string().trim().min(1),
});

export type Verdict = z.infer<typeof verdictSchema>;

export interface LlmResult {
  verdict: Verdict;
  raw: unknown;
}

export interface LlmProvider {
  readonly name: string;
  readonly model: string;
  assess(input: AssessmentInput): Promise<LlmResult>;
}
