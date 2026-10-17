import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { cropWithinImage, imagePlacement } from "../asset/image-placement.js";
import { sanitizeSvg } from "../asset/svg-sanitize.js";
import { loadPlanProject } from "../io/load-project.js";
import { type Issue, issuesFromZodError, type Result } from "../model/issue.js";
import { hashValue } from "../project/hash.js";
import { resolveSafeExistingFile } from "../project/safe-path.js";
import { loadRecipes, pngSize } from "../recipe/load-recipes.js";
import { linkTree } from "../revision/store.js";
import type { PlanSource } from "../schema/export-schema.js";
import {
  type LibraryCatalog,
  LibraryCatalogSchema,
  type LibraryImport,
  type LibraryPattern,
} from "../schema/library.js";
import { IdSchema, VersionSchema } from "../schema/primitives.js";
import { type Layer, type Scene, SceneSchema } from "../schema/scene.js";

const bytesHash = (bytes: Buffer) =>
  createHash("sha256").update(bytes).digest("hex");
const issue = (
  code: string,
  message: string,
  suggestion = "Correct the catalog or parameters and stage again.",
): Issue => ({
  code,
  severity: "error",
  responsible: "user",
  artifact: "library",
  path: "/",
  message,
  suggestion,
});
class LibraryError extends Error {
  constructor(
    public code: string,
    message: string,
    public suggestion?: string,
  ) {
    super(message);
  }
}
const failed = <T>(error: unknown): Result<T> => ({
  ok: false,
  issues: [
    error instanceof LibraryError
      ? issue(error.code, error.message, error.suggestion)
      : issue(
          "LIBRARY_INPUT_INVALID",
          error instanceof Error ? error.message : String(error),
        ),
  ],
});
const capture = async (root: string, path: string): Promise<Buffer> => {
  const safe = await resolveSafeExistingFile(root, path, {
    artifact: "catalog.json",
    path: "/dependencies",
  });
  if (!safe.ok)
    throw new LibraryError(
      safe.issues[0]?.code ?? "LIBRARY_DEPENDENCY_MISSING",
      safe.issues[0]?.message ?? path,
    );
  return readFile(safe.value);
};

/** Captures verified bytes once; staging never rereads mutable catalog dependencies. */
const captureCatalog = async (path: string) => {
  const absolute = resolve(path);
  const bytes = await readFile(absolute);
  const parsed = LibraryCatalogSchema.safeParse(
    JSON.parse(bytes.toString("utf8")),
  );
  if (!parsed.success)
    return {
      ok: false as const,
      issues: issuesFromZodError(parsed.error, absolute),
    };
  const catalog = parsed.data;
  const root = dirname(absolute);
  const files = new Map<string, Buffer>();
  for (const asset of catalog.assets) {
    if (asset.status !== "ready")
      throw new LibraryError("LIBRARY_ASSET_NOT_READY", asset.id);
    const captured = await capture(root, asset.path);
    if (bytesHash(captured) !== asset.sha256)
      throw new LibraryError(
        "LIBRARY_DEPENDENCY_HASH_MISMATCH",
        `Asset ${asset.id} hash does not match its bytes.`,
      );
    if (asset.kind === "svg") {
      const checked = sanitizeSvg(captured.toString("utf8"), `${asset.id}-`);
      if (!checked.ok)
        throw new LibraryError(
          "LIBRARY_SVG_INVALID",
          `Asset ${asset.id} is not passive SVG.`,
        );
    }
    if (asset.kind === "png" && asset.layout) {
      const size = pngSize(captured.subarray(0, 24));
      if (
        !size ||
        size.width !== asset.layout.width ||
        size.height !== asset.layout.height
      )
        throw new LibraryError(
          "PNG_LAYOUT_SIZE_MISMATCH",
          `Asset ${asset.id} layout dimensions differ from its PNG.`,
        );
    }
    if (files.has(asset.path))
      throw new LibraryError(
        "LIBRARY_DEPENDENCY_PATH_CONFLICT",
        `Dependency path ${asset.path} is declared more than once.`,
      );
    files.set(asset.path, captured);
  }
  const recipes = await loadRecipes(root, {
    project: { recipes: catalog.recipes ?? [] },
    assets: { assets: catalog.assets },
  } as PlanSource);
  if (!recipes.ok) return recipes;
  for (const recipe of "recipes" in recipes.value
    ? (recipes.value.recipes ?? [])
    : [])
    for (const file of recipe.files) {
      const captured = await capture(root, file.path);
      if (bytesHash(captured) !== file.sha256)
        throw new LibraryError(
          "LIBRARY_DEPENDENCY_CHANGED",
          `Recipe ${file.path} changed during capture.`,
        );
      if (files.has(file.path))
        throw new LibraryError(
          "LIBRARY_DEPENDENCY_PATH_CONFLICT",
          `Dependency ${file.path} is declared more than once.`,
        );
      files.set(file.path, captured);
    }
  return {
    ok: true as const,
    value: { catalog, sha256: bytesHash(bytes), files },
    issues: [],
  };
};
export const inspectLibrary = async (
  path: string,
): Promise<
  Result<{
    catalog: LibraryCatalog;
    sha256: string;
    dependencies: Array<{ path: string; sha256: string }>;
  }>
