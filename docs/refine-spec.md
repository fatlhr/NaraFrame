# NaraFrame MVP — Adversarial Spec Refinement

Status: Inline reviews consolidated; design changes accepted, implementation not started

Date: 2026-09-07
Reviewed artifacts: `docs/spec.md` revisions 0.1 and 0.2; active baseline is revision 0.3.

The user approved the AR follow-up changes after clarifying the initial technical-user target. AR-01 is withdrawn; AR-02–14 are accepted-for-spec. No runtime, usability, voice-quality, or cost test is marked passed by this document update. The temporary dated review/revision-plan files were absorbed into spec/refinement/plan/discovery and removed; this file retains their finding IDs and rationale.

## 1. Review method and limitation

This review challenges the specification against the actual workspace, local runtime, selected technical direction, and documented Remotion behavior.

The referenced spec-driven workflow recommends a fresh-session adversarial review. This review was performed inline by the same primary agent because no independent reviewer/subagent was requested. It must not be represented as independent validation. Runtime conclusions remain provisional until the planned spikes and visual QA are executed.

## 2. Workspace evidence

Historical observations from the initial review on 2026-09-07 (not revalidated dependency requirements):

- The workspace is greenfield and contains discovery/specification documents only.
- It is not currently a Git repository.
- Local Node: `v23.10.0`.
- Local pnpm: `11.19.0`.
- Local FFmpeg: `7.1.1` with H.264/AAC-capable build components.
- No Remotion dependency, browser runtime, schema implementation, test harness, or reference video exists yet.

Consequences:

- No compatibility claim can be based on existing code.
- Node 23 must not become the product contract by accident; implementation should select a supported LTS.
- Media support, deterministic frames, font loading, SVG handling, encoding settings, and render speed are validation tasks.
- The repository must be initialized deliberately before implementation if version control is desired.

## 3. External technical evidence from the reviews

- Remotion `renderMedia()` accepts a local bundle/URL, composition metadata, JSON input props, output path, progress callbacks, cancellation, browser selection, codecs, and render settings: https://www.remotion.dev/docs/renderer/render-media
- Remotion warns that unseeded `Math.random()` can break parallel rendering and provides seeded deterministic randomness: https://www.remotion.dev/docs/using-randomness
- Current Remotion documentation instructs users to keep all `remotion` and `@remotion/*` packages on the same exact version: https://www.remotion.dev/docs/licensing
- Remotion may detect or download a browser if none is provided. NaraFrame must explicitly provision/select a browser before an offline render rather than relying on that default behavior.
- Current licensing distinguishes personal/small-team use from some company/automation uses. Licensing must be checked again before public product or hosted automation use: https://www.remotion.dev/
- The follow-up review checked that Remotion frame ranges use inclusive endpoints; NaraFrame's half-open ranges need an adapter. Local bundle serving requires distinguishing loopback from external network: https://www.remotion.dev/docs/renderer/render-media
- Renderer license eligibility is distinct from unrestricted redistribution of a derivative engine. Recheck the license of the selected version and intended distribution model before release: https://github.com/remotion-dev/remotion/blob/main/LICENSE.md

These sources inform contracts, not proof that NaraFrame can execute them. No current provider prices, verified voice route, or bill-per-video measurement is available.

## 4. Historical RF findings: revision 0.1 → 0.2

The resolutions in this section record the earlier reasoning, not competing active requirements. Revision 0.3 supersedes the single-source-master rules in RF-03/RF-05, lock-only apply in RF-09, and per-output promotion in RF-11. Its M0–M3 feature gates replace historical Phase 0 sequencing. See sections 5–8 for current disposition and `docs/spec.md` for active behavior.

### RF-01 — High — “Offline render” can be violated by browser provisioning

Evidence:

The spec prohibits network access during compile/preview/render. Remotion's renderer can attempt to obtain a browser when one is unavailable.

Risk:

A clean or changed machine may initiate a download during preview/render, making the offline contract false and causing nondeterministic agent failures.

Resolution:

- `naraframe doctor` must detect a compatible pre-provisioned browser and FFmpeg before production.
- Browser installation/setup, if later provided, must be an explicit separate action with network clearly allowed.
- Preview/render must pass an explicit browser executable/runtime and fail with `BROWSER_NOT_PROVISIONED` instead of downloading.

Spec update required: yes.

### RF-02 — High — Profile hash alone does not preserve creative reproducibility

Evidence:

The draft allows an agent-direction snapshot “or content hash”. A hash proves change but cannot reconstruct deleted/changed direction text.

