# NaraFrame MVP Implementation Plan

> **For execution:** implement M0 task-by-task in this workspace, with a review checkpoint after each task. The plan defines intent, boundaries, contracts, and proof; implementation details belong to the work stage.

**Goal:** Deliver a usable local motion-video workflow for Fatih, with direct JSON/CLI control, agent orchestration, controlled generation cost, and localized reversible revisions.

**Architecture:** Interleave skill → CLI/core validation/compilation → Remotion rendering. Keep external production operations outside core/renderer. Start with a short visual draft, then prove narration/revision before expanding visual recipes.

**Tech Stack:** Candidate pins for M0: Node 24.20.0 LTS, pnpm 12.3.4, TypeScript 7.0.2, React/React DOM 19.2.8, Remotion/@remotion packages 4.0.521, Zod 4.5.4, Vitest 5.0.0, and Biome 2.5.12. Registry availability was checked on 2026-09-07. Local FFmpeg/browser versions and full compatibility remain Task M0.1 evidence.

Status: M0 implementation plan ready for execution; implementation not started.
Revision: 0.5
Date: 2026-09-07
Inputs: `docs/spec.md` revision 0.3 and `docs/refine-spec.md`.
Implementation: Not started. Runtime, usability, cost, and voice-quality tests: not run.

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

Each M0 task records the outcome, owned files, required behavior, test coverage, and completion evidence. TypeScript bodies, full test fixtures, package manifests, and renderer implementation belong to execution. If implementation reveals a material product or architecture change, update the relevant spec/refinement decision before continuing. Ordinary coding details are resolved during the task without starting another planning round.

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

`verify` covers lint/format checks, typecheck, unit/integration tests, and build. Renderer E2E stays separate because it is slower, but it is mandatory for the M0 gate. These commands are targets only; they have not passed yet.

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

- [ ] **Step 1: Create the workspace manifest and package boundaries.**

Create a private ESM pnpm workspace with `packages/*`. Pin the candidate versions recorded in the document header without ranges and keep every Remotion package on exactly the same patch. The dependency direction is CLI → core/renderer and renderer → core; core has no renderer dependency. Package exports must resolve built `dist` files, while the test configuration resolves package names to source so tests cannot accidentally use stale builds.

Expose root commands for build, typecheck, lint, format, unit, integration, E2E, verify, and the local CLI. The local CLI runs built output; development tests may execute TypeScript through the test runner.

- [ ] **Step 2: Configure strict TypeScript, Biome, and explicit Vitest projects.**

Use strict NodeNext TypeScript with project references and separate source/build directories. Configure three explicit Vitest projects named `unit`, `integration`, and `e2e`, including the corresponding package test directories and source aliases. Configure Biome recommended checks and exclude dependencies, build outputs, generated project state, previews, and final outputs.

- [ ] **Step 3: Install once to create the lockfile, then verify the frozen path.**

Run:

```bash
rtk corepack prepare pnpm@12.3.4 --activate
rtk pnpm install
rtk pnpm install --frozen-lockfile
rtk pnpm exec tsc --version
rtk pnpm exec remotion --version
```

Expected: both installs exit 0; TypeScript prints `Version 7.0.2`; Remotion prints `4.0.521`. If Node 24.20.0 plus these pins do not install, stop M0. Record the actual conflict and select a mutually compatible stable set in this section before editing product code. Never mix Remotion patch versions.

- [ ] **Step 4: Prove test discovery and built-package resolution.**

Add one unit harness test per package, run `rtk pnpm test:unit`, then run typecheck/build and a smoke import from each built package. Expected: every test project is discovered, built exports resolve from `dist`, and no package imports source TypeScript at runtime.

**Checkpoint:** Record exact installed versions and lockfile hash in section 11. Do not mark later runtime compatibility proven yet. This workspace has no Git repository, so do not invent commit steps; if the user later initializes Git, commit only this task's explicit files.

### Task M0.2: Define minimal source, issue, and compiled contracts

**Files:**
- Create: `/Users/fatih/Code/Playground/NaraFrame/packages/core/src/model/issue.ts`
- Create: `/Users/fatih/Code/Playground/NaraFrame/packages/core/src/schema/profile.ts`
- Create: `/Users/fatih/Code/Playground/NaraFrame/packages/core/src/schema/project.ts`
- Create: `/Users/fatih/Code/Playground/NaraFrame/packages/core/src/schema/scene.ts`
- Create: `/Users/fatih/Code/Playground/NaraFrame/packages/core/src/schema/asset.ts`
- Create: `/Users/fatih/Code/Playground/NaraFrame/packages/core/src/schema/compiled.ts`
- Create: `/Users/fatih/Code/Playground/NaraFrame/packages/core/src/schema/export-schema.ts`
- Modify: `/Users/fatih/Code/Playground/NaraFrame/packages/core/src/index.ts`
- Test: `/Users/fatih/Code/Playground/NaraFrame/packages/core/test/unit/schema/plan-schema.test.ts`

