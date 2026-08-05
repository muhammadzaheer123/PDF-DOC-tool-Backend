import { Body, Controller, Post, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { AiToolsService } from "@/modules/ai-tools/ai-tools.service";
import { AiFileOptionsDto, AiPromptDto } from "@/modules/ai-tools/dto/ai-options.dto";
import { Public } from "@/modules/auth/decorators/public.decorator";

@Public()
@Controller("ai")
export class AiToolsController {
  constructor(private readonly aiToolsService: AiToolsService) {}

  @Post("summarize")
  @UseInterceptors(FileInterceptor("files"))
  summarize(@UploadedFile() file: Express.Multer.File) {
    return this.aiToolsService.submitFileJob("ai-pdf-summarizer", file);
  }

  @Post("translate")
  @UseInterceptors(FileInterceptor("files"))
  translate(@UploadedFile() file: Express.Multer.File, @Body() options: AiFileOptionsDto) {
    return this.aiToolsService.submitFileJob("ai-document-translator", file, {
      targetLanguage: options.targetLanguage ?? "English",
    });
  }

  @Post("ocr")
  @UseInterceptors(FileInterceptor("files"))
  ocr(@UploadedFile() file: Express.Multer.File) {
    return this.aiToolsService.submitFileJob("ai-ocr", file);
  }

  @Post("grammar")
  @UseInterceptors(FileInterceptor("files"))
  grammar(@UploadedFile() file: Express.Multer.File) {
    return this.aiToolsService.submitFileJob("ai-grammar-rewrite", file);
  }

  @Post("resume-analyze")
  @UseInterceptors(FileInterceptor("files"))
  resumeAnalyze(@UploadedFile() file: Express.Multer.File, @Body() options: AiFileOptionsDto) {
    return this.aiToolsService.submitFileJob("ai-resume-analyzer", file, {
      targetRole: options.targetRole ?? "",
    });
  }

  @Post("contract-analyze")
  @UseInterceptors(FileInterceptor("files"))
  contractAnalyze(@UploadedFile() file: Express.Multer.File) {
    return this.aiToolsService.submitFileJob("ai-contract-analyzer", file);
  }

  @Post("invoice-extract")
  @UseInterceptors(FileInterceptor("files"))
  invoiceExtract(@UploadedFile() file: Express.Multer.File) {
    return this.aiToolsService.submitFileJob("ai-invoice-extractor", file);
  }

  @Post("chat")
  @UseInterceptors(FileInterceptor("files"))
  chat(@UploadedFile() file: Express.Multer.File, @Body() options: AiFileOptionsDto) {
    return this.aiToolsService.submitFileJob("ai-chat-with-pdf", file, {
      question: options.question ?? "",
    });
  }

  @Post("qa")
  @UseInterceptors(FileInterceptor("files"))
  qa(@UploadedFile() file: Express.Multer.File, @Body() options: AiFileOptionsDto) {
    return this.aiToolsService.submitFileJob("ai-pdf-qa", file, {
      question: options.question ?? "",
    });
  }

  @Post("generate-document")
  generateDocument(@Body() body: AiPromptDto) {
    return this.aiToolsService.submitPromptJob("ai-document-generator", body.prompt);
  }

  @Post("image-to-text")
  @UseInterceptors(FileInterceptor("files"))
  imageToText(@UploadedFile() file: Express.Multer.File) {
    return this.aiToolsService.submitFileJob("ai-image-to-text", file);
  }

  @Post("text-to-image")
  textToImage(@Body() body: AiPromptDto) {
    return this.aiToolsService.submitPromptJob("ai-text-to-image", body.prompt);
  }

  @Post("proposal-writer")
  proposalWriter(@Body() body: AiPromptDto) {
    return this.aiToolsService.submitPromptJob("ai-proposal-writer", body.prompt);
  }
}
