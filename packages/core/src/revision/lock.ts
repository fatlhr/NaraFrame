import { mkdir, open, readFile, stat, unlink } from "node:fs/promises";
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

/** How long a lock without a readable owner may still be mid-write. */
const UNREADABLE_LOCK_GRACE_MS = 5_000;

const isFresh = async (lockPath: string): Promise<boolean> => {
  try {
    const { mtimeMs } = await stat(lockPath);
    return Date.now() - mtimeMs < UNREADABLE_LOCK_GRACE_MS;
  } catch {
    return false;
  }
};

/**
 * One writer per project. A lock whose owner process is gone is taken over,
 * so a crash cannot wedge the project. With `waitMs`, a short append waits
 * for a live holder instead of failing, up to that bound.
 */
export const withProjectLock = async <T>(
  root: string,
  work: () => Promise<Result<T>>,
  options: { waitMs?: number } = {},
): Promise<Result<T>> => {
  const deadline = Date.now() + (options.waitMs ?? 0);
  for (;;) {
    const result = await withProjectLockOnce(root, work);
    const locked =
      !result.ok &&
      result.issues.some((issue) => issue.code === "PROJECT_LOCKED");
    if (!locked || Date.now() >= deadline) return result;
    await new Promise((resolveWait) => setTimeout(resolveWait, 20));
  }
};

const withProjectLockOnce = async <T>(
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
      // The holder creates the file before it writes its pid, so an
      // unreadable lock is usually one being written right now. Treat it as
      // held until it is too old for that, which still frees a lock left by a
      // crash between those two steps.
      ownerAlive = await isFresh(lockPath);
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
