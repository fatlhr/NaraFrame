# M0.6 Implementer Report

Status: complete pending focused commit.

## Changed files under review

- `docs/plan.md`
- `docs/refine-spec.md`
- `packages/cli/src/command-result.ts`
- `packages/cli/src/doctor.ts`
- `packages/cli/src/index.ts`
- `packages/cli/src/preview-build.ts`
- `packages/cli/src/preview-status.ts`
- `packages/cli/src/runner.ts`
- `packages/cli/test/integration/command-contract.test.ts`
- `packages/cli/test/integration/preview-publication.test.ts`
- `packages/cli/test/integration/validate-command.test.ts`
- `packages/cli/test/unit/process-interruption.test.ts`
- `packages/renderer-remotion/src/render-draft.ts`
- `skills/naraframe/SKILL.md`

## Completed runtime and skill evidence

Pinned runtime: `/opt/homebrew/Cellar/node@24/24.20.0/bin/node` (`v24.20.0`).

- `... node packages/cli/dist/index.js doctor --json` exited 0 with all eight checks ready; no download or render.
- `... node packages/cli/dist/index.js schema --json` exited 0 with one versioned result event from `exportSchemas()`.
- `... node packages/cli/dist/index.js validate samples/krakatau-draft --stage plan --json` exited 0 with source revision `09b2333daa03081bc485868915d413d09556a22e81fa95a93c84cb48c8e7f531` and fingerprint `41b6900277c8ed8533002fbaadecf8cd9b39a9cae4d758d344d6389f6ec63d7d`.
- `... node packages/cli/dist/index.js status samples/krakatau-draft --json` exited 0 and reported current build `41b6900277c8-e328a13e-f39`, current scope, source revision/fingerprint, current pointer, and all five build artifact paths.
- `python3 /Users/fatih/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/naraframe` reported `Skill is valid!`.

## Exit-code audit

Each command below wrote one newline-terminated versioned result event to stdout.

- `preview samples/krakatau-draft --json` exited `3` with `CLI_USAGE`.
- `preview samples/krakatau-draft --draft --scene missing-scene --json` exited `1` with `SCENE_NOT_FOUND`.
- `NARAFRAME_BROWSER_EXECUTABLE=/private/tmp/naraframe-missing-browser preview samples/krakatau-draft --draft --json` exited `2` with `BROWSER_NOT_PROVISIONED`.
- The live active-render SIGINT case below exited `130` with `COMMAND_INTERRUPTED`.

## Live SIGINT evidence

An unsandboxed local Remotion command was required only because the sandbox cannot allocate Remotion's loopback bundle port. The command rendered the Krakatau sample and was sent OS `SIGINT` only after stderr reported `Render 10%`.

- stderr recorded active progress at `Render 0%` then `Render 10%`.
- stdout contained exactly one newline-terminated `command-result` JSON event: `command: preview`, `status: interrupted`, `success: false`, issue `COMMAND_INTERRUPTED`.
- Process exit was `130`.
- The pointer after interruption remained `41b6900277c8-e328a13e-f39`.
- `.naraframe/attempts` had `attemptCount: 0`; no staged attempt remained.

## Automated evidence

- Exact Node build/typecheck passed.
- Focused unit and integration suite passed: 10 files, 37 tests.
- After the package-version doctor audit, the final focused unit/integration run passed again: 10 files, 37 tests.
- `PATH=/opt/homebrew/Cellar/node@24/24.20.0/bin:$PATH ... corepack.js pnpm verify` passed with Node 24.20.0 and pnpm 12.3.4: Biome checked 51 files, unit suite 5 files/8 tests, integration suite 5 files/29 tests, and both TypeScript builds passed.

## Independent skill forward-test

A fresh agent read `skills/naraframe/SKILL.md` and resumed the Krakatau sample without a preview render or source/generated-file edits. After activating the repository pins (Node 24.20.0 and pnpm 12.3.4), it ran the skill's public `doctor --json`, `schema --json`, and `status samples/krakatau-draft --json` commands, then read the pinned `profile.lock.json` as directed. The resume flow was unambiguous after pin activation.

Its `status` result was the same as direct CLI status:

- build ID: `41b6900277c8-e328a13e-f39`
- source revision: `09b2333daa03081bc485868915d413d09556a22e81fa95a93c84cb48c8e7f531`
- fingerprint: `41b6900277c8ed8533002fbaadecf8cd9b39a9cae4d758d344d6389f6ec63d7d`
- scope: `{ "type": "project" }`
- artifact keys: `current`, `manifestJson`, `previewMp4`, `contactSheetPng`, `framesJson`, `reportJson`

## Remaining handoff

- Self-review and focused commit.

## Self-review

- Confirmed core remains independent of Remotion; dependency direction remains CLI -> renderer -> core.
- Confirmed doctor reads the renderer's installed Remotion version and checks the renderer -> core package boundary instead of reporting only package-name constants.
- Confirmed JSON-mode coverage checks exact-one events for success, usage, source, and programmatic cancellation; process-level SIGINT interception has a focused regression test and live evidence.
- Confirmed `publishPreviewBuild()` removes its attempt directory through `finally` for renderer errors and cancellation, and live SIGINT left `attemptCount: 0`.
- `docs/plan.md` and `docs/refine-spec.md` were updated only after runtime, independent skill, and verification gates passed.
- No M0.7+ behavior was added. The only environment caveat is that sandboxed Remotion cannot bind its local bundle port; the live render/SIGINT evidence was run unsandboxed against loopback only.

## Review Fix Report

Status: complete pending focused review-fix commit.

### Root cause and RED evidence

- Pointer race: `promotePreviewBuild()` checked cancellation before `replacePointerAtomically()`, but that helper awaited `writeFile`, `open`, `sync`, and `close` before renaming `current.json`. RED command: `rtk /opt/homebrew/Cellar/node@24/24.20.0/bin/node /opt/homebrew/Cellar/node@24/24.20.0/lib/node_modules/corepack/dist/corepack.js pnpm exec vitest run --project integration packages/cli/test/integration/preview-publication.test.ts packages/cli/test/integration/command-contract.test.ts`. New regression resolved with a promoted pointer rather than rejecting.
- Status contract: `readCurrentPreviewStatus()` accepted only a narrow manifest shape plus artifact hashes. It did not validate the scope union or require manifest/report/frames agreement. The same RED command showed public status exit `0` rather than `2` after a rehashed manifest/report pair with invalid scope.
- SIGTERM: `runCliProcess()` kept its signal-specific code and returned the delegated execution result. RED command: `rtk /opt/homebrew/Cellar/node@24/24.20.0/bin/node /opt/homebrew/Cellar/node@24/24.20.0/lib/node_modules/corepack/dist/corepack.js pnpm exec vitest run --project unit packages/cli/test/unit/process-interruption.test.ts`; received `143`, expected `130`.

### Fix and GREEN evidence

- Pointer publication now checks the signal after each awaited preparation step and immediately before rename, and removes the temporary pointer in `finally`. A focused hook aborts deterministically after preparation. GREEN integration passed 13/13, including prior-pointer preservation and temporary-file cleanup.
- `validatePublishedPreviewMetadata()` centralizes scope, required manifest/report/frames fields, shared metadata, frame shape, and artifact-record validation. Publication and status reuse it; status still performs safe regular-file, containment, byte-size, and SHA-256 checks before returning artifacts. Public command coverage accepts valid scene scope and rejects corrupt pointer hash, symlink, altered artifact, invalid scope, and inconsistent metadata.
- SIGINT/SIGTERM share one interruption state; renderer exit 130/143 is intercepted, `exitCode` is 130, and the wrapper returns 130. GREEN unit passed 2/2.
- Exact focused suite: `rtk /opt/homebrew/Cellar/node@24/24.20.0/bin/node /opt/homebrew/Cellar/node@24/24.20.0/lib/node_modules/corepack/dist/corepack.js pnpm exec vitest run --project unit packages/cli/test/unit` passed 3/3; `rtk /opt/homebrew/Cellar/node@24/24.20.0/bin/node /opt/homebrew/Cellar/node@24/24.20.0/lib/node_modules/corepack/dist/corepack.js pnpm exec vitest run --project integration packages/cli/test/integration` passed 17/17.
- Exact controller gate: `rtk /opt/homebrew/Cellar/node@24/24.20.0/bin/node /opt/homebrew/Cellar/node@24/24.20.0/lib/node_modules/corepack/dist/corepack.js pnpm verify` passed Biome, TypeScript, unit 9/9, and integration 31/31.

### Manual operator rerun

