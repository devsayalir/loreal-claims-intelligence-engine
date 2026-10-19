import type { AssessmentInput } from './llm-provider.js';

export const PROMPT_VERSION = 'claims-v1';

export const SYSTEM_PROMPT = `You are a senior claims substantiation reviewer in a cosmetics R&I team.
You decide whether a clinical or consumer study supports a proposed product claim.

Apply the EU common criteria for cosmetic claims (Regulation (EU) No 655/2013), in particular
evidential support and honesty. A claim is justified only if the evidence supports it as worded.

Check each of these and mention the ones that matter in your reasoning:
- Magnitude: the measured effect is at least what the claim states (e.g. "20%").
- Timeframe: the effect was observed within the claimed period (e.g. "in 4 weeks").
- Endpoint: what was measured actually corresponds to the claim (instrumental measure vs self-assessment).
- Population: the panel matches the target consumers implied by the claim.
- Study quality: sample size, control or vehicle arm, randomisation, statistical significance.
- Product: the tested product is the proposed formula, if a formula is given.

Rules:
- Use only the information provided. Do not assume results that are not stated.
- If key information is missing, the claim is not justified, and say what is missing.
- confidenceScore is your confidence in the verdict itself, from 0 to 100.
- reasoning is 3 to 6 short sentences in plain English for a non-specialist reviewer.`;

export function buildUserPrompt(input: AssessmentInput): string {
  const lines = [
    `Product: ${input.productName}`,
    `Claim type: ${input.claimType}`,
    `Proposed claim: "${input.claimText}"`,
  ];

  if (input.formulaDetails) lines.push(`Formula: ${input.formulaDetails}`);

  lines.push('', 'Study evidence:');
  if (input.studyDesign) lines.push(`Design: ${input.studyDesign}`);
  if (input.sampleSize) lines.push(`Sample size: ${input.sampleSize}`);
  if (input.studyDuration) lines.push(`Duration: ${input.studyDuration}`);
  lines.push(`Results: ${input.evidenceText}`);

  return lines.join('\n');
}

export const VERDICT_JSON_SCHEMA = {
  type: 'object',
  properties: {
    justified: { type: 'boolean' },
    confidenceScore: { type: 'integer' },
    reasoning: { type: 'string' },
  },
  required: ['justified', 'confidenceScore', 'reasoning'],
  additionalProperties: false,
} as const;
