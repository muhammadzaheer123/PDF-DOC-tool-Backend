import { PDFDocument } from "pdf-lib";
import archiver from "archiver";
import { createWriteStream } from "fs";
import { readFile } from "fs/promises";
import { join } from "path";
import { withTempWorkspace } from "@/modules/pdf-tools/engines/cli.util";
import { EngineResult } from "@/modules/pdf-tools/engines/engine-result.type";

export async function splitPdfEngine(inputBuffer: Buffer): Promise<EngineResult> {
  return withTempWorkspace(async (workspaceDir) => {
    const sourcePdf = await PDFDocument.load(inputBuffer);
    const pageCount = sourcePdf.getPageCount();

    const outputPath = join(workspaceDir, "split-pages.zip");
    const output = createWriteStream(outputPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    const archiveDone = new Promise<void>((resolve, reject) => {
      output.on("close", resolve);
      output.on("error", reject);
      archive.on("error", reject);
    });

    archive.pipe(output);

    for (let i = 0; i < pageCount; i++) {
      const singlePagePdf = await PDFDocument.create();
      const [page] = await singlePagePdf.copyPages(sourcePdf, [i]);
      singlePagePdf.addPage(page);
      const bytes = await singlePagePdf.save();
      archive.append(Buffer.from(bytes), { name: `page-${i + 1}.pdf` });
    }

    await archive.finalize();
    await archiveDone;

    const buffer = await readFile(outputPath);
    return { buffer, filename: "split-pages.zip", mimeType: "application/zip" };
  });
}
