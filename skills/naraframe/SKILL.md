---
name: naraframe
description: Use when creating, validating, previewing, resuming, or revising a NaraFrame motion explainer project.
---

# NaraFrame

Operate NaraFrame through its public CLI and authoritative project files. Keep the pinned profile in control of creative decisions and treat structured command results as the authority for readiness, repair, and resume decisions.

## Workflow

Run commands from the NaraFrame repository root with `pnpm naraframe`. Before the first command, activate the Node and pnpm versions pinned in `.node-version` and `packageManager`; do not let an ambient runtime rewrite dependencies. If the pinned runtime is unavailable, report that system blocker instead of treating a failed package-manager preflight as a NaraFrame result.

1. Run `pnpm naraframe doctor --json`. Resolve every structured system issue before previewing; `doctor` performs no download or render.
2. Run `pnpm naraframe schema --json` and use the returned schemas when creating or repairing source. Do not reproduce schema definitions in this skill.
3. Establish the project and profile before creative edits:
   - New project: run `pnpm naraframe create <project> --profile <id-or-path> --json`, then read the created `profile.lock.json`, including its pinned direction text.
   - Existing project: run `pnpm naraframe status <project> --json`, then read that project's `profile.lock.json` before revising it.
4. Before editing scenes, turn the pinned profile direction into a short shot rundown: one dominant statement per shot, the intended `display`/`heading`/`body`/`label` roles, the main media crop/focal point, and the semantic reveal/emphasis/focus beats. Keep these decisions in the profile or authoritative scene source, never in renderer code.
5. Edit only authoritative source such as `naraframe.json`, `scenes.json`, and `assets/manifest.json`, following the returned schema and pinned profile direction. Prefer bounded `stack`/`grid` groups for repeated content, declare text limits and avoidance targets, and declare image crop, focal point, radius, stroke, and shadow when profile defaults are insufficient. Never edit generated preview files.
6. Run `pnpm naraframe validate <project> --stage plan --json`. Use each issue's `code`, `responsible`, `artifact`, `path`, `message`, and `suggestion` to decide who should repair what; validate again after repairs.
7. Run `pnpm naraframe preview <project> --draft --json`, optionally adding `--scene <scene-id>`. Treat any visual-preflight issue as a source/profile repair, not a renderer override.
8. Inspect the video and contact sheet at the exact paths in the successful result's `artifacts`. Review scene entry, settled, beat peak, transition/final states, and any requested editorial timestamps; check masks during motion, hierarchy, overflow, collisions, and whether the sequence reads as composed shots rather than slides. Metadata alone is not visual acceptance.
9. Run `pnpm naraframe status <project> --json` to resume or verify. Continue only from its authoritative current build and reported artifacts. A stale preview must be rebuilt and inspected.
10. For revisions, reread the pinned profile, edit authoritative source, then repeat validation, preview inspection, and status verification. Shorten/reflow copy or change layout bounds before reducing text below the profile minimum.

## Boundaries

- Treat one newline-terminated `CommandResultEvent` on stdout as the machine result; diagnostics and progress on stderr are not the result.
- Stop on `success: false`. Repair agent-responsible source issues, ask the user for user-responsible choices, and surface system-responsible dependency issues.
- Never import private package modules, write `.naraframe/compiled.json`, write preview metadata, or invent identifiers absent from the result.
- M0 output is a labelled, muted, `draft-only` preview. Do not claim narrated, production, final, or publish-ready status.
- Call only `doctor`, `schema`, `create`, `validate --stage plan`, `status`, `validate --stage production [--scene <id>]`, `preview` (with or without `--draft`, optionally `--scene <id>`), `edit`, `undo`, `render`, `cache clean`, and `profile inspect|apply`; do not advertise or guess future commands.
- Prefer `edit` over rewriting files in place when a change should be reviewable or undoable: put only the changed source files in a staging directory laid out like the project, read the current revision from `status` (`sourceRevision`), then run `pnpm naraframe edit <project> --from <staging-dir> --expect <sourceRevision> --summary "<what changed>" --json`. `REVISION_CONFLICT` means the project moved on: re-read `status`, re-apply the change, retry. The result carries `data.reuse`: how much of the previous revision's voice, images, and scenes survived, and the recorded cost against a full regeneration (unknown or untracked spend stays visible and is never guessed). `undo` restores the previous accepted revision without any provider call; receipts and spend are never rolled back.
- A final export needs `validate --stage production` to pass and one approval. Run a full narrated `preview --draft`, have the owner review it, then `pnpm naraframe render <project> --approve-preview <build-id> --json`. Use `--autonomous --authorized-by <name>` only when the owner has said in chat that you may export without reviewing a preview; never add it on your own initiative. An approval covers one source revision: after any edit, review a new preview. Report the export from `artifacts.finalMp4` and do not call it published.
- Know which route a project is on. **Silent draft**: no `narration.json`; only `preview --draft` works and it is labelled `DRAFT • NO AUDIO`; `render` refuses it with `NARRATION_REQUIRED`. **Prepared media**: audio made elsewhere (for example in an online text-to-speech tool) is placed under `audio/`, declared as a ready `mp3`/`wav`/`m4a` asset with its `generation.textSha256`, and referenced from `narration.json`; the preview is labelled `DRAFT • WITH AUDIO` and can be exported. **Generated**: calling a voice provider from NaraFrame is not available through the CLI yet; every real paid call needs the owner's authorisation and a receipt in `production.json`, so never spend or call a provider on your own.
- To check or review one scene while others are unfinished, use `--scene <id>`: `validate --stage production --scene <id>` and `preview --scene <id>` (no `--draft`) require only that scene and its dependencies to be ready, and list other scenes' gaps as `info`. A final `render` still needs everything. A preview of a scene starts at time zero; its global position may be unknown (null) until earlier blocks have audio.
- After a change that cannot alter pixels, such as a scene `note`, `preview` reuses the earlier build's pixels and reports `reusedFromBuildId`; you still need a fresh review and approval for the new revision. Use `--rerender` only when you need a real render.
- `profile inspect <id-or-path>` shows a profile without a project. `profile apply <id-or-path> [project] --dry-run` lists changes, effects (recompile, revalidate-layout, regenerate-narration, replace-assets, editorial-review), kept overrides and conflicts without touching anything. A plain `apply` commits one revision and `undo` restores the old profile. An override the new profile locks or no longer allows blocks apply; `--reset-overrides` drops it explicitly and undo brings it back.
- After a profile change the draft still compiles. Voice made with the old style shows in `status` under `needsProduction`; final export waits until it is regenerated.
- Project `overrides` in `naraframe.json` (dotted paths such as `render.palette.accent`) sit on top of the pinned profile. Locked or undeclared paths are validation errors.
- `soundtrack` in `naraframe.json`: one `music` track (volume, loop, trimStartMs, fadeInMs, fadeOutMs, optional `duck`) and `sfx` entries anchored to a scene (`sceneId`, `offsetMs`). It never changes video length. Scoped previews carry only their own effects, no music. A planned audio asset is skipped in drafts and blocks final. `MUSIC_MAY_MASK_NARRATION` warns when music under speech is above 0.35.
- `cache clean --dry-run` shows what would be removed; it never touches source, history, receipts, approved or selected builds, or exports.
- Direct edits to the JSON files are still detected and captured as a revision before the next preview or edit; an invalid working copy is reported and left untouched.
