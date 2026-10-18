import type { Issue } from "@naraframe/core";

export type CommandName =
  | "version"
  | "doctor"
  | "schema"
  | "create"
  | "validate"
  | "status"
  | "outline"
  | "preview"
  | "edit"
  | "undo"
  | "history"
  | "render"
  | "cache"
  | "profile"
  | "recipe"
  | "library"
  | "audio"
  | "unknown";

export type CommandReadiness =
  | "ready"
  | "draft-only"
  | "not-ready"
  | "invalid"
  | "not-applicable"
  | "unknown";

export interface CommandResultEvent {
  schemaVersion: 1;
  type: "command-result";
  command: CommandName;
  status: "completed" | "failed" | "interrupted";
  success: boolean;
  readiness: CommandReadiness;
  sourceRevision: string | null;
  fingerprint: string | null;
  buildId: string | null;
  mode: "draft" | "final" | null;
  scope: Record<string, unknown> | null;
  artifacts: Record<string, string>;
  issues: Issue[];
  durationMs: number;
  data: Record<string, unknown>;
}

export type CommandEventInput = Omit<
  CommandResultEvent,
  "schemaVersion" | "type" | "durationMs"
>;

export const commandResult = (
  input: CommandEventInput,
  startedAt: number,
): CommandResultEvent => ({
  schemaVersion: 1,
  type: "command-result",
  ...input,
  durationMs: Math.max(0, Math.round(performance.now() - startedAt)),
});

export const usageIssue = (message: string): Issue => ({
  code: "CLI_USAGE",
  severity: "error",
  responsible: "user",
  artifact: "cli",
  path: "/arguments",
  message,
  suggestion:
    "Check the command name and its options against the usage list that `naraframe` prints when run without arguments.",
});

export const interruptedIssue = (): Issue => ({
  code: "COMMAND_INTERRUPTED",
  severity: "error",
  responsible: "user",
  artifact: "cli",
  path: "/signal",
  message: "The command was interrupted before it completed.",
  suggestion: "Run the command again when you are ready.",
});

export const systemIssue = (error: unknown): Issue => {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("Browser executable not found")) {
    return {
      code: "BROWSER_NOT_PROVISIONED",
      severity: "error",
      responsible: "system",
      artifact: "runtime",
      path: "/browser",
      message:
        "An explicitly provisioned Chrome or Chromium executable is required.",
      suggestion:
        "Set NARAFRAME_BROWSER_EXECUTABLE to an installed compatible browser and retry.",
    };
  }
  if (message.toLowerCase().includes("ffmpeg")) {
    return {
      code: "FFMPEG_NOT_AVAILABLE",
      severity: "error",
      responsible: "system",
      artifact: "runtime",
      path: "/ffmpeg",
      message: "FFmpeg or FFprobe is unavailable for preview verification.",
      suggestion:
        "Provision FFmpeg and FFprobe locally or set the NARAFRAME_FFMPEG_EXECUTABLE and NARAFRAME_FFPROBE_EXECUTABLE paths.",
    };
  }
  if (message.includes("Unsafe output path")) {
    return {
      code: "PREVIEW_OUTPUT_UNSAFE",
      severity: "error",
      responsible: "system",
      artifact: "preview",
      path: "/",
      message:
        "Preview output metadata or directories failed the project containment check.",
      suggestion:
        "Remove unsafe generated symlinks and retry without changing project source files.",
    };
  }
  return {
    code: "SYSTEM_ERROR",
    severity: "error",
    responsible: "system",
    artifact: "runtime",
    path: "/",
    message: "A local system dependency or renderer operation failed.",
    suggestion:
      "Run naraframe doctor --json, correct the reported dependency, and retry.",
    details: {
      errorName: error instanceof Error ? error.name : "UnknownError",
    },
  };
};
