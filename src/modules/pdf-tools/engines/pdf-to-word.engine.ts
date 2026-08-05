import { writeFile, readFile, mkdtemp, rm } from "fs/promises";
import { join, dirname } from "path";
import { tmpdir } from "os";
import { withTempWorkspace, runCli } from "@/modules/pdf-tools/engines/cli.util";
import { resolveBinary } from "@/modules/pdf-tools/engines/bin-paths.util";
import { EngineResult } from "@/modules/pdf-tools/engines/engine-result.type";

export async function pdfToWordEngine(inputBuffer: Buffer): Promise<EngineResult> {
  return withTempWorkspace(async (workspaceDir) => {
    const inputPath = join(workspaceDir, "input.pdf");
    await writeFile(inputPath, inputBuffer);

    const binary = resolveBinary("libreoffice");
    const profileDir = await mkdtemp(join(tmpdir(), "lo-profile-"));
    const profileUrl = `file:///${profileDir.replace(/\\/g, "/")}`;

    try {
      await runCli(
        binary,
        [
          "--headless",
          "--norestore",
          `-env:UserInstallation=${profileUrl}`,
          "--convert-to",
          "docx:MS Word 2007 XML",
          "--outdir",
          workspaceDir,
          inputPath,
        ],
        120_000,
        dirname(binary)
      );
    } finally {
      await rm(profileDir, { recursive: true, force: true });
    }

    const buffer = await readFile(join(workspaceDir, "input.docx"));
    return {
      buffer,
      filename: "converted.docx",
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    };
  });
}
