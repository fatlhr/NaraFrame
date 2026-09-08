# NaraFrame MVP Implementation Plan

> **For execution:** implement M0 task-by-task in this workspace, with a review checkpoint after each task. The plan defines intent, boundaries, contracts, and proof; implementation details belong to the work stage.

**Goal:** Deliver a usable local motion-video workflow for Fatih, with direct JSON/CLI control, agent orchestration, controlled generation cost, and localized reversible revisions.

**Architecture:** Interleave skill → CLI/core validation/compilation → Remotion rendering. Keep external production operations outside core/renderer. Start with a short visual draft, then prove narration/revision before expanding visual recipes.

**Tech Stack:** Verified workspace pins for M0: Node 24.20.0 LTS, pnpm 12.3.4, TypeScript 7.0.2, React/React DOM 19.2.8, Remotion/@remotion packages 4.0.521, Zod 4.5.4, Vitest 5.0.0, and Biome 2.5.12. Install, frozen-lockfile, test, typecheck, build, and the first local H.264 draft render were verified on 2026-09-08; complete renderer hardening remains M0.5/M0.8 evidence.

Status: M0 implementation in progress; Tasks M0.1–M0.2 complete, M0.3 is next.
Revision: 0.7
Date: 2026-09-08
Inputs: `docs/spec.md` revision 0.3 and `docs/refine-spec.md`.
Implementation: M0.1 workspace bootstrap and M0.2 runnable draft are verified. M0.2 followed feature-driven delivery: runnable draft first, manual acceptance second, focused feature tests before merge. Broader usability, recovery, cost, and voice-quality evidence: not yet complete.

## 1. Global constraints

- MVP output is 9:16. Final rendering defaults to 1080 × 1920 at 30 fps. Preview defaults to 540 × 960 at 30 fps.
- The core package MUST NOT import Remotion. Only the renderer package imports Remotion APIs.
- Raw keyframes, arbitrary CSS/JS animation, and arbitrary executable components are excluded.
- Phrase/utterance timing is required. Word-level timing is optional unless required by the active profile or referenced by a beat/caption effect.
- Updating the source profile MUST NOT silently alter existing projects.
- User target: Fatih, comfortable with JSON and terminal. Quickstart/doctor are enough; no novice wizard, mandatory starter-profile onboarding, or no-terminal acceptance.
- No GUI, MCP, cloud publishing, provider SDKs/keys in core/CLI, generic billing service, distributed cache, or frame resume.
- External render-time network is denied in Node and browser; required local loopback is allowed. No implicit browser download.
- Provider operations are sequential initially. Receipts/unknown charges survive undo; reused source audio/images are not disposable cache.
- Safety is implemented with each feature, not postponed to the final milestone.
- Keep discovery/spec/refinement/plan in the four existing documents. Update this file for milestone details and runtime decisions; do not create parallel plans, review files, or empty `examples/` directories.

## 2. What changed and why

The old Phase 0–9 / 41-task sequence is superseded. It placed CLI and skill late and built many visual components before testing the user flow. The accepted order is:

| Gate | Usable outcome | Main risk being tested |
|---|---|---|
| M0 | One 15–30s visual draft through skill + CLI/core | Can the local runtime and declarative motion loop actually work? |
| M1 | Narrated pilot, caption, budget, edit/undo | Can one spoken section be revised economically and sound natural? |
| M2 | Two independent projects + one profile-switch variant | Do styles, partial preview, recipes, and audio remain coherent? |
| M3 | Owner dogfooding and release evidence | Is the workflow repeatable and recoverable on the reference setup? |

AR-01 was withdrawn after target-user clarification. The other 13 findings are accepted-for-spec, not implemented/verified. Their evidence and disposition are in `docs/refine-spec.md`.

M0 is a draft milestone, not an excuse to count a silent video as narrated-MVP completion. Missing TTS can produce an actionable fallback, but M1 cannot pass without a verified Indonesian narration/timing recipe.

## 3. File ownership and growth boundaries

Paths below are planned implementation targets, not files created by this documentation revision. Create only what the active milestone needs. Tests live under package test roots so the configured runner can discover them.

