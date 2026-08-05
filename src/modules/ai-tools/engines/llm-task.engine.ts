import { Injectable } from "@nestjs/common";
import { GroqProvider } from "@/modules/ai-tools/providers/groq.provider";
import { OpenAiProvider } from "@/modules/ai-tools/providers/openai.provider";
import { PROMPT_TEMPLATES } from "@/modules/ai-tools/engines/prompt-templates";

@Injectable()
export class LlmTaskEngine {
  constructor(
    private readonly groqProvider: GroqProvider,
    private readonly openAiProvider: OpenAiProvider
  ) {}

  async run(toolSlug: string, content: string, options: Record<string, string>): Promise<string> {
    const template = PROMPT_TEMPLATES[toolSlug];
    if (!template) {
      throw new Error(`No prompt template registered for tool: ${toolSlug}`);
    }

    const userPrompt = template.buildUserPrompt(content, options);

    if (this.groqProvider.isConfigured) {
      return this.groqProvider.complete(template.systemPrompt, userPrompt);
    }

    if (this.openAiProvider.isConfigured) {
      return this.openAiProvider.complete(template.systemPrompt, userPrompt);
    }

    throw new Error("No AI provider is configured. Set GROQ_API_KEY or OPENAI_API_KEY.");
  }
}