Risk:

An existing project may render consistently while future agent revisions use different creative rules.

Resolution:

- `profile.lock.json` stores the complete resolved machine config and complete direction text snapshot plus hashes.
- Profile assets used by the project are copied into the project asset area or otherwise content-addressed locally.
- Source location is informational and normalized; it is not needed to render/revise the locked project.

Spec update required: yes.

### RF-03 — High — Narrationless scene timing is ambiguous

Evidence:

The draft says narration is the master clock but allows narrationless ranges represented “in the master timeline or project timing data”. Two authorities are left possible.

Risk:

Scene reordering, inserted silent scenes, audio duration, and transition boundaries could compile differently.

Resolution:

- MVP uses one master audio timeline whose duration includes intentional silence.
- `narration.json` records `audioDurationMs` and speech segments; gaps are intentional silence.
- The composition duration equals the probed master narration duration.
- Narrated scenes derive ranges from segment references.
- Narrationless scenes declare an explicit time range within the same master duration.
- Scene ranges must form one complete ordered partition; transitions are overlays and do not change total time.

Spec update required: yes.

### RF-04 — High — Actual text/layout validation needs renderer participation

Evidence:

The core package is renderer-independent, but production validation includes real text clipping and caption safe-zone checks. Static schema logic cannot prove browser font measurement/layout.

Risk:

`validate --stage production` could claim a scene is safe before the actual renderer clips it.

Resolution:

- Split validation internally into static validation and renderer preflight.
- The CLI coordinates both for production-stage validation.
- Renderer preflight loads pinned fonts/assets and renders/measures representative scene states without producing the full video.
- Preview remains the final visual evidence; preflight does not claim aesthetic quality.

Spec update required: yes.

### RF-05 — High — Editing scene order or spoken text can invalidate the narration master

Evidence:

The draft acceptance criterion says scene order and text can be changed through source artifacts. With a single narration master, changing narrative order or spoken text requires new audio/timestamps.

Risk:

The product may promise cheap edits that cannot remain synchronized.

Resolution:

- Visual-only text, layout, motion, asset, caption grouping, and compatible visual-scene assignment can be edited without new narration.
- Spoken-text changes and narrative reorder invalidate narration/timestamps and any word-anchored beats/captions.
- Profile application reports this as `regenerate-narration`.
- The skill performs regeneration; the core never edits audio.

Spec update required: yes.

### RF-06 — High — Deterministic pixel output is unproven

Evidence:

No renderer spike exists. Browser, font rasterization, GPU path, media decoder, and OS can affect pixels even when project JSON is unchanged.

Risk:

The acceptance criterion could fail for environmental reasons or encourage an inaccurate cross-machine claim.

Resolution:

- Restrict the MVP guarantee to repeated runs on one pinned reference environment.
- Record browser executable/version, rendering backend, fonts, Remotion, FFmpeg, OS/architecture, and settings.
- Render the same selected stills twice and compare lossless pixel buffers/hashes.
- Treat cross-machine determinism as unproven and out of scope.

Spec update required: clarification plus mandatory phase-0 gate.

### RF-07 — Medium — Plan-stage missing assets need an explicit representation

Evidence:

Plan validation allows media to be absent but the asset manifest currently assumes a concrete path and hash.

Risk:

The validator cannot distinguish intentionally planned assets from broken references.

Resolution:

- Asset entries support `status: planned | ready`.
- Planned assets require ID, kind, purpose, and intended origin but no path/hash.
- Production validation requires every referenced render asset to be `ready` with path/hash.

Spec update required: yes.

### RF-08 — Medium — Machine-readable profile invalidation needs production metadata

Evidence:

Voice and illustration style are described in agent-facing direction, while `profile apply` must classify regeneration effects automatically.

Risk:

Free-form Markdown diffs cannot reliably tell the core that narration or generated illustrations are stale.

Resolution:

- `profile.json` contains separate `render` and provider-neutral `production` sections.
- `production` stores stable signatures/requirements such as voice identity, illustration style, required timing granularity, and asset policy.
- The renderer consumes only resolved `render`; profile diff/invalidation may inspect both.

Spec update required: yes.

### RF-09 — Medium — Profile application is not sufficiently transactional

Evidence:

The draft says effects are reported before replacing the lock but gives one command without dry-run semantics.

Risk:

An agent could change a project before showing regeneration cost to the user.

Resolution:

