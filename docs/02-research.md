# 2. Research performed

This is the background reading behind the design decisions. It is short on purpose, and each section ends with what I took from it.

## 2.1 Regulation of cosmetic claims

- **EU Regulation (EC) No 1223/2009, Article 20**, and **Regulation (EU) No 655/2013** set six common criteria for cosmetic claims: legal compliance, truthfulness, evidential support, honesty, fairness and informed decision-making. "Evidential support" means the evidence must be adequate for the type of claim, and "honesty" means the claim must not go beyond what the evidence shows.
- The **EU Technical Document on Cosmetic Claims** (European Commission, updated 2017) gives concrete examples, such as not claiming a 24h effect when it was measured for 8h.
- In the US, the **FTC** requires "competent and reliable scientific evidence" for objective claims. The **NAD** (National Advertising Division) regularly challenges claims where the study timepoint or population does not match the ad.
- **ARPP** in France, the **ASA** in the UK and the **NMPA** in China (with efficacy evaluation rules since 2021) add market-specific requirements.

**Takeaway:** the core of the check is whether the claim stays within what the evidence shows, especially magnitude, timeframe and endpoint. That became the structure of the prompt and of the fallback rules. Market-specific rules are out of scope for this version and are on the roadmap.

## 2.2 What makes a cosmetic efficacy study credible

From cosmetic science practice (for example the COLIPA, now Cosmetics Europe, guidelines on efficacy evaluation, and common CRO study designs):

- **Instrumental measures** (fringe projection or Primos for wrinkles, corneometer for hydration, chromameter for radiance) carry more weight than self-assessment for quantified claims.
- **Vehicle-controlled, randomised, split-face** designs are the gold standard for skincare.
- Panels of roughly **30 or more** subjects are typical for instrumental claims, and consumer perception claims often use 100 or more.
- **Timepoints** are usually D0 (baseline), D7, D14, D28 and D56. A claim must use a timepoint where the effect was actually reached.

**Takeaway:** the evidence form asks for design, sample size, duration and results separately, so the model (and a human reader) has the key facts in a predictable shape. The offline reviewer uses 30 as its sample size threshold and pairs each result with its timepoint.

## 2.3 LLMs for evidence assessment

- **Structured outputs.** OpenAI's `response_format` with a strict JSON schema makes the model return exactly the expected fields. This is more reliable than asking for JSON in the prompt. I still validate the response with zod, because the database should never receive an unvalidated payload.
- **Temperature 0** gives more stable answers for the same input, which matters for audits.
- **Hallucination risk.** Models can "fill in" evidence that is not there. The prompt explicitly says to use only the given information, and to treat missing information as not justified.
- **Calibration.** A model's self-reported confidence is not a true probability. I present it as "confidence score" and not as a probability. Calibrating it against expert decisions is on the roadmap.
- **Prompt versioning.** Assessments store the prompt version and model name. If the prompt changes, old results can still be explained.

## 2.4 Human in the loop

Regulators and internal compliance teams expect a named person to be responsible for each claim. Fully automated approval is therefore not an option. The design treats the LLM output as decision support:

- The reasoning is always shown next to the verdict.
- Every run is stored, and re-running does not overwrite history.
- The exact text sent to the model is stored with the result (`evidenceSnapshot`).

## 2.5 Technology checks

- **NestJS 12** now scaffolds ESM projects with Vitest by default, which is why the tests use Vitest and not Jest.
- **Prisma 7** moved the connection URL to `prisma.config.ts` and uses driver adapters (`@prisma/adapter-pg`). The generated client lives in `src/generated/prisma`.
- **OpenAI Node SDK v7** still supports Chat Completions with `json_schema` response format, which is widely documented and supported by many models, so I used it over newer APIs.