| Area | Exact root / primary target | Responsibility |
|---|---|---|
| Workspace | `/Users/fatih/Code/Playground/NaraFrame/package.json`, `/Users/fatih/Code/Playground/NaraFrame/pnpm-workspace.yaml`, `/Users/fatih/Code/Playground/NaraFrame/tsconfig.base.json`, `/Users/fatih/Code/Playground/NaraFrame/vitest.config.ts` | Pinned toolchain, explicit test discovery, checks |
| Core | `/Users/fatih/Code/Playground/NaraFrame/packages/core/src/index.ts` | Schema, safe loader, profile, local timeline/captions, validation, keys, revision metadata |
| Renderer | `/Users/fatih/Code/Playground/NaraFrame/packages/renderer-remotion/src/index.ts` | Narrow compiled input → preflight/preview/final adapter, frame/audio rendering |
| CLI | `/Users/fatih/Code/Playground/NaraFrame/packages/cli/src/index.ts` | Commands, JSON events, runtime orchestration, attempts and atomic pointers |
| Skill | `/Users/fatih/Code/Playground/NaraFrame/skills/naraframe/SKILL.md` | Profile-first interleaved workflow; reads core schemas, never duplicates them |
| Production helper | `/Users/fatih/Code/Playground/NaraFrame/skills/naraframe/scripts/production-ledger.ts` | Local reservation/reconciliation for agent operations; no provider SDK or credentials |
| Profile | `/Users/fatih/Code/Playground/NaraFrame/profiles/current-issues/profile.json`, `/Users/fatih/Code/Playground/NaraFrame/profiles/current-issues/direction.md` | First identity; current-affairs policy stays profile-local |
| Core tests | `/Users/fatih/Code/Playground/NaraFrame/packages/core/test/` | Schemas, assets, blocks, captions, invalidation, revisions |
| Renderer tests | `/Users/fatih/Code/Playground/NaraFrame/packages/renderer-remotion/test/` | Fonts/media/offline, frame boundaries, layouts, deterministic pixels, audio |
| CLI/skill tests | `/Users/fatih/Code/Playground/NaraFrame/packages/cli/test/` | CLI contract, skill command compatibility, fake-provider ledger, E2E/recovery |
| Fixtures | `/Users/fatih/Code/Playground/NaraFrame/test-fixtures/` | Minimal draft, media safety, two source projects, contrasting test-only profile |
| Operator quickstart | `/Users/fatih/Code/Playground/NaraFrame/README.md` | Installation/doctor, skill and manual commands; needed alongside M0 |
| Design authority | `/Users/fatih/Code/Playground/NaraFrame/docs/spec.md` | Active product contracts |
| Evidence/disposition | `/Users/fatih/Code/Playground/NaraFrame/docs/refine-spec.md` | Finding states and linked runtime evidence |
| Delivery authority | `/Users/fatih/Code/Playground/NaraFrame/docs/plan.md` | This roadmap, active-milestone expansion, decisions and gate status |

Avoid speculative generic workflow engines, broad renderer portability layers, and separate profile-only transaction systems. Reference projects live in `test-fixtures/`; generated evidence is local build output, not example source duplicated in another directory.

## 4. How to use this plan

This is the implementation plan described by the spec-driven workflow. There is no second or more detailed plan between this document and coding. M0 is expanded because it is the next work unit; M1–M3 remain roadmap-level until evidence from the preceding milestone exists.

M0 uses feature-driven delivery. Each task is a small user-visible feature and must end in behavior Fatih can run or an artifact he can inspect. Within each feature, build the real path first, perform its stated manual check, then add focused automated coverage before merge. M0.8 adds cross-feature E2E, failure-injection, and runtime evidence; it is not the first testing point. TypeScript bodies, fixtures, package manifests, and renderer details belong to execution. If implementation reveals a material product or architecture change, update the relevant spec/refinement decision before continuing.

Create the initial lockfile with an ordinary install, then verify a frozen reinstall. No Git initialization, commit, push, paid generation, or product implementation is part of this documentation edit.

Workspace commands that M0 must make real:

```bash
pnpm install
pnpm install --frozen-lockfile
pnpm typecheck
pnpm lint
pnpm test:unit
pnpm test:integration
pnpm build
pnpm verify
pnpm test:e2e
```

`verify` covers lint/format checks, typecheck, unit/integration tests, and build. Renderer E2E stays separate because it is slower, but it is mandatory for the M0 gate. During M0.2–M0.7, run the current suite plus the completed feature's focused tests before merge. M0.8 fills cross-feature E2E, recovery, and runtime-evidence gaps and runs the complete exit gate.

## 5. M0 — First usable visual draft

**Goal:** Fatih can start with a topic and profile in Codex, inspect or edit JSON directly, validate the same project through CLI, and render a labelled 15–30 second silent draft without changing renderer code.

**M0 boundary:** M0 includes text/image/native-shape composition, reveal/emphasize/focus, plan validation, draft preview, contact sheet, structured reports, and one current-issues profile. It excludes narration, captions, music/SFX, production ledger, durable edit/undo, production-ready scoped preview, profile apply, SVG/video layers, final export, and every visual recipe reserved for M1/M2.

**Exit evidence:** one real preview MP4, contact sheet, report/manifest, FFprobe result, repeated selected-frame hashes, an external-egress-denied render, failure-injection proof for atomic publication, skill/CLI compatibility, and Fatih's manual JSON correction. These results must be recorded in section 11 and `docs/refine-spec.md`; checking boxes without artifacts is insufficient.

### M0 contract map

The implementation must preserve these boundaries. Exact TypeScript definitions are written and tested during the owning task.

