import { createWorker } from "tesseract.js";
import { writeFile, readFile, readdir } from "fs/promises";
import { join } from "path";
import { withTempWorkspace, runCli } from "@/modules/pdf-tools/engines/cli.util";
import { resolveBinary } from "@/modules/pdf-tools/engines/bin-paths.util";

async function recognize(buffer: Buffer): Promise<string> {
  const worker = await createWorker("eng");
  try {
    const {
      data: { text },
    } = await worker.recognize(buffer);
    return text.trim();
  } finally {
    await worker.terminate();
  }
}

export async function ocrImageEngine(buffer: Buffer): Promise<string> {
  return recognize(buffer);
}

export async function ocrPdfEngine(buffer: Buffer): Promise<string> {
  return withTempWorkspace(async (workspaceDir) => {
    const inputPath = join(workspaceDir, "input.pdf");
    const outputPrefix = join(workspaceDir, "page");
    await writeFile(inputPath, buffer);

    await runCli(resolveBinary("pdftoppm"), ["-jpeg", "-r", "200", inputPath, outputPrefix]);

    const files = (await readdir(workspaceDir)).filter((name) => name.startsWith("page") && name.endsWith(".jpg"));
    files.sort();

    const pageTexts: string[] = [];
    for (const file of files) {
      const imageBuffer = await readFile(join(workspaceDir, file));
      pageTexts.push(await recognize(imageBuffer));
    }

    return pageTexts.join("\n\n");
  });
}