- `naraframe profile apply <profile> --dry-run` produces the candidate diff/invalidation report without changes.
- Applying without `--dry-run` uses an attempt directory and atomically replaces the lock only after validation.
- The skill must run dry-run first and request approval when regeneration/manual-review effects exist.

Spec update required: yes.

### RF-10 — Medium — Profile ID/path resolution and portability are undefined

Evidence:

`--profile <path-or-id>` is specified but no registry/search rules exist.

Risk:

Different working directories or machines may resolve the same ID differently.

Resolution:

- MVP accepts an explicit local profile directory or an ID found in the repository's `profiles/` directory.
- Remote profile registries and global user registries are out of scope.
- The resolved lock is self-contained, so the source path is not needed afterward.

Spec update required: yes.

### RF-11 — Medium — “Atomic output” requires a same-filesystem rule

Evidence:

Atomic rename behavior is reliable only when staging and destination share the relevant filesystem and platform semantics.

Risk:

Cross-volume moves can degrade into copy/delete and expose partial output.

Resolution:

- Attempt directories are created under the project on the same filesystem as `preview/` and `output/`.
- Promotion uses rename where supported; fallback replacement must copy to a sibling temporary file, verify size/hash/decode, then rename.

Spec update required: yes.

### RF-12 — Medium — Media format support is currently an assumption

Evidence:

No actual Remotion/browser/FFmpeg test has loaded the proposed PNG/JPEG/WebP/SVG/MP4/WebM/WAV/MP3/M4A/font matrix.

Risk:

The schema could promise formats that fail on the selected browser or codec pipeline.

Resolution:

- Phase 0 creates a media compatibility fixture.
- Only passing formats are enabled in schema v1.
- Unsupported formats receive an explicit conversion-oriented error.

Spec update required: acceptance gate already present; plan must make it blocking.

### RF-13 — Medium — Reference-project count is misleading

Evidence:

One of the three listed “projects” is the first project after profile re-application, not an independent source project.

Risk:

Coverage may be overstated.

Resolution:

Define two independent source projects plus one derived profile-switch variant, yielding three acceptance scenarios.

Spec update required: yes.

### RF-14 — Medium — Optional production artifacts look mandatory

Evidence:

The project tree lists `script.md` and `sources.json` without marking that only some profiles require them.

Risk:

The core may accidentally impose current-issues editorial requirements on every niche.

Resolution:

- Mark them optional globally.
- A profile may require them at plan stage.
- The core validates presence/schema only; factual quality remains a human/agent responsibility.

Spec update required: yes.

### RF-15 — Medium — Duration safety limit and profile recommendation are different policies

Evidence:

The 180-second safety limit can be read as an editorial product limit.

Risk:

Profiles may incorrectly inherit a global content duration.

Resolution:

- Keep profile recommended range as a warning policy.
- Keep `maxRenderDurationMs` as an explicit operational guard in project settings, defaulting to 180 seconds for MVP.
- Allow explicit project override within engine hard safety constraints established by the spike.

Spec update required: wording clarification.

### RF-16 — Low — Renderer abstraction can become speculative architecture

Evidence:

Only one renderer is planned.

Risk:

Designing a broad portable renderer interface may slow the MVP without proving replaceability.

Resolution:

Keep one narrow package boundary around `CompiledProject → PreviewResult/RenderResult`. Do not generalize lower-level layout/media APIs or claim renderer interchangeability.

Spec update required: already aligned; plan must preserve narrow scope.

### RF-17 — Low — Performance has no defensible threshold yet

Evidence:

No reference project or benchmark machine exists.

Risk:

An arbitrary render-time acceptance threshold would be meaningless.

Resolution:

Measure compile, preview, and final render times during acceptance. Use the first real projects to establish budgets; do not block MVP on an invented multiplier.

Spec update required: add measurement requirement, no hard threshold.

## 5. RF disposition after revision 0.3

The historical RF review contained 6 High, 9 Medium, and 2 Low findings. None is verified by runtime evidence yet.

