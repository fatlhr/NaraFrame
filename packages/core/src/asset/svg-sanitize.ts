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
  // Relative offsets place stacked tspans; dropping them collapses a
  // multi-line label into one overlapping glyph.
  "dx",
  "dy",
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

/**
 * Paint and text attributes that inherit. The root <svg> may carry these, and
 * dropping them silently repaints the whole illustration, so they are moved
 * onto a wrapping group instead.
 */
const INHERITED_ATTRIBUTES = new Set([
  // Root compositing applies to the whole illustration, on the wrapper.
  "clip-path",
  "mask",
  "transform",
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
  "clip-rule",
  "font-family",
  "font-size",
  "font-weight",
  "letter-spacing",
  "text-anchor",
  "dominant-baseline",
]);

/** Elements whose character data is drawn and must therefore survive. */
const TEXT_BEARING = new Set(["text", "tspan", "title", "desc"]);

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

/** Character data is re-emitted as markup, so it is escaped on the way out. */
const escapeText = (value: string): string =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const escapeAttribute = (value: string): string =>
  escapeText(value).replace(/"/g, "&quot;");

/** The five entities XML defines without a DTD. Anything else needs one. */
const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
};

const ENTITY = /&(#x[0-9a-fA-F]+|#[0-9]+|[A-Za-z][A-Za-z0-9]*);/g;

/**
 * Turns character data into the characters it means.
 *
 * `A &amp; B` is one ampersand, not the five letters `&amp;`. Escaping the
 * raw source again would put those letters on screen, so the references are
 * resolved first and the result is escaped once. A reference this parser
 * does not define would need a DTD, which the artwork is not allowed to
 * carry, so it is refused rather than printed literally.
 */
const decodeCharacterData = (
  raw: string,
  onUnsupported: (reference: string) => void,
): string =>
  raw.replace(ENTITY, (match, reference: string) => {
    if (reference.startsWith("#")) {
      const code = reference.startsWith("#x")
        ? Number.parseInt(reference.slice(2), 16)
        : Number.parseInt(reference.slice(1), 10);
      // Only characters that can actually be drawn; control codes cannot.
      const printable =
        Number.isFinite(code) &&
        code >= 0x20 &&
        code <= 0x10ffff &&
        !(code >= 0xd800 && code <= 0xdfff);
      if (!printable) {
        onUnsupported(match);
        return "";
      }
      return String.fromCodePoint(code);
    }
    const named = NAMED_ENTITIES[reference];
    if (named === undefined) {
      onUnsupported(match);
      return "";
    }
    return named;
  });
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

interface AttributeContext {
  idPrefix: string;
  declaredIds: Set<string>;
  add: (code: string, message: string, suggestion: string) => void;
}

/**
 * Checks and rewrites one element's attributes.
 *
 * The root `<svg>` and every child go through this, so a reference is
 * validated and namespaced the same way wherever it appears. Handling the
 * root separately is what previously let `fill="url(https://…)"` through on
 * the root and left a root `url(#g)` pointing at an id that had been
 * renamed.
 */
const sanitizeAttributes = (
  attributeSource: string,
  context: AttributeContext,
  only?: (lowerName: string) => boolean,
): string[] => {
  const { idPrefix, declaredIds, add } = context;
  const kept: string[] = [];

  for (const attribute of attributeSource.matchAll(ATTRIBUTE)) {
    const attributeName = attribute[1] ?? "";
    const lower = attributeName.toLowerCase();
    const value = decodeCharacterData(
      attribute[3] ?? attribute[4] ?? "",
      (reference) =>
        add(
          "SVG_UNSUPPORTED_ENTITY",
          `The attribute ${attributeName} uses unsupported entity ${reference}.`,
          "Use literal characters or standard XML character references.",
        ),
    );

    // The dangerous forms are judged before `only` narrows what is kept, so
    // a handler on the root is refused rather than quietly filtered away.
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
      // CSS escapes/comments can spell a URL without a literal `url(`.
      // This passive subset accepts plain local references only.
      if (/[\\\\]|\/\*|\*\//.test(reference)) {
        add(
          "SVG_EXTERNAL_REFERENCE",
          "CSS escapes or comments are not allowed in SVG paint references.",
          "Use a plain colour or url(#id) referencing a local definition.",
        );
        continue;
      }
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
        if (!only || only(lower)) {
          kept.push(
            `${attributeName}="${escapeAttribute(local ? `url(#${idPrefix}${target})` : `#${idPrefix}${target}`)}"`,
          );
        }
        continue;
      }
      // A url(...) that is not a local fragment points outside the asset,
      // whatever scheme it hides: url(https://…), url(//…), url(data:…).
      if (/^url\(/i.test(reference)) {
        add(
          "SVG_EXTERNAL_REFERENCE",
          `The artwork paints from ${reference.slice(0, 60)}, outside the asset.`,
          "Inline the gradient, pattern or clip path into the illustration.",
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

    if (only && !only(lower)) continue;
    if (lower === "id") {
      kept.push(`id="${escapeAttribute(idPrefix + value)}"`);
      continue;
    }
    kept.push(`${attributeName}="${escapeAttribute(value)}"`);
  }

  return kept;
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

  // Comments are never drawn, so they are removed: an exporter's notes must
  // not leak into the body as visible characters. A CDATA section is the
  // opposite — it is the artwork's own wording, written literally — so its
  // content is kept and escaped into ordinary character data.
  const markup = source
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, (_match, content: string) =>
      escapeText(content),
    );

  const declaredIds = new Set<string>();
  for (const match of markup.matchAll(/\sid\s*=\s*["']([^"']+)["']/g)) {
    if (match[1]) {
      declaredIds.add(
        decodeCharacterData(match[1], (reference) =>
          add(
            "SVG_UNSUPPORTED_ENTITY",
            `Unsupported ID entity ${reference}.`,
            "Use a literal local ID.",
          ),
        ),
      );
    }
  }

  let viewBox: SanitizedSvg["viewBox"] | null = null;
  let sawSvg = false;
  let rootPaint = "";
  let textDepth = 0;
  let cursor = 0;
  const body: string[] = [];

  for (const tag of markup.matchAll(TAG)) {
    // Character data between tags. Inside text-bearing elements it is the
    // artwork's wording and must survive; elsewhere it is layout whitespace.
    const between = markup.slice(cursor, tag.index);
    cursor = tag.index + tag[0].length;
    if (textDepth > 0 && between.length > 0) {
      body.push(
        escapeText(
          decodeCharacterData(between, (reference) =>
            add(
              "SVG_UNSUPPORTED_ENTITY",
              `The artwork uses the entity ${reference}, which needs a document type this importer does not allow.`,
              "Write the character itself, or use a numeric character reference.",
            ),
          ),
        ),
      );
    }

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
      // The root's inherited paint goes through exactly the same checks and
      // rewriting as any child's, so a reference on the root cannot escape
      // validation or keep pointing at a pre-namespace id.
      rootPaint = sanitizeAttributes(
        attributeSource,
        { idPrefix, declaredIds, add },
        (name) => INHERITED_ATTRIBUTES.has(name),
      ).join(" ");
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
      if (TEXT_BEARING.has(name) && textDepth > 0) textDepth -= 1;
      body.push(`</${name}>`);
      continue;
    }

    const kept = sanitizeAttributes(attributeSource, {
      idPrefix,
      declaredIds,
      add,
    });

    if (TEXT_BEARING.has(name) && !selfClosing) textDepth += 1;
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

  const inner = body.join("");
  return {
    ok: true,
    value: {
      body: rootPaint ? `<g ${rootPaint}>${inner}</g>` : inner,
      viewBox,
      ids: [...declaredIds].map((id) => `${idPrefix}${id}`).sort(),
    },
    issues: [],
  };
};
