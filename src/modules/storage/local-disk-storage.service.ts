import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { mkdir, writeFile, unlink } from "fs/promises";
import { existsSync } from "fs";
import { join, extname } from "path";
import { v4 as uuid } from "uuid";
import { AppConfig } from "@/config/configuration";
import { StorageService, StoredFile } from "@/modules/storage/storage.interface";

@Injectable()
export class LocalDiskStorageService implements StorageService {
  private readonly uploadDir: string;
  private readonly resultDir: string;
  private readonly publicBaseUrl: string;

  constructor(@Inject(ConfigService) private readonly configService: ConfigService) {
    const storageConfig = this.configService.get<AppConfig["storage"]>("storage")!;
    this.uploadDir = join(process.cwd(), storageConfig.uploadDir);
    this.resultDir = join(process.cwd(), storageConfig.resultDir);
    this.publicBaseUrl = storageConfig.publicBaseUrl;
    this.ensureDirs();
  }

  private ensureDirs(): void {
    if (!existsSync(this.uploadDir)) {
      void mkdir(this.uploadDir, { recursive: true });
    }
    if (!existsSync(this.resultDir)) {
      void mkdir(this.resultDir, { recursive: true });
    }
  }

  async saveUpload(buffer: Buffer, originalName: string): Promise<StoredFile> {
    const key = `uploads/${uuid()}${extname(originalName)}`;
    return this.write(this.uploadDir, key.replace("uploads/", ""), buffer, key);
  }

  async saveResult(buffer: Buffer, filename: string): Promise<StoredFile> {
    const key = `results/${uuid()}-${filename}`;
    return this.write(this.resultDir, key.replace("results/", ""), buffer, key);
  }

  private async write(dir: string, physicalName: string, buffer: Buffer, key: string): Promise<StoredFile> {
    const absolutePath = join(dir, physicalName);
    await writeFile(absolutePath, buffer);
    return {
      key,
      url: this.getPublicUrl(key),
      absolutePath,
    };
  }

  getAbsolutePath(key: string): string {
    if (key.startsWith("uploads/")) {
      return join(this.uploadDir, key.replace("uploads/", ""));
    }
    return join(this.resultDir, key.replace("results/", ""));
  }

  getPublicUrl(key: string): string {
    return `${this.publicBaseUrl}/${key}`;
  }

  async delete(key: string): Promise<void> {
    const path = this.getAbsolutePath(key);
    if (existsSync(path)) {
      await unlink(path);
    }
  }
}
