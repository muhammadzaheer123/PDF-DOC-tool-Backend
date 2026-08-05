import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import OpenAI from "openai";
import { AppConfig } from "@/config/configuration";

@Injectable()
export class OpenAiProvider {
  private readonly client: OpenAI | null;
  private readonly textModel: string;
  private readonly imageModel: string;

  constructor(private readonly configService: ConfigService) {
    const openAiConfig = this.configService.get<AppConfig["openai"]>("openai")!;
    this.textModel = openAiConfig.textModel;
    this.imageModel = openAiConfig.imageModel;
    this.client = openAiConfig.apiKey ? new OpenAI({ apiKey: openAiConfig.apiKey }) : null;
  }

  get isConfigured(): boolean {
    return this.client !== null;
  }

  async complete(systemPrompt: string, userPrompt: string): Promise<string> {
    if (!this.client) {
      throw new Error("OpenAI API key is not configured.");
    }

    const response = await this.client.chat.completions.create({
      model: this.textModel,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.4,
    });

    return response.choices[0]?.message?.content?.trim() ?? "";
  }

  async generateImage(prompt: string): Promise<Buffer> {
    if (!this.client) {
      throw new Error("OpenAI API key is not configured.");
    }

    const response = await this.client.images.generate({
      model: this.imageModel,
      prompt,
      size: "1024x1024",
      response_format: "b64_json",
    });

    const base64 = response.data?.[0]?.b64_json;
    if (!base64) {
      throw new Error("Image generation returned no data.");
    }

    return Buffer.from(base64, "base64");
  }
}
