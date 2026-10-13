# NaraFrame

NaraFrame is an agent-driven tool for producing vertical brand videos, promos, and explainers. Give Claude Code or Codex a brief, review the preview, and export your video as a 1080×1920 MP4.

Use NaraFrame for recurring content: save your visual identity in a profile, prepare your brand assets, and reuse compositions across episodes. Each project keeps its own copy, photos, crops, and timing, so you can revise the content without rebuilding the composition.

The engine runs locally with TypeScript and Remotion. The NaraFrame skill guides your agent through project authoring and CLI commands. You can use the skill for everyday production or operate the CLI yourself.

## What you can do

- Save fonts, colors, editorial guidance, and your brand's CTA in a profile. Use the same profile across projects.
- Ask for changes such as "shorten the headline" or "slow down the camera." Your agent updates the project without requiring you to edit renderer code.
- Build scenes from text layers, SVG illustrations, paths, and cameras, or use a parameterized Remotion recipe for a custom composition.
- Check individual scenes at 540 resolution, then review the full video at native 1080 before export. Choose narration, music only, or silent output.
- Keep a revision history, undo changes, and reuse media and preview builds that still match the project.
- Check name, CTA, and asset bindings when switching brand profiles. The engine blocks final export when declared content has incompatible bindings.

NaraFrame suits a series with a consistent identity, such as tutor introductions, service explainers, or progress reports. Keep the assets and composition while changing the message for each episode.

The workflow is straightforward: choose a profile, provide a brief and media, review the preview, revise as needed, then approve the export. You get a local MP4 file to upload to Reels, TikTok, or another platform.

## Start here