**Interfaces:**
- Consumes: schema version 1 and the M0 capability subset.
- Produces: `Issue`, `Result<T>`, `ProjectConfigSchema`, `ProfileLockSchema`, `ScenesSchema`, `AssetManifestSchema`, `CompiledDraftSchema`, inferred public types, and `exportSchemas(): Record<string, unknown>`.

- [ ] **Step 1: Write the failing contract tests.**

Cover one valid project using every M0 capability and separate negative cases for unsupported video/SVG, raw keyframes/executable fields, unknown action, duplicate IDs, unresolved beat target, invalid format, and schema version 2. Each negative case must fail for the intended field and assert a stable issue path rather than merely asserting that parsing throws.

- [ ] **Step 2: Run the test and confirm the missing-export failure.**

Run:

```bash
rtk pnpm test:unit -- packages/core/test/unit/schema/plan-schema.test.ts
```

Expected: FAIL because the schemas are not exported by `@naraframe/core`.

- [ ] **Step 3: Implement the minimal schemas and public model.**

Use strict Zod schemas and infer the public types from them. IDs use lowercase kebab-case; colors and SHA-256 values have explicit formats; durations are positive integers. M0 supports scene visuals `text`, `media`, and `composition`; layers `text`, local PNG image, rectangle/circle shape, and non-recursive group; actions `reveal`, `emphasize`, and `focus`; transition `cut` only. Groups reference ordered member IDs and apply a group transform without recursive child objects.

Validate unique scene/layer IDs, group membership, beat targets, 1080 × 1920 design format at 30 fps, 540 × 960 draft format, and the 180-second default safety limit. A profile recommendation outside its preferred duration is a warning; exceeding the safety limit is an error.

Assets are `planned` or a ready local PNG with relative POSIX path and SHA-256. Profile lock contains the exact fields used in the test, strict render tokens, full direction text/hash, and locked/overridable paths. `CompiledDraftSchema` matches the M0 interface map and permits only resolved ready PNG assets or typed labelled placeholders.

Implement `exportSchemas()` using Zod 4 JSON Schema conversion and export every public schema/type from `src/index.ts`.

- [ ] **Step 4: Run schema tests and negative unknown-field cases.**

Run:

```bash
rtk pnpm test:unit -- packages/core/test/unit/schema/plan-schema.test.ts
rtk pnpm typecheck
```

Expected: both exit 0; every positive/negative case above resolves to its expected issue code and path.

**Checkpoint:** Save an exported schema snapshot in the test assertion, not a hand-maintained duplicate under the skill.

### Task M0.3: Create projects, lock profiles, and load files safely

**Files:**
- Create: `/Users/fatih/Code/Playground/NaraFrame/packages/core/src/project/create-project.ts`
- Create: `/Users/fatih/Code/Playground/NaraFrame/packages/core/src/project/load-plan-project.ts`
- Create: `/Users/fatih/Code/Playground/NaraFrame/packages/core/src/project/safe-path.ts`
- Create: `/Users/fatih/Code/Playground/NaraFrame/packages/core/src/profile/create-profile-lock.ts`
- Create: `/Users/fatih/Code/Playground/NaraFrame/packages/core/src/project/hash-file.ts`
- Modify: `/Users/fatih/Code/Playground/NaraFrame/packages/core/src/index.ts`
- Test: `/Users/fatih/Code/Playground/NaraFrame/packages/core/test/unit/project/safe-path.test.ts`
- Test: `/Users/fatih/Code/Playground/NaraFrame/packages/core/test/integration/project/create-load.test.ts`

**Interfaces:**
- Consumes: Task M0.2 schemas plus an explicit profile directory and project parent.
- Produces: `createProject`, `loadPlanProject`, `resolveSafeProjectPath`, and the `PlanProject` contract described in the M0 contract map.

- [ ] **Step 1: Write filesystem and portability tests.**

Cover absolute paths, traversal, remote URLs, symlink escape, missing files, invalid JSON, ready-PNG hash mismatch, unknown fields, duplicate IDs, and an existing destination. Create a project from a temporary profile, remove that source profile, then prove the project still loads from its copied profile lock/assets. Expected issue codes include `UNSAFE_PATH`, `UNSAFE_SYMLINK`, `REMOTE_URL`, `FILE_MISSING`, `JSON_INVALID`, `ASSET_HASH_MISMATCH`, `SCHEMA_INVALID`, `ID_DUPLICATE`, and `PROJECT_EXISTS`.

- [ ] **Step 2: Run the tests and confirm missing functions.**

Run:

