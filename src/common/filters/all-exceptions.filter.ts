import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from "@nestjs/common";
import { Response } from "express";
import { fail } from "@/common/response/api-response.interface";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = isHttpException
      ? this.extractMessage(exception)
      : "Something went wrong. Please try again.";

    if (!isHttpException) {
      this.logger.error(exception instanceof Error ? exception.stack : exception);
    }

    response.status(status).json(fail(message, status === HttpStatus.UNAUTHORIZED));
  }

  private extractMessage(exception: HttpException): string {
    const response = exception.getResponse();
    if (typeof response === "string") return response;
    if (typeof response === "object" && response !== null && "message" in response) {
      const msg = (response as { message: string | string[] }).message;
      return Array.isArray(msg) ? msg.join(", ") : msg;
    }
    return exception.message;
  }
}
