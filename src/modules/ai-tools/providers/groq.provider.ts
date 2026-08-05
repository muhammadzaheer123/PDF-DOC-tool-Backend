import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Groq from "groq-sdk";
import { AppConfig } from "@/config/configuration";

@Injectable()
export class GroqProvider {
  private readonly client: Groq | null;
  private readonly model: string;

  constructor(private readonly configService: ConfigService) {
    const groqConfig = this.configService.get<AppConfig["groq"]>("groq")!;
    this.model = groqConfig.model;
    this.client = groqConfig.apiKey ? new Groq({ apiKey: groqConfig.apiKey }) : null;
  }

  get isConfigured(): boolean {
    return this.client !== null;
  }

  async complete(systemPrompt: string, userPrompt: string): Promise<string> {
    if (!this.client) {
      throw new Error("Groq API key is not configured.");
    }

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.4,
    });

    return response.choices[0]?.message?.content?.trim() ?? "";
  }
}
