# NaraFrame — Production Findings and Decisions

Updated 2026-11-07 · Section 11 records the Visual Library and Studio research

This document explains the next development priorities. [spec.md](spec.md) defines the contract; [plan.md](plan.md) owns numbered tasks. The prior discovery, decision history, and local Batch F closure are preserved in [history](history/README.md).

## 1. What production taught us

Batch 1 evidence: the old skill produced a valid but generic feedback-card shot and required repeated large-schema reads. The updated skill/reference gives six editable explanatory structures; a fresh author made a progress→feedback→practice diagram and ordinary headline/camera revisions without renderer reads. This is one authoring trial with saved first output, not a visual-quality or cost guarantee. Fatih accepted it as authoring evidence and confirmed caption behavior on 2026-10-14. He then authorized committing and cherry-picking successive batches while main stays unchanged; full E2E is deferred to MVP 2 closure, and expensive actions require confirmation.

The caption candidate demonstrates none/selected/full at 540/1080 with unchanged imported voice, verified boundaries and undo/reuse. Raw crop hash equality was too strong for separately encoded MP4s: inactive-cue differences were tiny while visible-cue differences were substantial. The original failed audit is retained. Frame-window review also found a real 1ms full/scoped boundary defect; shared global rounding/clipping and same/cross-block regressions correct it. Gate results and provenance belong in plan's consolidated handoff.

M4.3's bounded old-skill baseline found guidance for copied patterns, profile pins, framing and undo, but not source-pixel ROI/padding, named prop anchors, pose variants, or catalog dependency pins. That baseline did not author or render an episode; its ambient package-manager probe failed before CLI help/schema. The new model therefore pairs a focused library guide with public inspect/stage commands, pinned ordinary scene expansion, and opt-in PNG crop geometry. This is an authoring contract, not a second motion runtime or an automatic character rig. Its first preview attempt failed before frames: a core root import pulled server modules into the browser bundle. A browser-safe placement subpath fixed it, the failed attempt is retained, and a bundle test protects it; the following previews rendered.

The engine can protect a project and produce a valid MP4 without producing a compelling explanation. Production friction also comes from weak authoring instructions, missing reusable artwork metadata, and workflows that repeatedly rediscover the same technique.

M4.4 adds a public capture/stage receipt rather than replacing the narration clock. Human listening confirmation binds the existing master/cues; pending alignment stays draft-only. Series identity is ordinary pinned library data, with intro overlaid and sign-off inside the explicit trailing hold. A fresh author used only skill/public interfaces; its known voice-style mismatch on a different profile remained visible instead of being silently certified. One fixture's full/scoped frames matched, audio lag measured zero, and caption undo reused the original MP4. These establish the bounded preparation/identity path, not publication, a new TTS service or general style compatibility. Plan records source review, gate provenance and the pending M4.5 handoff.

Before proposing an engine primitive, classify the problem:

1. **Skill:** can better story mapping, framing, choreography, or revision guidance solve it using available capabilities?
2. **Profile:** is it a series/brand preference rather than a universal rule?
3. **Library or asset:** would a versioned pattern, ROI, focal point, or attachment anchor avoid rebuilding it?
4. **Workflow/contract:** is authority, pinning, timing, or revision scope missing?
5. **Defect:** does existing behavior violate its documented contract?
6. **Missing engine capability:** only after the first five, what minimum reusable capability is necessary?

