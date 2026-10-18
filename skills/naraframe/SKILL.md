---
name: naraframe
description: Use when the user wants to make, revise, update, fix, preview or export a short vertical explainer video (for example an episode of a recurring social media series), wants a consistent look across a video series, or is working on a NaraFrame project.
---

# NaraFrame

## Start here

When a user is new to NaraFrame, tell them this briefly in plain words before asking for anything:

- NaraFrame makes vertical (9:16) explainer videos for a recurring series, on your own computer, from source files you can edit.
- A **profile** keeps the look, type, voice style and sourcing rules the same from episode to episode.
- Each episode goes preview, then your approval, then export of exactly the version you approved.
- Work is reused: an unchanged video is never rendered twice, one changed scene can be previewed on its own, prepared audio is imported once, library patterns are pinned, and a series can switch profile after a dry-run report.
- Before anything is exported it checks text fit, safe areas, transitions and corrupted frames.
- Verified on macOS Apple Silicon only.

Make this your first reply, as one message: these points in a few plain sentences, the question "is this a one-off video or a series?", and, when there is no engine (run its check first), the install options from *No engine*. Ask nothing else yet; series details come after the engine is ready (*Choosing a profile*, below).

Operate NaraFrame through its public CLI and authoritative project files. Keep the pinned profile in control of creative decisions and treat structured command results as the authority for readiness, repair, and resume decisions.

## Workflow

Match the request to one route below before reading anything else, then follow that route's guide.

| The request is | The route is |
| --- | --- |
| A specific edit, fix, update or text change in an existing project | [revisions.md](revisions.md) — go straight to `edit`, skip authoring |
| A new video or episode | [authoring.md](authoring.md) |
| A preview, review, approval or export | [export.md](export.md) |
| Captions display or styling | [captions.md](captions.md) |
| Narration, a prepared voice take or timing | [prepared-audio.md](prepared-audio.md) |
| A series look, brand or profile change | *Choosing a profile* below; a switch on an existing project is a revision ([revisions.md](revisions.md)) |
| A reusable catalog composition or supplied art | [library.md](library.md) |
| Visual direction, shot patterns, composition choices | [art-direction.md](art-direction.md) |
| The engine is missing, or install, update or troubleshooting | *Engine routes* and *No engine* below, then [installation.md](installation.md) |

Choose the engine route before authoring, in this order. Scripts live in this skill's folder: `<this-skill-folder>` below is `${CLAUDE_SKILL_DIR}` for a Claude Code plugin skill and the folder holding this SKILL.md otherwise. Never write into that folder; it may be a read-only cache.

1. **Launcher.** Run `node "<this-skill-folder>/scripts/naraframe.mjs" doctor --json` from the episode's working directory. The launcher finds the engine without a global command: with an `installation.json` receipt next to it (an explicit installer run) it uses and verifies the recorded engine; otherwise it uses `$NARAFRAME_HOME/engine/<version>` for the version in `engine.json`, with `NARAFRAME_HOME` defaulting to `~/.naraframe`. It checks the engine's version and API before forwarding argv and does not modify PATH or host permissions. Engine resources such as `library/` and `starter/` live under `resourceRoot` from `version --json`.
2. **Built source checkout.** Run from its root with `pnpm naraframe`, with the pinned Node and pnpm from `.node-version` and `packageManager`. Do not rewrite dependencies; if the runtime is unavailable, report a system blocker.
3. **No engine.** The launcher fails and there is no checkout, as in a skill folder copied from GitHub or installed from a plugin. Follow *No engine* below.

A route counts only if `doctor --json` through it returns a result. A launcher failure is one line, `CODE: message. Next: …`: treat it as "no engine for now" and do its `Next` step or report it; do not retry or work around it. Read [installation.md](installation.md) for install, update and troubleshooting. In every guide, substitute the selected invocation for `pnpm naraframe` and resolve bundled catalog/example paths from `resourceRoot` or the skill folder, not the episode's cwd.

### No engine

Without an engine nothing can be validated or rendered. Do not write episode source until one is installed. The user should not have to read documentation first.

