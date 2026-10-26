# NaraFrame — Product and Technical Specification

Revision 1.2 · 2026-10-26 · MVP 2 integrated at `a701c39`; M5.1 is a planned follow-up

MVP 1 (M0–M3) is integrated for its recorded technical scope. MVP 2, **Skill-led recurring production**, is M4. All three MVP 2 batches (M4.1–M4.5) are integrated in main as of `a701c39`: art direction and captions, library imports, prepared audio and series identity, the installable engine and skill, and a frozen production trial that ended in two owner-approved exports. Exported is not published: public rights for the trial media stay open. Follow-up findings F1–F6 are recorded in the plan backlog and need their own authorization.

## 1. Product

NaraFrame turns a brief, a profile, and local media into editable motion videos. It combines three parts:

| Part | Responsibility |
|---|---|
| Skill | Understand the audience and story; choose objects, framing, choreography, copy hierarchy, and a practical revision workflow. |
| Library | Reuse versioned patterns, recipes, and assets without rebuilding the visual language for every episode. |
| Engine and runtime | Validate data, compile timing, render frames, manage media integrity, revisions, reuse, approvals, and MP4 publication. |

A **profile** describes brand identity and production preferences. A **pattern** describes a reusable way to explain something. An **episode** supplies its story, copy, assets, and timing. These are different authorities: changing an episode must not silently change its profile or a shared library.

With a skill-capable agent, the user works through briefs and ordinary revisions. The agent translates them into project data or parameters of an owner-trusted recipe. The user should not need to read the renderer or understand the schema to make a video through that route. The engine also accepts authored project data directly through its CLI; that route requires neither Claude nor Codex.

### Distribution and access contract — M4.5 scope addition

The engine is an independent local CLI. The canonical NaraFrame skill is an optional authoring layer over that CLI, not a runtime dependency. Scripts, another agent, and future interfaces use the same public project files, structured results and approval/trust rules. A direct CLI workflow is technical authoring, not a promise of prompt-to-video without an agent or of an existing GUI.

Prepare a versioned, installable engine artifact with a `naraframe` executable, runtime packages/resources, bundled profiles/library, a redistributable starter and documented prerequisites. It must run from a user's project directory without depending on this development checkout, its `work/`, private fixture locations or personal paths. Skill distribution carries all routed references/examples from one maintained source, with local install paths/adapters for Claude Code and Codex, a compatible engine version declaration, and conflict-safe update/removal. Host plugins may wrap the skill; they must not become necessary for direct CLI use.

Current source installation remains supported. A packed artifact is not an npm publication, public release or marketplace acceptance. External publication needs its own authorization, code-license decision and resource/dependency rights review. macOS is the initial evidenced platform; Windows/Linux support is not inferred from portable file paths. Engine rendering remains local, with external browser/FFmpeg and provider boundaries documented.

### Product principles

- Skill quality is part of product quality. A reliable engine alone does not supply art direction.
- Visuals should explain the story through objects and relationships, not default to cards with text underneath.
- Reuse a deliberate visual language, not the same entrance or zoom for every shot.
- Profile preferences are defaults unless intentionally locked. Quiet shots, cuts, and empty space are valid choices.
- Preserve source, audio masters, approved drafts, and revision history. Changes have explicit scope.
- Keep local rendering separate from paid generation and publishing to social platforms.
- Output and manual acceptance precede focused tests; integration gates protect the accepted path.
- Measure effort and provider use. Unknown is not zero, and cost or speed advantages need measurements.
- Technical readiness, visual acceptance, export integrity, and publication permission are separate statuses.
- Competitive visual quality remains an objective, not a claim that every output matches Bang Motion.

## 2. Current authoring workflow

The public CLI is the authoring boundary. Its exported schema and capability registry describe available functionality. A typical path, run from the repository root, is:

```bash
pnpm naraframe doctor --json
pnpm naraframe schema --json
pnpm naraframe create ../NaraFrame-projects/episode --profile current-issues --json
pnpm naraframe validate ../NaraFrame-projects/episode --stage plan --json
pnpm naraframe preview ../NaraFrame-projects/episode --draft --scene SCENE_ID --json
pnpm naraframe validate ../NaraFrame-projects/episode --stage production --json
pnpm naraframe preview ../NaraFrame-projects/episode --resolution 1080 --json
pnpm naraframe status ../NaraFrame-projects/episode --json
pnpm naraframe render ../NaraFrame-projects/episode --approve-preview BUILD_ID --json
```

