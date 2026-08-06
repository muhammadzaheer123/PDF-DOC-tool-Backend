import { Injectable, Logger } from "@nestjs/common";
import { JobsService } from "@/modules/jobs/jobs.service";
import { mergePdfEngine } from "@/modules/pdf-tools/engines/merge.engine";
import { splitPdfEngine } from "@/modules/pdf-tools/engines/split.engine";
import { rotatePdfEngine } from "@/modules/pdf-tools/engines/rotate.engine";
import { jpgToPdfEngine } from "@/modules/pdf-tools/engines/jpg-to-pdf.engine";
import { EngineResult } from "@/modules/pdf-tools/engines/engine-result.type";

export interface PdfJobData {
  jobId: string;
  toolSlug: string;
  inputFileKeys: string[];
  options: Record<string, string>;
}

const SYNC_CAPABLE_TOOLS = new Set([
  "merge-pdf",
  "split-pdf",
  "rotate-pdf",
  "jpg-to-pdf",
]);

const COMING_SOON_MESSAGE =
  "This tool needs extra server software that isn't available on our current hosting yet. We're upgrading the server soon — please check back shortly.";

@Injectable()
export class PdfToolsService {
  private readonly logger = new Logger(PdfToolsService.name);

  constructor(private readonly jobsService: JobsService) {}

  async submit(
    toolSlug: string,
    files: Express.Multer.File[],
    options: Record<string, string> = {},
  ) {
    const inputFileKeys = files.map((f) => f.originalname);
    const jobId = await this.jobsService.createJob(
      toolSlug,
      inputFileKeys,
      options,
    );

    if (!SYNC_CAPABLE_TOOLS.has(toolSlug)) {
      await this.jobsService.markFailed(jobId, COMING_SOON_MESSAGE);
      return { jobId, fileKey: inputFileKeys[0] };
    }

    try {
      await this.jobsService.markProcessing(jobId, 50);
      const buffers = files.map((f) => f.buffer);
      const result = await this.runEngine(toolSlug, buffers, options);
      await this.jobsService.markCompletedWithData(
        jobId,
        result.buffer,
        result.filename,
        result.mimeType,
      );
      this.logger.log(`Processed PDF job ${jobId} (${toolSlug}) synchronously`);
    } catch (err) {
      this.logger.error(
        `PDF job ${jobId} (${toolSlug}) failed`,
        err instanceof Error ? err.stack : err,
      );
      await this.jobsService.markFailed(
        jobId,
        "Processing failed. Please check your file and try again.",
      );
    }

    return { jobId, fileKey: inputFileKeys[0] };
  }

  private async runEngine(
    toolSlug: string,
    buffers: Buffer[],
    options: Record<string, string>,
  ): Promise<EngineResult> {
    switch (toolSlug) {
      case "merge-pdf":
        return mergePdfEngine(buffers);
      case "split-pdf":
        return splitPdfEngine(buffers[0]);
      case "rotate-pdf":
        return rotatePdfEngine(
          buffers[0],
          parseInt(options.degrees ?? "90", 10),
        );
      case "jpg-to-pdf":
        return jpgToPdfEngine(buffers);
      default:
        throw new Error(`Unknown sync PDF tool: ${toolSlug}`);
    }
  }
}
