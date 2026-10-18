# Revising an existing project

Read this when the request is a specific edit, fix, update or change in an existing project: go straight to `edit` and skip authoring. Reload [authoring.md](authoring.md) only when the change needs space, camera or timing decisions.

## Read before you change

Run `status <project> --json` and read the project's `profile.lock.json`. Then find what to change without reading whole files:

1. `outline <project>` (human form) prints one line for the project, with its current revision, and one line per scene with its id, role, length and counts. Pick the scene.
2. `outline <project> --scene <id> --json` returns that scene in full: layer ids with text and frames, beat ids with timings and params, camera, claims and note, plus only the narration blocks and assets it uses. An unknown id is `SCENE_NOT_FOUND`. Add `--scene <id>` for the human form to list its layers and beats.
3. Build the change as a staged copy of just that scene: put the project's `scenes.json` (and `narration.json` if it changes) in the staging directory with a targeted `jq` update of that scene's entry, for example `jq '(.scenes[] | select(.id == "<id>") | .visual.layers[] | select(.id == "<layer>") | .text) = "<new text>"' <project>/scenes.json > <staging-dir>/scenes.json`. Do not read the whole file into context.

Prefer `edit` over rewriting files in place when a change should be reviewable or undoable: put only the changed source files in a staging directory laid out like the project, read the current revision from `status` (`sourceRevision`, also `outline`'s `currentRevision`), then run `pnpm naraframe edit <project> --from <staging-dir> --expect <sourceRevision> --summary "<what changed>" --json`. `REVISION_CONFLICT` means the project moved on: re-read `status`, re-apply the change, retry. The result carries `data.reuse`: how much of the previous revision's voice, images, and scenes survived, and the recorded cost against a full regeneration (unknown or untracked spend stays visible and is never guessed).

To delete an optional source file in the same revision add `--remove narration.json` and/or `--remove captions.json` (repeatable, no other file is accepted; `--from` becomes optional when only removing): `REMOVE_NOT_ALLOWED` names a required or unknown file, `REMOVE_TARGET_ABSENT` a file the project does not have.

`history <project> [--limit <n>]` lists the accepted revisions behind the project, newest first, each with its short id, kind (`baseline`, `edit`, `manual-capture`), time and summary, and marks the current one (`*` in text, `current: true` in `data.revisions`); it only reads. Run it before `undo` to see which revision one `undo` returns to (the one listed after the current). `undo` restores the previous accepted revision, including a removed file, without any provider call; receipts and spend are never rolled back. A revision you undid is no longer in the list, and `history` does not show direct edits not yet captured.

A new project's first `scenes.json` is written straight into the project folder. Once the first preview or `edit` has captured it, change source through `edit`. Direct edits to the JSON files are still detected and captured as a revision before the next preview or edit; an invalid working copy is reported and left untouched.

## The correction loop

For revisions, reread the pinned profile and use ordinary `edit` revisions, then repeat validation, preview inspection, and `status` verification ([authoring.md](authoring.md) has the build loop; [export.md](export.md) has inspection).

- "Make the point clearer" changes headline/hierarchy/object; "give it breathing room" changes beat/camera start and duration plus the settled hold.
- Shorten/reflow copy or change layout bounds before reducing text below the profile minimum.
- Plan at most two internal correction passes per checkpoint, retain failed attempts and report remaining issues.

Changing `audioMode`, `overrides` or `sourcing` is an ordinary `edit` of `naraframe.json`; the mode rules, the voiced-to-silent recipe and their error codes are in [export.md](export.md).

## Profile switches

`profile list` shows the built-in profiles; `profile inspect <id-or-path>` shows one profile without a project. `profile apply <id-or-path> [project] --dry-run` lists changes, effects (recompile, revalidate-layout, regenerate-narration only when the project has narration, replace-assets, editorial-review), kept overrides and conflicts without touching anything. When the palette, direction or illustration style changes, `plan.review` also names the scene content to look at: `paletteBound` (layers painted from a palette slot with its before and after colour), `literalColors` (hex colours the switch will not repaint) and `imageLayers` (scene, layer and asset); it reads `scenes.json` only, so preview the affected scenes before telling the owner the switch is done. A plain `apply` commits one revision and `undo` restores the old profile. An override the new profile locks or no longer allows blocks apply; `--reset-overrides` drops it explicitly and undo brings it back.

A brand switch has its own report (`plan.bindings`) and never rewrites copy or claims; the brand-managed rules are in [authoring.md](authoring.md). For trusted recipes, the dry-run lists each bound param under `plan.bindings.recipeParams` with its current and target value and state (`unchanged`, `changes`, `missing`, `invalid-type`, `field-missing`) and the params no binding covers under `recipeCoverage`; change them through `edit`, never by editing the recipe code.

After a profile change the draft still compiles. Voice made with the old style shows in `status` under `needsProduction`; final export waits until it is regenerated.

After a profile change, or any change whose dry-run lists `revalidate-layout`, check layout straight away. `validate --stage plan` catches geometry it can compute, including image mask radii from the profile's defaults (`IMAGE_MASK_INVALID`), but text size is measured only in `preview`. So run `preview --draft` (or `--scene <id>` per affected scene) as the layout check: a preview whose preflight fails is rejected in seconds, before any frame is rendered, and lists every measurable problem at once. Repair them all in one pass. Expect one more round when `TEXT_OVERFLOW` or `MIN_FONT_SIZE_VIOLATION` was reported: a layer's collision and off-canvas checks run only once it fits. Keep neighbouring text boxes from touching, so a larger face cannot turn a hidden overlap into a collision, and look at every `CONTRAST_UNVERIFIED` text in the frames. Box sizes in preflight messages are draft pixels.