These commands do not make a newly created, unpopulated project production-ready. Assets, narration when required, and source data must first be authored through the existing workflow. Export requires owner approval of the matching preview; neither that approval nor a valid MP4 establishes publication rights.

`edit --from ... --expect ...` applies staged changes against an expected revision. `undo` restores the previous revision. `profile inspect` and `profile apply --dry-run` expose profile changes before applying them. `recipe trust --authorized-by ...` records explicit owner authorization for recipe code. `cache clean --dry-run` reports disposable artifacts before removal.

New production projects live outside the repository, for example `../NaraFrame-projects/`. In-repository `work/` is optional development scratch, not a product dependency or the permanent home of client videos.

## 3. Project and profile contract

Source schema version 1 remains the compatibility baseline. A project can contain project configuration, scenes, pinned profile data, narration and timing, asset manifests/media, and declared recipes. Generated previews, finals, and revision state are derived artifacts, not substitutes for source.

Profiles control available visual defaults, fonts, palette, production settings, audio-mode defaults/locks, and optional brand identity. Applying a profile is an explicit revision; it does not rewrite copy. Asset bindings distinguish neutral, brand-bound, and unknown media. Brand-managed production rejects unknown or incompatible bindings and mismatched declarative brand text.

Recipe binding checks cover only declared parameter pointers. They compare brand name, CTA, and palette values; they do not infer every identity, fact, or claim inside custom code. Dry-run exposes binding changes and unchecked parameters. Those limits must remain visible to the author.

Source revisions, media hashes, profile state, timing, and relevant render dependencies determine reuse. Approval is tied to a source revision and preview. An edit can make an approval stale even when some media remains reusable. Visual-only revisions must not regenerate unchanged voice.

### Library authoring — Batch 2 candidate

`library inspect <catalog.json>` exposes a local catalog's patterns, exact versions, provenance and captured dependency hashes. `library stage <project> --from <catalog> --pattern <id> --version <version> --instance <id> --scene <id> --params <json>` captures verified bytes into new staging without changing the project. Its returned staging/revision feed the existing guarded `edit` transaction. A catalog is passive authoring data, not a live renderer dependency or a new motion runtime.

Optional `libraryImports` in project configuration pins the selected template, parameter contract/values, catalog identity/hash and local asset/recipe receipts. Local re-instantiation omits the catalog path; catalog updates require explicit selection and `--update`. Ordinary scene edits are preserved: a changed scene refuses regeneration instead of being overwritten. Copy, pose and crop substitutions become ordinary source revisions; existing undo, approval staleness and build reuse remain authoritative. Import captures the bounded catalog's entire dependency set, not an optimized per-pattern closure. Recipe code remains separately project/hash-trusted; trust is never imported.

Ready PNG assets may carry opt-in `layout` in source pixels: real dimensions, viewport/ROI, focal point, padding and named anchors. Dimensions and bounds are validated. ROI/padding are descriptive; cropping uses an explicit source-pixel image-layer `crop`. A pure browser-safe placement helper is shared by compiler, renderer/preflight and staging. Cropped compiled slots carry `naraframe-image-crop/1`; uncropped legacy visuals keep their former path and keys, without a global renderer bump.

Pattern attachments place unrotated sibling PNG props using named anchors under one supported absolute parent/plane. Staging emits literal local frames, not a dynamic rig. Unsupported cross-parent, chained/cyclic attachment or independent geometric motion is refused. Use a shared parent for assembled motion and re-stage when pose/framing changes. Source-pixel crop units do not change between 540 and 1080 output. Technical schematic examples do not establish finished artwork quality, human identity, publishing rights or visual parity.

## 4. Composition and motion available today

### Declarative composition

Supported composition includes local images, passive validated SVG, paths, shapes, rich-text spans and role fonts, nested groups, local transforms, world/overlay spaces, camera motion, parallax depth, and billboard labels. SVG accepts a validated passive subset, including local gradients and clipping; scripts, handlers, external references, `foreignObject`, and built-in animation are rejected.

