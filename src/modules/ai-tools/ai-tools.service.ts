import { Inject, Injectable } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { QUEUE_NAMES } from "@/common/constants/queues.constants";
import { STORAGE_SERVICE, StorageService } from "@/modules/storage/storage.interface";
import { JobsService } from "@/modules/jobs/jobs.service";

export interface AiJobData {
  jobId: string;
  toolSlug: string;
  inputFileKeys: string[];
  originalFileNames: string[];
  options: Record<string, string>;
}

@Injectable()
export class AiToolsService {
  constructor(
    @Inject(STORAGE_SERVICE) private readonly storageService: StorageService,
    private readonly jobsService: JobsService,
    @InjectQueue(QUEUE_NAMES.AI) private readonly aiQueue: Queue<AiJobData>
  ) {}

  async submitFileJob(toolSlug: string, file: Express.Multer.File, options: Record<string, string> = {}) {
    const stored = await this.storageService.saveUpload(file.buffer, file.originalname);
    const jobId = await this.jobsService.createJob(toolSlug, [stored.key], options);

    await this.aiQueue.add(toolSlug, {
      jobId,
      toolSlug,
      inputFileKeys: [stored.key],
      originalFileNames: [file.originalname],
      options,
    });

    return { jobId, fileKey: stored.key };
  }

  async submitPromptJob(toolSlug: string, prompt: string, options: Record<string, string> = {}) {
    const jobId = await this.jobsService.createJob(toolSlug, [], { ...options, prompt });

    await this.aiQueue.add(toolSlug, {
      jobId,
      toolSlug,
      inputFileKeys: [],
      originalFileNames: [],
      options: { ...options, prompt },
    });

    return { jobId, fileKey: "" };
  }
}
