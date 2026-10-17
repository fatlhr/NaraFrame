# Library-first recurring episodes

Use a catalog when its explanatory object and choreography suit the brief. Reuse the structure, not another episode's facts. Inspect the available patterns before drawing the same object again; if none fits, author an ordinary scene with [art-direction.md](art-direction.md). A library does not choose the story or approve artwork.

## Inspect, stage, revise

Commands run from the NaraFrame repository with its pinned runtime. `schema --json` is authoritative for catalog, project and layer fields. Keep production projects outside this repository.

```bash
pnpm naraframe library inspect library/starter/catalog.json --json
pnpm naraframe library stage <project> --from library/starter/catalog.json --pattern <pattern-id> --version <version> --instance <instance-id> --scene <scene-id> --params <params.json> --json
```

The inspect result provides `data.catalog`, its `data.sha256`, and dependency hashes. Read the selected pattern's parameter descriptions, types and asset choices. The params file is a JSON object of those episode values, not scene JSON, code or expressions. Use a stable instance ID for the reusable structure and a distinct scene ID in the episode. Inspect the staged result before applying it: staging is preparation, not a project revision. Its `data.receipt` describes the pin; use `artifacts.staging` and top-level `sourceRevision` (also `data.edit.from` and `.expect`) for the ordinary revision path:

```bash
pnpm naraframe edit <project> --from <staging-path> --expect <source-revision> --summary "Import the explanatory pattern" --json
pnpm naraframe validate <project> --stage plan --json
pnpm naraframe preview <project> --draft --scene <scene-id> --json
```

Save the first successful source, MP4 and contact sheet before feedback. Check the relation the object explains, then crop, prop contact, entry and settled hold. Use native `--resolution 1080` when judging small type or precise framing. Validation cannot replace the visual check.

The import receipt in `naraframe.json.libraryImports` pins the catalog identity/version/hash, pattern contract and values, provenance, and local dependencies. The scene is expanded into ordinary editable source. Assets and recipe files live in the project and its revision snapshots; rendering does not fetch the catalog. This bounded import captures all dependencies declared by the catalog, including unused choices, so choose a focused catalog rather than an unrelated asset collection. Media bytes, binding and license are retained. Importing does not establish publication rights or trust recipe code.

For a headline or pose revision, stage from the pinned instance without `--from`:

```bash
pnpm naraframe library stage <project> --instance <instance-id> --params <revised-params.json> --json
```

Apply with `edit --expect`, validate, then preview only the affected scene. This works without the original catalog. A catalog update requires a new explicit `--from`, selected `--version`, and `--update`; inspect its staged dependencies and changed scene before editing. Changing a shared catalog alone must never change an old episode.

Ordinary manual scene edits remain valid. Re-instantiation refuses to overwrite a scene that diverged from its recorded expansion. Keep those local edits, or stage a separate instance for comparison; never erase them merely to make an update succeed. `undo` restores one revision at a time. Read `reusedFromBuildId` and `data.reuse` rather than assuming everything was reused: current reuse reports do not account for every media type.

This includes editing the scene's `note`. Prefer a pattern with a note parameter when the episode rundown needs to survive repeated instantiation. If it has none, record the rundown with the first checkpoint, then add it to the ordinary scene after the final pattern revision; later changes can stay manual or use a separate instance. Do not drop authorship notes to bypass a local-edit conflict. Catalog authors can expose an existing template `note` through an explicit string parameter, just like a headline.

## Frame padded art and attach props

PNG `layout` declares `units: "source-pixels"`, actual file width/height, optional `viewport`, `roi`, `focalPoint`, `padding` and named `anchors`. Read these against the original file, not the 540 preview or the design canvas.

- `viewport` is an explicit visible crop rectangle in source pixels. An image layer's `crop` records that choice without editing the file.
- `roi` identifies relevant content; `padding` describes empty margins. Both are information for authoring, not automatic clipping or a promise that every pose fits.
- Asset `focalPoint` and anchors are source-pixel points. Layer `focalPoint` is a normalized 0–1 alignment within the available frame. Staging derives a normalized alignment from asset metadata when the template omits one; an explicit template alignment wins. Do not mix the two units.
- The source crop is fitted into the layer frame with `cover` or `contain`. `contain` preserves the whole viewport and can leave space; `cover` fills the frame and can hide its edges. Frame positions are project design coordinates and previews scale them.

A named attachment maps the tutor's hand anchor and the prop's grip anchor through their crop/fit/focal geometry, then moves the prop frame until the two meet (plus any declared design-pixel offset). A pose parameter changes the asset and re-stages this placement. Do not estimate the hand point from the padded file's centre or subtract padding twice.

Attachments resolve at authoring time into sibling local frames. They are not a live skeleton: a later independent transform or crop change can separate the parts. Animate their common parent group to keep them together, or re-stage the pose/framing parameters and inspect contact again. Cross-parent rigs, automatic anatomy, dynamic follow and matching different camera planes are not supplied by this metadata; unsupported relationships are refused.

## Recipe and profile limits

A catalog may include a local versioned recipe. Its bytes are captured and hashed with the import, but its trust log is never imported. Ask the owner to accept that exact code in this project before `recipe trust`; import permission alone is not trust permission. Updating code or its manifest needs a new acceptance; undoing to already accepted code does not.

Keep brand bindings on assets and managed text. Before changing profiles, use `profile apply --dry-run`, inspect its binding plan, then revise the episode explicitly. Neutral technical illustrations are not evidence for a person's identity or an outcome claim. Imported recipe text fit and brand checks cover only its declared slots/bindings; unlisted copy, collision and contrast still need inspection.

## Starter example

`library/starter/catalog.json` contains repository-authored schematic objects, not finished brand artwork. `anchored-note@1.0.0` takes a short `title`, `pose` (`pose-left` or `pose-right`) and numeric `crop-x` (start with 60 source pixels). `path-note@1.0.0` takes `title` and traces a connection. Choose the pattern for the relation you need to explain; refine the copy and inspect it under the episode's profile.

For a technical starter trial, use the bundled `current-issues` profile:

```bash
pnpm naraframe create ../library-example --profile current-issues --json
```

For production use the profile named in the brief, not this demonstration default. Read its pinned direction and validate fit after substitution. Use the public schema and documented commands; this CLI prints usage on invalid or missing commands rather than supplying a per-command `--help` interface.

For an empty project created with the public CLI, a params file for `anchored-note` can contain:

```json
{"title":"Feedback becomes a next step","pose":"pose-left","crop-x":60}
```

Import it using `--pattern anchored-note --version 1.0.0 --instance lesson --scene asset-swap`. For a pose revision, keep the other values and set `pose` to `pose-right`, then stage `--instance lesson` without the catalog path. The note moves to the other named hand point; the media files are reused. Changing `crop-x` changes the visible viewport and re-resolves the attachment, so keep both hand and prop anchors inside the visible frame. This crop is source pixels even for a 540 preview. Inspect the actual attachment in the resulting frame; a schema-valid point is not an artistic approval.
