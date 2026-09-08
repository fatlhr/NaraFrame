import type { ZodError, ZodIssue } from "zod";

export type IssueSeverity = "error" | "warning" | "info";
export type IssueResponsible = "agent" | "user" | "system";

export interface Issue {
  code: string;
  severity: IssueSeverity;
  responsible: IssueResponsible;
  artifact: string;
  path: string;
  message: string;
  suggestion?: string;
  entityId?: string;
  details?: unknown;
}

export type Result<T> =
  | { ok: true; value: T; issues: Issue[] }
  | { ok: false; issues: Issue[] };

const escapeJsonPointerSegment = (segment: string | number): string =>
  String(segment).replaceAll("~", "~0").replaceAll("/", "~1");

export const toJsonPointer = (path: readonly PropertyKey[]): string => {
  if (path.length === 0) {
    return "/";
  }

  return `/${path.map((segment) => escapeJsonPointerSegment(String(segment))).join("/")}`;
};

const issuePaths = (issue: ZodIssue): PropertyKey[][] => {
  if (issue.code === "unrecognized_keys") {
    return issue.keys.map((key) => [...issue.path, key]);
  }

  return [issue.path];
};

export const issuesFromZodError = (
  error: ZodError,
  artifact: string,
): Issue[] =>
  error.issues.flatMap((zodIssue) =>
    issuePaths(zodIssue).map((path) => {
      const isUnsupportedVersion = path.at(-1) === "schemaVersion";

      return {
        code: isUnsupportedVersion
          ? "SCHEMA_VERSION_UNSUPPORTED"
          : "SCHEMA_INVALID",
        severity: "error",
        responsible: "agent",
        artifact,
        path: toJsonPointer(path),
        message: isUnsupportedVersion
          ? "This schema version is not supported by the current NaraFrame runtime."
          : zodIssue.message,
        suggestion: isUnsupportedVersion
          ? "Use schemaVersion 1 or migrate the source before retrying."
          : "Correct the value at the reported path and validate again.",
      } satisfies Issue;
    }),
  );

export const sortIssues = (issues: readonly Issue[]): Issue[] =>
  [...issues].sort(
    (left, right) =>
      left.artifact.localeCompare(right.artifact) ||
      left.path.localeCompare(right.path) ||
      left.code.localeCompare(right.code),
  );
