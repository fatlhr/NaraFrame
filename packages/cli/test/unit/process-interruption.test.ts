import { EventEmitter } from "node:events";
import { describe, expect, it } from "vitest";
import { type CliProcessHost, runCliProcess } from "../../src/index.js";

describe("CLI process interruption", () => {
  it("suppresses Remotion's immediate SIGINT exit until cleanup completes", async () => {
    const emitter = new EventEmitter();
    const delegatedExitCodes: Array<number | string | null | undefined> = [];
    const originalExit = ((code?: number | string | null) => {
      delegatedExitCodes.push(code);
      throw new Error("The original exit must not run for handled SIGINT.");
    }) as CliProcessHost["exit"];
    const host = Object.assign(emitter, {
      exit: originalExit,
      exitCode: undefined as number | string | null | undefined,
    }) as CliProcessHost;
    let observedSignal: AbortSignal | undefined;

    const execution = runCliProcess([], {
      host,
      execute: async (_args, options) => {
        observedSignal = options.signal;
        await new Promise<void>((resolve) => {
          options.signal?.addEventListener("abort", () => resolve(), {
            once: true,
          });
        });
        host.exit(130);
        return 130;
      },
    });

    emitter.emit("SIGINT");

    await expect(execution).resolves.toBe(130);
    expect(observedSignal?.aborted).toBe(true);
    expect(delegatedExitCodes).toEqual([]);
    expect(host.exit).toBe(originalExit);
    expect(emitter.listenerCount("SIGINT")).toBe(0);
    expect(emitter.listenerCount("SIGTERM")).toBe(0);
  });
});
