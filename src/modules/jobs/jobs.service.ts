import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { ConfigService } from "@nestjs/config";
import { v4 as uuid } from "uuid";
import { Job, JobDocument } from "@/modules/jobs/schemas/job.schema";
import { JobStatusPayload } from "@/modules/jobs/types/job-status.type";

@Injectable()
export class JobsService {
  private readonly backendPublicUrl: string;
  private readonly apiPrefix: string;

  constructor(
    @InjectModel(Job.name) private readonly jobModel: Model<JobDocument>,
    private readonly configService: ConfigService,
  ) {
    this.backendPublicUrl = this.configService.get<string>("backendPublicUrl")!;
    this.apiPrefix = this.configService.get<string>("apiPrefix")!;
  }

  async createJob(
    toolSlug: string,
    inputFileKeys: string[],
    options: Record<string, string> = {},
  ): Promise<string> {
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
    await this.jobModel.updateOne(
      { jobId },
      { status: "processing", progress },
    );
  }

  async updateProgress(jobId: string, progress: number): Promise<void> {
    await this.jobModel.updateOne({ jobId }, { progress });
  }

  async markCompleted(
    jobId: string,
    result: { resultFileKey?: string; resultText?: string },
  ): Promise<void> {
    await this.jobModel.updateOne(
      { jobId },
      { status: "completed", progress: 100, ...result },
    );
  }

  async markCompletedWithData(
    jobId: string,
    buffer: Buffer,
    filename: string,
    mimeType: string,
  ): Promise<void> {
    await this.jobModel.updateOne(
      { jobId },
      {
        status: "completed",
        progress: 100,
        resultData: buffer.toString("base64"),
        resultFilename: filename,
        resultMimeType: mimeType,
      },
    );
  }

  async markFailed(jobId: string, errorMessage: string): Promise<void> {
    await this.jobModel.updateOne(
      { jobId },
      { status: "failed", errorMessage },
    );
  }

  async getResultFile(
    jobId: string,
  ): Promise<{ buffer: Buffer; filename: string; mimeType: string }> {
    const job = await this.jobModel.findOne({ jobId }).lean();
    if (!job || !job.resultData) {
      throw new NotFoundException("Result not found.");
    }
    return {
      buffer: Buffer.from(job.resultData, "base64"),
      filename: job.resultFilename ?? "result",
      mimeType: job.resultMimeType ?? "application/octet-stream",
    };
  }

  async getStatusPayload(jobId: string): Promise<JobStatusPayload> {
    const job = await this.jobModel.findOne({ jobId }).lean();
    if (!job) {
      throw new NotFoundException("Job not found.");
    }

    const resultUrl = job.resultData
      ? `${this.backendPublicUrl}/${this.apiPrefix}/jobs/${job.jobId}/download`
      : undefined;

    return {
      jobId: job.jobId,
      status: job.status,
      progress: job.progress,
      resultUrl,
      resultText: job.resultText,
      error: job.errorMessage,
    };
  }
}
