import { Inject, Injectable, Logger } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { QUEUE_NAMES } from "@/common/constants/queues.constants";
import { STORAGE_SERVICE, StorageService } from "@/modules/storage/storage.interface";
import { JobsService } from "@/modules/jobs/jobs.service";

export interface PdfJobData {
  jobId: string;
  toolSlug: string;
  inputFileKeys: string[];
  options: Record<string, string>;
}

@Injectable()
export class PdfToolsService {
  private readonly logger = new Logger(PdfToolsService.name);

  constructor(
    @Inject(STORAGE_SERVICE) private readonly storageService: StorageService,
    private readonly jobsService: JobsService,
    @InjectQueue(QUEUE_NAMES.PDF) private readonly pdfQueue: Queue<PdfJobData>
  ) {}

  async submit(toolSlug: string, files: Express.Multer.File[], options: Record<string, string> = {}) {
    const stored = await Promise.all(
      files.map((file) => this.storageService.saveUpload(file.buffer, file.originalname))
    );
    const inputFileKeys = stored.map((file) => file.key);

    const jobId = await this.jobsService.createJob(toolSlug, inputFileKeys, options);

    await this.pdfQueue.add(toolSlug, { jobId, toolSlug, inputFileKeys, options });
    this.logger.log(`Enqueued PDF job ${jobId} (${toolSlug})`);

    return { jobId, fileKey: inputFileKeys[0] };
  }
}
