import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { JobLifecycleStatus } from "@/modules/jobs/types/job-status.type";

export type JobDocument = Job & Document;

@Schema({ timestamps: true })
export class Job {
  @Prop({ type: String, required: true, unique: true })
  jobId!: string;

  @Prop({ type: String, required: true })
  toolSlug!: string;

  @Prop({
    type: String,
    enum: ["queued", "processing", "completed", "failed"],
    default: "queued",
    required: true,
  })
  status!: JobLifecycleStatus;

  @Prop({ type: Number, default: 0 })
  progress!: number;

  @Prop({ type: [String], default: [] })
  inputFileKeys!: string[];

  @Prop({ type: String, required: false })
  resultFileKey?: string;

  @Prop({ type: String, required: false })
  resultText?: string;

  @Prop({ type: String, required: false })
  errorMessage?: string;

  @Prop({ type: Object, default: {} })
  options!: Record<string, string>;
}

export const JobSchema = SchemaFactory.createForClass(Job);
