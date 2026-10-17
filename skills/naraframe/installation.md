# Use an installed engine

A skill supplies the authoring workflow. It needs a compatible engine and local Node, Chrome/Chromium, FFmpeg/FFprobe and fonts to render. Installing a local skill does not add those tools to a cloud session or authorize provider calls, recipe trust, final export or public posting.

## Locate the selected engine

An installed skill includes `installation.json`, which records the compiled `engineEntry`, `engineVersion`, `engineIdentity`, `skillApiVersion`, `sourceSchemaVersion`, `renderEngine`, absolute `resourceRoot`, and hashes of copied skill files. Read it before authoring. Use its launcher, not a guessed global command or another checkout:

```sh
node "<skill-directory>/scripts/naraframe.mjs" version --json
node "<skill-directory>/scripts/naraframe.mjs" doctor --json
```

Replace `<skill-directory>` with the directory containing the SKILL.md you actually loaded. The launcher checks the pinned engine/API/resource identity on each invocation. Its own bootstrap failures go to stderr with a nonzero exit; successful engine invocation retains the normal CLI JSON stdout. Stop and report a launcher failure rather than treating a missing JSON event as readiness.

Commands in the other guides show the source prefix `pnpm naraframe`. For installed use, replace that prefix with the launcher above. Use absolute project paths when changing working directories. Built-in profile IDs such as `current-issues` resolve inside the installed engine. Catalogs, for example `library/starter/catalog.json`, resolve under `resourceRoot`; the art-direction source example resolves under this skill's `examples/` directory. Do not read private renderer source or reinstall the development repo to compensate for a missing packaged file.

Without an install receipt, use a built source checkout with its pinned Node/pnpm and `pnpm naraframe`. Do not mix source and installed engines during one frozen trial. A moved/missing engine needs explicit reinstallation/update; the launcher never searches for a different engine silently.

`engineIdentity` fingerprints NaraFrame's built modules, maintained profiles/library/skill/installer, and dependency pins. A rebuilt checkout or changed catalog at the same version/path requires an explicit skill update too. It is an installation binding, not a sandbox or a certificate for third-party code. Changes to episode source do not change this identity.

## Install or update a skill

The engine ships `scripts/install-skill.mjs`. For a project-local installation:

```sh
node "<engine-root>/scripts/install-skill.mjs" --host codex --scope project --project "/absolute/project" --dry-run --json
node "<engine-root>/scripts/install-skill.mjs" --host codex --scope project --project "/absolute/project" --json
```

For Claude Code replace `codex` with `claude`. The target is `.agents/skills/naraframe` for Codex or `.claude/skills/naraframe` for Claude Code. `--scope user` selects the documented personal host folder; ask before changing an actual personal installation. `--user-root` allows an explicit user root for isolated setup/testing. Host discovery may require a new session; a successful filesystem install alone does not prove that a host loaded the skill.

The helper defaults to the compiled entry in that engine artifact. Use `--engine-entry "/absolute/path/to/packages/cli/dist/index.js"` when deliberately selecting another engine. It copies the entire canonical skill and supporting resources, generates a local launcher, then records its binding. It never edits host security settings, production source or code trust.

Add `--update` to replace a receipt-owned, unchanged install. Add `--remove` to remove only that owned install. Both support `--dry-run`. A destination with no matching receipt, local edits, extra files or symlinks is refused. Preserve those files and inspect the conflict; do not delete them to make the installer succeed. An existing symlink installed manually stays intact and must be migrated explicitly by its owner.

## Resolve setup failures

- `SKILL_ENGINE_MISSING` or `SKILL_ENGINE_INCOMPATIBLE`: inspect the selected entry; install/build a compatible engine supporting skill API 1. Do not infer compatibility from a folder name.
- `SKILL_ENGINE_CHANGED`: verify the intended engine upgrade, then run an explicit skill update. Existing projects/profile pins remain unchanged.
- `SKILL_INSTALL_CONFLICT`, `SKILL_INSTALL_EXISTS` or `SKILL_INSTALL_EDITED`: inspect the existing skill and preserve user edits; the installer must not overwrite them.
- `SKILL_REFERENCE_MISSING`: the engine's skill bundle is incomplete. Correct the distribution instead of loading an unrelated reference copy.
- `SKILL_INSTALL_RECOVERY`: retain the named backup and report it before another install attempt.

Actual local host paths and invocation are described by the [Codex documentation](https://learn.chatgpt.com/docs/build-skills) and [Claude Code documentation](https://code.claude.com/docs/en/skills). The same canonical authoring instructions serve both; a future marketplace wrapper does not replace the standalone engine.