```bash
rtk pnpm test:unit -- packages/core/test/unit/project/safe-path.test.ts
rtk pnpm test:integration -- packages/core/test/integration/project/create-load.test.ts
```

Expected: FAIL because create/load/safe-path exports do not exist.

- [ ] **Step 3: Implement safe path resolution and stable issue conversion.**

Reject URL schemes, absolute paths, traversal after normalization, and symlinks whose real path escapes the project. Missing ready assets are errors rather than accepted unresolved paths. Convert schema/parser failures to deterministic issues with JSON Pointer-like paths, without exposing unrelated absolute paths or file contents.

- [ ] **Step 4: Implement atomic project creation and loading.**

`createProject()` validates profile JSON and direction before writing. It creates a sibling `.<name>.naraframe-create-<random>`, writes `naraframe.json`, `profile.lock.json`, `scenes.json`, `assets/manifest.json`, and empty `preview/builds`/`.naraframe/attempts`, fsyncs files where supported, then renames the staging directory to the requested destination. A pre-existing destination returns `PROJECT_EXISTS` without mutation.

The initial `scenes.json` is schema-valid with `scenes: []`; readiness remains incomplete until a scene exists. `profile.lock.json` stores the full normalized `directionText`, SHA-256, resolved render config and profile assets copied under `assets/profile/`. It must not require the source profile after creation.

`loadPlanProject()` reads only the four M0 source files, parses them with Task M0.2 schemas, validates ready PNG paths/hashes through `resolveSafeProjectPath()`, and returns all issues in deterministic path/code order. Compute `sourceRevision` from canonical contents of those source files plus ready asset hashes; exclude timestamps, build output, and absolute project path.

- [ ] **Step 5: Run focused and package checks.**

Run:

```bash
rtk pnpm test:unit -- packages/core/test/unit/project/safe-path.test.ts
rtk pnpm test:integration -- packages/core/test/integration/project/create-load.test.ts
rtk pnpm typecheck
```

Expected: exit 0. Inspect the temporary fixture to confirm the lock contains direction text and no source-profile absolute path is required to reload.

### Task M0.4: Compile deterministic draft timing and render inputs

**Files:**
- Create: `/Users/fatih/Code/Playground/NaraFrame/packages/core/src/project/canonical-json.ts`
- Create: `/Users/fatih/Code/Playground/NaraFrame/packages/core/src/compiler/compile-draft.ts`
- Create: `/Users/fatih/Code/Playground/NaraFrame/packages/core/src/compiler/compile-scene.ts`
- Create: `/Users/fatih/Code/Playground/NaraFrame/packages/core/src/compiler/resolve-placeholder.ts`
- Modify: `/Users/fatih/Code/Playground/NaraFrame/packages/core/src/index.ts`
- Test: `/Users/fatih/Code/Playground/NaraFrame/packages/core/test/unit/compiler/compile-draft.test.ts`

**Interfaces:**
- Consumes: `PlanProject`, `DraftScope`, validated M0 scenes/assets.
- Produces: `canonicalJson(value: unknown): string`, `sha256Canonical(value: unknown): string`, and `compileDraft(project, scope): Result<CompiledDraft>`.

`CompiledScene` has `id`, `startFrame`, `endFrame` (exclusive), `visual`, resolved layers, and beats with `startFrame`/`durationInFrames`. `CompiledAsset` is either `{kind: "png", publicPath, sha256}` or `{kind: "placeholder", assetId, label}`.

- [ ] **Step 1: Write deterministic compiler tests.**

Prove shared half-open frame boundaries, stable repeat compilation, visible planned-asset placeholders, full-project and selected-scene draft scope, and exact rejection of empty projects, zero-frame scenes, out-of-bounds beats, or missing scene IDs. The reference timing assertion is 5000 ms + 2500 ms → `[0,150)` and `[150,225)` at 30 fps.

- [ ] **Step 2: Run the test and see the missing compiler failure.**

Run `rtk pnpm test:unit -- packages/core/test/unit/compiler/compile-draft.test.ts`.

Expected: FAIL because `compileDraft` and test support builder are absent.

- [ ] **Step 3: Implement canonical serialization and shared boundaries.**

Canonicalize object keys recursively while preserving array order. Calculate cumulative millisecond boundaries once, convert each shared boundary to 30 fps, and reject zero-frame intervals. Resolve beats relative to their scene and ensure they stay inside it. Filter a selected scene only after project timing is resolved so its known project offset is retained.

Scale design coordinates from 1080 × 1920 to 540 × 960 once in compiled layers. Planned assets become visible typed placeholders; ready assets use content-hash-addressed public paths. Set `assemblyKey = sha256Canonical()` over compiled profile render tokens, selected scenes, assets, dimensions, fps, mode, and renderer contract version `"m0-remotion-v1"`; exclude sourceRevision, absolute paths, and wall clock.