Motion includes reveal/exit, emphasis, focus/transform, camera movements, path drawing, following a path, and count-up. Playback is frame-derived rather than dependent on prior playback state. Concurrent claims on a property are rejected. Sequential motion and follow pose semantics must be documented accurately, including the first follow's pre-window pose and jumps between non-aligned follow endpoints.

Follow on a path whose geometry is moved or rotated by motion is rejected rather than given a misleading trajectory. Count validation resolves phrase timing before identifying the final count. Text-fit checks for animated counts sample endpoints and final text, not every intermediate number.

### Owner-trusted recipes

A project recipe declares an entry and its local TypeScript/TSX files. Static hygiene constrains imports and rejects specified unsafe constructs. Authorized hashes are recorded in project state. Rendering captures registered file bytes, verifies the compiled/trusted hash, and bundles those captured bytes from private staging. A later edit to the original files does not change that captured bundle.

This is **trusted code, not a sandbox**. Static checks are not a security guarantee for arbitrary hostile JavaScript. Trust is scoped to a project and a code hash; changes to the manifest or code require new authorization. The current executor is `naraframe-recipe/2`.

Recipes may declare `bindings` and opt-in `textSlots`. Slot parameters point to a string or an array of strings; each array element is measured independently, not as a combined block. Style is resolved from the slot/profile and passed to the recipe. Preflight measures design-pixel boxes with loaded fonts before rendering. `wrap: words` uses pre-line semantics; `none` uses pre semantics. Terminal breaks, blank lines, and preserved NBSP are covered by browser-backed evidence. The current slot fit marker is `naraframe-text-fit/2`.

The engine cannot prove that arbitrary trusted recipe code uses the supplied slot styles. Undeclared text, combined array height, general recipe collision/contrast, and some non-space line-breaking cases are outside this protection. No automatic shrinking or copy rewrite is implied.

### Validation boundaries

`validate --stage plan` checks schema, references, resolved timing windows, static bounds, masks, counts, and phrase anchors. Production validation additionally checks production/media/trust/brand requirements. Browser-backed preview preflight loads fonts and checks render-dependent text fit, collisions, and moving text bounds. Validate does not measure recipe glyphs in Node. A text box that overflows can prevent its later collision checks; fixing fit can expose more issues.

Contrast diagnostics reason about supported declarative backgrounds and motion bounds. Unknown artwork can remain unverified. They do not promise complete occlusion or arbitrary recipe analysis. Existing aesthetic advice retains its current policy; file safety, data integrity, and production constraints remain technical checks.

### Planned profile composition policy — M5.1

Production feedback on 2026-10-26 is accepted for planning as **M5.1**, a candidate for the next MVP. It does not reopen MVP 2 or authorize implementation. The policy complements authoring in the skill and reusable library patterns: the skill chooses the explanatory object, framing, useful movement and reading holds; the engine checks the profile's measurable requirements.

