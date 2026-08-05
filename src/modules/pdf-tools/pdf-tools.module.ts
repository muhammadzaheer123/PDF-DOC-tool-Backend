import { Module } from "@nestjs/common";
import { QueueModule } from "@/modules/queue/queue.module";
import { StorageModule } from "@/modules/storage/storage.module";
import { JobsModule } from "@/modules/jobs/jobs.module";
import { PdfToolsController } from "@/modules/pdf-tools/pdf-tools.controller";
import { PdfToolsService } from "@/modules/pdf-tools/pdf-tools.service";
import { PdfProcessor } from "@/modules/pdf-tools/pdf.processor";

@Module({
  imports: [QueueModule, StorageModule, JobsModule],
  controllers: [PdfToolsController],
  providers: [PdfToolsService, PdfProcessor],
})
export class PdfToolsModule {}