- Human create: `rtk /opt/homebrew/Cellar/node@24/24.20.0/bin/node packages/cli/dist/index.js create work/m0-6-review-created-human --profile current-issues` exited 0 and printed the root plus `naraframe.json`, `profile.lock.json`, `scenes.json`, and `assets/manifest.json`.
- JSON create: `rtk /opt/homebrew/Cellar/node@24/24.20.0/bin/node packages/cli/dist/index.js create work/m0-6-review-created-json --profile current-issues --json` exited 0 with exactly one `command-result`, `success: true`, `readiness: "not-ready"`, and those four artifact paths.
- Human real preview: `rtk proxy /opt/homebrew/Cellar/node@24/24.20.0/bin/node packages/cli/dist/index.js preview samples/krakatau-draft --draft` used loopback-only Remotion and published `41b6900277c8-a2b28188-998`. Public `status --json` then returned its pointer, MP4, contact sheet, frames, report, and manifest paths; project scope; source revision `09b2333daa03081bc485868915d413d09556a22e81fa95a93c84cb48c8e7f531`; fingerprint `41b6900277c8ed8533002fbaadecf8cd9b39a9cae4d758d344d6389f6ec63d7d`; manifest SHA-256 `135498f789f1a2a839cf5fb1a94530572ce8eb6cd425461cdd9338f282011f5d`.
- JSON real preview: `rtk proxy /opt/homebrew/Cellar/node@24/24.20.0/bin/node packages/cli/dist/index.js preview samples/krakatau-draft --draft --scene hook --json` exited 0 with exactly one final event: build `93da18cf5a91-fad10874-1fd`, source revision `09b2333daa03081bc485868915d413d09556a22e81fa95a93c84cb48c8e7f531`, fingerprint `93da18cf5a91a64feff9909d5b4f62984391d534cdfbb3cc654118d9e0edf7f2`, local `hook` scope source frames `0–120`, current/MP4/contact-sheet/frames/report/manifest artifacts, and manifest SHA-256 `5c3ece52962bc7aff27622db6c88a5447e68374035322332a9eaadfcaf58b92d`.

### Changed review-fix paths

- `docs/plan.md`
- `docs/refine-spec.md`
- `packages/cli/src/index.ts`
- `packages/cli/src/preview-build.ts`
- `packages/cli/src/preview-status.ts`
- `packages/cli/test/integration/command-contract.test.ts`
- `packages/cli/test/integration/preview-publication.test.ts`
- `packages/cli/test/unit/process-interruption.test.ts`
- `work/m0-6-sdd/implementer-report.md`

The NaraFrame skill was unchanged, so its official validator was not rerun. No M0.7+ behavior was implemented.

## Review Fix Report — Commit Boundary Follow-up

### Root cause and RED evidence

- `replacePointerAtomically()` returned only after `await rm(temporaryPath)` in `finally`. A SIGINT/SIGTERM in that cleanup window reached `runCliProcess()`, which had no publication-commit state and therefore aborted the signal and returned 130 even after `rename(current.json)` had committed.
- Deterministic RED publication regression: `rtk /opt/homebrew/Cellar/node@24/24.20.0/bin/node /opt/homebrew/Cellar/node@24/24.20.0/lib/node_modules/corepack/dist/corepack.js pnpm exec vitest run --project integration packages/cli/test/integration/preview-publication.test.ts` failed because the post-rename callback was absent and its controller remained un-aborted.
- Deterministic RED process regression: `rtk /opt/homebrew/Cellar/node@24/24.20.0/bin/node /opt/homebrew/Cellar/node@24/24.20.0/lib/node_modules/corepack/dist/corepack.js pnpm exec vitest run --project unit packages/cli/test/unit/process-interruption.test.ts` failed because `RunCliOptions` supplied no preview-commit callback.

### Commit-boundary fix and GREEN evidence

