# Use an installed engine

A skill supplies the authoring workflow. It needs a compatible engine and local Node, Chrome/Chromium, FFmpeg/FFprobe and fonts to render. Installing a local skill does not add those tools to a cloud session or authorize provider calls, recipe trust, final export or public posting.

## Locate the selected engine

Use the skill's launcher, not a guessed global command or another checkout:

```sh
node "<skill-directory>/scripts/naraframe.mjs" version --json
node "<skill-directory>/scripts/naraframe.mjs" doctor --json
```

`<skill-directory>` is `${CLAUDE_SKILL_DIR}` for a Claude Code plugin skill, otherwise the directory containing the SKILL.md you loaded. The launcher is a plain file of the skill and writes nothing, so the skill folder may be read-only, such as a plugin cache that is replaced on update. It finds the engine in one of two ways:

- **No receipt (default).** It reads the version from `engine.json` and uses `$NARAFRAME_HOME/engine/<version>` (`NARAFRAME_HOME` defaults to `~/.naraframe`). It checks that engine's `version --json` (the declared version, skill API 1, source schema 1) before forwarding argv.
- **Install receipt.** An explicit installer run (below) leaves `installation.json` in the skill folder. It records the compiled `engineEntry`, `engineVersion`, `engineIdentity`, `skillApiVersion`, `sourceSchemaVersion`, `renderEngine`, absolute `resourceRoot` and hashes of the copied skill files. The launcher then follows the receipt and checks the pinned engine/API/resource identity on each invocation.

Its own bootstrap failures go to stderr with a nonzero exit; successful engine invocation retains the normal CLI JSON stdout. Stop and report a launcher failure rather than treating a missing JSON event as readiness.

Commands in the other guides show the source prefix `pnpm naraframe`. For installed use, replace that prefix with the launcher above. Use absolute project paths when changing working directories. Built-in profile IDs such as `general-explainer` and `current-issues` resolve inside the installed engine; `profile list` shows them. Catalogs, for example `library/starter/catalog.json`, resolve under `resourceRoot`; the art-direction source example resolves under this skill's `examples/` directory. Do not read private renderer source or reinstall the development repo to compensate for a missing packaged file.

With no engine, install one from npm as described next, or use a built source checkout with its pinned Node/pnpm and `pnpm naraframe`. Do not mix source and installed engines during one frozen trial. A moved/missing engine needs explicit reinstallation/update; the launcher never searches for a different engine silently.

Every launcher failure is one line, `CODE: message. Next: step (see installation.md)`, with exit code 2 and no stack trace. Do the `Next` step, or report the line as it is.

`engineIdentity` fingerprints NaraFrame's built modules, maintained profiles/library/skill/installer, and dependency pins. A rebuilt checkout or changed catalog at the same version/path requires an explicit skill update too. It is an installation binding, not a sandbox or a certificate for third-party code. Changes to episode source do not change this identity.

## Install the engine from npm

A skill folder copied from GitHub, installed with `npx skills add`, or delivered as a plugin has no engine. `scripts/setup-engine.mjs` in it installs one. It needs only Node 24.20.0 and npm, runs only after the user agrees, and writes only under `NARAFRAME_HOME` (default `~/.naraframe`): never into the skill folder, which can be read-only.

```sh
# Read-only: prerequisites, planned folder, existing engine. Writes nothing.
node "<skill-directory>/scripts/setup-engine.mjs" --check --json
# After the user agrees:
node "<skill-directory>/scripts/setup-engine.mjs" --json
```