- [ ] **Step 4: Add determinism and invalidation assertions.**

Add tests proving reordered JSON object keys retain the same canonical hash; text/accent/duration/asset-hash changes alter the relevant key; profile direction text changes sourceRevision without changing assemblyKey when render tokens are unchanged. Run the same compile under `TZ=UTC LANG=C` and `TZ=Asia/Jakarta LANG=id_ID.UTF-8`; expect equal compiled JSON/hash.

- [ ] **Step 5: Run focused checks.**

```bash
rtk pnpm test:unit -- packages/core/test/unit/compiler/compile-draft.test.ts
rtk pnpm typecheck
```

Expected: exit 0 with exact ranges `[0,150)` and `[150,225)`. Store no compiled output in the source folder during this unit test.

### Task M0.5: Prove the renderer and implement the minimal motion composition

**Files:**
- Create: `/Users/fatih/Code/Playground/NaraFrame/packages/renderer-remotion/src/composition/index.ts`
- Create: `/Users/fatih/Code/Playground/NaraFrame/packages/renderer-remotion/src/composition/Root.tsx`
- Create: `/Users/fatih/Code/Playground/NaraFrame/packages/renderer-remotion/src/composition/NaraFrameDraft.tsx`
- Create: `/Users/fatih/Code/Playground/NaraFrame/packages/renderer-remotion/src/composition/Scene.tsx`
- Create: `/Users/fatih/Code/Playground/NaraFrame/packages/renderer-remotion/src/layers/Layer.tsx`
- Create: `/Users/fatih/Code/Playground/NaraFrame/packages/renderer-remotion/src/motion/resolve-motion.ts`
- Create: `/Users/fatih/Code/Playground/NaraFrame/packages/renderer-remotion/src/runtime/browser.ts`
- Create: `/Users/fatih/Code/Playground/NaraFrame/packages/renderer-remotion/src/runtime/render-draft.ts`
- Create: `/Users/fatih/Code/Playground/NaraFrame/packages/renderer-remotion/src/runtime/render-stills.ts`
- Modify: `/Users/fatih/Code/Playground/NaraFrame/packages/renderer-remotion/src/index.ts`
- Test: `/Users/fatih/Code/Playground/NaraFrame/packages/renderer-remotion/test/unit/motion/resolve-motion.test.ts`
- Test: `/Users/fatih/Code/Playground/NaraFrame/packages/renderer-remotion/test/integration/render-draft.test.ts`
- Test fixture: `/Users/fatih/Code/Playground/NaraFrame/test-fixtures/media/minimal.png`
- Test policy: `/Users/fatih/Code/Playground/NaraFrame/test-fixtures/network/macos-render.sb`

**Interfaces:**
- Consumes: `CompiledDraft`, a project root, explicit absolute browser executable, and an attempt directory.
- Produces: `resolveBrowserExecutable`, `renderDraft`, and `RenderedAttempt` containing preview/still paths, checked frames, runtime versions, and render duration.

- [ ] **Step 1: Write frame-state unit tests before React components.**

Assert reveal, emphasize, and focus at start, midpoint, end, and immediately outside their half-open ranges. Motion resolution must use clamped pure arithmetic without wall clock, unseeded randomness, CSS keyframes, default springs, or locale-dependent values.

- [ ] **Step 2: Implement one Remotion composition from compiled JSON.**

Register only `NaraFrameDraft`. Render compiled scenes at their resolved ranges and support text, local PNG, rectangle/circle, and group transforms. Stage verified project assets into the attempt's Remotion public directory before bundling; the composition receives content-addressed local paths only. Apply motion with scene-local frames and keep `DRAFT • NO AUDIO` inside the safe zone. Load the copied profile font explicitly and fail on font-load errors instead of silently falling back.

- [ ] **Step 3: Write the integration test and local media fixture.**

Generate a deterministic PNG once:

```bash
rtk ffmpeg -f lavfi -i color=c=0xFF6B35:s=320x180 -frames:v 1 test-fixtures/media/minimal.png
```

Test `renderDraft()` with a 90-frame compiled fixture. Assert MP4 exists and is nonempty, render three PNG stills at frames 0/45/89, and run:

```bash
rtk ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate -show_entries format=duration -of json <actual-attempt-preview-path>
```

Expected: H.264, 540 × 960, 30/1 fps, 3.0 seconds within one-frame duration tolerance, no audio stream. Use the actual path returned by the test; never leave angle-bracket text in an executable test.

- [ ] **Step 4: Implement explicit browser and cancellation behavior.**

`resolveBrowserExecutable()` checks an explicit CLI/config value first, then known user-installed Chrome/Chromium locations on the supported macOS reference host. It verifies executable access and returns `BROWSER_NOT_PROVISIONED` with the separate networked setup command `pnpm exec remotion browser ensure`; preview/render never calls ensure. Pass the absolute path to both `selectComposition()` and `renderMedia()`.

