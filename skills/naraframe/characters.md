# Explicit character entry points

Follow the canonical [NaraFrame skill](SKILL.md) for brief, sourcing, audio, validation and preview review. The character entry point supplies the profile, catalog path and exact versions for this brief.

1. Find the canonical `naraframe` folder next to the invoked character skill. If its launcher is missing, report which folder is needed and point to [installation.md](installation.md#install-or-update-a-skill). Use `node "<canonical-skill>/scripts/naraframe.mjs"` for the commands below.
2. Run `version --json` and use `data.resourceRoot` to form the catalog's absolute path. Run `profile inspect <profile-id> --json` and `library inspect <catalog-path> --json`. Check the selected profile, catalog and pattern versions before creating a project. If a resource or version is missing, report the CLI issue or expected version and ask the user to select or repair the matching engine package.
3. For a new episode, use `create <project> --profile <profile-id> --json` and read the pinned direction. For an existing episode, check `status` and the profile lock first. Follow its current pin for ordinary revisions. If the request would change the pin, use the explicit profile revision in [revisions.md](revisions.md).
4. Build shots from the brief. If a pattern fits, supply every parameter `library inspect` lists for it (the Story 0.1.0 pairs take `title` and `note`; the 0.2.0 rig patterns take `sender`, `message` and colours) and import with `library stage --from <catalog-path> --pattern <pattern-id> --version <pattern-version>` (the exact version `library inspect` lists for that pattern), followed by guarded `edit` as in [library.md](library.md). Each template demonstrates a specific action. For other stories, use the pinned direction with original scene geometry and timing.
5. Use the requested audio mode and run the canonical validation and draft preview loop. Review the opening, contact and payoff in the actual preview. Report the profile, any imported pattern and the preview path.

## Story rig

`story@0.2.0` ships a faceless figure in side view, built from path layers in nested groups, so it bends at its joints without new artwork. Stage `phone-glow` or `porch-light` to get one; either works alone as a single shot, and you may add layers to the staged scene (it then counts as a local edit, so a later re-stage of that instance is refused). Copy its rig layers (every layer whose id starts with the figure's prefix, such as `kid`) into your own shots. Each pattern takes the colour parameters `skin`, `hair`, `shirt` and `pants` (trousers), so two figures from one pattern differ by colour only. Keep one figure's size and colours the same in every shot.

The figure is a root group (`kid`, pivot at the feet) holding the legs and `kid-upper` (pivot at the hips), which holds the far arm, torso, head and near arm. Each limb is two groups: `kid-arm-n` turns at the shoulder and carries `kid-fore-n`, which turns at the elbow and carries the hand. Legs work the same way with `kid-leg-n` and `kid-lower-n`. Suffix `-n` is the near side, in front of the torso, and `-f` the far side. Props a hand holds, like the phone, are members of its forearm group.

A pose is a set of group rotations (`transform.rotationDeg`). Values below are for a figure facing right; mirror them for one facing left. Forward is negative. For a seated pose, move every rig layer's frame down by Drop × the rig's scale, and put the seat under the hips.

| Pose | `upper` | `head` | `arm-n` | `fore-n` | `arm-f` | `fore-f` | `leg-n` | `lower-n` | `leg-f` | `lower-f` | Drop |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| `stand` | 0 | 0 | 4 | -4 | -4 | -6 | 0 | 0 | 0 | 0 | 0 |
| `walk` | 3 | 0 | 18 | -12 | -18 | -14 | -22 | 12 | 20 | 16 | 8 |
| `sit` | -2 | 4 | 2 | -52 | -2 | -50 | -88 | 88 | -82 | 82 | 148 |
| `hold-phone` | 6 | 20 | -32 | -108 | -26 | -112 | -88 | 88 | -82 | 82 | 148 |
| `head-down` | 10 | 34 | 2 | -8 | -2 | -10 | -88 | 88 | -82 | 82 | 148 |
| `point` | -2 | -6 | -84 | -6 | 6 | -6 | 0 | 0 | 0 | 0 | 0 |
| `hand-on-head` | 4 | 10 | -116 | -100 | 4 | -6 | 0 | 0 | 0 | 0 | 0 |
| `hug` | 8 | 18 | -62 | -72 | -58 | -70 | 0 | 0 | 0 | 0 | 0 |

Change a pose at a cut by setting the rotations in the next shot, with the figure in the same place and size. Within a shot, change only one or two joints with `transform` beats on those groups. A beat's `rotationDeg` is added to the group's static `transform.rotationDeg`, so to reach a table angle write the table angle minus the static one (`turnTo` in the rig scripts does this), and breathe with a repeated `emphasize` on `kid-upper`. A figure's groups are stacking contexts: one figure is entirely in front of another, so in a hug put the larger figure in front and hide the smaller one's arms behind it. A walk is a few repeated `transform` beats on `kid-leg-n` and `kid-leg-f` under a `transform` of `kid` across the floor; `stepFps: 12` on `kid` gives it a cut-out cadence. Swap a held screen or a lamp with `swap` to let the object carry the story. Staging brings the catalog's props as `<instance>-<id>`: `phone`, `screen-dark` and `screen-lit` (same size, for a swap), `glow-cool` and `glow-warm` (light that fades out inside the artwork), `porch-lamp` and `lamp-on`, `door` and `window`. The patterns write the shot note into `note`; change it with an ordinary edit after staging.

## Stickman rig

`stickman-ink@0.2.0` ships a jointed ink figure built the same way: stroke-only path layers in nested groups with the same group names (`kid`, `kid-upper`, `kid-arm-n`, `kid-fore-n`, `kid-leg-n`, `kid-lower-n` and their `-f` twins), drawn as round-capped ink lines. Its head is an image layer, `kid-face`, inside `kid-head`: `swap` it between `head-calm`, `head-alarm`, `head-effort` and `head-glad` to change the expression on the beat's frame. Stage `ink-heave` (a braced pull on a rope that drags a `crate`) or `ink-cheer` (relief, arms up, a hop) to get a figure, and copy its layers into your own shots. Both take `title` and `note`, like the 0.1.0 patterns.

Poses are group rotations for a figure facing right; mirror them for one facing left. Forward is negative. Move the rig frame down by Drop × the rig's scale so the lower foot stays on the floor line. Write beats as the difference from the static angle, as for the Story rig.

| Pose | `upper` | `head` | `arm-n` | `fore-n` | `arm-f` | `fore-f` | `leg-n` | `lower-n` | `leg-f` | `lower-f` | Drop |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| `stand` | 0 | 0 | 6 | -6 | -6 | -8 | -3 | 0 | 4 | 0 | 0.2 |
| `walk` | 4 | 0 | 22 | -18 | -22 | -16 | -24 | 14 | 22 | 18 | 8.5 |
| `notice` | 10 | 8 | -20 | -40 | -12 | -30 | -3 | 0 | 4 | 0 | 0.2 |
| `reach` | 12 | -4 | -78 | -6 | -10 | -20 | -3 | 0 | 4 | 0 | 0.2 |
| `grip` | 6 | 4 | -64 | -26 | -58 | -30 | -30 | 6 | 26 | -4 | 14.6 |
| `pull` | -18 | -6 | -88 | -2 | -84 | -4 | -30 | 6 | 26 | -4 | 14.6 |
| `cheer` | -4 | -10 | -150 | -12 | 150 | 12 | -3 | 0 | 4 | 0 | 0.2 |
| `crouch` | 28 | 10 | -40 | -50 | -34 | -44 | -74 | 116 | -64 | 110 | 72.8 |

Keep hand contact through a move: `armsFor(lean, point)` in `library/characters/stickman-ink/rig.mjs` solves the arm angles that keep a hand on a fixed rig-space point for a given lean, which is how `ink-heave` keeps both hands on the rope while the body leans back past its mark. Shorten a rope as its load comes closer with a `draw` beat on a path that starts at the hand.

Give every layer an id that differs from the scene's id. A beat whose `targetId` equals the scene id reveals or exits the whole scene: compile warns `LAYER_ID_IS_SCENE_ID`, and `library stage` refuses a new import whose scene id matches a pattern layer (`LIBRARY_SCENE_ID_CONFLICT`), so `--scene kid` fails for a rig pattern.
