import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = join(import.meta.dirname, "../../../..");
const readJson = async (path: string) =>
  JSON.parse(await readFile(join(root, path), "utf8")) as Record<
    string,
    unknown
  >;

describe("Claude Code plugin distribution", () => {
  it("publishes one naraframe plugin from the repository root", async () => {
    const marketplace = await readJson(".claude-plugin/marketplace.json");
    const plugins = marketplace.plugins as Array<Record<string, unknown>>;
    expect(marketplace.name).toBe("naraframe");
    expect(plugins).toHaveLength(1);
    expect(plugins[0]).toMatchObject({
      name: "naraframe",
      source: "./",
      license: "MIT",
    });
  });

  it("keeps the plugin, marketplace entry and engine versions equal", async () => {
    const plugin = await readJson(".claude-plugin/plugin.json");
    const marketplace = await readJson(".claude-plugin/marketplace.json");
    const engine = await readJson("skills/naraframe/engine.json");
    const entry = (marketplace.plugins as Array<Record<string, unknown>>)[0];
    expect(plugin.name).toBe("naraframe");
    expect(plugin.license).toBe("MIT");
    expect(plugin.version).toBe(engine.version);
    expect(entry?.version).toBe(engine.version);
  });

  it("ships a skill with the frontmatter skill installers require", async () => {
    const skill = await readFile(
      join(root, "skills/naraframe/SKILL.md"),
      "utf8",
    );
    const frontmatter = /^---\n([\s\S]*?)\n---\n/.exec(skill)?.[1] ?? "";
    expect(frontmatter).toMatch(/^name: naraframe$/m);
    const description = /^description: (.+)$/m.exec(frontmatter)?.[1] ?? "";
    expect(description.length).toBeGreaterThan(40);
    expect(description.length).toBeLessThan(1024);
    expect(description).toMatch(/explainer video/);
  });
});
