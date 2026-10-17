import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  type Approval,
  applyProfile,
  brandSummary,
  buildProfileLock,
  type CompiledDraft,
  capabilityRegistry,
  checkAudioModeConflicts,
  checkProductionReadiness,
  checkRecipeTrust,
  compileDraft,
  computeCostReport,
  computeReuse,
  createProject,
  type DraftResolution,
  dedupeIssues,
  editProject,
  exportSchemas,
  type Issue,
  inspectLibrary,
  type LoadedPlanProject,
  loadPlanProject,
  type ProfileReview,
  pendingGeneration,
  planProfileApply,
  RENDER_ENGINE,
  readApprovals,
  readProductionLedger,
  readRecipeTrust,
  readRevisionHistory,
  readRevisionState,
  recordApproval,
  recordRecipeTrust,
  resolveAudioMode,
  stageLibrary,
  stagePreparedAudio,
  syncWorkingCopy,
  undoProject,
  withProjectLock,
  writePreviewSelection,
} from "@naraframe/core";
import { isVisualPreflightError } from "@naraframe/renderer-remotion";
import { cleanCache } from "./cache-clean.js";
import {
  type CommandEventInput,
  type CommandName,
  commandResult,
  interruptedIssue,
  systemIssue,
  usageIssue,
} from "./command-result.js";
import { ffprobeExecutable, runDoctorChecks } from "./doctor.js";
import { engineIdentity } from "./engine-identity.js";
import {
  preflightNarrationAudio,
  preflightSoundtrackAudio,
  publishFinalBuild,
  readCurrentOutput,
} from "./final-build.js";
import { isFrameIntegrityError } from "./frame-integrity.js";
import {
  carriesAudio,
  findReusablePreview,
  publishPreviewBuild,
  publishReusedPreviewBuild,
  selectCheckedFrames,
} from "./preview-build.js";
import { readCurrentPreviewStatus } from "./preview-status.js";

export interface RunCliOptions {
  signal?: AbortSignal;
  onPreviewRenameDispatched?: () => void;
}

interface Execution {
  exitCode: 0 | 1 | 2 | 3 | 130;
  event: CommandEventInput;
  human?: string[];
  humanJson?: unknown;
}

interface ParsedArguments {
  positionals: string[];
  flags: Set<string>;
  values: Map<string, string>;
  /** Repeatable value options, in the order given. */
  lists: Map<string, string[]>;
  error?: string;
}

const usage = `NaraFrame

Usage:
  naraframe version [--json]
  naraframe doctor [--json]
  naraframe schema [--json]
  naraframe create <name> --profile <id-or-path> [--json]
  naraframe validate [project] --stage plan|production [--scene <scene-id>] [--json]
  naraframe status [project] [--json]
  naraframe preview [project] [--draft] [--rerender] [--scene <scene-id>] [--resolution 540|1080] [--json]
  naraframe recipe trust [project] --recipe <id> --authorized-by <name> [--note <text>] [--json]
  naraframe edit <project> --expect <revision> [--from <staging-dir>] [--remove narration.json|captions.json]... [--summary <text>] [--json]
  naraframe history <project> [--limit <n>] [--json]
  naraframe profile inspect <id-or-path> [--json]
  naraframe library inspect <catalog.json> [--json]
  naraframe library stage <project> [--from <catalog.json> --pattern <id> --version <version> --scene <id>] --instance <id> --params <params.json> [--update] [--json]
  naraframe audio stage <project> --from <clip> --timing <package.json> --block <id> [--json]
  naraframe profile apply <id-or-path> [project] [--dry-run] [--reset-overrides] [--json]
  naraframe cache clean [project] [--dry-run] [--json]`;

const repositoryRoot = resolve(
  fileURLToPath(new URL(".", import.meta.url)),
  "../../..",
);

const versionCommand = async (args: readonly string[]): Promise<Execution> => {
  if (args.length)
    return usageFailure("version", "version does not accept arguments.");
  const metadata = JSON.parse(
    await readFile(resolve(repositoryRoot, "package.json"), "utf8"),
  );
  const data = {
    version: metadata.version,
    skillApiVersion: 1,
    sourceSchemaVersion: 1,
    renderEngine: RENDER_ENGINE,
    resourceRoot: repositoryRoot,
    engineIdentity: await engineIdentity(repositoryRoot),
  };
  return {
    exitCode: 0,
    event: commonEvent("version", { data }),
    human: [`NaraFrame ${data.version}`],
  };
};

const commonEvent = (
  command: CommandName,
  overrides: Partial<CommandEventInput> = {},
): CommandEventInput => ({
  command,
  status: "completed",
  success: true,
  readiness: "not-applicable",
  sourceRevision: null,
  fingerprint: null,
  buildId: null,
  mode: null,
  scope: null,
  artifacts: {},
  issues: [],
  data: {},
  ...overrides,
});

const parseArguments = (
  args: readonly string[],
  allowedFlags: readonly string[],
  allowedValues: readonly string[],
  allowedLists: readonly string[] = [],
): ParsedArguments => {
  const positionals: string[] = [];
  const flags = new Set<string>();
  const values = new Map<string, string>();
  const lists = new Map<string, string[]>();
  const allowedFlagSet = new Set(allowedFlags);
  const allowedValueSet = new Set(allowedValues);
  const allowedListSet = new Set(allowedLists);
  const fail = (error: string): ParsedArguments => ({
    positionals,
    flags,
    values,
    lists,
    error,
  });

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (!argument) continue;
    if (!argument.startsWith("--")) {
      positionals.push(argument);
      continue;
    }
    if (allowedFlagSet.has(argument)) {
      if (flags.has(argument)) {
        return fail(`Option ${argument} may only be provided once.`);
      }
      flags.add(argument);
      continue;
    }
    if (allowedValueSet.has(argument) || allowedListSet.has(argument)) {
      if (allowedValueSet.has(argument) && values.has(argument)) {
        return fail(`Option ${argument} may only be provided once.`);
      }
      const value = args[index + 1];
      if (!value || value.startsWith("--")) {
        return fail(`Option ${argument} requires a value.`);
      }
      if (allowedListSet.has(argument)) {
        lists.set(argument, [...(lists.get(argument) ?? []), value]);
      } else {
        values.set(argument, value);
      }
      index += 1;
      continue;
    }
    return fail(`Unknown option ${argument}.`);
  }
  return { positionals, flags, values, lists };
};

const usageFailure = (command: CommandName, message: string): Execution => ({
  exitCode: 3,
  event: commonEvent(command, {
    status: "failed",
    success: false,
    readiness: "unknown",
    issues: [usageIssue(message)],
  }),
});