| Finding | Current design disposition | Delivery proof required |
|---|---|---|
| RF-01 | Accepted: explicit browser, no download; external egress denied, loopback allowed | M0.1, missing-browser/offline test |
| RF-02 | Accepted: full direction/config/asset snapshot | M0.2, deleted source-profile portability |
| RF-03 | Superseded by NF-TL-01–05 block/pauses/resolved-clock contract | M1.2, gap/partition/sample tests |
| RF-04 | Accepted with sampled-only preflight limitation | M0.2/M3.2, layout/motion evidence |
| RF-05 | Superseded by NF-REV-01 localized invalidation | M1.2, partial voice/continuity proof |
| RF-06 | Accepted: pinned-reference determinism only | M0.1/M3.1, repeated decoded frame hashes |
| RF-07 | Accepted: planned/ready plus derived stale dependencies | M0.2/M2.1, staged/scoped validation |
| RF-08 | Accepted: separate render/production signatures | M2.2, profile effects |
| RF-09 | Extended: whole-source transaction, needs-production apply, overrides/undo | M2.2, crash/conflict/apply tests |
| RF-10 | Accepted: local path/repository profile ID, portable lock | M0.2/M2.2 |
| RF-11 | Extended: immutable complete build + atomic current pointer | M0.2/M1.3, fault injection |
| RF-12 | Accepted: narrow tested matrix enabled with each feature | M0.1/M1.2/M2.2 |
| RF-13 | Accepted: two independent projects + one derived variant everywhere | M2.3 |
| RF-14 | Accepted: script/sources optional globally, profile-required where appropriate | M0.2/3, contrasting profile test |
| RF-15 | Accepted: profile recommendation versus 180s operational safety default | M0.2, warning/error tests |
| RF-16 | Accepted: narrow compiled-input renderer boundary | M0.2, dependency boundary test |
| RF-17 | Accepted: measurements without invented pass threshold | M3.3 |

All rows above: implementation not started; verification not run. Superseded historical wording is not an active defect obligation when the replacement contract addresses its original risk.

## 6. Blocking evidence by current milestone

Demonstrate these with the feature that needs them, not as one broad prerequisite before the first draft:

1. M0: selected Node LTS/Remotion/browser/FFmpeg install and render locally; create the initial lockfile before frozen reinstall.
2. M0: external network denied in Node/browser, required loopback allowed, no implicit browser download.
3. M0: local font/native-layer/PNG baseline, selected-frame repeatability, safe paths and complete-build atomic publication.
4. M1: one real Indonesian narration/phrase-timing recipe, block joins/partial voice replacement, final H.264/AAC sample coverage, and ledger tests before paid generation.
5. M1: staged source revisions/manual edits/undo recover safely without erasing usage history.
6. M2: additional SVG/video/audio/font formats only after their safety/decode tests; scoped preview and profile apply/rollback.
7. M3: full video/audio review, owner mixed-route dogfooding, repeatability and measured usage/latency. Sampled preflight cannot prove every frame safe.

If a required gate fails, stop the affected milestone and resolve it or explicitly narrow the approved scope. Do not mark it passed because the requirement was written down.

## 7. Current refinement verdict

The accepted design preserves one interleaved skill/core pipeline plus direct CLI/JSON use for Fatih. The former novice-target criticism was a reviewer scope error, not a product flaw. Remaining revisions target affordable local edits, earlier previews, production readiness, source recovery, and a working slice before a large visual registry.

Spec 0.3 is the approved design baseline. `docs/plan.md` contains the M0–M3 roadmap and the verified M0 implementation record; there is no second planning layer. M0.1–M0.8 are implemented. M0.7's baseline render, direct owner JSON edit, stale detection, rerender, invalid-action recovery, motion revision, regression protection, and owner re-review passed. M0.8 then closed cross-feature, failure, offline, determinism, and runtime-evidence gaps. Owner active time was not instrumented and is explicitly recorded as unavailable. Narration, usage/cost, durable source transactions, and final workflow evidence remain future milestones.

M0.6 evidence: the exact Node 24.20.0/pnpm 12.3.4 runtime passed public `doctor`, `schema`, `create`, `validate --stage plan`, `status`, and `preview --draft` contracts. In the review-fix rerun, human and JSON `create` commands succeeded in `work/m0-6-review-created-human` and `work/m0-6-review-created-json`; a real human full preview published current immutable build `41b6900277c8-a2b28188-998`, while JSON scoped `preview --draft --scene hook --json` published `93da18cf5a91-fad10874-1fd`. Both use source revision `09b2333daa03081bc485868915d413d09556a22e81fa95a93c84cb48c8e7f531`; their project/scoped fingerprints are `41b6900277c8ed8533002fbaadecf8cd9b39a9cae4d758d344d6389f6ec63d7d` and `93da18cf5a91a64feff9909d5b4f62984391d534cdfbb3cc654118d9e0edf7f2`. The review proves cancellation after durable pointer preparation cannot replace the pointer and cleans its temporary file. Public status now rejects corrupt pointer hashes, unsafe symlinks, tampered artifact content, invalid scope unions, and inconsistent manifest/report/frames metadata before returning paths; valid scene scopes remain supported. SIGTERM and SIGINT interruption both resolve to 130. Focused CLI checks passed 3 unit/17 integration tests; final verification passed unit 9/9 and integration 31/31. The skill was unchanged in the review.

