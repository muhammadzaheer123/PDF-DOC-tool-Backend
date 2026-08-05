import { memoryStorage } from "multer";

export function multerOptions(maxFileSizeMb: number) {
  return {
    storage: memoryStorage(),
    limits: {
      fileSize: maxFileSizeMb * 1024 * 1024,
    },
  };
}
