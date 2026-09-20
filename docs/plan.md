# NaraFrame MVP Implementation Plan

> **For execution:** implement the active numbered task in this workspace, with a review checkpoint after each task. The plan defines intent, boundaries, contracts, and proof; implementation details belong to the work stage.

**Goal:** Deliver a usable local motion-video workflow for Fatih, with direct JSON/CLI control, agent orchestration, controlled generation cost, and localized reversible revisions.

**Architecture:** Interleave skill → CLI/core validation/compilation → Remotion rendering. Keep external production operations outside core/renderer. The approved M0.9 correction strengthens the declarative layer/profile contract and renderer preflight before narration work begins; it does not introduce per-project TSX.

**Tech Stack:** Verified workspace pins for M0: Node 24.20.0 LTS, pnpm 12.3.4, TypeScript 7.0.2, React/React DOM 19.2.8, Remotion/@remotion packages 4.0.521, Zod 4.5.4, Vitest 5.0.0, and Biome 2.5.12. Install, frozen-lockfile, test, typecheck, build, the local H.264 draft renderer, atomic publication, operator CLI/skill route, offline sandbox, and cross-feature E2E are verified.

Status: M0 and M1 complete. Fatih accepted the Kore pilot final export (`115247388b67-98323b06-dd5`) on 2026-09-20; M2 (reference scenarios, profiles, scoped preview) is next, and the owner's visual-quality note is its first named failing project.
Revision: 1.3
Date: 2026-09-14
Inputs: `docs/spec.md` revision 0.4 and `docs/refine-spec.md`.
Implementation: M0.1–M0.8 remain verified for their stated technical draft scope. M0.9 adds profile-driven typography/appearance, bounded layout, exact masked primitives, loaded-font visual preflight, shared motion geometry, a group-transform preflight correctness fix, and a corrected/re-verified LBC benchmark. Automated/runtime gates and owner visual acceptance are both complete. M0.10 is specified and not started.

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
| M0.9 | LBC draft with reliable typography, masks, layout, and stronger shot continuity | Can declarative output approach direct Remotion without per-project TSX? |
| M0.10 | The same draft stops reading as narrated slides | Can sameness be detected and prevented mechanically instead of by taste review? |
| M1 | Narrated pilot, caption, budget, edit/undo | Can one spoken section be revised economically and sound natural? |
| M2 | Two independent projects + one profile-switch variant | Do styles, partial preview, recipes, and audio remain coherent? |
| M3 | Owner dogfooding and release evidence | Is the workflow repeatable and recoverable on the reference setup? |

AR-01 was withdrawn after target-user clarification. AR-02–AR-14 have mixed implementation states recorded in `docs/refine-spec.md`; the M0 portions are no longer described as unimplemented. New VF-01–VF-07 findings are accepted-for-spec and not implemented/verified until M0.9 runs.

M0 is a draft milestone, not an excuse to count a silent video as narrated-MVP completion. M0.9 is a corrective visual gate, not a retroactive failure of M0's runtime/CLI deliverables. Missing TTS can produce an actionable fallback, but M1 cannot begin until M0.9 passes and cannot pass without a verified Indonesian narration/timing recipe.

### Where this tool competes

NaraFrame is built on Remotion and does not compete with it. The comparable tool is an agent skill such as `bang-motion`, which lets an agent write arbitrary GSAP/Three.js and constrains taste with advisory rules, style menus, starters, and screenshot review. That approach wins on expressive range and on distribution: its deliverable is one double-clickable HTML file.

NaraFrame must not try to win on expressive range. A declarative contract will always lose to arbitrary code on the last 20% of any visual idea, and chasing it means rebuilding a taste-menu system inside a schema, which is strictly harder. The position worth holding is the opposite one: because the output is a validated declarative structure rather than arbitrary code, art-direction and safety rules can be **checked by machine before rendering** — collisions, overflow, contrast, sameness, missing sources — and generation can be **accounted for and partially regenerated**. Advisory rules cannot do either.

Two consequences bind the rest of this plan. First, every taste rule worth adopting should enter as a compiler or preflight check with a stable issue code, not as prose guidance in the skill. Second, scope growth that only widens expressive range is suspect; scope growth that makes a defect detectable, an artifact reviewable, or a revision cheaper is the priority.

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

This is the implementation plan described by the spec-driven workflow. There is no second or more detailed plan between this document and coding. M0.10 is expanded because it is the next work unit; M1–M3 remain roadmap-level until evidence from the preceding milestone exists.

Delivery is feature-driven, confirmed in practice during M0.9: build the real path first, show the working output, then add focused automated coverage. Tests protect behavior that has already been demonstrated; they are not the first gate. Each task is a small user-visible feature and must end in behavior Fatih can run or an artifact he can inspect. M0.8 adds cross-feature E2E, failure-injection, and runtime evidence; it is not the first testing point. TypeScript bodies, fixtures, package manifests, and renderer details belong to execution. If implementation reveals a material product or architecture change, update the relevant spec/refinement decision before continuing.

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

- [x] Implement `naraframe create <name> --profile <id-or-path>` using atomic staging and rename.
- [x] Create `naraframe.json`, `profile.lock.json`, `scenes.json`, `assets/manifest.json`, preview directories, and attempt directories.
- [x] Copy/hash render-critical profile assets so the project no longer depends on the source profile.
- [x] Implement safe relative-path resolution, ready-PNG hash checks, and deterministic source revision calculation.
- [x] Run the built CLI to create a temporary project, add one scene through direct JSON editing, validate it, and produce a draft preview.
- [x] Add focused create/profile-lock/path/hash tests after the manual flow works, then run the integration gate.

**Checkpoint:** Keep the created project and preview path long enough for manual inspection, then protect the accepted behavior before merge.

### Task M0.4: Complete the M0 visual and motion capability set

**Outcome:** The runnable draft supports every visual capability promised by M0.

- [x] Add text, local PNG image, rectangle/circle shape, and non-recursive group layers.
- [x] Add scene visual types `text`, `media`, and `composition` plus `cut` transitions.
- [x] Add bounded `reveal`, `emphasize`, and `focus` actions using deterministic frame arithmetic.
- [x] Resolve full-project and selected-scene draft scope, half-open frame boundaries, and labelled placeholders.
- [x] Reject raw keyframes, executable fields, unknown actions, recursive groups, broken references, and unsupported SVG/video.
- [x] Manually render the reference frames twice and compare hashes as an early determinism signal.
- [x] Add focused layer/action/reference/frame-boundary tests after the visual flow works, then run the integration gate.

**Checkpoint:** Watch the full video and confirm the explanatory state changes, rather than accepting motion on a title alone.

### Task M0.5: Publish complete preview builds atomically

**Outcome:** Every successful preview is an immutable review package instead of a loose MP4.

- [x] Render into `.naraframe/attempts/<id>/` and publish complete builds under `preview/builds/<build-id>/`.
- [x] Produce `preview.mp4`, `contact-sheet.png`, `frames.json`, `report.json`, and `manifest.json` under one build ID.
- [x] Validate hashes/signatures and promote `preview/current.json` atomically only after every artifact is complete.
- [x] Preserve the previous current build on render failure, interruption, corrupt MP4, or incomplete report.
- [x] Include runtime versions, source revision, assembly key, draft scope, checked frames, and the silent-draft label in reports.
- [x] Manually inject one publication failure and inspect that the previous current build remains selected.
- [x] Add focused atomic-publication and artifact-integrity tests after manual failure injection, then run the integration gate.

**Checkpoint:** Fatih can inspect one directory containing the video and all review evidence for the same build.

### Task M0.6: Finish the operator-facing CLI and NaraFrame skill

**Outcome:** The same product path works from terminal and from an agent using the skill.

- [x] Complete `doctor`, `schema`, `create`, `validate --stage plan`, `status`, and `preview --draft`.
- [x] Support concise human output and exactly one final versioned JSON event on stdout in `--json` mode.
- [x] Map usage, source, system, and cancellation failures to exit codes 3, 1, 2, and 130.
- [x] Return actionable issues with stable code, artifact, path/entity, responsibility, message, and suggestion.
- [x] Add `skills/naraframe/SKILL.md` with the profile-first interleaved flow. The skill calls the public CLI and does not duplicate schemas.
- [x] Follow the skill once against the reference sample and confirm it reaches the same preview build as direct CLI use.
- [x] Add focused CLI/skill compatibility and exit-code tests after both operator paths work, then run the integration gate.

**Checkpoint:** Terminal and skill operation resolve the same project contract and artifact paths.

### Task M0.7: Run the owner trial and revise the real workflow

**Outcome:** Fatih tries the product before test coverage is frozen around it.

- [x] Give Fatih the shortest exact setup and preview commands.
- [x] Open the real preview/contact sheet for review.
- [x] Have Fatih change one closing line directly in JSON, validate, and preview again without renderer-code edits.
- [x] Run one intentionally invalid `bounce` action and assess whether the error identifies the source path and correction clearly.
- [x] Fix usability or contract problems found during this trial and add regression tests before merge.
- [x] Record active time, render time, assistance needed, source/build IDs, and review notes.