Bridge `AbortSignal` to Remotion's `makeCancelSignal()`; SIGINT handling stays in CLI. Use `codec: "h264"`, `pixelFormat: "yuv420p"`, `muted: true`, `concurrency: 1`, and `overwrite: false` for the M0 proof. Exact CRF/final settings wait for M1; record actual renderer/browser/FFmpeg versions.

- [ ] **Step 5: Prove external-egress denial and local-loopback allowance on macOS.**

The M0 reference test runs its render subprocess under a checked-in `sandbox-exec` profile that permits filesystem access to the project/temp/browser dependencies and network access only to loopback. The test fixture deliberately includes one `https://example.invalid/sentinel.png` attempt in a negative unsafe-input test; the core must reject it before renderer launch. Run the valid local composition under the sandbox and assert render success.

```bash
rtk sandbox-exec -f test-fixtures/network/macos-render.sb pnpm test:integration -- packages/renderer-remotion/test/integration/render-draft.test.ts
```

Expected: valid render succeeds using loopback/local assets; remote asset input fails with `REMOTE_URL`; no implicit browser download occurs. If `sandbox-exec` is unavailable or the allowlist cannot support Remotion 4.0.521, stop M0 and revise the enforcement mechanism/spec claim before continuing. Do not substitute “we used local URLs” for an egress-denial proof. Other operating systems remain unverified.

- [ ] **Step 6: Prove selected-frame determinism.**

Render frames 0/45/89 twice into separate attempt directories. Decode as PNG and compare SHA-256 hashes; expect three exact matches on the same pinned host/runtime. Record browser rendering backend and flags. Add a static test rejecting `Math.random(`, `Date.now(`, `new Date(`, and remote font/asset strings in renderer source. This does not claim cross-machine pixel identity or byte-identical MP4.

Run:

```bash
rtk pnpm test:unit -- packages/renderer-remotion/test/unit
rtk pnpm test:integration -- packages/renderer-remotion/test/integration/render-draft.test.ts
rtk pnpm typecheck
```

Expected: exit 0 with actual MP4/still paths retained for the M0 checkpoint.


### Task M0.6: Implement the M0 CLI contract

**Files:**
- Create: `/Users/fatih/Code/Playground/NaraFrame/packages/cli/src/run-cli.ts`
- Create: `/Users/fatih/Code/Playground/NaraFrame/packages/cli/src/parse-command.ts`
- Create: `/Users/fatih/Code/Playground/NaraFrame/packages/cli/src/output/write-result.ts`
- Create: `/Users/fatih/Code/Playground/NaraFrame/packages/cli/src/commands/doctor.ts`
- Create: `/Users/fatih/Code/Playground/NaraFrame/packages/cli/src/commands/schema.ts`
- Create: `/Users/fatih/Code/Playground/NaraFrame/packages/cli/src/commands/create.ts`
- Create: `/Users/fatih/Code/Playground/NaraFrame/packages/cli/src/commands/validate.ts`
- Create: `/Users/fatih/Code/Playground/NaraFrame/packages/cli/src/commands/status.ts`
- Create: `/Users/fatih/Code/Playground/NaraFrame/packages/cli/src/commands/preview.ts`
- Create: `/Users/fatih/Code/Playground/NaraFrame/packages/cli/src/services.ts`
- Modify: `/Users/fatih/Code/Playground/NaraFrame/packages/cli/src/index.ts`
- Test: `/Users/fatih/Code/Playground/NaraFrame/packages/cli/test/unit/parse-command.test.ts`
- Test: `/Users/fatih/Code/Playground/NaraFrame/packages/cli/test/integration/commands.test.ts`

**Interfaces:**
- Consumes: core Task M0.3/M0.4 and renderer Task M0.5 public functions.
- Produces: `parseCommand`, `runCli`, the exported `M0_COMMANDS` list, injectable IO/services for tests, and exit codes 0/1/2/3/130.

- [ ] **Step 1: Write parsing and output tests.**

Cover every M0 command, explicit/default project paths, JSON/human output, selected-scene draft, missing `--draft`, unavailable future stages/commands, cancellation, and injected service failures. JSON mode must emit exactly one final parseable result to stdout; progress belongs on stderr.

- [ ] **Step 2: Run the tests and confirm missing CLI exports.**

Run `rtk pnpm test:unit -- packages/cli/test/unit/parse-command.test.ts`.

Expected: FAIL because `parseCommand` and `runCli` are not exported.

- [ ] **Step 3: Implement parsing with Node's built-in parser.**

Use `node:util` `parseArgs()`; do not add a CLI framework. Require explicit `--draft` for M0 preview. Project path defaults to `process.cwd()` only for validate/status/preview; create always receives a name and optional `--parent` defaulting to the current directory. Unsupported future commands return code 3 with a stable usage issue.

