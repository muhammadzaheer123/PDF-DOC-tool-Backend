import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { ServeStaticModule } from "@nestjs/serve-static";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { join } from "path";
import configuration, { AppConfig } from "@/config/configuration";
import { JobsModule } from "@/modules/jobs/jobs.module";
import { PdfToolsModule } from "@/modules/pdf-tools/pdf-tools.module";
import { AiToolsModule } from "@/modules/ai-tools/ai-tools.module";
import { AuthModule } from "./modules/auth/auth.module";
import { JwtAuthGuard } from "@/modules/auth/guards/jwt-auth.guard";
import { RolesGuard } from "@/modules/auth/guards/roles.guard";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<AppConfig["mongoUri"]>("mongoUri"),
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000,
        bufferCommands: false,
      }),
    }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), "storage"),
      serveRoot: "/files",
    }),
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60_000, limit: 60 }],
    }),
    AuthModule,
    JobsModule,
    PdfToolsModule,
    AiToolsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
