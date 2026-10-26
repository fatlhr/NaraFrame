# NaraFrame — Production Findings and Decisions

Updated 2026-10-26 · Earlier M4 findings are historical; new composition-policy feedback is recorded in section 9

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

## 5. Open register carried forward

| Item | Disposition |
|---|---|
| D-VIS / NF-AC-16/17; Bang Motion equivalence NF-AC-19 | OPEN/deferred owner output decisions, not retroactively passed. Medan's spoken “ke-4” blocks publication until explicitly resolved. |
| LBC photo/publication rights | Internal acceptance does not clear public use. |
| Voice binding/reuse on branded episodes | Not proven by music/silent trials; exercise prepared voice in M4.4–M4.5 without claiming prior completion. |
| Cost and owner/agent active time | Unknown historical measurements remain unknown; collect factual evidence going forward. |
| Pixel repeatability NF-AC-06 | Historical output variants remain unexplained despite later green runs. No retry-until-green or guaranteed identical MP4 claim. |
| F-A2 and issue #16 | SIGKILL browser descendants; E2E diagnostics/cancellation coverage remain separate reliability work. |
| Unit harness/interruption timeout under load | Resource contention is a hypothesis, not a proven cause. Isolated passes do not erase observed failures. |
| Batch A/B gate logs | Some retained records are RTK summaries, not complete raw diagnostics. |
| Recipe coverage | Undeclared text, noisy id/enum listing, trusted-code limits, and fit/collision/contrast gaps remain explicit. Text slots do not prove custom code uses their props. |
| Focus/occlusion and text overflow collision | Diagnostics have coverage limits; not universal scene analysis. Count width samples endpoints, not every in-between value. |
| F3/F4 and leftover assets after undo | Targeted revision undo and fuller reuse reporting remain backlog; restored source does not imply physical deletion of unused media. |
| Older tutorlog-recipe final assembly mismatch | Predates newer binding/text-fit work; keep historical evidence instead of silently relabeling it. |
| Word-level timing; M2.4.4 test checkbox without evidence | Unproven items remain open. Prepared timing does not equal native word-motion enforcement. |

M4 can encounter a listed defect, but does not silently absorb every backlog item. Reproduction, effect on the scoped acceptance, and the owner's decision determine whether it becomes a separate correction.

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

Concrete task, acceptance artifacts, compatibility and gates are in [M5.1](plan.md#m51--profile-composition-quality). Implementation remains PLANNED pending its own work authorization.