An optional profile policy will enable rules individually, with thresholds and `off`, `warning` or `error` at each of `plan`, `preview` and `production`. New rules default to disabled. Existing source-v1 projects, profiles, typography roles, asset roles and legacy diagnostic policies keep their behavior when the new policy is absent. Profile pinning, explicit application and existing override/lock authority apply. The proposed field names and reports are specified in [M5.1 in the plan](plan.md#m51--profile-composition-quality); none is currently available in the public schema.

| Rule | Planned measurable contract |
|---|---|
| Opening cover | At global video frame 0, a designated title text and main object are visibly present. A title or hero waiting for a reveal, including one starting at 0 with zero opacity, does not qualify. This concerns the video itself, independently of an exported cover image. |
| Maximum visual inactivity | Measure the longest interval without effective visible change over the resolved full timeline, including its head, tail and scene boundaries. Use actual motion windows and visible text/count changes; ignore no-op or hidden animation. Explicit, bounded reading holds may exempt only their own intervals. |
| Camera and cut runs | Each scene has effective camera movement or an allowed explicit static-scene reason. A camera declaration, zero-intensity focus or unchanged pose alone is insufficient. An optional consecutive-cut limit counts actual scene boundaries, excluding the last scene's unused transition. |
| Hero footprint | At reproducible settled-beat checkpoints, compare the union of safe-area-clipped painted bounds of designated hero parts with the profile's safe area. Transparent padding, empty layout frames and gaps between separate bounds must not inflate the numerator. Report the metric and its coverage; it is not painted-pixel density or automatic identification of a photo's subject. |

`3000 ms` and `25%` are example settings for Bang Nalar, not global defaults. Semantic title/hero references are optional additions separate from typography/brand roles. Title fallback may use eligible `display`/`heading` text; hero identity must be declared rather than guessed from an ID or the largest rectangle. Reading holds and intentional-static exceptions are structured, bounded and reasoned; free-form notes alone do not exempt checks.

Node validation checks structure, references, resolved timing and supported analytic findings. Browser preflight supplies font/paint/visibility evidence. Reports distinguish checked, exempt, pending and unverified coverage. An error blocks the invoking command at its selected stage; browser-only findings remain pending during Node validation. Sparse existing preflight samples cannot prove the absence of long static intervals. Arbitrary trusted recipes cannot receive an automatic pass from empty declarative layers or author-supplied bounds; unsupported checks remain explicit, and an enabled blocking rule must be resolved at enforcement.

Integrate corresponding `VIEWPOINT_STATIC` and all-cut `SINGLE_TRANSITION_TYPE` findings only where their replacement rule is active at the calling stage; enabling a different composition rule must not suppress them. Keep repetition, panel dead space, text safety and contrast distinct where they measure different problems. Diagnostics use the existing issue contract, identifying the scene, beat or boundary, local/global milliseconds, frame, affected layers, observed value, threshold and corrective action. Technical conformance does not establish visual acceptance. The acceptance/gate checklist is [NF-AC-28 in M5.1](plan.md#m51--profile-composition-quality).

## 5. Audio, timing, and captions

Projects support `voice`, `music`, and `silent` modes. Explicit project mode takes precedence over an unlocked profile default; locks and incompatible media are checked on every preview. Legacy narrated projects retain the voice path. Legacy non-voice projects need explicit intent for final production. Voice requires narration; music requires a soundtrack; silent finals have no audio stream. Scoped scene previews intentionally omit the full project's soundtrack.

Imported narration can be retained as a master or as block media. Phrase anchors refer to verified timing and text bindings. Silence detection alone is not proof of the words spoken. Scene/local offsets are not word-level synchronization. Optional word data does not establish enforced native word-level motion.

### Prepared import — Batch 3 candidate

`audio stage <project> --from <clip> --timing <package.json> --block <id>` captures and probes local audio bytes, then returns staging for guarded `edit`. It neither mutates the project nor alters the take. The passive package declares millisecond-local phrase/optional word timing, the audio hash, intended text, alignment provenance, uncertainties, trailing hold and pending/verified listening state. Intended text must match the existing block; voice intent and profile locks remain authoritative.

An opt-in ready-block `prepared` receipt binds the captured audio, normalized text, measured duration and local timing. Verified state requires a named listening reviewer and timestamp; this is an attestation, not automatic recognition. Pending state permits draft review but blocks production and must not claim a confirmed generation text binding. Changed receipt bindings are rejected. Legacy blocks retain their old shape and behavior. `pauseAfterMs` is excluded from the listening timing hash because it changes a visual hold after the unchanged clip. Receipt-only changes still affect source/approval authority, not identical pixels or voice generation identity.

The reusable `study-notes` catalog expands an intro overlay, persistent signature and sign-off in that trailing hold into ordinary declarative source. Version and complete episode values are pinned. Intro omission inserts no time and shifts audio by zero; changing the hold explicitly changes duration. This preset does not introduce standalone unvoiced pre-roll, new narration-clock semantics, recipe trust or an identity runtime.

Audio boundary evidence on the integrated encoding path distinguishes input sample boundaries from encoded/container durations. Visual changes preserve unchanged masters. Changing spoken content in a single master can require broader replacement or re-alignment than a block-level revision.

The M4.2 candidate adds `captions.json.mode`: `none`, `selected`, or `full`. It overrides an unlocked profile `render.captions.mode`; omission in both preserves legacy `full`. Selected entries name a measured block/phrase and optional phrase-local `startOffsetMs`/`endOffsetMs`, a positive half-open interval bounded by that phrase. Empty selected entries display nothing. Unknown targets and invalid windows are rejected even when currently inactive. No word timing is invented.

Caption display corrections never rewrite narration. Profile caption style defaults are inherited; existing project style overrides obey declared allow/lock paths. A lock on `render.captions` or `render.captions.mode` also prevents a differing source mode. Style uses design-pixel font size, side/bottom offsets, max lines, scrim opacity and line-height multiplier; renderer and preflight share resolved styling and measured wrapping. None/empty selected omit captions entirely, including their glyphs, scrim, preflight boxes and sample frames; the scene layout and narration remain intact. Removing only the scrim leaves the caption text/collision region.

Full/scoped captions share global rounded frame windows whenever the timeline is complete, then clip at scene boundaries, including windows shorter than a frame. Local fallback is used only when a global timeline cannot be placed. Visual policy/style/cue changes affect render keys, not voice generation keys. Candidate renderer identity is `naraframe-draft/12`. Preview/render measure fonts; Node plan validation checks structure, references, timing and locks, not text fit. Empty strings, invisible glyphs and off-canvas caption UI remain unsupported substitutes for a display policy.

External providers remain outside the engine. Existing local import/generation workflows do not authorize a new paid call. Music/SFX rights and listening review remain owner/editorial responsibilities.

## 6. Runtime, integrity, and reuse

- Core is independent of Remotion. Dependency direction is CLI → core/renderer and renderer → core.
- Development is pinned: Node `24.20.0`, pnpm `12.3.4`, Remotion `4.0.521`. The published engine runs on Node 22 or newer; the Node version is recorded with each build but is not part of its render key. Integrated main uses `naraframe-draft/13`: frames are captured one browser tab at a time, because parallel capture under CPU load produced silent single-frame corruption.
- Preview supports 540 and native 1080 resolution with distinct render keys. Final export is vertical H.264 MP4; audio streams follow the declared mode.
- Render identity, profile/font/vector/camera/recipe dependencies, and scope participate in relevant cache keys. Runtime changes that invalidate old results require deliberate identity/key treatment.
- Publication verifies complete artifacts, media streams, hashes, and metadata before advancing pointers. Failure must not publish a partial build.
- Every newly rendered preview and final MP4 passes a frame-integrity scan (`neighbour-outlier/1`): a frame that differs sharply from both neighbours while they match each other fails the build with `RENDER_FRAME_INTEGRITY` before publication. The passing record is stored as `frameIntegrity` in the build report. A deliberate one-frame flash is refused the same way. Reused builds inherit their source report.
- SIGINT evidence shows graceful interruption and recovery during rendering. SIGKILL can leave browser descendants; cache cleanup handles files, not arbitrary process cleanup.
- Paths, hashes, and symlinks are checked at file boundaries. User source and unrelated work must not be discarded to repair state.
- Pixel/MP4 repeatability is not guaranteed by green tests: historical variants remain an open reliability item.

## 7. MVP 2 — Skill-led recurring production (INTEGRATED)

M4 improves the authoring system first, then adds only the supporting contracts required by repeated production. Implementation and integration require separate authorization.

| Acceptance | Task | Required evidence |
|---|---|---|
| NF-AC-21 | M4.1 | Fresh-context authoring from brief using skill/public schema, representative shot, saved first draft, owner review; no renderer-source dependency. |
| NF-AC-22 | M4.2 | Caption none/selected/full with correct styling/layout; none has no glyph/scrim/reserved region; narration and voice reuse unchanged. |
| NF-AC-23 | M4.3 | Versioned library-first authoring, pinned asset/catalog snapshots, editable copy/assets/pose, explicit update, undo/reuse; old projects remain unchanged. |
| NF-AC-24 | M4.4 | Verified prepared audio/timing import, reusable series identity and recorded overrides; visual revisions leave the master intact. |
| NF-AC-25 | M4.5 | Frozen fresh-context production through approved MP4, ordinary revisions/undo/reuse and a second profile; motion/editorial/packaging evidence with separate acceptance states. |
| NF-AC-26 | M4.5 | Install a versioned engine artifact in an isolated consumer directory; CLI and included starter work without the source checkout or agent; preserve JSON/approval/trust contracts. |
| NF-AC-27 | M4.5 | Install/update the complete skill bundle for Claude Code and Codex; references resolve, engine compatibility is checked, onboarding and terminal-only documentation work from the consumer directory. Actual host activation evidence is distinguished from filesystem/install tests. |

The numbered tasks, concrete acceptance commands, integration gates, and handoff live in [plan.md](plan.md). The reasoning and adopted/rejected production lessons live in [refine-spec.md](refine-spec.md).

Compatibility is additive: source-v1 projects, profiles, recipes without new opt-in metadata, prior timing, and scoped previews must retain their documented behavior. New library imports snapshot dependencies; later catalog updates cannot silently change old or approved projects. Registry entries become available only after real-path evidence and regression coverage.

## 8. Acceptance status and boundaries

M0–M3 acceptance and chronological evidence are retained in [history](history/README.md). Technical integration is not a blanket visual or publication approval.

| Register | Current disposition |
|---|---|
| NF-AC-01–15 | Consult historical per-task dispositions; no blanket pass is inferred. NF-AC-06 repeatability remains OPEN. |
| NF-AC-16/17 | D-VIS: Medan/LBC competitive visual, publication, and associated export gates remain deferred; not retrospectively passed. |
| NF-AC-18 | Technical audio/resolution/export paths met in recorded fixtures. |
| NF-AC-19 | Parameterized Remotion route accepted; Bang Motion equivalence OPEN. |
| NF-AC-20 | Repeated LBC production ACCEPTED_INTERNAL, not cleared for public use of photos. |
| M3.E/F | Integrated explicit recipe identity bindings and opt-in text fit, with their stated coverage limits. |
| NF-AC-21 | Owner accepted the representative authoring evidence on 2026-10-14; repeated with the installed skill in the M4.5 trial. Integrated (`a701c39`). |
| NF-AC-22 | Owner confirmed caption behavior on 2026-10-14; manual/audio/reuse and feature E2E evidence recorded; final serial E2E passed at M4.5 closure. Partial-phrase captions need word timing and are not guessed. Integrated (`a701c39`). |
| NF-AC-23 | Library candidate reviewed and committed on Batch 2, with the cropped-anchor correction verified. Integrated (`a701c39`). Evidence and limits recorded in plan. |
| NF-AC-24 | M4.4 committed `4b49ebe`: listening confirmation, captured import, two identity episodes, short output/revision/undo and verify evidence recorded in plan; prepared voice reused in the M4.5 trial export. Integrated (`a701c39`). No blanket visual/publication acceptance. |
| NF-AC-25 | Met for the recorded trial: fresh-context authoring through the installed skill on a frozen engine, headline/tempo/object revisions, undo, reuse, a second profile on a silent episode, then owner visual acceptance and two verified exports (`e470d85201ba-4cbfbbf3-368`, `944926cda123-7c5f110b-bdc`) with covers from the finals. Exported, not published; rights stay open and episode-02 claims are an unsourced illustrative restatement by owner decision. Integrated (`a701c39`). |
| NF-AC-26 | Met on macOS arm64: versioned local archive installed offline outside the checkout, byte-identical to the build, used for the whole trial including both exports; final verify and serial E2E passed. Not a registry release. Integrated (`a701c39`). |
| NF-AC-27 | Install/update/launcher checks evidenced for isolated Codex/Claude directories; the shipped installer updated the production project skill. Fresh-context agents onboarded from the installed skill folder and launcher alone, but they were pointed at the folder: automatic host discovery/activation is still not observed. No personal installation or marketplace publication. Integrated (`a701c39`). |

Not in MVP 2's closure requirements: spring, repeater, cross-scene continuity primitives, animated masks, native video layers, and word-level motion. These remain demand-led backlog. No GUI, hosted renderer, provider marketplace, publishing automation, universal cinematic style, or arbitrary untrusted project-code execution is promised.

## 9. Repository and documentation

The repository retains source packages, runtime configuration, dependencies, tests, fixtures, profiles, skill, README, and both Krakatau samples used by tests. Old discovery and long milestone records are immutable historical snapshots, not competing active plans.

The 2026-10-13 workspace archive is outside the repository at `/Users/fatih/Code/Playground/NaraFrame-archive/2026-10-13/`. Its `index.json` maps source/destination and records checksums. Cleanup neither implements M4 nor changes engine/skill/test behavior. See [history/README.md](history/README.md) for recovery locations and the local closure snapshot.