| Contract | Owner | Required shape/behavior |
|---|---|---|
| `Issue` and `Result<T>` | Core | Stable code, severity, responsible party, source path/entity, message, optional suggestion/details |
| `PlanProject` | Core | Validated project config, frozen profile, scenes, asset manifest, project root, canonical source revision |
| `DraftScope` | Core | Full-project draft or one selected scene; M0 scene offsets remain project-scoped because every draft duration is known |
| `CompiledDraft` | Core | Schema version, draft mode, dimensions/fps, half-open scene/beat frames, resolved profile/layers/assets, source revision, assembly key, visible silent-draft label |
| `RenderDraftRequest` / `RenderedAttempt` | Renderer | Compiled input plus explicit browser/project/attempt paths and cancellation; returns MP4, review stills, checked frames, and runtime facts |
| `DraftBuild` | CLI orchestration | One immutable build ID containing preview, contact sheet, frame index, report, and manifest |
| `CommandResultEvent` | CLI | One final versioned JSON event with command, success, readiness, source revision, fingerprint/build ID, scope, artifacts, issues, duration, and command-specific data |

Core remains renderer-independent. Renderer consumes only compiled data. CLI coordinates filesystem state and publication. The skill calls the same CLI available to a human and never duplicates schemas or writes compiled files directly.

### Task M0.1: Bootstrap the pinned workspace

**Files:**
- Create: `/Users/fatih/Code/Playground/NaraFrame/package.json`
- Create: `/Users/fatih/Code/Playground/NaraFrame/pnpm-workspace.yaml`
- Create: `/Users/fatih/Code/Playground/NaraFrame/.node-version`
- Create: `/Users/fatih/Code/Playground/NaraFrame/tsconfig.base.json`
- Create: `/Users/fatih/Code/Playground/NaraFrame/vitest.config.ts`
- Create: `/Users/fatih/Code/Playground/NaraFrame/biome.json`
- Create: `/Users/fatih/Code/Playground/NaraFrame/packages/core/package.json`
- Create: `/Users/fatih/Code/Playground/NaraFrame/packages/core/tsconfig.json`
- Create: `/Users/fatih/Code/Playground/NaraFrame/packages/core/src/index.ts`
- Create: `/Users/fatih/Code/Playground/NaraFrame/packages/renderer-remotion/package.json`
- Create: `/Users/fatih/Code/Playground/NaraFrame/packages/renderer-remotion/tsconfig.json`
- Create: `/Users/fatih/Code/Playground/NaraFrame/packages/renderer-remotion/src/index.ts`
- Create: `/Users/fatih/Code/Playground/NaraFrame/packages/cli/package.json`
- Create: `/Users/fatih/Code/Playground/NaraFrame/packages/cli/tsconfig.json`
- Create: `/Users/fatih/Code/Playground/NaraFrame/packages/cli/src/index.ts`
- Create by install: `/Users/fatih/Code/Playground/NaraFrame/pnpm-lock.yaml`

**Interfaces:**
- Consumes: Node 24.20.0 LTS and registry packages available on 2026-09-07.
- Produces: three private workspace packages, explicit test discovery, exact dependency pins, `pnpm naraframe`, and a lockfile used by all later tasks.

- [x] **Step 1: Create the workspace manifest and package boundaries.**

Create a private ESM pnpm workspace with `packages/*`. Pin the candidate versions recorded in the document header without ranges and keep every Remotion package on exactly the same patch. The dependency direction is CLI → core/renderer and renderer → core; core has no renderer dependency. Package exports must resolve built `dist` files, while the test configuration resolves package names to source so tests cannot accidentally use stale builds.

Expose root commands for build, typecheck, lint, format, unit, integration, E2E, verify, and the local CLI. The local CLI runs built output; development tests may execute TypeScript through the test runner.

- [x] **Step 2: Configure strict TypeScript, Biome, and explicit Vitest projects.**

Use strict NodeNext TypeScript with project references and separate source/build directories. Configure three explicit Vitest projects named `unit`, `integration`, and `e2e`, including the corresponding package test directories and source aliases. Configure Biome recommended checks and exclude dependencies, build outputs, generated project state, previews, and final outputs.

- [x] **Step 3: Install once to create the lockfile, then verify the frozen path.**

Run:

```bash
rtk corepack prepare pnpm@12.3.4 --activate
rtk pnpm install
rtk pnpm install --frozen-lockfile
rtk pnpm exec tsc --version
rtk pnpm --filter @naraframe/renderer-remotion exec remotion versions
```

Expected: both installs exit 0; TypeScript prints `Version 7.0.2`; Remotion prints `4.0.521`. If Node 24.20.0 plus these pins do not install, stop M0. Record the actual conflict and select a mutually compatible stable set in this section before editing product code. Never mix Remotion patch versions.

- [x] **Step 4: Prove test discovery and built-package resolution.**

Add one unit harness test per package, run `rtk pnpm test:unit`, then run typecheck/build and a smoke import from each built package. Expected: every test project is discovered, built exports resolve from `dist`, and no package imports source TypeScript at runtime.