Keep `src/index.ts` limited to process IO, signal handling, and the `runCli` call. `services.ts` wires public core/renderer functions and passes one AbortSignal through the operation. Business logic stays in commands/services that can be tested without spawning the executable.

- [ ] **Step 4: Implement command semantics and exit mapping.**

`doctor` checks exact Node `24.20.x`, package versions, writable project/temp filesystem, `ffmpeg -version`, `ffprobe -version`, local font file and `resolveBrowserExecutable()`. It returns `system-unavailable` plus code 2 for missing system dependencies. It never checks or claims external TTS/image capability in M0.

`schema` prints `exportSchemas()`. `create` calls `createProject()`. `validate --stage plan` loads/validates and returns code 1 on source failure. `status` reports plan validity and any current preview pointer matching sourceRevision. `preview --draft` loads, compiles, renders, and publishes. Map incorrect usage to 3, source/validation failure to 1, system/renderer failure to 2, abort to 130, and success with warnings to 0.

Human output is concise on stdout; diagnostic progress goes to stderr. JSON mode writes versioned progress to stderr and exactly one final `CommandResultEvent` to stdout. Catch unexpected errors at the command boundary, redact project-root parent paths and secrets, and emit `UNEXPECTED_SYSTEM_ERROR` without a stack unless `NARAFRAME_DEBUG=1`.

- [ ] **Step 5: Test real command integration without rendering.**

Use temporary project/profile directories and injected renderer services. Assert every command's final event fields, output channel, explicit/default path, issue code, and exit code. Inject abort before/after load and ensure 130. Assert `schema --json` output parses and that skill-visible command names match the exported `M0_COMMANDS` constant.

Run:

```bash
rtk pnpm test:unit -- packages/cli/test/unit
rtk pnpm test:integration -- packages/cli/test/integration/commands.test.ts
rtk pnpm typecheck
```

Expected: exit 0. Do not call a provider, networked browser setup, or final render in these tests.

### Task M0.7: Publish complete preview builds and contact sheets atomically

**Files:**
- Create: `/Users/fatih/Code/Playground/NaraFrame/packages/renderer-remotion/src/preview/select-frames.ts`
- Create: `/Users/fatih/Code/Playground/NaraFrame/packages/renderer-remotion/src/preview/make-contact-sheet.ts`
- Create: `/Users/fatih/Code/Playground/NaraFrame/packages/renderer-remotion/src/preview/build-manifest.ts`
- Create: `/Users/fatih/Code/Playground/NaraFrame/packages/cli/src/runtime/attempt-manager.ts`
- Create: `/Users/fatih/Code/Playground/NaraFrame/packages/cli/src/runtime/publish-preview-build.ts`
- Create: `/Users/fatih/Code/Playground/NaraFrame/packages/cli/src/runtime/render-and-publish-draft.ts`
- Modify: `/Users/fatih/Code/Playground/NaraFrame/packages/renderer-remotion/src/index.ts`
- Modify: `/Users/fatih/Code/Playground/NaraFrame/packages/cli/src/services.ts`
- Test: `/Users/fatih/Code/Playground/NaraFrame/packages/renderer-remotion/test/unit/preview/select-frames.test.ts`
- Test: `/Users/fatih/Code/Playground/NaraFrame/packages/cli/test/integration/atomic-preview.test.ts`

**Interfaces:**
- Consumes: compiled draft, renderer attempt artifacts, project-local same-filesystem directories.
- Produces: `selectReviewFrames`, `makeContactSheet`, `publishPreviewBuild`, and `renderAndPublishDraft`. Publication returns the `DraftBuild` contract from the M0 contract map.

- [ ] **Step 1: Write deterministic frame-selection tests.**

Select each scene's start/midpoint/end-minus-one and each beat's start/end-minus-one. Deduplicate and sort frames while preserving every reason in `frames.json`. Cap the contact sheet at 24 tiles using the deterministic priority: scene midpoint, beat boundary, scene boundary.

- [ ] **Step 2: Generate a PNG contact sheet without another application dependency.**

`makeContactSheet(frameFiles, outputPath)` calls the explicitly detected FFmpeg binary using `spawnFile`/argument arrays, never shell interpolation. Scale each still to 270 × 480, pad labels in the rendered still itself, and tile four columns with enough rows. Return `FFMPEG_CONTACT_SHEET_FAILED` with sanitized stderr on nonzero exit. Assert PNG signature, nonzero dimensions via FFprobe, and that every selected frame is listed in `frames.json`.

- [ ] **Step 3: Write atomic-publication failure tests.**

