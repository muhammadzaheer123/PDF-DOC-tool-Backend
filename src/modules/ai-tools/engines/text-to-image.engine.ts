import { Injectable } from "@nestjs/common";
import { OpenAiProvider } from "@/modules/ai-tools/providers/openai.provider";

@Injectable()
export class TextToImageEngine {
  constructor(private readonly openAiProvider: OpenAiProvider) {}

  async run(prompt: string): Promise<Buffer> {
    if (!this.openAiProvider.isConfigured) {
      throw new Error("OpenAI API key is not configured. Text-to-image requires it.");
    }
    return this.openAiProvider.generateImage(prompt);
  }
}
