import { Global, Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LLM_PROVIDER, type LlmProvider } from './llm-provider.js';
import { MockProvider } from './mock.provider.js';
import { OpenAiProvider } from './openai.provider.js';

@Global()
@Module({
  providers: [
    {
      provide: LLM_PROVIDER,
      inject: [ConfigService],
      useFactory: (config: ConfigService): LlmProvider => {
        const logger = new Logger('LlmModule');
        const choice = config.get<string>('LLM_PROVIDER', 'openai');
        const apiKey = config.get<string>('OPENAI_API_KEY');

        if (choice === 'mock') {
          logger.log('Using the mock provider (LLM_PROVIDER=mock)');
          return new MockProvider();
        }
        if (!apiKey) {
          logger.warn('OPENAI_API_KEY is not set, using the mock provider');
          return new MockProvider();
        }

        const provider = new OpenAiProvider({
          apiKey,
          model: config.get<string>('OPENAI_MODEL', 'gpt-4o-mini'),
          timeoutMs: Number(config.get('OPENAI_TIMEOUT_MS', 30000)),
          logPayloads: config.get<string>('LOG_LLM_PAYLOADS') === 'true',
        });
        logger.log(`Using OpenAI (model=${provider.model})`);
        return provider;
      },
    },
  ],
  exports: [LLM_PROVIDER],
})
export class LlmModule {}