const printIssues = (issues: readonly Issue[]): void => {
  for (const issue of issues) {
    console.error(
      `${issue.severity.toUpperCase()} ${issue.code} ${issue.artifact}${issue.path}: ${issue.message}`,
    );
    if (issue.suggestion) console.error(`  Fix: ${issue.suggestion}`);
  }
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

const doctorCommand = async (args: readonly string[]): Promise<Execution> => {
  const parsed = parseArguments(args, [], []);
  if (parsed.error || parsed.positionals.length > 0) {
    return usageFailure(
      "doctor",
      parsed.error ?? "doctor does not accept positional arguments.",
    );
  }
  const result = await runDoctorChecks(process.cwd());
  const success = result.issues.length === 0;
  return {
    exitCode: success ? 0 : 2,
    event: commonEvent("doctor", {
      status: success ? "completed" : "failed",
      success,
      readiness: success ? "ready" : "not-ready",
      issues: result.issues,
      data: {
        checks: result.checks,
        downloadsPerformed: false,
        renderPerformed: false,
      },
    }),
    human: result.checks.map(
      (check) =>
        `${check.status === "ready" ? "OK" : "FAIL"} ${check.id}: ${check.detail}`,
    ),
  };
};

const schemaCommand = async (args: readonly string[]): Promise<Execution> => {
  const parsed = parseArguments(args, [], []);
  if (parsed.error || parsed.positionals.length > 0) {
    return usageFailure(
      "schema",
      parsed.error ?? "schema does not accept positional arguments.",
    );
  }
  const schemas = exportSchemas();
  // The capability list travels with the schemas: an agent reading one to
  // author a project needs the other to know which forms this build renders.
  const capabilities = capabilityRegistry();
  return {
    exitCode: 0,
    event: commonEvent("schema", { data: { schemas, capabilities } }),
    humanJson: { schemas, capabilities },
  };
};

const resolveProfileArgument = (
  argument: string,
): {
  directory: string;
  source: { kind: "repository" | "local"; identity: string };
} => {
  const isLocal =
    argument.startsWith(".") ||
    argument.startsWith("/") ||
    argument.includes("/");
  return isLocal
    ? {
        directory: resolve(argument),
        source: {
          kind: "local",
          identity: argument.split(/[\\/]/).at(-1) ?? argument,
        },
      }
    : {
        directory: resolve(repositoryRoot, "profiles", argument),
        source: { kind: "repository", identity: `profiles/${argument}` },
      };
};

const createCommand = async (args: readonly string[]): Promise<Execution> => {
  const parsed = parseArguments(args, [], ["--profile"]);
  if (
    parsed.error ||
    parsed.positionals.length !== 1 ||
    !parsed.values.has("--profile")
  ) {
    return usageFailure(
      "create",
      parsed.error ??
        "create requires exactly one project name and --profile value.",
    );
  }
  const name = parsed.positionals[0] ?? "";
  const profileArgument = parsed.values.get("--profile") ?? "";
  const projectId = projectIdFromPath(name);
  if (!projectId) {
    return usageFailure(
      "create",
      "Project name must contain a letter or number.",
    );
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
  if (!created.ok) {
    return {
      exitCode: 1,
      event: commonEvent("create", {
        status: "failed",
        success: false,
        readiness: "invalid",
        issues: created.issues,
      }),
    };
  }
  return {
    exitCode: 0,
    event: commonEvent("create", {
      readiness: "not-ready",
      artifacts: Object.fromEntries(
        created.value.files.map((file) => [
          file,
          resolve(created.value.root, file),
        ]),
      ),
      data: {
        projectRoot: created.value.root,
        files: created.value.files,
      },
    }),
    human: [
      `Created project: ${created.value.root}`,
      ...created.value.files.map((file) => `  ${file}`),
    ],
  };
};

const validateCommand = async (args: readonly string[]): Promise<Execution> => {
  const parsed = parseArguments(args, [], ["--stage", "--scene"]);
  const stage = parsed.values.get("--stage");
  if (
    parsed.error ||
    parsed.positionals.length > 1 ||
    (stage !== "plan" && stage !== "production") ||
    (stage === "plan" && parsed.values.has("--scene"))
  ) {
    return usageFailure(
      "validate",
      parsed.error ??
        "validate accepts at most one project and requires --stage plan or --stage production.",
    );
  }
  const projectPath = parsed.positionals[0] ?? ".";
  const loaded = await loadPlanProject(projectPath);
  if (!loaded.ok) {
    return {
      exitCode: 1,
      event: commonEvent("validate", {
        status: "failed",
        success: false,
        readiness: "invalid",
        mode: "draft",
        scope: { type: "project" },
        issues: loaded.issues,
        data: { stage: "plan" },
      }),
    };
  }
  if (stage === "production") {
    const sceneId = parsed.values.get("--scene");
    const checks = sceneId
      ? await runPreviewProductionChecks(loaded.value, sceneId)
      : await runProductionChecks(loaded.value);
    return {
      exitCode: checks.ok ? 0 : 1,
      event: commonEvent("validate", {
        status: checks.ok ? "completed" : "failed",
        success: checks.ok,
        readiness: checks.ok ? "ready" : "not-ready",
        mode: sceneId ? "draft" : "final",
        scope: sceneId ? { type: "scene", sceneId } : { type: "project" },
        sourceRevision: checks.draft?.sourceRevision ?? null,
        fingerprint:
          (sceneId ? checks.draft : checks.final)?.assemblyKey ?? null,
        issues: [...loaded.issues, ...checks.issues],
        data: {
          stage: "production",
          audioMode: resolveAudioMode(loaded.value.source),
          brand: brandSummary(loaded.value.source),
        },
      }),
      ...(checks.ok
        ? { human: ["Production checks passed: ready for a reviewed export."] }
        : {}),
    };
  }
  const compiled = compileDraft(loaded.value.source);
  const issues = [...loaded.issues, ...compiled.issues];
  if (!compiled.ok) {
    return {
      exitCode: 1,
      event: commonEvent("validate", {
        status: "failed",
        success: false,
        readiness: "invalid",
        mode: "draft",
        scope: { type: "project" },
        issues,
        data: { stage: "plan" },
      }),
    };
  }
  return {
    exitCode: 0,
    event: commonEvent("validate", {
      readiness: "draft-only",
      sourceRevision: compiled.value.sourceRevision,
      fingerprint: compiled.value.assemblyKey,
      mode: "draft",
      scope: compiled.value.scope,
      issues,
      data: {
        stage: "plan",
        projectTitle: loaded.value.source.project.title,
        width: compiled.value.width,
        height: compiled.value.height,
        fps: compiled.value.fps,
        totalFrames: compiled.value.totalFrames,
      },
    }),
    human: [
      `Valid plan: ${loaded.value.source.project.title}`,
      `Draft: ${compiled.value.width}x${compiled.value.height} @ ${compiled.value.fps}fps, ${compiled.value.totalFrames} frames`,
      `Source revision: ${compiled.value.sourceRevision.slice(0, 12)}`,
    ],
  };
};

const statusCommand = async (args: readonly string[]): Promise<Execution> => {
  const parsed = parseArguments(args, [], []);
  if (parsed.error || parsed.positionals.length > 1) {
    return usageFailure(
      "status",
      parsed.error ?? "status accepts at most one project path.",
    );
  }
  const projectPath = parsed.positionals[0] ?? ".";
  const loaded = await loadPlanProject(projectPath);
  if (!loaded.ok) {
    return {
      exitCode: 1,
      event: commonEvent("status", {
        status: "failed",
        success: false,
        readiness: "invalid",
        issues: loaded.issues,
        data: { planReadiness: "invalid", previewState: "unknown" },
      }),
    };
  }
  const compiled = compileDraft(loaded.value.source);
  if (!compiled.ok) {
    return {
      exitCode: 1,
      event: commonEvent("status", {
        status: "failed",
        success: false,
        readiness: "invalid",
        mode: "draft",
        issues: [...loaded.issues, ...compiled.issues],
        data: { planReadiness: "invalid", previewState: "unknown" },
      }),
    };
  }
  const preview = await readCurrentPreviewStatus(
    loaded.value.root,
    compiled.value,
  );
  const revision = await readRevisionState(loaded.value.root);
  const output = await readCurrentOutput(loaded.value.root);
  const approvals = await readApprovals(
    loaded.value.root,
    compiled.value.sourceRevision,
  );
  const reuse =
    revision.currentId && revision.parentId
      ? await computeReuse(loaded.value.root, revision.currentId)
      : null;
  const metadataFailed = preview.issues.some(
    (issue) => issue.severity === "error" && issue.responsible === "system",
  );
  const issues = [...loaded.issues, ...compiled.issues, ...preview.issues];
  return {
    exitCode: metadataFailed ? 2 : 0,
    event: commonEvent("status", {
      status: metadataFailed ? "failed" : "completed",
      success: !metadataFailed,
      readiness: metadataFailed ? "not-ready" : "draft-only",
      sourceRevision: compiled.value.sourceRevision,
      fingerprint: preview.fingerprint,
      buildId: preview.buildId,
      mode: preview.buildId ? "draft" : null,
      scope: preview.scope,
      artifacts: preview.artifacts,
      issues,
      data: {
        planReadiness: "valid",
        ...preview.data,
        currentSourceFingerprint: compiled.value.assemblyKey,
        output: output
          ? {
              buildId: output.buildId,
              state:
                output.sourceRevision === compiled.value.sourceRevision
                  ? "current"
                  : "stale",
            }
          : { buildId: null, state: "none" },
        approval: approvals.at(-1) ?? null,
        needsProduction: pendingGeneration(loaded.value.source),
        revision: {
          ...revision,
          reuse: reuse?.ok ? reuse.value : null,
          state:
            revision.currentId === null
              ? "untracked"
              : revision.currentId === compiled.value.sourceRevision
                ? "in-sync"
                : "working-copy-differs",
        },
      },
    }),
    ...(metadataFailed
      ? {}
      : {
          human: [
            `Plan: valid (${compiled.value.sourceRevision.slice(0, 12)})`,
            `Preview: ${preview.state}${preview.buildId ? ` (${preview.buildId})` : ""}`,
            ...(preview.artifacts.previewMp4
              ? [`Video: ${preview.artifacts.previewMp4}`]
              : []),
          ],
        }),
  };
};

const previewCommand = async (
  args: readonly string[],
  options: RunCliOptions,
): Promise<Execution> => {
  const { signal, onPreviewRenameDispatched } = options;
  const parsed = parseArguments(
    args,
    ["--draft", "--rerender"],
    ["--scene", "--resolution"],
  );
  const requestedResolution = parsed.values.get("--resolution") ?? "540";
  if (
    parsed.error ||
    parsed.positionals.length > 1 ||
    (requestedResolution !== "540" && requestedResolution !== "1080")
  ) {
    return usageFailure(
      "preview",
      parsed.error ??
        (parsed.positionals.length > 1
          ? "preview accepts at most one project."
          : "--resolution accepts 540 (default) or 1080."),
    );
  }
  const resolution: DraftResolution =
    requestedResolution === "1080" ? 1080 : 540;
  const productionStage = !parsed.flags.has("--draft");
  const projectPath = parsed.positionals[0] ?? ".";
  const loaded = await loadPlanProject(projectPath);
  if (!loaded.ok) {
    return {
      exitCode: 1,
      event: commonEvent("preview", {
        status: "failed",
        success: false,
        readiness: "invalid",
        mode: "draft",
        issues: loaded.issues,
      }),
    };
  }
  const sceneId = parsed.values.get("--scene");
  // Audio that contradicts the mode, or a mode the profile locks, is a source
  // error for every preview, draft included: a draft may be provisional, but
  // it never renders sound the project says it must not have.
  const audioMode = resolveAudioMode(loaded.value.source);
  const audioConflicts = checkAudioModeConflicts(
    loaded.value.source,
    audioMode,
  );
  if (audioConflicts.length > 0) {
    return {
      exitCode: 1,
      event: commonEvent("preview", {
        status: "failed",
        success: false,
        readiness: "invalid",
        mode: "draft",
        scope: sceneId ? { type: "scene", sceneId } : { type: "project" },
        issues: [...loaded.issues, ...audioConflicts],
        data: { stage: productionStage ? "production" : "draft", audioMode },
      }),
    };
  }
  const productionChecks = productionStage
    ? await runPreviewProductionChecks(loaded.value, sceneId, resolution)
    : null;
  if (productionChecks && !productionChecks.ok) {
    return {
      exitCode: 1,
      event: commonEvent("preview", {
        status: "failed",
        success: false,
        readiness: "not-ready",
        mode: "draft",
        scope: sceneId ? { type: "scene", sceneId } : { type: "project" },
        issues: [...loaded.issues, ...productionChecks.issues],
        data: { stage: "production" },
      }),
    };
  }
  const compiled = compileDraft(
    loaded.value.source,
    sceneId ? { type: "scene", sceneId } : { type: "project" },
    { resolution },
  );
  // The production checks compile the same source again, so their info
  // issues can repeat the draft compile's; report each finding once.
  const issues = dedupeIssues([
    ...loaded.issues,
    ...compiled.issues,
    ...(productionChecks
      ? productionChecks.issues.filter((issue) => issue.severity === "info")
      : []),
  ]);
  if (!compiled.ok) {
    return {
      exitCode: 1,
      event: commonEvent("preview", {
        status: "failed",
        success: false,
        readiness: "invalid",
        mode: "draft",
        scope: sceneId ? { type: "scene", sceneId } : { type: "project" },
        issues,
      }),
    };
  }
  // Recipe code runs only when the owner trusts this exact code: checked for
  // every preview, draft included, before anything is synced or bundled.
  const untrustedRecipes = checkRecipeTrust(
    compiled.value,
    await readRecipeTrust(loaded.value.root),
  );
  if (untrustedRecipes.length > 0) {
    return {
      exitCode: 1,
      event: commonEvent("preview", {
        status: "failed",
        success: false,
        readiness: "not-ready",
        mode: "draft",
        scope: compiled.value.scope,
        issues: [...issues, ...untrustedRecipes],
      }),
    };
  }
  if (signal?.aborted) {
    const error = new Error("Interrupted");
    error.name = "AbortError";
    throw error;
  }
  const synced = await withProjectLock(loaded.value.root, () =>
    syncWorkingCopy(loaded.value.root),
  );
  if (!synced.ok) {
    return {
      exitCode: 1,
      event: commonEvent("preview", {
        status: "failed",
        success: false,
        readiness: "invalid",
        mode: "draft",
        issues: synced.issues,
      }),
    };
  }
  console.error(
    `Rendering ${loaded.value.source.project.title}${sceneId ? ` / ${sceneId}` : ""} (${compiled.value.totalFrames} frames)...`,
  );
  let lastReported = -1;
  const reusable = parsed.flags.has("--rerender")
    ? null
    : await findReusablePreview(
        loaded.value.root,
        compiled.value,
        selectCheckedFrames(compiled.value, issues),
      );
  const published = reusable
    ? await publishReusedPreviewBuild({
        draft: compiled.value,
        projectRoot: loaded.value.root,
        issues,
        source: reusable,
        ...(signal ? { signal } : {}),
        ...(onPreviewRenameDispatched
          ? { onPointerRenameDispatched: onPreviewRenameDispatched }
          : {}),
      })
    : await publishPreviewBuild({
        draft: compiled.value,
        projectRoot: loaded.value.root,
        issues,
        ...(signal ? { signal } : {}),
        ...(onPreviewRenameDispatched
          ? { onPointerRenameDispatched: onPreviewRenameDispatched }
          : {}),
        onProgress: (progress) => {
          const percent = Math.floor(progress * 10) * 10;
          if (percent !== lastReported) {
            lastReported = percent;
            process.stderr.write(`Render ${percent}%\r`);
          }
        },
      });
  process.stderr.write("\n");
  await writePreviewSelection(
    loaded.value.root,
    compiled.value.sourceRevision,
    published.buildId,
  );
  const artifacts = {
    current: published.currentPointer,
    previewMp4: resolve(published.buildDirectory, "preview.mp4"),
    contactSheetPng: resolve(published.buildDirectory, "contact-sheet.png"),
    framesJson: resolve(published.buildDirectory, "frames.json"),
    reportJson: resolve(published.buildDirectory, "report.json"),
    manifestJson: resolve(published.buildDirectory, "manifest.json"),
  };
  return {
    exitCode: 0,
    event: commonEvent("preview", {
      readiness: "draft-only",
      sourceRevision: compiled.value.sourceRevision,
      fingerprint: compiled.value.assemblyKey,
      buildId: published.buildId,
      mode: "draft",
      scope: compiled.value.scope,
      artifacts,
      issues: published.issues,
      data: {
        label: compiled.value.label,
        muted: !(compiled.value.narration || compiled.value.soundtrack),
        resolution,
        audioMode,
        brand: brandSummary(loaded.value.source),
        timelineScope: compiled.value.timelineScope,
        manifestSha256: published.manifestSha256,
        reusedFromBuildId: reusable?.buildId ?? null,
      },
    }),
    human: [
      `Preview build ready: ${published.buildDirectory}`,
      `Current pointer: ${published.currentPointer}`,
      `${published.rendered.width}x${published.rendered.height} @ ${published.rendered.fps}fps, ${(published.rendered.durationInFrames / published.rendered.fps).toFixed(1)}s, ${compiled.value.narration ? "narrated" : compiled.value.soundtrack ? "draft with soundtrack" : "draft only, no audio"}`,
    ],
  };
};

const editCommand = async (args: readonly string[]): Promise<Execution> => {
  const parsed = parseArguments(
    args,
    [],
    ["--from", "--expect", "--summary"],
    ["--remove"],
  );
  const removals = parsed.lists.get("--remove") ?? [];
  if (
    parsed.error ||
    parsed.positionals.length !== 1 ||
    !parsed.values.has("--expect") ||
    (!parsed.values.has("--from") && removals.length === 0)
  ) {
    return usageFailure(
      "edit",
      parsed.error ??
        "edit requires one project, --expect <revision>, and --from <staging-dir> and/or at least one --remove <narration.json|captions.json>.",
    );
  }
  const root = resolve(parsed.positionals[0] ?? ".");
  const stagingDirectory = parsed.values.get("--from");
  const result = await editProject({
    root,
    ...(stagingDirectory ? { from: resolve(stagingDirectory) } : {}),
    ...(removals.length > 0 ? { remove: removals } : {}),
    expect: parsed.values.get("--expect") ?? "",
    summary:
      parsed.values.get("--summary") ?? "Edit applied from a staging directory",
  });
  if (!result.ok) {
    return {
      exitCode: 1,
      event: commonEvent("edit", {
        status: "failed",
        success: false,
        readiness: "unknown",
        issues: result.issues,
      }),
    };
  }
  const reuse = await computeReuse(root, result.value.revisionId);
  return {
    exitCode: 0,
    event: commonEvent("edit", {
      readiness: "unknown",
      sourceRevision: result.value.revisionId,
      issues: [...result.issues, ...(reuse.ok ? [] : reuse.issues)],
      data: {
        parentRevision: result.value.parentId,
        files: result.value.files,
        removedFiles: result.value.removed,
        capturedDirectEdits: result.value.captured,
        reuse: reuse.ok ? reuse.value : null,
      },
    }),
    human: [
      `Revision ${result.value.revisionId.slice(0, 12)} (from ${result.value.parentId.slice(0, 12)}): ${[
        ...result.value.files,
        ...result.value.removed.map((path) => `removed ${path}`),
      ].join(", ")}`,
      ...(reuse.ok && reuse.value?.overallRatio != null
        ? [
            `Reuse: ${Math.round(reuse.value.overallRatio * 100)}% of voice clips, images, and scenes survived unchanged`,
          ]
        : []),
    ],
  };
};

const undoCommand = async (args: readonly string[]): Promise<Execution> => {
  const parsed = parseArguments(args, [], []);
  if (parsed.error || parsed.positionals.length !== 1) {
    return usageFailure(
      "undo",
      parsed.error ?? "undo requires exactly one project.",
    );
  }
  const result = await undoProject({
    root: resolve(parsed.positionals[0] ?? "."),
  });
  if (!result.ok) {
    return {
      exitCode: 1,
      event: commonEvent("undo", {
        status: "failed",
        success: false,
        readiness: "unknown",
        issues: result.issues,
      }),
    };
  }
  return {
    exitCode: 0,
    event: commonEvent("undo", {
      readiness: "unknown",
      sourceRevision: result.value.revisionId,
      issues: result.issues,
      data: {
        fromRevision: result.value.fromRevisionId,
        preservedInvalidCopy: result.value.preservedInvalidCopy,
      },
    }),
    human: [
      `Restored revision ${result.value.revisionId.slice(0, 12)} (was ${result.value.fromRevisionId.slice(0, 12)}); receipts and spend are unchanged.`,
      ...(result.value.preservedInvalidCopy
        ? [`Uncommitted files kept in ${result.value.preservedInvalidCopy}`]
        : []),
    ],
  };
};

const historyCommand = async (args: readonly string[]): Promise<Execution> => {
  const parsed = parseArguments(args, [], ["--limit"]);
  const limitText = parsed.values.get("--limit");
  const limit = limitText === undefined ? undefined : Number(limitText);
  if (
    parsed.error ||
    parsed.positionals.length !== 1 ||
    (limit !== undefined && (!Number.isInteger(limit) || limit < 1))
  ) {
    return usageFailure(
      "history",
      parsed.error ??
        (parsed.positionals.length !== 1
          ? "history requires exactly one project."
          : "--limit must be a positive whole number."),
    );
  }
  const result = await readRevisionHistory({
    root: resolve(parsed.positionals[0] ?? "."),
    ...(limit === undefined ? {} : { limit }),
  });
  if (!result.ok) {
    return {
      exitCode: 1,
      event: commonEvent("history", {
        status: "failed",
        success: false,
        readiness: "unknown",
        issues: result.issues,
      }),
    };
  }
  const { currentId, total, entries } = result.value;
  return {
    exitCode: 0,
    event: commonEvent("history", {
      sourceRevision: currentId,
      issues: result.issues,
      data: {
        currentRevision: currentId,
        total,
        truncated: entries.length < total,
        revisions: entries,
      },
    }),
    human: [
      ...entries.map(
        (entry) =>
          `${entry.current ? "*" : " "} ${entry.id.slice(0, 12)} ${entry.kind.padEnd(14)} ${entry.createdAt}  ${entry.summary}`,
      ),
      ...(entries.length < total
        ? [`  ... ${total - entries.length} older revision(s); raise --limit.`]
        : []),
    ],
  };
};

interface ProductionChecks {
  ok: boolean;
  issues: Issue[];
  draft?: CompiledDraft;
  final?: CompiledDraft;
}

/** Plan compile, final compile, production readiness, and the audio preflight. */
const runProductionChecks = async (
  loaded: LoadedPlanProject,
): Promise<ProductionChecks> => {
  const draft = compileDraft(loaded.source);
  const final = compileDraft(
    loaded.source,
    { type: "project" },
    { mode: "final" },
  );
  const issues: Issue[] = [...draft.issues, ...final.issues];
  if (!draft.ok || !final.ok)
    return { ok: false, issues: dedupeIssues(issues) };
  issues.push(
    ...checkProductionReadiness(loaded.source, final.value, final.issues),
    ...checkRecipeTrust(final.value, await readRecipeTrust(loaded.root)),
  );
  issues.push(...(await preflightNarrationAudio(loaded.root, final.value)));
  issues.push(...(await preflightSoundtrackAudio(loaded.root, final.value)));
  const reported = dedupeIssues(issues);
  const ok = !reported.some((issue) => issue.severity === "error");
  return { ok, issues: reported, draft: draft.value, final: final.value };
};

/**
 * The checks behind a production-ready preview, for the whole project or one
 * scene. A scene is checked with its own dependencies only; gaps elsewhere are
 * reported as info and never block.
 */
const runPreviewProductionChecks = async (
  loaded: LoadedPlanProject,
  sceneId: string | undefined,
  resolution: DraftResolution = 540,
): Promise<ProductionChecks> => {
  const draft = compileDraft(
    loaded.source,
    sceneId ? { type: "scene", sceneId } : { type: "project" },
    { resolution },
  );
  const issues: Issue[] = [...draft.issues];
  if (!draft.ok) return { ok: false, issues };
  issues.push(
    ...checkProductionReadiness(loaded.source, draft.value, draft.issues, {
      finalExport: false,
      ...(sceneId ? { sceneId } : {}),
    }),
    ...checkRecipeTrust(draft.value, await readRecipeTrust(loaded.root)),
  );
  issues.push(...(await preflightNarrationAudio(loaded.root, draft.value)));
  issues.push(...(await preflightSoundtrackAudio(loaded.root, draft.value)));
  const reported = dedupeIssues(issues);
  const ok = !reported.some((issue) => issue.severity === "error");
  return { ok, issues: reported, draft: draft.value };
};

const renderCommand = async (
  args: readonly string[],
  options: RunCliOptions,
): Promise<Execution> => {
  const parsed = parseArguments(
    args,
    ["--autonomous"],
    ["--approve-preview", "--authorized-by", "--note"],
  );
  const reviewed = parsed.values.get("--approve-preview");
  const autonomous = parsed.flags.has("--autonomous");
  const authorizedBy = parsed.values.get("--authorized-by");
  if (
    parsed.error ||
    parsed.positionals.length > 1 ||
    (reviewed === undefined) === !autonomous ||
    (autonomous && !authorizedBy) ||
    (!autonomous && (authorizedBy || parsed.values.has("--note")))
  ) {
    return usageFailure(
      "render",
      parsed.error ??
        "render needs exactly one approval: --approve-preview <build-id> for a preview you reviewed, or --autonomous --authorized-by <name> when the owner explicitly authorised export without review.",
    );
  }

  const loaded = await loadPlanProject(parsed.positionals[0] ?? ".");
  if (!loaded.ok) {
    return {
      exitCode: 1,
      event: commonEvent("render", {
        status: "failed",
        success: false,
        readiness: "invalid",
        mode: "final",
        issues: loaded.issues,
      }),
    };
  }
  const synced = await withProjectLock(loaded.value.root, () =>
    syncWorkingCopy(loaded.value.root),
  );
  if (!synced.ok) {
    return {
      exitCode: 1,
      event: commonEvent("render", {
        status: "failed",
        success: false,
        readiness: "invalid",
        mode: "final",
        issues: synced.issues,
      }),
    };
  }

  const checks = await runProductionChecks(loaded.value);
  if (!checks.ok || !checks.draft || !checks.final) {
    return {
      exitCode: 1,
      event: commonEvent("render", {
        status: "failed",
        success: false,
        readiness: "not-ready",
        mode: "final",
        sourceRevision: synced.value.revisionId,
        issues: checks.issues,
      }),
    };
  }

  const approvalIssues: Issue[] = [];
  const fail = (code: string, message: string, suggestion: string): void => {
    approvalIssues.push({
      code,
      severity: "error",
      responsible: "user",
      artifact: "preview",
      path: "/",
      message,
      suggestion,
    });
  };
  if (reviewed !== undefined) {
    const manifestPath = resolve(
      loaded.value.root,
      "preview",
      "builds",
      reviewed,
      "manifest.json",
    );
    let manifest: Record<string, unknown> | null = null;
    try {
      manifest = JSON.parse(await readFile(manifestPath, "utf8")) as Record<
        string,
        unknown
      >;
    } catch {
      manifest = null;
    }
    const render = (manifest?.render ?? {}) as Record<string, unknown>;
    const scope = (manifest?.scope ?? {}) as Record<string, unknown>;
    // A native 1080 preview reviews the same source at final size.
    const reviewedDraft =
      render.width === 1080
        ? compileDraft(
            loaded.value.source,
            { type: "project" },
            { resolution: 1080 },
          )
        : null;
    const reviewedAssemblyKey = reviewedDraft
      ? reviewedDraft.ok
        ? reviewedDraft.value.assemblyKey
        : null
      : checks.draft.assemblyKey;
    if (!manifest) {
      fail(
        "APPROVAL_PREVIEW_UNKNOWN",
        `Preview build ${reviewed} does not exist.`,
        "Use a build id reported by preview or status.",
      );
    } else if (
      manifest.sourceRevision !== checks.draft.sourceRevision ||
      manifest.assemblyKey !== reviewedAssemblyKey ||
      scope.type !== "project"
    ) {
      fail(
        "APPROVAL_PREVIEW_STALE",
        `Preview build ${reviewed} is not a full preview of the current source, so its review does not carry over.`,
        "Run preview --draft on the current source, review it, and approve that build.",
      );
    } else if (carriesAudio(checks.final) && render.audio !== "aac") {
      fail(
        "APPROVAL_PREVIEW_SILENT",
        `Preview build ${reviewed} has no audio, but this export carries audio.`,
        "Review a full preview with the project's audio before exporting.",
      );
    } else if (!carriesAudio(checks.final) && render.audio !== "none") {
      fail(
        "APPROVAL_PREVIEW_AUDIO_MISMATCH",
        `Preview build ${reviewed} has audio, but this silent export has none.`,
        "Review a full preview of the current silent source before exporting.",
      );
    }
  }
  if (approvalIssues.length > 0) {
    return {
      exitCode: 1,
      event: commonEvent("render", {
        status: "failed",
        success: false,
        readiness: "not-ready",
        mode: "final",
        sourceRevision: checks.draft.sourceRevision,
        issues: approvalIssues,
      }),
    };
  }

  const approval: Approval = await recordApproval(loaded.value.root, {
    sourceRevision: checks.draft.sourceRevision,
    assemblyKey: checks.draft.assemblyKey,
    scope: { type: "project" },
    previewBuildId: reviewed ?? null,
    autonomy: autonomous
      ? {
          authorizedBy: authorizedBy ?? "",
          ...(parsed.values.get("--note")
            ? { note: parsed.values.get("--note") ?? "" }
            : {}),
        }
      : null,
    approvedAt: new Date().toISOString(),
  });

  const ledger = await readProductionLedger(loaded.value.root);
  const { signal, onPreviewRenameDispatched } = options;
  console.error(
    `Exporting ${loaded.value.source.project.title} (${checks.final.width}x${checks.final.height}, ${checks.final.totalFrames} frames)...`,
  );
  let lastReported = -1;
  const audioMode = resolveAudioMode(loaded.value.source);
  const published = await publishFinalBuild({
    projectRoot: loaded.value.root,
    draft: checks.final,
    approval,
    audioMode,
    issues: checks.issues,
    cost: ledger.ok && ledger.value ? computeCostReport(ledger.value) : null,
    ...(signal ? { signal } : {}),
    onProgress: (progress) => {
      const percent = Math.floor(progress * 100);
      if (percent >= lastReported + 10) {
        lastReported = percent;
        process.stderr.write(`\rRender ${percent}%`);
      }
    },
  });
  void onPreviewRenameDispatched;
  process.stderr.write("\n");
  return {
    exitCode: 0,
    event: commonEvent("render", {
      readiness: "ready",
      sourceRevision: checks.final.sourceRevision,
      fingerprint: checks.final.assemblyKey,
      buildId: published.buildId,
      mode: "final",
      scope: checks.final.scope,
      artifacts: {
        current: published.currentPointer,
        finalMp4: resolve(published.buildDirectory, "final.mp4"),
        reportJson: resolve(published.buildDirectory, "report.json"),
        manifestJson: resolve(published.buildDirectory, "manifest.json"),
      },
      issues: published.issues,
      data: {
        approval,
        width: published.rendered.width,
        height: published.rendered.height,
        fps: published.rendered.fps,
        durationInFrames: published.rendered.durationInFrames,
        codec: "h264",
        audio: carriesAudio(checks.final) ? "aac" : "none",
        audioMode,
        brand: brandSummary(loaded.value.source),
        manifestSha256: published.manifestSha256,
      },
    }),
    human: [
      `Final export ready: ${published.buildDirectory}`,
      `${published.rendered.width}x${published.rendered.height} @ ${published.rendered.fps}fps, ${(published.rendered.durationInFrames / published.rendered.fps).toFixed(1)}s, H.264${carriesAudio(checks.final) ? " + AAC" : ", no audio stream"} (${audioMode.mode} mode)`,
      approval.autonomy
        ? `Approved by autonomy authorisation from ${approval.autonomy.authorizedBy}`
        : `Approved from reviewed preview ${approval.previewBuildId}`,
    ],
  };
};

/** A few lines per review group; the full layer list is in the JSON plan. */
const reviewLines = (review: ProfileReview | undefined): string[] => {
  if (!review) return [];
  const count = (n: number) => (n === 1 ? "1 layer" : `${n} layers`);
  const distinct = (values: readonly string[]) => [...new Set(values)];
  const slots = new Map<string, { change: string; layers: number }>();
  for (const item of review.paletteBound) {
    const entry = slots.get(item.token) ?? {
      change: `${item.before} -> ${item.after}`,
      layers: 0,
    };
    entry.layers += 1;
    slots.set(item.token, entry);
  }
  return [
    ...[...slots].map(
      ([token, entry]) =>
        `Review: ${token} ${entry.change} repaints ${count(entry.layers)}`,
    ),
    ...(review.literalColors.length
      ? [
          `Review: hex colours the switch will not repaint on ${count(review.literalColors.length)} (${distinct(review.literalColors.map((item) => item.color)).join(", ")})`,
        ]
      : []),
    ...(review.imageLayers.length
      ? [
          `Review: images to check against the new profile on ${count(review.imageLayers.length)} (${distinct(review.imageLayers.map((item) => item.assetId)).join(", ")})`,
        ]
      : []),
  ];
};

const profileCommand = async (args: readonly string[]): Promise<Execution> => {
  const [subcommand, ...rest] = args;
  const parsed = parseArguments(rest, ["--dry-run", "--reset-overrides"], []);
  const usageText =
    "profile supports: profile inspect <id-or-path> | profile apply <id-or-path> [project] [--dry-run] [--reset-overrides].";
  if (
    parsed.error ||
    (subcommand !== "inspect" && subcommand !== "apply") ||
    parsed.positionals.length < 1 ||
    parsed.positionals.length > (subcommand === "apply" ? 2 : 1) ||
    (subcommand === "inspect" && parsed.flags.size > 0)
  ) {
    return usageFailure("profile", parsed.error ?? usageText);
  }
  const target = resolveProfileArgument(parsed.positionals[0] ?? "");
  const failed = (issues: Issue[]): Execution => ({
    exitCode: 1,
    event: commonEvent("profile", {
      status: "failed",
      success: false,
      readiness: "not-applicable",
      issues,
    }),
  });

  if (subcommand === "inspect") {
    const built = await buildProfileLock(target.directory, target.source);
    if (!built.ok) return failed(built.issues);
    const lock = built.value.lock;
    const summary = {
      id: lock.id,
      version: lock.version,
      directionSha256: lock.direction.sha256,
      voiceStyleSignature: lock.production.voiceStyleSignature,
      illustrationStyleSignature: lock.production.illustrationStyleSignature,
      duration: lock.duration,
      audioMode: lock.production.audioMode ?? null,
      brand: lock.brand ?? null,
      lockedPaths: lock.lockedPaths,
      overridablePaths: lock.overridablePaths,
      assets: lock.assets.map((asset) => ({
        id: asset.id,
        kind: asset.kind,
        ...(asset.role ? { role: asset.role } : {}),
        sha256: asset.sha256,
      })),
    };
    return {
      exitCode: 0,
      event: commonEvent("profile", {
        data: { action: "inspect", profile: summary },
      }),
      human: [
        `${lock.id}@${lock.version}`,
        `Voice: ${summary.voiceStyleSignature}`,
        `Locked: ${lock.lockedPaths.join(", ") || "none"}`,
        `Overridable: ${lock.overridablePaths.join(", ") || "none"}`,
        `Assets: ${lock.assets.length}`,
      ],
    };
  }

  const root = resolve(parsed.positionals[1] ?? ".");
  const options = {
    root,
    profileDirectory: target.directory,
    profileSource: target.source,
    resetConflicts: parsed.flags.has("--reset-overrides"),
  };
  const dryRun = parsed.flags.has("--dry-run");
  const planned = await planProfileApply(options);
  if (!planned.ok) return failed(planned.issues);
  const plan = planned.value;
  const summaryLines = [
    `${plan.from.id}@${plan.from.version} -> ${plan.to.id}@${plan.to.version}`,
    `Changes: ${plan.changes.length}; effects: ${plan.effects.join(", ") || "none"}`,
    ...(plan.preservedOverrides.length
      ? [`Kept overrides: ${plan.preservedOverrides.join(", ")}`]
      : []),
    ...plan.conflicts.map(
      (conflict) =>
        `Conflicting override: ${conflict.path} (${conflict.reason})`,
    ),
    ...reviewLines(plan.review),
  ];
  if (dryRun || plan.blocked) {
    return {
      exitCode: plan.blocked && !dryRun ? 1 : 0,
      event: commonEvent("profile", {
        status: plan.blocked && !dryRun ? "failed" : "completed",
        success: !(plan.blocked && !dryRun),
        issues: planned.issues,
        data: { action: "apply", dryRun, applied: false, plan },
      }),
      human: [
        ...summaryLines,
        dryRun ? "Dry run: nothing changed." : "Blocked: nothing changed.",
      ],
    };
  }
  const applied = await applyProfile(options);
  if (!applied.ok) return failed(applied.issues);
  return {
    exitCode: 0,
    event: commonEvent("profile", {
      sourceRevision: applied.value.edit.revisionId,
      issues: applied.issues,
      data: {
        action: "apply",
        dryRun: false,
        applied: true,
        plan: applied.value.plan,
        revision: applied.value.edit.revisionId,
        parentRevision: applied.value.edit.parentId,
      },
    }),
    human: [
      ...summaryLines,
      `Revision ${applied.value.edit.revisionId.slice(0, 12)} (undo restores the previous profile).`,
      ...(plan.effects.includes("regenerate-narration") ||
      plan.effects.includes("replace-assets")
        ? [
            "Some voice or images are now stale: final export waits for replacements (see status needsProduction).",
          ]
        : []),
    ],
  };
};

const cacheCommand = async (args: readonly string[]): Promise<Execution> => {
  const [subcommand, ...rest] = args;
  const parsed = parseArguments(rest, ["--dry-run"], []);
  if (subcommand !== "clean" || parsed.error || parsed.positionals.length > 1) {
    return usageFailure(
      "cache",
      parsed.error ?? "cache supports only: cache clean [project] [--dry-run].",
    );
  }
  const root = resolve(parsed.positionals[0] ?? ".");
  const dryRun = parsed.flags.has("--dry-run");
  const result = await withProjectLock(root, async () => ({
    ok: true as const,
    value: await cleanCache(root, { dryRun }),
    issues: [] as Issue[],
  }));
  if (!result.ok) {
    return {
      exitCode: 1,
      event: commonEvent("cache", {
        status: "failed",
        success: false,
        readiness: "not-applicable",
        issues: result.issues,
      }),
    };
  }
  const cleaned = result.value;
  return {
    exitCode: 0,
    event: commonEvent("cache", { data: { ...cleaned } }),
    human: [
      `${dryRun ? "Would remove" : "Removed"} ${cleaned.removed.length} disposable item(s), ${cleaned.reclaimedBytes} bytes.`,
      `Kept ${cleaned.keptBuilds.length} preview build(s); source, media, history, receipts and exports are never touched.`,
    ],
  };
};

/**
 * Records the owner's acceptance of a recipe's current code. Run it only after
 * the owner reviewed that code and said so; it never edits source files.
 */
const recipeCommand = async (args: readonly string[]): Promise<Execution> => {
  const [subcommand, ...rest] = args;
  const parsed = parseArguments(
    rest,
    [],
    ["--recipe", "--authorized-by", "--note"],
  );
  const recipeId = parsed.values.get("--recipe");
  const authorizedBy = parsed.values.get("--authorized-by");
  if (
    parsed.error ||
    subcommand !== "trust" ||
    parsed.positionals.length > 1 ||
    !recipeId ||
    !authorizedBy
  ) {
    return usageFailure(
      "recipe",
      parsed.error ??
        "recipe supports: recipe trust [project] --recipe <id> --authorized-by <name> [--note <text>].",
    );
  }
  const loaded = await loadPlanProject(parsed.positionals[0] ?? ".");
  const failed = (issues: Issue[]): Execution => ({
    exitCode: 1,
    event: commonEvent("recipe", {
      status: "failed",
      success: false,
      readiness: "invalid",
      issues,
    }),
  });
  if (!loaded.ok) return failed(loaded.issues);
  const recipe = loaded.value.source.recipes?.find(
    (item) => item.id === recipeId,
  );
  if (!recipe) {
    return failed([
      {
        code: "RECIPE_UNKNOWN",
        severity: "error",
        responsible: "user",
        artifact: "naraframe.json",
        path: "/recipes",
        message: `This project declares no recipe ${recipeId}.`,
        suggestion:
          "Use the id of a recipe listed under recipes in naraframe.json.",
      },
    ]);
  }
  const note = parsed.values.get("--note");
  const recorded = await recordRecipeTrust(loaded.value.root, {
    recipeId: recipe.id,
    codeSha256: recipe.codeSha256,
    authorizedBy,
    ...(note ? { note } : {}),
    trustedAt: new Date().toISOString(),
  });
  if (!recorded.ok) return failed(recorded.issues);
  const trust = recorded.value;
  return {
    exitCode: 0,
    event: commonEvent("recipe", {
      readiness: "not-applicable",
      data: {
        trust,
        version: recipe.version,
        files: recipe.files,
      },
    }),
    human: [
      `Trusted recipe ${recipe.id} ${recipe.version} code ${recipe.codeSha256.slice(0, 12)} for this project (authorized by ${authorizedBy}).`,
    ],
  };
};

const libraryCommand = async (args: readonly string[]): Promise<Execution> => {
  const [subcommand, ...rest] = args;
  const parsed = parseArguments(
    rest,
    ["--update"],
    ["--from", "--pattern", "--version", "--instance", "--scene", "--params"],
  );
  if (
    parsed.error ||
    parsed.positionals.length !== 1 ||
    !["inspect", "stage"].includes(subcommand ?? "")
  )
    return usageFailure(
      "library",
      parsed.error ??
        "library requires inspect <catalog> or stage <project> --instance <id> --params <params.json>.",
    );
  // Exactly one positional after the check above: the catalog or project.
  const target = parsed.positionals[0] ?? "";
  const fail = (issues: Issue[]): Execution => ({
    exitCode: 1,
    event: commonEvent("library", {
      status: "failed",
      success: false,
      readiness: "invalid",
      issues,
    }),
  });
  if (subcommand === "inspect") {
    if (parsed.values.size || parsed.flags.size)
      return usageFailure(
        "library",
        "inspect accepts only a catalog path and --json.",
      );
    const result = await inspectLibrary(target);
    if (!result.ok) return fail(result.issues);
    return {
      exitCode: 0,
      event: commonEvent("library", { data: { ...result.value } }),
      humanJson: result.value,
    };
  }
  const instance = parsed.values.get("--instance"),
    paramsPath = parsed.values.get("--params");
  if (!instance || !paramsPath)
    return usageFailure(
      "library",
      "stage requires --instance <id> and --params <params.json>.",
    );
  let params: unknown;
  try {
    params = JSON.parse(await readFile(resolve(paramsPath), "utf8"));
  } catch {
    return fail([
      {
        code: "LIBRARY_PARAMS_INVALID",
        severity: "error",
        responsible: "user",
        artifact: paramsPath,
        path: "/",
        message: "Parameters must be readable JSON.",
        suggestion:
          "Provide a JSON object matching the catalog parameter contract.",
      },
    ]);
  }
  if (!params || typeof params !== "object" || Array.isArray(params))
    return usageFailure("library", "--params must contain a JSON object.");
  const optional = <K extends string>(flag: string, key: K) => {
    const value = parsed.values.get(flag);
    return value === undefined ? {} : ({ [key]: value } as Record<K, string>);
  };
  const result = await stageLibrary({
    root: target,
    instance,
    params: params as Record<string, unknown>,
    ...optional("--from", "from"),
    ...optional("--pattern", "pattern"),
    ...optional("--version", "version"),
    ...optional("--scene", "scene"),
    ...(parsed.flags.has("--update") ? { update: true } : {}),
  });
  if (!result.ok) return fail(result.issues);
  return {
    exitCode: 0,
    event: commonEvent("library", {
      sourceRevision: result.value.sourceRevision,
      artifacts: { staging: result.value.staging },
      data: {
        receipt: result.value.receipt,
        files: result.value.files,
        edit: {
          from: result.value.staging,
          expect: result.value.sourceRevision,
        },
      },
    }),
    human: [
      `Staged ${result.value.receipt.instance} (${result.value.receipt.disposition}) in ${result.value.staging}`,
      `Apply: naraframe edit ${resolve(target)} --from ${result.value.staging} --expect ${result.value.sourceRevision}`,
    ],
  };
};

const audioCommand = async (args: readonly string[]): Promise<Execution> => {
  const [subcommand, ...rest] = args;
  const parsed = parseArguments(rest, [], ["--from", "--timing", "--block"]);
  const from = parsed.values.get("--from"),
    timing = parsed.values.get("--timing"),
    block = parsed.values.get("--block");
  if (
    parsed.error ||
    subcommand !== "stage" ||
    parsed.positionals.length !== 1 ||
    !from ||
    !timing ||
    !block
  )
    return usageFailure(
      "audio",
      parsed.error ??
        "audio stage requires <project> --from <clip> --timing <package.json> --block <id>.",
    );
  const result = await stagePreparedAudio({
    root: parsed.positionals[0] ?? "",
    from,
    timing,
    block,
    ffprobePath: ffprobeExecutable(),
  });
  if (!result.ok)
    return {
      exitCode: 1,
      event: commonEvent("audio", {
        status: "failed",
        success: false,
        readiness: "invalid",
        issues: result.issues,
      }),
    };
  return {
    exitCode: 0,
    event: commonEvent("audio", {
      sourceRevision: result.value.sourceRevision,
      artifacts: { staging: result.value.staging },
      data: {
        ...result.value,
        edit: {
          from: result.value.staging,
          expect: result.value.sourceRevision,
        },
      },
    }),
    human: [
      `Staged captured audio for ${block} (${result.value.verification}) in ${result.value.staging}`,
    ],
  };
};

const knownCommand = (value: string | undefined): CommandName =>
  value === "version" ||
  value === "doctor" ||
  value === "schema" ||
  value === "create" ||
  value === "validate" ||
  value === "status" ||
  value === "preview" ||
  value === "edit" ||
  value === "undo" ||
  value === "history" ||
  value === "render" ||
  value === "cache" ||
  value === "profile" ||
  value === "recipe" ||
  value === "audio" ||
  value === "library"
    ? value
    : "unknown";

const executeCommand = async (
  command: CommandName,
  args: readonly string[],
  options: RunCliOptions,
): Promise<Execution> => {
  if (command === "version") return versionCommand(args);
  if (command === "doctor") return doctorCommand(args);
  if (command === "schema") return schemaCommand(args);
  if (command === "create") return createCommand(args);
  if (command === "validate") return validateCommand(args);
  if (command === "status") return statusCommand(args);
  if (command === "preview") return previewCommand(args, options);
  if (command === "edit") return editCommand(args);
  if (command === "undo") return undoCommand(args);
  if (command === "history") return historyCommand(args);
  if (command === "render") return renderCommand(args, options);
  if (command === "cache") return cacheCommand(args);
  if (command === "profile") return profileCommand(args);
  if (command === "recipe") return recipeCommand(args);
  if (command === "library") return libraryCommand(args);
  if (command === "audio") return audioCommand(args);
  return usageFailure("unknown", "Unknown or missing command.");
};

export const runCommandLine = async (
  args: readonly string[],
  options: RunCliOptions = {},
): Promise<number> => {
  const startedAt = performance.now();
  const jsonCount = args.filter((argument) => argument === "--json").length;
  const jsonMode = jsonCount > 0;
  const cleanArgs = args.filter((argument) => argument !== "--json");
  const command = knownCommand(cleanArgs[0]);
  let execution: Execution;
  let previewRenameDispatched = false;
  const commandOptions: RunCliOptions = {
    ...options,
    onPreviewRenameDispatched: () => {
      previewRenameDispatched = true;
      options.onPreviewRenameDispatched?.();
    },
  };

  try {
    execution =
      jsonCount > 1
        ? usageFailure(command, "Option --json may only be provided once.")
        : await executeCommand(command, cleanArgs.slice(1), commandOptions);
  } catch (error) {
    const interrupted =
      !previewRenameDispatched &&
      (options.signal?.aborted ||
        (error instanceof Error && error.name === "AbortError"));
    const visualPreflightFailed = isVisualPreflightError(error);
    execution = {
      exitCode: interrupted ? 130 : visualPreflightFailed ? 1 : 2,
      event: commonEvent(command, {
        status: interrupted ? "interrupted" : "failed",
        success: false,
        readiness: visualPreflightFailed ? "invalid" : "not-ready",
        issues: interrupted
          ? [interruptedIssue()]
          : visualPreflightFailed
            ? error.issues
            : isFrameIntegrityError(error)
              ? error.issues
              : [systemIssue(error)],
      }),
    };
  }

  if (options.signal?.aborted && !previewRenameDispatched) {
    execution = {
      exitCode: 130,
      event: commonEvent(command, {
        status: "interrupted",
        success: false,
        readiness: "not-ready",
        issues: [interruptedIssue()],
      }),
    };
  }

  if (execution.event.issues.length > 0) printIssues(execution.event.issues);
  if (jsonMode) {
    process.stdout.write(
      `${JSON.stringify(commandResult(execution.event, startedAt))}\n`,
    );
  } else {
    if (execution.exitCode === 3) console.error(usage);
    if (execution.humanJson !== undefined) {
      console.log(JSON.stringify(execution.humanJson, null, 2));
    }
    for (const line of execution.human ?? []) console.log(line);
  }
  return execution.exitCode;
};
