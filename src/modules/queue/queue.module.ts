import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { ConfigModule, ConfigService } from "@nestjs/config";
import Redis from "ioredis";
import { QUEUE_NAMES } from "@/common/constants/queues.constants";
import { AppConfig } from "@/config/configuration";

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const redisConfig = configService.get<AppConfig["redis"]>("redis")!;

        if (redisConfig.url) {
          return {
            connection: new Redis(redisConfig.url, { maxRetriesPerRequest: null }),
          };
        }

        return {
          connection: {
            host: redisConfig.host,
            port: redisConfig.port,
            password: redisConfig.password,
            maxRetriesPerRequest: null,
          },
        };
      },
    }),
    BullModule.registerQueue({ name: QUEUE_NAMES.PDF }, { name: QUEUE_NAMES.AI }),
  ],
  exports: [BullModule],
})
export class QueueModule {}
