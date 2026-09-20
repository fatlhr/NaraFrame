import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  type Approval,
  type CompiledDraft,
  checkProductionReadiness,
  compileDraft,
  computeCostReport,
  computeReuse,
  createProject,
  editProject,
  exportSchemas,
  type Issue,
  type LoadedPlanProject,
  loadPlanProject,
  readApprovals,
  readProductionLedger,
  readRevisionState,
  recordApproval,
  syncWorkingCopy,
  undoProject,
  withProjectLock,
  writePreviewSelection,
} from "@naraframe/core";
import { isVisualPreflightError } from "@naraframe/renderer-remotion";
import {
  type CommandEventInput,
  type CommandName,
  commandResult,
  interruptedIssue,
  systemIssue,
  usageIssue,
} from "./command-result.js";
import { runDoctorChecks } from "./doctor.js";
import {
  preflightNarrationAudio,
  publishFinalBuild,
  readCurrentOutput,
} from "./final-build.js";
import { publishPreviewBuild } from "./preview-build.js";
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
  error?: string;
}

const usage = `NaraFrame

Usage:
  naraframe doctor [--json]
  naraframe schema [--json]
  naraframe create <name> --profile <id-or-path> [--json]
  naraframe validate [project] --stage plan [--json]
  naraframe status [project] [--json]
  naraframe preview [project] --draft [--scene <scene-id>] [--json]`;