**Checkpoint:** Exact installed versions and lockfile hash are recorded in section 11. Later render compatibility is not yet proven. Git now exists; commit only this task's explicit files.

### Task M0.2: Deliver the first runnable draft vertical slice

**Outcome:** Fatih can build the repository and run one real CLI command against a checked-in Krakatau sample to produce and open a 15-second vertical MP4. This is the first product checkpoint, not a schema-only checkpoint.

**Primary files:**
- Core source contracts, loader, and compiler under `packages/core/src/`
- Minimal Remotion composition and renderer under `packages/renderer-remotion/src/`
- Runnable `validate` and `preview --draft` commands under `packages/cli/src/`
- Editable sample under `samples/krakatau-draft/`

- [x] Implement the smallest strict source contracts needed by the sample: project, profile lock, scenes, planned/ready PNG assets, compiled draft, and structured issues.
- [x] Load the sample from disk and compile known scene durations into 540 × 960, 30 fps draft input.
- [x] Render text, rectangle/circle shapes, and labelled planned-asset placeholders through one Remotion composition.
- [x] Implement `naraframe validate <project>` and `naraframe preview <project> --draft`. The preview command may publish a development MP4 directly before atomic build publication exists.
- [x] Add the 15-second three-scene Krakatau sample with `DRAFT • NO AUDIO` visibly inside the safe zone.
- [x] Run typecheck/build and the current existing test suite only after the product path is implemented.
- [x] Manually run the built CLI against the sample and inspect the resulting MP4. Command: `pnpm naraframe preview samples/krakatau-draft --draft`; artifact: `samples/krakatau-draft/preview/dev-preview.mp4`.
- [x] After the manual path works, add focused tests for this feature's source validation, compilation, CLI contract, and one smoke render; rerun the integration gate.

**Checkpoint:** M0.2 completes only when the real CLI produces a watchable MP4 and its focused tests pass. Broader cross-feature and failure-injection coverage remains M0.8.

### Task M0.3: Make project creation and profile locking usable

**Outcome:** Fatih can create a new project from a profile instead of copying the sample manually.

- [ ] Implement `naraframe create <name> --profile <id-or-path>` using atomic staging and rename.
- [ ] Create `naraframe.json`, `profile.lock.json`, `scenes.json`, `assets/manifest.json`, preview directories, and attempt directories.
- [ ] Copy/hash render-critical profile assets so the project no longer depends on the source profile.
- [ ] Implement safe relative-path resolution, ready-PNG hash checks, and deterministic source revision calculation.
- [ ] Run the built CLI to create a temporary project, add one scene through direct JSON editing, validate it, and produce a draft preview.
- [ ] Add focused create/profile-lock/path/hash tests after the manual flow works, then run the integration gate.

**Checkpoint:** Keep the created project and preview path long enough for manual inspection, then protect the accepted behavior before merge.

### Task M0.4: Complete the M0 visual and motion capability set

**Outcome:** The runnable draft supports every visual capability promised by M0.

- [ ] Add text, local PNG image, rectangle/circle shape, and non-recursive group layers.
- [ ] Add scene visual types `text`, `media`, and `composition` plus `cut` transitions.
- [ ] Add bounded `reveal`, `emphasize`, and `focus` actions using deterministic frame arithmetic.
- [ ] Resolve full-project and selected-scene draft scope, half-open frame boundaries, and labelled placeholders.
- [ ] Reject raw keyframes, executable fields, unknown actions, recursive groups, broken references, and unsupported SVG/video.
- [ ] Manually render the reference frames twice and compare hashes as an early determinism signal.
- [ ] Add focused layer/action/reference/frame-boundary tests after the visual flow works, then run the integration gate.

**Checkpoint:** Watch the full video and confirm the explanatory state changes, rather than accepting motion on a title alone.

### Task M0.5: Publish complete preview builds atomically

**Outcome:** Every successful preview is an immutable review package instead of a loose MP4.

- [ ] Render into `.naraframe/attempts/<id>/` and publish complete builds under `preview/builds/<build-id>/`.
- [ ] Produce `preview.mp4`, `contact-sheet.png`, `frames.json`, `report.json`, and `manifest.json` under one build ID.
- [ ] Validate hashes/signatures and promote `preview/current.json` atomically only after every artifact is complete.
- [ ] Preserve the previous current build on render failure, interruption, corrupt MP4, or incomplete report.
- [ ] Include runtime versions, source revision, assembly key, draft scope, checked frames, and the silent-draft label in reports.
- [ ] Manually inject one publication failure and inspect that the previous current build remains selected.
- [ ] Add focused atomic-publication and artifact-integrity tests after manual failure injection, then run the integration gate.

**Checkpoint:** Fatih can inspect one directory containing the video and all review evidence for the same build.

### Task M0.6: Finish the operator-facing CLI and NaraFrame skill

**Outcome:** The same product path works from terminal and from an agent using the skill.

