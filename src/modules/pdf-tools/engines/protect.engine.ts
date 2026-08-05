import { writeFile, readFile } from "fs/promises";
import { join } from "path";
import { withTempWorkspace, runCli } from "@/modules/pdf-tools/engines/cli.util";
import { resolveBinary } from "@/modules/pdf-tools/engines/bin-paths.util";
import { EngineResult } from "@/modules/pdf-tools/engines/engine-result.type";

export async function protectPdfEngine(inputBuffer: Buffer, password: string): Promise<EngineResult> {
  return withTempWorkspace(async (workspaceDir) => {
    const inputPath = join(workspaceDir, "input.pdf");
    const outputPath = join(workspaceDir, "output.pdf");
    await writeFile(inputPath, inputBuffer);

    await runCli(resolveBinary("qpdf"), [
      "--encrypt",
      password,
      password,
      "256",
      "--",
      inputPath,
      outputPath,
    ]);

    const buffer = await readFile(outputPath);
    return { buffer, filename: "protected.pdf", mimeType: "application/pdf" };
  });
}
