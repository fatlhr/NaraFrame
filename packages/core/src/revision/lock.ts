import { mkdir, open, readFile, unlink } from "node:fs/promises";
import { join } from "node:path";
import type { Result } from "../model/issue.js";
import { issueFor } from "./store.js";

const isProcessAlive = (pid: number): boolean => {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === "EPERM";
  }
};

/**
 * One writer per project. A lock whose owner process is gone is taken over,
 * so a crash cannot wedge the project.
 */
export const withProjectLock = async <T>(
  root: string,
  work: () => Promise<Result<T>>,
): Promise<Result<T>> => {
  const directory = join(root, ".naraframe");
  const lockPath = join(directory, "lock");
  await mkdir(directory, { recursive: true });

  const acquire = async (): Promise<boolean> => {
    try {
      const handle = await open(lockPath, "wx");
      await handle.writeFile(
        JSON.stringify({ pid: process.pid, at: new Date().toISOString() }),
      );
      await handle.close();
      return true;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
      return false;
    }
  };

  if (!(await acquire())) {
    let ownerAlive = true;
    try {
      const owner = JSON.parse(await readFile(lockPath, "utf8")) as {
        pid?: number;
      };
      ownerAlive = typeof owner.pid === "number" && isProcessAlive(owner.pid);
    } catch {
      ownerAlive = false;
    }
    if (ownerAlive) {
      return {
        ok: false,
        issues: [
          issueFor(
            "PROJECT_LOCKED",
            "Another NaraFrame operation is changing this project.",
            "Wait for it to finish and retry.",
          ),
        ],
      };
    }
    await unlink(lockPath).catch(() => undefined);
    if (!(await acquire())) {
      return {
        ok: false,
        issues: [
          issueFor(
            "PROJECT_LOCKED",
            "Could not take the project lock.",
            "Retry in a moment.",
          ),
        ],
      };
    }
  }

  try {
    return await work();
  } finally {
    await unlink(lockPath).catch(() => undefined);
  }
};
