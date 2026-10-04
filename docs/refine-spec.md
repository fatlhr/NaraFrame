# NaraFrame MVP — Adversarial Spec Refinement

Status: Active product-direction audit; production-layer recommendation and bounded authoring pilot planned, not implemented. Main is at `b1875e2`; M2 is technically closed, M3.1-A integrated, and the M3.1-B/B1 audio checkpoint integrated through M3.P0 (PR #24). D-VIS remains open. Section 13 is the current refinement verdict.

Date: 2026-10-04
Reviewed artifacts: active Git diff/handoffs, specification revision 0.7, NaraFrame skill and source contracts, and the local TutorLog brief/report, three generators, result JSON and MP4 playback. Sections 1–12 retain dated historical reviews; their sequencing/exclusions are not current execution instructions. Section 13 and plan section 0 supersede conflicting historical policies. No implementation, suite or render was executed for this audit.

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

These sources informed the original contracts, not runtime proof. Later prepared-voice/export evidence is recorded in `docs/plan.md` sections 6–7; live provider pricing and measured paid cost comparison remain unavailable.

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

The historical RF review contained 6 High, 9 Medium, and 2 Low findings. The table records their design disposition at revision 0.3; later implementation status is consolidated in sections 7, 9, and 11.

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

At the revision-0.3 documentation checkpoint, implementation had not started and verification had not run. That sentence is historical, not the current project status. Superseded wording is not an active defect obligation when the replacement contract addresses its original risk.

## 6. Historical blocking evidence by milestone (2026-09-20)

Demonstrate these with the feature that needs them, not as one broad prerequisite before the first draft:

1. M0: selected Node LTS/Remotion/browser/FFmpeg install and render locally; create the initial lockfile before frozen reinstall.
2. M0: external network denied in Node/browser, required loopback allowed, no implicit browser download.
3. M0: local font/native-layer/PNG baseline, selected-frame repeatability, safe paths and complete-build atomic publication.
4. M1: one real Indonesian narration/phrase-timing recipe, block joins/partial voice replacement, final H.264/AAC sample coverage, and ledger tests before paid generation.
5. M1: staged source revisions/manual edits/undo recover safely without erasing usage history.
6. M2: additional SVG/video/audio/font formats only after their safety/decode tests; scoped preview and profile apply/rollback.
7. M2.4: recover the rejected opening through reference-fidelity proof (M2.4.1), immediately test a distinct frozen-engine LBC opening (M2.4.2), then extend river/shipping/data storytelling (M2.4.3), full Medan (M2.4.4), and full LBC/revisions (M2.4.5). NF-AC-16/17 must pass before M3.
8. M3: full video/audio review, owner mixed-route dogfooding, repeatability and measured usage/latency. Sampled preflight cannot prove every frame safe.

If a required gate fails, stop the affected milestone and resolve it or explicitly narrow the approved scope. Do not mark it passed because the requirement was written down.

## 7. Historical refinement verdict (2026-09-20)

The accepted design preserves one interleaved skill/core pipeline and optional direct CLI/JSON control. AR-01 remains withdrawn as a historical reviewer scope error. The owner's new M2.4 direction explicitly adds ordinary revisions without schema knowledge and data suitable for a future GUI (NF-UX-03), without adding a GUI or mandatory novice-onboarding study.

Spec 0.6 is the approved reference-first recovery design baseline. `docs/plan.md` contains delivered M0–M2.3 evidence and the expanded M2.4 insertion; there is no second planning layer. Core revision/profile/preview/accounting capabilities are useful foundations, but neither green checks nor completed technical milestones establish competitive visual quality. Medan parity and a distinct LBC first draft are new acceptance obligations, not already-passed outcomes. Existing pixel-repeatability and measured paid-cost gaps remain explicit.

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

**Historical M0 checkpoint:** the AR table below preserves its original implementation snapshot, including tasks then pending M1/M2. It is not the current delivery tracker. Current M0–M2.3 delivery is recorded in `docs/plan.md` sections 6–7, and the new M2.4 disposition is in section 12 below. No prior test outcome is newly asserted by updating this file.

| Finding | Severity | Design status | Implementation | Verification |
|---|---|---|---|---|
| AR-01 | Withdrawn | User-target assumption retracted | Not applicable | No novice gate |
| AR-02 | High | Accepted-for-spec | M0 production-policy shell exists; ledger pending M1 | M0 policy path verified; budget cases not run |
| AR-03 | High | Accepted-for-spec | Silent fallback implemented; narrated route pending M1 | Fallback verified; real voice/timing not run |
| AR-04 | High | Accepted-for-spec | Pending M1 | Not run |
| AR-05 | High | Accepted-for-spec | Draft/full-project scope implemented; production dependency closure pending M2 | M0 draft scope verified |
| AR-06 | High | Accepted-for-spec | Not started | Not run |
| AR-07 | High | Accepted roadmap sequence | M0 vertical slice implemented | M0 CLI/skill/runtime path verified; narration pending |
| AR-08 | High | Accepted milestone-authoring gate | M0 executed; M0.9 corrective implementation complete | M0.9 technical evidence and owner visual acceptance both pass; M0 complete |
| AR-09 | Medium | Accepted-for-spec | Source/assembly keys implemented; remaining keys pending M1/M2 | M0 determinism/key coverage verified |
| AR-10 | Medium | Accepted-for-spec | Not started | Not run |
| AR-11 | Medium | Accepted-for-spec | Not started | Not run |
| AR-12 | Medium | Accepted-for-spec | Not started | Not run |
| AR-13 | Medium | Accepted-for-spec | External-egress/build atomicity/sampled QA implemented for M0 | M0 runtime and failure injection verified; later audio scope pending |
| AR-14 | Medium | Accepted; document consistency corrected | Milestone/evidence lifecycle in active use | M0 runtime evidence recorded; later milestones pending |

Each finding above has its requirement/scenario and milestone under section 8 and `docs/plan.md` section 9. At that historical checkpoint only silent-draft evidence existed. M1 now records a narrated final and spoken revision, with cost explicitly untracked; measured paid-cost comparison remains open. Use the dated milestone sections for current source/build IDs, artifacts, tests, and owner decisions.

## 10. Documentation consolidation check — 2026-09-07

- Four existing documents remain: discovery, spec, refine-spec, and plan. The two temporary review/plan artifacts were removed after their content was integrated and byte-matching backup copies checked outside the project.
- Static document check passed: 64 unique NF requirement definitions, NF-AC-01–14 present, no undefined literal NF references, AR-01 withdrawn and 13 active AR findings traced to delivery gates.
- Markdown fence pairing and embedded JSON parsing passed; no references remain to the removed files or obsolete active single-master/three-project rules.
- Arithmetic examples checked: block starts 0/2700 ms, total 4500 ms; changed first clip moves the next start to 3300 ms; 1000 ms equals 30 frames; 40 spent + 40 reserved + 30 requested exceeds a 100-unit budget.
- These checks validate document structure and example arithmetic only. No NaraFrame code, automated product test, generated video, provider bill, or usability result was produced by this update. Git is still not initialized.

## 11. LBC visual-fidelity benchmark and corrective decision — 2026-09-14

This is a new evidence pass, not a reinterpretation of the original greenfield review. Both variants use the same LBC intent and local assets, run for 30 seconds at 540 × 960 and 30 fps, and omit audio. The engine output proves the generic path runs; the direct-Remotion output demonstrates the quality currently possible when layout and styling are expressed per element.

### 11.1 Evidence and observed failure

- Engine: `work/lbc-benchmark/output/lbc-naraframe-engine.mp4`, SHA-256 `f614260e0c137a64c39c6df8073e77885007eb52dc6c374ad3af6b06f5e0a74f`.
- Direct Remotion: `work/lbc-benchmark/output/lbc-remotion-full.mp4`, SHA-256 `69903934a00ae59272205c7f11007d18db6b3c0701f1478710b13cd49c2bba31`.
- Side-by-side sheet: `work/lbc-benchmark/output/comparison.png`, SHA-256 `9b42b4a571be31c72416debf1b88128578d4fd7ecd7b4fe09f660f1040b1d1de`.
- Fatih rejected the engine fidelity. Around second 8, image pixels remain square inside a rotated rounded card. Around seconds 15 and 21, rendered text exceeds its intended cards/rows and collides vertically. The CTA around second 27 remains readable but lacks the direct version's typography hierarchy and precise spacing.

The evidence is a failing visual baseline. Existing schema, deterministic-frame, publication, and offline checks remain valid for their technical scope; none proves that rendered content fits its declared visual intent.

### 11.2 Root-cause findings

| Finding | Severity | Evidence | Accepted correction | Delivery |
|---|---|---|---|---|
| VF-01 | High | Scene schema exposes frames and a few transforms but cannot express typography hierarchy, line limits, radius, stroke/shadow, or focal crop. | Add optional declarative appearance fields with profile/default resolution; keep schema-version-1 source readable. | M0.9.2 |
| VF-02 | High | Renderer applies one hard-coded text size/line-height/alignment and a fixed rectangle radius. Image wrappers do not inherit declared rounded geometry. | Resolve dedicated text/image/shape/group primitives from compiled appearance; clip media and motion to the declared mask. | M0.9.4 |
| VF-03 | High | Compiler validates declared boxes/safe zones, not loaded-font text dimensions or collisions. | Add renderer preflight and stable visual issue codes; fail instead of silently clipping or shrinking below profile minimum. | M0.9.5 |
| VF-04 | Medium | Absolute-only composition makes routine copy revisions fragile. | Add bounded stack/grid group layout with padding, gap, and alignment; retain absolute mode for art-directed cases. | M0.9.2/5 |
| VF-05 | Medium | Profile contains one font family and weights but no reusable display/heading/body/label scale or minimum-readable policy. | Put typography and appearance tokens in the profile, before engine rendering, so identity switching remains real. | M0.9.3 |
| VF-06 | Medium | Layer-local reveals/focus can still read as independent slide elements. | Permit semantic whole-scene/group focus with a focal anchor and one bounded transition addition only if benchmark evidence requires it. | M0.9.6 |
| VF-07 | Medium | The old roadmap deferred most visual growth to M2, after narration/accounting. | Insert M0.9 as a blocking visual foundation; M2 extends domain recipes instead of repairing baseline layout. | M0.9 gate |

### 11.3 External-reference disposition

The Remotion reference confirms that text fitting/measurement and transition sequencing can remain inside the existing renderer architecture. Use exact-version-matched `@remotion/layout-utils`; do not duplicate browser text metrics in core. Bang Motion's pinned snapshot `0f1bd1103835890354496d009af62885fe0a05d5` contributes composition practices—style brief before coding, shot rundown, one shot/one dominant statement, camera/world continuity, and keyframe screenshot review. That historical decision excluded adoption of its HTML/CDN runtime. Section 12 now explicitly permits adapting its proven artwork/composition/choreography mechanisms into trusted, versioned Remotion code. GSAP is not inherently non-deterministic; the excluded boundary is arbitrary executable project code and external render-time dependencies, not learning from its implementation.

### 11.4 Approved decision and proof boundary

Fatih approved the M0.9 corrective direction on 2026-09-14. The accepted approach is to expand the declarative profile/layer/layout contract and renderer preflight. A renderer-only patch was rejected as too brittle, while a custom TSX escape hatch was rejected because it would make revisions and agent operation project-specific.

The original failing baseline remains immutable. Earlier corrective build `16abeb583bc2-f524eec1-914` demonstrated masks, layout, and the structured failure probe. The subsequent reverified build `16abeb583bc2-086fdfc0-b9f` was accepted by Fatih on 2026-09-14; its exact hashes and runtime evidence are in `docs/plan.md`. M0.9 is closed for fidelity, not competitive visual storytelling. M0.10 has separate recorded acceptance on 2026-09-15. The new Medan reference creates the M2.4 quality gate without rewriting those historical decisions.

## 12. Medan reference and reference-first recovery — 2026-09-20

### 12.1 Evidence and limits

The owner supplied `/Users/fatih/Library/Application Support/Claude/scratch-workspaces/d7a0c6f6-fb10-42d3-b662-457b254dc122/82e2c454-2765-4050-94fe-593442565871/scratch-2026-09-19-cf811c/medan-explainer`. Its `index.html`, `README.md`, and `vo-script.md` were inspected; `vo.mp3` is present. Source inspection identifies ten narrative parts, 1080 × 1920, declared 67.5s, illustrated city/river/landmark/sea worlds, camera/parallax, world labels, Fraunces/Space Grotesk, path-following ships, numbers, and object/focus transitions. These are source observations, not playback proof or historical fact-checking. One-prompt production is owner-reported; original prompt, generation history, and exact effort are unavailable.

Main remains the recorded M2.3 baseline `7b232c9`. The unmerged M2.4.1 implementation `9747193` adds passive SVG, spans, and per-role fonts; describing current SVG as entirely unsupported is obsolete. Its 6.4s opening build `5d3b28594596-96b47423-ac5` exists and was rejected by Fatih. Technical additions do not establish safe SVG handling, correct rendered fonts, competitive visuals, or usability.

The previous handoff records reference hashes and audio probing: 66.576s audio versus 67.5s declared video. Silence intervals can agree numerically with scene starts without verifying phrase meaning or synchronization by listening. Keep the reference unchanged. Browser URL policy blocked local HTML playback; no bypass was attempted. An accessible MP4/recording is still needed for matched motion comparison. Bounded font/SVG recovery and static mapping may proceed, but do not invest in a full visual port or claim parity while this baseline is missing.

| Evidence class | What is established | What is not established |
|---|---|---|
| Source inspection | Existing shot replaces reference art/fonts and explicit choreography with different flat artwork and preset focus/reveal; street scale reaches about 1.06 and row about 1.0384 over 5.2s. Becak movement uses a long fade/reveal, not independent opaque travel and exit. | Exact perceived motion quality of the unwatched reference |
| Retained NaraFrame frames/contact sheet | Weak illustrated identity/framing and a label appearing serif rather than the intended mono; owner rejected the result | Every-frame safety or an independently measured browser font diagnosis |
| Font loading source | Bundled font loading is in `calculateMetadata`, not established in actual frame render contexts. Remotion documents metadata execution in a separate tab. | A passed measurement mock does not prove rendered face/weight readiness |
| Read-only sanitizer probes | Root `fill` was discarded; SVG `text` content disappeared while accepted; `fill="url(https://example.invalid/paint.svg#g)"` survived validation. No network request was made. | Existing safe/unsafe tests do not prove the accepted SVG subset safe or visually faithful |
| Implementer test report | Handoff reports 175 unit, 231 integration, and serial E2E 7/7 passing for the first attempt | Supervisor did not rerun those suites in this documentation revision; they did not prevent owner rejection or the newly identified defects |
| Workflow/usage evidence | Schema discovery returned 58,501 bytes containing seven schemas in the prior review. Owner reports tens of thousands of tokens and excessive effort. | Bytes are not tokens; precise model usage, total cost, and comparative savings are unavailable |

The rejected MP4 reused previously rendered pixels from build `5d3b28594596-c69d1338-b68`; a near-zero reuse/report duration is not a fresh-render benchmark. Preserve the first attempt, its revisions, and measured versus reported evidence separately.

### 12.2 Findings and accepted disposition

| Finding | Evidence / risk | Accepted correction | Delivery and state |
|---|---|---|---|
| VS-01 — High | Prior policy excluded expressive competition; technical success was mistaken for visual progress | Competitive output judged by Fatih; aesthetic rules advisory unless intentionally locked | NF-PR-09, NF-AC-16; policy changed, visual gate open |
| VS-02 — High | SVG/spans/fonts exist partially, but fidelity and font readiness are defective | Preserve or explicitly reject supported SVG semantics; prove actual rendered role fonts and spans | M2.4.1 recovery; not verified |
| VS-03 — High | Flat groups/preset focus cannot reproduce coherent camera/world/overlay choreography | Bring the minimum nested/world/camera/opaque-object motion needed by the opening into its vertical slice; extend reusable framing in river history | M2.4.1/3; not verified |
| VS-04 — High | Reveal/focus presets are not a substitute for explanatory route/data/object movement | Add only story-required semantic motion and frame-derived choreography | M2.4.3/4; pending |
| VS-05 — High | New illustrated data must stay editable; unknown media-style bindings can masquerade as compatible | Source-only plain-language edits, explicit binding review/replacement, dependency-aware reuse and undo | M2.4.2 early proof and M2.4.5 close-out |
| VS-06 — High | Generalisation was deferred until after a complete 67.5s benchmark | Freeze runtime/skill immediately after opening acceptance and test distinct 6–10s LBC before extending Medan | NF-AC-17; M2.4.2, then full trial M2.4.5 |
| VS-07 — Medium | Headers said not started while handoff said ready and owner had rejected it | Current status CHANGES_REQUESTED; preserve first attempt as historical evidence, not active approval | This documentation correction; runtime recovery open |
| VS-08 — High | Recreating inferior art and building a broad schema first discarded advantages of the working reference | Controlled reference-fidelity adaptation before original redesign or wider abstractions | NF-PR-10; M2.4.1 |
| VS-09 — High | Accepted SVG loses visual meaning and permits a wrapped external paint URL | Reject all forbidden external forms; preserve permitted root paint/text/local gradients/clips or fail explicitly; add regressions | M2.4.1 technical recovery before acceptance |
| VS-10 — High | CLI-heavy context and late user review spend effort before proving design | Select relevant contracts, reusable working patterns, one frame and short motion checkpoint, at most two internal correction passes per checkpoint before reporting | Skill changes during M2.4.1 execution; output-first owner loop |
| VS-11 — Medium | Development tokens, authoring effort, rendering and owner actions are mixed together | Lightweight separate records; actual usage only where host/provider evidence exists; unavailable is not zero | NF-CO-02; all M2.4 tasks |

### 12.3 Approved architecture and transferable lessons

Retain core + trusted Remotion renderer and editable declarative project data. The owner has approved reference-first recovery, not a switch to executable projects. Adapt working visual mechanisms into reusable, versioned renderer components/recipes with source provenance; artwork, object IDs, text, framing, timing, and profile choices remain data. Do not load the reference HTML/GSAP player, embed arbitrary project TSX/JS, flatten the reference into a backdrop/video, or introduce Medan-specific conditionals.

For the first controlled comparison, retain the reference's identifiable artwork, type hierarchy, framing and choreography as closely as permitted by asset rights and offline availability. Record necessary conversions/substitutions. This is a fidelity experiment, not a claim of original design. Do not choose new inferior artwork merely to appear different. If the contract cannot represent the required shot without a major expansion, stop with the exact gap and request a scoped decision rather than quietly downgrading the visual.

A minimum coherent illustrated shot takes precedence over a universal schema. Add camera/world/object motion in M2.4.1 if needed to reproduce that shot; move later capability work only when a story actually needs it. GUI compatibility requires structured editable decisions, not an exhaustive animation language today.

| Reference | Transfer into NaraFrame | Do not adopt blindly |
|---|---|---|
| [Bang Motion skill](https://github.com/bangtutorial/bang-motion/blob/main/SKILL.md) | Concrete art direction and a short create–inspect–correct loop | Prompt length or mandatory style prescriptions as a quality guarantee |
| [Working explainer starter](https://github.com/bangtutorial/bang-motion/blob/main/assets/starter-explainer.html) | A functioning camera/world/object foundation; inspect actual mechanisms before rebuilding them | Its executable HTML/CDN runtime as project input |
| [Architecture](https://github.com/bangtutorial/bang-motion/blob/main/references/architecture.md) and [explainer guidance](https://github.com/bangtutorial/bang-motion/blob/main/references/explainer.md) | Frame/time-derived poses, spatial continuity, statement-to-object-action mapping, early frame verification | A fixed sequence of scenes for unrelated topics |
| [Anti-slide guidance](https://github.com/bangtutorial/bang-motion/blob/main/references/anti-ppt.md) | Slow image scale plus card entry is not automatically explanatory motion | Universal density/movement quotas that override story needs |
| [Remotion metadata lifecycle](https://www.remotion.dev/docs/calculate-metadata) | Ensure fonts are ready in actual render contexts as well as measurement | Assuming metadata-tab loading guarantees font availability in frame tabs |

The earlier source snapshot `0f1bd1103835890354496d009af62885fe0a05d5` remains historical. Moving upstream links are references, not a reproducible pin: record the exact revision and applicable licenses when adapting code/assets. No ownership or redistribution rights are inferred merely from a local file. Reuse existing local assets first, no new paid generation by default, and keep Remotion dependencies out of core. Local schematic maps are sufficient; GUI, hosted maps, general 3D, silent final export and unrelated billing infrastructure stay excluded.

### 12.4 Acceptance, economy and handoff

M2.4.1 first repairs bounded SVG/font blockers with proportionate regression checks. Then inspect a matched keyframe and 2–3s motion study before a 6–10s public-CLI opening. At most two internal visual correction passes per checkpoint, then present the result or precise blocker; do not expand the engine indefinitely before Fatih sees it. The opening gate requires no worse relevant dimensions against the accessible reference segment, including within-shot continuity. It does not yet require the final video's two improved dimensions.

M2.4.2 freezes compiler, renderer, schema, CLI, trusted recipes and skill before a fresh one-brief LBC 6–10s opening. Only project/profile/source data may change. Preserve first draft before feedback; prove headline and slower-camera revisions plus undo. Fatih must judge the distinct direction worth developing. Failure blocks longer Medan work; a runtime patch invalidates the trial and requires an explicit correction/retrial record.

After story extension, NF-AC-16 still requires full Medan to be no worse in composition/typography, illustration, motion, continuity and explanation, and better in at least two, judged by Fatih with matched scene/time evidence. M2.4.5 freezes the then-current engine again for a 30s LBC first-full-draft and four ordinary revisions. Preserve early versus final trial records; rerun early LBC regression if intervening engine work changed runtime. NF-AC-17 remains a publication-candidate assessment plus no user coding for revisions.

Each feature follows real path → visible output/manual acceptance → focused tests → integration, with bounded safety regressions when fixing known defects. Record development versus content-authoring effort, owner versus agent actions, rendering/verification time, internal versus owner corrections, reuse/provider calls, and available actual input/output/cached-token and cost evidence. Do not add a telemetry service or claim cheaper/faster before matched measurements exist.

The active handoff and all checklists live in `docs/plan.md`. There is one writer at a time; READY_FOR_REVIEW means the implementer stops, not that review automatically happens. Supervisor technical readiness is not owner visual approval or merge authorization. The planning-only pass below has since been followed by owner-authorised supervisor recovery on 2026-09-21: technical follow-ups and one static reference-fidelity frame, awaiting owner review. The rejected output remains rejected; no integration or motion acceptance is implied.

**2026-09-21 evidence update.** The owner supplied an 8.9-second recording; 18 sampled frames and an opening still now establish the reference's visual composition and city-to-newspaper sequence, not full-speed or full-story motion acceptance. Fatih accepted static build `756b6958b781-13491d1f-243`, which retains separate passive SVG layers, native editable text, and local Fraunces/Space Grotesk. Subsequent build `67cb9fb19695-51ffa299-f9b` is a 3-second motion study through the public CLI: explicit camera, world-plane parallax, fixed overlays and sequential opaque object transforms, with shared preflight geometry and 60 passing focused tests. Motion direction awaits owner review. Nested compositions, full opening, phrase synchronization, skill generalisation and integration are still open. Contrast analysis still does not understand the SVG road-sign backdrop; warnings and the right-hand label's safe-zone warning remain visible. This is supervised reference adaptation, not proof of cheap one-prompt design or benchmark superiority. Exact evidence lives in `docs/plan.md`; earlier playback-unavailable and planning-only statements are historical.

## 13. Profile-first production audit and direction — 2026-10-04

### 13.1 Positioning and evidence boundary

NaraFrame is a local, profile-driven production system for repeatedly making strong, revisable vertical videos across brands. Its advantage must be demonstrated through usable output, brand isolation and less repeated work, not inferred from schema or test totals. User flow: choose profile → brief/assets/audio mode → agent authors and validates → preview/revise → approve final. Posting is separate.

This audit inspected the local generators and renderer/compiler/profile contracts, result JSON and report, and played the three TutorLog MP4s in QuickTime with seek/replay observations. This establishes selected motion/transition observations, not continuous frame-by-frame certification or owner approval. The owner's Bang Motion preference is an accepted judgement for this benchmark only. Reported decode/audio/timing measurements were read, not rerun. No current upstream repository, provider pricing or license eligibility was revalidated; inspect the pinned code/rights before adaptation or redistribution.

Local baseline: `8463764`, branch `m3-1b-audio-delay`. The uncommitted M3.1-B/B1 PCM-to-final-MP4 correction, engine `/11`, tests and evidence remain intact. The handoff records 0–4 ms boundary error, verify 274/280 and serial E2E 15/15; these are earlier checkpoint results, not fresh audit runs. Integrate or explicitly disposition that checkpoint before changing rendering. Preserve unrelated `AGENTS.md`, Miss Ayu worktree, old stash and failed attempts. This revision authorizes documents only, not Git integration. Update 2026-10-04: integrated separately through M3.P0 via PR #24 (`b1875e2`) with Fatih's Git authority; no runtime changed in this documentation.

### 13.2 TutorLog complaint audit

The shared brief is 20 s / 600 frames, native 1080×1920 / 30, official logo/UI/fonts and the same prepared music, without voice. The reported Bang Motion and Hyperframe outputs are native finals; NaraFrame build `7ee7990e9d70-3e8893e1-14e` is a 540×960 draft. Final JSON rejects the same source with `NARRATION_REQUIRED`. A 540 draft cannot establish native-final parity even when it decodes correctly.

| Finding | Evidence/classification | Disposition |
|---|---|---|
| Asset/background separation is weak | Generator uses pale assets/backgrounds with little separating treatment; playback confirms flat separation. Bang uses deliberate white panels, outlines/shadows and overlapping handoffs. Mainly art direction, not absence of layers. | Require visible separation in pilot; do not add a primitive just to fix palette/staging. |
| Framing is unnecessarily static | All Nara benchmark images use `contain`; existing raster `cover`/`focalPoint` are unused. Renderer SVG uses centered `preserveAspectRatio` and does not apply the focal point. Source has no complete crop/inner-framing contract. | Demonstrate non-destructive framing. Distinguish raster authoring from the SVG discrepancy; reproduce any SVG correction separately if the pilot needs it. |
| Type hierarchy/color is shallow | Benchmark uses uniform text color, no rich-text spans. Renderer already supports per-layer colors and accent spans. | Improve composition/typography using existing facilities or selected recipe; not a new color engine. |
| Assets feel static | Focus is subtle and shots largely reset. Existing groups/camera/transforms can move objects; a screenshot does not expose its internal UI as independent parts. Bang generator stages rotation/perspective and overlapping object exits/entries. | Stage purposeful object motion. Layer/prepare assets only where explanation needs it; do not claim bitmap travel animates internal content. |
| Narration blocks music final | `production.ts` defaults `requireNarration` true. Profile voice-style text cannot override that rule. Soundtrack-only preview now works after PR #19. | Explicit audio mode/clock and readiness, with native music-only/silent finals. Required missing voice must still fail. |
| Preview cannot judge final-size detail | Project schema fixes draft to 540×960. Invoice source is itself only 414×290. | Add native preview; document source-detail limits, never imply larger canvas invents sharper UI. |
| Fonts impose avoidable authoring work | Report aliases the same Source Serif 4 font; preflight font checks use unquoted names while render checks quote them. | Candidate bounded defect, not proven by a new runtime repro here. Fix only if reproduced/needed, not by renaming every future brand font. |

Source locations: `packages/core/src/schema/{project,scene,profile}.ts`, `compiler/production.ts`, `packages/renderer-remotion/src/{visual-preflight.ts,remotion/draft-video.tsx}`; benchmark generators/results under `work/tutorlog-promo/`. Current profiles already pin local fonts/PNG assets and direction. Semantic audience, CTA, asset roles and audio defaults are the missing usable brand contract, not an absence of all profile infrastructure.

Observed source/playback lessons from Bang Motion: accent headline words, contrasting surfaces, intentional framing, perspective/object travel and overlapping shot handoffs. Its local workflow is HTML/GSAP plus frame capture/FFmpeg, not an independent rendering engine or a proof that arbitrary one-prompt work always wins. Hyperframe provides another native-quality output, not a reason to add a third backend. Do not use either reference video as a flattened backdrop and call that authoring.

### 13.3 Alternatives and decision

| Route | Benefit | Risk / decision |
|---|---|---|
| Extend the declarative engine alone | Existing validation, editable objects and compatibility | High schema/primitive churn; more capabilities may still yield poor art direction. Retain for suitable content, but stop universal expansion as the default route. |
| Production layer + parameterized expressive compositions | Keep profile/assets/revisions/audio/artifacts while exposing mature Remotion composition; technical details handled by agent | Trusted-code safety, recipe interfaces, hashing and honest validation scope need work. **Recommended first pilot**, using installed Remotion 4.0.521, not a rewrite or finished solution. |
| Adopt the available Bang Motion authoring/export route | Proven local quality reference and simpler expressive authoring | Must still bridge brand/revision/audio/export metadata and inspect code/asset rights. Different runtime/security assumptions; current capture flags are not a reusable safety policy. Fallback if the bounded Remotion pilot underperforms or needs excessive engine work. |

Choose one production route after the pilot. Do not build renderer-neutral plugin architecture, upgrade dependencies for the experiment, or port the reference workflow wholesale before testing. Remotion use alone does not guarantee good design. Composition code may contain frame keyframes, CSS transforms and perspective; that is a bounded authoring escape hatch, not a general 3D engine.

### 13.4 Contract disposition

| Retain | Revise | Defer / stop as default |
|---|---|---|
| Pinned profiles, local assets/provenance, immutable revisions, atomic publication, voice/media correctness, cache dependencies, declarative v1 support | Explicit audio mode and timing; native preview; brand/recipe/episode split; parameter/code revisions with dependency hashes; validation coverage per authoring route | GUI/cloud/provider marketplace; universal motion expansion; arbitrary-code GUI promises; simultaneous alternate backends |
| Historical evidence, failed output, owner approvals within their scope | Final readiness must not require voice for explicitly timed music/silent projects; capability registry advertises only proven paths | Further Medan polish as an automatic next step; old checklist/gate text does not override plan section 0 |

Trusted local composition is executable code, unlike passive SVG. NF-AU-01 requires explicit approval, pinned local imports, offline rendering, frame/seed evaluation, dependency/code hashes and revision preservation. No package install, shell/provider operation or secret access in compositions. Review/import restrictions and blocked network do not constitute a secure sandbox; no public untrusted-code service is promised. Declared parameters remain data-editable; opaque internals need agent code revision and review. Validation must say which schema, text/layout and runtime checks were actually applied; no inherited claim that every declarative preflight works on TSX.

### 13.5 Production proof and stop conditions

The next gates are NF-AC-18 (native audio routes/preview), NF-AC-19 (same-brief TutorLog route pilot) and NF-AC-20 (three LBC episodes + compatible profile switch). Historical D-VIS/NF-AC-16/17 remain unpassed; new output is not a retrospective acceptance of Medan. Existing word-level enforcement, repeatability, hard-kill orphans and reuse-report gaps retain their open status.

Pilot checkpoints: one 3–5 s motion/framing study, then the 20 s final. Maximum two internal correction passes per checkpoint; preserve first drafts and failed attempts. Stop and ask for route selection if Fatih still rejects the result, composition authoring requires repeated engine patches, or managed integration becomes a framework project. Do not keep adding primitives hoping for visual quality. A fallback is a separate approved task, not an automatic simultaneous implementation.

During the three-episode trial freeze engine, CLI, skill and shared recipes; episode content/parameters and intentional choreography reuse are allowed. A needed shared-code patch fails that trial and starts a separately reviewed task/freeze, rather than silently changing the denominator. Measure active operator time, elapsed authoring, render/review effort, corrections, actual asset/audio reuse and available provider/token charges separately. Unknown time/cost remains unknown. Existing reported render times (Bang 61.28 s, Hyperframe 32.078 s, Nara 42.274 s) have different boundaries/resolutions and cannot support a faster/cheaper claim.

**Execution/handoff:** plan section 0 is authoritative. First preserve/integrate the audio checkpoint only after explicit Git permission; then prove native outputs before authoring-route and repeated-brand trials. This document recommends an approach and defines future acceptance; it does not claim those paths are implemented or accepted.