Options: `--engine-dir <dir>` (default `$NARAFRAME_HOME/engine/<version>`; the launcher only finds that layout, so elsewhere set `NARAFRAME_HOME` to the folder two levels up), `--version <v>` (default: the one in the skill's `engine.json`), `--source <path-to-tgz-or-npm-spec>` (default `naraframe@<version>`, for example a local package before publication), `--check` and `--json`. `--bind-skill` with `--host claude|codex` and `--project <dir>` or `--scope user` (optional `--user-root <dir>`) also binds a manual project or personal skill install through the installer, adopting an untouched copy (see below); those placement options are refused without it. The result lists the prerequisites (`ready`, `missing`, `incompatible`, or `needs-config` when a tool exists elsewhere and the matching `NARAFRAME_*_EXECUTABLE` variable must point to it), the engine (`missing`, `broken`, `healthy`, `reused`, `installed`), the launcher route, `doctor` (run through the launcher), the skill when binding (`adopted`, `installed`, `updated`, `already-bound`; in a check also `unbound`, `unreceipted`, `stale`), and `next`. Exit 0 means ready (or a completed `--check`), 1 a failure, 3 installed with a tool still missing.

The script installs with `npm install --prefix <engine-dir>`, with the exact versions the package pins for its direct dependencies (about 240 MB). It installs into a temporary sibling folder and swaps it in only when the engine answers `version`, so a failed run leaves an existing engine untouched. A healthy engine is reused and a second run changes nothing. With `--bind-skill`, a skill bound to a different, still working engine is not rebound; run the installer with `--update` yourself if that is intended.

For a one-off command without a skill, use `npx -y naraframe@<version> <command>`. Naming the version and `-y` avoids npm swallowing flags such as `--profile` and the install prompt. Chrome or Chromium, FFmpeg/FFprobe and a font stay your own installs: `brew install --cask google-chrome` and `brew install ffmpeg` on macOS. Only macOS on Apple Silicon is verified.

## Install or update a skill

The engine ships `scripts/install-skill.mjs`. For a project-local installation:

```sh
node "<engine-root>/scripts/install-skill.mjs" --host codex --scope project --project "/absolute/project" --dry-run --json
node "<engine-root>/scripts/install-skill.mjs" --host codex --scope project --project "/absolute/project" --json
```

For Claude Code replace `codex` with `claude`. The target is `.agents/skills/naraframe` for Codex or `.claude/skills/naraframe` for Claude Code. `--scope user` selects the documented personal host folder; ask before changing an actual personal installation. `--user-root` allows an explicit user root for isolated setup/testing. Host discovery may require a new session; a successful filesystem install alone does not prove that a host loaded the skill.

The helper defaults to the compiled entry in that engine artifact. Use `--engine-entry "/absolute/path/to/packages/cli/dist/index.js"` when deliberately selecting another engine. It copies the entire canonical skill and supporting resources, including the launcher, then records its binding in `installation.json`. It never edits host security settings, production source or code trust.

Add `--adopt` to bind a skill folder that was copied without the installer, such as from GitHub. It is accepted only when every file in the folder is byte-identical to the canonical skill of the selected engine; an edited, missing or extra file, a symlink or an unreadable receipt is refused as below. The receipt then records `"adopted": true`. `--adopt` cannot be combined with `--update` or `--remove`, and with `--dry-run` it reports the adoption or the refusal without writing.

Add `--update` to replace a receipt-owned, unchanged install. Add `--remove` to remove only that owned install. Both support `--dry-run`. A destination with no matching receipt, local edits, extra files or symlinks is refused. Preserve those files and inspect the conflict; do not delete them to make the installer succeed. An existing symlink installed manually stays intact and must be migrated explicitly by its owner.

## Resolve setup failures

- `SKILL_ENGINE_MISSING` or `SKILL_ENGINE_INCOMPATIBLE`: the pinned engine is gone, moved or cannot start. Run `setup-engine.mjs --check --json`, tell the user, and with their agreement run it again without `--check` (see above). A receipt-bound skill whose engine is gone stays bound to it: rebind with `--bind-skill`, or use a skill folder without a receipt. For an incompatible engine, install/build one supporting skill API 1; do not infer compatibility from a folder name.
- `SKILL_INSTALL_INVALID`: `engine.json` or the receipt next to the launcher is unreadable. Restore the skill folder, or reinstall it through the installer.
- `SETUP_PREREQUISITE_MISSING`: Node 24.20.0 or npm is not the one running the script. Install it as the line says and run the script with it first on PATH.
- `SETUP_NPM_UNREACHABLE` or `SETUP_INSTALL_FAILED`: npm could not fetch the package. Check the connection and registry, then run the same command; the existing engine is untouched.
- `SETUP_ENGINE_NOT_PUBLISHED`: that version is not on the registry. Use `--source` with a local package, or a published version.
- `SETUP_ENGINE_INVALID`: the installed package is not the version this skill declares. Pass a matching `--source` or update the skill.
- `SETUP_ENGINE_DIR_IN_USE`: `--engine-dir` holds something that is not a NaraFrame engine. Choose another folder; the script never removes it.
- `SETUP_SKILL_BOUND_ELSEWHERE`: the skill already uses another working engine. Use its launcher, or update the binding explicitly.
- `SETUP_USAGE`: a missing or unknown option; the line says which.
- A tool reported `missing` or `needs-config` (browser, FFmpeg, FFprobe, font): install it or export the named variable, then `setup-engine.mjs --check --json` until `doctor` is green.
- `SKILL_ENGINE_CHANGED`: with a receipt, verify the intended engine upgrade, then run an explicit skill update; without one, the engine in `NARAFRAME_HOME` is not the version `engine.json` declares, so run `setup-engine.mjs` for the declared version. Existing projects/profile pins remain unchanged.
- `SKILL_INSTALL_CONFLICT`, `SKILL_INSTALL_EXISTS` or `SKILL_INSTALL_EDITED`: inspect the existing skill and preserve user edits; the installer must not overwrite them.
- `SKILL_REFERENCE_MISSING`: the engine's skill bundle is incomplete. Correct the distribution instead of loading an unrelated reference copy.
- `SKILL_INSTALL_RECOVERY`: retain the named backup and report it before another install attempt.

Actual local host paths and invocation are described by the [Codex documentation](https://learn.chatgpt.com/docs/build-skills) and [Claude Code documentation](https://code.claude.com/docs/en/skills). The same canonical authoring instructions serve both; a future marketplace wrapper does not replace the standalone engine.