The production input is [Bang Nalar's findings](</Users/fatih/Code/Bang Nalar/docs/production/naraframe-next.md>), reviewed on 2026-10-13. Its scene rules, dimensions, caption positions, and pacing describe that series; they do not become NaraFrame defaults for every brand.

## 2. Adopted priorities

| Production need | Why it belongs | Where it is recorded |
|---|---|---|
| Narrative → visual beat, hero object, framing, and shot relationship | Agent authoring is a product surface. Better instructions can improve results without new primitives. | M4.1, skill + examples |
| Motion vocabulary and purposeful variation | Repeated card zooms flatten the story. Reuse should preserve intent, not impose an entrance on every shot. | M4.1, skill/library |
| Caption none/selected/full separate from narration | Zero-width or displaced captions leave scrims/layout and misleading QA. A first-class policy is needed. | M4.2, skill/profile/engine |
| Profile caption styling and layout | Caption design needs explicit defaults and overrides, not renderer hacks or global Bang Nalar values. | M4.2 |
| Library-first patterns and pinned imports | Repeated production should edit accepted structures instead of copying ad hoc code every time. | M4.3 |
| Asset viewport/ROI/focal metadata | Padding and inconsistent subjects make substitution expensive. Metadata should identify usable pixels and a deliberate crop. | M4.3 |
| Pose/prop anchors | Reusable characters and props need explicit attachment points; no promise of automatic anatomy detection. | M4.3 |
| Prepared audio and verified timing | Keep accepted takes and masters; import alignment with traceable provenance and listening checks. | M4.4 |
| Series intro/signature/sign-off with recorded overrides | Identity is reusable but not compulsory for every episode. Timing changes must be explicit. | M4.4 |
| Cheap checkpoints and motion QA | Inspect a useful shot before repeated full renders; distinguish source, runtime, and visual evidence. | M4.5 |
| Editorial sources, claims, and packaging | A valid video is not publication-ready. Sources, rights, cover, and delivery files belong to the production handoff. | M4.5 |
| Cross-profile frozen trial | Prove the skill/library works beyond one tailored episode, including revisions and undo/reuse. | M4.5 |

These are development tasks, not capabilities to add to the registry during documentation cleanup.

### Deferred or not adopted

Spring, repeater, continuity primitives, animated masks, video layers, and native word-level motion remain later backlog. Each needs a real production case and a bounded feature proposal; none blocks MVP 2 by default. Additional data-format primitives and generalized QA also need demand, rather than inclusion merely because another tool has them.

Rejected as product rules:

- Following a catalog's mutable `current` entry automatically. Imported dependencies must be pinned/snapshotted; updates are explicit revisions.
- Making Bang Nalar's safe rectangle, caption font/position, realistic-art preference, motion density, or intro length global requirements.
- Fixing captions with invisible glyphs or off-canvas UI instead of a supported policy.
- Claiming arbitrary recipe code is sandboxed, or that generic recipe text/collision/contrast is fully checked.
- Adding GUI, 3D/map services, hosting, new generation providers, or social auto-posting to this insertion.
- Claiming speed, lower cost, or visual parity from an architecture diagram or green tests.

## 3. Lessons from Hyperframe Pro

[Hyperframe Pro's authoring skill](https://github.com/buildwithhanif/hyperframe-pro/blob/main/plugins/hyperframe-pro/skills/hyperframe-pro/SKILL.md) and [beat guidance](https://github.com/buildwithhanif/hyperframe-pro/blob/main/plugins/hyperframe-pro/skills/hyperframe-pro-beats/SKILL.md) were examined as source references on 2026-10-13. This is source inspection, not a NaraFrame playback benchmark; the links are references, not pinned dependencies.

Useful transferable practices:

- Give each beat an explanatory job and a main object before choosing an effect.
- Treat framing, text hierarchy, motion, and transitions as one authored composition.
- Offer concrete editable patterns and cheap inspection/revision paths.
- Keep generated output traceable to editable source and parameters.

The lesson is not that Markdown renders video by itself. Hyperframe Pro relies on its runtime/helpers. NaraFrame should improve skill, library, and runtime together, translating only the useful procedures into its own supported contracts. It should not import a different runtime, copy an unverified design mandate, or assume redistribution rights for reference assets/code.

## 4. Current evidence, not a new gate run

| Integrated work | Evidence scope and limit |
|---|---|
| M0–M2 | Declarative authoring, integrity, preview/edit/undo/export foundations; M2 closed technically. Competitive visual/publication gates remained deferred. |
| M3.P0 | Audio encoding correction and real narrated export, preserving failed checkpoints and measurements. |
| Batch A | Audio-mode intent and native 1080 preview; parameterized Remotion route accepted technically, not as Bang Motion parity. |
| Batch B | Owner-trusted recipes, exact-byte staging, trust concurrency, profile brand binding. Trusted code is not a sandbox. |
| Batch C/D | Three LBC episodes accepted internally; final audits and operating guide. Public photo rights and other register gaps remain open. |
| Batch E | Explicit recipe identity/palette bindings; checks do not cover undeclared parameters or arbitrary claims. |
| Batch F | Opt-in recipe text fit, browser-backed whitespace evidence, slot-scoped cache invalidation. |

Batch F's final implementation record reports verify 297 unit / 335 integration and serial E2E 23/23. These are historical implementation results, not tests rerun for this cleanup. The exact old records and supervisor evidence are retained in the [snapshot plan](history/2026-10-13/plan.md).

## 5. Prioritized closure register

The [milestone closure audit and required queue](plan.md#milestone-closure-audit--2026-11-05) is the canonical current disposition. Fatih first authorized priority triage on 2026-11-05, then narrowed it to the NaraFrame product being carried forward. Twenty of the 27 audited rows are administratively closed. Seven retained rows are consolidated into these five task IDs.

- M2.R1 makes a real CLI failure diagnosable.
- M3.R1 proves branded visual revisions preserve accepted voice media and reuse identity.
- M3.R2 proves current source, preview, approval, dependencies and final output agree.
- M4.R1 proves the documented engine/skill installation can reach a first preview under the supported minimum runtime and one explicitly invoked installed host route.
- M4.R2 reconciles the existing M4 closure checklist with receipts and the authorized scope decisions.

Dedicated SIGKILL descendant forensics, historical harness/timeout reconstruction, native word-level enforcement, standalone repeat-render benchmarking and automatic/cross-host skill activation are closed from the initial W queue. Existing supported graceful interruption, feature regressions, raw failure logs, frame integrity and source/approval checks retain their normal duties.

Historical comparison/publication tasks and optional primitive/QA expansion remain retired or archived. Accepted recipe/contrast/revision limits stay documented. Historical missing evidence and measurements remain missing or unknown. Administrative closure grants no new visual verdict, corrected claim, media rights or publication permission.

The [M4.R2 reconciliation](plan.md#m4r2-closure-reconciliation-2026-11-06) records evidenced closure of the five retained tasks. Fatih authorized resuming M5.1 on 2026-11-06. Its [closure verification](plan.md#closure-verification-2026-11-06) records the passed gates and owner approval for the M5.1 example.

## 6. Delivery and review policy

Use FDD: model a feature and its exact acceptance → implement the public path → show output/manual acceptance → add focused regression coverage → run integration checks. Skill/library work needs a fresh-context authoring trial, not just Markdown lint.

Save first drafts before owner feedback. Prefer stills/contact sheets or a representative scoped shot before a full render. Limit planned internal correction passes to two; report remaining issues instead of starting indefinite polish. A frozen trial never patches code, profile, recipe, or asset dependencies silently; record a failed attempt and create a new approved freeze if necessary.

M4 has three consolidated execution/review batches: M4.1–M4.2, M4.3, M4.4–M4.5. Internal steps do not need owner relay one by one. Fatih's 2026-10-14 instruction defers E2E to MVP 2 closure; development uses the authorized output path and focused checks, with expensive work confirmed first. Successive branches carry predecessor commits by cherry-pick while main stays untouched. Paid calls, recipe trust, visual acceptance, publication, and final main integration keep their separate authority boundaries.

## 7. Cleanup decision

The 2026-10-13 cleanup retains engine, skill, runtime, tests, fixtures, profiles, both Krakatau samples, and an English product README. Production studies and gate artifacts move outside the repository with a verified checksum index; cache goes to recoverable Trash. `.git`, unrelated `AGENTS.md`, linked worktree, stash, and old branches are preserved.

Historical documents are exact snapshots, including the previously uncommitted Batch F closure. Active documents are now concise source-of-truth documents; discovery is historical. This cleanup supplies planning evidence and workspace organization only, not new product capabilities or M4 execution approval.

## 8. Distribution discovery — 2026-10-15

Fatih wants NaraFrame usable as skill + engine in Claude and Codex, and independently of both. This is now current MVP 2 scope under M4.5, not a parallel roadmap or a new motion feature.

**Discovery baseline:** all workspace packages were `private: true`, version `0.0.0`, and CLI dependencies used `workspace:*`. Profiles resolved relative to the checkout layout; the renderer expected package-local React/Remotion. Doctor defaults include macOS/Homebrew paths. README previously documented source installation and skill symlinks. No repository LICENSE file exists. Those were packaging/rights gaps, not evidence that rendering needed an agent.

**Implemented local candidate — 2026-10-15:** `pack-engine.mjs` captures pinned runtime packages as real files, with neutral resources and rights/content metadata. The macOS arm64 0.1.0 archive installs offline with an empty npm cache; it is private/UNLICENSED and unpublished. CLI version metadata now includes an installation fingerprint of NaraFrame built modules/resources and dependency pins. This detects same-version drift for the skill launcher; it is not a sandbox or full third-party binary attestation. The canonical installer copies both host layouts safely, with a receipt and explicit update/removal. Actual local consumer commands and a four-second draft succeeded outside the source checkout. Real host activation, installed recipe/pixel equivalence and final production trial remain distinct evidence gaps. Plan retains the sandbox-port failure and timeout gate provenance rather than treating them as successful runs.

The actual compiled CLI was invoked from `/private/tmp`, outside the repository: `doctor --json` returned ready and `create /private/tmp/naraframe-standalone-Dz7BLa/episode --profile current-issues --json` created a source skeleton without an agent, download or render. These commands still used the existing checkout's packages/resources. They prove cwd-independent invocation on this host, not clean-machine package installation, cross-platform support or a standalone final video.

**Alternatives:** retain source checkout plus manually linked skill (lowest implementation cost, more setup burden); distribute a versioned CLI artifact plus the canonical skill and host install adapters (recommended); build a hosted MCP service/GUI (substantially larger product and operational scope, deferred). Local host plugin manifests can improve discovery, but the engine stays usable without a host/plugin.

**Chosen preparation:** plan the installable CLI and canonical skill bundle as one M4.5 work package. Ship resources through an explicit allowlist; resolve them from the installed artifact rather than current working directory or development fixtures. Verify a consumer install outside the source checkout. Keep machine tools/prerequisites explicit, version upgrades visible, and recipe trust/approval untouched. README leads with recurring editable production and offers agent and terminal routes. Avoid public install commands or availability claims until the named artifact exists and is verified.

Official references inspected on 2026-10-15:

- [Codex skill locations and invocation](https://learn.chatgpt.com/docs/build-skills): user/repository `.agents/skills`, symlink support, complete folder resources, optional plugin distribution.
- [Claude Code skills](https://code.claude.com/docs/en/skills): personal `~/.claude/skills`, project `.claude/skills`, local invocation and symlink support; personal local files do not automatically reach cloud sessions.
- [OpenAI plugin packaging](https://developers.openai.com/plugins/build/plugins): portable/root and compatibility manifest options; installing a local skill is distinct from public directory submission.
- [npm package contents and executable mapping](https://docs.npmjs.com/cli/v11/configuring-npm/package-json/): explicit `files` and `bin` contracts. Declaring a bin alone does not resolve private workspace dependencies or include runtime resources.

**Cleanup order:** preserve MVP 2 drafts, failures, receipts, snapshots and gate logs until final acceptance. Then archive regenerated scratch/cache with a checksum/location index and a restore path before moving the original to recoverable Trash. Keep maintained library/skill examples and test fixtures in source. Package only approved runtime/demo resources; exclude owner media, internal production studies, personal config, secrets and generated output. No public code/media license is selected on Fatih's behalf. npm publication, public release and marketplace submission require separate authorization.

## 9. Profile composition quality — production feedback, 2026-10-26

**Disposition: adopt for planning as M5.1, a next-MVP candidate.** The owner wants different agents to respect a series' composition requirements. All four requested rules belong in NaraFrame when they are opt-in profile policies supported by skill guidance and reusable examples. MVP 2 stays integrated; this entry authorizes documentation only.

The baseline inspected here is main `23ca490` (engine 0.1.2). Evidence is source inspection of profile/scene schemas, variety checks, issue handling, frame-derived motion, image placement, preflight and the canonical skill. No reproduction render, test suite or visual benchmark was run for this assessment.

### Corrections to the starting assumptions

- Some current warnings already can block: `render.variety.severity` accepts `warning` or `error`, but it applies to that policy as a whole rather than independently per rule/stage (`packages/core/src/schema/profile.ts`, `packages/core/src/compiler/variety.ts`). The gap is finer policy control and the four measurements, not the complete absence of enforcement.
- `VIEWPOINT_STATIC` currently treats a `focus` beat as a viewpoint change and ignores explicit `scene.camera.moves`. A focus transforms its target; a real camera only affects applicable world content. Neither the field's presence nor a scheduled no-op proves visible movement. Reconcile the old heuristic when the new policy is enabled.
- `SINGLE_TRANSITION_TYPE` looks at declared scene transitions, including the final unused one. Consecutive-cut checks must count actual boundaries. `MOTION_REPETITION` measures repeated entrances, which is different from inactivity.
- `PANEL_DEAD_SPACE` measures unused space in content-holding panels. Image ROI/padding and crop/fit frames are authoring geometry, not measured painted bounds or subject detection. None can substitute for the proposed hero-size check.
- Preflight's `scene-settled` sample is a quarter of the scene duration. It need not be settled. New checkpoints must account for concurrent beats, camera movement and transition windows, using the renderer's actual frame rounding.

### Adopted work and why

| Feedback | Decision and reason | Skill/library work | Engine/profile work |
|---|---|---|---|
| Title and hero visible at t=0 | Adopt. An empty opening can be technically valid while failing the intended cover. | Compose the first frame before staging entrances; provide an editable opening pattern. | Optional semantic targets and first-frame visibility checks, with explicit coverage limits. |
| Maximum inactive interval | Adopt with bounded reading holds. A long unintended pause is measurable; continuous motion is not always useful. | Map explanatory changes to beats, plan reading time and document each exception. | Union effective visible-change windows over the full timeline; subtract only declared holds and report raw/exempt/remaining gaps. |
| Camera movement and optional cut limit | Adopt per profile. Series may prefer reframing, while comparison/reading shots can deliberately stay still. | Explain what the camera reveals; author a valid static alternative without adding decorative movement to clear a check. | Check effective projected movement, explicit static exceptions and real cut boundaries; consolidate overlapping old issues. |
| Minimum hero size | Adopt with a defined painted-bounds metric. A large frame around a tiny padded asset does not give the main object enough presence. | Identify hero parts, crop intentionally and choose settled states; preserve the choice in library parameters. | Measure safe-area-clipped painted bounds after transforms, mask/crop, camera and visibility; expose uncertainty instead of a false pass. |

### Refinements and limits

The proposed hero ratio is the area of the geometric union of each hero part's painted bounding rectangle clipped to the safe rectangle, divided by safe area. Overlaps count once; a single enclosing box around widely separated parts is insufficient. This is a footprint metric, not filled-pixel area: a thin ring can still have a large bounding rectangle. Exclude background/panel layers and shadows from designated hero parts. A photo's alpha/crop footprint includes its opaque background; it does not measure the person or object inside it. A subject-specific check needs prepared mask/crop geometry that isolates that subject, otherwise its coverage is unverified. Actual pixel-density analysis and automatic photo-subject segmentation are outside this proposal.

Unknown transparency, complete occlusion and arbitrary recipe internals need honest coverage. A raw PNG frame, SVG viewBox, ROI receipt or recipe-provided rectangle is not measured paint. Establish supported measurement cases in the feature model; label the rest unverified. An error-level rule cannot be satisfied by unverified content at the enforcement stage. Metadata and manual review do not prove arbitrary trusted code uses the declared geometry.

The skill is part of acceptance: a fresh author must produce an opening, explanatory motion, an explicitly justified quiet hold and deliberate hero framing from public interfaces, then repair a reported issue and undo the revision. Activity targets must be explicitly designated from title/hero and named supporting content, so the engine need not infer which decorative motion is meaningful. Those semantic declarations remain author statements whose purpose is reviewed with the output. A valid quality report alone is insufficient evidence that authoring improved.

**Not adopted:** global Bang Nalar thresholds; compulsory decorative camera motion; counting narration or automatic captions as story activity; treating invisible/no-op beats as change; inferring a hero from layer IDs or size; blanket exceptions from notes; claiming sparse samples check the whole timeline; automatic shrink, layout or copy rewrites; universal quality scores or automatic approval; arbitrary recipe introspection presented as complete. The optional rules do not replace existing safety checks or owner visual judgement.

Concrete task, acceptance artifacts, compatibility and gates are in [M5.1](plan.md#m51--profile-composition-quality).

### Adaptation from motion-film and Nouride — 2026-11-05

- Use [motion-film's motion language](https://github.com/arhen/motion-film/blob/67b570001231dfcdfe3a5be7cb8c2b1e4f3349fb/skills/motion-film-brief/MOTION-LANGUAGES.md) to make a shot's purpose and timing concrete in the existing art-direction examples. Episode notes record intent. Pinned profile settings are the authority for measurable requirements.
- Apply [Nouride's arriving and settled review](https://github.com/nouverse/nouride-builtin-contents/blob/447d90cfceaa85c867e7cf437b2d5376d32cdaa8/skills/motion-graphics/SKILL.md) using NaraFrame's own resolved timeline and preview artifacts. Fixed time offsets can land during another move or outside a short shot.
- Adapt [motion-film's evidence review](https://github.com/arhen/motion-film/blob/67b570001231dfcdfe3a5be7cb8c2b1e4f3349fb/skills/motion-film-qa/SKILL.md) by extracting a short strip around a risky seam from the actual preview. Keep playback review and owner approval in the existing export route. Overlay tooling, a second clock, and automatic pixel QA are outside this batch.

## 10. Default authoring and character profiles — 2026-11-06

Fatih agreed to record the visual proposals for later work. The audit used main at `83abaee`, including source, authoring guides and existing gallery stills. The stills show recurring composition choices across looks. They do not establish playback quality, and the audit did not measure the suspected runtime bottlenecks. The [candidate task list](plan.md#7-visual-authoring-and-character-profiles--future-candidates) owns priorities and acceptance.

The proposed routing gives a plain prompt for a new video the canonical `naraframe` skill and `general-explainer` profile. An explicit profile or character choice takes precedence for a new video. A continuation uses the series or episode's pinned profile. Changing the visual character of an existing episode requires an explicit revision that can also change its assets and choreography. Existing factual sourcing rules still apply.

For a new brief, the skill finds a contrast, consequence or question it can show on screen. It compares two or three genuinely different visual openings internally and chooses the one that reads quickly at phone size and earns a payoff in the video. Each shot names what the viewer learns, which object shows it, and what changes on screen. For a brief about a backed-up queue, show arrivals piling up at one counter, follow an arrival to reveal where progress stops, then revisit the opening framing as the counter's capacity increases. Other topics may work better as a side-by-side comparison or an uninterrupted demonstration. The first three seconds are a review window. Hold duration and cut rhythm follow the subject and profile.

| Profile candidate | Recognizable behavior | First authoring path |
|---|---|---|
| Stickman Ink | Ink silhouette, readable poses, anticipation before touching a prop and a reaction after contact. | Pinned poses and props, with a small trusted SVG recipe for local pivots when needed. |
| Meja Mekanik | An object assembles, shows a flow through its parts, then opens or reframes to reveal the cause. | Declarative shapes, groups, path draw/follow and camera. |
| Paper Cutout | Flat staging, hinged props, stepped changes and held poses. | Existing timing and a local recipe for stepped movement if needed. |

The character skills should be small wrappers over one launcher and public workflow. Candidate names are `naraframe-stickman`, `naraframe-mekanik` and, after its pilot, `naraframe-paper`. Check slash invocation and any plugin namespace in Claude Code. In Codex, check the skill picker or the supported explicit skill invocation on the target host. Record the working route before documenting it for users. [Claude Code skills](https://code.claude.com/docs/en/skills#how-a-skill-gets-its-command-name), [Codex skill invocation](https://learn.chatgpt.com/docs/build-skills#how-chatgpt-and-codex-use-skills)

Borrow per-style acting and continuity from [Stickman Video Director](https://github.com/kaomei/stickman-video-director/blob/main/skills/directing-stickman-videos/references/b1-minimal-handdrawn.md), rigid paper motion from [Hand Drawn Video Prompts](https://github.com/kaomei/hand-drawn-video-prompts/tree/main/hand-drawn-video-prompts), and scene-scoped iteration from [YouTube Automation Agent](https://github.com/darkzOGx/youtube-automation-agent/blob/master/utils/scene-repair-service.js). Use [Anti Slop](https://github.com/miqdadbadjuber/anti-slop/blob/main/skills/antislop/SKILL.md) to question visual choices without a story purpose, and the [Reels and Shorts guide](https://ardiggs.notion.site/PANDUAN-REELS-SHORTS-40ccc2f7697981a09fe1d41e833f768e#a9a4551c7af34486821e1daac5a828e9) to inform opening and pacing review. Keep one resolved NaraFrame timeline. Record named visual and sound cues in authoring first, and use motion-film's approach to review contact and seams in the actual preview.

The renderer already supports the declarative pilots and whole-scene trusted recipes. The possible dimension mismatch in recipe previews and loss of invalid local recipe edits during `undo` are hypotheses from source inspection. The repeated motion scans, compile and browser startup work, and multiple post-render passes are profiling candidates. Keep findings attached to the pilot or measurement that makes them actionable. Any change to an engine primitive retired in the earlier triage requires a demonstrated need and an explicit scope decision.

### A1 direction sheets (2026-11-06)

Both studies tell the same story in three beats: a ball hits a gate, the gate lifts, and the ball passes. The grayscale board uses labels A and B so the first review can judge the action before reading the profile names. Editable SVG strips and a preview image are in `/Users/fatih/Code/Playground/NaraFrame-projects/acceptance/2026-11-06-a1-character-directions/`.

| Direction | Recognizable staging | Assets and constraints |
|---|---|---|
| **A · Stickman Ink** | The body explains the event. The character notices the jam, shifts weight, makes hand contact, pulls, then relaxes once the ball clears. Frame the character and prop together. Move closer only to clarify the grip, then give the reaction time to land. | Paper, fine pen strokes, slender pose silhouettes, separate face marks, arm/hand poses, gate, ball and tabletop. Keep the feet planted and align the hand to the handle before the gate moves. A repeated front-facing shrug or a floating hand reads out of character. |
| **B · Meja Mekanik** | The machine explains the event. Keep the same diagonal projection and let the eye follow the ball, the lever's pivot, the pin sliding in its slot and the rising plate. Hold with the open channel in view. | Grounded base and rails, rigid lever, fixed pivot, slotted tab, guided plate, ball and one path cue. The plate stays on its guide and the lever keeps its length. Free-floating parts or a camera orbit obscure the mechanism. |

Stickman Ink adapts the gaze, planted stance and prop contact in [Stickman Video Director B1](https://github.com/kaomei/stickman-video-director/blob/main/skills/directing-stickman-videos/references/b1-minimal-handdrawn.md). Meja Mekanik adapts fixed projection, grounded parts and readable flow from the mechanism section of [motion-film](https://github.com/arhen/motion-film/blob/67b570001231dfcdfe3a5be7cb8c2b1e4f3349fb/skills/motion-film-brief/MOTION-LANGUAGES.md#mechanism-explainer). The boards use original editable drawings.

The proposed `0.1.0` pattern set is for the A2 pilot. The ranges below describe a ten-second draft; the resolved timing and prepared take determine the actual cues in both versions.

| Beat | Stickman Ink pattern | Meja Mekanik pattern |
|---|---|---|
| 0–2.6 s · Stoppage | `ink-notice@0.1.0`. The tap interrupts the ball. Hold on the lean and gaze. | `mechanik-jam@0.1.0`. Hold the same fixed view as the ball touches the plate. One dry impact. |
| 2.6–6.0 s · Cause | `ink-grip-pull@0.1.0`. Anticipation, grip, then lift. A light contact sound lands when the hand meets the handle. | `mechanik-linkage@0.1.0`. The lever rotates around its pivot. The pin slides in the slot and the plate rises on its guide. One click when it clears. |
| 6.0–10.0 s · Payoff | `ink-release@0.1.0`. The ball rolls clear and the free shoulder drops. Hold the relaxed pose while the gate stays raised. | `mechanik-flow@0.1.0`. The ball follows the same rail. Let the roll stop before the final hold on the open route. |

Build the A2 pilot with existing declarative layers and motion where they can preserve the contact or mechanical constraint. A small trusted local recipe is an option for a pivot or articulated grip that the pilot actually needs. Fatih approved the two distinct directions after reviewing the grayscale board on 2026-11-06. The pattern IDs identify the proposed pilot shots.

## 11. Visual Library and Studio research

The audit at `f55c06e` covered all 102 tracked source files in core, renderer-remotion, and CLI, plus distribution scripts, skills, catalogs, and relevant tests. It also reviewed the main files of the 16 repositories from the X post, the core paths of the four repositories supplied from Threads, and the original references. The [style map](spec.md#visual-library-and-optional-studio) owns profile names and availability. The [plan](plan.md#8-visual-library-knowledge-and-optional-studio) owns task status and acceptance.

### Gap analysis

| Area | Evidence | Decision |
|---|---|---|
| Visual vocabulary | Paths, SVG/PNG, crops, transforms, camera x/y/zoom, parallax, and billboards are present. The three character catalogs contain seven patterns. The group validator rejects group members that are themselves groups. | Give each new style a recognizable action and two briefs that exercise it. Bedah 2.5D uses layered parts at fixed projection. Motion Comic uses panel crops and focus changes. Story uses held poses and carries a prop or action between shots. [Group validator](../packages/core/src/schema/scene.ts#L700) |
| Timeline and QA | The compiled timeline places scenes, beats, cameras, narration, and captions on frames. Beats and camera motion can follow phrase anchors. SFX use scene offsets. A trusted recipe owns an entire scene and has more limited automated visual coverage. | Name cues in the shot note first. Inspect the opening, contact, settled pose, payoff, and seam in the engine preview. Prototype a shared cue only if a real retime exposes repeatable drift. [Soundtrack compiler](../packages/core/src/compiler/soundtrack.ts#L45) · [Settled checkpoints](../packages/core/src/compiler/composition-quality.ts#L58) |
| Measured render costs | C1 warm previews after one edit took 14.32 s scoped and 18.27 s full. Capture and encode took 77% and 82%. Compatible build reuse took 0.80–0.85 s. C2 improved median wall time by 10 ms (0.07%) and was closed by the owner. | Use scoped previews while authoring. Benchmark the new styles before proposing runtime changes. C1 used profiles with `compositionQuality` absent, so the opt-in preflight cost on dense new projects remains unmeasured. [C1 and C2 receipts](plan.md#c1-measurement-model-2026-11-07) |
| Performance hypotheses | Opt-in preflight rasterizes image/path paint and evaluates geometry at checkpoints. Image and SVG loading can re-read bytes for different checks. Cold bundling and post-render decode also contribute distinct costs. | Measure rasterization, geometry, asset reads and hashing, bundling, and verification separately on the new fixtures. Select at most one change from V6 evidence. [Paint measurement](../packages/renderer-remotion/src/remotion/composition-paint.ts#L138) · [Asset loading](../packages/core/src/io/load-project.ts#L101) |
| Reuse boundaries | A probe kept the same scene key for scene A alone and A before B, despite an outgoing transition taking effect only before B. The assembly keys differed. | Keep whole-build reuse as the baseline. Any segment proposal needs effective boundary state, captions, global audio handling, dependency hashes, and approval compatibility. [Scene and assembly keys](../packages/core/src/compiler/keys.ts#L91) |
| Separate validation finding | An in-memory probe accepted a ready SVG as music through source validation and compilation. Export has a separate media stream check. | Retain the compile-stage reproducer as a separate validation bug candidate. It has its own scope and regression if adopted. [Source validation](../packages/core/src/schema/export-schema.ts#L310) · [Soundtrack compiler](../packages/core/src/compiler/soundtrack.ts#L55) |

### Reference decisions

| Reference | Source and reuse boundary | Adaptation |
|---|---|---|
| motion-film | MIT. Reviewed at `67b5700`. Skill-led Remotion/FFmpeg pipeline with named cues and QA on rendered media. | Give each style its own movement, tempo, camera, sound, and moves to avoid. Tie named authoring cues and QA frames to the existing timeline. [Motion languages](https://github.com/arhen/motion-film/blob/67b570001231dfcdfe3a5be7cb8c2b1e4f3349fb/skills/motion-film-brief/MOTION-LANGUAGES.md) · [Clock](https://github.com/arhen/motion-film/blob/67b570001231dfcdfe3a5be7cb8c2b1e4f3349fb/skills/motion-film-build/templates/clock.ts) · [QA](https://github.com/arhen/motion-film/blob/67b570001231dfcdfe3a5be7cb8c2b1e4f3349fb/skills/motion-film-qa/SKILL.md) |
| HyperFrames | Apache-2.0. Reviewed at `336abaa`. Resolves HTML timing before browser capture. Packages editable registry items and supports segmented capture. | Select editable patterns by shot intent. Inspect the object and stage on both sides of a seam. Use capture segmentation as a research reference for V7. [Timing compiler](https://github.com/heygen-com/hyperframes/blob/336abaa80f405717b82111656f204d48bbde53b9/packages/core/src/compiler/timingCompiler.ts) · [Registry](https://github.com/heygen-com/hyperframes/blob/336abaa80f405717b82111656f204d48bbde53b9/skills/hyperframes-registry/SKILL.md) · [Seam review](https://github.com/heygen-com/hyperframes/blob/336abaa80f405717b82111656f204d48bbde53b9/.agents/skills/seam-craft/SKILL.md) |
| OneTake | Reviewed at `abb6d17`. Its source is under PolyForm Noncommercial 1.0.0. Seekable shots and a beat sheet track what carries through a cut. | Apply the continuity principle with original implementation and assets. Record the character, prop, or action the viewer should track across the cut. [Beat sheet](https://github.com/feitangyuan/onetake/blob/abb6d17279cdc749e27e99aa534a062d8fd01ced/SKILL.md#3--storyboard-as-rhythm-and-carry) · [License](https://github.com/feitangyuan/onetake/blob/abb6d17279cdc749e27e99aa534a062d8fd01ced/LICENSE) |
| Tinycharts | Reviewed the public site and free skill archive. Its license limits commercial use and redistribution. The exploded-view and comic examples map visible states to parts and panels. | Author original layered artwork and map one predetermined sequence to NaraFrame beats. Adopt the order of reveal and reading, with the Bedah 2.5D label in user-facing material. [Tinycharts](https://april-zhu.com/tinycharts) |
| GBro Collage B-roll | MIT. Reviewed at `a1a4ee2`. Its workflow reviews a metaphor and final still before provider-driven animation. | Build one metaphor from locally authored cutouts that arrive and lock in order. Use existing transforms for Editorial Collage. [GBro skill](https://github.com/pyang5166/gbro-collage-broll/blob/a1a4ee2e2abf7d44e460026b706d0c72c2cf8a91/SKILL.md) |
| Bang Story | MIT repository. Reviewed at `c71651a`. Electron separates UI and media jobs. Live preview and export share rules, and FFmpeg export allows overlap at clip boundaries. | Adopt the style picker, scene list, inspector, job status, cancel, and export confirmation. Use the actual engine MP4 in Studio. Keep clip overlaps as reference material for segment research. [Architecture](https://github.com/bangtutorial/bang-story/blob/c71651adacc724d74ef26a59c4a2183d93b29784/docs/arsitektur.md) · [Editor and export](https://github.com/bangtutorial/bang-story/blob/c71651adacc724d74ef26a59c4a2183d93b29784/docs/editor-dan-ekspor.md) |

The [X source list](https://x.com/renproton/status/2118392436863201677) groups into three decisions. Remotion and FFmpeg already serve rendering and delivery. Storyboarder (panel duration), Anime.js (relative beat placement), Pixelorama (pose holds), and Three.js (orthographic projection) inform original authoring. Flubber is relevant when a shot needs contour morphing. PlayCanvas, cannon-es, Sverchok, Effekseer, twigl, Bark, Pedalboard, OBS Studio, and Shotcut stay as specialist references. This package imports zero code or assets from these repositories.

Earlier references still serve specific jobs. Stickman Video Director informs pose and prop contact. Hand-Drawn Video Prompts informs cutout consistency. YouTube Automation Agent informs per-scene repair. The Reels guide informs the opening review, and Anti Slop prompts the author to justify each move. These are editorial inputs. The first-three-second review checks whether the question and payoff are legible. [Earlier reference record](#10-default-authoring-and-character-profiles--2026-11-06)

Use one shot note to record the subject, intended effect, shot action, timing, hold, cue name, and what carries into the next shot. Keep the compiled timeline as the source of timing. Use the catalog for versioned patterns and project revisions for episode edits. [Existing authoring workflow](../skills/naraframe/authoring.md)

### Studio research and CLI mapping

Bang Story separates browser-facing controls from privileged jobs and reports progress, errors, and cancellation. It has a live player and a separate export path, with a documented preview jitter case. NaraFrame Studio will use the engine's rendered artifact for review. The independently installable CLI stays the authority for project state and acceptance. [Job and storage design](https://github.com/bangtutorial/bang-story/blob/c71651adacc724d74ef26a59c4a2183d93b29784/docs/arsitektur.md) · [Known preview issue](https://github.com/bangtutorial/bang-story/blob/c71651adacc724d74ef26a59c4a2183d93b29784/docs/masalah-diketahui.md)

| Screen or action | Existing engine path |
|---|---|
| Connect a local engine | `version --json` and `doctor --json` |
| Pick a style and open or create a project | `profile list --json`, `status PROJECT --json`, and `create PROJECT --profile ID`. Use `--template starter` for the generic starter. |
| Show scenes and import a versioned pattern | `outline PROJECT --json` for authored order and durations. Use `library inspect` and `library stage` for the selected catalog and version. |
| Edit text or undo | Stage the change, call `edit --expect SOURCE_REVISION`, and refresh from `status`. Use `undo` for the previous revision. A revision conflict asks the user to reload. |
| Review preview and job status | Use `preview --draft --scene ID --json` for a shot and `preview --resolution 1080 --json` for a full review build. Use the reported MP4 for playback time. Show progress/status, and send `SIGINT` to the running CLI job on cancel. |
| Approve and export | Pass the user-selected full preview build ID to `render --approve-preview BUILD_ID --json`. The engine validates revision, scope, and approval. |

The first Studio scope is the local browser workflow in U1 and U2. The [Studio roadmap](plan.md#optional-studio-roadmap) records access boundaries, cancellation behavior, and acceptance.

### OpenFilm follow-up

The source review used OpenFilm `e07ae4cc940b5cdc70dc442f80317e09acb8e30f`. Its MIT-licensed project uses HTML tracks to place and trim clips. Each shot page draws a requested time through `frame(t)`. NaraFrame already has a compiled frame timeline and builds its storyboard after encoding a preview. The opportunity is to inspect a few frames before that encode and to use the existing preview evidence in Studio. The adaptation uses NaraFrame's project format and installed renderer APIs. [OpenFilm protocol](https://github.com/openfilm/openfilm/blob/e07ae4cc940b5cdc70dc442f80317e09acb8e30f/packages/openfilm/SPEC.md) · [License](https://github.com/openfilm/openfilm/blob/e07ae4cc940b5cdc70dc442f80317e09acb8e30f/LICENSE) · [NaraFrame preview artifacts](../packages/cli/src/preview-build.ts)

| Source pattern | Proposed adaptation |
|---|---|
| `look` captures stills and revisits the same timestamps in two shuffled orders to catch state carried from a previous frame. | Try a bounded PNG inspection through the existing Remotion composition. Use the compiled clock, current trust checks, and serial capture. Compare PNGs for the same frame across capture orders. Keep the stills as QA evidence alongside the official MP4 review workflow. [OpenFilm `look`](https://github.com/openfilm/openfilm/blob/e07ae4cc940b5cdc70dc442f80317e09acb8e30f/packages/openfilm/src/look.mjs) · [NaraFrame renderer](../packages/renderer-remotion/src/render-draft.ts) |
| Studio and the agent share source files. OpenFilm addresses edits by clip ID and checks the revision. Some operations can be reapplied to newer files. | Use scene and layer IDs for the inspector, share the scene ID and source revision with the agent, and keep NaraFrame's `edit --expect` conflict and reload behavior. Build storyboard cards from `outline`. Link existing `frames.json` checkpoints to the matching MP4 using `frame / fps`, and display `sourceFrame` as the position in the episode. [OpenFilm Studio edits](https://github.com/openfilm/openfilm/blob/e07ae4cc940b5cdc70dc442f80317e09acb8e30f/packages/openfilm/studio/server/film.mjs) · [NaraFrame Studio roadmap](plan.md#optional-studio-roadmap) |
| Render resume retains completed chunks and checks inputs and render settings before continuing an interrupted job. | Keep this as a V7 reference. Reuse after a source edit still needs a measured long-episode case and identity for segment boundaries, captions, audio, and dependencies. V6 found capture and encode took 87–88% of two warm draft runs. The gain from sampling fewer frames remains a hypothesis until the proposed trial. [OpenFilm resume](https://github.com/openfilm/openfilm/blob/e07ae4cc940b5cdc70dc442f80317e09acb8e30f/packages/openfilm/src/render-resume.mjs) · [V6 timings](plan.md#v6-render-benchmark-acceptance) |

## 12. Character story motion findings — 2026-11-09

A raster-dot style test in the Bang Nalar story project (`productions/uji-gaya-raster/` in that project) produced a note on engine limits for jointed characters and on story motion in the owner's reference account. The note was checked against the `0.3.0` source at `1842632`. The [0.4.0 task list](plan.md#9-naraframe-040--character-story-motion-proposed) owns priorities and acceptance.

The reference account barely animates its characters. Its stories move through camera, light, screens and pose changes at cuts. The test needed jointed limbs, pose changes and idle motion, and worked around them with square canvases centred on the shoulder, one layer per pose and hand-written breaths.

### Source check

| Finding from the test | Source evidence | Decision |
|---|---|---|
| A layer turns about its centre. | The renderer already sets `transformOrigin` from a motion anchor and preflight rotates bounds about it ([layer style](../packages/renderer-remotion/src/remotion/draft-video.tsx#L209), [preflight](../packages/renderer-remotion/src/remotion/visual-preflight.ts#L459)). Only a `focus` beat can set that anchor ([motion](../packages/renderer-remotion/src/remotion/motion.ts#L331)). | Expose a per-layer pivot. Small change, large effect. |
| No skeleton. | A group can be moved as a parent, but its members cannot be groups ([group validator](../packages/core/src/schema/scene.ts#L708)); the renderer skips nested groups. Attachments are resolved at authoring time. | Allow bounded nested groups so upper arm, forearm and hand inherit their parent's motion. |
| A card revealed, exited and revealed again never appears. | Reveal and exit multiply opacity ([motion](../packages/renderer-remotion/src/remotion/motion.ts#L302)), so any exit keeps the layer hidden for the rest of the scene and a second reveal also hides it until that reveal's window. The overlap check excludes `reveal` and nothing checks the sequence ([compile](../packages/core/src/compiler/compile-draft.ts#L1189)). | A silent defect. Fix before adding features. |
| One pose needs one layer. | Image layers have one asset. | Add an instant asset swap on one layer. |
| Motions on one property cannot stack. | `MOTION_PROPERTY_OVERLAP` covers transform, exit, draw, follow and count. `emphasize` multiplies scale outside that check. | Document `emphasize` with a small scale as a breath over a transform. No additive runtime. |
| Only three easings. | `linear`, `smooth`, `snappy` ([schema](../packages/core/src/schema/scene.ts#L351)). | Document anticipation and overshoot as two or three consecutive transforms. Spring stays CLOSED_NOT_PLANNED. |
| No loop. | Repeater is CLOSED_NOT_PLANNED. | Propose a compile-time expansion into ordinary beats, subject to an explicit scope decision. |
| SVG has no gradients, patterns or filters. | Linear and radial gradients, `clipPath` and `mask` are accepted. `pattern`, `filter`, `style` and embedded images are refused ([sanitizer](../packages/core/src/asset/svg-sanitize.ts#L18)). No blend modes. | Light can use gradient overlays now. Pre-rendered raster shading is a valid PNG asset. Patterns, filters and blend modes wait for a production case. |
| No video, Lottie or Rive layer. | Assets are PNG, SVG and audio. Video layers are CLOSED_NOT_PLANNED. | Out of 0.4.0. |
| Camera moves are strictly sequential. | `CAMERA_MOVE_OVERLAP`. | Out of 0.4.0. |
| The story profile has no character rig. | `story@0.1.0` ships four action patterns and poses. | Add a faceless rig and pose set after the engine tasks pass. |

A trusted recipe can already draw a scene with nested pivots, swaps and loops in React/Remotion ([recipes](../skills/naraframe/authoring.md)). It requires owner trust for every code change, has no scene camera and has limited automated visual checks, so it stays the route for one-off articulated acting, not for daily production.

### References

No recorded reference covers skeletal rigs, Lottie or Rive. Earlier references map to the remaining work:

- [Stickman Video Director B1](https://github.com/kaomei/stickman-video-director/blob/main/skills/directing-stickman-videos/references/b1-minimal-handdrawn.md): gaze, planted stance, anticipation and prop contact for the pose set.
- [Hand Drawn Video Prompts](https://github.com/kaomei/hand-drawn-video-prompts/tree/main/hand-drawn-video-prompts): rigid cutout motion as a deliberate look.
- Pixelorama and Storyboarder from the [X source list](https://x.com/renproton/status/2118392436863201677): pose holds, stepped timing and shot duration.
- Flubber from the same list: contour morphing with different point counts, if a later case needs bending.
- [OneTake](https://github.com/feitangyuan/onetake/blob/abb6d17279cdc749e27e99aa534a062d8fd01ced/SKILL.md#3--storyboard-as-rhythm-and-carry) (principle only, noncommercial licence) and [HyperFrames seam review](https://github.com/heygen-com/hyperframes/blob/336abaa80f405717b82111656f204d48bbde53b9/.agents/skills/seam-craft/SKILL.md): change the pose at a cut and inspect both sides.
- [motion-film QA](https://github.com/arhen/motion-film/blob/67b570001231dfcdfe3a5be7cb8c2b1e4f3349fb/skills/motion-film-qa/SKILL.md): frame strips around joints and pose seams.
- [Anti Slop](https://github.com/miqdadbadjuber/anti-slop/blob/main/skills/antislop/SKILL.md): justify each movement in a mostly still shot.

### Expected coverage

The proposed package addresses the test's pivot, skeleton, re-show and pose-swap findings in the engine. It turns breath, overshoot and gradient light into documented techniques, and proposes a loop expansion. Mesh bending, contour morphing, additional easings, video or Lottie layers, blend modes and camera drift remain out of scope. For a nearly still faceless character this should cover most of the test's problems. Fully acted characters with bending bodies still need a recipe or a later scope decision.

## 13. Visual proof in Motion Explainer

NaraFrame already has editable groups, transforms, reveals, paths and numeric labels. The prior `data-comparison` example displays two measures on one baseline. The new authoring examples make the change itself show the relationship.

| Reference | Adaptation |
|---|---|
| iArt `motion-skills` at `ba94b70` points to the data-animation pack at `6570c0c` (MIT). Its chart skill separates the value scale from frame interpolation and inspects exact values and units. | Define the scale and labels before choosing animation. Use equal-sized units in the proof scene. For actual datasets, derive labels and geometry from the same values during authoring. [Motion Skills](https://github.com/iart-ai/motion-skills/tree/ba94b7067684e349204242432e8bf6c4d634a8ca) · [Chart animation skill](https://github.com/iart-ai/data-animation-skills/blob/6570c0c4fbc9daa8d7ac1f1163a890352344206b/skills/chart-animation/SKILL.md) |
| 3Blue1Brown's Manim at `fafa083` (MIT) supports pairing parts explicitly across transformations. | Keep explicit identities for parts whose meaning survives a rearrangement. A stable NaraFrame group carries a tile and its number together. [TransformMatchingParts](https://github.com/3b1b/manim/blob/fafa083a4fb274bba9cabde0b6e2f50ba6da0622/manimlib/animation/transform_matching_parts.py) |
| HyperFrames at `9701f4b` (Apache-2.0) builds its chart in reading order, lands the exact callout and gives it a hold. | Reveal the shared span, move only the extra units, and hold the difference with both original values readable. Verify the settled state in the existing NaraFrame preview. [Chart story](https://github.com/heygen-com/hyperframes/blob/9701f4bbf3d1ef41753dcf5613fead937e1edf2c/registry/components/chart-story/README.md) |

The scenes and guidance are original NaraFrame source. Motion Explainer is the entry point in the canonical skill. The renderer uses ordinary declarative layers and beats.