- [ ] Complete `doctor`, `schema`, `create`, `validate --stage plan`, `status`, and `preview --draft`.
- [ ] Support concise human output and exactly one final versioned JSON event on stdout in `--json` mode.
- [ ] Map usage, source, system, and cancellation failures to exit codes 3, 1, 2, and 130.
- [ ] Return actionable issues with stable code, artifact, path/entity, responsibility, message, and suggestion.
- [ ] Add `skills/naraframe/SKILL.md` with the profile-first interleaved flow. The skill calls the public CLI and does not duplicate schemas.
- [ ] Follow the skill once against the reference sample and confirm it reaches the same preview build as direct CLI use.
- [ ] Add focused CLI/skill compatibility and exit-code tests after both operator paths work, then run the integration gate.

**Checkpoint:** Terminal and skill operation resolve the same project contract and artifact paths.

### Task M0.7: Run the owner trial and revise the real workflow

**Outcome:** Fatih tries the product before test coverage is frozen around it.

- [ ] Give Fatih the shortest exact setup and preview commands.
- [ ] Open the real preview/contact sheet for review.
- [ ] Have Fatih change one closing line directly in JSON, validate, and preview again without renderer-code edits.
- [ ] Run one intentionally invalid `bounce` action and assess whether the error identifies the source path and correction clearly.
- [ ] Fix usability or contract problems found during this trial and add regression tests before merge.
- [ ] Record active time, render time, assistance needed, source/build IDs, and review notes.

**Checkpoint:** M0.7 requires Fatih's hands-on confirmation; agent-only inspection is insufficient.

### Task M0.8: Add cross-feature coverage, harden failures, and close M0

**Outcome:** Cross-feature and runtime tests protect the complete workflow that already worked feature-by-feature.

- [ ] Add unit tests for source schemas, references, timing/compiler determinism, motion boundaries, and package exports.
- [ ] Add integration tests for create/load, safe paths, renderer/browser/FFmpeg behavior, external-egress denial with loopback allowance, and atomic preview publication.
- [ ] Add CLI tests for commands, structured output, exit codes, cancellation, and failure redaction.
- [ ] Add an E2E test that copies the Krakatau sample, validates it, renders a 15-second silent draft, inspects all review artifacts, edits one line, rerenders, and verifies the invalid-action failure.
- [ ] Run `pnpm install --frozen-lockfile`, `pnpm verify`, and `pnpm test:e2e` on the pinned runtime.
- [ ] Record FFprobe output, repeated selected-frame hashes, sandbox evidence, failure-injection evidence, artifact hashes, and owner-review notes in section 11 and `docs/refine-spec.md`.

**M0 completion rule:** M0 remains in progress until both the manual owner trial and the final automated/runtime evidence pass. M0.8 closes integration gaps after feature-level tests already exist; it does not replace manual review.


## 6. M1 — Narrated pilot and affordable revision

**Goal:** One topic becomes a narrated explainer, then one spoken section is corrected without replacing valid unrelated audio.

**Consumes:** Tested M0 runtime/CLI/skill, source schemas, asset hashes, production policy, provisioned external capabilities.
**Produces:** Story blocks and local phrase timing, one verified voice recipe, ledger/limits, captions, full preview/final export, source snapshots/edit/undo.

### M1.1 — Production readiness and accounting before generation

- [ ] Skill distinguishes prepared media, silent draft, and narrated route. Verify one Indonesian TTS + phrase-timing recipe without adding provider SDKs/keys to core.
- [ ] Implement `production.json` and append-only versioned receipts with operation IDs, request keys, authorization, upper estimates, reservations, actual/unknown usage, status, and retries.
- [ ] Use sequential requests and a narrow local ledger helper. Fake-provider tests precede paid pilot calls; no generic billing service or concurrency scheduler.
- [ ] Prove budget 100/spent 40/reserved 40/next 30 denies, timed-out unknown requests are not blindly resent, unknown actual cost stays conservatively reserved, two-attempt limit escalates, and undo never erases charges.
- [ ] Record renderer/asset/font/voice rights and host subscription assumptions. No-new-spend does not mean unlimited free generation. Any real paid call requires the applicable user authorization.

### M1.2 — Block timeline, captions, and voice continuity

- [ ] Implement ordered story blocks, probed clip durations, local phrases/optional words, pauses, stable IDs, source-text/settings bindings, and derived global offsets.
- [ ] Compile complete scene partitions with natural gap ownership and sample-safe final coverage. Adapt exclusive frame ends for inclusive renderer APIs; reject zero-frame intervals.
- [ ] Implement phrase captions and attributed display corrections separate from intended speech. Long phrases without words wrap/display whole; guessed split timing is draft-only.
- [ ] Prove the spec example starts at 0/2700 ms, totals 4500 ms, and a 3000 ms first clip moves block two to 3300 ms without replacing its media/timing.
- [ ] Produce three voice blocks and replace the middle one. First/third hashes remain; listen across both joins and compare natural continuity with a complete-utterance sample. Explain any neighbor regeneration and budget impact before doing it.
- [ ] Test reorder, 1000 ms pause, 300 ms breath gap, caption spelling, and last sample coverage. Synthetic scheduling tolerance: at most one frame at 30 fps; listening separately establishes perceived sync/prosody.

