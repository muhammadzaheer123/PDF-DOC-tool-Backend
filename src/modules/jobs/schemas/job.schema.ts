import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { JobLifecycleStatus } from "@/modules/jobs/types/job-status.type";

export type JobDocument = Job & Document;

@Schema({ timestamps: true })
export class Job {
  @Prop({ required: true, unique: true })
  jobId: string;

  @Prop({ required: true })
  toolSlug: string;

  @Prop({ required: true, enum: ["queued", "processing", "completed", "failed"], default: "queued" })
  status: JobLifecycleStatus;

  @Prop({ default: 0 })
  progress: number;

  @Prop({ type: [String], default: [] })
  inputFileKeys: string[];

  @Prop()
  resultFileKey?: string;

  @Prop()
  resultText?: string;

  @Prop()
  errorMessage?: string;

  @Prop({ type: Object, default: {} })
  options: Record<string, string>;
}

export const JobSchema = SchemaFactory.createForClass(Job);
