import { access, readdir, readFile } from "node:fs/promises";
import { join, resolve, sep } from "node:path";
import { describe, expect, it } from "vitest";

const root = join(import.meta.dirname, "../../../..");
const skillDirectory = join(root, "skills/naraframe");
const skillPath = join(skillDirectory, "SKILL.md");

const readSkill = () => readFile(skillPath, "utf8");

describe("skill formula", () => {
  it("keeps the router small enough to stay in every session's context", async () => {
    const skill = await readSkill();
    expect(skill.length).toBeGreaterThan(4_000);
    expect(skill.length).toBeLessThanOrEqual(20 * 1024);
  });

  it("frontmatter triggers on revision phrasing as well as creation", async () => {
    const skill = await readSkill();
    const frontmatter = /^---\n([\s\S]*?)\n---\n/.exec(skill)?.[1] ?? "";
    const description = /^description: (.+)$/m.exec(frontmatter)?.[1] ?? "";
    expect(description).toMatch(/explainer video/);
    expect(description).toMatch(/revise/);
    expect(description).toMatch(/fix/);
    expect(description.length).toBeLessThan(1024);
  });

  it("ships every guide the router links to", async () => {
    const skill = await readSkill();
    const links = [...skill.matchAll(/\]\(([^)]+)\)/gu)].map(
      (match) => match[1] ?? "",
    );
    const relative = links.filter(
      (link) =>
        !link.startsWith("http") &&
        !link.startsWith("#") &&
        !link.startsWith("mailto:"),
    );
    expect(relative).toContain("revisions.md");
    expect(relative).toContain("authoring.md");
    expect(relative).toContain("export.md");
    for (const link of relative) {
      const target = resolve(skillDirectory, link.split("#")[0] ?? "");
      expect(target.startsWith(`${resolve(skillDirectory)}${sep}`)).toBe(true);
      await expect(access(target)).resolves.toBeUndefined();
    }
  });

  it("lists the on-demand guides without duplicating their content", async () => {
    const entries = await readdir(skillDirectory);
    const guides = entries.filter((entry) => entry.endsWith(".md"));
    expect(guides.sort()).toEqual([
      "SKILL.md",
      "art-direction.md",
      "authoring.md",
      "captions.md",
      "export.md",
      "installation.md",
      "library.md",
      "prepared-audio.md",
      "revisions.md",
    ]);
  });
});
