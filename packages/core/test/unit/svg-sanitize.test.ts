import { sanitizeSvg } from "@naraframe/core";
import { describe, expect, it } from "vitest";

const wrap = (body: string, attributes = 'viewBox="0 0 100 50"') =>
  `<svg xmlns="http://www.w3.org/2000/svg" ${attributes}>${body}</svg>`;

const codes = (result: { ok: boolean; issues: Array<{ code: string }> }) =>
  result.issues.map((issue) => issue.code);

describe("sanitizeSvg — artwork it accepts", () => {
  it("keeps shapes, paint and geometry, and reports the drawing box", () => {
    const result = sanitizeSvg(
      wrap(
        '<g id="row"><rect x="4" y="6" width="20" height="30" fill="#112233"/>' +
          '<path d="M0 0 L10 10" stroke="#FFFFFF" stroke-width="2" fill="none"/>' +
          '<circle cx="50" cy="25" r="8" fill="#AABBCC" opacity="0.4"/></g>',
      ),
      "a1-",
    );
    expect(result.ok, JSON.stringify(result.issues)).toBe(true);
    if (!result.ok) return;
    expect(result.value.viewBox).toEqual({
      minX: 0,
      minY: 0,
      width: 100,
      height: 50,
    });
    expect(result.value.body).toContain('<rect x="4" y="6"');
    expect(result.value.body).toContain('d="M0 0 L10 10"');
  });

  it("namespaces the artwork's own ids so two illustrations cannot collide", () => {
    const markup = wrap(
      '<defs><linearGradient id="sky"><stop offset="0" stop-color="#000000"/>' +
        '<stop offset="1" stop-color="#FFFFFF"/></linearGradient>' +
        '<clipPath id="frame"><rect x="0" y="0" width="40" height="40"/></clipPath></defs>' +
        '<rect x="0" y="0" width="100" height="50" fill="url(#sky)" clip-path="url(#frame)"/>',
    );
    const first = sanitizeSvg(markup, "a1-");
    const second = sanitizeSvg(markup, "b2-");
    expect(first.ok && second.ok).toBe(true);
    if (!first.ok || !second.ok) return;
    expect(first.value.body).toContain('id="a1-sky"');
    expect(first.value.body).toContain('fill="url(#a1-sky)"');
    expect(first.value.body).toContain('clip-path="url(#a1-frame)"');
    expect(second.value.body).toContain('fill="url(#b2-sky)"');
    expect(first.value.body).not.toContain("b2-");
    expect(first.value.ids).toEqual(["a1-frame", "a1-sky"]);
  });

  it("is stable: the same artwork and prefix always give the same markup", () => {
    const markup = wrap(
      '<rect x="1" y="1" width="8" height="8" fill="#123456"/>',
    );
    expect(sanitizeSvg(markup, "a1-")).toEqual(sanitizeSvg(markup, "a1-"));
  });

  it("reads a width/height root as a drawing box when there is no viewBox", () => {
    const result = sanitizeSvg(
      wrap(
        '<rect x="0" y="0" width="4" height="4" fill="#000000"/>',
        'width="64" height="32"',
      ),
      "a1-",
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.viewBox).toEqual({
        minX: 0,
        minY: 0,
        width: 64,
        height: 32,
      });
    }
  });

  it("treats a hex colour as paint, not as a reference to something missing", () => {
    const result = sanitizeSvg(
      wrap(
        '<rect x="0" y="0" width="8" height="8" fill="#26303F" stroke="#FFD79A"/>',
      ),
      "a1-",
    );
    expect(result.ok, JSON.stringify(result.issues)).toBe(true);
    if (result.ok) expect(result.value.body).toContain('fill="#26303F"');
  });

  it("drops an exporter's own metadata attributes without failing the import", () => {
    const result = sanitizeSvg(
      wrap(
        '<rect x="0" y="0" width="8" height="8" fill="#000000" data-name="layer 1" inkscape:label="x"/>',
      ),
      "a1-",
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.body).not.toContain("data-name");
      expect(result.value.body).not.toContain("inkscape");
    }
  });
});

describe("sanitizeSvg — artwork it refuses", () => {
  it.each([
    [
      "a script",
      '<script>fetch("https://example.invalid")</script>',
      "SVG_UNSAFE",
    ],
    [
      "an event handler",
      '<rect onload="alert(1)" x="0" y="0" width="1" height="1"/>',
      "SVG_UNSAFE",
    ],
    [
      "embedded HTML",
      "<foreignObject><div>hi</div></foreignObject>",
      "SVG_UNSAFE",
    ],
    ["its own animation", '<animate attributeName="x" to="10"/>', "SVG_UNSAFE"],
    [
      "another file",
      '<image href="photo.png" x="0" y="0" width="4" height="4"/>',
      "SVG_UNSAFE",
    ],
    ["a stylesheet", "<style>rect{fill:red}</style>", "SVG_UNSAFE"],
    [
      "a style attribute",
      '<rect style="fill:url(https://example.invalid/x)" x="0" y="0" width="1" height="1"/>',
      "SVG_UNSAFE",
    ],
  ])("refuses %s", (_label, body, code) => {
    const result = sanitizeSvg(wrap(body), "a1-");
    expect(result.ok).toBe(false);
    expect(codes(result)).toContain(code);
  });

  it("refuses an entity declaration, which can pull in another file", () => {
    const result = sanitizeSvg(
      '<!DOCTYPE svg [<!ENTITY x SYSTEM "file:///etc/passwd">]>' +
        wrap("<rect/>"),
      "a1-",
    );
    expect(result.ok).toBe(false);
    expect(codes(result)).toContain("SVG_UNSAFE");
  });

  it("refuses a link to another document but allows a local one", () => {
    expect(
      codes(
        sanitizeSvg(
          wrap('<use href="https://example.invalid/art.svg#a"/>'),
          "a1-",
        ),
      ),
    ).toContain("SVG_EXTERNAL_REFERENCE");
    const local = sanitizeSvg(
      wrap(
        '<defs><rect id="unit" x="0" y="0" width="4" height="4"/></defs><use href="#unit"/>',
      ),
      "a1-",
    );
    expect(local.ok, JSON.stringify(local.issues)).toBe(true);
    if (local.ok) expect(local.value.body).toContain('href="#a1-unit"');
  });

  it("refuses paint that points at a definition the artwork does not carry", () => {
    const result = sanitizeSvg(
      wrap('<rect x="0" y="0" width="8" height="8" fill="url(#missing)"/>'),
      "a1-",
    );
    expect(result.ok).toBe(false);
    expect(codes(result)).toContain("SVG_REFERENCE_UNRESOLVED");
  });

  it("refuses a file with no svg root, and one with no usable drawing box", () => {
    expect(codes(sanitizeSvg("<html><body>no</body></html>", "a1-"))).toContain(
      "SVG_ROOT_MISSING",
    );
    expect(
      codes(
        sanitizeSvg(
          '<svg xmlns="http://www.w3.org/2000/svg"><rect/></svg>',
          "a1-",
        ),
      ),
    ).toContain("SVG_VIEWBOX_MISSING");
  });

  it("refuses an element it cannot draw rather than dropping it silently", () => {
    const result = sanitizeSvg(wrap('<filter id="blur"></filter>'), "a1-");
    expect(result.ok).toBe(false);
    expect(codes(result)).toContain("SVG_UNSAFE");
  });
});