### M1.3 — Revisions, preview, and final export

- [ ] Implement `edit <project> --from <staging-dir> --expect <revision>` and `undo <project>` with one writer, immutable snapshots/current pointer, stable conflict errors, durable media, and append-only receipts.
- [ ] Detect direct JSON edits before preview/render/mutation, capture valid changes, and preserve invalid/uncommitted files for repair. A stale snapshot must not silently stand in for failed manual edits.
- [ ] Separate sourceRevision, generationKey, sceneRenderKey, assemblyKey, and approval identity. Do not include operational receipts in source snapshots or pixel keys.
- [ ] Deliver production validation, full preview, caption/audio preflight, and H.264/AAC final export from one captured source revision. Review current preview or use explicit autonomous-export authorization.
- [ ] Inject staging and build-promotion failures; test caption undo, voice undo retaining spend, and stale expected revision. Preserve audio/media and referenced preview selections.

**Exit gate:** A real narrated pilot and spoken revision pass NF-AC-11/12/14, with current source/build/approval provenance. A silent draft or missing-capability report cannot satisfy M1. Full final encoding may rerun; upstream voice/image reuse is the cost requirement.

## 7. M2 — Reference scenarios, profiles, and scoped preview

**Goal:** Demonstrate the same architecture across two independent projects and one derived identity-switch variant.

**Consumes:** M1 source transactions, production accounting, block timeline, render/cache keys, and one working voice route.
**Produces:** Production-ready scoped preview, reversible profile apply, music/SFX, justified recipe/media growth, three acceptance scenarios.

### M2.1 — Scope-aware preview and artifact reuse

- [ ] Implement selected ready-scene dependency closure including shared assets/audio/transition handles. Missing unrelated scene production assets are reported separately, not blocking selected preview.
- [ ] Test ready scene 2 / missing scene 7: selected preview succeeds and final fails. Unknown earlier block durations produce local timeline scope with unknown global offset, never invented timestamps.
- [ ] Check caption/style-only edits make no generation calls and preserve unrelated scene keys. Notes can invalidate editorial approval without re-rendering identical pixels.
- [ ] Add cache clean limited to disposable computed artifacts. Retained source media, history, receipts, and selected builds survive.

### M2.2 — Profile apply and visual/audio growth

- [ ] Implement profile inspect/dry-run/apply using the M1 transaction system. Diff render/production/editorial effects and existing overrides; preserve allowed overrides, block unresolved conflicts, never silently reset locked values.
- [ ] Permit schema-valid apply as needs-production when voice/assets become stale. Final remains blocked until replacements are ready. Undo restores the old profile/media while retaining any incurred cost.
- [ ] Direct profile editing/clone supports future defaults; project overrides affect the current project. No new profile GUI is needed.
- [ ] Add map/timeline/stat/list/comparison/diagram as composition recipes first. Dedicated visual components need demonstrated recipe limitations, not an upfront nine-renderer checklist.
- [ ] Add required enter/exit/deemphasize/draw/flow/count and push/mask transitions with compatibility/boundary tests. Enable SVG/video/additional image/audio/font formats only after their safety/decode tests pass.
- [ ] Add one optional music track plus SFX, volume/loop/trim/fades/ducking; verify decode, intelligibility, and no timeline-duration changes from transitions.

### M2.3 — Two source projects and one variant

- [ ] Build `test-fixtures/project-current-issues/` and `test-fixtures/project-general-explainer/` as independent source projects.
- [ ] Current issues exercises map/timeline/diagram-composition/captions/music/SFX and dated factual source review. The second exercises media/stat/list-comparison/composition without globally inheriting current-affairs rules.
- [ ] Use `test-fixtures/profiles/contrast/` to derive the profile-switch variant; it is not the user's next public niche.
- [ ] Both projects and the variant preview/render without executable per-project code. Review profile distinction, layout, audio, and source/asset invalidation.

**Exit gate:** NF-AC-03/08/13 pass with real renders, profile diff/undo evidence, and the tested capability/media registry. No source `examples/` directory is needed.

## 8. M3 — Owner dogfooding and release evidence

**Goal:** Establish repeatability and recovery for Fatih on the reference setup; no three-person nondeveloper study is required.

**Consumes:** M2 projects, profile variant, built CLI/skill, pinned runtime, receipts, and all accepted requirements.
**Produces:** Linked automated/runtime/visual evidence and a usable operating handoff, with honest measured limits.

### M3.1 — Automated acceptance and recovery

- [ ] Run workspace verify plus renderer E2E on both projects and the derived variant.
- [ ] Check exact issue/exit codes, missing browser, unsafe assets, invalid timing/word requirements, stale sources, cache preservation, source/build atomicity, and cancellation.
- [ ] Compare canonical compiled hashes and selected decoded pixel hashes twice on the same runtime; do not claim cross-machine or encoded-MP4 byte identity.
- [ ] Probe final dimensions/fps/codec/audio/duration; check pause/sample-boundary fixtures within one video frame of synthetic scheduling expectations.

