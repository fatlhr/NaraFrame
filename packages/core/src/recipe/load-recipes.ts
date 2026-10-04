import { lstat, readFile } from "node:fs/promises";
import { posix, resolve } from "node:path";
import { type Issue, type Result, sortIssues } from "../model/issue.js";
import { hashValue, sha256File } from "../project/hash.js";
import { resolveSafeExistingFile } from "../project/safe-path.js";
import type { PlanSource } from "../schema/export-schema.js";
import {
  type LoadedRecipe,
  type RecipeDeclaration,
  RecipeManifestSchema,
} from "../schema/recipe.js";

/** Bare modules a recipe may import; everything else must be a listed file. */
export const RECIPE_ALLOWED_MODULES = ["react", "remotion"] as const;

/**
 * APIs a trusted recipe must not use: they reach the network, read the clock
 * or randomness (so a frame would not be a pure function of time), evaluate
 * strings as code, or touch the host. This is hygiene for trusted owner code,
 * not a sandbox for untrusted code.
 */
const FORBIDDEN_CODE: Array<[RegExp, string]> = [
  [/\bfetch\s*\(/, "fetch()"],
  [/\bXMLHttpRequest\b/, "XMLHttpRequest"],
  [/\bWebSocket\b/, "WebSocket"],
  [/\bEventSource\b/, "EventSource"],
  [/\bsendBeacon\b/, "navigator.sendBeacon"],
  [/\bDate\.now\s*\(/, "Date.now()"],
  [/\bnew\s+Date\s*\(/, "new Date()"],
  [/\bperformance\.now\s*\(/, "performance.now()"],
  [/\bMath\.random\s*\(/, "Math.random()"],
  [/\beval\s*\(/, "eval()"],
  [/\bnew\s+Function\s*\(/, "new Function()"],
  [/\bprocess\./, "process"],
  [/\brequire\s*\(/, "require()"],
  [/\bimportScripts\s*\(/, "importScripts()"],
];

const SPECIFIER =
  /(?:\bimport\s+(?:type\s+)?(?:[^'";]*?\sfrom\s+)?|\bexport\s+[^'";]*?\sfrom\s+|\bimport\s*\(\s*)["']([^"']+)["']/g;

const recipeIssue = (
  code: string,
  artifact: string,
  path: string,
  message: string,
  suggestion: string,
  entityId: string,
): Issue => ({
  code,
  severity: "error",
  responsible: "agent",
  artifact,
  path,
  message,
  suggestion,
  entityId,
});

/** Imports and forbidden APIs in one recipe file, by plain text scan. */
export const scanRecipeCode = (
  code: string,
  file: string,
  listed: ReadonlySet<string>,
): Array<{ code: string; message: string; suggestion: string }> => {
  const findings: Array<{ code: string; message: string; suggestion: string }> =
    [];
  const withoutComments = code
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");
  for (const match of withoutComments.matchAll(SPECIFIER)) {
    const specifier = match[1] ?? "";
    if ((RECIPE_ALLOWED_MODULES as readonly string[]).includes(specifier)) {
      continue;
    }
    if (specifier.startsWith("./") || specifier.startsWith("../")) {
      const target = posix.normalize(
        posix.join(posix.dirname(file), specifier),
      );
      const candidates = [target, `${target}.ts`, `${target}.tsx`];
      if (
        !target.startsWith("../") &&
        candidates.some((candidate) => listed.has(candidate))
      ) {
        continue;
      }
    }
    findings.push({
      code: "RECIPE_IMPORT_FORBIDDEN",
      message: `${file} imports "${specifier}", which is neither a listed recipe file nor ${RECIPE_ALLOWED_MODULES.join(" or ")}.`,
      suggestion:
        "Import only react, remotion or a file listed in recipe.json, by a relative path inside the recipe directory.",
    });
  }
  for (const [pattern, name] of FORBIDDEN_CODE) {
    if (pattern.test(withoutComments)) {
      findings.push({
        code: "RECIPE_CODE_FORBIDDEN",
        message: `${file} uses ${name}, which a recipe may not use.`,
        suggestion:
          "Derive every pose from the frame and explicit parameters; recipes get no network, clock, randomness, eval or host access.",
      });
    }
  }
  return findings;
};

const loadRecipe = async (
  root: string,
  declaration: RecipeDeclaration,
  index: number,
): Promise<Result<LoadedRecipe>> => {
  const artifact = `${declaration.path}/recipe.json`;
  const at = `/recipes/${index}`;
  const fail = (code: string, message: string, suggestion: string) => ({
    ok: false as const,
    issues: [
      recipeIssue(
        code,
        "naraframe.json",
        at,
        message,
        suggestion,
        declaration.id,
      ),
    ],
  });
  const manifestFile = await resolveSafeExistingFile(root, artifact, {
    artifact: "naraframe.json",
    path: `${at}/path`,
  });
  if (!manifestFile.ok) return manifestFile;
  let raw: unknown;
  try {
    raw = JSON.parse(await readFile(manifestFile.value, "utf8"));
  } catch {
    return fail(
      "RECIPE_MANIFEST_INVALID",
      `${artifact} is not valid JSON.`,
      "Correct recipe.json and validate again.",
    );
  }
  const parsed = RecipeManifestSchema.safeParse(raw);
  if (!parsed.success) {
    return fail(
      "RECIPE_MANIFEST_INVALID",
      `${artifact}: ${parsed.error.issues.map((issue) => `${issue.path.join(".")} ${issue.message}`).join("; ")}`,
      "Correct recipe.json and validate again.",
    );
  }
  const manifest = parsed.data;
  if (manifest.id !== declaration.id) {
    return fail(
      "RECIPE_MANIFEST_INVALID",
      `${artifact} declares id ${manifest.id}, but naraframe.json calls it ${declaration.id}.`,
      "Use the same recipe id in both places.",
    );
  }

  const issues: Issue[] = [];
  const listed = new Set(manifest.files);
  const files: LoadedRecipe["files"] = [
    { path: artifact, sha256: await sha256File(manifestFile.value) },
  ];
  for (const file of manifest.files) {
    const relativePath = `${declaration.path}/${file}`;
    const resolved = await resolveSafeExistingFile(root, relativePath, {
      artifact,
      path: "/files",
    });
    if (!resolved.ok) {
      issues.push(...resolved.issues);
      continue;
    }
    if ((await lstat(resolve(root, relativePath))).isSymbolicLink()) {
      issues.push(
        recipeIssue(
          "RECIPE_FILE_INVALID",
          artifact,
          "/files",
          `${relativePath} is a symbolic link; recipe code must be a regular file inside the recipe directory.`,
          "Replace the link with the file itself.",
          declaration.id,
        ),
      );
      continue;
    }
    const code = await readFile(resolved.value, "utf8");
    for (const finding of scanRecipeCode(code, file, listed)) {
      issues.push(
        recipeIssue(
          finding.code,
          artifact,
          "/files",
          finding.message,
          finding.suggestion,
          declaration.id,
        ),
      );
    }
    files.push({
      path: relativePath,
      sha256: await sha256File(resolved.value),
    });
  }
  if (issues.length > 0) return { ok: false, issues };
  return {
    ok: true,
    value: {
      id: manifest.id,
      version: manifest.version,
      path: declaration.path,
      entry: manifest.entry,
      files,
      codeSha256: hashValue(files),
    },
    issues: [],
  };
};

/** Width and height from a PNG header, or null when it is not a PNG. */
export const pngSize = (
  bytes: Buffer,
): { width: number; height: number } | null =>
  bytes.length >= 24 &&
  bytes.readUInt32BE(0) === 0x89504e47 &&
  bytes.toString("ascii", 12, 16) === "IHDR"
    ? { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) }
    : null;

/**
 * Reads every declared recipe and, for recipe projects, the pixel size of
 * each ready PNG so crops can be checked against the real image.
 */
export const loadRecipes = async (
  root: string,
  source: PlanSource,
): Promise<
  Result<Pick<PlanSource, "recipes" | "imageSizes"> | Record<string, never>>
> => {
  const declarations = source.project.recipes ?? [];
  if (declarations.length === 0) return { ok: true, value: {}, issues: [] };
  const issues: Issue[] = [];
  const recipes: LoadedRecipe[] = [];
  const seen = new Set<string>();
  for (const [index, declaration] of declarations.entries()) {
    if (seen.has(declaration.id)) {
      issues.push(
        recipeIssue(
          "RECIPE_MANIFEST_INVALID",
          "naraframe.json",
          `/recipes/${index}/id`,
          `Recipe ${declaration.id} is declared twice.`,
          "Declare each recipe once.",
          declaration.id,
        ),
      );
      continue;
    }
    seen.add(declaration.id);
    const loaded = await loadRecipe(root, declaration, index);
    if (loaded.ok) recipes.push(loaded.value);
    else issues.push(...loaded.issues);
  }
  const imageSizes: Record<string, { width: number; height: number }> = {};
  for (const asset of source.assets.assets) {
    if (asset.status !== "ready" || asset.kind !== "png") continue;
    const bytes = await readFile(resolve(root, asset.path));
    const size = pngSize(bytes.subarray(0, 24));
    if (size) imageSizes[asset.id] = size;
  }
  return issues.length > 0
    ? { ok: false, issues: sortIssues(issues) }
    : { ok: true, value: { recipes, imageSizes }, issues: [] };
};
