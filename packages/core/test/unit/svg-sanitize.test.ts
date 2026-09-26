import { sanitizeSvg } from "@naraframe/core";
import { describe, expect, it } from "vitest";

const wrap = (body: string, attributes = 'viewBox="0 0 100 50"') =>
  `<svg xmlns="http://www.w3.org/2000/svg" ${attributes}>${body}</svg>`;

const codes = (result: { ok: boolean; issues: Array<{ code: string }> }) =>
  result.issues.map((issue) => issue.code);

describe("root composition and encoded paint regression", () => {
  it("keeps root clipping, mask and transform with namespaced references", () => {
    const result = sanitizeSvg(
      wrap(
        '<defs><clipPath id="c"><circle r="5"/></clipPath><mask id="m"><rect width="10" height="10" fill="#fff"/></mask></defs><rect width="10" height="10"/>',
        'viewBox="0 0 10 10" clip-path="url(#c)" mask="url(#m)" transform="translate(1 2)"',
      ),
      "probe-",
    );
    expect(result.ok).toBe(true);
    if (result.ok)
      expect(result.value.body).toContain(
        '<g clip-path="url(#probe-c)" mask="url(#probe-m)" transform="translate(1 2)">',
      );
  });

  it.each([
    String.raw`u\72l(https://example.invalid/x)`,
    "/**/url(https://example.invalid/x)",
    "&#117;rl(https://example.invalid/x)",
  ])("refuses encoded paint %s on root and child", (paint) => {
    for (const input of [
      wrap("<rect/>", `viewBox="0 0 10 10" fill="${paint}"`),
      wrap(`<rect fill="${paint}"/>`),
    ]) {
      expect(codes(sanitizeSvg(input, "probe-"))).toContain(
        "SVG_EXTERNAL_REFERENCE",
      );
    }
  });

  it("decodes attribute entities once before namespacing and safe emission", () => {
    const result = sanitizeSvg(
      wrap(
        '<defs><linearGradient id="g&#49;"/></defs><rect fill="url(#g1)" font-family="A &amp; B"/>',
      ),
      "probe-",
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.body).toContain('id="probe-g1"');
      expect(result.value.body).toContain('fill="url(#probe-g1)"');
      expect(result.value.body).toContain('font-family="A &amp; B"');
    }
  });
});

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

