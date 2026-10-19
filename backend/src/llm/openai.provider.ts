import { Logger } from '@nestjs/common';
import OpenAI from 'openai';
import {
  verdictSchema,
  type AssessmentInput,
  type LlmProvider,
  type LlmResult,
} from './llm-provider.js';
import {
  buildUserPrompt,
  SYSTEM_PROMPT,
  VERDICT_JSON_SCHEMA,
} from './prompt.js';

const MAX_ATTEMPTS = 2;

export interface OpenAiOptions {
  apiKey: string;
  model: string;
  timeoutMs: number;
  /** Logs full prompts and responses. They contain study data, so keep it off in production. */
  logPayloads: boolean;
}

export class OpenAiProvider implements LlmProvider {
  readonly name = 'openai';
  readonly model: string;
  private readonly client: OpenAI;
  private readonly logPayloads: boolean;
  private readonly logger = new Logger(OpenAiProvider.name);

  constructor(options: OpenAiOptions) {
    this.model = options.model;
    this.logPayloads = options.logPayloads;
    this.client = new OpenAI({
      apiKey: options.apiKey,
      timeout: options.timeoutMs,
      maxRetries: 2,
    });
  }

  async assess(input: AssessmentInput): Promise<LlmResult> {
    const userPrompt = buildUserPrompt(input);
    let lastError: unknown;

    // The SDK retries network and 5xx errors itself; this loop only covers
    // the rare case where the model returns something that fails validation.
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      this.logger.log(
        `Request: model=${this.model} attempt=${attempt} claim="${input.claimText}"`,
      );
      if (this.logPayloads) {
        this.logger.debug(`Request system prompt:\n${SYSTEM_PROMPT}`);
        this.logger.debug(`Request user prompt:\n${userPrompt}`);
      }

      const startedAt = Date.now();
      let completion: OpenAI.Chat.Completions.ChatCompletion;
      try {
        completion = await this.client.chat.completions.create({
          model: this.model,
          temperature: 0,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userPrompt },
          ],
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: 'claim_assessment',
              strict: true,
              schema: VERDICT_JSON_SCHEMA,
            },
          },
        });
      } catch (err) {
        const status = err instanceof OpenAI.APIError ? err.status : 'n/a';
        this.logger.error(
          `Request failed after ${Date.now() - startedAt}ms: status=${status} ${String(err)}`,
        );
        throw err;
      }

      const choice = completion.choices[0];
      const usage = completion.usage;
      this.logger.log(
        `Response: id=${completion.id} model=${completion.model} ` +
          `${Date.now() - startedAt}ms finish=${choice?.finish_reason} ` +
          `tokens=${usage?.prompt_tokens ?? '?'}in/${usage?.completion_tokens ?? '?'}out`,
      );
      if (this.logPayloads) {
        this.logger.debug(`Response content:\n${choice?.message?.content}`);
      }

      if (choice?.message?.refusal) {
        throw new Error(`Model refused to assess: ${choice.message.refusal}`);
      }

      try {
        const parsed = verdictSchema.parse(
          JSON.parse(choice?.message?.content ?? ''),
        );
        return { verdict: parsed, raw: completion };
      } catch (err) {
        lastError = err;
        this.logger.warn(
          `Invalid model output on attempt ${attempt}: ${String(err)}`,
        );
      }
    }

    throw lastError;
  }
}
