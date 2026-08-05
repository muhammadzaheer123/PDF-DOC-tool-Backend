import { writeFile, readFile, readdir } from "fs/promises";
import { createWriteStream } from "fs";
import { join } from "path";
import archiver from "archiver";
import { withTempWorkspace, runCli } from "@/modules/pdf-tools/engines/cli.util";
import { resolveBinary } from "@/modules/pdf-tools/engines/bin-paths.util";
import { EngineResult } from "@/modules/pdf-tools/engines/engine-result.type";

export async function pdfToJpgEngine(inputBuffer: Buffer): Promise<EngineResult> {
  return withTempWorkspace(async (workspaceDir) => {
    const inputPath = join(workspaceDir, "input.pdf");
    const outputPrefix = join(workspaceDir, "page");
    await writeFile(inputPath, inputBuffer);

    await runCli(resolveBinary("pdftoppm"), ["-jpeg", "-r", "150", inputPath, outputPrefix]);

    const files = (await readdir(workspaceDir)).filter((name) => name.startsWith("page") && name.endsWith(".jpg"));
    files.sort();

    if (files.length === 1) {
      const buffer = await readFile(join(workspaceDir, files[0]));
      return { buffer, filename: "page.jpg", mimeType: "image/jpeg" };
    }

    const zipPath = join(workspaceDir, "pages.zip");
    const output = createWriteStream(zipPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    const archiveDone = new Promise<void>((resolve, reject) => {
      output.on("close", resolve);
      output.on("error", reject);
      archive.on("error", reject);
    });

    archive.pipe(output);

    for (const file of files) {
      const buffer = await readFile(join(workspaceDir, file));
      archive.append(buffer, { name: file });
    }

    await archive.finalize();
    await archiveDone;

    const buffer = await readFile(zipPath);
    return { buffer, filename: "pages.zip", mimeType: "application/zip" };
  });
}