describe("sanitizeSvg — semantics the artwork must not lose", () => {
  it("keeps paint declared on the root, which the whole illustration inherits", () => {
    const result = sanitizeSvg(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10" fill="#123456" stroke="#0B0E13" stroke-width="3">' +
        '<rect x="0" y="0" width="4" height="4"/></svg>',
      "a1-",
    );
    expect(result.ok, JSON.stringify(result.issues)).toBe(true);
    if (!result.ok) return;
    // Root paint is moved onto a wrapping group rather than dropped, so the
    // shapes that relied on inheriting it still render in the right colour.
    expect(result.value.body).toBe(
      '<g fill="#123456" stroke="#0B0E13" stroke-width="3">' +
        '<rect x="0" y="0" width="4" height="4"/></g>',
    );
  });

  it("does not move the root's own geometry onto that group", () => {
    const result = sanitizeSvg(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10" width="99" fill="#fff"><rect/></svg>',
      "a1-",
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.body).toContain('<g fill="#fff">');
      expect(result.value.body).not.toContain("viewBox");
      expect(result.value.body).not.toContain('width="99"');
    }
  });

  it("keeps the words inside text, including stacked tspans", () => {
    const result = sanitizeSvg(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 60">' +
        '<text x="10" y="20" font-size="17" fill="#0B0E13">' +
        '<tspan x="10" dy="0">K</tspan><tspan x="10" dy="19">O</tspan>' +
        "</text></svg>",
      "a1-",
    );
    expect(result.ok, JSON.stringify(result.issues)).toBe(true);
    if (!result.ok) return;
    // Both the characters and the offsets that stack them must survive; losing
    // dy collapses a vertical shop sign into one overlapping glyph.
    expect(result.value.body).toContain('<tspan x="10" dy="0">K</tspan>');
    expect(result.value.body).toContain('<tspan x="10" dy="19">O</tspan>');
  });

  it("resolves the standard entities instead of printing them", () => {
    const result = sanitizeSvg(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><text x="0" y="5">A &amp; B &lt; C</text></svg>',
      "a1-",
    );
    expect(result.ok, JSON.stringify(result.issues)).toBe(true);
    if (!result.ok) return;
    // "&amp;" means one ampersand. Escaping the source again would put the
    // five characters "&amp;" on screen, which is what the reader would see.
    expect(result.value.body).toContain(">A &amp; B &lt; C<");
    expect(result.value.body).not.toContain("&amp;amp;");
  });

  it("resolves numeric character references to the characters they name", () => {
    const result = sanitizeSvg(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><text x="0" y="5">caf&#233; &#x2014; 50%</text></svg>',
      "a1-",
    );
    expect(result.ok, JSON.stringify(result.issues)).toBe(true);
    if (result.ok) expect(result.value.body).toContain(">café — 50%<");
  });

  it("keeps the wording inside a CDATA section", () => {
    const result = sanitizeSvg(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><text x="0" y="5"><![CDATA[KOPI & TEH]]></text></svg>',
      "a1-",
    );
    expect(result.ok, JSON.stringify(result.issues)).toBe(true);
    if (result.ok) expect(result.value.body).toContain(">KOPI &amp; TEH<");
  });

  it("refuses an entity it cannot resolve rather than printing it literally", () => {
    const result = sanitizeSvg(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><text x="0" y="5">a &nbsp; b</text></svg>',
      "a1-",
    );
    expect(result.ok).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toContain(
      "SVG_UNSUPPORTED_ENTITY",
    );
  });

  it("refuses a numeric reference to a character that cannot be drawn", () => {
    const result = sanitizeSvg(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><text x="0" y="5">a&#0;b</text></svg>',
      "a1-",
    );
    expect(result.ok).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toContain(
      "SVG_UNSUPPORTED_ENTITY",
    );
  });

  it("drops a comment but keeps text, because only one of them is drawn", () => {
    const result = sanitizeSvg(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10">' +
        "<!-- drawn in Inkscape -->" +
        '<text x="0" y="5">KOPI</text></svg>',
      "a1-",
    );
    expect(result.ok, JSON.stringify(result.issues)).toBe(true);
    if (!result.ok) return;
    expect(result.value.body).toContain(">KOPI<");
    expect(result.value.body).not.toContain("Inkscape");
  });

  it.each([
    ["https", 'fill="url(https://example.invalid/paint.svg#g)"'],
    ["scheme-relative", 'fill="url(//example.invalid/paint.svg#g)"'],
    ["data uri", 'fill="url(data:image/svg+xml;base64,PHN2Zz4=)"'],
    ["mask over http", 'mask="url(http://example.invalid/m)"'],
  ])(
    "refuses paint wrapped in url() that leaves the asset (%s)",
    (_label, attribute) => {
      const result = sanitizeSvg(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect x="0" y="0" width="4" height="4" ${attribute}/></svg>`,
        "a1-",
      );
      expect(result.ok).toBe(false);
      expect(result.issues.map((issue) => issue.code)).toContain(
        "SVG_EXTERNAL_REFERENCE",
      );
    },
  );

  it("still accepts url() that points at the artwork's own definition", () => {
    const result = sanitizeSvg(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10">' +
        '<defs><linearGradient id="g"><stop offset="0" stop-color="#000000"/></linearGradient></defs>' +
        '<rect x="0" y="0" width="4" height="4" fill="url(#g)"/></svg>',
      "a1-",
    );
    expect(result.ok, JSON.stringify(result.issues)).toBe(true);
    if (result.ok) expect(result.value.body).toContain('fill="url(#a1-g)"');
  });
});

describe("sanitizeSvg — the root is checked like any other element", () => {
  const root = (attributes: string, body = "<rect/>") =>
    sanitizeSvg(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10" ${attributes}>${body}</svg>`,
      "probe-",
    );
  const gradient =
    '<defs><linearGradient id="g"><stop offset="0" stop-color="#000000"/></linearGradient></defs>';

  it.each([
    ["an external paint url", 'fill="url(https://example.invalid/a.svg#g)"'],
    ["a data uri paint", 'stroke="url(data:image/svg+xml,x)"'],
    ["an event handler", 'onload="alert(1)"'],
    ["a style attribute", 'style="fill:red"'],
  ])("refuses %s on the root", (_label, attributes) => {
    const result = root(attributes);
    expect(result.ok).toBe(false);
  });

  it("namespaces a local reference on the root, exactly as on a child", () => {
    const result = root('fill="url(#g)"', `${gradient}<rect/>`);
    expect(result.ok, JSON.stringify(result.issues)).toBe(true);
    if (!result.ok) return;
    // The gradient is renamed, so the root's reference has to follow it.
    expect(result.value.body).toContain('id="probe-g"');
    expect(result.value.body).toContain('fill="url(#probe-g)"');
    expect(result.value.body).not.toMatch(/fill="url\(#g\)"/);
  });

  it("refuses a root reference to a definition the artwork lacks", () => {
    const result = root('fill="url(#missing)"');
    expect(result.ok).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toContain(
      "SVG_REFERENCE_UNRESOLVED",
    );
  });
});
