export interface StoredFile {
  key: string;
  url: string;
  absolutePath: string;
}

export const STORAGE_SERVICE = "STORAGE_SERVICE";

export interface StorageService {
  saveUpload(buffer: Buffer, originalName: string): Promise<StoredFile>;
  saveResult(buffer: Buffer, filename: string): Promise<StoredFile>;
  getAbsolutePath(key: string): string;
  getPublicUrl(key: string): string;
  delete(key: string): Promise<void>;
}
