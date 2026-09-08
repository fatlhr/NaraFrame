#!/usr/bin/env node

import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  compileDraft,
  corePackage,
  type Issue,
  loadPlanProject,
} from "@naraframe/core";
import { renderDraft, rendererPackage } from "@naraframe/renderer-remotion";

export const cliPackage = "@naraframe/cli";
export const cliDependencies = [corePackage, rendererPackage] as const;

const usage = `NaraFrame

Usage:
  naraframe validate <project>
  naraframe preview <project> --draft

Example:
  pnpm naraframe preview samples/krakatau-draft --draft`;

const printIssues = (issues: readonly Issue[]) => {
  for (const issue of issues) {
    const label = issue.severity.toUpperCase();
    console.error(
      `${label} ${issue.code} ${issue.artifact}${issue.path}: ${issue.message}`,
    );
    if (issue.suggestion) {
      console.error(`  Fix: ${issue.suggestion}`);
    }
  }
};

const projectArgument = (args: readonly string[]): string | undefined =>
  args.find((argument) => !argument.startsWith("--"));

const validateCommand = async (args: readonly string[]): Promise<number> => {
  const projectPath = projectArgument(args);
  if (!projectPath) {
    console.error(usage);
    return 3;
  }

  const loaded = await loadPlanProject(projectPath);
  printIssues(loaded.issues);
  if (!loaded.ok) {
    return 1;
  }

  const compiled = compileDraft(loaded.value.source);
  printIssues(compiled.issues);
  if (!compiled.ok) {
    return 1;
  }

  console.log(`Valid project: ${loaded.value.source.project.title}`);
  console.log(
    `Draft: ${compiled.value.width}x${compiled.value.height} @ ${compiled.value.fps}fps, ${compiled.value.totalFrames} frames`,
  );
  console.log(`Source revision: ${compiled.value.sourceRevision.slice(0, 12)}`);
  return 0;
};

const previewCommand = async (args: readonly string[]): Promise<number> => {
  const projectPath = projectArgument(args);
  if (!projectPath || !args.includes("--draft")) {
    console.error(usage);
    return 3;
  }

  const loaded = await loadPlanProject(projectPath);
  printIssues(loaded.issues);
  if (!loaded.ok) {
    return 1;
  }

  const compiled = compileDraft(loaded.value.source);
  printIssues(compiled.issues);
  if (!compiled.ok) {
    return 1;
  }

  console.log(
    `Rendering ${loaded.value.source.project.title} (${compiled.value.totalFrames} frames)...`,
  );
  let lastReported = -1;
  const rendered = await renderDraft({
    draft: compiled.value,
    projectRoot: loaded.value.root,
    onProgress: (progress) => {
      const percent = Math.floor(progress * 10) * 10;
      if (percent !== lastReported) {
        lastReported = percent;
        process.stderr.write(`Render ${percent}%\r`);
      }
    },
  });
  process.stderr.write("\n");
  console.log(`Preview ready: ${rendered.outputPath}`);
  console.log(
    `${rendered.width}x${rendered.height} @ ${rendered.fps}fps, ${(rendered.durationInFrames / rendered.fps).toFixed(1)}s`,
  );
  return 0;
};

export const runCli = async (args = process.argv.slice(2)): Promise<number> => {
  const [command, ...commandArgs] = args;

  try {
    if (command === "validate") {
      return await validateCommand(commandArgs);
    }
    if (command === "preview") {
      return await previewCommand(commandArgs);
    }

    console.error(usage);
    return 3;
  } catch (error) {
    console.error(
      `SYSTEM_ERROR: ${error instanceof Error ? error.message : String(error)}`,
    );
    return 2;
  }
};

const entryPath = process.argv[1] ? resolve(process.argv[1]) : undefined;
if (entryPath && import.meta.url === pathToFileURL(entryPath).href) {
  process.exitCode = await runCli();
}
