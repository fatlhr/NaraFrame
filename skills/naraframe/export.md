# Review, approval and export

Read this for a preview, review, approval or export, and for the audio, resolution and reuse rules that come with them.

## Inspect a build

Preserve the first successful draft MP4, contact sheet and source before feedback, then inspect the exact paths in the successful result's `artifacts`. Start with `artifacts.storyboardPng`, a grid of the checked frames with their times under each frame; show it to the owner for a first look, and extract single frames with ffmpeg when text needs a closer read. Review scene entry, settled, beat peak, transition/final states, and any requested editorial timestamps; check masks during motion, hierarchy, overflow, collisions, and whether the object explains the takeaway. Metadata alone is not visual acceptance. Record reads/help, correction count, elapsed time, reuse and provider use; unknown cost or active time stays unknown. Keep owner visual acceptance separate from technical readiness.

Run `status <project> --json` to resume or verify. Continue only from its authoritative current build and reported artifacts. A stale preview must be rebuilt and inspected.

## Scoped previews, resolution and reuse

To check or review one scene while others are unfinished, use `--scene <id>`: `validate --stage production --scene <id>` and `preview --scene <id>` (no `--draft`) require only that scene and its dependencies to be ready, and list other scenes' gaps as `info`. A final `render` still needs everything. A preview of a scene starts at time zero; its global position may be unknown (null) until earlier blocks have audio.

Previews default to 540×960. Use `preview --resolution 1080` when the owner needs to judge crop, line wrapping or small type at final size: it renders natively at 1080×1920 (still labelled DRAFT), has its own build keys, and a full 1080 preview of the current source can be approved for `render`. More pixels do not add detail a small source image lacks; say so instead of implying sharper media.

After a change that cannot alter pixels, such as a scene `note`, `preview` reuses the earlier build's pixels and reports `data.reusedFromBuildId`; you still need a fresh review and approval for the new revision. A reused preview still gets a new build id (an approval binds one build to one source revision), but its MP4 and contact sheet are the earlier build's files, so no frames were rendered again: `reusedFromBuildId` names that build, and it is `null` after a real render. Use `--rerender` only when you need a real render.

## Audio mode and soundtrack

Set the audio mode the brief asks for in `naraframe.json` as `audioMode`: `"voice"` (narration, optionally with a music bed), `"music"` (a music bed, no speech) or `"silent"` (no audio stream). A profile may default it under `production.audioMode` and may lock it. `validate --stage production`, `preview` and `render` report the resolved mode as `data.audioMode` with its source (`project`, `profile` or `legacy`); tell the owner which mode applies. Music-only and silent projects use the scenes' `durationMs` as the final clock and reach a native 1080×1920 final through the same preview-approval-render route. Never add empty or silent narration to get past a check.

To make a voiced project silent, stage `naraframe.json` with `audioMode: "silent"` and run `edit --from STAGING --remove narration.json --expect REVISION` (never delete `narration.json` by hand); if `captions.json` selects narration phrases, validation names `CAPTION_SELECTION_TARGET_UNKNOWN`: add `--remove captions.json` or stage a `captions.json` with mode `none`. `AUDIO_MODE_UNDECLARED` means a project without narration has not declared its mode, so its durations are still draft timing: declare it after the owner confirms the timing. `NARRATION_REQUIRED` means voice was requested but narration is missing; do not switch to music by yourself. `MUSIC_REQUIRED` names a missing music bed at export. `AUDIO_MODE_CONFLICT` (narration under a non-voice mode, or a soundtrack in a silent project) and `AUDIO_MODE_LOCKED` (a mode the profile locks differently) are source errors: every preview refuses them before rendering, `--draft` included, while missing narration, music or a mode declaration only block the final export.

Know which route a project is on:

- **Draft without a declared mode**: no `narration.json` and no `audioMode`; previews are labelled `DRAFT • NO AUDIO` or `DRAFT • WITH AUDIO` (music), and `render` refuses it with `AUDIO_MODE_UNDECLARED`.
- **Prepared media**: import an existing take and local timing through `audio stage` → `edit` using [prepared-audio.md](prepared-audio.md). A pending receipt permits draft review but blocks production; verified listening records bind the captured audio, text and cues. Existing ready blocks without that receipt retain their legacy path.
- **Generated**: calling a voice provider from NaraFrame is not available through the CLI yet; every real paid call needs the owner's authorisation and a receipt in `production.json`, so never spend or call a provider on your own.

`soundtrack` in `naraframe.json`: one `music` track (volume, loop, trimStartMs, fadeInMs, fadeOutMs, optional `duck`) and `sfx` entries anchored to a scene (`sceneId`, `offsetMs`). It never changes video length. Scoped previews carry only their own effects, no music. A planned audio asset is skipped in drafts and blocks final. Two loudness warnings measure the real files: `MUSIC_MASKS_NARRATION` when music under speech is within 6 dB of the voice, `MUSIC_INAUDIBLE` when it is more than 20 dB below. `MUSIC_MAY_MASK_NARRATION` is the cheaper compile-time check on the declared numbers alone.

## Approval and final render

A final export needs `validate --stage production` to pass and one approval. Run a full `preview` that carries the project's audio (narration, music or none for silent), have the owner review it, then `pnpm naraframe render <project> --approve-preview <build-id> --json`. Use `--autonomous --authorized-by <name>` only when the owner has said in chat that you may export without reviewing a preview; never add it on your own initiative. An approval covers one source revision: after any edit, review a new preview. Report the export from `artifacts.finalMp4` and do not call it published.

## Cleanup

`cache clean --dry-run` shows what would be removed; it never touches source, history, receipts, approved or selected builds, or exports.