M0.7 evidence: the clean owner-trial worktree started at `0789b08`. `doctor` rejected ambient Node `23.10.0` with `NODE_VERSION_INCOMPATIBLE`; activating `/opt/homebrew/opt/node@24/bin` produced the pinned Node `24.20.0`/pnpm `12.3.4` route and all doctor checks passed. A real full preview then published immutable build `41b6900277c8-5a908e88-4e1` for source revision `09b2333daa03081bc485868915d413d09556a22e81fa95a93c84cb48c8e7f531` and assembly key `41b6900277c8ed8533002fbaadecf8cd9b39a9cae4d758d344d6389f6ec63d7d`; CLI/report/wall timing was 38.283/37.945/52.58 seconds. Fatih directly changed only the closing text in `scenes.json`. Validation passed with source revision `0e2f2b8aef04611c672f7edb872d5bda29a5bea81d74591545b72917f6fcf60b` and assembly key `0654538e7ce0a856b23a707520b7472c0c21aaf1f4261eec86b7c4de5d3daa5c`; status correctly reported the baseline stale. The rerender published current build `0654538e7ce0-2b154c13-273` with CLI/report/wall timing 43.471/43.074/66.98 seconds. Both 540 × 960, 30 fps, 18-second silent MP4s and their 11-frame contact sheets were opened. The revised six-line closing stays inside the visual safe area. Owner visual review failed because the video reads as ordinary cuts and the image has no interesting perceptible motion. Renderer inspection found that the previous image focus reached only about 4.2% scale and 8 px vertical translation, its reveal travelled about 32 px over 0.8 seconds, and the marker pulsed once. The accepted revision keeps the engine generic: reveal/emphasize/focus now accept bounded `linear`, `smooth`, or `snappy` presets; focus defaults to smooth easing and provides stronger camera travel. Profile `current-issues` 0.2 sets a stronger focus scale and directs choreography from scene meaning. Only the Krakatau sample defines its staged panel/map/marker/copy reveals, sustained map push, and repeated marker emphasis. Build `96b57423d8ff-16e8cc76-28a` is current for source revision `f256ab60b4ff34fff5e260c20a51a7b02466d180927eb3a575d6d4357581993d` and assembly key `96b57423d8ff015bd1f5b2941e4d847c8ac49bc94dcd01f8bb5c64786e37649f`; CLI/report/wall timing was 37.019/37.019/51.88 seconds. FFprobe reports H.264, 540 × 960, 30 fps, 18 seconds, and no audio. Its 14-frame contact sheet shows the context progression. Focused unit and integration checks passed 7/7 each; full `pnpm verify` passed unit 13/13 and integration 39/39. A separate invalid-action copy placed `bounce` at `/scenes/1/beats/3/action`; validation exited 1 with `SCHEMA_INVALID`, responsible `agent`, exact source location, supported alternatives, and corrective guidance. Restoring `focus` passed. The initial sandboxed render failed because Remotion could not allocate a loopback port; rerunning where loopback is allowed succeeded without source or renderer changes. Agent assistance supplied the tested runtime command and ran validation/render after the owner edit. Fatih accepted the revised context-driven motion on 2026-09-14. Owner active time was not measured and is recorded as unavailable; start timing before the next owner trial. M0.7 is complete with that explicit evidence limitation.