> => {
  try {
    const captured = await captureCatalog(path);
    if (!captured.ok) return captured;
    return {
      ok: true,
      value: {
        catalog: captured.value.catalog,
        sha256: captured.value.sha256,
        dependencies: [...captured.value.files].map(([path, bytes]) => ({
          path,
          sha256: bytesHash(bytes),
        })),
      },
      issues: [],
    };
  } catch (error) {
    return failed(error);
  }
};

const setPointer = (target: unknown, pointer: string, value: unknown): void => {
  const parts = pointer.slice(1).split("/");
  let cursor = target as Record<string, unknown>;
  for (const part of parts.slice(0, -1)) {
    if (
      part === "__proto__" ||
      part === "constructor" ||
      part === "prototype" ||
      cursor === null ||
      typeof cursor !== "object" ||
      !Object.hasOwn(cursor, part)
    )
      throw new LibraryError(
        "LIBRARY_PARAMETER_POINTER_INVALID",
        `Pointer ${pointer} must address an existing template field.`,
      );
    cursor = cursor[part] as Record<string, unknown>;
  }
  const key = parts.at(-1) ?? "";
  if (
    ["__proto__", "constructor", "prototype"].includes(key) ||
    cursor === null ||
    typeof cursor !== "object" ||
    !Object.hasOwn(cursor, key)
  )
    throw new LibraryError(
      "LIBRARY_PARAMETER_POINTER_INVALID",
      `Pointer ${pointer} must address an existing template field.`,
    );
  cursor[key] = value;
};
const parameterize = (
  pattern: LibraryPattern,
  values: Record<string, unknown>,
): Scene => {
  if (
    Object.keys(values).some((key) => !Object.hasOwn(pattern.parameters, key))
  )
    throw new LibraryError(
      "LIBRARY_PARAMETER_UNKNOWN",
      "Parameters contain an undeclared key.",
    );
  const template = structuredClone(pattern.template);
  for (const [key, contract] of Object.entries(pattern.parameters)) {
    const value = values[key];
    if (
      contract.type === "number"
        ? typeof value !== "number" || !Number.isFinite(value)
        : typeof value !== "string"
    )
      throw new LibraryError(
        "LIBRARY_PARAMETER_INVALID",
        `Parameter ${key} requires ${contract.type}.`,
      );
    if (
      contract.type === "asset" &&
      (!IdSchema.safeParse(value).success ||
        (contract.choices && !contract.choices.includes(value as string)))
    )
      throw new LibraryError(
        "LIBRARY_PARAMETER_INVALID",
        `Asset ${key} must be one of the declared choices.`,
      );
    for (const pointer of contract.pointers)
      setPointer(template, pointer, value);
  }
  const parsed = SceneSchema.safeParse(template);
  if (!parsed.success)
    throw new LibraryError("LIBRARY_TEMPLATE_INVALID", parsed.error.message);
  return parsed.data;
};
const applyAttachments = (scene: Scene, receipt: LibraryImport): void => {
  const attachments = receipt.pattern.attachments ?? [];
  if (!attachments.length) return;
  if (scene.visual.type !== "composition")
    throw new LibraryError(
      "LIBRARY_ATTACHMENT_UNSUPPORTED",
      "Attachment requires composition image siblings.",
    );
  const layers = scene.visual.layers;
  for (const descriptor of attachments) {
    const target = layers.find((l) => l.id === descriptor.targetLayer),
      prop = layers.find((l) => l.id === descriptor.propLayer);
    if (
      target?.type !== "image" ||
      !prop ||
      prop.type !== "image" ||
      target === prop
    )
      throw new LibraryError(
        "LIBRARY_ATTACHMENT_UNSUPPORTED",
        "Attachment must name two distinct image layers.",
      );
    const parent = (layer: Layer) =>
      layers.find((l) => l.type === "group" && l.memberIds.includes(layer.id));
    const targetParent = parent(target),
      propParent = parent(prop);
    if (
      targetParent?.id !== propParent?.id ||
      (targetParent?.type === "group" &&
        targetParent.layout?.type &&
        targetParent.layout.type !== "absolute") ||
      (target.space ?? "overlay") !== (prop.space ?? "overlay") ||
      (target.parallax ?? 1) !== (prop.parallax ?? 1) ||
      target.rotationDeg !== 0 ||
      prop.rotationDeg !== 0 ||
      scene.beats.some(
        (b) =>
          [target.id, prop.id].includes(b.targetId) &&
          ["transform", "follow", "emphasize", "focus"].includes(b.action),
      )
    )
      throw new LibraryError(
        "LIBRARY_ATTACHMENT_UNSUPPORTED",
        "Use unrotated image siblings in one absolute parent/space with shared motion on their parent.",
      );
    const pointFor = (layer: typeof target, name: string) => {
      const asset = receipt.assets.find((a) => a.id === layer.assetId);
      if (asset?.status !== "ready" || asset.kind !== "png" || !asset.layout)
        throw new LibraryError(
          "LIBRARY_ATTACHMENT_LAYOUT_MISSING",
          `Image ${layer.id} needs PNG layout metadata.`,
        );
      const anchor = asset.layout.anchors?.[name];
      if (!anchor)
        throw new LibraryError(
          "LIBRARY_ANCHOR_UNKNOWN",
          `Asset ${asset.id} has no anchor ${name}.`,
        );
      if (layer.crop && !cropWithinImage(layer.crop, asset.layout))
        throw new LibraryError(
          "IMAGE_CROP_INVALID",
          `Crop ${layer.id} is outside source pixels.`,
        );
      const placement = imagePlacement({
        source: asset.layout,
        frame: layer.frame,
        fit: layer.fit,
        ...(layer.crop ? { crop: layer.crop } : {}),
        ...(layer.focalPoint ? { focalPoint: layer.focalPoint } : {}),
      });
      const mapped = placement.mapPoint(anchor);
      // A contain frame may include letterbox space outside the painted crop.
      // Check the source viewport as well as the frame visible after fitting.
      if (
        anchor.x < placement.crop.x ||
        anchor.x > placement.crop.x + placement.crop.width ||
        anchor.y < placement.crop.y ||
        anchor.y > placement.crop.y + placement.crop.height ||
        mapped.x < 0 ||
        mapped.x > layer.frame.width ||
        mapped.y < 0 ||
        mapped.y > layer.frame.height
      )
        throw new LibraryError(
          "LIBRARY_ANCHOR_CLIPPED",
          `Anchor ${name} is clipped by ${layer.id}.`,
        );
      return mapped;
    };
    const targetPoint = pointFor(target, descriptor.targetAnchor),
      propPoint = pointFor(prop, descriptor.propAnchor);
    prop.frame.x =
      target.frame.x +
      targetPoint.x -
      propPoint.x +
      (descriptor.offset?.x ?? 0);
    prop.frame.y =
      target.frame.y +
      targetPoint.y -
      propPoint.y +
      (descriptor.offset?.y ?? 0);
  }
};

