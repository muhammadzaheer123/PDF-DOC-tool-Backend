import { writeFile, readFile } from "fs/promises";
import { join } from "path";
import { withTempWorkspace, runCli } from "@/modules/pdf-tools/engines/cli.util";
import { resolveBinary } from "@/modules/pdf-tools/engines/bin-paths.util";
import { EngineResult } from "@/modules/pdf-tools/engines/engine-result.type";

export async function compressPdfEngine(inputBuffer: Buffer): Promise<EngineResult> {
  return withTempWorkspace(async (workspaceDir) => {
    const inputPath = join(workspaceDir, "input.pdf");
    const outputPath = join(workspaceDir, "output.pdf");
    await writeFile(inputPath, inputBuffer);

    await runCli(resolveBinary("ghostscript"), [
      "-sDEVICE=pdfwrite",
      "-dCompatibilityLevel=1.4",
      "-dPDFSETTINGS=/ebook",
      "-dNOPAUSE",
      "-dQUIET",
      "-dBATCH",
      `-sOutputFile=${outputPath}`,
      inputPath,
    ]);

    const buffer = await readFile(outputPath);
    return { buffer, filename: "compressed.pdf", mimeType: "application/pdf" };
  });
}