Inject failure before build-directory promotion, during current-pointer promotion, on cancellation, with a corrupt/zero-byte MP4, and with a missing report. None may replace the previous `current.json` or mutate its build. A successful publication must resolve every artifact through one build ID.

- [ ] **Step 4: Implement immutable build publication.**

Create attempts under `<project>/.naraframe/attempts/<uuid>/`. Renderer writes `preview.mp4` and stills there; orchestration writes `contact-sheet.png`, `frames.json`, `report.json`, and `manifest.json`. The manifest contains schemaVersion, buildId, sourceRevision, assemblyKey, mode/scope, relative artifact paths/hashes, checked frames, exact runtime versions, start/end timestamps, and success status. Wall clock and buildId stay out of assemblyKey.

Validate required files by hash, PNG/MP4 signature and FFprobe before publication. Rename the complete attempt build to `preview/builds/<build-id>`, write `preview/.current.<uuid>.json`, fsync where supported, then rename the pointer to `preview/current.json`. A build moved successfully but not pointed to is unreferenced and may be cleaned later; never modify it in place. Convenience `preview/preview.mp4` is omitted in M0 to avoid a second potentially stale authority; CLI returns the build artifact path.

- [ ] **Step 5: Run build-integrity checks.**

```bash
rtk pnpm test:unit -- packages/renderer-remotion/test/unit/preview
rtk pnpm test:integration -- packages/cli/test/integration/atomic-preview.test.ts
rtk pnpm typecheck
```

Expected: exit 0; all injected failures retain the old pointer and old build hashes.

### Task M0.8: Add the reference profile, operating skill, and end-to-end draft

**Files:**
- Create: `/Users/fatih/Code/Playground/NaraFrame/profiles/current-issues/profile.json`
- Create: `/Users/fatih/Code/Playground/NaraFrame/profiles/current-issues/direction.md`
- Create: `/Users/fatih/Code/Playground/NaraFrame/profiles/current-issues/assets/fonts/InterVariable.ttf`
- Create: `/Users/fatih/Code/Playground/NaraFrame/profiles/current-issues/assets/fonts/LICENSE.txt`
- Create: `/Users/fatih/Code/Playground/NaraFrame/skills/naraframe/SKILL.md`
- Create: `/Users/fatih/Code/Playground/NaraFrame/README.md`
- Create: `/Users/fatih/Code/Playground/NaraFrame/test-fixtures/project-m0-draft/naraframe.json`
- Create: `/Users/fatih/Code/Playground/NaraFrame/test-fixtures/project-m0-draft/profile.lock.json`
- Create: `/Users/fatih/Code/Playground/NaraFrame/test-fixtures/project-m0-draft/scenes.json`
- Create: `/Users/fatih/Code/Playground/NaraFrame/test-fixtures/project-m0-draft/assets/manifest.json`
- Test: `/Users/fatih/Code/Playground/NaraFrame/packages/cli/test/unit/skill-contract.test.ts`
- Test: `/Users/fatih/Code/Playground/NaraFrame/packages/cli/test/e2e/m0-draft.e2e.test.ts`
- Modify after evidence: `/Users/fatih/Code/Playground/NaraFrame/docs/refine-spec.md`
- Modify after evidence: `/Users/fatih/Code/Playground/NaraFrame/docs/plan.md`, section 11

**Interfaces:**
- Consumes: M0 commands, exported schemas, current-issues direction, and no external production capability.
- Produces: one skill loop, reference profile/fixture, quickstart, real 15-second draft build, and M0 evidence entries.

- [ ] **Step 1: Write the skill contract test first.**

Verify that the skill uses every shipped M0 command, includes plan validation and explicit draft mode, treats `profile.lock.json` as the project identity snapshot, never writes `.naraframe/compiled.json`, and does not advertise M1/M2 commands. Run it first and expect failure because the skill does not exist.

- [ ] **Step 2: Create the current-issues profile and licensed local font.**

Use profile ID `current-issues`, version `1.0.0`, a dark navy/warm white/orange palette, Inter as the local font, locked output format/fps, and overridable accent color. `direction.md` requires Indonesian general-audience explanations, one viewer question, dated sources for current claims, separation of reported facts/history/general effects, and factual review before expensive generation. It recommends 60–90 seconds for real profile output while allowing the 15-second technical fixture.

