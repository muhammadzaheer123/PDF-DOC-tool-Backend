import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { v4 as uuid } from "uuid";
import { STORAGE_SERVICE, StorageService } from "@/modules/storage/storage.interface";
import { Job, JobDocument } from "@/modules/jobs/schemas/job.schema";
import { JobStatusPayload } from "@/modules/jobs/types/job-status.type";

@Injectable()
export class JobsService {
  constructor(
    @InjectModel(Job.name) private readonly jobModel: Model<JobDocument>,
    @Inject(STORAGE_SERVICE) private readonly storageService: StorageService
  ) {}

  async createJob(toolSlug: string, inputFileKeys: string[], options: Record<string, string> = {}): Promise<string> {
    const jobId = uuid();
    await this.jobModel.create({
      jobId,
      toolSlug,
      status: "queued",
      progress: 0,
      inputFileKeys,
      options,
    });
    return jobId;
  }

  async markProcessing(jobId: string, progress = 10): Promise<void> {
    await this.jobModel.updateOne({ jobId }, { status: "processing", progress });
  }

  async updateProgress(jobId: string, progress: number): Promise<void> {
    await this.jobModel.updateOne({ jobId }, { progress });
  }

  async markCompleted(jobId: string, result: { resultFileKey?: string; resultText?: string }): Promise<void> {
    await this.jobModel.updateOne(
      { jobId },
      { status: "completed", progress: 100, ...result }
    );
  }

  async markFailed(jobId: string, errorMessage: string): Promise<void> {
    await this.jobModel.updateOne({ jobId }, { status: "failed", errorMessage });
  }

  async getStatusPayload(jobId: string): Promise<JobStatusPayload> {
    const job = await this.jobModel.findOne({ jobId }).lean();
    if (!job) {
      throw new NotFoundException("Job not found.");
    }

    return {
      jobId: job.jobId,
      status: job.status,
      progress: job.progress,
      resultUrl: job.resultFileKey ? this.storageService.getPublicUrl(job.resultFileKey) : undefined,
      resultText: job.resultText,
      error: job.errorMessage,
    };
  }
}