const repositoryRoot = resolve(
  fileURLToPath(new URL(".", import.meta.url)),
  "../../..",
);

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
): ParsedArguments => {
  const positionals: string[] = [];
  const flags = new Set<string>();
  const values = new Map<string, string>();
  const allowedFlagSet = new Set(allowedFlags);
  const allowedValueSet = new Set(allowedValues);

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (!argument) continue;
    if (!argument.startsWith("--")) {
      positionals.push(argument);
      continue;
    }
    if (allowedFlagSet.has(argument)) {
      if (flags.has(argument)) {
        return {
          positionals,
          flags,
          values,
          error: `Option ${argument} may only be provided once.`,
        };
      }
      flags.add(argument);
      continue;
    }
    if (allowedValueSet.has(argument)) {
      if (values.has(argument)) {
        return {
          positionals,
          flags,
          values,
          error: `Option ${argument} may only be provided once.`,
        };
      }
      const value = args[index + 1];
      if (!value || value.startsWith("--")) {
        return {
          positionals,
          flags,
          values,
          error: `Option ${argument} requires a value.`,
        };
      }
      values.set(argument, value);
      index += 1;
      continue;
    }
    return {
      positionals,
      flags,
      values,
      error: `Unknown option ${argument}.`,
    };
  }
  return { positionals, flags, values };
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
  const result = await runDoctorChecks(repositoryRoot);
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
  return {
    exitCode: 0,
    event: commonEvent("schema", { data: { schemas } }),
    humanJson: schemas,
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
  const parsed = parseArguments(args, [], ["--stage"]);
  const stage = parsed.values.get("--stage");
  if (
    parsed.error ||
    parsed.positionals.length > 1 ||
    (stage !== "plan" && stage !== "production")
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
    const checks = await runProductionChecks(loaded.value);
    return {
      exitCode: checks.ok ? 0 : 1,
      event: commonEvent("validate", {
        status: checks.ok ? "completed" : "failed",
        success: checks.ok,
        readiness: checks.ok ? "ready" : "not-ready",
        mode: "final",
        scope: { type: "project" },
        sourceRevision: checks.draft?.sourceRevision ?? null,
        fingerprint: checks.final?.assemblyKey ?? null,
        issues: [...loaded.issues, ...checks.issues],
        data: { stage: "production" },
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
  const parsed = parseArguments(args, ["--draft"], ["--scene"]);
  if (
    parsed.error ||
    parsed.positionals.length > 1 ||
    !parsed.flags.has("--draft")
  ) {
    return usageFailure(
      "preview",
      parsed.error ??
        "preview accepts at most one project and requires --draft in M0.",
    );
  }
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
  const compiled = compileDraft(
    loaded.value.source,
    sceneId ? { type: "scene", sceneId } : { type: "project" },
  );
  const issues = [...loaded.issues, ...compiled.issues];
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
  const published = await publishPreviewBuild({
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
        muted: !compiled.value.narration,
        timelineScope: compiled.value.timelineScope,
        manifestSha256: published.manifestSha256,
      },
    }),
    human: [
      `Preview build ready: ${published.buildDirectory}`,
      `Current pointer: ${published.currentPointer}`,
      `${published.rendered.width}x${published.rendered.height} @ ${published.rendered.fps}fps, ${(published.rendered.durationInFrames / published.rendered.fps).toFixed(1)}s, ${compiled.value.narration ? "narrated" : "draft only, no audio"}`,
    ],
  };
};

const editCommand = async (args: readonly string[]): Promise<Execution> => {
  const parsed = parseArguments(args, [], ["--from", "--expect", "--summary"]);
  if (
    parsed.error ||
    parsed.positionals.length !== 1 ||
    !parsed.values.has("--from") ||
    !parsed.values.has("--expect")
  ) {
    return usageFailure(
      "edit",
      parsed.error ??
        "edit requires one project, --from <staging-dir>, and --expect <revision>.",
    );
  }
  const root = resolve(parsed.positionals[0] ?? ".");
  const result = await editProject({
    root,
    from: resolve(parsed.values.get("--from") ?? ""),
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
        capturedDirectEdits: result.value.captured,
        reuse: reuse.ok ? reuse.value : null,
      },
    }),
    human: [
      `Revision ${result.value.revisionId.slice(0, 12)} (from ${result.value.parentId.slice(0, 12)}): ${result.value.files.join(", ")}`,
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
  if (!draft.ok || !final.ok) return { ok: false, issues };
  issues.push(
    ...checkProductionReadiness(loaded.source, final.value, final.issues),
  );
  issues.push(...(await preflightNarrationAudio(loaded.root, final.value)));
  const ok = !issues.some((issue) => issue.severity === "error");
  return { ok, issues, draft: draft.value, final: final.value };
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
    if (!manifest) {
      fail(
        "APPROVAL_PREVIEW_UNKNOWN",
        `Preview build ${reviewed} does not exist.`,
        "Use a build id reported by preview or status.",
      );
    } else if (
      manifest.sourceRevision !== checks.draft.sourceRevision ||
      manifest.assemblyKey !== checks.draft.assemblyKey ||
      scope.type !== "project"
    ) {
      fail(
        "APPROVAL_PREVIEW_STALE",
        `Preview build ${reviewed} is not a full preview of the current source, so its review does not carry over.`,
        "Run preview --draft on the current source, review it, and approve that build.",
      );
    } else if (render.audio !== "aac") {
      fail(
        "APPROVAL_PREVIEW_SILENT",
        `Preview build ${reviewed} has no narration audio.`,
        "Review a narrated preview before exporting.",
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
  const published = await publishFinalBuild({
    projectRoot: loaded.value.root,
    draft: checks.final,
    approval,
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
        audio: "aac",
        manifestSha256: published.manifestSha256,
      },
    }),
    human: [
      `Final export ready: ${published.buildDirectory}`,
      `${published.rendered.width}x${published.rendered.height} @ ${published.rendered.fps}fps, ${(published.rendered.durationInFrames / published.rendered.fps).toFixed(1)}s, H.264 + AAC`,
      approval.autonomy
        ? `Approved by autonomy authorisation from ${approval.autonomy.authorizedBy}`
        : `Approved from reviewed preview ${approval.previewBuildId}`,
    ],
  };
};

const knownCommand = (value: string | undefined): CommandName =>
  value === "doctor" ||
  value === "schema" ||
  value === "create" ||
  value === "validate" ||
  value === "status" ||
  value === "preview" ||
  value === "edit" ||
  value === "undo" ||
  value === "render"
    ? value
    : "unknown";

const executeCommand = async (
  command: CommandName,
  args: readonly string[],
  options: RunCliOptions,
): Promise<Execution> => {
  if (command === "doctor") return doctorCommand(args);
  if (command === "schema") return schemaCommand(args);
  if (command === "create") return createCommand(args);
  if (command === "validate") return validateCommand(args);
  if (command === "status") return statusCommand(args);
  if (command === "preview") return previewCommand(args, options);
  if (command === "edit") return editCommand(args);
  if (command === "undo") return undoCommand(args);
  if (command === "render") return renderCommand(args, options);
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