- `replacePointerAtomically()` invokes a synchronous `onPointerCommitted` immediately after successful `rename` and before its cleanup await. `promotePreviewBuild()` and `publishPreviewBuild()` propagate that boundary; runner options forward it from preview publication to `runCliProcess()`.
- `runCliProcess()` records that irreversible state. Before it, SIGINT/SIGTERM still aborts and resolves 130. After it, a late signal does not abort the controller; late renderer exits 130/143 are suppressed with exit code 0, and the successful command result remains authoritative.
- Publication integration now aborts a controller at the post-rename boundary and proves promotion resolves successfully, the new pointer names the committed build, and no temporary pointer remains. Process-interruption coverage proves late SIGTERM returns 0 without aborting the command. Public command-contract coverage mocks the committed publication boundary, emits SIGTERM during its cleanup window, and proves exactly one successful JSON `command-result` with exit 0.
- Exact Node 24.20.0 focused checks: unit CLI suite passed 4/4; integration CLI suite passed 19/19. `rtk /opt/homebrew/Cellar/node@24/24.20.0/bin/node /opt/homebrew/Cellar/node@24/24.20.0/lib/node_modules/corepack/dist/corepack.js pnpm verify` passed Biome, TypeScript, unit 10/10, and integration 33/33.

## Review Fix Report — Rename Dispatch Boundary

### Root cause and RED evidence

- The prior commit boundary was invoked only after `await rename(temporaryPath, current.json)` resolved. A SIGINT or SIGTERM delivered while that promise was in flight could set `interrupted`, then allow rename and the success event to complete, while `runCliProcess()` still returned 130.
- Deterministic RED publication regression: `rtk /opt/homebrew/Cellar/node@24/24.20.0/bin/node /opt/homebrew/Cellar/node@24/24.20.0/lib/node_modules/corepack/dist/corepack.js pnpm exec vitest run --project integration packages/cli/test/integration/preview-publication.test.ts packages/cli/test/integration/command-contract.test.ts` failed with the held renamer never starting (`expected true, received false`) and the public boundary callback absent. The old callback occurred too late to establish a non-interruptible rename dispatch.
- Deterministic RED process regression: `rtk /opt/homebrew/Cellar/node@24/24.20.0/bin/node /opt/homebrew/Cellar/node@24/24.20.0/lib/node_modules/corepack/dist/corepack.js pnpm exec vitest run --project unit packages/cli/test/unit/process-interruption.test.ts` failed because the runner exposed no rename-dispatch callback to the process wrapper.

### Rename-dispatch boundary fix and GREEN evidence

- `replacePointerAtomically()` now invokes synchronous `onPointerRenameDispatched` immediately before calling `pointerRenamer`; that is the irreversible boundary. The awaited rename then determines the command result: success preserves the success result, while failure reaches the normal system-error path rather than becoming cancellation.
- `runCliProcess()` receives this boundary through `PreviewBuildOptions` and `RunCliOptions`. Late SIGINT/SIGTERM neither aborts the controller nor reclassifies renderer exits 130/143; pre-boundary interruption behavior remains unchanged.
- `preview-publication.test.ts` holds the injected renamer, aborts its signal after synchronous dispatch while rename is in flight, then releases the real rename and proves the new `current.json` pointer and temporary-pointer cleanup. `command-contract.test.ts` holds the public preview publication while emitting SIGTERM, then proves one successful JSON result and exit 0. Its companion test proves a post-boundary synthetic rename failure yields `SYSTEM_ERROR` and exit 2. `process-interruption.test.ts` covers late SIGTERM through the host wrapper.
- Exact Node 24.20.0 focused GREEN commands: `rtk /opt/homebrew/Cellar/node@24/24.20.0/bin/node /opt/homebrew/Cellar/node@24/24.20.0/lib/node_modules/corepack/dist/corepack.js pnpm exec tsc -b packages/core packages/renderer-remotion packages/cli --pretty false` passed; `rtk /opt/homebrew/Cellar/node@24/24.20.0/bin/node /opt/homebrew/Cellar/node@24/24.20.0/lib/node_modules/corepack/dist/corepack.js pnpm exec vitest run --project unit packages/cli/test/unit/process-interruption.test.ts` passed 3/3; `rtk /opt/homebrew/Cellar/node@24/24.20.0/bin/node /opt/homebrew/Cellar/node@24/24.20.0/lib/node_modules/corepack/dist/corepack.js pnpm exec vitest run --project integration packages/cli/test/integration/preview-publication.test.ts packages/cli/test/integration/command-contract.test.ts` passed 16/16.
- Exact Node 24.20.0 `rtk /opt/homebrew/Cellar/node@24/24.20.0/bin/node /opt/homebrew/Cellar/node@24/24.20.0/lib/node_modules/corepack/dist/corepack.js pnpm verify` passed Biome, TypeScript, unit 10/10, and integration 34/34.