### M3.2 — Human visual/audio and mixed-route workflow

- [ ] Fatih previews through the skill, changes caption size in JSON, validates/previews via CLI, returns to the skill for export, and exercises undo/error recovery without renderer-code edits (NF-AC-10).
- [ ] Review full videos and contact sheets for safe zones, readable type, caption meaning/timing, voice joins, music balance, illustrated progression, transition continuity, asset consistency, and template repetition.
- [ ] Report sampled layout coverage honestly; an unsampled mid-motion clipping fixture requires motion review, not a false all-frame-safety claim.
- [ ] Record failures with scene/frame/time references, fix only affected dependencies, and rerun the corresponding checks.

### M3.3 — Metrics and handoff

- [ ] Record compile/preflight/scoped-preview/full-preview/final times, active manual steps, failures, attempted generation, reused assets, and estimated/observed/unknown cash/quota usage for each scenario.
- [ ] Record peak resource observations if available. Do not invent performance/cost thresholds or treat local compute as zero total cost.
- [ ] Update README operating guidance and the evidence/status sections in these existing docs. Keep runtime decisions and measured formats here; do not create redundant plan/review documents.
- [ ] Account for NF-AC-01 through NF-AC-14 with evidence. Any unmet High finding requires a corrected implementation/design or explicit scoped deferral; accepted wording alone is not closure.

**Exit gate:** All applicable acceptance criteria have passing evidence and Fatih has reviewed the outputs. Known limits/deferred items are explicit. MVP completion cannot be declared from static checks alone.

## 9. Requirement and finding traceability

| Requirement area | Delivery / proof |
|---|---|
| NF-PR-01–07 principles | M0.2–M0.7 boundaries; M1–M3 preserve them |
| NF-UX-01/02 and NF-AC-10 | M0.6 CLI, M0.8 skill/manual loop; M3.2 full mixed-route dogfooding |
| NF-FL-01/02/04 | M0.3 project creation and M0.8 draft loop; M2.1 scoped production preview |
| NF-FL-03/05 and NF-CAP-01 | M1.1/2/3 verified narration and approved final |
| NF-CO-01 and NF-AC-11 | M1.1 ledger/capability tests; M3.3 measured costs |
| NF-PJ-01/02 | M0.2 schemas, M0.3 source revision, M0.6 readiness; M1.3 durable revisions |
| NF-PF-01/02/03/05 | M0.2 profile schema, M0.3 portable lock, M0.8 real profile; M2.2 extended checks |
| NF-PF-04 and NF-AC-08 | M2.2 transactional profile apply |
| Scene/layer/action/transition model | M0.2 contracts, M0.4 compiler, M0.5 renderer; M2.2 recipe growth |
| NF-TL-01–05 and NF-REV-01 | M1.2 block compiler; M2.1 local scoped offsets |
| NF-CAPTION-01 and audio | M1.2 captions/voice; M2.2 music/SFX |
| NF-AS-01–03 | M0.2 schema, M0.3 path/hash safety, M0.5 offline renderer; M1.1/2 provenance; M2.2 formats |
| NF-CP-01–03 | M0.4 deterministic compiler and M0.5 selected pixels; M1.3 key separation; M3.1 repeat proof |
| NF-CA-01–03 | M0.7 complete-build publication; M1.3 additional keys; M2.1 cache clean |
| NF-REV-02 and NF-AC-14 | M1.3 source transactions; M2.2 apply/undo |
| NF-CL-01–04 and NF-AC-09 | M0.6 command contract; M1/M2 new commands; M3.1 acceptance |
| NF-PV-01 and NF-AC-13 | M0.4 draft scope, M0.5 render, M0.7 artifacts; M2.1 production scope; M3.2 sampled QA |
| NF-QA-01–05 | M0.5 renderer, M0.7 review artifacts, M0.8 review; M1.3 final; M3.1/2 full checks |
| NF-AC-01/02 | M1.3 offline final and actual narrated path; M3.1 repeat |
| NF-AC-03 | M2.3 two source projects + derived variant |
| NF-AC-04/05/06/07 | M1.2/3 edits/failures; M3.1/2 determinism and visual QA |
| NF-AC-12 | M1.2 partial voice and continuity evidence |

