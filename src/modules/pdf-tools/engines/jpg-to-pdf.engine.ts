import { PDFDocument } from "pdf-lib";
import { EngineResult } from "@/modules/pdf-tools/engines/engine-result.type";

export async function jpgToPdfEngine(inputBuffers: Buffer[]): Promise<EngineResult> {
  const pdfDoc = await PDFDocument.create();

  for (const buffer of inputBuffers) {
    const image = await pdfDoc.embedJpg(buffer);
    const page = pdfDoc.addPage([image.width, image.height]);
    page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
  }

  const bytes = await pdfDoc.save();
  return { buffer: Buffer.from(bytes), filename: "images.pdf", mimeType: "application/pdf" };
}
