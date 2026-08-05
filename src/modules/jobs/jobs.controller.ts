import { Controller, Get, Header, Param } from "@nestjs/common";
import { JobsService } from "@/modules/jobs/jobs.service";
import { Public } from "@/modules/auth/decorators/public.decorator";

@Public()
@Controller("jobs")
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get(":jobId")
  @Header("Cache-Control", "no-store")
  async getStatus(@Param("jobId") jobId: string) {
    return this.jobsService.getStatusPayload(jobId);
  }
}
