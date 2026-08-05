import { NestFactory } from "@nestjs/core";
import { ExpressAdapter } from "@nestjs/platform-express";
import { ConfigService } from "@nestjs/config";
import { ValidationPipe, INestApplication } from "@nestjs/common";
import express, { Request, Response } from "express";
import helmet from "helmet";
import { AppModule } from "../src/app.module";
import { AllExceptionsFilter } from "../src/common/filters/all-exceptions.filter";
import { ResponseInterceptor } from "../src/common/response/response.interceptor";
import { sanitizeRequestBody } from "../src/common/middleware/sanitize-request-body.middleware";
import { AppConfig } from "../src/config/configuration";

const server = express();
let cachedApp: INestApplication | null = null;

async function bootstrap(): Promise<INestApplication> {
  if (cachedApp) return cachedApp;

  const app = await NestFactory.create(AppModule, new ExpressAdapter(server));
  app.getHttpAdapter().getInstance().set("etag", false);

  const configService = app.get(ConfigService);
  const apiPrefix = configService.get<AppConfig["apiPrefix"]>("apiPrefix")!;
  const corsOrigin = configService.get<AppConfig["corsOrigin"]>("corsOrigin")!;

  app.use(helmet());
  app.use(sanitizeRequestBody);
  app.setGlobalPrefix(apiPrefix);
  app.enableCors({ origin: corsOrigin, credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  await app.init();
  cachedApp = app;
  return app;
}

export default async function handler(req: Request, res: Response) {
  await bootstrap();
  server(req, res);
}
