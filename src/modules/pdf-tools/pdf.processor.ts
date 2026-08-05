import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Inject, Logger } from "@nestjs/common";
import { Job } from "bullmq";
import { readFile } from "fs/promises";
import { QUEUE_NAMES } from "@/common/constants/queues.constants";
import { withTimeout } from "@/common/utils/with-timeout.util";
import { STORAGE_SERVICE, StorageService } from "@/modules/storage/storage.interface";
import { JobsService } from "@/modules/jobs/jobs.service";
import { PdfJobData } from "@/modules/pdf-tools/pdf-tools.service";
import { mergePdfEngine } from "@/modules/pdf-tools/engines/merge.engine";
import { splitPdfEngine } from "@/modules/pdf-tools/engines/split.engine";
import { compressPdfEngine } from "@/modules/pdf-tools/engines/compress.engine";
import { rotatePdfEngine } from "@/modules/pdf-tools/engines/rotate.engine";
import { unlockPdfEngine } from "@/modules/pdf-tools/engines/unlock.engine";
import { protectPdfEngine } from "@/modules/pdf-tools/engines/protect.engine";
import { pdfToJpgEngine } from "@/modules/pdf-tools/engines/pdf-to-jpg.engine";
import { jpgToPdfEngine } from "@/modules/pdf-tools/engines/jpg-to-pdf.engine";
import { pdfToWordEngine } from "@/modules/pdf-tools/engines/pdf-to-word.engine";
import { wordToPdfEngine } from "@/modules/pdf-tools/engines/word-to-pdf.engine";
import { EngineResult } from "@/modules/pdf-tools/engines/engine-result.type";

const JOB_TIMEOUT_MS = 120_000;

@Processor(QUEUE_NAMES.PDF, { concurrency: 5 })
export class PdfProcessor extends WorkerHost {
  private readonly logger = new Logger(PdfProcessor.name);

  constructor(
    @Inject(STORAGE_SERVICE) private readonly storageService: StorageService,
    private readonly jobsService: JobsService
  ) {
    super();
  }

  async process(job: Job<PdfJobData>): Promise<void> {
    const { jobId, toolSlug, inputFileKeys, options } = job.data;
    this.logger.log(`Picked up PDF job ${jobId} (${toolSlug})`);

    try {
      await this.jobsService.markProcessing(jobId);

      const inputBuffers = await Promise.all(
        inputFileKeys.map((key) => readFile(this.storageService.getAbsolutePath(key)))
      );

      await this.jobsService.updateProgress(jobId, 40);

      const result = await withTimeout(
        this.runEngine(toolSlug, inputBuffers, options),
        JOB_TIMEOUT_MS,
        "Processing timed out."
      );

      await this.jobsService.updateProgress(jobId, 85);

      const stored = await this.storageService.saveResult(result.buffer, result.filename);
      await this.jobsService.markCompleted(jobId, { resultFileKey: stored.key });
      this.logger.log(`Completed PDF job ${jobId} (${toolSlug})`);
    } catch (err) {
      this.logger.error(`PDF job ${jobId} (${toolSlug}) failed`, err instanceof Error ? err.stack : err);
      await this.jobsService.markFailed(jobId, "Processing failed. Please check your file and try again.");
    }
  }

  private async runEngine(
    toolSlug: string,
    inputBuffers: Buffer[],
    options: Record<string, string>
  ): Promise<EngineResult> {
    switch (toolSlug) {
      case "merge-pdf":
        return mergePdfEngine(inputBuffers);
      case "split-pdf":
        return splitPdfEngine(inputBuffers[0]);
      case "compress-pdf":
        return compressPdfEngine(inputBuffers[0]);
      case "pdf-to-jpg":
        return pdfToJpgEngine(inputBuffers[0]);
      case "jpg-to-pdf":
        return jpgToPdfEngine(inputBuffers);
      case "rotate-pdf":
        return rotatePdfEngine(inputBuffers[0], parseInt(options.degrees ?? "90", 10));
      case "unlock-pdf":
        return unlockPdfEngine(inputBuffers[0], options.password);
      case "protect-pdf":
        return protectPdfEngine(inputBuffers[0], options.password);
      case "pdf-to-word":
        return pdfToWordEngine(inputBuffers[0]);
      case "word-to-pdf":
        return wordToPdfEngine(inputBuffers[0]);
      default:
        throw new Error(`Unknown PDF tool: ${toolSlug}`);
    }
  }
}
