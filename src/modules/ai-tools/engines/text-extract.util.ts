import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import { ocrImageEngine, ocrPdfEngine } from "@/modules/ai-tools/engines/ocr.engine";

const MIN_MEANINGFUL_TEXT_LENGTH = 30;

export async function extractTextFromFile(buffer: Buffer, originalName: string): Promise<string> {
  const extension = originalName.split(".").pop()?.toLowerCase() ?? "";

  if (extension === "docx") {
    const { value } = await mammoth.extractRawText({ buffer });
    return value.trim();
  }

  if (["jpg", "jpeg", "png", "webp"].includes(extension)) {
    return ocrImageEngine(buffer);
  }

  if (extension === "pdf") {
    const parsed = await pdfParse(buffer);
    const text = parsed.text.trim();

    if (text.length >= MIN_MEANINGFUL_TEXT_LENGTH) {
      return text;
    }

    return ocrPdfEngine(buffer);
  }

  throw new Error(`Unsupported file type for text extraction: .${extension}`);
}
