#!/usr/bin/env node

import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { corePackage } from "@naraframe/core";
import { rendererPackage } from "@naraframe/renderer-remotion";
import { type RunCliOptions, runCommandLine } from "./runner.js";

export const cliPackage = "@naraframe/cli";
export const cliDependencies = [corePackage, rendererPackage] as const;

export interface CliProcessHost {
  exit: (code?: number | string | null) => never;
  exitCode: number | string | null | undefined;
  prependListener(event: "SIGINT" | "SIGTERM", listener: () => void): unknown;
  removeListener(event: "SIGINT" | "SIGTERM", listener: () => void): unknown;
}

export interface RunCliProcessOptions {
  host?: CliProcessHost;
  execute?: typeof runCli;
}

export const runCli = async (
  args = process.argv.slice(2),
  options: RunCliOptions = {},
): Promise<number> => runCommandLine(args, options);

export const runCliProcess = async (
  args = process.argv.slice(2),
  options: RunCliProcessOptions = {},
): Promise<number> => {
  const host = options.host ?? process;
  const execute = options.execute ?? runCli;
  const controller = new AbortController();
  const originalExit = host.exit;
  let interruptExitCode: 130 | 143 | null = null;
  let interruptionCount = 0;
  const interrupt = (exitCode: 130 | 143) => {
    interruptionCount += 1;
    if (interruptionCount > 1) {
      return originalExit.call(host, exitCode);
    }
    interruptExitCode = exitCode;
    controller.abort();
  };
  const onSigint = () => interrupt(130);
  const onSigterm = () => interrupt(143);
  const interceptedExit: CliProcessHost["exit"] = (code) => {
    const normalized = typeof code === "string" ? Number(code) : code;
    if (interruptExitCode !== null && normalized === interruptExitCode) {
      host.exitCode = interruptExitCode;
      return undefined as never;
    }
    return originalExit.call(host, code);
  };

  host.exit = interceptedExit;
  host.prependListener("SIGINT", onSigint);
  host.prependListener("SIGTERM", onSigterm);
  try {
    return await execute(args, { signal: controller.signal });
  } finally {
    host.removeListener("SIGINT", onSigint);
    host.removeListener("SIGTERM", onSigterm);
    host.exit = originalExit;
  }
};

const entryPath = process.argv[1] ? resolve(process.argv[1]) : undefined;
if (entryPath && import.meta.url === pathToFileURL(entryPath).href) {
  process.exitCode = await runCliProcess();
}
