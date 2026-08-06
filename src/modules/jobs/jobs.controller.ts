import { Controller, Get, Header, Param, Res } from "@nestjs/common";
import type { Response } from "express";
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

  @Get(":jobId/download")
  async download(@Param("jobId") jobId: string, @Res() res: Response) {
    const file = await this.jobsService.getResultFile(jobId);
    res.set({
      "Content-Type": file.mimeType,
      "Content-Disposition": `attachment; filename="${file.filename}"`,
    });
    res.send(file.buffer);
  }
}
