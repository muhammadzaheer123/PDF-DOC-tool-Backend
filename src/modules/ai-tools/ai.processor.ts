import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Inject, Logger } from "@nestjs/common";
import { Job } from "bullmq";
import { readFile } from "fs/promises";
import { QUEUE_NAMES } from "@/common/constants/queues.constants";
import { withTimeout } from "@/common/utils/with-timeout.util";
import { STORAGE_SERVICE, StorageService } from "@/modules/storage/storage.interface";
import { JobsService } from "@/modules/jobs/jobs.service";
import { AiJobData } from "@/modules/ai-tools/ai-tools.service";
import { ocrImageEngine, ocrPdfEngine } from "@/modules/ai-tools/engines/ocr.engine";
import { extractTextFromFile } from "@/modules/ai-tools/engines/text-extract.util";
import { LlmTaskEngine } from "@/modules/ai-tools/engines/llm-task.engine";
import { TextToImageEngine } from "@/modules/ai-tools/engines/text-to-image.engine";

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
const LLM_FROM_PROMPT_TOOLS = new Set(["ai-document-generator", "ai-proposal-writer"]);
const JOB_TIMEOUT_MS = 120_000;

@Processor(QUEUE_NAMES.AI, { concurrency: 5 })
export class AiProcessor extends WorkerHost {
  private readonly logger = new Logger(AiProcessor.name);

  constructor(
    @Inject(STORAGE_SERVICE) private readonly storageService: StorageService,
    private readonly jobsService: JobsService,
    private readonly llmTaskEngine: LlmTaskEngine,
    private readonly textToImageEngine: TextToImageEngine
  ) {
    super();
  }

  async process(job: Job<AiJobData>): Promise<void> {
    const { jobId, toolSlug } = job.data;
    this.logger.log(`Picked up AI job ${jobId} (${toolSlug})`);

    try {
      await this.jobsService.markProcessing(jobId);
      await withTimeout(this.runTool(job.data), JOB_TIMEOUT_MS, "Processing timed out.");
      this.logger.log(`Completed AI job ${jobId} (${toolSlug})`);
    } catch (err) {
      this.logger.error(`AI job ${jobId} (${toolSlug}) failed`, err instanceof Error ? err.stack : err);
      await this.jobsService.markFailed(jobId, "Processing failed. Please check your input and try again.");
    }
  }

  private async runTool(data: AiJobData): Promise<void> {
    const { jobId, toolSlug, inputFileKeys, originalFileNames, options } = data;

    if (TEXT_ONLY_TOOLS.has(toolSlug)) {
      const text = await this.runOcr(inputFileKeys[0], originalFileNames[0]);
      await this.jobsService.updateProgress(jobId, 90);
      await this.jobsService.markCompleted(jobId, { resultText: text });
      return;
    }

    if (LLM_FROM_FILE_TOOLS.has(toolSlug)) {
      const buffer = await readFile(this.storageService.getAbsolutePath(inputFileKeys[0]));
      const extracted = await extractTextFromFile(buffer, originalFileNames[0]);
      await this.jobsService.updateProgress(jobId, 55);

      const result = await this.llmTaskEngine.run(toolSlug, extracted, options);
      await this.jobsService.updateProgress(jobId, 90);
      await this.jobsService.markCompleted(jobId, { resultText: result });
      return;
    }

    if (LLM_FROM_PROMPT_TOOLS.has(toolSlug)) {
      const result = await this.llmTaskEngine.run(toolSlug, options.prompt ?? "", options);
      await this.jobsService.updateProgress(jobId, 90);
      await this.jobsService.markCompleted(jobId, { resultText: result });
      return;
    }

    if (toolSlug === "ai-text-to-image") {
      const imageBuffer = await this.textToImageEngine.run(options.prompt ?? "");
      await this.jobsService.updateProgress(jobId, 80);
      const stored = await this.storageService.saveResult(imageBuffer, "generated.png");
      await this.jobsService.markCompleted(jobId, { resultFileKey: stored.key });
      return;
    }

    throw new Error(`Unknown AI tool: ${toolSlug}`);
  }

  private async runOcr(fileKey: string, originalFileName: string): Promise<string> {
    const buffer = await readFile(this.storageService.getAbsolutePath(fileKey));
    const extension = originalFileName.split(".").pop()?.toLowerCase() ?? "";

    if (extension === "pdf") {
      return ocrPdfEngine(buffer);
    }
    return ocrImageEngine(buffer);
  }
}
