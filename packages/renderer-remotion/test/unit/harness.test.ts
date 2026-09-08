import { describe, expect, it } from "vitest";

describe("renderer test discovery", () => {
  it("loads renderer and core source aliases", async () => {
    const { rendererCorePackage, rendererPackage } = await import(
      "@naraframe/renderer-remotion"
    );

    expect(rendererPackage).toBe("@naraframe/renderer-remotion");
    expect(rendererCorePackage).toBe("@naraframe/core");
  });
});
