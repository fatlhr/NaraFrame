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

  it("normalizes SIGTERM interruption and renderer exit to 130", async () => {
    const emitter = new EventEmitter();
    const delegatedExitCodes: Array<number | string | null | undefined> = [];
    const originalExit = ((code?: number | string | null) => {
      delegatedExitCodes.push(code);
      throw new Error("The original exit must not run for handled SIGTERM.");
    }) as CliProcessHost["exit"];
    const host = Object.assign(emitter, {
      exit: originalExit,
      exitCode: undefined as number | string | null | undefined,
    }) as CliProcessHost;

    const execution = runCliProcess([], {
      host,
      execute: async (_args, options) => {
        await new Promise<void>((resolve) => {
          options.signal?.addEventListener("abort", () => resolve(), {
            once: true,
          });
        });
        host.exit(143);
        return 143;
      },
    });

    emitter.emit("SIGTERM");

    await expect(execution).resolves.toBe(130);
    expect(host.exitCode).toBe(130);
    expect(delegatedExitCodes).toEqual([]);
    expect(host.exit).toBe(originalExit);
    expect(emitter.listenerCount("SIGTERM")).toBe(0);
  });

  it("keeps a preview successful when SIGTERM arrives after rename dispatch", async () => {
    const emitter = new EventEmitter();
    const delegatedExitCodes: Array<number | string | null | undefined> = [];
    const originalExit = ((code?: number | string | null) => {
      delegatedExitCodes.push(code);
      throw new Error("The original exit must not run after preview commit.");
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
        const commit = options.onPreviewRenameDispatched;
        if (!commit)
          throw new Error("Preview rename callback was not provided.");
        commit();
        emitter.emit("SIGTERM");
        expect(options.signal?.aborted).toBe(false);
        return 0;
      },
    });

    await expect(execution).resolves.toBe(0);
    expect(observedSignal?.aborted).toBe(false);
    expect(host.exitCode).toBeUndefined();
    expect(delegatedExitCodes).toEqual([]);
    expect(host.exit).toBe(originalExit);
  });
});