- [Install the engine](#1-install-the-engine).
- [Install the skill in Codex or Claude Code](#2-install-the-skill).
- [Follow the quickstart to a final MP4](#3-quickstart-to-a-final-mp4) using the included media.
- [Create your own video](#4-create-your-own-video).
- [Revise, undo, and switch profiles](#5-revisions-undo-and-profile-switching).
- [Use recipes and brand bindings](#6-recipes-and-brand-safety).
- [Find troubleshooting and usage notes](#8-troubleshooting-and-usage-notes).

## 1. Install the engine

### Requirements

This installation guide covers macOS with local Chrome and FFmpeg. Windows and Linux support has not been verified.

| Component | Requirement |
| --- | --- |
| Git | Access to this repository; private repositories require authentication |
| Node.js | `24.20.0`, as pinned in [.node-version](.node-version) |
| pnpm | `12.3.4`, as pinned in [package.json](package.json) |
| Browser | An installed Chrome/Chromium executable; the engine does not download one |
| Media tools | Installed `ffmpeg` and `ffprobe` executables |
| Fonts | A readable local font; profiles with custom fonts also need their font assets |

You need internet access to fetch the repository and dependencies. After setup, the engine renders from local files. Prepare your images and audio separately; installation does not generate them.

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
```

Continue when doctor reports `success: true` and `readiness: "ready"`. It checks your machine without downloading files or rendering video. You can set `NARAFRAME_FONT_FILE` to a local font for the doctor check. Project fonts still come from the profile and its assets.

After pulling repository updates, activate the pinned runtime and run `pnpm install --frozen-lockfile` and `pnpm build` again.

## 2. Install the skill

The skill tells your agent how to operate the engine. Its source is [skills/naraframe/SKILL.md](skills/naraframe/SKILL.md). Install the `naraframe` folder after the engine is ready.

Run the commands below from the repository root. The symlink lets your agent read the skill directly from this checkout, including future updates. If you move the repository, update the link.

The commands stop if the destination already exists, including a broken symlink. Check an existing installation before replacing it.

### Local Codex

```sh
mkdir -p "$HOME/.agents/skills"
test ! -e "$HOME/.agents/skills/naraframe" && test ! -L "$HOME/.agents/skills/naraframe" && ln -s "$PWD/skills/naraframe" "$HOME/.agents/skills/naraframe"
```

Open the NaraFrame project in Codex and invoke `$naraframe`. If the skill does not appear, start a new session. For a repository-scoped installation, use `.agents/skills/naraframe`; see the [Codex skills documentation](https://learn.chatgpt.com/docs/build-skills).

### Local Claude Code

```sh
mkdir -p "$HOME/.claude/skills"
test ! -e "$HOME/.claude/skills/naraframe" && test ! -L "$HOME/.claude/skills/naraframe" && ln -s "$PWD/skills/naraframe" "$HOME/.claude/skills/naraframe"
```

Start Claude Code from the repository root and invoke `/naraframe`. For a repository-scoped installation, use `.claude/skills/naraframe`. See the [Claude Code skills documentation](https://code.claude.com/docs/en/skills) for details.

Your agent needs terminal and local file access to run NaraFrame. A skill in your machine's personal folder is not automatically available in Claude Cowork or cloud sessions. If you upload the skill to a chat, that environment still needs the engine, tools, and project media.

### Example brief

Replace the details in square brackets. Invoke `$naraframe` in Codex or `/naraframe` in Claude Code before using this prompt:

```text
Use NaraFrame from this checkout through its public CLI. Do not change the engine.
Create a [20–30 second] vertical video for [brand], aimed at [audience].
Main message: [one message]. CTA: [action and destination].
Profile: [profile ID or path]. Audio: [voice / music / silent].
Allowed assets: [paths and usage permissions].

Run doctor and read the schema and profile first.
Save a new project in ../NaraFrame-projects/[project-name]. Do not overwrite other projects.
Use declarative compositions or an already trusted recipe.
Ask before creating or trusting new recipe code.
For voice, request an approved script and audio file if they are missing.
Do not use paid providers or generate new media without permission.
Show a full 1080 preview and contact sheet for review.
Stop before final render until I approve the preview.
```

Let the agent handle schemas and project files. Provide the brief, confirm the facts and media permissions, and review the preview. If the agent needs new recipe code, it must ask for your permission.

## 3. Quickstart to a final MP4

Start with the [coral reef example](test-fixtures/project-general-explainer). The repository includes its PNG images, MP3 narration, and profile lock, so you can create a video without preparing TTS or an API key.

Run every command from the repository root. If one fails, resolve the problem before continuing.

### Copy the example source into a new project

Use a new directory. If `../NaraFrame-projects/quickstart-general` already exists, choose another name to preserve the existing project.

```sh
mkdir -p ../NaraFrame-projects
mkdir ../NaraFrame-projects/quickstart-general
cp test-fixtures/project-general-explainer/naraframe.json test-fixtures/project-general-explainer/scenes.json test-fixtures/project-general-explainer/profile.lock.json test-fixtures/project-general-explainer/narration.json ../NaraFrame-projects/quickstart-general/
cp -R test-fixtures/project-general-explainer/assets test-fixtures/project-general-explainer/audio ../NaraFrame-projects/quickstart-general/
```

These commands copy source and media into the new project. The engine creates its own previews, cache, and revision history.

### Validate and preview

```sh
pnpm naraframe validate ../NaraFrame-projects/quickstart-general --stage plan --json
pnpm naraframe validate ../NaraFrame-projects/quickstart-general --stage production --json
pnpm naraframe preview ../NaraFrame-projects/quickstart-general --resolution 1080 --json
pnpm naraframe status ../NaraFrame-projects/quickstart-general --json
```

Production validation returns `ready`. The preview is native 1080×1920, labeled `DRAFT • WITH AUDIO`, and lasts about 18.7 seconds. Because this example already has narration, the engine resolves its audio mode to `voice`. The command reports the mode's source as `legacy` because the example does not explicitly set `audioMode`.

You may see `CONTRAST_UNVERIFIED` information messages. The engine cannot assess text contrast over some moving or transparent panels. Check those areas in the preview.

Preview runs visual preflight before rendering frames. This step can find problems that `validate` does not catch.

Open `artifacts.previewMp4` and `artifacts.contactSheetPng`. Listen to the narration and check the text, crops, and scene transitions. Keep the preview's `buildId` for the export step.

### Export after the owner approves the full preview

Replace the `APPROVED_BUILD_ID` placeholder with the ID from the preview above.

```sh
pnpm naraframe render ../NaraFrame-projects/quickstart-general --approve-preview APPROVED_BUILD_ID --json
pnpm naraframe status ../NaraFrame-projects/quickstart-general --json
```

A successful result reports `success: true` and `mode: "final"`. Open the MP4 at `artifacts.finalMp4`: H.264 at 1080×1920, 30 fps, with AAC audio and no DRAFT label. The manifest records the source and approval used for the export.

Use `--approve-preview` after the project owner approves the full preview. Any later source change makes that approval stale and requires a new preview review. The `--autonomous --authorized-by <name>` option requires the owner's explicit permission to export without a preview review.

Before uploading, check the facts and media permissions, including music, photos, and the identities of people shown. MP4 export does not check publication rights.

## 4. Create your own video

### Choose a profile and create a project

```sh
pnpm naraframe schema --json
pnpm naraframe profile inspect current-issues --json
pnpm naraframe create ../NaraFrame-projects/new-video --profile current-issues --json
```

`create` makes a project skeleton for the agent to fill in. The agent then authors scenes and prepares media according to the schema and profile lock. To use a local profile, provide the directory containing its `profile.json`, `direction.md`, and referenced media/font files:

```sh
pnpm naraframe profile inspect test-fixtures/profiles/general-explainer --json
```

The `current-issues` profile is available under `profiles/`. You can also browse example profiles under `test-fixtures/profiles/`. For your own brand, prepare a profile directory with its assets. Include custom profiles and recipes when moving a project to another machine.

The agent reads `schema.capabilities` to find the available features before authoring a scene.

### Set the audio mode

Set `audioMode` in `naraframe.json` to match your brief. The engine reads the project mode first. If it is unset, it uses the profile default, then legacy rules. Profile locks still apply.

| Mode | Project content | Final export requirement |
| --- | --- | --- |
| `voice` | Narration, optionally with music | Ready narration matching the text/style |
| `music` | A music bed, without narration | A ready music bed |
| `silent` | No narration or soundtrack | No audio stream |

Set the mode explicitly for new projects. `silent` and `music` use scene `durationMs` values to determine video length; `voice` follows narration timing. Do not add empty narration to bypass checks. All three modes use the same export workflow: preview, approval, then `render`.

You can create audio in another tool and give the file to your agent. The agent places it under `audio/`, registers the file and hash in `assets/manifest.json`, and connects narration blocks in `narration.json`.

Record durations and pauses, plus phrase timing when available. `generation.textSha256` must match the spoken text. Listen to the audio to confirm each phrase. Use the fixture as a structural example, but calculate hashes for your own files.

Use your preferred TTS tool or record your own voice, then give the audio to the agent. The CLI does not call TTS providers automatically. If you change the spoken copy, update the audio. A visual headline change does not always require new narration.

### Quick previews and final review

```sh
pnpm naraframe validate ../NaraFrame-projects/new-video --stage plan --json
pnpm naraframe preview ../NaraFrame-projects/new-video --draft --scene SCENE_ID --json
pnpm naraframe preview ../NaraFrame-projects/new-video --resolution 1080 --json
```

Replace `SCENE_ID` with an ID from `scenes.json`. Previews default to 540×960. `--resolution 1080` renders directly at 1080×1920 rather than enlarging a 540 video.

Use `--draft` while some production requirements are incomplete. Audio conflicts, invalid source, and untrusted recipes still block preview.

A single-scene preview starts at time zero. It includes that scene's SFX but omits the project's music bed. For final approval, review the full preview with the actual audio. Keep an eye on source image resolution too: a 1080 render cannot add detail to a small photo.

## 5. Revisions, undo, and profile switching

Ask for changes such as "shorten the headline," "slow down the camera," or "replace the photo." The agent updates the project source. To record changes and make them undoable, it stages the revised files and runs `edit`:

```sh
pnpm naraframe status ../NaraFrame-projects/new-video --json
pnpm naraframe edit ../NaraFrame-projects/new-video --from ../NaraFrame-projects/new-video-edit --expect SOURCE_REVISION --summary "Shorten the headline" --json
pnpm naraframe validate ../NaraFrame-projects/new-video --stage plan --json
pnpm naraframe preview ../NaraFrame-projects/new-video --draft --json
```

Put only changed source files in `../NaraFrame-projects/new-video-edit`. Preserve the project's relative file structure, such as `scenes.json` or `assets/manifest.json` alongside new media. Replace `SOURCE_REVISION` with the `sourceRevision` returned by `status`.

`REVISION_CONFLICT` means the project changed since you last read its status. Read status again, adjust the revision, and retry.

```sh
pnpm naraframe undo ../NaraFrame-projects/new-video --json
pnpm naraframe preview ../NaraFrame-projects/new-video --draft --json
```

One `undo` restores one revision. To go back four revisions, run it four times. Undo does not call a provider, though assets added by a reverted edit may remain on disk.

The `edit` result includes `data.reuse` for voice, images, and scenes. Check music, SVG, and font files and hashes separately because the report does not cover all of them. In a preview result, `reusedFromBuildId` means the engine reused pixels from an earlier build.

### Switch profiles

```sh
pnpm naraframe profile apply test-fixtures/profiles/contrast ../NaraFrame-projects/quickstart-general --dry-run --json
pnpm naraframe profile apply test-fixtures/profiles/contrast ../NaraFrame-projects/quickstart-general --json
pnpm naraframe validate ../NaraFrame-projects/quickstart-general --stage plan --json
pnpm naraframe preview ../NaraFrame-projects/quickstart-general --draft --json
pnpm naraframe undo ../NaraFrame-projects/quickstart-general --json
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
pnpm naraframe recipe trust ../NaraFrame-projects/new-video --recipe RECIPE_ID --authorized-by OWNER_NAME --json
```

Replace the placeholders with the recipe ID and the name of the owner who granted permission. This command records project-specific authorization; the agent cannot assume it applies to other projects. The engine performs static scanning, but recipes still run as trusted code without a sandbox. Do not run unfamiliar code just because it passes the scan.

Brand-managed profiles store brand identity, audience, editorial guidance, CTA, palette, and assets with assigned roles. Mark assets as `neutral` or give them the appropriate brand/role binding. Declarative text can also bind to the profile's brand name or CTA.

For recipes, the engine compares only identity/palette params listed in `recipe.json.bindings`. It does not fill in or rewrite their values.

Profile-switch dry runs include `plan.bindings.recipeParams` and coverage. A mismatched binding produces a draft warning and blocks production/final. Read `RECIPE_BINDING_COVERAGE` and `data.brand.recipes` to see which params are checked.

Review undeclared params and marketing claims yourself. For recipe scenes, inspect frames for text fit, collisions, and readability. Declarative visual preflight does not inspect layout inside recipe code.

## 7. Project files, outputs, and commands

| File/directory | Purpose |
| --- | --- |
| `naraframe.json` | Identity, format, profile, overrides, audio mode, soundtrack, recipes |
| `profile.lock.json` | The profile and direction pinned for the project |
| `scenes.json` | Visual story, layers/beats/camera, or recipe params |
| `assets/manifest.json`, `assets/`, `audio/` | Metadata, hashes, bindings, and local media |
| `narration.json` | Spoken copy blocks and audio/timing references; optional |
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
| `schema` | Read public schemas and capabilities |
| `create … --profile …` | Create a project skeleton |
| `validate … --stage plan` | Check source/compilation without rendering |
| `validate … --stage production` | Check production readiness; does not review frames |
| `preview … [--draft] [--scene …] [--resolution 540\|1080]` | Run preflight and create a review video |
| `preview … --rerender` | Render fresh frames instead of reusing a preview |
| `status …` | Read source, freshness, pointers, artifacts, and production needs |
| `edit … --from … --expect …` / `undo …` | Record revisions and restore the previous revision |
| `profile inspect …` / `profile apply … --dry-run` | Read a profile / plan a profile switch |
| `recipe trust …` | Record code trust after owner authorization |
| `render … --approve-preview …` | Export a final from an approved full preview |
| `cache clean … --dry-run` | List removable cache files without deleting them |

Full command examples appear above and in the [skill](skills/naraframe/SKILL.md). Add `--json` to read results from a script. Exit codes: `0` success, `1` source/readiness/preflight rejection, `2` system failure, `3` incorrect CLI usage, `130` SIGINT interruption.

For automation, use `pnpm --silent naraframe … --json` to keep pnpm's banner out of stdout. You can also run `node packages/cli/dist/index.js … --json` from the repository root after building. The CLI writes one JSON event to stdout; progress and diagnostics go to stderr. Read `success`, `readiness`, and `issues` to decide what to do next.

## 8. Troubleshooting and usage notes

| Symptom/issue | Next step |
| --- | --- |
| Wrong Node/pnpm version | Activate the pinned versions; do not rewrite the lockfile |
| Missing browser/FFmpeg | Install the tools, set their environment paths, and rerun `doctor` |
| `AUDIO_MODE_UNDECLARED` | Confirm timing and declare the non-voice project's audio mode for final export |
| `NARRATION_REQUIRED` / `MUSIC_REQUIRED` | Provide the required media; do not change the mode without the owner's decision |
| `AUDIO_MODE_CONFLICT` / `AUDIO_MODE_LOCKED` | Correct the media/mode/lock; draft previews also refuse conflicts |
| `PREVIEW_STALE` / stale approval | Create and review a full preview of the current source |
| `TEXT_OVERFLOW` / `MIN_FONT_SIZE_VIOLATION` | Shorten/reflow copy or resize the box; check the draft-pixel units in the message |
| `IMAGE_MASK_INVALID` | Correct the radius against the resolved image/profile dimensions |
| `CONTRAST_UNVERIFIED` | Inspect text over artwork; information messages do not certify contrast |
| `RECIPE_NOT_TRUSTED` | Ask the owner to review code/hash; do not grant trust automatically |
| `RECIPE_BINDING_*` / `BRAND_*` | Read the dry run/coverage and update params, assets, or copy through `edit` |
| `REVISION_CONFLICT` | Read the current revision and reapply the change |
| `SYSTEM_ERROR` | Save the command, result, stderr, and runtime context; some causes still produce generic messages |

Stop a render with Ctrl-C/SIGINT so the engine has time to clean up. If the CLI receives SIGKILL, crashes, or runs out of memory, its render browser may remain alive. `cache clean` handles files only. Identify the render's processes before stopping them so you do not close Chrome sessions you are using.

Before a long render, check disk space and memory, and keep the machine awake. Avoid running several heavy renders at once.

### Before uploading

Review the full preview with the intended audio. Technical validation helps catch source and layout issues, but the project owner is responsible for visual review and fact-checking. Confirm permission to use the photos, music, and identities of people shown.

### Environment and security

Install NaraFrame from source and operate it through a local skill or CLI. Upload to social platforms separately. Use your preferred tools to create images and voice; the engine does not generate paid media automatically.

Run only recipes whose code you trust. Bindings check declared params, and static scanning does not provide sandbox protection. Word-level synchronization needs appropriate word-timing data; phrase timing or silence detection is not enough to establish it.

If your workflow requires identical pixels or hashes across renders, verify the outputs. Bit-for-bit equality across renders is not guaranteed. Technical details and feature status are recorded in the [plan](docs/plan.md).

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

- [Spec](docs/spec.md): product contract and acceptance criteria.
- [Refine spec](docs/refine-spec.md): decisions, gaps, and evidence boundaries.
- [Plan](docs/plan.md): milestones, handoffs, gates, and backlog/deferred items.
- [History](docs/history/README.md): previous milestone records and workspace archive recovery.
- [Skill](skills/naraframe/SKILL.md): agent/operator workflow and authoring semantics.
- [Fixture README](test-fixtures/README.md): origins and scope of the included examples.
- [AGENTS.md](AGENTS.md): contribution rules, FDD, and Git integration.

Keep production projects outside this checkout, for example in `../NaraFrame-projects/`. The local `work/` directory is reserved for development scratch. MVP 2 is planned in M4; planned features are not part of the current capability registry.

The repository does not include a LICENSE file. Confirm permission before distributing code or media; their presence in the repository does not automatically grant redistribution rights.
