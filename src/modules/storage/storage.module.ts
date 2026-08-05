import { Module } from "@nestjs/common";
import { STORAGE_SERVICE } from "@/modules/storage/storage.interface";
import { LocalDiskStorageService } from "@/modules/storage/local-disk-storage.service";

@Module({
  providers: [
    {
      provide: STORAGE_SERVICE,
      useClass: LocalDiskStorageService,
    },
  ],
  exports: [STORAGE_SERVICE],
})
export class StorageModule {}
