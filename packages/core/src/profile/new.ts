import {
  copyFile,
  mkdir,
  readdir,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { contrastRatio } from "../compiler/contrast.js";
import type { Issue, Result } from "../model/issue.js";
import { buildProfileLock } from "../project/create-project.js";

export interface NewProfileOptions {
  /** Folder of the profile to start from (a built-in or a local profile). */
  baseDirectory: string;
  /** Folder to create. It must not exist, or be empty. */
  destination: string;
  /** The series name, as the owner writes it. */
  name: string;
  background: string;
  accent: string;
  text?: string;
  language?: string;
}

export interface NewProfile {
  id: string;
  directory: string;
  palette: {
    background: string;
    surface: string;
    text: string;
    accent: string;
  };
  /** What the engine worked out so the colours stay readable together. */
  derived: string[];
}

const MINIMUM_TEXT_CONTRAST = 4.5;
const MINIMUM_ACCENT_CONTRAST = 3;

const fail = (
  code: string,
  message: string,
  suggestion: string,
): Result<never> => ({
  ok: false,
  issues: [
    {
      code,
      severity: "error",
      responsible: "user",
      artifact: "profile",
      path: "/",
      message,
      suggestion,
    } satisfies Issue,
  ],
});

/** A series name as a lowercase kebab-case id, accents folded away. */
export const seriesIdFromName = (name: string): string =>
  name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const normalizeColor = (value: string): string | null => {
  const match = /^#?([0-9a-fA-F]{6})$/.exec(value.trim());
  return match ? `#${(match[1] as string).toUpperCase()}` : null;
};

const channelsOf = (hex: string): number[] =>
  [1, 3, 5].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16));

const mix = (from: string, toward: string, amount: number): string => {
  const a = channelsOf(from);
  const b = channelsOf(toward);
  return `#${a
    .map((value, index) =>
      Math.round(value + ((b[index] ?? value) - value) * amount)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")
    .toUpperCase()}`;
};

const isDark = (hex: string): boolean =>
  contrastRatio(hex, "#000000") < contrastRatio(hex, "#FFFFFF");

const replaceColors = (
  value: unknown,
  map: ReadonlyMap<string, string>,
): unknown => {
  if (typeof value === "string") return map.get(value.toUpperCase()) ?? value;
  if (Array.isArray(value))
    return value.map((item) => replaceColors(item, map));
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        replaceColors(item, map),
      ]),
    );
  return value;
};

const directionFor = (
  name: string,
  palette: NewProfile["palette"],
  requireSourcing: boolean,
  language: string | undefined,
): string =>
  [
    `# ${name}`,
    "",
    `${name} is a series of short vertical explainer videos. Replace this sentence with who the series is for and what each episode teaches.`,
    "",
    `- Language: ${language ? `${language}.` : "say which language the narration and on-screen text use."}`,
    `- Look: ${palette.background} background, ${palette.accent} accent for the one thing that matters on screen, ${palette.text} text, ${palette.surface} panels.`,
    `- Sourcing: ${
      requireSourcing
        ? "every factual claim needs a source the owner has checked."
        : "name a source for specific facts when there is one, and ask the owner when unsure."
    }`,
    "- Voice and pace: describe how the narration sounds and how fast the episodes move.",
    "",
  ].join("\n");

const copyAssets = async (
  baseDirectory: string,
  destination: string,
  paths: readonly string[],
): Promise<void> => {
  for (const path of paths) {
    const target = join(destination, path);
    await mkdir(dirname(target), { recursive: true });
    await copyFile(join(baseDirectory, path), target);
  }
};

/**
 * Creates a series profile from an existing one: a name, a background and an
 * accent colour (and optionally a text colour). The engine picks the panel and
 * stroke colours and checks the contrast, writes a short direction.md, then
 * reads the result exactly as `profile inspect` would.
 */