export interface StageLibraryOptions {
  root: string;
  from?: string;
  pattern?: string;
  version?: string;
  instance: string;
  scene?: string;
  params: Record<string, unknown>;
  update?: boolean;
}
export interface StageLibraryResult {
  staging: string;
  sourceRevision: string;
  receipt: LibraryImport;
  files: string[];
}
export const stageLibrary = async (
  options: StageLibraryOptions,
): Promise<Result<StageLibraryResult>> => {
  let staging: string | undefined;
  try {
    if (
      !IdSchema.safeParse(options.instance).success ||
      (options.scene && !IdSchema.safeParse(options.scene).success)
    )
      throw new LibraryError(
        "LIBRARY_ID_INVALID",
        "Instance and scene require lowercase kebab-case IDs.",
      );
    const loaded = await loadPlanProject(options.root);
    if (!loaded.ok) return loaded;
    const root = loaded.value.root,
      source = loaded.value.source;
    const imports = source.project.libraryImports ?? [];
    const existing = imports.find((i) => i.instance === options.instance);
    if (options.update && !options.from)
      throw new LibraryError(
        "LIBRARY_UPDATE_REQUIRES_CATALOG",
        "Explicit update requires --from and --version.",
      );
    if (options.from && existing && !options.update)
      throw new LibraryError(
        "LIBRARY_INSTANCE_EXISTS",
        "Instance already exists. Use --update for an explicit catalog revision or omit --from for pinned regeneration.",
      );
    if (!options.from && !existing)
      throw new LibraryError(
        "LIBRARY_INSTANCE_UNKNOWN",
        "No pinned instance exists. Import with --from, --pattern, --version and --scene.",
      );
    if (existing) {
      const current = source.scenes.scenes.find(
        (s) => s.id === existing.sceneId,
      );
      if (!current || hashValue(current) !== existing.sceneSha256)
        throw new LibraryError(
          "LIBRARY_LOCAL_EDIT_CONFLICT",
          `Scene ${existing.sceneId} contains ordinary local edits.`,
          "Keep those edits, or stage a new instance into a separate scene and review the replacement.",
        );
      if (options.scene && options.scene !== existing.sceneId)
        throw new LibraryError(
          "LIBRARY_SCENE_CONFLICT",
          "Pinned instance cannot silently move to another scene.",
        );
    }
    const files = new Map<string, Buffer>();
    let receipt: LibraryImport;
    if (options.from) {
      if (
        !options.pattern ||
        !options.version ||
        !VersionSchema.safeParse(options.version).success ||
        (!options.scene && !existing)
      )
        throw new LibraryError(
          "LIBRARY_SELECTION_REQUIRED",
          "Catalog import requires --pattern, exact --version and --scene.",
        );
      const captured = await captureCatalog(options.from);
      if (!captured.ok) return captured;
      const { catalog, sha256 } = captured.value;
      const pattern = catalog.patterns.find(
        (p) => p.id === options.pattern && p.version === options.version,
      );
      if (!pattern)
        throw new LibraryError(
          "LIBRARY_PATTERN_UNKNOWN",
          `No pattern ${options.pattern}@${options.version}.`,
        );
      const assets = catalog.assets.map((asset) => {
        if (asset.status !== "ready")
          throw new LibraryError("LIBRARY_ASSET_NOT_READY", asset.id);
        const path = `assets/library/${options.instance}/${asset.sha256}/${basename(asset.path)}`;
        const bytes = captured.value.files.get(asset.path);
        if (!bytes)
          throw new LibraryError("LIBRARY_DEPENDENCY_MISSING", asset.path);
        files.set(path, bytes);
        return { ...asset, id: `${options.instance}-${asset.id}`, path };
      });
      const recipes = (catalog.recipes ?? []).map((recipe) => {
        const path = `recipes/${options.instance}-${recipe.id}`;
        for (const [oldPath, bytes] of captured.value.files)
          if (oldPath.startsWith(`${recipe.path}/`))
            files.set(
              `${path}/${oldPath.slice(recipe.path.length + 1)}`,
              bytes,
            );
        return { ...recipe, path };
      });
      receipt = {
        instance: options.instance,
        sceneId: options.scene ?? existing?.sceneId ?? "",
        catalog: {
          id: catalog.id,
          version: catalog.version,
          sha256,
          provenance: catalog.provenance,
        },
        pattern,
        patternSha256: hashValue(pattern),
        values: options.params as Record<string, string | number>,
        assets,
        assetDependencies: assets.flatMap((a) =>
          a.status === "ready"
            ? [{ id: a.id, path: a.path, sha256: a.sha256 }]
            : [],
        ),
        recipes,
        recipeDependencies: [...files]
          .filter(([p]) => p.startsWith("recipes/"))
          .map(([path, bytes]) => ({
            id: recipes.find((r) => path.startsWith(`${r.path}/`))?.id ?? "",
            path,
            sha256: bytesHash(bytes),
          })),
        sceneSha256: "0".repeat(64),
        disposition: existing ? "update" : "import",
      };
    } else {
      if (!existing)
        throw new LibraryError(
          "LIBRARY_INSTANCE_UNKNOWN",
          "No pinned instance exists.",
        );
      receipt = {
        ...structuredClone(existing),
        values: options.params as Record<string, string | number>,
        disposition: "regenerate",
      };
      if (
        (options.pattern && options.pattern !== receipt.pattern.id) ||
        (options.version && options.version !== receipt.pattern.version)
      )
        throw new LibraryError(
          "LIBRARY_PIN_CONFLICT",
          "Pinned regeneration cannot select a different pattern/version; use explicit catalog update.",
        );
      for (const dependency of [
        ...receipt.assetDependencies,
        ...receipt.recipeDependencies,
      ]) {
        const bytes = await capture(root, dependency.path);
        if (bytesHash(bytes) !== dependency.sha256)
          throw new LibraryError(
            "LIBRARY_PIN_HASH_MISMATCH",
            `Pinned dependency ${dependency.path} changed.`,
            "Restore the pinned dependency or stage an explicit catalog update.",
          );
        files.set(dependency.path, bytes);
      }
    }
    if (hashValue(receipt.pattern) !== receipt.patternSha256)
      throw new LibraryError(
        "LIBRARY_PIN_HASH_MISMATCH",
        "Pinned pattern hash is invalid.",
      );
    const scene = parameterize(receipt.pattern, options.params);
    scene.id = receipt.sceneId;
    // Rebind catalog asset IDs to this instance; receipt values retain catalog IDs.
    const remap = (value: unknown): void => {
      if (Array.isArray(value)) for (const item of value) remap(item);
      else if (value && typeof value === "object")
        for (const [key, nested] of Object.entries(value)) {
          if (key === "assetId" && typeof nested === "string")
            (value as Record<string, unknown>)[key] =
              `${receipt.instance}-${nested}`;
          else remap(nested);
        }
    };
    remap(scene.visual);
    if (scene.visual.type === "composition")
      for (const layer of scene.visual.layers) {
        if (layer.type !== "image" || layer.focalPoint) continue;
        const asset = receipt.assets.find((a) => a.id === layer.assetId);
        if (
          asset?.status !== "ready" ||
          asset.kind !== "png" ||
          !asset.layout?.focalPoint
        )
          continue;
        const crop = layer.crop ?? {
          x: 0,
          y: 0,
          width: asset.layout.width,
          height: asset.layout.height,
        };
        const focal = {
          x: (asset.layout.focalPoint.x - crop.x) / crop.width,
          y: (asset.layout.focalPoint.y - crop.y) / crop.height,
        };
        if (![focal.x, focal.y].every((v) => v >= 0 && v <= 1))
          throw new LibraryError(
            "LIBRARY_FOCAL_POINT_CLIPPED",
            `Image ${layer.id} crop excludes the declared focal point.`,
          );
        layer.focalPoint = focal;
      }
    applyAttachments(scene, receipt);
    receipt.sceneSha256 = hashValue(scene);
    const previousScene = source.scenes.scenes.find(
      (s) => s.id === receipt.sceneId,
    );
    if (previousScene && !existing)
      throw new LibraryError(
        "LIBRARY_SCENE_EXISTS",
        `Scene ${receipt.sceneId} already exists. Use a new scene ID.`,
      );
    const scenes = {
      ...source.scenes,
      scenes: previousScene
        ? source.scenes.scenes.map((s) => (s.id === scene.id ? scene : s))
        : [...source.scenes.scenes, scene],
    };
    const assetIds = new Set(receipt.assets.map((a) => a.id));
    for (const asset of source.assets.assets)
      if (
        assetIds.has(asset.id) &&
        !existing?.assets.some((a) => a.id === asset.id)
      )
        throw new LibraryError(
          "LIBRARY_ASSET_ID_CONFLICT",
          `Asset ${asset.id} already belongs to the project.`,
        );
    const assets = {
      ...source.assets,
      assets: [
        ...source.assets.assets.filter((a) => !assetIds.has(a.id)),
        ...receipt.assets,
      ],
    };
    const recipes = [
      ...(source.project.recipes ?? []).filter(
        (r) => !existing?.recipes.some((old) => old.id === r.id),
      ),
      ...receipt.recipes,
    ];
    if (new Set(recipes.map((r) => r.id)).size !== recipes.length)
      throw new LibraryError(
        "LIBRARY_RECIPE_ID_CONFLICT",
        "Recipe ID already belongs to another import/project.",
      );
    const project = {
      ...source.project,
      libraryImports: [
        ...imports.filter((i) => i.instance !== receipt.instance),
        receipt,
      ],
      ...(recipes.length ? { recipes } : {}),
    };
    for (const [path, value] of [
      ["naraframe.json", project],
      ["scenes.json", scenes],
      ["assets/manifest.json", assets],
    ] as const)
      files.set(path, Buffer.from(`${JSON.stringify(value, null, 2)}\n`));
    staging = await mkdtemp(join(tmpdir(), "naraframe-library-stage-"));
    for (const [path, bytes] of files) {
      await mkdir(dirname(join(staging, path)), { recursive: true });
      await writeFile(join(staging, path), bytes);
    }
    const candidate = await mkdtemp(join(tmpdir(), "naraframe-library-check-"));
    try {
      await linkTree(root, candidate);
      for (const [path, bytes] of files) {
        await mkdir(dirname(join(candidate, path)), { recursive: true });
        await rm(join(candidate, path), { force: true });
        await writeFile(join(candidate, path), bytes);
      }
      const valid = await loadPlanProject(candidate);
      if (!valid.ok) {
        await rm(staging, { recursive: true, force: true });
        staging = undefined;
        return valid;
      }
    } finally {
      await rm(candidate, { recursive: true, force: true });
    }
    return {
      ok: true,
      value: {
        staging,
        sourceRevision: hashValue(source),
        receipt,
        files: [...files.keys()].sort(),
      },
      issues: [],
    };
  } catch (error) {
    if (staging) await rm(staging, { recursive: true, force: true });
    return failed(error);
  }
};
