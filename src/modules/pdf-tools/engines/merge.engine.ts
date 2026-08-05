import { PDFDocument } from "pdf-lib";
import { EngineResult } from "@/modules/pdf-tools/engines/engine-result.type";

export async function mergePdfEngine(inputBuffers: Buffer[]): Promise<EngineResult> {
  const mergedPdf = await PDFDocument.create();

  for (const buffer of inputBuffers) {
    const sourcePdf = await PDFDocument.load(buffer);
    const pages = await mergedPdf.copyPages(sourcePdf, sourcePdf.getPageIndices());
    pages.forEach((page) => mergedPdf.addPage(page));
  }

  const bytes = await mergedPdf.save();
  return { buffer: Buffer.from(bytes), filename: "merged.pdf", mimeType: "application/pdf" };
}
