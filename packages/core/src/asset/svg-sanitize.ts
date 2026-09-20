import type { Issue, Result } from "../model/issue.js";

/**
 * Imported SVG is passive data, never a program.
 *
 * An illustration arrives as markup the project did not write, so the only
 * safe reading of it is: shapes, paint and geometry, and nothing that can
 * run, fetch, or reach outside the asset. Anything that could do those
 * things is rejected with the element or attribute that caused it, rather
 * than stripped quietly — an author who asked for a script in their artwork
 * should be told their artwork is not what they think it is.
 *
 * Local `id`s are rewritten with the asset's own prefix so two illustrations
 * on the same scene cannot capture each other's gradients or clip paths.
 */

/** Elements that draw, group, or define paint. Everything else is refused. */
const ALLOWED_ELEMENTS = new Set([
  "svg",
  "g",
  "defs",
  "title",
  "desc",
  "path",
  "rect",
  "circle",
  "ellipse",
  "line",
  "polyline",
  "polygon",
  "linearGradient",
  "radialGradient",
  "stop",
  "clipPath",
  "mask",
  "use",
  "symbol",
  "text",
  "tspan",
]);

/** Elements refused by name, so the message can say what they would do. */
const NAMED_REFUSALS: Record<string, string> = {
  script: "runs code",
  foreignObject: "embeds arbitrary HTML",
  animate: "animates itself outside the project timeline",
  animateTransform: "animates itself outside the project timeline",
  animateMotion: "animates itself outside the project timeline",
  set: "animates itself outside the project timeline",
  image: "loads another file",
  iframe: "embeds another document",
  audio: "plays media",
  video: "plays media",
  style: "carries stylesheet rules that can reach outside the asset",
  filter: "declares a filter this renderer does not evaluate",
  feImage: "loads another file",
};

const ALLOWED_ATTRIBUTES = new Set([
  "id",
  "class",
  "d",
  "x",
  "y",
  "x1",
  "y1",
  "x2",
  "y2",
  "cx",
  "cy",
  "r",
  "rx",
  "ry",
  "width",
  "height",
  "points",
  "viewBox",
  "preserveAspectRatio",
  "transform",
  "gradientUnits",
  "gradientTransform",
  "spreadMethod",
  "offset",
  "stop-color",
  "stop-opacity",
  "fill",
  "fill-rule",
  "fill-opacity",
  "stroke",
  "stroke-width",
  "stroke-linecap",
  "stroke-linejoin",
  "stroke-dasharray",
  "stroke-dashoffset",
  "stroke-opacity",
  "stroke-miterlimit",
  "opacity",
  "clip-path",
  "clip-rule",
  "mask",
  "maskUnits",
  "clipPathUnits",
  "font-family",
  "font-size",
  "font-weight",
  "letter-spacing",
  "text-anchor",
  "dominant-baseline",
  "xmlns",
  "version",
  "href",
  "xlink:href",
]);

/** Attributes that may carry a reference to another document. */
const URL_ATTRIBUTES = new Set([
  "href",
  "xlink:href",
  "fill",
  "stroke",
  "clip-path",
  "mask",
]);

const issue = (code: string, message: string, suggestion: string): Issue => ({
  code,
  severity: "error",
  responsible: "user",
  artifact: "assets/manifest.json",
  path: "/",
  message,
  suggestion,
});

export interface SanitizedSvg {
  /** Inner markup, without the outer `<svg>` element. */
  body: string;
  /** The artwork's own coordinate box. */
  viewBox: { minX: number; minY: number; width: number; height: number };
  /** IDs the artwork defines, after prefixing. */
  ids: string[];
}

const TAG = /<\s*(\/?)([A-Za-z_][\w:.-]*)((?:[^>"']|"[^"]*"|'[^']*')*)>/g;
const ATTRIBUTE = /([A-Za-z_:][\w:.-]*)\s*=\s*("([^"]*)"|'([^']*)')/g;

const parseViewBox = (
  value: string | undefined,
): SanitizedSvg["viewBox"] | null => {
  const parts = (value ?? "")
    .trim()
    .split(/[\s,]+/)
    .map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isFinite(part))) {
    return null;
  }
  const [minX, minY, width, height] = parts as [number, number, number, number];
  return width > 0 && height > 0 ? { minX, minY, width, height } : null;
};

/**
 * Reads the asset and returns markup safe to inline, or the reasons it is not.
 * `idPrefix` must be stable for the asset so the same file always yields the
 * same ids: render keys are derived from this output.
 */