1. Run `node "<this-skill-folder>/scripts/setup-engine.mjs" --check --json`. It only reads: prerequisites (Node 24.20.0, npm, Chrome or Chromium, FFmpeg/FFprobe, a font), the planned engine folder and size.
2. Send **one** plain message that is also your first reply (*Start here*): the points there, the one-off-or-series question and both install options. "Engine" is the part that checks and renders the video; say it that way and avoid other jargon. Fill the brackets from the check (`plan.approximateDiskMB`, `plan.engineDir`, `missingPrerequisites`):

   > [The *Start here* points, in a few plain sentences.] First question: is this a one-off video or a series?
   >
   > To make it I need one small program on your computer: NaraFrame's engine, the part that checks and renders the video. It is about [N] MB, usually installs in under a minute, and goes into [folder]. Nothing else on your computer changes. [If a tool is missing: I would also need [tool in plain words]; I can install it with [command].]
   >
   > 1. Install it now, and I carry on and build the video.
   > 2. Plan only: I write a shot-by-shot plan you can read, and install nothing.
   >
   > Which do you prefer for the program? You can switch later by saying "install the engine".

   Install and download nothing before the answer. Choosing 1 does not cover provider calls, recipe trust, final export or publishing.
3. Choice 1: run the listed prerequisite commands, then `node "<this-skill-folder>/scripts/setup-engine.mjs" --json`. It writes only under `NARAFRAME_HOME`, never into the skill folder.
4. Read the result. `ready: true` means the engine is installed and `doctor` is green through the launcher: continue with the user's request. Exit 3 means installed but a tool is still missing: install it, then rerun with `--check --json`. A failure line names its own next step.
5. Choice 2: write a **director-only plan** from [examples/director-plan.md](examples/director-plan.md) as a plain document, never as engine source, and create no `scenes.json`, `naraframe.json` or other file the engine reads: an unvalidated source looks finished when it is not. Keep its "not validated, not rendered" header and its last line, which tells the user how to continue. Once an engine exists, the plan is the brief for a normal project. Do not ask a second question after choice 2.

### With an engine

1. Run the engine route's `doctor --json`; resolve every structured system issue before previewing. `doctor` performs no download or render.
2. Run `schema --json` when you need field details: save the large result to a local file and inspect only the schema and capability entries you need, rather than repeatedly loading the entire output into context. Never reproduce schema definitions in this skill.
3. Establish state before creative edits. New project: choose the profile (*Choosing a profile*), run `create <project> --profile <id-or-path> --json`, then read the created `profile.lock.json`, including its pinned direction text, in [authoring.md](authoring.md). Existing project: run `status <project> --json`, then read `profile.lock.json` before revising in [revisions.md](revisions.md).
4. Work through the verification ladder below, stopping where the route's guide says. Only [export.md](export.md) leads to a final.

### Choosing a profile

Run `pnpm naraframe profile list --json` to show the built-ins: id, one-line purpose, whether sources are required, preferred length and voice style.

- One-off video, or the user is unsure: `general-explainer`, the neutral explainer. It does not require sources, but specific facts still need them (*Claims and sources*).
- News or current affairs: `current-issues`. It requires sources: ask the user for them and never invent or guess one to pass `requireSourcing`.
- A series or a brand: after the engine is ready, ask for the series name, a background colour and an accent colour (and the language of the narration), then turn colour words into hex values yourself (for example dark green `#0F3D2E`, yellow `#F5C518`) and say which ones you picked so the owner can change them after the first preview. From the workspace folder, run `pnpm naraframe profile new <workspace>/profiles/<series-id> --from general-explainer --name "<series name>" --background <hex> --accent <hex> [--text <hex>] [--language <text>] --json`, with `--language` written as the audience would name it (for example "bahasa Indonesia"). The engine picks the text, panel and outline colours, checks they read well and checks the profile. Fill in the audience and voice lines of its `direction.md` from the user's answers, then `create <project> --profile <that-folder>`. Do this before the first episode so every episode starts from the same profile.

### The verification ladder, cheapest first