M0.8 evidence: the cross-feature E2E uses a copied 15-second Krakatau source and only public CLI commands. It validates, renders in a macOS sandbox that allows renderer loopback while returning `EPERM` for external outbound IP, verifies the current pointer plus manifest and all four recorded artifacts, runs FFprobe and a strict full decode, repeats the unchanged render, detects a one-line edit as stale, rerenders, rejects `bounce` at `/scenes/0/beats/0/action`, and validates after restoring `reveal`. Sandboxed builds `db7809686cd3-02a70a72-5ef` and `db7809686cd3-982301b0-1c0` share source revision `9558ace64d515f54b555304c507578cbbe9cedbdfae7984ddd07c3013b038af2`; revised build `80ade327b801-2b226e0e-f84` uses revision `9c01f5438dc0faa52127b7de6d967a2b661cb23679ae2c3e9f9e7d7ac19b216e`. Lossless frames 18/180/405 match across the two unchanged sandboxed renders with SHA-256 `0e2c5c78660a182bb5816256c1f48848676e64cee54190c46b9e52ce5690f2d5`, `42307d79cfaae3ea28002163c7498c1e5aa6b02ad5bee8c654d244463e0ac2d1`, and `eaf4b5086e9c9c42c8705d67259c397168c4abce260383f698f5bd539b5ffde0`. The first manifest hash is `dc4dfabd795cf15e776beb2aa2f9e269f1e4f8790b193e6402b5462664707069`; MP4/contact-sheet/frames/report hashes are `55128ab2f766f978d9ed299ec1f3b732a0b4bc21217fcf6fc1cda841bf57e597`, `25cff7f026fc6aa1854ade712848b0eb28e3da40d1727040edd871e5441d3dc2`, `750bdd3b54325ad5823e09b1b83c4cad75bcf2c36bf41a9a3da1b09065cd2e38`, and `ee4f9c81b2c97be13c2187c795e71511cc7354614f9c301ba2a8e52f1f3e6d7f`. Explicit missing browser/FFmpeg checks, no-download behavior, unexpected-error redaction, existing cancellation and atomic pointer failure injection, object-key determinism, motion boundaries, and package exports are covered. A sandboxed-versus-unsandboxed transformed-image frame differed and was rejected as invalid determinism evidence because the reference environment was not held constant. The retained `work/m0-8-exit-Wn5gv8/` evidence is local/ignored. Selected-frame identity is not proof that every frame is aesthetically safe; the earlier owner review remains the visual-quality evidence. The final frozen install reused 279 packages with zero downloads; `pnpm verify` passed unit 16/16 and integration 41/41; the evidence-producing serial E2E passed 2/2 in 177.27 seconds; the post-review cleanup-verification E2E passed 2/2 in 180.37 seconds. M0.8 and M0 are complete.

## 8. AR follow-up review and accepted changes: revision 0.2 → 0.3

Both passes were inline in the same task. A model change was not independent runtime validation. Evidence locations below refer to the reviewed revision 0.2 sections, not current line numbers. There were 14 findings initially; AR-01 was withdrawn after clarification, leaving 7 High and 6 Medium accepted changes.

### AR-01 — Withdrawn — Initial user target

Evidence: revision 0.2 section 5 allowed comfort with Codex/local files. The first follow-up interpreted ease of use as a novice/no-terminal requirement.

Correction: Fatih explicitly confirmed comfort with JSON/terminal. Remove guided onboarding, mandatory starter-profile flow, chat-only success criteria, and three-nondeveloper pilot from the proposal. Preserve reference profiles as fixtures and quickstart/doctor as practical operator documentation. NF-UX-01/02 and NF-AC-10 clarify technical-user ergonomics, not a replacement audience. No implementation obligation remains for the withdrawn criticism.

### AR-02 — High — Production cost had no operating contract

Evidence: revision 0.2 sections 4.3 and 27 delegated generation to available tools and measured cost only after MVP; no reservation/retry/receipt contract existed.

Accepted change: NF-CO-01, production.json and append-only operation receipts, no-new-spend default, known/unknown cash/quota separation, reuse before generation, sequential calls, budget reservation/reconciliation, and two-attempt limit. Unknown request results cannot be blindly resent; charged failures and unresolved costs survive undo. This is workflow accounting, not a guarantee over all agent billing. Renderer/license/host and asset/font/voice rights are checked separately. Start with a local helper, not a billing platform.

Proof: M1.1 / NF-AC-11 fake-provider budget/timeout/retry/undo cases; M3.3 real measured/unknown usage.

### AR-03 — High — Provider-neutral did not prove a narrated route

Evidence: revision 0.2 NF-FL-03 and NF-AC-02 assumed tools could provide voice/timing, while allowing missing-capability reports.

Accepted change: NF-CAP-01 distinguishes local doctor from external capability checks and prepared-media/draft/narrated modes. One runtime-tested Indonesian voice/phrase-timing recipe is required; a silent draft remains a labelled fallback. No provider SDK/key enters core.

Proof: M1.1 / NF-AC-02/11, actual narration without user-authored timestamps and a missing-TTS case. Recipe currently unverified.

### AR-04 — High — Single-source master made spoken revisions expensive

Evidence: revision 0.2 section 12/RF-03 required one source audio master including all silence; NF-AC-04 invalidated narration for story changes.

