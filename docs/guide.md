# NaraFrame technical guide

This guide covers installation from source or an archive, the command line, project files, revisions, recipes and troubleshooting. For an overview, start with the [README](../README.md).

The quickest route for most people is the Claude Code plugin: install it, ask for a video, and let the agent offer to install the engine (see the README). This guide is for installing the engine yourself, using the command line directly, or working on NaraFrame.

Make motion explainers and brand videos you can reuse for the next episode.

NaraFrame is a local engine for editable vertical videos. Keep your brand in a profile, choose an explanatory composition, and change the episode's copy, artwork or timing. Review a preview, then export a 1080×1920 MP4.

Use the NaraFrame skill with Claude Code or Codex to work through briefs and revisions. You can also author project files and run the CLI yourself, or call it from a script. Rendering uses TypeScript and Remotion on your machine; the engine does not require an agent account or API key.

[Install the engine](#1-install-the-engine) · [Use the skill](#2-install-the-skill) · [Make your first MP4](#3-quickstart-to-a-final-mp4)

## What you can do

- Keep fonts, colors, editorial guidance and your brand's CTA in a profile, then reuse it across episodes.
- Start from a versioned library pattern and swap copy, artwork or pose. The project pins its dependencies, so a later catalog update does not change an approved episode.
- Ask for changes such as "shorten the headline" or "slow down the camera." Your agent updates the project without requiring you to edit renderer code.
- Build scenes from text layers, SVG illustrations, paths, and cameras, or use a parameterized Remotion recipe for a custom composition.
- Check individual scenes at 540 resolution, then review the full video at native 1080 before export. Choose narration, music only, or silent output.
- Keep a revision history, undo changes, and reuse media and preview builds that still match the project.
- Import an accepted voice take with reviewed phrase timing. Change the caption policy or visuals while keeping the master audio intact.
- Check name, CTA, and asset bindings when switching brand profiles. The engine blocks final export when declared content has incompatible bindings.

NaraFrame suits a series with a consistent identity, such as tutor introductions, service explainers, or progress reports. Keep the assets and composition while changing the message for each episode.

Choose a profile and prepare the story and media. The skill can handle project authoring; terminal users can work from the included example or a library pattern. Inspect the preview, revise, and approve the export. Your MP4 stays local until you choose where to upload it.

## Start here

- [Install the engine](#1-install-the-engine).
- [Install the skill in Codex or Claude Code](#2-install-the-skill).
- [Use the CLI without an agent](#use-the-engine-without-an-agent).
- [Follow the quickstart to a final MP4](#3-quickstart-to-a-final-mp4) using the included media.
- [Create your own video](#4-create-your-own-video).
- [Revise, undo, and switch profiles](#5-revisions-undo-and-profile-switching).
- [Use recipes and brand bindings](#6-recipes-and-brand-safety).
- [Find troubleshooting and usage notes](#8-troubleshooting-and-usage-notes).

## 1. Install the engine

### Requirements

Choose a source checkout or a supplied engine archive. Both run locally on macOS with Chrome and FFmpeg. The current archive captures macOS Apple Silicon dependencies; Windows, Linux and Intel archive builds have not been verified. Neither route requires Claude or Codex.

| Component | Requirement |
| --- | --- |
| Git | Needed for the source route; private repositories require authentication |
| Node.js | `24.20.0`, as pinned in [.node-version](../.node-version) |
| pnpm | `12.3.4` for source development; not needed for an installed archive |
| Browser | An installed Chrome/Chromium executable; the engine does not download one |
| Media tools | Installed `ffmpeg` and `ffprobe` executables |
| Fonts | A readable local font; profiles with custom fonts also need their font assets |

You need internet access to fetch the repository and dependencies for source setup. A supplied archive includes the engine's runtime dependencies and can be installed offline. Prepare your images and audio separately; installation does not generate them.

### Install a supplied engine archive

Use this route if you have `naraframe-engine-0.1.0.tgz`. It is a local distribution artifact, not a package published on the npm registry. Activate Node 24.20.0 first, and install it in a dedicated directory:

```sh
mkdir naraframe-runtime
cd naraframe-runtime
npm install --offline --no-audit --no-fund /absolute/path/naraframe-engine-0.1.0.tgz
NARAFRAME_ENGINE="$PWD/node_modules/naraframe-engine"
node "$NARAFRAME_ENGINE/packages/cli/dist/index.js" version --json
node "$NARAFRAME_ENGINE/packages/cli/dist/index.js" doctor --json
```

`version` reports engine version `0.1.0`, skill API `1`, and the installed resource root. Keep `NARAFRAME_ENGINE` as an absolute path when working on videos elsewhere. You can also invoke the local executable at `node_modules/.bin/naraframe`; it does not need a global npm installation.

The archive includes a neutral silent starter, profiles, reusable library data, the complete skill, and its installer. It excludes private production projects and development fixtures. Check the companion `engine-manifest.json` checksum and the archive's `distribution-rights.json` before use. Public redistribution still requires the owner's license decision.

To upgrade, install the intended archive explicitly and inspect `version` again. Update each installed skill after confirming the engine change; its launcher refuses an unexpected version instead of silently switching engines. Retain the previous installation and project source until the upgrade is accepted.

### Build from source

Clone the repository and enter the NaraFrame directory. If you already have a checkout, open that directory and skip the clone step.

```sh
git clone https://github.com/fatlhr/NaraFrame.git
cd NaraFrame
```

Activate Node 24.20.0 with your usual version manager. If nvm is already installed, use:

```sh
nvm install 24.20.0
nvm use 24.20.0
node --version
npm install --global pnpm@12.3.4
pnpm --version
```

`node --version` should print `v24.20.0`, and `pnpm --version` should print `12.3.4`. If they differ, correct the active runtime. Leave the repository's version pins and dependencies unchanged.

If Chrome or FFmpeg is missing, you can install them through Homebrew:

```sh
brew install ffmpeg
brew install --cask google-chrome
```

The engine looks for Chrome at `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome` and FFmpeg at `/opt/homebrew/bin/ffmpeg`. If your tools are elsewhere, such as on an Intel Mac, set their paths explicitly. Make sure `ffmpeg` and `ffprobe` are available in PATH before running:

```sh
export NARAFRAME_BROWSER_EXECUTABLE="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
export NARAFRAME_FFMPEG_EXECUTABLE="$(command -v ffmpeg)"
export NARAFRAME_FFPROBE_EXECUTABLE="$(command -v ffprobe)"
```

Install dependencies, build the engine, and run `doctor`:

```sh
pnpm install --frozen-lockfile
pnpm build
pnpm naraframe doctor --json
NARAFRAME_ENGINE="$PWD"
```

Continue when doctor reports `success: true` and `readiness: "ready"`. It checks your machine without downloading files or rendering video. You can set `NARAFRAME_FONT_FILE` to a local font for the doctor check. Project fonts still come from the profile and its assets.

After pulling repository updates, activate the pinned runtime and run `pnpm install --frozen-lockfile` and `pnpm build` again.

To prepare a local archive from the built source:

```sh
pnpm pack:engine --out /absolute/path/new-distribution-directory
```

This produces the tarball and a checksum/content manifest. It captures installed runtime dependencies for the current platform without downloading packages or publishing anything. Use a new output directory for each candidate so previous evidence stays intact.

## 2. Install the skill

The skill tells your agent how to operate the engine. Its maintained source is [skills/naraframe/SKILL.md](../skills/naraframe/SKILL.md). The installer copies the whole folder, checks its references, and adds a launcher pinned to the selected engine. It works with either installation route above.

Keep `NARAFRAME_ENGINE` set to your engine's absolute root. Create or select the directory where you will work on video projects. Start with a project-scoped install:

### Local Codex

```sh
node "$NARAFRAME_ENGINE/scripts/install-skill.mjs" --host codex --scope project --project /absolute/path/video-projects --dry-run --json
node "$NARAFRAME_ENGINE/scripts/install-skill.mjs" --host codex --scope project --project /absolute/path/video-projects --json
```

Open that project directory in Codex and invoke `$naraframe`. The installer uses `.agents/skills/naraframe`. If the skill does not appear, start a new session. See the [Codex skills documentation](https://learn.chatgpt.com/docs/build-skills).

### Local Claude Code

```sh
node "$NARAFRAME_ENGINE/scripts/install-skill.mjs" --host claude --scope project --project /absolute/path/video-projects --dry-run --json
node "$NARAFRAME_ENGINE/scripts/install-skill.mjs" --host claude --scope project --project /absolute/path/video-projects --json
```

Start Claude Code from that project directory and invoke `/naraframe`. The installer uses `.claude/skills/naraframe`. See the [Claude Code skills documentation](https://code.claude.com/docs/en/skills).

For a personal install across projects, replace `--scope project --project …` with `--scope user`. This changes your own `.agents/skills` or `.claude/skills` folder. Use `--dry-run` first. Add `--update` for an explicit upgrade or `--remove` to remove a receipt-owned installation. The installer refuses an unrelated folder, a symlink, or a skill with local edits or extra files; preserve and inspect those files instead of deleting them to bypass the check.

The copied skill records its engine in `installation.json`. Its `scripts/naraframe.mjs` launcher works from another directory and checks the engine identity on every call. Moving or upgrading the engine requires an explicit skill update. Full setup and recovery instructions are in [installation.md](../skills/naraframe/installation.md).

Your agent needs terminal and local file access to run NaraFrame. A skill in your machine's personal folder is not automatically available in Claude Cowork or cloud sessions. If you upload the skill to a chat, that environment still needs the engine, tools, and project media.

### Example brief

Replace the details in square brackets. Invoke `$naraframe` in Codex or `/naraframe` in Claude Code before using this prompt:

```text
Use the NaraFrame engine selected by this skill through its public CLI. Do not change the engine.
Create a [20–30 second] vertical video for [brand], aimed at [audience].
Main message: [one message]. CTA: [action and destination].
Profile: [profile ID or path]. Audio: [voice / music / silent].
Allowed assets: [paths and usage permissions].

Run doctor and read the schema and profile first.
Save a new project in [absolute destination]/[project-name]. Do not overwrite other projects.
Use declarative compositions or an already trusted recipe.
Ask before creating or trusting new recipe code.
For voice, request an approved script and audio file if they are missing.
Do not use paid providers or generate new media without permission.
Show a full 1080 preview and contact sheet for review.
Stop before final render until I approve the preview.
```

Let the agent handle schemas and project files. Provide the brief, confirm the facts and media permissions, and review the preview. If the agent needs new recipe code, it must ask for your permission.

### Use the engine without an agent

Skip skill installation if you prefer the terminal or a scripted workflow. The same CLI validates project files, creates previews, records revisions and exports approved videos. The [quickstart](#3-quickstart-to-a-final-mp4) supplies ready source so you can follow it without an agent.

With `NARAFRAME_ENGINE` set to your source or installed engine root, invoke it from your video directory:

```sh
mkdir -p ../my-videos
cd ../my-videos
node "$NARAFRAME_ENGINE/packages/cli/dist/index.js" doctor --json
node "$NARAFRAME_ENGINE/packages/cli/dist/index.js" create my-video --profile current-issues --json
```

`create` makes a source skeleton. Add `--template starter` to start from a runnable three-scene plan (hook, explanation, payoff, about 25 s, no claims or narration) and edit its text and timing instead of writing scenes from scratch. Otherwise fill the skeleton using `schema --json`, a library pattern or an existing project you have permission to reuse. `scenes.json` holds the story and choreography; media and audio have their own manifests and timing. This route gives you direct control of the data rather than turning a text prompt into a video by itself.

Keep the active Node version pinned as described above. For scripts, read the CLI's JSON result and exit code; progress belongs to stderr. The [command reference](#7-project-files-outputs-and-commands) explains those fields.

## 3. Quickstart to a final MP4

Choose the archive's neutral silent starter or the source checkout's narrated coral example. Keep `NARAFRAME_ENGINE` set to the engine root. If a command fails, resolve the problem before continuing.

### Copy the example source into a new project

Use a new directory outside the installation. Replace the destination below with your own absolute path; `mkdir` stops if it already exists.

For an installed archive:

```sh
NARAFRAME_PROJECT="/absolute/path/quickstart-neutral"
mkdir "$NARAFRAME_PROJECT"
cp -R "$NARAFRAME_ENGINE/starter/demo/." "$NARAFRAME_PROJECT/"
```

The neutral starter is a four-second declarative path diagram. It uses explicit silent mode and system font names, with editable copy and no recipe trust or private media.

For a source checkout, the [coral reef example](../test-fixtures/project-general-explainer) includes PNG artwork, MP3 narration and a profile lock:

```sh
NARAFRAME_PROJECT="/absolute/path/quickstart-coral"
mkdir "$NARAFRAME_PROJECT"
cp "$NARAFRAME_ENGINE/test-fixtures/project-general-explainer/naraframe.json" "$NARAFRAME_ENGINE/test-fixtures/project-general-explainer/scenes.json" "$NARAFRAME_ENGINE/test-fixtures/project-general-explainer/profile.lock.json" "$NARAFRAME_ENGINE/test-fixtures/project-general-explainer/narration.json" "$NARAFRAME_PROJECT/"
cp -R "$NARAFRAME_ENGINE/test-fixtures/project-general-explainer/assets" "$NARAFRAME_ENGINE/test-fixtures/project-general-explainer/audio" "$NARAFRAME_PROJECT/"
```

The engine creates preview/cache/history in the copied project, not inside its installation. Keep the example's publication rights separate from your own video assets.

### Validate and preview

```sh
node "$NARAFRAME_ENGINE/packages/cli/dist/index.js" validate "$NARAFRAME_PROJECT" --stage plan --json
node "$NARAFRAME_ENGINE/packages/cli/dist/index.js" validate "$NARAFRAME_PROJECT" --stage production --json
node "$NARAFRAME_ENGINE/packages/cli/dist/index.js" preview "$NARAFRAME_PROJECT" --resolution 1080 --json
node "$NARAFRAME_ENGINE/packages/cli/dist/index.js" status "$NARAFRAME_PROJECT" --json
```

The preview is native 1080×1920 and carries a DRAFT label. The neutral starter is silent. The coral example has narration, runs about 18.7 seconds and resolves to `voice` with source `legacy` because its older configuration does not declare `audioMode`.

You may see `CONTRAST_UNVERIFIED` information messages. The engine cannot assess text contrast over some moving or transparent panels. Check those areas in the preview.

Preview runs visual preflight before rendering frames. This step can find problems that `validate` does not catch.

Open `artifacts.previewMp4` and `artifacts.contactSheetPng`. Listen to the narration and check the text, crops, and scene transitions. Keep the preview's `buildId` for the export step.

### Export after the owner approves the full preview

Replace the `APPROVED_BUILD_ID` placeholder with the ID from the preview above.

```sh
node "$NARAFRAME_ENGINE/packages/cli/dist/index.js" render "$NARAFRAME_PROJECT" --approve-preview APPROVED_BUILD_ID --json
node "$NARAFRAME_ENGINE/packages/cli/dist/index.js" status "$NARAFRAME_PROJECT" --json
```

A successful result reports `success: true` and `mode: "final"`. Open the MP4 at `artifacts.finalMp4`: H.264 at 1080×1920, 30 fps, without the DRAFT label. Voice/music output includes AAC audio; silent output has no audio stream. The manifest records the source and approval used for export.

Use `--approve-preview` after the project owner approves the full preview. Any later source change makes that approval stale and requires a new preview review. The `--autonomous --authorized-by <name>` option requires the owner's explicit permission to export without a preview review.

Before uploading, check the facts and media permissions, including music, photos, and the identities of people shown. MP4 export does not check publication rights.

## 4. Create your own video

The examples below use `pnpm naraframe` from a built source checkout. For an installed engine, replace that prefix with `node "$NARAFRAME_ENGINE/packages/cli/dist/index.js"`. Use absolute paths for projects and bundled catalogs; read the catalog root from `version --json` rather than assuming the development directory exists.

### Choose a profile and create a project

```sh
pnpm naraframe schema --json
pnpm naraframe profile inspect current-issues --json
pnpm naraframe create ../my-videos/new-video --profile current-issues --json
```

`create` makes a project skeleton for the agent to fill in. With `--template starter` the skeleton already holds three claim-free placeholder scenes (hook, explanation, payoff; about 25 s, palette colours only, no narration) that pass `validate --stage plan` under both built-in profiles; the agent edits them instead of writing scenes from the full schema. `starter` is the only template, and any other value is a usage error that lists the supported names. The agent then authors scenes and prepares media according to the schema and profile lock. To use a local profile, provide the directory containing its `profile.json`, `direction.md`, and referenced media/font files:

```sh
pnpm naraframe profile inspect profiles/general-explainer --json
```

The built-in profiles `current-issues` and `general-explainer` live under `profiles/`; run `naraframe profile list` to see them. For your own brand, prepare a profile directory with its assets. Include custom profiles and recipes when moving a project to another machine.

The agent reads `schema.capabilities` to find the available features before authoring a scene.

### Set the audio mode

Set `audioMode` in `naraframe.json` to match your brief. The engine reads the project mode first. If it is unset, it uses the profile default, then legacy rules. Profile locks still apply.

| Mode | Project content | Final export requirement |
| --- | --- | --- |
| `voice` | Narration, optionally with music | Ready narration matching the text/style |
| `music` | A music bed, without narration | A ready music bed |
| `silent` | No narration or soundtrack | No audio stream |

Set the mode explicitly for new projects. `silent` and `music` use scene `durationMs` values to determine video length; `voice` follows narration timing. Do not add empty narration to bypass checks. All three modes use the same export workflow: preview, approval, then `render`.

Use an existing voice recording or a take from your preferred TTS tool. Declare its intended spoken block in `narration.json`, prepare a timing package, then stage the capture through the public CLI:

```sh
pnpm naraframe audio stage PROJECT_PATH --from VOICE_FILE --timing TIMING_PACKAGE.json --block BLOCK_ID --json
pnpm naraframe edit PROJECT_PATH --from RETURNED_STAGING --expect RETURNED_SOURCE_REVISION --summary "Import the reviewed voice take" --json
```

The engine copies unchanged bytes, measures duration and checks the supplied audio/text/cue bindings. A pending listening receipt allows draft review but blocks production. After reviewing the actual words and phrase boundaries, record the reviewer and timestamp in the timing package and stage it again. [Prepared audio and series identity](../skills/naraframe/prepared-audio.md) documents the package and workflow. Listening confirms a take; silence detection alone does not confirm what was said. Existing ready narration without a prepared receipt keeps its legacy path.

Use your preferred TTS tool or record your own voice, then give the audio to the agent. The CLI does not call TTS providers automatically. If you change the spoken copy, update the audio. A visual headline change does not always require new narration.

### Reuse a composition

Inspect the [starter catalog](../library/starter/README.md) before rebuilding an object or diagram:

```sh
pnpm naraframe library inspect library/starter/catalog.json --json
pnpm naraframe library stage PROJECT_PATH --from library/starter/catalog.json --pattern anchored-note --version 1.0.0 --instance lesson --scene asset-swap --params EPISODE_PARAMS.json --json
```

The returned staging directory and source revision feed ordinary `edit`, just like an audio import. Each pattern describes its complete parameters. The project captures the selected template, assets and version; rendering does not fetch a mutable catalog. Ordinary source edits remain editable, and catalog updates require an explicit revision.

Use [the library guide](../skills/naraframe/library.md) for pinned revisions, image crop/ROI and prop anchors. [Study Notes](../library/series/study-notes/README.md) provides a reusable intro overlay, persistent signature and sign-off during a narration hold. Their schematic artwork and typography illustrate the authoring contracts; choose your production artwork and framing for the actual story.

### Caption choices

Keep the voice and choose how much caption text to show: `full`, `selected`, or `none`. Set the policy in `captions.json`; selected cues refer to the project's measured narration phrases. Caption revisions do not regenerate voice. The profile supplies styling and can lock the policy; permitted style overrides can change font size, spacing or scrim opacity. See the [caption guide](../skills/naraframe/captions.md) for source examples and ordinary revision steps.

The skill also includes [six editable art-direction patterns](../skills/naraframe/art-direction.md), from explanatory objects and route diagrams to a quiet held shot. Adapt them to the story and profile rather than applying one entrance to every scene.

### Quick previews and final review

```sh
pnpm naraframe validate ../my-videos/new-video --stage plan --json
pnpm naraframe preview ../my-videos/new-video --draft --scene SCENE_ID --json
pnpm naraframe preview ../my-videos/new-video --resolution 1080 --json
```

Replace `SCENE_ID` with an ID from `scenes.json`. Previews default to 540×960. `--resolution 1080` renders directly at 1080×1920 rather than enlarging a 540 video.

Use `--draft` while some production requirements are incomplete. Audio conflicts, invalid source, and untrusted recipes still block preview.

A single-scene preview starts at time zero. It includes that scene's SFX but omits the project's music bed. For final approval, review the full preview with the actual audio. Keep an eye on source image resolution too: a 1080 render cannot add detail to a small photo.

## 5. Revisions, undo, and profile switching

Ask for changes such as "shorten the headline," "slow down the camera," or "replace the photo." The agent updates the project source. To record changes and make them undoable, it stages the revised files and runs `edit`:

```sh
pnpm naraframe status ../my-videos/new-video --json
pnpm naraframe outline ../my-videos/new-video
pnpm naraframe outline ../my-videos/new-video --scene SCENE_ID --json
pnpm naraframe edit ../my-videos/new-video --from ../my-videos/new-video-edit --expect SOURCE_REVISION --summary "Shorten the headline" --json
pnpm naraframe validate ../my-videos/new-video --stage plan --json
pnpm naraframe preview ../my-videos/new-video --draft --json
```

`outline` is a read-only map of the project: its current revision, and each scene's id, role, timing, transition, camera, claims, note, layer ids with text and frames, beats with timings and params, plus narration blocks with their phrases (no word lists), the captions mode and asset ids. Use it to find the scene, layer and beat ids to change without reading whole files; an invalid project exits 1 with the same issues as `validate --stage plan`. Without `--json` it prints one line for the project and one per scene. Add `--scene <scene-id>` to narrow it to one scene in full detail, with only the narration blocks and assets that scene uses; the human form then lists that scene's layers and beats, and an unknown id is `SCENE_NOT_FOUND` (exit 1).

Put only changed source files in `../my-videos/new-video-edit`. Preserve the project's relative file structure, such as `scenes.json` or `assets/manifest.json` alongside new media. Replace `SOURCE_REVISION` with the `sourceRevision` returned by `status`.

`REVISION_CONFLICT` means the project changed since you last read its status. Read status again, adjust the revision, and retry.

```sh
pnpm naraframe undo ../my-videos/new-video --json
pnpm naraframe preview ../my-videos/new-video --draft --json
```

One `undo` restores one revision. To go back four revisions, run it four times. Undo does not call a provider, though assets added by a reverted edit may remain on disk.

The `edit` result includes `data.reuse` for voice, images, and scenes. Check music, SVG, and font files and hashes separately because the report does not cover all of them. In a preview result, `reusedFromBuildId` means the engine reused pixels from an earlier build.

### Switch profiles

```sh
pnpm naraframe profile apply test-fixtures/profiles/contrast ../my-videos/quickstart-general --dry-run --json
pnpm naraframe profile apply test-fixtures/profiles/contrast ../my-videos/quickstart-general --json
pnpm naraframe validate ../my-videos/quickstart-general --stage plan --json
pnpm naraframe preview ../my-videos/quickstart-general --draft --json
pnpm naraframe undo ../my-videos/quickstart-general --json
```

Read the dry-run result before applying a profile. It lists profile changes, lock conflicts, retained overrides, and areas that need another check. Pay attention to layout, narration, and identity bindings. The example above changes the video's appearance using the `contrast` profile.

`apply` records one revision. Copy and facts stay unchanged, and the agent must replace incompatible assets. `--reset-overrides` explicitly drops overrides; check its impact before using it.

After switching, check the layout through preview. Validation checks structure and some geometry; preview measures text. Fix the reported issues before rendering again. When text overflows, the engine can check collisions and off-canvas positions only after it fits. You may need another correction pass.

## 6. Recipes and brand safety

Declarative compositions let the agent build scenes from text or rich-text layers, passive PNG/SVG assets, shapes/paths, and groups. Cameras, parallax, and world/overlay spaces control framing. The engine calculates motion from frames.

Use a recipe when a scene needs a custom local Remotion composition. Keep episode content in `params` so the same recipe can serve the next episode.

Declare the recipe in the project. Its directory contains `recipe.json`, an entry, and the `.ts`/`.tsx` files listed in the manifest. The engine hashes those files and bundles the exact bytes approved by the owner. Code may import only React, Remotion, and listed local files. Changing code or the manifest requires new trust; changing params does not change the code hash.

After the owner reviews the code and approves that hash for this project, the agent may run:

```sh
pnpm naraframe recipe trust ../my-videos/new-video --recipe RECIPE_ID --authorized-by OWNER_NAME --json
```

Replace the placeholders with the recipe ID and the name of the owner who granted permission. This command records project-specific authorization; the agent cannot assume it applies to other projects. The engine performs static scanning, but recipes still run as trusted code without a sandbox. Do not run unfamiliar code just because it passes the scan.

Brand-managed profiles store brand identity, audience, editorial guidance, CTA, palette, and assets with assigned roles. Mark assets as `neutral` or give them the appropriate brand/role binding. Declarative text can also bind to the profile's brand name or CTA.

For recipes, the engine compares only identity/palette params listed in `recipe.json.bindings`. It does not fill in or rewrite their values.

Profile-switch dry runs include `plan.bindings.recipeParams` and coverage. A mismatched binding produces a draft warning and blocks production/final. Read `RECIPE_BINDING_COVERAGE` and `data.brand.recipes` to see which params are checked.

Recipes can opt into text-fit checks with `textSlots`. The engine resolves their styles from the profile and measures each declared slot before rendering. Overflow blocks preview; the recipe must use the supplied slot styles for that measurement to describe the rendered text. Array entries are measured independently.

Review undeclared params and marketing claims yourself. General recipe collisions and contrast still need frame inspection. Static scanning and declared-slot checks do not inspect arbitrary layout inside recipe code.

## 7. Project files, outputs, and commands

| File/directory | Purpose |
| --- | --- |
| `naraframe.json` | Identity, format, profile, overrides, audio mode, soundtrack, recipes, pinned library imports |
| `profile.lock.json` | The profile and direction pinned for the project |
| `scenes.json` | Visual story, layers/beats/camera, or recipe params |
| `assets/manifest.json`, `assets/`, `audio/` | Metadata, hashes, bindings, and local media |
| `narration.json` | Spoken copy blocks and audio/timing references; optional |
| `captions.json` | Caption none/selected/full policy and cue corrections; optional |
| `recipes/` | Local recipe code and manifests; optional |
| `revisions/` | Source history, approvals, and trust; do not edit manually |
| `.naraframe/` | Cache, staging, and compiled data; not authoring source |
| `preview/builds/<buildId>/` | `preview.mp4`, contact sheet, frames, report, manifest |
| `preview/current.json` | Pointer to the selected preview |
| `output/builds/<buildId>/` | `final.mp4`, report, manifest |
| `output/current.json` | Pointer to the selected final |

Open outputs using the paths in `artifacts`. The newest directory is not necessarily the selected build. To fix a video, change the project source and create a new preview. Let the engine manage its cache and build manifests.

When moving a project, include its source, profile lock, media, recipes, and required history. An MP4 alone is not enough to continue editing the project.

| Command | Purpose |
| --- | --- |
| `doctor` | Check the local runtime and tools |
| `version` | Read engine version, skill API, resource root and installation fingerprint |
| `schema` | Read public schemas and capabilities |
| `create … --profile … [--template starter]` | Create a project skeleton, optionally with a runnable three-scene starter plan |
| `validate … --stage plan` | Check source/compilation without rendering |
| `validate … --stage production` | Check production readiness; does not review frames |
| `preview … [--draft] [--scene …] [--resolution 540\|1080]` | Run preflight and create a review video |
| `preview … --rerender` | Render fresh frames instead of reusing a preview |
| `outline … [--scene …]` | Read-only map of scene, layer, beat and narration ids with timings and the current revision; one scene in full with `--scene` |
| `status …` | Read source, freshness, pointers, artifacts, and production needs |
| `edit … --from … --expect …` / `undo …` | Record revisions and restore the previous revision |
| `profile inspect …` / `profile apply … --dry-run` | Read a profile / plan a profile switch |
| `library inspect …` / `library stage …` | Inspect a versioned catalog / prepare pinned editable source |
| `audio stage … --from … --timing … --block …` | Capture an existing take and timing receipt for guarded edit |
| `recipe trust …` | Record code trust after owner authorization |
| `render … --approve-preview …` | Export a final from an approved full preview |
| `cache clean … --dry-run` | List removable cache files without deleting them |

Full command examples appear above and in the [skill](../skills/naraframe/SKILL.md). Add `--json` to read results from a script. Exit codes: `0` success, `1` source/readiness/preflight rejection, `2` system failure, `3` incorrect CLI usage, `130` SIGINT interruption.

For automation, use `pnpm --silent naraframe … --json` to keep pnpm's banner out of stdout. You can also call the built `packages/cli/dist/index.js` with Node, using an absolute path when working outside the checkout. The CLI writes one JSON event to stdout; progress and diagnostics go to stderr. Read `success`, `readiness`, and `issues` to decide what to do next. Export approval and recipe trust remain explicit when commands run from a script.

## 8. Troubleshooting and usage notes

| Symptom/issue | Next step |
| --- | --- |
| Wrong Node/pnpm version | Activate the pinned versions; do not rewrite the lockfile |
| Missing browser/FFmpeg | Install the tools, set their environment paths, and rerun `doctor` |
| `AUDIO_MODE_UNDECLARED` | Confirm timing and declare the non-voice project's audio mode for final export |
| `NARRATION_REQUIRED` / `MUSIC_REQUIRED` | Provide the required media; do not change the mode without the owner's decision |
| `PREPARED_AUDIO_PENDING` / `PREPARED_AUDIO_STALE` | Complete listening review or restage the changed audio/text/timing package; preserve the original take |
| `AUDIO_MODE_CONFLICT` / `AUDIO_MODE_LOCKED` | Correct the media/mode/lock; draft previews also refuse conflicts |
| `PREVIEW_STALE` / stale approval | Create and review a full preview of the current source |
| `TEXT_OVERFLOW` / `MIN_FONT_SIZE_VIOLATION` | Shorten/reflow copy or resize the box; check the draft-pixel units in the message |
| `IMAGE_MASK_INVALID` | Correct the radius against the resolved image/profile dimensions |
| `CONTRAST_UNVERIFIED` | Inspect text over artwork; information messages do not certify contrast |
| `RECIPE_NOT_TRUSTED` | Ask the owner to review code/hash; do not grant trust automatically |
| `RECIPE_BINDING_*` / `BRAND_*` | Read the dry run/coverage and update params, assets, or copy through `edit` |
| `REVISION_CONFLICT` | Read the current revision and reapply the change |
| `SYSTEM_ERROR` | Save the command, result, stderr, and runtime context; some causes still produce generic messages |
| `SKILL_ENGINE_CHANGED` | Inspect the intended engine/resources, then explicitly update the copied skill |
| `SKILL_INSTALL_EDITED` / `SKILL_INSTALL_CONFLICT` | Preserve local files and inspect the conflict; the installer will not overwrite them |

Stop a render with Ctrl-C/SIGINT so the engine has time to clean up. If the CLI receives SIGKILL, crashes, or runs out of memory, its render browser may remain alive. `cache clean` handles files only. Identify the render's processes before stopping them so you do not close Chrome sessions you are using.

Before a long render, check disk space and memory, and keep the machine awake. Avoid running several heavy renders at once.

### Before uploading

Review the full preview with the intended audio. Technical validation helps catch source and layout issues, but the project owner is responsible for visual review and fact-checking. Confirm permission to use the photos, music, and identities of people shown.

### Environment and security

Install NaraFrame from source or a supplied archive and operate it through a local skill or CLI. Upload to social platforms separately. Use your preferred tools to create images and voice; the engine does not generate paid media automatically.

Run only recipes whose code you trust. Bindings check declared params, and static scanning does not provide sandbox protection. Word-level synchronization needs appropriate word-timing data; phrase timing or silence detection is not enough to establish it.

If your workflow requires identical pixels or hashes across renders, verify the outputs. Bit-for-bit equality across renders is not guaranteed. Technical details and feature status are recorded in the [plan](plan.md).

## 9. Uninstall

Remove what you installed, in any order:

- **Claude Code plugin:** run `/plugin uninstall naraframe@naraframe`, then `/plugin marketplace remove naraframe` (removing the marketplace also uninstalls any plugin still installed from it).
- **A skill installed with the installer:** run `node "$NARAFRAME_ENGINE/scripts/install-skill.mjs" --host <codex|claude> --scope <project|user> [--project <dir>] --remove --json`. It removes only a receipt-owned installation and refuses a folder with local edits.
- **A skill folder you copied by hand:** delete the `naraframe` folder from the agent's skills folder.
- **The engine installed by your agent:** delete `~/.naraframe`, or the folder `NARAFRAME_HOME` points to.
- **An engine you built or unpacked yourself:** delete that folder (`$NARAFRAME_ENGINE`).

Projects, revisions, previews and exports live in your own project folders and are never removed by these steps. Node.js, Chrome and FFmpeg stay installed.

## Development and documentation

```sh
pnpm typecheck
pnpm build
pnpm test:unit
pnpm test:integration
pnpm verify
pnpm test:e2e
```

`verify` runs formatting/lint checks, typecheck, build, and unit/integration tests. E2E runs separately and renders real videos, so allow roughly 15 minutes or more. Run it serially as configured when the machine is not busy, and save complete logs. You do not need the full suite for everyday engine use or project copy revisions.

- [Spec](spec.md): product contract and acceptance criteria.
- [Refine spec](refine-spec.md): decisions, gaps, and evidence boundaries.
- [Plan](plan.md): milestones, handoffs, gates, and backlog/deferred items.
- [History](history/README.md): previous milestone records and workspace archive recovery.
- [Skill](../skills/naraframe/SKILL.md): agent/operator workflow and authoring semantics.
- [Fixture README](../test-fixtures/README.md): origins and scope of the included examples.
- [AGENTS.md](../AGENTS.md): contribution rules, FDD, and Git integration.

Keep production projects outside this checkout, for example in `../my-videos/`. The local `work/` directory is reserved for development scratch. Further MVP 2 work is tracked in M4; the capability registry lists only implemented forms with test evidence.

NaraFrame's code is released under the [MIT License](../LICENSE); third-party terms, including Remotion's, are in [THIRD-PARTY-NOTICES.md](../THIRD-PARTY-NOTICES.md). Media you add to your own projects keeps its own rights.
