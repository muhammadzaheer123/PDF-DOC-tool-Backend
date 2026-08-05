import { Body, Controller, Post, UploadedFile, UploadedFiles, UseInterceptors } from "@nestjs/common";
import { FileInterceptor, FilesInterceptor } from "@nestjs/platform-express";
import { PdfToolsService } from "@/modules/pdf-tools/pdf-tools.service";
import { PdfPasswordOptionsDto, PdfRotateOptionsDto } from "@/modules/pdf-tools/dto/pdf-options.dto";
import { Public } from "@/modules/auth/decorators/public.decorator";

@Public()
@Controller("pdf")
export class PdfToolsController {
  constructor(private readonly pdfToolsService: PdfToolsService) {}

  @Post("merge")
  @UseInterceptors(FilesInterceptor("files", 20))
  merge(@UploadedFiles() files: Express.Multer.File[]) {
    return this.pdfToolsService.submit("merge-pdf", files);
  }

  @Post("split")
  @UseInterceptors(FileInterceptor("files"))
  split(@UploadedFile() file: Express.Multer.File) {
    return this.pdfToolsService.submit("split-pdf", [file]);
  }

  @Post("compress")
  @UseInterceptors(FileInterceptor("files"))
  compress(@UploadedFile() file: Express.Multer.File) {
    return this.pdfToolsService.submit("compress-pdf", [file]);
  }

  @Post("to-jpg")
  @UseInterceptors(FileInterceptor("files"))
  toJpg(@UploadedFile() file: Express.Multer.File) {
    return this.pdfToolsService.submit("pdf-to-jpg", [file]);
  }

  @Post("from-jpg")
  @UseInterceptors(FilesInterceptor("files", 20))
  fromJpg(@UploadedFiles() files: Express.Multer.File[]) {
    return this.pdfToolsService.submit("jpg-to-pdf", files);
  }

  @Post("rotate")
  @UseInterceptors(FileInterceptor("files"))
  rotate(@UploadedFile() file: Express.Multer.File, @Body() options: PdfRotateOptionsDto) {
    return this.pdfToolsService.submit("rotate-pdf", [file], { degrees: options.degrees ?? "90" });
  }

  @Post("unlock")
  @UseInterceptors(FileInterceptor("files"))
  unlock(@UploadedFile() file: Express.Multer.File, @Body() options: PdfPasswordOptionsDto) {
    return this.pdfToolsService.submit("unlock-pdf", [file], { password: options.password });
  }

  @Post("protect")
  @UseInterceptors(FileInterceptor("files"))
  protect(@UploadedFile() file: Express.Multer.File, @Body() options: PdfPasswordOptionsDto) {
    return this.pdfToolsService.submit("protect-pdf", [file], { password: options.password });
  }

  @Post("to-word")
  @UseInterceptors(FileInterceptor("files"))
  toWord(@UploadedFile() file: Express.Multer.File) {
    return this.pdfToolsService.submit("pdf-to-word", [file]);
  }

  @Post("from-word")
  @UseInterceptors(FileInterceptor("files"))
  fromWord(@UploadedFile() file: Express.Multer.File) {
    return this.pdfToolsService.submit("word-to-pdf", [file]);
  }
}