Trial evidence: the clean M0.7 worktree started from `0789b08`. Ambient Node `23.10.0` correctly failed `doctor` with `NODE_VERSION_INCOMPATIBLE`; prepending `/opt/homebrew/opt/node@24/bin` activated Node `24.20.0` and pnpm `12.3.4`, after which every doctor check passed. The first full baseline preview published build `41b6900277c8-5a908e88-4e1` from source revision `09b2333daa03081bc485868915d413d09556a22e81fa95a93c84cb48c8e7f531` and assembly key `41b6900277c8ed8533002fbaadecf8cd9b39a9cae4d758d344d6389f6ec63d7d`. The CLI measured 38.283 seconds; the immutable report spans 37.945 seconds and the observed wall time was 52.58 seconds. Fatih directly changed the closing copy in `scenes.json` to “Dampaknya melampaui Selat Sunda. Laut, atmosfer, dan iklim dunia ikut berubah.” without touching renderer code. Validation passed with new source revision `0e2f2b8aef04611c672f7edb872d5bda29a5bea81d74591545b72917f6fcf60b` and assembly key `0654538e7ce0a856b23a707520b7472c0c21aaf1f4261eec86b7c4de5d3daa5c`; `status` first reported the baseline stale, then the rerender published current build `0654538e7ce0-2b154c13-273`. The rerender CLI measured 43.471 seconds, its report spans 43.074 seconds, and observed wall time was 66.98 seconds. Both 540 × 960, 30 fps, 18-second silent MP4s and their 11-frame contact sheets were opened for review. The revised closing remains inside the visual safe area with one additional text line. Owner visual review rejected the first motion result as ordinary cuts with image motion too subtle to notice. Inspection explains the result: the previous image focus reached only about 4.2% scale and 8 px vertical translation, its reveal travelled about 32 px over 0.8 seconds, and the marker pulsed once. The revision adds bounded `linear`/`smooth`/`snappy` easing presets to the generic reveal/emphasize/focus contract, makes focus smooth by default, and increases generic camera travel. Profile `current-issues` 0.2 raises focus scale to 1.14 and instructs context-derived choreography. The Krakatau sample alone stages panel, map, marker, and copy reveals, uses a 4.2-second map push, and pulses its event marker twice; this sample choreography is reference evidence, not a global video template. Revised build `96b57423d8ff-16e8cc76-28a` is current for source revision `f256ab60b4ff34fff5e260c20a51a7b02466d180927eb3a575d6d4357581993d` and assembly key `96b57423d8ff015bd1f5b2941e4d847c8ac49bc94dcd01f8bb5c64786e37649f`; CLI/report/wall timing was 37.019/37.019/51.88 seconds. FFprobe reports H.264, 540 × 960, 30 fps, 18 seconds, and no audio. Its 14-frame contact sheet shows the staged context progression. Focused unit 7/7 and integration 7/7 checks passed, followed by the full `pnpm verify` gate with unit 13/13 and integration 39/39. A separate source copy with `bounce` at `/scenes/1/beats/3/action` exited 1 with `SCHEMA_INVALID`, responsible `agent`, the exact `scenes.json` path, the supported actions, and a correction suggestion; restoring `focus` validated successfully. Remotion required loopback permission in the Codex sandbox, which is an execution-environment constraint rather than a project-source failure. Agent assistance supplied the tested runtime command and ran validation/render after Fatih saved the edit. Fatih accepted the revised, context-driven motion on 2026-09-14. Owner active time was not measured during the trial and is recorded as unavailable; the next timed trial must start its timer before setup. M0.7 passes with that explicit measurement limitation.

**Checkpoint:** M0.7 requires Fatih's hands-on confirmation; agent-only inspection is insufficient.

### Task M0.8: Add cross-feature coverage, harden failures, and close M0

**Outcome:** Cross-feature and runtime tests protect the complete workflow that already worked feature-by-feature.

Live execution tracker:

Current step: **M0 and M1 complete and merged (PRs #10 and #11). M2.1 (scope-aware preview and artifact reuse) is code-complete on `feat/m2-1-scoped-preview`: a preview of one narrated scene on its own timeline, per-scene dependency closure with out-of-scope gaps reported as info, pixel reuse for changes that cannot alter a pixel, `pendingGeneration`, and `cache clean`. 133 unit / 196 integration tests, and e2e 3/3 in 233 s. Next: open the M2.1 PR, then M2.2 (profile apply and visual/audio growth), whose first evidence is the owner's visual-quality note on the Kore pilot. Known open items: the pre-existing pixel non-determinism behind the intermittent `owner-flow` e2e failure, and receipts-based proof of the cost claim (M3.3).**

- [x] **M0.8.1 — Isolated pinned baseline:** create the short-lived worktree from current `origin/main`, complete a frozen install without lockfile drift, and pass the existing verification suite.
- [x] **M0.8.2 — Contract gap closure:** mapped existing coverage and added the missing source/reference, key-order determinism, motion-boundary, and public-package assertions; unit coverage passes 16/16.
- [x] **M0.8.3 — Runtime boundary hardening:** explicit browser/FFmpeg failures and no-download behavior pass; the owner-flow render succeeds with loopback allowed and external egress denied; existing atomic failure-injection coverage remains green.
- [x] **M0.8.4 — CLI safety matrix:** all M0 commands retain structured success/failure results and exit mappings; interruption coverage remains green and unexpected renderer secret/path details are absent from JSON and stderr.
- [x] **M0.8.5 — Owner-flow E2E:** a copied 15-second Krakatau source validates, renders, passes complete artifact checks, becomes stale after one-line editing, rerenders, rejects `bounce` at the exact source path, and validates again after recovery.
- [x] **M0.8.6 — Determinism and artifact evidence:** repeated sandboxed renders match at lossless frames 18/180/405; FFprobe, full decode, immutable artifact hashes, and the sampled-review limitation are recorded below.
- [x] **M0.8.7 — M0 exit gate:** final frozen install reused 279 packages with zero downloads; `pnpm verify` passed unit 16/16 and integration 41/41; final serial `pnpm test:e2e` passed 2/2 in 180.37 seconds; evidence registers are current.

- [x] Add unit tests for source schemas, references, timing/compiler determinism, motion boundaries, and package exports.
- [x] Add integration tests for create/load, safe paths, renderer/browser/FFmpeg behavior, external-egress denial with loopback allowance, and atomic preview publication.
- [x] Add CLI tests for commands, structured output, exit codes, cancellation, and failure redaction.
- [x] Add an E2E test that copies the Krakatau sample, validates it, renders a 15-second silent draft, inspects all review artifacts, edits one line, rerenders, and verifies the invalid-action failure.
- [x] Run `pnpm install --frozen-lockfile`, `pnpm verify`, and `pnpm test:e2e` on the pinned runtime.
- [x] Record FFprobe output, repeated selected-frame hashes, sandbox evidence, failure-injection evidence, artifact hashes, and owner-review notes in section 11 and `docs/refine-spec.md`.

**M0 completion rule:** M0 remains in progress until both the manual owner trial and the final automated/runtime evidence pass. M0.8 closes integration gaps after feature-level tests already exist; it does not replace manual review.

### Task M0.9: Correct visual fidelity before narration work

**Outcome:** The same LBC source intent and local assets render through NaraFrame with reliable rounded media, non-overlapping text, clear type hierarchy, revision-tolerant layout, and context-appropriate motion—without project-specific React/TSX.

**Why this interrupts M1:** The original M0 gate proved the runtime, compiler, renderer, CLI/skill loop, publication safety, and context-driven motion. The later side-by-side LBC trial exposed that box coordinates alone are not a sufficient visual contract. Starting narration now would protect audio work on top of a layout system that still corrupts real content.

**Expected source areas:** modify `packages/core/src/schema/scene.ts`, `packages/core/src/schema/profile.ts`, `packages/core/src/schema/compiled.ts`, and `packages/core/src/compiler/compile-draft.ts`; split focused layer/layout/preflight responsibilities out of `packages/renderer-remotion/src/remotion/draft-video.tsx` when implementation begins; update corresponding core/renderer/CLI tests, `skills/naraframe/SKILL.md`, and the `current-issues` profile. Exact file decomposition is an implementation decision, not a reason to create another plan.

Live execution tracker:

- [x] **M0.9.1 — Freeze the defect benchmark:** retained `work/lbc-benchmark/engine/`, direct-Remotion source, both 30-second 540 × 960 silent outputs, comparison sheet, hashes, and review notes for seconds 8/15/21/27. VF-01–VF-07 classify the defects across schema, profile, renderer, preflight, layout, choreography, and roadmap order. Result: a repeatable failing baseline, not a visual pass.
- [x] **M0.9.2 — Add the layer appearance contract:** optional schema-version-1 typography, image crop/focal point, radius/stroke/shadow, and bounded group layout compile through profile/default resolution. Existing Krakatau remains render-compatible through explicit legacy defaults; bounded contract regressions pass.
- [x] **M0.9.3 — Strengthen profile typography and visual tokens:** `current-issues` 0.3 and the LBC profile lock now define role scale, minimum size, radius, stroke/shadow, and media defaults. Profile direction and the NaraFrame skill require a shot rundown, one dominant statement, bounded layout, and visual state review.
- [x] **M0.9.4 — Render exact primitives:** resolved type, padding/alignment, crop/focal point, radius, stroke, and shadow are applied by dedicated layer branches. Media and its motion are clipped by the declared mask; the corrected LBC frames visibly preserve rounded geometry.
- [x] **M0.9.5 — Add measured layout and visual preflight:** exact `@remotion/layout-utils@4.0.521` measurement runs after fonts load, bounded shrink updates render input, and stable visual issues block publication. The deliberate LBC collision exited 1 with `TEXT_COLLISION`; the corrected project published with zero issues. A follow-up review found collision rectangles for members of a transformed/animated group were checked at their untransformed local position, not the position `GroupView` actually renders — group transform/beat motion is now folded into both the collision rectangle and visibility-opacity check (`groupScreenTransformFor` shared between `draft-video.tsx` and `visual-preflight.ts`), with a regression test for a collision that only exists after the group's static transform is applied.
- [x] **M0.9.6 — Improve shot continuity without exposing keyframes:** reveal/emphasize/focus use one shared numeric motion model and focus accepts bounded anchors. The benchmark did not require another transition primitive, so cut timing remains stable and no speculative wipe was added.
- [x] **M0.9.7 — Rerender and accept LBC parity:** after the M0.9.5 group-transform preflight fix, rerendered build `16abeb583bc2-086fdfc0-b9f` (same source revision/assembly key as the earlier build; the LBC engine's own groups use identity transforms with no beats, so the fix does not change its pixels, but the build is re-attested against the corrected code rather than carried forward unverified), its 93-state contact sheet, four-moment comparison, targeted regressions (including the new group-transform unit tests), `pnpm verify`, and `pnpm test:e2e` all pass. Fatih reviewed the rendered MP4 and the four-moment comparison and accepted it on 2026-09-14, noting precision (masks/collision/hierarchy) is clearly improved over the prior baseline; residual transition/font-family/shape-variety monotony versus the direct-Remotion reference is acknowledged and explicitly deferred to M2.2 (`docs/plan.md` §M2.2), not treated as an M0.9 defect. M1.1 is unpaused.

Primary operator proof:

```bash
pnpm naraframe validate work/lbc-benchmark/engine --stage plan --json
pnpm naraframe preview work/lbc-benchmark/engine --draft --json
pnpm test:unit
pnpm test:integration
pnpm verify
pnpm test:e2e
```

The first two commands must return the same source/build contract used by normal projects; the corrected preview must not depend on `work/lbc-benchmark/direct-remotion/src/`. Tests are added after each manual feature path works, then the full gates run at M0.9.7.

**M0.9 exit gate — passed 2026-09-14:** declared rounded images are visibly rounded; required text has no collision, unintended clipping, or out-of-frame content; typography has clear roles; representative copy-length changes reflow or fail explicitly; the full 30-second silent LBC engine video and frames around seconds 8, 15, 21, and 27 were reviewed and accepted by Fatih. M1.1 is unpaused. Broader visual variety (additional transition recipes, bundled font families, domain shape recipes) remains open for M2.2 and is not part of this gate.

### Task M0.10: Break the slide ceiling before narration

**Outcome:** The same declarative source stops reading as a slideshow, and sameness becomes a reported defect instead of a taste opinion raised after the fact.

**Why this runs before M1:** M0.9 fixed precision, not monotony. Two independent reviews have now flagged the same class of problem — the M0.7 trial rejected motion as too subtle, and the accepted M0.9 build was still described as monotonous in transitions, type, and shapes against the direct-Remotion reference. Narration is recorded on top of these visuals, so doing this after M1 means re-rendering the pilot anyway. The scope is deliberately three bounded items plus a report; it is not the M2.2 recipe library.

**Expected source areas:** add `packages/core/src/compiler/variety.ts` for repetition checks over pre-render project/compiled data, wired from `packages/core/src/compiler/compile-draft.ts`; add a `variety` policy to `packages/core/src/schema/profile.ts`; add transition primitives through `packages/core/src/schema/scene.ts` and `compile-draft.ts`; enable profile font assets already declared by `profile.ts`; extend the published build artifacts in `packages/cli/src/preview-build.ts`.

- [x] **M0.10.1 — Detect sameness mechanically.** Added `checkVariety` in `packages/core/src/compiler/variety.ts`, run from `compileDraft` only for project-scope compiles (a single scene cannot repeat against neighbours it does not see), with stable codes `MOTION_REPETITION` (more than a policy-bounded run of consecutive scenes sharing the same earliest-beat entry signature), `VIEWPOINT_STATIC` (a run of scenes with no `focus` beat), `SINGLE_TRANSITION_TYPE` (every scene in a 3+-scene project shares one transition), and `TYPOGRAPHY_FLAT` (4+ resolved text layers all share one font size). Default severity is warning; `profile.render.variety` can raise it to error or change the bounds. Pure function over compiled data — no browser, no measurement, no render. Manually run before any test existed: `pnpm naraframe validate samples/krakatau-draft --stage plan --json` and `pnpm naraframe validate work/lbc-benchmark/engine --stage plan --json` both surfaced `SINGLE_TRANSITION_TYPE` (every scene in both projects is still `cut`, since M0.10.2 has not landed); neither surfaced `MOTION_REPETITION`, `VIEWPOINT_STATIC`, or `TYPOGRAPHY_FLAT` — the accepted LBC build's remaining monotony is specifically the missing transition variety, not motion or type, which matches the informal review that flagged transitions ahead of the other two. 10 unit tests (`packages/core/test/unit/variety.test.ts`) and 2 integration tests confirming the project/scene-scope wiring boundary; full `pnpm verify` (unit 35/35, integration 43/43) and `pnpm test:e2e` (2/2, 180.45s) pass, after widening three pre-existing CLI/e2e assertions from an exact issues-array match to `arrayContaining`, since they were incidentally asserting "zero other issues" rather than the specific code they named.
- [x] **M0.10.2 — Add bounded transition primitives.** `scene.transition` is now a discriminated union — `cut | push-through | mask-reveal | match-cut` — each carrying a bounded `durationMs` (200–1200ms) plus its own params (direction, mask shape, or anchor). No compiled frame ranges overlap: each primitive is implemented as two independent halves, an exit treatment in the outgoing scene's own tail frames and an entry treatment in the incoming scene's own head frames (`sceneTransitionStateFor` in `packages/renderer-remotion/src/remotion/motion.ts`), so the existing non-overlapping scene-timeline contract, `visual-preflight`'s frame model, and the CLI's checked-frame selection all stay unchanged. Push-through translates+scales+fades along a direction with the entry arriving from the opposite edge; mask-reveal clips the entry with an expanding circle/rectangle `clipPath` while the exit fades; match-cut scales in/out around a shared anchor with no fade, for continuity across the cut. Compile-time validation added three codes: `TRANSITION_DURATION_EXCEEDS_SCENE` (doesn't fit inside either neighbouring scene), `TRANSITION_OVERLAP_WITHIN_SCENE` (a short scene's own incoming and outgoing halves would overlap each other), and `TRANSITION_ON_FINAL_SCENE_IGNORED` (warning; a transition on the last scene has no next scene to play into). Following the M0.9.7 group-transform precedent, `visual-preflight.ts` folds the same scene-transition state into every checked-frame text rectangle and opacity check (`applySceneTransition`), so a layer checked mid-transition is checked at its actual on-screen position/scale — `clipPath` is deliberately excluded from that fold since it clips paint, not layout. Manually proven before any test was written: a 4-scene probe (`work/m0-10-2-transitions-probe/`) using one of each primitive rendered cleanly with `SINGLE_TRANSITION_TYPE` gone (four distinct types now in use), and a boundary-frame contact sheet around each cut confirms the three primitives are visually distinct; a second probe confirmed `TRANSITION_DURATION_EXCEEDS_SCENE`, `TRANSITION_OVERLAP_WITHIN_SCENE`, and `TRANSITION_ON_FINAL_SCENE_IGNORED` all fire on the inputs designed to trigger them. Full `pnpm verify` (unit 35/35, integration 43/43) and `pnpm test:e2e` (2/2, 184.44s) pass against the existing samples, which still use `cut` only — new unit coverage for the primitives themselves is deferred to the M0.10 test pass rather than added per sub-task.
- [x] **M0.10.3 — Enable bundled profile fonts.** Copying/hashing/locking profile font assets already worked since M0.3 (kind-agnostic); the missing piece was that `family`/`weight` were declared in schema but silently dropped by `prepareProfileAssets` when writing `profile.lock.json` (fixed), and nothing exposed the locked font to the compiled draft or actually loaded it in the browser. Added `render.typography.displayFontFamily` (bounded to the `display` role and the scene-level "text" visual only — every other role keeps the base family) and a `fonts: CompiledFont[]` field on `CompiledDraft`, resolved from `source.profile.assets` in `compile-draft.ts`. `root.tsx`'s `calculateMetadata` registers each bundled font via the `FontFace` API (`loadBundledFonts` in the new `packages/renderer-remotion/src/remotion/typography.ts`) before `visual-preflight` runs. Manual testing surfaced a real gap and two fixes followed: (1) `document.fonts.check()` cannot distinguish "a declared family that was never registered at all" from "genuinely loaded" — an unrelated string typo'd into `displayFontFamily` rendered successfully via silent system-font fallback instead of failing, so a compile-time check (`DISPLAY_FONT_NOT_DECLARED`) now requires `displayFontFamily` to match a locked font asset's `family` before render is attempted; (2) `loadBundledFonts` now returns the `Set` of families that actually finished loading, and `resolveVisualPreflight` cross-checks a layer's resolved family against that set specifically when the family is a declared bundled asset, so a font that is correctly declared but fails to parse/load still fires `FONT_NOT_LOADED` rather than silently falling back (confirmed both ways: a genuinely corrupt-but-hash-matching `.ttf` fails with `FONT_NOT_LOADED`; a tampered hash still fails earlier with the pre-existing `ASSET_HASH_MISMATCH`). Manually verified end-to-end on a scratch profile (`work/m0-10-3-font-probe*/`, a real macOS system TTF copied in for pipeline testing only — no bundled face or licence decision has been made for actual product profiles yet, that remains open) before any test was written. Full `pnpm verify` (unit 35/35, integration 43/43) and `pnpm test:e2e` (2/2, 185.61s) pass; new unit coverage is deferred to the M0.10 test pass.
- [x] **M0.10.4 — Choice menus in the profile.** `render.variety.menu` (`packages/core/src/schema/profile.ts`) declares a permitted vocabulary — `entryDirections`, `transitionTypes`, `focusCameras` — and `checkVariety` (`packages/core/src/compiler/variety.ts`) enforces it: `ENTRY_STYLE_NOT_PERMITTED` when a scene's earliest reveal beat uses a direction outside the menu, `TRANSITION_NOT_PERMITTED` for a disallowed transition type, `FOCUS_STYLE_NOT_PERMITTED` for a disallowed focus camera. The menu is optional and additive to M0.10.1's repetition checks, not a replacement — no existing project is affected unless its profile opts in. Manually verified all three codes fire on a probe with a restrictive menu, and confirmed no regression on the unrestricted samples, before any test was written. What the menu does NOT do, to keep this honest against the original framing: it does not itself scan sibling projects or persist a cross-project/cross-time history — "checkable across projects and across time" describes a structural property (choices are now explicit literals in `profile.lock.json`/`scenes.json`, so a person or a future tool can diff them file-to-file), not an implemented scanner. Building that scanner is deferred until a real workflow needs it, per the plan's own evidence-driven-growth rule for M2.2. Full `pnpm verify` (unit 35/35, integration 43/43) and `pnpm test:e2e` (2/2, 177.81s) pass; new unit coverage is deferred to the M0.10 test pass.
- [x] **M0.10.5 — Publish a visual QA report.** Added `CONTRAST_INSUFFICIENT` (`packages/core/src/compiler/contrast.ts`): pure WCAG relative-luminance math (no DOM/canvas/render) comparing resolved text color against `palette.background`, using the WCAG large-text/normal-text 3:1/4.5:1 thresholds by font size; runs unconditionally in `compile-draft.ts` (not scope-gated like M0.10.1, since a contrast defect is real on one scene regardless of the rest of the project) so it fires during `validate` in milliseconds. Documented limitation: it only checks the flat profile background, not an actual photo/shape behind a layer at render time. `report.json` gains two new fields computed from the final `CompiledDraft` in `packages/core/src/compiler/qa-report.ts` and wired in `packages/cli/src/preview-build.ts`: `varietyMetrics` (scene count, distinct entry signatures, transition types used, focus cameras used, distinct font sizes — the M0.10.1/2/4 signals as numbers instead of issues) and `readability` (smallest font size expressed at the fixed 1080px final width, not the 540px draft-preview width it was measured at, plus every text layer's contrast ratio/threshold/pass-fail). Manually verified before any test: rendered `work/m0-10-2-transitions-probe` and `work/m0-10-3-font-probe`, inspected `report.json` directly for correct `transitionTypesUsed`/`smallestFontSizeAtFinalWidthPx`/`contrastSamples` values; a probe with a near-background text color correctly fails `validate` with `CONTRAST_INSUFFICIENT` at a computed 1.09:1 ratio. Full `pnpm verify` (unit 35/35, integration 43/43) and `pnpm test:e2e` (2/2, 178.23s) pass; new unit coverage deferred to the close-out test pass below.
- [x] Rerender the LBC engine and the Krakatau sample after the above. `samples/krakatau-draft/scenes.json` migrated its scene-to-scene transitions from all-`cut` to `push-through` (hook→context) / `mask-reveal` (context→evidence) / `cut` (evidence→impact, the last scene, which never plays a transition by rule); its frozen legacy profile lock is untouched. Rebuilt `7ca2307f9962-c723b736-548` (`preview.mp4` SHA-256 `b52e3df7c67b310411cae13d70dd7abbbb41eb6fde7648195015736b0a20d978`) compiles with zero issues, `SINGLE_TRANSITION_TYPE` gone, `varietyMetrics.transitionTypesUsed` = `["cut","mask-reveal","push-through"]`. `work/lbc-benchmark/engine/` gained a bundled display font (a macOS system TTF, Trebuchet Bold, explicitly a technical placeholder — no product font/licence decision has been made) wired through `displayFontFamily`/a locked `kind: "font"` asset, and transitions `push-through` (hook→offer) / `mask-reveal` (offer→matching) / `match-cut` (matching→progress, with an anchor) / `cut` (progress→cta, cta being the final scene). Rebuilt `4c4228974b3c-33688229-032` (`preview.mp4` SHA-256 `1aef1be2ded542dd4da58f9f7ef382d2ed97f4948ca9483205d20cf9f6a1f6c9`) compiles and renders with zero issues; `varietyMetrics` shows all four transition types used, 11 distinct font sizes, and zero failing contrast samples. Visual proof (hook scene in the bundled display face; a three-row boundary contact sheet across the push-through/mask-reveal/match-cut cuts; both full rendered MP4s) sent to Fatih for review.
- [x] Add focused tests for M0.10.1–5 and run the full close-out gates. New coverage: `packages/core/test/unit/contrast.test.ts` (10, WCAG math + `CONTRAST_INSUFFICIENT`), `packages/core/test/unit/qa-report.test.ts` (5, `computeVarietyMetrics`/`computeReadabilityMetrics`), `packages/core/test/integration/compile-draft-m0-10.test.ts` (9, `TRANSITION_DURATION_EXCEEDS_SCENE`/`TRANSITION_OVERLAP_WITHIN_SCENE`/`TRANSITION_ON_FINAL_SCENE_IGNORED`/`DISPLAY_FONT_NOT_DECLARED` via hand-built `PlanSource` fixtures), 8 new cases extending `packages/core/test/unit/variety.test.ts` for the M0.10.4 menu, `packages/renderer-remotion/test/unit/motion-transitions.test.ts` (11, `sceneTransitionStateFor` exit/entry math for all three primitives, including that travel distance scales from the draft's own width), `packages/renderer-remotion/test/unit/typography.test.ts` (2, `fontFamilyForRole`), and 3 new cases extending `visual-preflight.test.ts` for the scene-transition opacity/geometry fold. One test was dropped after the math didn't hold up under scrutiny: a uniform scene-wide scale+translate can never flip a genuine gap between two plain co-scene layers into a collision (proven algebraically — the gap is always multiplied by the same positive scale factor, never crossing zero), so "opacity-fade suppresses an otherwise-real collision" needed a reveal-beat-isolated construction instead of the naive one. Full `pnpm verify` (unit 74/74, integration 52/52) and `pnpm test:e2e` (2/2, 184.08s) pass.

**M0.10 exit gate — passed 2026-09-15:** a project that repeats one entry action across every scene, uses a single transition, or places unreadable copy is reported before publication (implemented and verified, M0.10.1–5); the rerendered LBC engine uses more than one transition type with at least one in depth, more than one type role, and a display face distinct from body text; Fatih reviewed the rerendered LBC build (`4c4228974b3c-33688229-032`) and accepted it. M1.1 is unpaused. The bundled display font is an explicit placeholder pending a real product font/licence choice; expressive parity with hand-written Remotion was never the bar.

## 6. M1 — Narrated pilot and affordable revision

**Goal:** One topic becomes a narrated explainer, then one spoken section is corrected without replacing valid unrelated audio.

**Consumes:** Tested M0 runtime/CLI/skill plus the accepted M0.9 visual contract/preflight and the M0.10 variety checks/transitions/fonts, source schemas, asset hashes, production policy, and provisioned external capabilities.
**Produces:** Story blocks and local phrase timing, one verified voice recipe, ledger/limits, captions, full preview/final export, source snapshots/edit/undo, and a per-build cost report.

Cost accounting is the capability nothing comparable offers, so it is a headline deliverable of this milestone rather than a bookkeeping detail. A build that cannot say what it spent, what it reused, and what remains uncertain has not met M1.

### M1.1 — Production readiness and accounting before generation

- [x] Skill distinguishes prepared media, silent draft, and narrated route. Verify one Indonesian TTS + phrase-timing recipe without adding provider SDKs/keys to core. (The skill now documents the three routes and what each command does on each; `resolveProductionRoute` remains a tested helper that the CLI does not call, because the routes are already distinguished by whether `narration.json` and ready audio exist.)
- [x] Implement `production.json` and append-only versioned receipts with operation IDs, request keys, authorization, upper estimates, reservations, actual/unknown usage, status, and retries.
- [x] Use sequential requests and a narrow local ledger helper. Fake-provider tests precede paid pilot calls; no generic billing service or concurrency scheduler.
- [x] Prove budget 100/spent 40/reserved 40/next 30 denies, timed-out unknown requests are not blindly resent, unknown actual cost stays conservatively reserved, two-attempt limit escalates, and undo never erases charges.
- [x] Record renderer/asset/font/voice rights and host subscription assumptions. No-new-spend does not mean unlimited free generation. Any real paid call requires the applicable user authorization.
- [x] Publish a cost report alongside each build: estimated, actual, and still-unknown spend for that source revision, plus the receipts it derives from. Unknown must stay visible as unknown rather than being rounded into a total. (`computeCostReport` implements and manually proves the estimated/actual/unknown/receipts shape from a ledger; the final export's `report.json` now carries it (`cost`, from `production.json`, null when the project has no ledger). It is project-wide; the cost of one revision is reported by `computeReuse` from receipts matched by generation key. Accepted by the owner as untracked for the free, hand-made Kore pilot.)

**Rights and subscription assumptions, recorded 2026-09-16:**

- **Renderer (Remotion 4.0.521):** dual free/company license (`LICENSE.md` bundled with the package). Individuals and small companies may use it commercially for free; a company license is required past a size threshold Remotion defines. Fatih's current individual use falls under the free tier — recheck this if NaraFrame is ever operated on behalf of a larger organization.
- **Browser/FFmpeg (Chrome, FFmpeg/FFprobe):** system-installed local binaries orchestrated for local rendering only, never redistributed as part of a build artifact. No additional obligation beyond their own end-user terms for local use.
- **Font:** the only non-system font in use is the M0.10 LBC placeholder — a macOS system font (Trebuchet MS Bold) copied only into that local project's `assets/profile/`, never redistributed publicly. This is an explicit technical placeholder, not a cleared product choice; a real display face and its licence must be chosen before any public/commercial release (already flagged at the M0.10 exit gate).
- **Voice (TTS), update 2026-09-19:** the owner generated the M1.2 pilot clips by hand in Google AI Studio (Gemini TTS, voice Kore) in the free tier. NaraFrame made no API call and holds no key. Google's terms for commercial use of generated audio, and paid pricing, have not been reviewed and must be recorded here before any published video or automated call. Original entry: no real vendor is integrated. Only the offline `createFakeTtsProvider` exists, which makes no network call and has no rights implications. When a real vendor is chosen, its terms over synthesized audio (ownership, commercial-use scope, and its actual per-character/per-minute pricing) must be recorded here before the first real paid call is authorized.
- **Images/illustration:** no paid generation service is integrated; current samples use only local/system assets.
- **Host subscription assumption:** none is currently in effect for any provider. This is a deliberate default, not an oversight: a pre-paid subscription's included quota does not make a generation call free to authorize, because consuming that quota is itself a real cost (it can exhaust the quota, trigger overage billing, or crowd out other use). Concretely, this is already enforced in code, not just written down: `ReceiptAuthorizationSchema` (`packages/core/src/schema/production.ts`) makes `authorization` a required field on `Receipt`, so `requestReservation` (`packages/core/src/production/ledger.ts`) cannot construct a receipt — reserved or otherwise — without recording who granted it and when. There is no "no-new-spend" bypass path in the ledger.

### M1.2 — Block timeline, captions, and voice continuity

- [x] Implement ordered story blocks, probed clip durations, local phrases/optional words, pauses, stable IDs, source-text/settings bindings, and derived global offsets. (`NarrationSchema` and `resolveNarrationTimeline` cover blocks, phrases/words, pauses, planned blocks, and derived offsets. `importPreparedAudio` now measures duration with ffprobe and stores the clip content-addressed; mp3/wav/m4a assets are ready/planned manifest kinds with hash verification at load. Ready audio assets may record `generation.textSha256` (and an optional `voiceStyleSignature`); `compileDraft` then refuses `STALE_VOICE` when the block text no longer matches the spoken text, `VOICE_STYLE_MISMATCH` when the profile's voice style changed, and only warns `VOICE_BINDING_MISSING` (with the hash to bind) for prepared audio that predates the binding. Whitespace-only edits are ignored. Covered by `voice-binding.test.ts`.)
- [x] Compile complete scene partitions with natural gap ownership and sample-safe final coverage. Adapt exclusive frame ends for inclusive renderer APIs; reject zero-frame intervals. (`partitionScenes` does the partition, shared rounded boundaries, ceil final end, and zero-frame rejection. Scenes carry a `narration` reference and `compileDraft` derives frame ranges and audio clips from the narration clock; the renderer plays them. Narrated Krakatau build: 1134 frames = ceil(37.8 s × 30). Covered by `compile-draft-narration.test.ts`.)
- [x] Implement phrase captions and attributed display corrections separate from intended speech. Long phrases without words wrap/display whole; guessed split timing is draft-only. (`deriveCaptionCues` and `CaptionsSchema` produce stable-id cues with attributed corrections; no split timing is ever guessed. Cues are now compiled to frames, drawn by the renderer inside the safe zone above the draft label, and checked by visual preflight: `CAPTION_OVERFLOW` when a cue needs more lines than `render.captions.maxLines`, `CAPTION_COLLISION` when scene text sits in the caption zone, and `FONT_NOT_LOADED` for the caption font. Style comes from the optional profile `render.captions` (fontSize, maxLines, bottomOffset; defaults 44/2/24 design px). Scoped previews omit captions until M2.1. Covered by `caption-preflight.test.ts` and the caption cases in `compile-draft-narration.test.ts`. Limitation: long sentences need small type or several lines because phrases are whole sentences; word-level splitting is not attempted.)
- [x] Prove the spec example starts at 0/2700 ms, totals 4500 ms, and a 3000 ms first clip moves block two to 3300 ms without replacing its media/timing.
- [x] Produce three voice blocks and replace the middle one. First/third hashes remain; listen across both joins and compare natural continuity with a complete-utterance sample. Explain any neighbor regeneration and budget impact before doing it. (2026-09-19 pilot with Google AI Studio TTS, voice Kore, clips generated by the owner in the free tier so no NaraFrame ledger spend: three blocks plus a replacement middle block; the revised build changed only the mechanism audio, kept the opening and impact clips byte-identical, and shifted impact by +960 ms. Fatih listened to both joins and accepted the audio as natural, with no neighbor regeneration needed. Earlier local-voice trial for reference: macOS `say`/Damayanti, zero cost: mechanics proven — deterministic output, replacing only the middle block changed only its hash, and measured durations shifted block C from 9850 to 10350 ms. Fatih listened to both joins and found the voice stiff with little intonation and no significant difference between the versions. That is expected and inconclusive: `say` voices phrases independently, so a neighbor's prosody cannot depend on the edited block. The natural-continuity question remains open until a context-aware vendor voice is tested.)
- [x] Test reorder, 1000 ms pause, 300 ms breath gap, caption spelling, and last sample coverage. Synthetic scheduling tolerance: at most one frame at 30 fps; listening separately establishes perceived sync/prosody. (Covered by `narration.test.ts`, `scene-partition.test.ts`, `captions.test.ts`; frame boundaries are exact integers here.)
- [x] Implement checkable source provenance for factual claims. A block or scene marked as carrying a factual claim must reference a declared source entry; `SOURCE_MISSING` blocks publication when the active profile requires sourcing. (Block-level `checkProvenance` is implemented: `SOURCE_MISSING` is an error when sourcing is required, else a warning; `SOURCE_UNKNOWN` is always an error. The profile `requireSourcing` flag exists (`current-issues` sets it) and `compileDraft` runs the check. Scenes can also be marked `carriesFactualClaim` with `sourceIds`; sources are declared once in `narration.json` or `scenes.json` (the union is used, a duplicate id is `SOURCE_DUPLICATE`), so a claim shown on screen in a silent project is as accountable as a spoken one. Manually proved on the Kore sample and covered by `scene-provenance.test.ts`.) The `current-issues` profile direction already demands separating confirmed facts from estimates, so enforce that as a contract instead of prose the agent may ignore.

### M1.3 — Revisions, preview, and final export

- [x] Implement `edit <project> --from <staging-dir> --expect <revision>` and `undo <project>` with one writer, immutable snapshots/current pointer, stable conflict errors, durable media, and append-only receipts. (Core in `packages/core/src/revision/`: content-addressed blob store under `revisions/objects`, immutable `revisions/<sourceRevision>/revision.json` with parent, summary, and kind, atomic `revisions/current.json`, a project lock that recovers from dead owners, `editProject`, `undoProject`. `production.json` is never part of a snapshot, so receipts and spend survive undo. CLI: `edit`, `undo`, and `status` reports the revision state. Manually proved on the Kore project by staging `narration-revision.json` through `edit`: baseline captured automatically, `REVISION_CONFLICT` exit 1 on a stale `--expect`, `undo` back to the original source revision, then `NOTHING_TO_UNDO`. Covered by `revisions.test.ts` (18) and `revision-commands.test.ts` (5).)
- [x] Detect direct JSON edits before preview/render/mutation, capture valid changes, and preserve invalid/uncommitted files for repair. A stale snapshot must not silently stand in for failed manual edits. (`syncWorkingCopy` runs under the lock before `edit`, `undo`, and `preview`: valid direct edits become a `manual-capture` revision; an invalid working copy is never captured and `undo` first copies its files to `revisions/recovered/<time>/`. Preview selections are stored per revision outside the immutable snapshot.)
- [x] Separate sourceRevision, generationKey, sceneRenderKey, assemblyKey, and approval identity. Do not include operational receipts in source snapshots or pixel keys. (`generationKeyForBlock` = spoken text (whitespace-normalised) plus the profile voice style, used as the receipt `requestKey`. `computeSceneRenderKeys` hashes a scene's own content, the assets and fonts it uses, the pixel-relevant profile subset, captions and narration audio overlapping it, and its timing relative to the scene start, so moving a scene in time does not invalidate it; the lint-only `variety` policy is excluded. `assemblyKey` is now built from the ordered scene keys with their placement, the narration mix, captions, and export format instead of `sourceRevision`, so a change that cannot alter the render, such as adding a source register, leaves it unchanged. Runtime (browser/FFmpeg) is not yet part of the keys; builds record it in their manifest. Approval identity is `{sourceRevision, assemblyKey, previewBuildId or explicit autonomy, scope, timestamp}`, an append-only log per source revision under `revisions/approvals/`, and never carries to another revision. Covered by `identity-keys.test.ts` and `production-readiness.test.ts`.)
- [x] Deliver production validation, full preview, caption/audio preflight, and H.264/AAC final export from one captured source revision. Review current preview or use explicit autonomous-export authorization. (`validate --stage production` compiles the project at the design format and checks production readiness: narration is required, every asset a scene uses is ready, and a missing text-to-audio binding is an error rather than a warning; the audio preflight probes each clip and rejects unreadable audio or a length that differs from the declared block by more than 60 ms. `render <project>` needs exactly one approval: `--approve-preview <build-id>` for a full narrated preview of the current source that the owner reviewed, or `--autonomous --authorized-by <name>` only when the owner explicitly authorised export without review. It syncs the working copy into a revision first, records the approval, renders at 1080x1920 with no draft label, verifies H.264, AAC, dimensions, frame rate, duration and full video and audio decode, then publishes `output/builds/<id>/` with `final.mp4`, `report.json` (runtime, approval, cost report, preflight) and `manifest.json` (hashes) and switches `output/current.json` last. Real export of the Kore project: 1080x1920, 30 fps, 1134 frames, 37.845 s, H.264 plus AAC 48 kHz, 5.2 MB, no draft label; its stand-in image and synthetic figures were in a temporary directory only. Editing the source afterwards marks the export stale and the old preview approval is refused (`APPROVAL_PREVIEW_STALE`). Also fixed: ready `wav` and `m4a` audio assets were compiled as images and never played. Covered by `render-command.test.ts`, `final-publication.test.ts` and `production-readiness.test.ts`.)
- [x] Inject staging and build-promotion failures; test caption undo, voice undo retaining spend, and stale expected revision. Preserve audio/media and referenced preview selections. (Staging failures for edits are covered in `revisions.test.ts`: invalid staged source, unsafe or empty staging and a stale expected revision leave the accepted snapshot and working copy unchanged. Final build promotion is covered in `final-publication.test.ts`: an injected failure before the pointer switch keeps the previous export current, and tampered artifacts, mismatched metadata, unlisted files, missing or corrupt audio, wrong dimensions and an existing destination publish nothing. Voice undo keeping spend is covered by the production.json test in `revisions.test.ts`.)
- [x] Report a reuse ratio for every revision: what share of voice clips, images, and rendered scenes survived unchanged, and what the revision cost against a full regeneration of the same project. This number is the practical claim the tool makes, so it must come from receipts and artifact hashes, not from an estimate. (`computeReuse` compares a revision with its parent: voice clips and images by asset hash, rendered scenes by scene render key, cost from receipts matched by generation key. Cost is a recorded actual only; a timed-out request stays `unknown`, audio with no receipt stays `untracked`, and no ratio is produced unless every block is tracked. `edit` prints and returns it, and `status` includes it for the current revision. On the real Kore revision (mechanism voice replaced): voice 2 of 3 unchanged, scenes 3 of 4 (the `impact` scene survived a 960 ms shift), overall 75 percent; with no `production.json` the cost is reported untracked. Cost figures in the proof were synthetic and only in a temporary directory. Covered by `reuse.test.ts`.)

**Exit gate:** A real narrated pilot and spoken revision pass NF-AC-11/12/14, with current source/build/approval provenance, a cost report, and a measured reuse ratio. A silent draft or missing-capability report cannot satisfy M1. Full final encoding may rerun; upstream voice/image reuse is the cost requirement.

**M1 exit gate — passed 2026-09-20.** Fatih accepted the final export `115247388b67-98323b06-dd5` and accepted untracked cost for this free, hand-made pilot. Evidence: the full loop ran on the Kore pilot in `work/kore-pilot`: baseline revision, a spoken revision of the middle block through `edit` (reuse: voice 2 of 3, scenes 3 of 4, overall 78 percent), production validation, previews A and B reviewed by Fatih (narration, caption text and timing accepted), an explicit approval of preview B, and the export `115247388b67-98323b06-dd5`: 1080x1920, 30 fps, 1163 frames, 38.827 s, H.264 plus AAC 48 kHz, 5.4 MB, full decode OK, zero preflight issues, source revision `e9ca16b70a`, approval bound to preview `54c312e59358-476d1dd5-8ec`, rendered in 81 s. Not yet satisfied: (1) the cost report is empty (`cost: null`) because the voice clips were made by hand in a free tier outside the ledger, so cost is untracked rather than measured; the gate asks for a cost report and a cost-versus-full-regeneration comparison from receipts. (2) Fatih has not yet accepted the export itself; the visuals (a flat stand-in for the scene 3 illustration) were called far from enough and are deferred to M2.2. Owner decision 2026-09-20: Fatih accepts untracked cost for this pilot, because the voice clips were made by hand in a free tier and no money was spent; the cost-versus-full-regeneration claim is to be proven from receipts once regular publishing produces them (M3.3). The gate stays open until Fatih accepts the final export `115247388b67-98323b06-dd5` itself.

## 7. M2 — Reference scenarios, profiles, and scoped preview

**Goal:** Demonstrate the same architecture across two independent projects and one derived identity-switch variant.

**Consumes:** M1 source transactions, production accounting, block timeline, render/cache keys, and one working voice route.
**Produces:** Production-ready scoped preview, reversible profile apply, music/SFX, justified recipe/media growth, three acceptance scenarios.

### M2.1 — Scope-aware preview and artifact reuse

- [x] Implement selected ready-scene dependency closure including shared assets/audio/transition handles. Missing unrelated scene production assets are reported separately, not blocking selected preview. (`computeSceneClosure` names a scene's assets, its block and audio, and the previous scene whose transition plays inside it. `preview [--scene <id>]` without `--draft` and `validate --stage production --scene <id>` check only that closure; other scenes' planned assets or unrecorded blocks come back as `info` (`OUT_OF_SCOPE_*`) and never block. A preview of one narrated scene now has its own timeline: the block clip is trimmed to where the scene starts (`trimStartFrames`), captions are shifted, the previous scene's transition handle (`transitionIn`) and `hasNextScene` are carried on the scene, and a scene has the same render key alone as inside the project. Before this, a scoped narrated preview used the whole project's frame count and global audio offsets.)
- [x] Test ready scene 2 / missing scene 7: selected preview succeeds and final fails. Unknown earlier block durations produce local timeline scope with unknown global offset, never invented timestamps. (`render-command.test.ts` and `scoped-preview.test.ts`: a ready scene passes while the last scene's image is planned, the whole project and `render` fail with `ASSET_NOT_READY`, and with an earlier block unrecorded the later scene previews on a local timeline whose scope frames are `null`, while the unrecorded scene itself is refused with `SCENE_BLOCK_NOT_READY`. This also fixed a validation bug: a scene naming a phrase of a planned block was rejected, so such a project could not load.)
- [x] Check caption/style-only edits make no generation calls and preserve unrelated scene keys. Notes can invalidate editorial approval without re-rendering identical pixels. (`pendingGeneration` lists only blocks with no audio, changed text or changed voice style; `edit-scope.test.ts` shows caption corrections, caption style, layout and note edits list nothing, keep every voice `generationKey`, and change only the scenes they touch. A scene `note` changes the source revision but not the assembly key. `preview` reuses the pixels of an earlier build with the same assembly key, scope and runtime: on the Kore pilot a note edit produced a new approvable build in 1 s instead of 70 s, with the same video hash and `reusedFromBuildId`, and the earlier approval was refused for the new source. `--rerender` forces a real render; `owner-flow` uses it so its determinism check still renders twice. Covered by `preview-reuse.test.ts` (e2e).)
- [x] Add cache clean limited to disposable computed artifacts. Retained source media, history, receipts, and selected builds survive. (`cache clean [project] [--dry-run]` removes leftover attempts, the diagnostic `compiled.json`, and preview builds that nothing points to. It keeps the current preview, builds selected for a revision or reviewed for an approval, every final export, source and media, `revisions/`, and `production.json`; it does not follow symlinks and refuses while the project lock is held. Covered by `cache-clean.test.ts`.)

### M2.2 — Profile apply and visual/audio growth

- [x] Implement profile inspect/dry-run/apply using the M1 transaction system. Diff render/production/editorial effects and existing overrides; preserve allowed overrides, block unresolved conflicts, never silently reset locked values. Evidence: `profile-apply.test.ts`, `profile-command.test.ts`, `project-overrides.test.ts`.
- [x] Permit schema-valid apply as needs-production when voice/assets become stale. Final remains blocked until replacements are ready. Undo restores the old profile/media while retaining any incurred cost. Evidence: `VOICE_STYLE_MISMATCH` is a draft warning and a production error; `status.needsProduction`; undo test in `profile-apply.test.ts` (cost lives in `production.json`, outside snapshots).
- [x] Direct profile editing/clone supports future defaults; project overrides affect the current project. No new profile GUI is needed.
- [ ] Add domain recipes only where a real project has been blocked without one. The earlier map/timeline/stat/list/comparison/diagram checklist is withdrawn as an upfront commitment: each recipe is narrower than the equivalent hand-written component, and building six speculatively spends the milestone on expressive range, which is the dimension this tool does not compete on. The entry requirement is a named project that failed, its failing source, and the check that would have caught it.
- [ ] Add further motion/transition recipes on the same evidence rule, on top of the M0.10 primitives rather than reimplementing them. Enable SVG/video/additional image/audio/font formats only after their safety/decode tests pass.
- [x] Add one optional music track plus SFX, volume/loop/trim/fades/ducking; verify decode, intelligibility, and no timeline-duration changes from transitions. Progress: schema, compile (fades, ducking windows, scene-anchored SFX), assembly key, renderer mix, decode preflight, masking warning and no-duration-change tests done (`soundtrack.test.ts`, `soundtrack-gain.test.ts`); checked by a real render in `soundtrack-mix.test.ts` (e2e, 214 s): real Kore narration, synthetic bed and effect; ducked music is 0.25x the flat level under speech, both ends fade, the effect lands in its scene, length unchanged. Samples stay outside git, so the test skips where they are absent.

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
- [ ] Keep a rework log per finished video: how many manual corrections it needed and what caused each one (layout, motion, caption, asset, cost). Roadmap priority after M3 follows the causes that actually recur, not predicted needs. This is an operating habit, not a study; no comparative benchmark against other tools is required or planned.
- [ ] Reduce the first-run cost to one command. The pinned Node/pnpm/Chrome/FFmpeg setup currently fails for an ambient runtime and needs manual PATH work before `doctor` passes; ship a bootstrap that either fixes or clearly instructs this in a single step.
- [ ] Package each build's review artifacts as one self-contained offline page: the preview, its checked-frame markers, the visual QA report, and the cost report in a file that opens without a server or install. Review is the step repeated most often, so it should cost one double-click.
- [ ] Update README operating guidance and the evidence/status sections in these existing docs. Keep runtime decisions and measured formats here; do not create redundant plan/review documents.
- [ ] Account for NF-AC-01 through NF-AC-15 with evidence. Any unmet High finding requires a corrected implementation/design or explicit scoped deferral; accepted wording alone is not closure.

**Exit gate:** All applicable acceptance criteria have passing evidence and Fatih has reviewed the outputs. Known limits/deferred items are explicit. MVP completion cannot be declared from static checks alone.

## 9. Requirement and finding traceability

| Requirement area | Delivery / proof |
|---|---|
| NF-PR-01–08 principles | M0.2–M0.8 boundaries, M0.9 layout safety; M1–M3 preserve them |
| NF-UX-01/02 and NF-AC-10 | M0.6 CLI, M0.8 skill/manual loop; M3.2 full mixed-route dogfooding |
| NF-FL-01/02/04 | M0.3 project creation and M0.8 draft loop; M2.1 scoped production preview |
| NF-FL-03/05 and NF-CAP-01 | M1.1/2/3 verified narration and approved final |
| NF-CO-01 and NF-AC-11 | M1.1 ledger/capability tests; M3.3 measured costs |
| NF-PJ-01/02 | M0.2 schemas, M0.3 source revision, M0.6 readiness; M1.3 durable revisions |
| NF-PF-01/02/03/05 | M0.2 profile schema, M0.3 portable lock, M0.8 real profile, M0.9 typography/appearance tokens; M2.2 extended checks |
| NF-PF-04 and NF-AC-08 | M2.2 transactional profile apply |
| Scene/layer/action/transition model | M0.2 contracts, M0.4 compiler, M0.5 renderer, M0.9 appearance/layout/camera correction, M0.10 transition primitives and variety checks; M2.2 evidence-driven recipe growth |
| NF-TL-01–05 and NF-REV-01 | M1.2 block compiler; M2.1 local scoped offsets |
| NF-CAPTION-01 and audio | M1.2 captions/voice; M2.2 music/SFX |
| NF-AS-01–03 | M0.2 schema, M0.3 path/hash safety, M0.5 offline renderer; M1.1/2 provenance; M2.2 formats |
| NF-CP-01–03 | M0.4 deterministic compiler and M0.5 selected pixels; M1.3 key separation; M3.1 repeat proof |
| NF-CA-01–03 | M0.7 complete-build publication; M1.3 additional keys; M2.1 cache clean |
| NF-REV-02 and NF-AC-14 | M1.3 source transactions; M2.2 apply/undo |
| NF-CL-01–04 and NF-AC-09 | M0.6 command contract; M1/M2 new commands; M3.1 acceptance |
| NF-PV-01 and NF-AC-13 | M0.4 draft scope, M0.5 render, M0.7 artifacts; M2.1 production scope; M3.2 sampled QA |
| NF-QA-01–05 | M0.5 renderer, M0.7 review artifacts, M0.8 runtime review, M0.9 visual preflight/parity, M0.10 variety/contrast checks and published QA report; M1.3 final; M3.1/2 full checks |
| NF-AC-01/02 | M1.3 offline final and actual narrated path; M3.1 repeat |
| NF-AC-03 | M2.3 two source projects + derived variant |
| NF-AC-04/05/06/07 | M1.2/3 edits/failures; M3.1/2 determinism and visual QA |
| NF-AC-12 | M1.2 partial voice and continuity evidence |
| NF-AC-15 | M0.9 LBC visual-fidelity parity gate; M0.10 slide-ceiling gate |
| NF-CO-01 cost visibility (extended) | M1.1 per-build cost report; M1.3 measured reuse ratio |
| Editorial sourcing policy | M1.2 checkable claim provenance (`SOURCE_MISSING`) |

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
| VF-01/02 | Declarative appearance plus exact renderer primitives | M0.9.2/M0.9.4 |
| VF-03 | Loaded-font measurement, collision checks, and stable issues | M0.9.5 |
| VF-04/05 | Bounded layout plus profile typography/appearance tokens | M0.9.2/M0.9.3/M0.9.5 |
| VF-06 | Semantic scene/group camera continuity | M0.9.6 |
| VF-07 | Visual foundation moved ahead of narration | M0.9 exit gate before M1.1 |

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
| Node/pnpm/TypeScript/React/Remotion/Zod/Vitest/Biome | M0.1 verified on 2026-09-08: 24.20.0 / 12.3.4 / 7.0.2 / 19.2.8 / 4.0.521 / 4.5.4 / 5.0.0 / 2.5.12. Install, frozen install, package graph, tests, typecheck, and build passed. M0.2 additionally proved the basic Remotion bundle/select/render path with the pinned stack. | M0.8 broader hardening |
| Lockfile | `pnpm-lock.yaml` SHA-256 `047e2a98a570ad9a171b4fdba9d8bf297dedfc357986e9ec8b1de49dd3694b82` | Recheck after dependency changes |
| Browser and FFmpeg exact paths/versions | Rechecked at M0 exit in the retained M0.8 report: Node `24.20.0`, Darwin `24.6.0` arm64, Remotion `4.0.521`, Google Chrome `152.0.7977.83` at `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`, and FFmpeg/FFprobe `7.1.1` at `/opt/homebrew/bin`. | Recheck after runtime changes |
| M0.2 runnable draft | `pnpm naraframe validate samples/krakatau-draft` compiled 450 frames. `pnpm naraframe preview samples/krakatau-draft --draft` produced `samples/krakatau-draft/preview/dev-preview.mp4`; FFprobe reported H.264, 540 × 960, 30 fps, 15.000000 s. Three sampled scenes and the visible `DRAFT • NO AUDIO` label were inspected through `preview/m0-2-contact-sheet.png`. Unit 3/3, focused integration 4/4, and full 15-second render smoke 1/1 passed after the manual render. | M0.2 complete; rerun at M0 exit |
| M0.3 project creation/profile lock | `pnpm naraframe create work/m0-3-created-project --profile current-issues` created the four source files plus preview/attempt directories atomically. A scene added directly to JSON validated at 450 frames and rendered to `work/m0-3-created-project/preview/dev-preview.mp4`; FFprobe reported H.264, 540 × 960, 30 fps, 15.000000 s, and `preview/m0-3-contact-sheet.png` was inspected. Focused integration coverage proves repository-profile CLI creation, existing-destination refusal, copied/content-addressed profile assets after deleting the source profile, path/symlink rejection, ready-PNG/profile hash checks, and repeatable source revision. | M0.3 complete; rerun at M0 exit |
| M0.4 visual and motion capability | `pnpm naraframe validate samples/krakatau-draft` compiled a 540-frame project. Full preview `work/m0-4-reference/full-preview.mp4` is H.264/yuvj420p, 540 × 960, 30 fps, 18.000000 seconds, SHA-256 `d5a06bdd257e3eccc0ba4fe8bc5306ae1d7eaf9d6c6dc27011b0bab2e34c274b`; `preview --draft --scene context` compiled a local 180-frame timeline while retaining source frames 120–300. The inspected `work/m0-4-reference/m0-4-contact-sheet.png` and motion sheet prove ready local PNG, rectangle/circle, group transform, text/media/composition, reveal/emphasize/focus, and the labelled planned-media placeholder. Unit 7/7, integration 18/18, and full render E2E 1/1 passed. | M0.4 complete; rerun at M0 exit |
| M0.5 atomic immutable preview | Pinned Node `24.20.0` published sample build `41b6900277c8-4cabf063-58d`; manifest SHA-256 `0281993bab6d6ca463ec4281924ed4e40b080c06d7698a4de1dd5654d6045c39`. Its MP4 is H.264, 540 × 960, 30 fps, 18 seconds, no audio, and passed strict full decode. The 540 × 1228 contact sheet covers all 11 required representative/semantic frames and has SHA-256 `0cd7a812e17a1c5eac985294b1cd57aa0b9c0b797bf22401d9685aef474e5b85`. Pre-pointer failure injection preserved the prior pointer. Integrity checks rejected audio-bearing and decode-corrupt MP4s, mixed metadata, invalid PNG, missing semantic coverage, output symlinks, and empty build collisions. A source-only first run created its missing generated roots and published build `41b6900277c8-9bc1c63d-b17`. Focused tests passed 7/7; final controller `pnpm verify` passed with unit 7/7 and integration 25/25. | M0.5 complete; rerun at M0 exit |
| M0.6 operator CLI and skill | Pinned Node `24.20.0`/pnpm `12.3.4` passed the public CLI route. Review-fix manual evidence: human `create work/m0-6-review-created-human --profile current-issues` and JSON `create work/m0-6-review-created-json --profile current-issues --json` succeeded; a real human full draft preview published current build `41b6900277c8-a2b28188-998`, and JSON `preview --draft --scene hook --json` published `93da18cf5a91-fad10874-1fd` with the returned pointer, MP4, contact sheet, frames, report, and manifest paths. Both report source revision `09b2333daa03081bc485868915d413d09556a22e81fa95a93c84cb48c8e7f531`; project/scoped fingerprints are `41b6900277c8ed8533002fbaadecf8cd9b39a9cae4d758d344d6389f6ec63d7d` and `93da18cf5a91a64feff9909d5b4f62984391d534cdfbb3cc654118d9e0edf7f2`. Review regressions prove cancellation after pointer preparation preserves the prior pointer and cleans its temporary file; public status rejects corrupt pointer hashes, unsafe symlinks, tampered artifacts, and inconsistent manifest/report/frames metadata, while accepting valid scene scope; SIGTERM normalizes to 130. Focused CLI checks passed 3 unit/17 integration tests; final `pnpm verify` passed unit 9/9 and integration 31/31. Skill unchanged. | M0.6 complete; rerun at M0 exit |
| M0.7 owner trial | Complete on 2026-09-14. Baseline build `41b6900277c8-5a908e88-4e1`, direct owner copy edit, stale detection, rerender `0654538e7ce0-2b154c13-273`, and invalid `bounce` recovery passed. Owner rejected the baseline motion as too subtle. Generic bounded easing and stronger smooth focus travel plus `current-issues` 0.2 context guidance now support context-driven choreography; Krakatau-specific staging remains sample data. Fatih accepted revised current build `96b57423d8ff-16e8cc76-28a`, which uses revision `f256ab60b4ff34fff5e260c20a51a7b02466d180927eb3a575d6d4357581993d`, renders H.264 540 × 960 at 30 fps for 18 seconds with no audio, and has a 14-frame contact sheet. CLI/report/wall timing was 37.019/37.019/51.88 seconds. Focused unit/integration passed 7/7 each; full `pnpm verify` passed unit 13/13 and integration 39/39. Owner active time was not timed and is recorded as unavailable; start timing before the next trial. | M0.7 complete |
| M0.8 cross-feature owner flow | On 2026-09-14, the E2E copied the sample, shortened it to 450 frames/15 seconds, validated, rendered, inspected all five build files, detected a one-line edit as stale, rerendered, rejected `bounce` at `/scenes/0/beats/0/action`, and recovered after restoring `reveal`. Sandboxed builds `db7809686cd3-02a70a72-5ef` and `db7809686cd3-982301b0-1c0` share source revision `9558ace64d515f54b555304c507578cbbe9cedbdfae7984ddd07c3013b038af2`; revised build `80ade327b801-2b226e0e-f84` uses `9c01f5438dc0faa52127b7de6d967a2b661cb23679ae2c3e9f9e7d7ac19b216e`. FFprobe reports H.264, 540 × 960, 30 fps, 15 seconds, no audio; full decode passed. First manifest SHA-256 is `dc4dfabd795cf15e776beb2aa2f9e269f1e4f8790b193e6402b5462664707069`; MP4/contact-sheet/frames/report hashes are `55128ab2f766f978d9ed299ec1f3b732a0b4bc21217fcf6fc1cda841bf57e597`, `25cff7f026fc6aa1854ade712848b0eb28e3da40d1727040edd871e5441d3dc2`, `750bdd3b54325ad5823e09b1b83c4cad75bcf2c36bf41a9a3da1b09065cd2e38`, and `ee4f9c81b2c97be13c2187c795e71511cc7354614f9c301ba2a8e52f1f3e6d7f`. Local evidence is under `work/m0-8-exit-Wn5gv8/`. Final gates: frozen install reused 279 packages with zero downloads, `pnpm verify` passed unit 16/16 plus integration 41/41, the evidence-producing serial E2E passed 2/2 in 177.27 seconds, and the post-review cleanup-verification E2E passed 2/2 in 180.37 seconds. | M0.8 complete |
| LBC visual-fidelity benchmark | The original failing engine artifact is retained unchanged. A post-M0.9.5 review found `visual-preflight.ts` checked members of a transformed/animated group at their untransformed local position instead of where `GroupView` actually renders them — a real collision-detection gap, confirmed with a manual before/after probe (pre-fix: a group-shifted collision published with zero issues; post-fix: the same layout correctly exited 1 with `TEXT_COLLISION`) and closed with a shared `groupScreenTransformFor` helper plus two new regression tests in `packages/renderer-remotion/test/unit/visual-preflight.test.ts`. The LBC engine's own two groups (`progress-copy-stack`, `cta-copy-stack`) use identity transforms with no beats, so this defect did not change their prior pixels, but the build was rerendered against the corrected code rather than carried forward unverified: build `16abeb583bc2-086fdfc0-b9f` (same source revision `fe3b2b74936a5bab2ed855ce21ce3ddb94a86dbb03b9e70b64a56f95be62998f` and assembly key `16abeb583bc299b7215e3a96a3c7f034bc7c3dddc96f611f12a8c203b4db0209` as before) published a 30-second 540 × 960, 30 fps, silent H.264 preview with zero visual-preflight issues. `work/lbc-benchmark/output/lbc-naraframe-engine-m0-9-7.mp4` has SHA-256 `4ea68e17e88e7c910ec48126bde03fcfc99686b04295bde17f04de5d1620e741`; its 93-state contact sheet `naraframe-contact-sheet-m0-9-7.png` is `4707636701ff4c1847d4d73542142323231bafd410d31a6db34eb4dbde15ef6a` (the prior register entry's contact-sheet hash, `a5bac85f...`, did not match any file on disk and is superseded by this measured value); the four-moment `comparison-m0-9-7.png` (seconds 8/15/21/27, direct Remotion on top and the corrected NaraFrame engine below) is `60355315ad683607801e12bab038bd40c80efba1690354d58fde34e65be81057`. A dedicated overlap probe (`work/lbc-benchmark/overlap-probe/`, a copy of the engine with `hook-label` deliberately placed on `hook-title`'s frame — the earlier claimed title/copy overlap sits inside a bounded stack-layout group and instead correctly raises `GROUP_LAYOUT_OVERFLOW` before it can collide) exited 1 in 2.65 seconds with structured `TEXT_COLLISION`; both the raw CLI output and the parsed JSON report are retained at `work/lbc-benchmark/output/overlap-probe-cli-output.json` and `overlap-probe-report.json`. `pnpm verify` passed lint/format clean, typecheck clean, unit 25/25, integration 41/41, and build clean; `pnpm test:e2e` passed 2/2 in 179.12 seconds. Direct Remotion remains the art-direction reference, not a pixel-identity requirement. | M0.9.2–M0.9.7 verified and accepted by Fatih on 2026-09-14; M0 complete, M1.1 unpaused |
| Font/PNG/native-layer baseline | M0.4 proved system-font text, ready local PNG decode, rectangle/circle layout, non-recursive grouping, and planned-PNG placeholder rendering. Bundled local-font behavior remains unproven and is not enabled in M0. | M0 complete for the enabled system-font path; test before bundled-font enablement |
| External-egress and explicit-browser behavior | M0.8 passes. `doctor --json` reports configured missing browser/FFmpeg/FFprobe paths with exit 2, stable issue codes, and no download/render. The macOS sandbox probe allowed `127.0.0.1` loopback and returned `EPERM` for non-loopback outbound IP; unrelated socket errors fail the test. The same profile rendered both deterministic 15-second previews successfully. An initial profile that also denied inbound networking blocked Chrome's local `SingletonSocket`; removing that overbroad inbound rule fixed the acceptance environment without changing source or renderer code. | Repeat when runtime/browser changes |
| Deterministic compiled/selected frame hashes | M0.4 early signal passed on the pinned machine. M0.8 additionally proved object-key-order-independent source/assembly hashes and repeated full renders in the same sandboxed reference environment. Lossless frames 18/180/405 matched with SHA-256 `0e2c5c78660a182bb5816256c1f48848676e64cee54190c46b9e52ce5690f2d5`, `42307d79cfaae3ea28002163c7498c1e5aa6b02ad5bee8c654d244463e0ac2d1`, and `eaf4b5086e9c9c42c8705d67259c397168c4abce260383f698f5bd539b5ffde0`. A sandboxed-versus-unsandboxed comparison produced a different transformed-image frame and was rejected because it did not hold the reference environment constant. Encoded MP4 bytes are intentionally not the determinism contract. Sampled frames do not prove that every frame is aesthetically safe. 2026-09-20 finding on the e2e caveat: this is a pre-existing renderer non-determinism, not an encoder or M1.3 effect. Two renders of the unchanged `samples/krakatau-draft` at commit a11b3a7 (before any M1.3 change) differed in 289 of 540 decoded frames (first difference at frame 131); a later pair at the working tree differed in 156 of 540 (from frame 264) with PSNR about 81 dB on a static frame, i.e. tiny pixel noise. Re-encoding one MP4 three times with libx264 gave byte-identical files, so the encoder is deterministic. `owner-flow` compares decoded MP4 frames at fixed indexes, so it passes or fails depending on whether those frames happen to match; four of its last seven runs failed. The NF-CP-03 promise (same fingerprint gives the same selected frame pixels) is therefore not currently met on this machine. Root cause is open (suspects: box-shadow or rotated-image rasterization). Treat a single e2e pass or fail as weak evidence, and do not run two e2e runs at once. | Repeat at M3 and after runtime/render changes |
| Additional SVG/video/audio/font formats | Not enabled until respective tests pass | Feature enablement M1/M2 |
| Encode settings and final audio sample coverage | Not run | M1 narrated export |
| Indonesian TTS/phrase-timing recipe and price/usage evidence | Fake-provider recipe proven (see M1.1 ledger row): deterministic phrase split/timing and content-addressed audio hash for real Indonesian sample text, run through the production ledger end to end. A real vendor's price/usage evidence is still not available — this is an offline stand-in, not a paid pilot. | M1 narrated pilot |
| Block prosody and partial voice replacement | Run 2026-09-19 with owner-generated Google AI Studio (Kore) clips on the local `samples/krakatau-narrated` project (kept out of git: samples with audio are too large). Original build `13462091895a-bfff66b9-fea`: 1134 frames, 37.845 s, H.264 + AAC, not muted, zero visual-preflight issues. Revised build `bc3678494c5e-ab7d0b3c-6a4` (mechanism block replaced): 1163 frames, 38.827 s, same checks; opening and impact audio hashes unchanged, impact offset +960 ms. Fatih listened to the joins and accepted the audio. On 2026-09-19 the owner also watched build `3c647d57ab06-63938115-c12` with rendered captions and confirmed each caption matches the spoken words (the sample's narration text had first been corrected to the text actually generated; a hand-written mismatch had slipped in, which is what the text binding now prevents). The burned-in draft label was corrected the same day: narrated builds read `DRAFT • WITH AUDIO` (owner-chosen wording), silent ones stay `DRAFT • NO AUDIO`, and build validation rejects a label that disagrees with the report's audio (`324e9278abda-cbb7eb1b-22a`: label WITH AUDIO, AAC, not muted). Owner note: the preview image is not yet at the desired quality; recorded as an open visual issue, not audio. The M1 exit gate still needs the spoken-revision pass on a narrated final export (M1.3). | M1 exit |
| Budget/unknown-result/retry tests | M1.1 ledger primitives (`packages/core/src/schema/production.ts`, `packages/core/src/production/ledger.ts`) implemented: append-only versioned receipts per `operationId`, `requestReservation`/`settleReceipt`/`settleUnknown`/`retryReceipt`/`escalateReceipt`. Manual probe proved the exact spec scenario: budget 100/spent 40/reserved 40, a next=30 reservation is denied (`BUDGET_EXCEEDED`); a timed-out request moves to `unknown` and keeps its 40 held against budget rather than releasing it; `retryReceipt` on that `unknown` receipt is refused (`RECEIPT_NOT_RETRYABLE`, "must not be blindly resent") — resolution requires `settleUnknown` once the actual cost is confirmed; a failed operation's first retry (attempt 2) succeeds, a third attempt is refused (`ATTEMPT_LIMIT_REACHED`), and `escalateReceipt` is the only path forward; every historical receipt version (5 for that operation) remains in the append-only array after escalation, proving no version is erased. Since then, a `TtsProvider` port (`packages/core/src/production/tts-provider.ts`) plus a deterministic offline `createFakeTtsProvider` (`fake-tts-provider.ts`) and a sequential `synthesizeNarration` orchestration (`synthesize-narration.ts`) landed, along with pure route resolution (`route.ts`: prepared-media/silent-draft/narrated). Manual probe fed real Indonesian text through the full reserve→call→settle cycle: 3 phrases split on `.`/`,`, each starting exactly where the previous one ended, a deterministic content-addressed `audioSha256` (same input reproduces the same hash/cost, a different `voiceId` changes the hash), and a `succeeded` receipt (`version 2`: v1 reserved, v2 settled) recording the actual IDR cost. No provider SDK or key was added to core. Rights/subscription assumptions are now recorded (Remotion's free/company tier, local-only browser/FFmpeg, the M0.10 font placeholder, no TTS/image vendor yet, and no subscription-covers-it-for-free assumption) — this is already enforced in code, not just written down, since `ReceiptAuthorizationSchema` makes `authorization` a required field, so `requestReservation` cannot construct a receipt without one. `computeCostReport` (`packages/core/src/production/cost-report.ts`) also landed: it derives `{budget, estimated, actual, unknown, reserved, available, receipts}` straight from a ledger's own receipts. Manual probe proved `unknown` stays visibly separate rather than folding into `actual` (settled 35/100 spent, 20 held as unknown, `estimated` sums both receipts' original estimates at 60, `available` correctly nets all three off the budget). The deferred automated test pass then landed: `packages/core/test/unit/ledger.test.ts`, `fake-tts-provider.test.ts`, `route.test.ts`, `synthesize-narration.test.ts`, and `cost-report.test.ts` cover every manually-proved scenario above (budget denial, timed-out→unknown holding its reservation, refused blind retry, two-attempt escalation, append-only version retention, deterministic/voice-sensitive audio hashing, contiguous phrase timing, a real provider failure settling to `failed` without losing the reservation, and both the populated and all-zero cost-report shapes) plus edge cases (`CURRENCY_MISMATCH`, `OPERATION_ALREADY_EXISTS`, `RECEIPT_NOT_PENDING`, `OPERATION_NOT_FOUND`, `RECEIPT_NOT_UNKNOWN`, `ESCALATION_NOT_APPLICABLE`). `pnpm verify` passed clean: lint/format, typecheck, unit 101/101 (up from 74), integration 52/52, and build. Still open: wiring the skill/CLI to actually call `resolveProductionRoute` and `synthesizeNarration`, and publishing `computeCostReport`'s output alongside a real build (deferred until a narrated build exists to spend against — today's draft previews are silently free by design, so attaching a permanently-zero cost report to them would be decorative, not evidence). | M1.1 in progress |
| Source/build crash recovery and profile rollback | Not run | M1/M2 feature gates |
| Owner workflow, render latency, cost/reuse | Not measured | M3 exit |
| Visual variety checks and bounded transitions | M0.10.1/2/4 implemented, tested (74 unit + 52 integration passing), and migrated onto both reference projects: `samples/krakatau-draft` and `work/lbc-benchmark/engine` each now use `push-through`/`mask-reveal`(/`match-cut` for LBC) instead of `cut` only; `SINGLE_TRANSITION_TYPE` is clear on both. Menu enforcement (`ENTRY_STYLE_NOT_PERMITTED`/`TRANSITION_NOT_PERMITTED`/`FOCUS_STYLE_NOT_PERMITTED`) verified on a probe with a restrictive `render.variety.menu`; unrestricted samples unaffected. | M0.10 complete |
| Bundled profile font enablement | M0.10.3 implemented and tested. LBC engine's rebuilt `4c4228974b3c-33688229-032` bundles a real macOS system TTF (Trebuchet Bold) as `displayFontFamily`, rendering `hook-title` in a face distinct from body text with zero font issues. This remains an explicit technical placeholder — no real bundled face or licence has been chosen for a product profile. | Product profile font choice, whenever needed |
| Published visual QA report and contrast checks | M0.10.5 implemented and tested. `report.json` carries `varietyMetrics` and `readability` computed from the published `CompiledDraft`; LBC's rebuilt `4c4228974b3c-33688229-032` shows all four transition types used, 11 distinct font sizes, and zero failing contrast samples. `CONTRAST_INSUFFICIENT` fires at `validate` time (pure color math, no render). Only the flat profile background is checked, not real compositing behind a layer. | M0.10 complete |
| M0.10 owner visual acceptance | Fatih reviewed the rerendered LBC build (`4c4228974b3c-33688229-032`, full MP4 and boundary-frame/display-font proof stills) and accepted it on 2026-09-15. M0.10 exit gate passed; M1.1 unpaused. | M0.10 complete |
| Intended publishing cadence and paid-generation appetite | Open question, owner decision. The M1 ledger, receipt, and partial-regeneration machinery is proportionate to regular publishing with real TTS/image spend, and disproportionate to occasional one-off videos. Decide before M1.1 grows further; revisit M1 sizing if the answer is occasional. | M1.1 start |
| Owner review of the Kore pilot previews | 2026-09-20: Fatih reviewed previews A (original, build `c2419d3e2825-4de9a0e7-f36`) and B (mechanism voice revised, build `54c312e59358-476d1dd5-8ec`) from `work/kore-pilot`. Narration, caption text and timing are fine. Visuals are "far from enough" and are not a M1 concern. This is the named failing project and the evidence M2.2 requires before adding recipes: a real illustrated visual language for scene 3 (still a stand-in flat colour) and richer scene composition. Revision B reuse: voice 2 of 3, scenes 3 of 4, overall 78 percent (a stand-in image counts as unchanged); cost untracked because the clips were made by hand outside the ledger. | M2.2 entry evidence |
| Rework causes per finished video | Not tracked. Intended as a lightweight operating log, not a study. | M3.3 and ongoing |

No table row is passed by updating documents. Store actual build artifact paths/hashes, commands, dates, and observed outcomes when execution happens. Test findings and unresolved design changes remain visible in `docs/refine-spec.md`.

## 12. Post-MVP observation

After acceptance, produce at least 10 real videos before choosing GUI/provider/MCP expansion. Continue the rework log from M3.3 — unsupported visuals, manual corrections, profile changes, voice-sync work, failures, latency, and actual/estimated/unknown cost — and let the recurring causes set the next scope. A capability nobody's rework log asked for does not get built. The first GUI remains a later constrained authoring surface over the same contracts, not an MVP dependency.
