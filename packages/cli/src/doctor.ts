import { spawn } from "node:child_process";
import { constants } from "node:fs";
import { access } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { Issue } from "@naraframe/core";
import { corePackage } from "@naraframe/core";
import {
  rendererCorePackage,
  rendererPackage,
  rendererRemotionVersion,
} from "@naraframe/renderer-remotion";

const expectedRemotionVersion = "4.0.521";

export interface DoctorCheck {
  id:
    | "node"
    | "packages"
    | "browser"
    | "ffmpeg"
    | "ffprobe"
    | "font"
    | "filesystem"
    | "renderer";
  status: "ready" | "missing" | "incompatible";
  detail: string;
}

const browserExecutable = (): string =>
  process.env.NARAFRAME_BROWSER_EXECUTABLE ??
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const ffmpegExecutable = (): string =>
  process.env.NARAFRAME_FFMPEG_EXECUTABLE ?? "/opt/homebrew/bin/ffmpeg";

export const ffprobeExecutable = (): string =>
  process.env.NARAFRAME_FFPROBE_EXECUTABLE ??
  join(dirname(ffmpegExecutable()), "ffprobe");

const fontCandidates = (): string[] => [
  ...(process.env.NARAFRAME_FONT_FILE ? [process.env.NARAFRAME_FONT_FILE] : []),
  "/System/Library/Fonts/SFNS.ttf",
  "/System/Library/Fonts/Helvetica.ttc",
];

const commandVersion = async (
  executable: string,
  args: readonly string[],
): Promise<string> =>
  new Promise((resolvePromise, reject) => {
    const child = spawn(executable, args, {
      stdio: ["ignore", "pipe", "pipe"],
    });
    const stdout: Buffer[] = [];
    const stderr: Buffer[] = [];
    child.stdout.on("data", (chunk: Buffer) => stdout.push(chunk));
    child.stderr.on("data", (chunk: Buffer) => stderr.push(chunk));
    child.once("error", reject);
    child.once("close", (code) => {
      if (code !== 0) {
        reject(new Error(`${executable} exited with ${code ?? "unknown"}.`));
        return;
      }
      resolvePromise(
        (
          Buffer.concat(stdout).toString("utf8") ||
          Buffer.concat(stderr).toString("utf8")
        )
          .split("\n")[0]
          ?.trim() ?? "unknown",
      );
    });
  });

const dependencyIssue = (check: DoctorCheck): Issue => ({
  code:
    check.id === "node"
      ? "NODE_VERSION_INCOMPATIBLE"
      : check.id === "browser"
        ? "BROWSER_NOT_PROVISIONED"
        : check.id === "ffmpeg" || check.id === "ffprobe"
          ? "FFMPEG_NOT_AVAILABLE"
          : check.id === "font"
            ? "FONT_NOT_AVAILABLE"
            : check.id === "filesystem"
              ? "FILESYSTEM_NOT_WRITABLE"
              : "RUNTIME_INCOMPATIBLE",
  severity: "error",
  responsible: "system",
  artifact: "runtime",
  path: `/${check.id}`,
  message: check.detail,
  suggestion:
    check.id === "node"
      ? "Run NaraFrame with the Node version pinned in .node-version."
      : check.id === "browser"
        ? "Provision Chrome or Chromium explicitly and set NARAFRAME_BROWSER_EXECUTABLE."
        : check.id === "ffmpeg" || check.id === "ffprobe"
          ? "Provision FFmpeg and FFprobe locally or configure their executable paths."
          : check.id === "font"
            ? "Set NARAFRAME_FONT_FILE to a readable local font."
            : check.id === "filesystem"
              ? "Grant read/write access to the NaraFrame workspace."
              : "Reinstall the pinned workspace dependencies and rebuild NaraFrame.",
});

const executableCheck = async (
  id: "browser" | "ffmpeg" | "ffprobe",
  executable: string,
  args: readonly string[],
): Promise<DoctorCheck> => {
  try {
    await access(executable, constants.R_OK | constants.X_OK);
    return {
      id,
      status: "ready",
      detail: await commandVersion(executable, args),
    };
  } catch {
    return {
      id,
      status: "missing",
      detail: `${id === "browser" ? "Browser" : id} is not available at its configured local path.`,
    };
  }
};

export const runDoctorChecks = async (
  repositoryRoot: string,
): Promise<{ checks: DoctorCheck[]; issues: Issue[] }> => {
  const checks: DoctorCheck[] = [];
  checks.push({
    id: "node",
    status: process.versions.node === "24.20.0" ? "ready" : "incompatible",
    detail:
      process.versions.node === "24.20.0"
        ? `Node ${process.versions.node}`
        : `Node ${process.versions.node} is active; NaraFrame is pinned to 24.20.0.`,
  });
  checks.push({
    id: "packages",
    status:
      corePackage === "@naraframe/core" &&
      rendererPackage === "@naraframe/renderer-remotion" &&
      rendererCorePackage === corePackage &&
      rendererRemotionVersion === expectedRemotionVersion
        ? "ready"
        : "incompatible",
    detail:
      rendererRemotionVersion === expectedRemotionVersion
        ? `CLI -> renderer -> core boundary; Remotion ${rendererRemotionVersion}`
        : `Remotion ${rendererRemotionVersion} is active; NaraFrame is pinned to ${expectedRemotionVersion}.`,
  });
  checks.push(
    await executableCheck("browser", browserExecutable(), ["--version"]),
  );
  checks.push(
    await executableCheck("ffmpeg", ffmpegExecutable(), ["-version"]),
  );
  checks.push(
    await executableCheck("ffprobe", ffprobeExecutable(), ["-version"]),
  );

  let font: string | undefined;
  for (const candidate of fontCandidates()) {
    try {
      await access(candidate, constants.R_OK);
      font = candidate;
      break;
    } catch {
      // Try the next local font candidate.
    }
  }
  checks.push({
    id: "font",
    status: font ? "ready" : "missing",
    detail: font
      ? "A readable local font is available."
      : "No readable local font is configured.",
  });

  try {
    await access(repositoryRoot, constants.R_OK | constants.W_OK);
    checks.push({
      id: "filesystem",
      status: "ready",
      detail:
        "Workspace source, staging, and output roots are readable and writable.",
    });
  } catch {
    checks.push({
      id: "filesystem",
      status: "missing",
      detail: "Workspace source, staging, or output roots are not writable.",
    });
  }
  checks.push({
    id: "renderer",
    status:
      rendererPackage === "@naraframe/renderer-remotion"
        ? "ready"
        : "incompatible",
    detail:
      "Pinned Remotion renderer adapter is installed; doctor does not render or download.",
  });

  return {
    checks,
    issues: checks
      .filter((check) => check.status !== "ready")
      .map(dependencyIssue),
  };
};
