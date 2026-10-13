# NaraFrame — Product and Technical Specification

Revision 0.8 · 2026-10-13 · Code baseline `e008490`

MVP 1 (M0–M3) is integrated for its recorded technical scope. MVP 2, **Skill-led recurring production**, is planned as M4. Nothing in this revision advertises a planned capability as available.

## 1. Product

NaraFrame turns a brief, a profile, and local media into editable motion videos. It combines three parts:

| Part | Responsibility |
|---|---|
| Skill | Understand the audience and story; choose objects, framing, choreography, copy hierarchy, and a practical revision workflow. |
| Library | Reuse versioned patterns, recipes, and assets without rebuilding the visual language for every episode. |
| Engine and runtime | Validate data, compile timing, render frames, manage media integrity, revisions, reuse, approvals, and MP4 publication. |

A **profile** describes brand identity and production preferences. A **pattern** describes a reusable way to explain something. An **episode** supplies its story, copy, assets, and timing. These are different authorities: changing an episode must not silently change its profile or a shared library.

The user works through briefs and ordinary revisions. The agent translates them into project data or parameters of an owner-trusted recipe. The user should not need to read the renderer or understand the schema to make a video.

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

Contrast diagnostics reason about supported declarative backgrounds and motion bounds. Unknown artwork can remain unverified. They do not promise complete occlusion or arbitrary recipe analysis. Aesthetic advice is advisory; file safety, data integrity, and production constraints remain technical checks.

## 5. Audio, timing, and captions

Projects support `voice`, `music`, and `silent` modes. Explicit project mode takes precedence over an unlocked profile default; locks and incompatible media are checked on every preview. Legacy narrated projects retain the voice path. Legacy non-voice projects need explicit intent for final production. Voice requires narration; music requires a soundtrack; silent finals have no audio stream. Scoped scene previews intentionally omit the full project's soundtrack.

Imported narration can be retained as a master or as block media. Phrase anchors refer to verified timing and text bindings. Silence detection alone is not proof of the words spoken. Scene/local offsets are not word-level synchronization. Optional word data does not establish enforced native word-level motion.

Audio boundary evidence on the integrated encoding path distinguishes input sample boundaries from encoded/container durations. Visual changes preserve unchanged masters. Changing spoken content in a single master can require broader replacement or re-alignment than a block-level revision.

Current captions use the existing phrase/correction and profile style contracts. Explicit `none/selected/full`, independent caption layout controls, and their no-layout-reservation guarantees are **planned in M4.2**, not available via a hidden-glyph workaround. Empty caption strings, zero-width glyphs, or moving caption UI away are not supported substitutes for that feature.

External providers remain outside the engine. Existing local import/generation workflows do not authorize a new paid call. Music/SFX rights and listening review remain owner/editorial responsibilities.

## 6. Runtime, integrity, and reuse

- Core is independent of Remotion. Dependency direction is CLI → core/renderer and renderer → core.
- Runtime is pinned: Node `24.20.0`, pnpm `12.3.4`, Remotion `4.0.521`. The current render identity is `naraframe-draft/11`.
- Preview supports 540 and native 1080 resolution with distinct render keys. Final export is vertical H.264 MP4; audio streams follow the declared mode.
- Render identity, profile/font/vector/camera/recipe dependencies, and scope participate in relevant cache keys. Runtime changes that invalidate old results require deliberate identity/key treatment.
- Publication verifies complete artifacts, media streams, hashes, and metadata before advancing pointers. Failure must not publish a partial build.
- SIGINT evidence shows graceful interruption and recovery during rendering. SIGKILL can leave browser descendants; cache cleanup handles files, not arbitrary process cleanup.
- Paths, hashes, and symlinks are checked at file boundaries. User source and unrelated work must not be discarded to repair state.
- Pixel/MP4 repeatability is not guaranteed by green tests: historical variants remain an open reliability item.

## 7. MVP 2 — Skill-led recurring production (PLANNED)

M4 improves the authoring system first, then adds only the supporting contracts required by repeated production. Implementation and integration require separate authorization.

| Acceptance | Task | Required evidence |
|---|---|---|
| NF-AC-21 | M4.1 | Fresh-context authoring from brief using skill/public schema, representative shot, saved first draft, owner review; no renderer-source dependency. |
| NF-AC-22 | M4.2 | Caption none/selected/full with correct styling/layout; none has no glyph/scrim/reserved region; narration and voice reuse unchanged. |
| NF-AC-23 | M4.3 | Versioned library-first authoring, pinned asset/catalog snapshots, editable copy/assets/pose, explicit update, undo/reuse; old projects remain unchanged. |
| NF-AC-24 | M4.4 | Verified prepared audio/timing import, reusable series identity and recorded overrides; visual revisions leave the master intact. |
| NF-AC-25 | M4.5 | Frozen fresh-context production through approved MP4, ordinary revisions/undo/reuse and a second profile; motion/editorial/packaging evidence with separate acceptance states. |

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
| NF-AC-21–25 | PLANNED; no MVP 2 execution evidence yet. |

Not in MVP 2's closure requirements: spring, repeater, cross-scene continuity primitives, animated masks, native video layers, and word-level motion. These remain demand-led backlog. No GUI, hosted renderer, provider marketplace, publishing automation, universal cinematic style, or arbitrary untrusted project-code execution is promised.

## 9. Repository and documentation

The repository retains source packages, runtime configuration, dependencies, tests, fixtures, profiles, skill, README, and both Krakatau samples used by tests. Old discovery and long milestone records are immutable historical snapshots, not competing active plans.

The 2026-10-13 workspace archive is outside the repository at `/Users/fatih/Code/Playground/NaraFrame-archive/2026-10-13/`. Its `index.json` maps source/destination and records checksums. Cleanup neither implements M4 nor changes engine/skill/test behavior. See [history/README.md](history/README.md) for recovery locations and the local closure snapshot.
