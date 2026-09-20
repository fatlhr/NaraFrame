import type { Issue, Result } from "../model/issue.js";
import { type ProfileLock, ProfileLockSchema } from "../schema/profile.js";

/** Config paths use the profile's own vocabulary; only these roots live in the lock. */
const PROFILE_ROOTS = new Set(["render", "production", "duration"]);

const covers = (parent: string, child: string): boolean =>
  child === parent || child.startsWith(`${parent}.`);

const issue = (
  code: string,
  path: string,
  message: string,
  suggestion: string,
): Issue => ({
  code,
  severity: "error",
  responsible: "agent",
  artifact: "naraframe.json",
  path: `/overrides/${path}`,
  message,
  suggestion,
});

const setPath = (
  target: Record<string, unknown>,
  path: string,
  value: unknown,
): void => {
  const segments = path.split(".");
  let cursor = target;
  for (const segment of segments.slice(0, -1)) {
    const next = cursor[segment];
    if (typeof next !== "object" || next === null || Array.isArray(next)) {
      cursor[segment] = {};
    }
    cursor = cursor[segment] as Record<string, unknown>;
  }
  const last = segments.at(-1);
  if (last !== undefined) cursor[last] = value;
};

/** Which of a profile's config paths a project may change, and why not otherwise. */
export const classifyOverridePath = (
  profile: Pick<ProfileLock, "lockedPaths" | "overridablePaths">,
  path: string,
): "allowed" | "locked" | "not-overridable" | "unknown-root" => {
  if (!PROFILE_ROOTS.has(path.split(".")[0] ?? "")) return "unknown-root";
  // Touching a locked path, or a parent that contains one, is never allowed.
  if (
    profile.lockedPaths.some(
      (locked) => covers(locked, path) || covers(path, locked),
    )
  ) {
    return "locked";
  }
  return profile.overridablePaths.some((allowed) => covers(allowed, path))
    ? "allowed"
    : "not-overridable";
};

/**
 * Resolves the pinned profile with the project's explicit overrides on top:
 * engine defaults, then the profile snapshot, then project overrides. A locked
 * or undeclared path is an error, and the result must still be a valid
 * profile, so an override can never smuggle in an invalid value.
 */
export const applyProjectOverrides = (
  profile: ProfileLock,
  overrides: Record<string, unknown> | undefined,
): Result<ProfileLock> => {
  const entries = Object.entries(overrides ?? {});
  if (entries.length === 0) return { ok: true, value: profile, issues: [] };

  const issues: Issue[] = [];
  const accepted: Array<[string, unknown]> = [];
  for (const [path, value] of entries) {
    const kind = classifyOverridePath(profile, path);
    if (kind === "allowed") {
      accepted.push([path, value]);
    } else if (kind === "locked") {
      issues.push(
        issue(
          "OVERRIDE_LOCKED",
          path,
          `The profile locks ${path}, so a project cannot override it.`,
          "Remove the override, or apply a profile that allows it.",
        ),
      );
    } else if (kind === "unknown-root") {
      issues.push(
        issue(
          "OVERRIDE_PATH_UNKNOWN",
          path,
          `${path} is not a profile setting (expected render.*, production.*, or duration.*).`,
          "Use a dotted path under render, production, or duration.",
        ),
      );
    } else {
      issues.push(
        issue(
          "OVERRIDE_NOT_ALLOWED",
          path,
          `The profile does not list ${path} as overridable.`,
          "Only override paths the profile declares in overridablePaths.",
        ),
      );
    }
  }
  if (issues.length > 0) return { ok: false, issues };

  const draft = structuredClone(profile) as unknown as Record<string, unknown>;
  for (const [path, value] of accepted) setPath(draft, path, value);
  const parsed = ProfileLockSchema.safeParse(draft);
  if (!parsed.success) {
    return {
      ok: false,
      issues: parsed.error.issues.map((problem) =>
        issue(
          "OVERRIDE_INVALID",
          problem.path.join("."),
          `The overridden profile is invalid: ${problem.message}`,
          "Correct the override value so the resolved profile still validates.",
        ),
      ),
    };
  }
  return { ok: true, value: parsed.data, issues: [] };
};
