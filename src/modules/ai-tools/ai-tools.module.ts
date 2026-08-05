import { Module } from "@nestjs/common";
import { QueueModule } from "@/modules/queue/queue.module";
import { StorageModule } from "@/modules/storage/storage.module";
import { JobsModule } from "@/modules/jobs/jobs.module";
import { AiToolsController } from "@/modules/ai-tools/ai-tools.controller";
import { AiToolsService } from "@/modules/ai-tools/ai-tools.service";
import { AiProcessor } from "@/modules/ai-tools/ai.processor";
import { GroqProvider } from "@/modules/ai-tools/providers/groq.provider";
import { OpenAiProvider } from "@/modules/ai-tools/providers/openai.provider";
import { LlmTaskEngine } from "@/modules/ai-tools/engines/llm-task.engine";
import { TextToImageEngine } from "@/modules/ai-tools/engines/text-to-image.engine";

@Module({
  imports: [QueueModule, StorageModule, JobsModule],
  controllers: [AiToolsController],
  providers: [AiToolsService, AiProcessor, GroqProvider, OpenAiProvider, LlmTaskEngine, TextToImageEngine],
})
export class AiToolsModule {}