Accepted change: NF-TL-05/NF-REV-01 ordered story blocks, local clips/timing, derived offsets/master, explicit pauses. One paragraph/story section may span scenes; not automatic per-word or per-scene TTS. Retain imported master as one block with larger revision scope. Replace the owning block first; explain neighboring regeneration if prosody requires it.

Proof: M1.2 / NF-AC-12, retained first/third clip hashes, downstream offset recomputation, listening across joins. Block assembly alone does not prove natural voice continuity.

### AR-05 — High — Scene preview depended on full readiness

Evidence: revision 0.2 NF-FL-04 offered a scene range, but section 20 and old Phase 7 used full production validation/compiled project first.

Accepted change: NF-PV-01 explicit draft/selected/full/final scope. Unknown earlier durations can yield local preview scope; required shared dependencies/transitions still validate. Unrelated absent scene media does not block selected preview; placeholders never enter final.

Proof: M0.2/M2.1 / NF-AC-13, ready scene 2 plus missing scene 7 and full-render rejection.

### AR-06 — High — Source changes lacked undo and transaction safety

Evidence: revision 0.2 section 17 protected generated outputs only; multi-file source corrections had no rollback/conflict contract.

Accepted change: NF-REV-02 immutable snapshots/current pointer, expected revision, one writer, staged edits, direct JSON detection/capture, durable media, source/profile undo. Preserve invalid/uncommitted working files on recovery. Operational receipts/spend never roll back. M0 captures immutable build input; durable user-facing history arrives with M1 revisions.

Proof: M1.3 / NF-AC-14, caption/voice undo, staging crash, stale revision conflict, manual edit failure.

### AR-07 — High — Component-first delivery delayed actual workflow proof

Evidence: old plan had 41 tasks; CLI Phase 6, skill Phase 8, nine visual components before complete agent operation.

Accepted change: M0–M3 vertical delivery gates. Minimal skill/CLI/core/preview/profile loop first; narrated revision second; visual forms grow as composition recipes before dedicated renderers. Preserve within-scene explanatory progression, not just decorative slides.

Proof target: M0.8 usable 15–30s draft, M1 narrated edit, M2 reference videos. Existing technical safeguards are staged with their feature, not abandoned.

### AR-08 — High — Old plan was not executable at task level

Evidence: old tasks mostly said implement/test without full interfaces, test code, or precise expected failures. Frozen install preceded a created lockfile; timing tolerance and skill-test discovery were unspecified.

Accepted change: expand only the active milestone in `docs/plan.md` with task order, owned files, boundary contracts, test coverage, commands, and evidence. Implementation bodies belong to the work stage. Bootstrap uses an ordinary install before frozen reinstall; renderer timing tests use one-frame synthetic tolerance distinct from perceived alignment.

Proof: `docs/plan.md` sections 4–5 now define the M0 execution plan without creating product source files. M1–M3 remain roadmap-level until preceding runtime evidence exists.

### AR-09 — Medium — One fingerprint conflated reuse and approval

Evidence: revision 0.2 NF-CP-02/NF-CA-02 keyed all source/runtime/render contents together; upstream generation reuse was not defined.

Accepted change: sourceRevision, generationKey, sceneRenderKey, assemblyKey, and approval identity have separate scopes. Retain voice/images as source. Editorial changes may require renewed review with identical pixels; final encoding can rerun without new generation. No distributed cache/frame resume promise.

Proof: M1.3/M2.1 / NF-AC-13, caption/color/notes revisions and unrelated asset-key retention.

### AR-10 — Medium — Natural gaps and inclusive API boundaries were ambiguous

Evidence: revision 0.2 NF-TL-02 demanded full partition while deriving ranges from speech start/end; breath gaps create ordinary uncovered intervals. Core used half-open frames and renderer documentation uses inclusive endpoints.

Accepted change: scene ownership for leading/trailing/inter-phrase silence, explicit pauses, shared boundaries, zero-frame rejection, sample-safe terminal ceil, and endFrame-1 renderer adapter.

Proof: M1.2 / NF-AC-12/13, 300 ms gap, each scene boundary rendered once, final audio coverage. Audio scheduling and alignment quality are separate checks.

### AR-11 — Medium — Profile apply omitted editorial/override/recovery effects

Evidence: revision 0.2 NF-PF-04 had candidate validation and lock replacement without clear stale-voice readiness or existing override conflict handling.

Accepted change: profile apply uses source transactions, reports render/production/editorial impact, preserves allowed overrides, blocks unresolved conflicts, and can commit schema-valid needs-production. Source-profile defaults and current-project overrides are distinct. Explicit reset is reversible; core does not regenerate invalidated media.

