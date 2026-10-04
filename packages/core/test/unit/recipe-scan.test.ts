import { pngSize, scanRecipeCode } from "@naraframe/core";
import { describe, expect, it } from "vitest";

const listed = new Set(["index.tsx", "lib.ts", "parts/card.tsx"]);
const codes = (code: string, file = "index.tsx") =>
  scanRecipeCode(code, file, listed).map((finding) => finding.code);

describe("recipe code scan", () => {
  it("allows react, remotion and listed relative files", () => {
    expect(
      codes(
        [
          'import { AbsoluteFill } from "remotion";',
          'import type { ReactNode } from "react";',
          'import { mix } from "./lib";',
          'import { Card } from "./parts/card";',
          'export { mix } from "./lib.ts";',
        ].join("\n"),
      ),
    ).toEqual([]);
    expect(codes('import { mix } from "../lib";', "parts/card.tsx")).toEqual(
      [],
    );
  });

  it("refuses other modules, unlisted files and paths outside the recipe", () => {
    expect(codes('import { readFileSync } from "node:fs";')).toEqual([
      "RECIPE_IMPORT_FORBIDDEN",
    ]);
    expect(codes('import "./extra";')).toEqual(["RECIPE_IMPORT_FORBIDDEN"]);
    expect(codes('import x from "../../secrets";')).toEqual([
      "RECIPE_IMPORT_FORBIDDEN",
    ]);
    expect(
      codes('const m = await import("https://cdn.example/x.js");'),
    ).toEqual(["RECIPE_IMPORT_FORBIDDEN"]);
  });

  it("refuses network, clock, randomness, eval and host access", () => {
    for (const snippet of [
      'fetch("https://example.com");',
      "new WebSocket(url);",
      "const t = Date.now();",
      "const d = new Date();",
      "const r = Math.random();",
      "performance.now();",
      'eval("1");',
      'new Function("return 1");',
      "process.env.KEY;",
      'require("fs");',
    ]) {
      expect(codes(snippet), snippet).toEqual(["RECIPE_CODE_FORBIDDEN"]);
    }
  });

  it("ignores comments when scanning", () => {
    expect(
      codes(
        '// fetch("x") and Date.now() are not used\n/* import fs from "node:fs" */\nconst a = 1;',
      ),
    ).toEqual([]);
  });
});

describe("png size", () => {
  it("reads width and height from the header and refuses non-PNG bytes", () => {
    const header = Buffer.alloc(24);
    header.writeUInt32BE(0x89504e47, 0);
    header.write("IHDR", 12, "ascii");
    header.writeUInt32BE(414, 16);
    header.writeUInt32BE(290, 20);
    expect(pngSize(header)).toEqual({ width: 414, height: 290 });
    expect(pngSize(Buffer.from("GIF89a-not-a-png-header!"))).toBeNull();
  });
});
