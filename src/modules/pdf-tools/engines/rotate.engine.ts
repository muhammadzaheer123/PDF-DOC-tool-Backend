import { PDFDocument, degrees } from "pdf-lib";
import { EngineResult } from "@/modules/pdf-tools/engines/engine-result.type";

export async function rotatePdfEngine(inputBuffer: Buffer, degreesToRotate: number): Promise<EngineResult> {
  const pdfDoc = await PDFDocument.load(inputBuffer);

  pdfDoc.getPages().forEach((page) => {
    const currentRotation = page.getRotation().angle;
    page.setRotation(degrees(currentRotation + degreesToRotate));
  });

  const bytes = await pdfDoc.save();
  return { buffer: Buffer.from(bytes), filename: "rotated.pdf", mimeType: "application/pdf" };
}
