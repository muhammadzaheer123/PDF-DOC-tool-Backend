export const QUEUE_NAMES = {
  PDF: "pdf-processing",
  AI: "ai-processing",
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];