Pin the unmodified Inter v4.1 variable TTF from the [official release](https://github.com/rsms/inter/releases/tag/v4.1), retain its [SIL Open Font License](https://github.com/rsms/inter/blob/v4.1/LICENSE.txt) beside the font, and record source URL/version/hash in the profile metadata. Rendering must use the copied local asset offline. If its license/file verification fails during execution, stop this task and replace the choice in the plan before bundling another font.

- [ ] **Step 3: Write the M0 skill procedure.**

The procedure uses `doctor`, `schema`, `create`, `validate --stage plan`, `status`, and `preview --draft` (optionally `--scene`). It reads the selected profile direction, edits only source artifacts, fixes actionable issues, inspects returned artifacts, and iterates in the same project. It must label M0 output as silent draft-only and must not call providers or claim narrated/final readiness. Concise examples are allowed, but copied schemas and future commands are not.

- [ ] **Step 4: Build the 15-second fixture through public commands.**

Use three scenes with exact durations 3000, 7000, and 5000 ms:

1. Hook text: `Mengapa Krakatau penting dipahami?`
2. Composition: chamber circle plus `Tekanan meningkat`, with reveal at 0 ms/600 ms, emphasize at 2000 ms/900 ms, and focus at 4500 ms/1000 ms.
3. Closing text: `Sejarah membantu membaca dampaknya.`

Use no narration/caption/music/SFX. The build must visibly carry `DRAFT • NO AUDIO`. The second scene must change explanatory state; a moving title alone fails human review. The fixture lock is generated from the real profile through `create`, then source JSON is edited and validated; do not handcraft a lock that bypasses profile resolution.

- [ ] **Step 5: Write and run the real E2E test.**

The E2E test copies the fixture to a fresh temporary project, resolves the explicit browser, and invokes public CLI boundaries. Assert:

- `doctor --json` returns 0 and exact runtime paths/versions;
- plan validation returns `plan-valid`;
- draft preview returns 0, `draft-only`, a nonnull sourceRevision/buildId, and five existing artifacts under one build directory;
- MP4 probes as 540 × 960, 30 fps, 15 seconds within one frame, H.264, no audio;
- contact sheet is PNG and `frames.json` includes all scenes plus the three semantic beats;
- report and video state `DRAFT • NO AUDIO`;
- current pointer references the same manifest/build;
- the network-denied wrapper and repeated selected-frame hashes from M0.5 pass.

Then change only the closing text through direct JSON editing, run validate/preview again, and assert sourceRevision/assemblyKey/buildId change while the first build remains intact. Introduce an invalid `bounce` action and assert exit 1 with `SCHEMA_INVALID`, file/entity location and corrective suggestion; the second valid current build remains selected.

Run:

```bash
rtk pnpm verify
rtk pnpm test:e2e -- packages/cli/test/e2e/m0-draft.e2e.test.ts
```

Expected: all commands exit 0 except the intentionally invalid preview, which is asserted as exit 1 inside the passing E2E test.

- [ ] **Step 6: Perform Fatih's mixed-route review and record evidence.**

Follow the README once through the skill. Open the actual preview/contact sheet. Edit the closing visual text in `scenes.json` from terminal, validate/preview with CLI, then return to the skill to inspect results. Record assistance needed, issue quality, elapsed active time, preview time, exact build/source IDs and whether renderer code was untouched.

Review frames/video for 9:16 layout, safe zone, local font, legibility, placeholder/watermark, meaningful chamber progression, motion boundaries, and obvious flicker/clipping. Sampled stills prove only their frames; watch the video for between-sample failures.

- [ ] **Step 7: Close M0 with fresh evidence.**

Update section 11 and `docs/refine-spec.md` with commands, dates, exact artifact paths/hashes, runtime versions and observed outcomes. Mark only the requirements actually evidenced. Keep voice/caption/cost/edit-undo/profile-apply AR items unverified for M1/M2.

**M0 completion command:**

```bash
rtk pnpm install --frozen-lockfile
rtk pnpm verify
rtk pnpm test:e2e
```

Expected: zero unhandled failures. Also retain FFprobe output, three repeated pixel-hash pairs, egress-sandbox result, failure-injection result, current manifest and human review notes. If any required evidence is absent, M0 remains in progress.

### M0 execution order and stop conditions

Execute Tasks M0.1 through M0.8 in order. A task ends only after its focused tests, typecheck, and stated artifact inspection pass. Stop and revise this plan/spec when:

- the pinned version set cannot install or render together;
- browser setup cannot be separated from offline rendering;
- the macOS reference run cannot enforce external-egress denial while allowing Remotion loopback;
- local font/PNG output or repeated selected frames is unstable;
- schema/compiled contracts need a breaking change not described here;
- atomic current-build failure injection loses the previous complete build;
- the 15-second scene cannot show meaningful explanatory progression with the M0 primitives.

No provider call, Git initialization/commit, final render, or M1 implementation is part of this plan. After M0 passes, use its evidence to detail M1 in this same `docs/plan.md`.

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
| Node/pnpm/TypeScript/React/Remotion/Zod/Vitest/Biome | Candidate pins selected in header; install/build/render compatibility not proven | M0.1 and M0.5 |
| Browser and FFmpeg exact paths/versions | Not detected or proven | M0.1 and M0.5 |
| Font/PNG/native-layer baseline | Not run | M0 exit |
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