export const createSeriesProfile = async (
  options: NewProfileOptions,
): Promise<Result<NewProfile>> => {
  const name = options.name.trim();
  const id = seriesIdFromName(name);
  if (!id)
    return fail(
      "PROFILE_NAME_INVALID",
      "The series name needs at least one letter or number.",
      'Pass the series name with --name, for example --name "Weekly Science".',
    );
  const background = normalizeColor(options.background);
  const accent = normalizeColor(options.accent);
  const givenText =
    options.text === undefined ? undefined : normalizeColor(options.text);
  if (!background || !accent || (options.text !== undefined && !givenText))
    return fail(
      "PROFILE_COLOUR_INVALID",
      "Colours must be six-digit hex values such as #0E1B2A.",
      "Check --background, --accent and --text.",
    );

  const destination = resolve(options.destination);
  let existing: string[] = [];
  try {
    existing = await readdir(destination);
  } catch {
    existing = [];
  }
  if (existing.length > 0)
    return fail(
      "PROFILE_TARGET_EXISTS",
      "The target folder already has files in it.",
      "Choose a new folder name for the series profile.",
    );

  let source: Record<string, unknown>;
  try {
    source = JSON.parse(
      await readFile(
        join(resolve(options.baseDirectory), "profile.json"),
        "utf8",
      ),
    ) as Record<string, unknown>;
  } catch {
    return fail(
      "PROFILE_SOURCE_MISSING",
      "The profile to start from could not be read.",
      "Run profile list to see the built-in profiles.",
    );
  }
  const render = source.render as
    | { palette?: Record<string, string> }
    | undefined;
  const previous = render?.palette;
  if (!previous)
    return fail(
      "PROFILE_SOURCE_MISSING",
      "The profile to start from has no palette.",
      "Start from a built-in profile.",
    );

  const derived: string[] = [];
  let text: string | undefined = givenText ?? undefined;
  if (text === undefined) {
    const options2 = ["#F2EFE6", "#15130F", "#FFFFFF", "#000000"];
    text = options2
      .slice(0, 2)
      .sort(
        (a, b) => contrastRatio(b, background) - contrastRatio(a, background),
      )[0] as string;
    if (contrastRatio(text, background) < MINIMUM_TEXT_CONTRAST)
      text = options2
        .slice(2)
        .sort(
          (a, b) => contrastRatio(b, background) - contrastRatio(a, background),
        )[0] as string;
    derived.push(`text colour ${text}, chosen to read on the background`);
  }
  if (contrastRatio(text, background) < MINIMUM_TEXT_CONTRAST)
    return fail(
      "PROFILE_COLOURS_TOO_CLOSE",
      `The text and background colours are too close to read (contrast ${contrastRatio(text, background).toFixed(1)}, needs ${MINIMUM_TEXT_CONTRAST}).`,
      "Pick a lighter text on a dark background, or a darker text on a light one.",
    );
  if (contrastRatio(accent, background) < MINIMUM_ACCENT_CONTRAST)
    return fail(
      "PROFILE_COLOURS_TOO_CLOSE",
      `The accent colour is too close to the background to stand out (contrast ${contrastRatio(accent, background).toFixed(1)}, needs ${MINIMUM_ACCENT_CONTRAST}).`,
      "Pick a brighter or darker accent.",
    );

  let surface: string;
  if (isDark(background)) {
    surface = mix(text, background, 0.05);
  } else {
    surface = background;
    for (const amount of [0.07, 0.04, 0.02]) {
      surface = mix(background, text, amount);
      if (contrastRatio(text, surface) >= MINIMUM_TEXT_CONTRAST) break;
    }
  }
  derived.push(
    `panel and outline colour ${surface}, set apart from the background and readable with the text colour`,
  );

  const palette = { background, surface, text, accent };
  const map = new Map<string, string>(
    (["background", "surface", "text", "accent"] as const).flatMap((slot) =>
      previous[slot]
        ? [[previous[slot].toUpperCase(), palette[slot]] as const]
        : [],
    ),
  );
  const nextRender = replaceColors(source.render, map) as Record<
    string,
    unknown
  >;
  const brand = source.brand as Record<string, unknown> | undefined;
  const next = {
    ...source,
    id,
    version: "1.0.0",
    render: nextRender,
    ...(brand ? { brand: { ...brand, name } } : {}),
  };
  (next.render as { palette: unknown }).palette = palette;

  const requireSourcing = Boolean(
    (source.production as { requireSourcing?: boolean } | undefined)
      ?.requireSourcing,
  );
  const assetPaths = (
    (source.assets as Array<{ path: string }> | undefined) ?? []
  ).map((asset) => asset.path);
  let created = existing.length === 0;
  try {
    await mkdir(destination, { recursive: true });
    created = true;
    await writeFile(
      join(destination, "profile.json"),
      `${JSON.stringify(next, null, 2)}\n`,
    );
    await writeFile(
      join(destination, "direction.md"),
      directionFor(
        name,
        palette,
        requireSourcing,
        options.language?.trim() || undefined,
      ),
    );
    await copyAssets(resolve(options.baseDirectory), destination, assetPaths);
    const built = await buildProfileLock(destination, {
      kind: "local",
      identity: id,
    });
    if (!built.ok) {
      await rm(destination, { recursive: true, force: true });
      return { ok: false, issues: built.issues };
    }
  } catch (error) {
    if (created) await rm(destination, { recursive: true, force: true });
    throw error;
  }
  return {
    ok: true,
    value: { id, directory: destination, palette, derived },
    issues: [],
  };
};
