import { Controller, Get, Inject } from '@nestjs/common';
import { LLM_PROVIDER, type LlmProvider } from './llm/llm-provider.js';

@Controller('health')
export class HealthController {
  constructor(@Inject(LLM_PROVIDER) private readonly llm: LlmProvider) {}

  @Get()
  check() {
    return { status: 'ok', llmProvider: this.llm.name, model: this.llm.model };
  }
}