| Finding | Adopted change | Delivery gate |
|---|---|---|
| AR-01 | Withdrawn; preserve technical-user target | No novice gate |
| AR-02 | Budget, receipts, retries, license/usage visibility | M1.1/M3.3 |
| AR-03 | Real voice/timing route and labelled fallback | M0.5/M0.8 fallback; M1.1 voice route |
| AR-04 | Story blocks and local regeneration | M1.2 |
| AR-05 | Scoped/draft readiness | M0.4–M0.7 draft; M2.1 production scope |
| AR-06 | Source snapshots and undo | M1.3 |
| AR-07 | Early complete skill/CLI/core slice | M0.1–M0.8 |
| AR-08 | Executable phase plan before work | Sections 4–5; implementation code stays in work stage |
| AR-09 | Separate source/generation/scene/assembly/approval keys | M1.3/M2.1 |
| AR-10 | Normal gap ownership and inclusive API adapter | M1.2 |
| AR-11 | Reversible needs-production profile apply/overrides | M2.2 |
| AR-12 | Caption display corrections without unwanted retakes | M1.2 |
| AR-13 | External-egress rule, atomic build set, sampled QA limits | M0.5/M0.7/M0.8; M3.2 |
| AR-14 | Separate accepted design from verified evidence | Every gate; refine-spec status register |

## 10. Revision acceptance matrix

| Edit | External generation | Retained work / required checks |
|---|---|---|
| Caption size/color | None | Voice/images and unrelated scene keys retained; preview affected scene |
| Caption spelling | None if audio already correct | Attributed display correction; intended speech remains distinct |
| Identity palette | None | Revalidate affected layouts/render tokens; final may re-encode |
| Replace scene image | Only if a new asset must be generated and authorized | Preserve other assets; verify dependencies/provenance |
| Shorten one paragraph | Owning block first; neighbor only for explained continuity need | Reuse other clips/local timings; shift global offsets |
| Reorder story blocks | Not automatic | Move blocks/scenes together; review narrative/music boundaries |
| Hold diagram 1000 ms | None | Explicit pause; shift downstream offsets without voice regeneration |
| Apply profile | Only incompatible production dependencies | Show editorial/override conflicts, needs-production state, reversible apply |

Every edit uses the same source transaction and preserves spend/receipts across undo. Test failed partial runs, not only successful examples.

## 11. Runtime decisions and evidence register

| Decision / measurement | Current status | Required before |
|---|---|---|
| Node/pnpm/TypeScript/React/Remotion/Zod/Vitest/Biome | M0.1 verified on 2026-09-08: 24.20.0 / 12.3.4 / 7.0.2 / 19.2.8 / 4.0.521 / 4.5.4 / 5.0.0 / 2.5.12. Install, frozen install, package graph, tests, typecheck, and build passed. M0.2 additionally proved the basic Remotion bundle/select/render path with the pinned stack. | M0.5 hardening |
| Lockfile | `pnpm-lock.yaml` SHA-256 `047e2a98a570ad9a171b4fdba9d8bf297dedfc357986e9ec8b1de49dd3694b82` | Recheck after dependency changes |
| Browser and FFmpeg exact paths/versions | Detected on 2026-09-08: Google Chrome `152.0.7977.76` at `/Applications/Google Chrome.app`; FFmpeg/FFprobe `7.1.1` at `/opt/homebrew/bin`. M0.2 rendered and probed the development preview using these binaries. | M0.5 hardening |
| M0.2 runnable draft | `pnpm naraframe validate samples/krakatau-draft` compiled 450 frames. `pnpm naraframe preview samples/krakatau-draft --draft` produced `samples/krakatau-draft/preview/dev-preview.mp4`; FFprobe reported H.264, 540 × 960, 30 fps, 15.000000 s. Three sampled scenes and the visible `DRAFT • NO AUDIO` label were inspected through `preview/m0-2-contact-sheet.png`. Unit 3/3, focused integration 4/4, and full 15-second render smoke 1/1 passed after the manual render. | M0.2 complete; rerun at M0 exit |
| Font/PNG/native-layer baseline | M0.2 proved system-font text, rectangle/native layout, and planned-PNG placeholder rendering. Local font and ready-PNG decoding remain unproven. | M0 exit |
| External-egress and explicit-browser behavior | Not run | M0 exit |
| Deterministic compiled/selected frame hashes | Not run | M0 exit; repeated at M3 |
| Additional SVG/video/audio/font formats | Not enabled until respective tests pass | Feature enablement M1/M2 |
| Encode settings and final audio sample coverage | Not run | M1 narrated export |
| Indonesian TTS/phrase-timing recipe and price/usage evidence | Not available as verified route | M1 narrated pilot |
| Block prosody and partial voice replacement | Not run | M1 exit |
| Budget/unknown-result/retry tests | Not run | Any paid pilot operation |
| Source/build crash recovery and profile rollback | Not run | M1/M2 feature gates |
| Owner workflow, render latency, cost/reuse | Not measured | M3 exit |

No table row is passed by updating documents. Store actual build artifact paths/hashes, commands, dates, and observed outcomes when execution happens. Test findings and unresolved design changes remain visible in `docs/refine-spec.md`.

## 12. Post-MVP observation

After acceptance, produce at least 10 real videos before choosing GUI/provider/MCP expansion. Continue tracking unsupported visuals, manual corrections, profile changes, voice-sync work, failures, latency, and actual/estimated/unknown cost. The first GUI remains a later constrained authoring surface over the same contracts, not an MVP dependency.
