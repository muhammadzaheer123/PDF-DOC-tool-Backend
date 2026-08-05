import { execFile } from "child_process";
import { promisify } from "util";
import { mkdtemp, rm } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";

const execFileAsync = promisify(execFile);

export async function withTempWorkspace<T>(run: (workspaceDir: string) => Promise<T>): Promise<T> {
  const workspaceDir = await mkdtemp(join(tmpdir(), "docuforge-"));
  try {
    return await run(workspaceDir);
  } finally {
    await rm(workspaceDir, { recursive: true, force: true });
  }
}

export async function runCli(binary: string, args: string[], timeoutMs = 60_000, cwd?: string): Promise<void> {
  const cleanEnv = { ...process.env };
  delete cleanEnv.PYTHONHOME;
  delete cleanEnv.PYTHONPATH;

  try {
    await execFileAsync(binary, args, { timeout: timeoutMs, env: cleanEnv, cwd });
  } catch (err) {
    const error = err as { stderr?: string; message: string };
    throw new Error(`${binary} failed: ${error.stderr ?? error.message}`);
  }
}
