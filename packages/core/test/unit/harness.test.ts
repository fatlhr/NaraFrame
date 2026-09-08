import { describe, expect, it } from "vitest";

describe("core test discovery", () => {
  it("loads the core source alias", async () => {
    const { corePackage } = await import("@naraframe/core");

    expect(corePackage).toBe("@naraframe/core");
  });
});