1. `validate <project> --stage plan --json` after every source edit — compile-time checks without rendering: schema and reference errors, timing windows, static layer bounds, counts and phrase anchors. Use each issue's `code`, `responsible`, `artifact`, `path`, `message` and `suggestion` to decide who repairs what, and validate again after repairs. Visual preflight runs only in `preview`, so a valid plan can still fail there.
2. `preview <project> --draft --json`, optionally adding `--scene <id>` for a short local check — the first visual check (text overflow and collisions, text leaving the screen under camera, motion carrying text out of the safe zone, font loading, masks). A preflight failure is rejected in seconds, before any frame is rendered, and lists every measurable problem at once: repair them in one pass, and treat any visual-preflight issue as a source/profile repair, not a renderer override. Details: [authoring.md](authoring.md).
3. Inspect the exact `artifacts` of the successful build before any feedback or approval; start with `artifacts.storyboardPng`. Metadata alone is not visual acceptance. Details: [export.md](export.md).
4. `status <project> --json` to resume or verify. Continue only from its authoritative current build and reported artifacts; a stale preview must be rebuilt.
5. `validate --stage production` and, when the user has approved a reviewed preview, `render --approve-preview <build-id>` — the only route to a final ([export.md](export.md)).

## Claims and sources

The engine never detects claims; it trusts the labels you write. A factual claim is a statement about the world presented as true: a cause, quantity, date, place, or named person or event. Questions, instructions, opinions marked as such and on-screen labels are not claims. Decide per scene and per narration block, from the words the viewer reads or hears, and ask the user about facts you cannot verify.

- Label each claim with `carriesFactualClaim: true` on the scene in `scenes.json` or the block in `narration.json`; leave it `false` only when nothing is claimed, and never copy `false` from an example. Say why in the scene `note`.
- Declare each source once under `sources` (`id`, `title`, optional `url` and `retrievedAt`) in either file, then cite it from `sourceIds`: a labelled claim without a source is `SOURCE_MISSING`, a cited id that is not declared is `SOURCE_UNKNOWN`.
- If the owner has no sources and the profile does not set `requireSourcing`, ask once: "Should I make this one without sources?" On a yes, record it through an ordinary `edit` of `naraframe.json` as `"sourcing": { "ownerDecision": "no-sources", "decidedBy": "<their name, or \"owner\" if they have not given one>", "decidedAt": "<now, ISO 8601 with offset>", "reason": "<their words, short>" }`: the per-claim warnings then become one `SOURCES_WAIVED` info note and claims stay labelled. Never write it unasked, and it never relaxes a profile that requires sourcing.
- When `requireSourcing` is set and nothing is labelled, `validate` reports one `CLAIMS_UNLABELLED` info issue; it never blocks. Full rules and the label decision list: [authoring.md](authoring.md).

## Boundaries

- Treat one newline-terminated `CommandResultEvent` on stdout as the machine result; diagnostics and progress on stderr are not the result.
- Stop on `success: false`. Repair agent-responsible source issues, ask the user for user-responsible choices, and surface system-responsible dependency issues.
- Never import private package modules, write `.naraframe/compiled.json`, write preview metadata, or invent identifiers absent from the result. Never edit generated preview files.
- A `preview` is a labelled `DRAFT` review build. Only `render` with an approval produces a final, and a final is not a publication: never call output published or publish-ready.
- Call only `version`, `doctor`, `schema`, `create`, `validate --stage plan`, `status`, `validate --stage production [--scene <id>]`, `recipe trust` (only as described in [authoring.md](authoring.md)), `preview` (with or without `--draft`, optionally `--scene <id>` and `--resolution 540|1080`), `edit`, `history`, `undo`, `render`, `cache clean` ([export.md](export.md)), `profile list|new|inspect|apply`, `library inspect|stage` (as described in [library.md](library.md)), and `audio stage` (as described in [prepared-audio.md](prepared-audio.md)); do not advertise or guess future commands.
- Prefer `edit` over rewriting files in place when a change should be reviewable or undoable. A new project's first `scenes.json` is written straight into the project folder; once the first preview or `edit` has captured it, change source through `edit`. Full flow: [revisions.md](revisions.md).
- Direct edits to the JSON files are still detected and captured as a revision before the next preview or edit; an invalid working copy is reported and left untouched.
