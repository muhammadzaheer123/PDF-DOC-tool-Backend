import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Job, JobSchema } from "@/modules/jobs/schemas/job.schema";
import { JobsService } from "@/modules/jobs/jobs.service";
import { JobsController } from "@/modules/jobs/jobs.controller";
import { StorageModule } from "@/modules/storage/storage.module";

@Module({
  imports: [MongooseModule.forFeature([{ name: Job.name, schema: JobSchema }]), StorageModule],
  controllers: [JobsController],
  providers: [JobsService],
  exports: [JobsService],
})
export class JobsModule {}
