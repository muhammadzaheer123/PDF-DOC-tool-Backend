export type JobLifecycleStatus = "queued" | "processing" | "completed" | "failed";

export interface JobStatusPayload {
  jobId: string;
  status: JobLifecycleStatus;
  progress: number;
  resultUrl?: string;
  resultText?: string;
  error?: string;
}
