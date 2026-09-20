import { compileDraft, validatePlanSource } from "@naraframe/core";
import { describe, expect, it } from "vitest";
import { narratedSource } from "./narrated-source.js";

const profile = {
  lockedPaths: ["render.safeZone"],
  overridablePaths: ["render.palette", "render.motion", "render.captions"],
};

const validate = (overrides: Record<string, unknown>) =>
  validatePlanSource(narratedSource({ ...profile, overrides }));

const codes = (result: { issues: Array<{ code: string }> }) =>
  result.issues.map((issue) => issue.code);

describe("project overrides", () => {
  it("resolves an allowed override on top of the pinned profile and keeps it explicit in the project", () => {
    const base = validatePlanSource(narratedSource(profile));
    const result = validate({ "render.palette.accent": "#00FF00" });
    expect(result.ok, JSON.stringify(result.issues)).toBe(true);
    if (!base.ok || !result.ok) return;
    expect(base.value.profile.render.palette.accent).toBe("#FF5A36");
    expect(result.value.profile.render.palette.accent).toBe("#00FF00");
    // The rest of the palette is untouched, and the override stays visible in source.
    expect(result.value.profile.render.palette.text).toBe(
      base.value.profile.render.palette.text,
    );
    expect(result.value.project.overrides).toEqual({
      "render.palette.accent": "#00FF00",
    });
  });

  it("reaches the compiler: it changes the render and the source revision", () => {
    const plain = compileDraft(
      validatePlanSource(narratedSource(profile)).ok
        ? narratedSource(profile)
        : (undefined as never),
    );
    const overridden = narratedSource({
      ...profile,
      overrides: { "render.palette.accent": "#00FF00" },
    });
    const resolved = validatePlanSource(overridden);
    if (!plain.ok || !resolved.ok) throw new Error("fixture");
    const compiled = compileDraft(resolved.value);
    expect(compiled.ok).toBe(true);
    if (!compiled.ok) return;
    expect(compiled.value.profile.render.palette.accent).toBe("#00FF00");
    expect(compiled.value.sourceRevision).not.toBe(plain.value.sourceRevision);
    expect(compiled.value.assemblyKey).not.toBe(plain.value.assemblyKey);
  });

  it("can create a setting the profile leaves unset, when that path is overridable", () => {
    const result = validate({ "render.captions.fontSize": 60 });
    expect(result.ok, JSON.stringify(result.issues)).toBe(true);
    if (result.ok)
      expect(result.value.profile.render.captions).toEqual({ fontSize: 60 });
  });

  it("rejects an override of a locked path, and of a parent that contains one", () => {
    expect(codes(validate({ "render.safeZone.top": 10 }))).toContain(
      "OVERRIDE_LOCKED",
    );
    const parent = validate({ render: 1 });
    expect(parent.ok).toBe(false);
    const wholeRender = validate({
      "render.safeZone": { top: 0, right: 0, bottom: 0, left: 0 },
    });
    expect(codes(wholeRender)).toContain("OVERRIDE_LOCKED");
  });

  it("rejects a path the profile does not declare overridable, and one outside the profile", () => {
    expect(
      codes(validate({ "render.typography.fontFamily": "Comic Sans" })),
    ).toContain("OVERRIDE_NOT_ALLOWED");
    expect(codes(validate({ "format.design": {} }))).toContain(
      "OVERRIDE_PATH_UNKNOWN",
    );
  });

  it("rejects a value that would make the resolved profile invalid", () => {
    const result = validate({ "render.palette.accent": "red" });
    expect(result.ok).toBe(false);
    expect(codes(result)).toContain("OVERRIDE_INVALID");
  });

  it("reports every problem at once and blocks the whole source", () => {
    const result = validate({
      "render.safeZone.top": 1,
      "render.typography.fontFamily": "x",
    });
    expect(result.ok).toBe(false);
    expect(codes(result).sort()).toEqual([
      "OVERRIDE_LOCKED",
      "OVERRIDE_NOT_ALLOWED",
    ]);
  });

  it("leaves a project with no overrides exactly as it was", () => {
    const result = validatePlanSource(narratedSource(profile));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.project.overrides).toBeUndefined();
  });
});
