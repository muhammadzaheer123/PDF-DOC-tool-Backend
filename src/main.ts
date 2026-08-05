import { NestFactory } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import { ValidationPipe } from "@nestjs/common";
import helmet from "helmet";
import { AppModule } from "@/app.module";
import { AllExceptionsFilter } from "@/common/filters/all-exceptions.filter";
import { ResponseInterceptor } from "@/common/response/response.interceptor";
import { sanitizeRequestBody } from "@/common/middleware/sanitize-request-body.middleware";
import { AppConfig } from "@/config/configuration";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.getHttpAdapter().getInstance().set("etag", false);
  const configService = app.get(ConfigService);

  const apiPrefix = configService.get<AppConfig["apiPrefix"]>("apiPrefix")!;
  const corsOrigin = configService.get<AppConfig["corsOrigin"]>("corsOrigin")!;
  const port = configService.get<AppConfig["port"]>("port")!;

  app.use(helmet());
  app.use(sanitizeRequestBody);
  app.setGlobalPrefix(apiPrefix);
  app.enableCors({ origin: corsOrigin, credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  await app.listen(port);
}

void bootstrap();
