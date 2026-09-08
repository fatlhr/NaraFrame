#!/usr/bin/env node

import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  compileDraft,
  corePackage,
  createProject,
  type Issue,
  loadPlanProject,
} from "@naraframe/core";
import { renderDraft, rendererPackage } from "@naraframe/renderer-remotion";

export const cliPackage = "@naraframe/cli";
export const cliDependencies = [corePackage, rendererPackage] as const;

const usage = `NaraFrame

Usage:
  naraframe create <name> --profile <id-or-path>
  naraframe validate <project>
  naraframe preview <project> --draft [--scene <scene-id>]

Example:
  pnpm naraframe create work/krakatau --profile current-issues`;

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
  args.find(
    (argument, index) =>
      !argument.startsWith("--") && args[index - 1] !== "--scene",
  );

const optionValue = (
  args: readonly string[],
  option: string,
): string | undefined => {
  const index = args.indexOf(option);
  const value = index >= 0 ? args[index + 1] : undefined;
  return value && !value.startsWith("--") ? value : undefined;
};

const projectIdFromPath = (projectPath: string): string =>
  projectPath
    .split(/[\\/]/)
    .at(-1)
    ?.toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") ?? "";

const titleFromId = (id: string): string =>
  id
    .split("-")
    .map((part) => `${part[0]?.toUpperCase() ?? ""}${part.slice(1)}`)
    .join(" ");

const repositoryRoot = resolve(
  fileURLToPath(new URL(".", import.meta.url)),
  "../../..",
);

const createCommand = async (args: readonly string[]): Promise<number> => {
  const name = args[0]?.startsWith("--") ? undefined : args[0];
  const profileArgument = optionValue(args, "--profile");
  if (!name || !profileArgument) {
    console.error(usage);
    return 3;
  }

  const projectId = projectIdFromPath(name);
  if (!projectId) {
    console.error("Project name must contain at least one letter or number.");
    return 3;
  }

  const isLocalProfile =
    profileArgument.startsWith(".") ||
    profileArgument.startsWith("/") ||
    profileArgument.includes("/");
  const profileDirectory = isLocalProfile
    ? resolve(profileArgument)
    : resolve(repositoryRoot, "profiles", profileArgument);
  const created = await createProject({
    destination: resolve(name),
    projectId,
    title: titleFromId(projectId),
    profileDirectory,
    profileSource: {
      kind: isLocalProfile ? "local" : "repository",
      identity: isLocalProfile
        ? (profileArgument.split(/[\\/]/).at(-1) ?? projectId)
        : `profiles/${profileArgument}`,
    },
  });
  printIssues(created.issues);
  if (!created.ok) {
    return 1;
  }

  console.log(`Created project: ${created.value.root}`);
  for (const file of created.value.files) {
    console.log(`  ${file}`);
  }
  return 0;
};

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

  const sceneId = optionValue(args, "--scene");
  if (args.includes("--scene") && !sceneId) {
    console.error(usage);
    return 3;
  }
  const compiled = compileDraft(
    loaded.value.source,
    sceneId ? { type: "scene", sceneId } : { type: "project" },
  );
  printIssues(compiled.issues);
  if (!compiled.ok) {
    return 1;
  }

  console.log(
    `Rendering ${loaded.value.source.project.title}${sceneId ? ` / ${sceneId}` : ""} (${compiled.value.totalFrames} frames)...`,
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
    if (command === "create") {
      return await createCommand(commandArgs);
    }
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
