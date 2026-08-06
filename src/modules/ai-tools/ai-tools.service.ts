import { Injectable, Logger } from "@nestjs/common";
import { JobsService } from "@/modules/jobs/jobs.service";
import { extractTextFromFile } from "@/modules/ai-tools/engines/text-extract.util";
import {
  ocrImageEngine,
  ocrPdfEngine,
} from "@/modules/ai-tools/engines/ocr.engine";
import { LlmTaskEngine } from "@/modules/ai-tools/engines/llm-task.engine";
import { TextToImageEngine } from "@/modules/ai-tools/engines/text-to-image.engine";

export interface AiJobData {
  jobId: string;
  toolSlug: string;
  inputFileKeys: string[];
  originalFileNames: string[];
  options: Record<string, string>;
}

const TEXT_ONLY_TOOLS = new Set(["ai-ocr", "ai-image-to-text"]);
const LLM_FROM_FILE_TOOLS = new Set([
  "ai-pdf-summarizer",
  "ai-document-translator",
  "ai-grammar-rewrite",
  "ai-resume-analyzer",
  "ai-contract-analyzer",
  "ai-invoice-extractor",
  "ai-chat-with-pdf",
  "ai-pdf-qa",
]);
const LLM_FROM_PROMPT_TOOLS = new Set([
  "ai-document-generator",
  "ai-proposal-writer",
]);

@Injectable()
export class AiToolsService {
  private readonly logger = new Logger(AiToolsService.name);

  constructor(
    private readonly jobsService: JobsService,
    private readonly llmTaskEngine: LlmTaskEngine,
    private readonly textToImageEngine: TextToImageEngine,
  ) {}

  async submitFileJob(
    toolSlug: string,
    file: Express.Multer.File,
    options: Record<string, string> = {},
  ) {
    const jobId = await this.jobsService.createJob(
      toolSlug,
      [file.originalname],
      options,
    );
    await this.processFileJob(jobId, toolSlug, file, options);
    return { jobId, fileKey: file.originalname };
  }

  async submitPromptJob(
    toolSlug: string,
    prompt: string,
    options: Record<string, string> = {},
  ) {
    const jobId = await this.jobsService.createJob(toolSlug, [], {
      ...options,
      prompt,
    });
    await this.processPromptJob(jobId, toolSlug, prompt, options);
    return { jobId, fileKey: "" };
  }

  private async processFileJob(
    jobId: string,
    toolSlug: string,
    file: Express.Multer.File,
    options: Record<string, string>,
  ): Promise<void> {
    try {
      await this.jobsService.markProcessing(jobId, 20);

      if (TEXT_ONLY_TOOLS.has(toolSlug)) {
        const text = await this.runOcr(file.buffer, file.originalname);
        await this.jobsService.updateProgress(jobId, 90);
        await this.jobsService.markCompleted(jobId, { resultText: text });
        return;
      }

      if (LLM_FROM_FILE_TOOLS.has(toolSlug)) {
        const extracted = await extractTextFromFile(
          file.buffer,
          file.originalname,
        );
        await this.jobsService.updateProgress(jobId, 55);

        const result = await this.llmTaskEngine.run(
          toolSlug,
          extracted,
          options,
        );
        await this.jobsService.updateProgress(jobId, 90);
        await this.jobsService.markCompleted(jobId, { resultText: result });
        return;
      }

      throw new Error(`Unknown AI file tool: ${toolSlug}`);
    } catch (err) {
      this.logger.error(
        `AI job ${jobId} (${toolSlug}) failed`,
        err instanceof Error ? err.stack : err,
      );
      await this.jobsService.markFailed(jobId, this.friendlyError(err));
    }
  }

  private async processPromptJob(
    jobId: string,
    toolSlug: string,
    prompt: string,
    options: Record<string, string>,
  ): Promise<void> {
    try {
      await this.jobsService.markProcessing(jobId, 20);

      if (LLM_FROM_PROMPT_TOOLS.has(toolSlug)) {
        const result = await this.llmTaskEngine.run(toolSlug, prompt, options);
        await this.jobsService.updateProgress(jobId, 90);
        await this.jobsService.markCompleted(jobId, { resultText: result });
        return;
      }

      if (toolSlug === "ai-text-to-image") {
        const imageBuffer = await this.textToImageEngine.run(prompt);
        await this.jobsService.updateProgress(jobId, 80);
        await this.jobsService.markCompletedWithData(
          jobId,
          imageBuffer,
          "generated.png",
          "image/png",
        );
        return;
      }

      throw new Error(`Unknown AI prompt tool: ${toolSlug}`);
    } catch (err) {
      this.logger.error(
        `AI job ${jobId} (${toolSlug}) failed`,
        err instanceof Error ? err.stack : err,
      );
      await this.jobsService.markFailed(jobId, this.friendlyError(err));
    }
  }

  private async runOcr(
    buffer: Buffer,
    originalFileName: string,
  ): Promise<string> {
    const extension = originalFileName.split(".").pop()?.toLowerCase() ?? "";
    if (extension === "pdf") {
      return ocrPdfEngine(buffer);
    }
    return ocrImageEngine(buffer);
  }

  private friendlyError(err: unknown): string {
    const message = err instanceof Error ? err.message : "";
    if (message.includes("OpenAI API key is not configured")) {
      return "This tool needs an OpenAI key that isn't set up on the server yet. We're adding it soon — please check back shortly.";
    }
    if (message.includes("pdftoppm") || message.includes("ENOENT")) {
      return "This looks like a scanned PDF, which needs extra server software that isn't available on our current hosting yet.";
    }
    return "Processing failed. Please check your input and try again.";
  }
}