export const sanitizeSvg = (
  source: string,
  idPrefix: string,
): Result<SanitizedSvg> => {
  const issues: Issue[] = [];
  const add = (code: string, message: string, suggestion: string) => {
    if (issues.length < 20) issues.push(issue(code, message, suggestion));
  };

  if (/<!ENTITY/i.test(source) || /<!DOCTYPE[^>]*\[/i.test(source)) {
    add(
      "SVG_UNSAFE",
      "The artwork declares an internal DTD or entity, which can pull in other files.",
      "Export the illustration without a DOCTYPE or entity declarations.",
    );
  }

  const declaredIds = new Set<string>();
  for (const match of source.matchAll(/\sid\s*=\s*["']([^"']+)["']/g)) {
    if (match[1]) declaredIds.add(match[1]);
  }

  let viewBox: SanitizedSvg["viewBox"] | null = null;
  let sawSvg = false;
  const body: string[] = [];

  for (const tag of source.matchAll(TAG)) {
    const closing = tag[1] === "/";
    const rawName = tag[2] ?? "";
    const name = rawName.includes(":")
      ? (rawName.split(":").pop() ?? rawName)
      : rawName;
    const attributeSource = tag[3] ?? "";
    const selfClosing = /\/\s*$/.test(attributeSource);

    const refusal = NAMED_REFUSALS[name];
    if (refusal) {
      add(
        "SVG_UNSAFE",
        `The artwork contains <${name}>, which ${refusal}.`,
        `Remove every <${name}> from the illustration and export it again.`,
      );
      continue;
    }
    if (!ALLOWED_ELEMENTS.has(name)) {
      add(
        "SVG_UNSUPPORTED_ELEMENT",
        `The artwork contains <${name}>, which this renderer does not draw.`,
        "Flatten that element to paths or shapes before importing.",
      );
      continue;
    }

    if (name === "svg") {
      if (closing) continue;
      if (sawSvg) {
        add(
          "SVG_UNSUPPORTED_ELEMENT",
          "The artwork nests a second <svg> root.",
          "Export one illustration per asset.",
        );
        continue;
      }
      sawSvg = true;
      const attributes = new Map<string, string>();
      for (const attribute of attributeSource.matchAll(ATTRIBUTE)) {
        attributes.set(
          (attribute[1] ?? "").toLowerCase(),
          attribute[3] ?? attribute[4] ?? "",
        );
      }
      viewBox =
        parseViewBox(attributes.get("viewbox")) ??
        (attributes.has("width") && attributes.has("height")
          ? parseViewBox(
              `0 0 ${Number.parseFloat(attributes.get("width") ?? "")} ${Number.parseFloat(attributes.get("height") ?? "")}`,
            )
          : null);
      if (!viewBox) {
        add(
          "SVG_VIEWBOX_MISSING",
          "The artwork has no usable viewBox, so it cannot be placed in a frame.",
          "Add a viewBox, or a numeric width and height, to the root <svg>.",
        );
      }
      continue;
    }

    if (closing) {
      body.push(`</${name}>`);
      continue;
    }

    const kept: string[] = [];
    for (const attribute of attributeSource.matchAll(ATTRIBUTE)) {
      const attributeName = attribute[1] ?? "";
      const lower = attributeName.toLowerCase();
      const value = attribute[3] ?? attribute[4] ?? "";

      if (lower.startsWith("on")) {
        add(
          "SVG_UNSAFE",
          `The artwork carries the event handler ${attributeName}, which runs code.`,
          "Remove every on* attribute from the illustration.",
        );
        continue;
      }
      if (lower === "style") {
        add(
          "SVG_UNSAFE",
          "The artwork carries a style attribute, which can reference other files.",
          "Move the paint onto explicit fill/stroke attributes.",
        );
        continue;
      }
      if (
        !ALLOWED_ATTRIBUTES.has(lower) &&
        !ALLOWED_ATTRIBUTES.has(attributeName)
      ) {
        // Unknown attributes are dropped rather than refused: they cannot
        // paint, and an exporter's metadata should not fail an import.
        continue;
      }
      if (URL_ATTRIBUTES.has(lower)) {
        const reference = value.trim();
        // Paint reaches a definition only through url(#id). A bare `#hex` in
        // fill or stroke is a colour, not a reference, and must stay one.
        const local = /^url\(\s*['"]?#([^)'"\s]+)['"]?\s*\)$/.exec(reference);
        const fragment =
          lower === "href" || lower === "xlink:href"
            ? /^#(.+)$/.exec(reference)
            : null;
        const target = local?.[1] ?? fragment?.[1];
        if (target) {
          if (!declaredIds.has(target)) {
            add(
              "SVG_REFERENCE_UNRESOLVED",
              `The artwork paints with #${target}, which it does not define.`,
              "Export the illustration with its gradients and clip paths included.",
            );
            continue;
          }
          kept.push(
            `${attributeName}="${local ? `url(#${idPrefix}${target})` : `#${idPrefix}${target}`}"`,
          );
          continue;
        }
        if (/^\s*(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(reference)) {
          add(
            "SVG_EXTERNAL_REFERENCE",
            `The artwork points at ${reference.slice(0, 60)}, outside the asset.`,
            "Inline the referenced content or remove the reference.",
          );
          continue;
        }
        if (lower.endsWith("href")) {
          add(
            "SVG_EXTERNAL_REFERENCE",
            `The artwork points at ${reference.slice(0, 60)}, outside the asset.`,
            "Reference only ids defined inside the same illustration.",
          );
          continue;
        }
      }
      if (lower === "id") {
        kept.push(`id="${idPrefix}${value}"`);
        continue;
      }
      kept.push(`${attributeName}="${value}"`);
    }

    body.push(
      `<${name}${kept.length ? ` ${kept.join(" ")}` : ""}${selfClosing ? "/" : ""}>`,
    );
  }

  if (!sawSvg) {
    add(
      "SVG_ROOT_MISSING",
      "The file has no <svg> root element.",
      "Supply a real SVG illustration.",
    );
  }

  if (issues.length > 0) return { ok: false, issues };
  if (!viewBox) {
    return {
      ok: false,
      issues: [
        issue(
          "SVG_VIEWBOX_MISSING",
          "The artwork has no usable viewBox.",
          "Add a viewBox to the root <svg>.",
        ),
      ],
    };
  }

  return {
    ok: true,
    value: {
      body: body.join(""),
      viewBox,
      ids: [...declaredIds].map((id) => `${idPrefix}${id}`).sort(),
    },
    issues: [],
  };
};