Proof: M2.2 / NF-AC-08/14, dry-run no mutation, stale voice blocks final not apply, conflict handling and undo.

### AR-12 — Medium — Caption correction could trigger unnecessary retake

Evidence: revision 0.2 section 13 derived captions from narration without separating intended text, observed transcript, and corrected display.

Accepted change: NF-CAPTION-01 attributed cue display corrections with stable references; already-correct speech needs no regeneration. Intended-speech edits remain block invalidation. Without word timing, wrap/display the phrase; estimated split timing is draft-only.

Proof: M1.2 / NF-AC-04/12, spelling versus meaning changes, zero provider calls for display-only edits, long phrases.

### AR-13 — Medium — Offline, build atomicity, and sampled QA needed precision

Evidence: revision 0.2 offline wording could exclude renderer loopback; per-file promotion did not atomically publish video/report/contact sheet together; sampled preflight was easy to overstate.

Accepted change: deny external egress while permitting required loopback; immutable complete build directories/current pointer; convenience aliases not authoritative. Report exact sampled states, allow intentional offscreen motion, and require separate video/boundary review.

Proof: M0.1/2/M3.2 / NF-AC-01/05/13, network guard, crash before pointer, unsampled overflow fixture and honest QA coverage.

### AR-14 — Medium — Finding status and reference count overstated evidence

Evidence: previous refinement mixed wording changes with spike assignments under resolved status. MVP deliverables still said three projects while acceptance specified two sources plus a variant. Discovery retained accepted decisions as open proposals.

Accepted change: consolidate this evidence register, two-project-plus-variant terminology, accepted decision history, and same-file milestone planning. Separate design adoption from implemented/verified states. Start cost/reuse measurement during pilot.

Proof: cross-document checks for this revision; later M3 runtime/usage evidence still required.

## 9. Status and evidence register

Lifecycle: proposed → accepted-for-spec → implemented → verified, or deferred-with-reason / withdrawn-with-reason. Design acceptance does not skip implementation and verification states.

| Finding | Severity | Design status | Implementation | Verification |
|---|---|---|---|---|
| AR-01 | Withdrawn | User-target assumption retracted | Not applicable | No novice gate |
| AR-02 | High | Accepted-for-spec | Not started | Not run |
| AR-03 | High | Accepted-for-spec | Not started | Not run |
| AR-04 | High | Accepted-for-spec | Not started | Not run |
| AR-05 | High | Accepted-for-spec | Not started | Not run |
| AR-06 | High | Accepted-for-spec | Not started | Not run |
| AR-07 | High | Accepted roadmap sequence | Product not started | Workflow pilot not run |
| AR-08 | High | Accepted milestone-authoring gate | M0 plan ready; product code not started | Not run |
| AR-09 | Medium | Accepted-for-spec | Not started | Not run |
| AR-10 | Medium | Accepted-for-spec | Not started | Not run |
| AR-11 | Medium | Accepted-for-spec | Not started | Not run |
| AR-12 | Medium | Accepted-for-spec | Not started | Not run |
| AR-13 | Medium | Accepted-for-spec | Not started | Not run |
| AR-14 | Medium | Accepted; document consistency corrected | Product not started | Runtime evidence not run |

Each active finding above has its requirement/scenario and milestone under section 8 and plan.md section 9. Record exact commands, source/build IDs, output hashes/paths, test dates, and human review notes when execution supplies evidence. None currently exists for a completed NaraFrame video or measured per-video cost.

## 10. Documentation consolidation check — 2026-09-07

- Four existing documents remain: discovery, spec, refine-spec, and plan. The two temporary review/plan artifacts were removed after their content was integrated and byte-matching backup copies checked outside the project.
- Static document check passed: 64 unique NF requirement definitions, NF-AC-01–14 present, no undefined literal NF references, AR-01 withdrawn and 13 active AR findings traced to delivery gates.
- Markdown fence pairing and embedded JSON parsing passed; no references remain to the removed files or obsolete active single-master/three-project rules.
- Arithmetic examples checked: block starts 0/2700 ms, total 4500 ms; changed first clip moves the next start to 3300 ms; 1000 ms equals 30 frames; 40 spent + 40 reserved + 30 requested exceeds a 100-unit budget.
- These checks validate document structure and example arithmetic only. No NaraFrame code, automated product test, generated video, provider bill, or usability result was produced by this update. Git is still not initialized.
