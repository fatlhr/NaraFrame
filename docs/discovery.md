# NaraFrame — Product Discovery

Status: Design revision 0.3 approved and consolidated; product implementation not started.
Date: 2026-09-07

## Purpose

Build a personal production tool for a faceless short-video explainer account. Support agent operation and future manual GUI operation. The first outcome is a repeatable workflow for publishing videos, with less production effort over time.

This document records user intent and decision history. Active technical contracts belong to `docs/spec.md` revision 0.3; delivery gates belong to `docs/plan.md`. Recommendations below are identified as accepted or still empirical, not silently treated as implemented behavior.

## Confirmed user intent

- Project name / workspace: NaraFrame.
- Initial use: personal production for a new short-video explainer account.
- Initial user: Fatih, comfortable with JSON, terminal, and AI agents. Ease of use means clear commands/configuration, actionable errors, cheap revisions, and repeatable operation. A novice onboarding wizard, mandatory starter-profile flow, chat-only use, and a nondeveloper pilot are not MVP requirements.
- Content format: faceless motion graphics, vertical video.
- The tool should eventually support both agent automation and manual GUI use.
- Style, branding, and niche should be configured before video production to avoid generic results.
- Users can switch between identities / creative profiles.
- Product scope: multiple switchable creative profiles. Niche, audience, branding, and editorial direction belong to the selected profile, not to NaraFrame globally.
- One intended profile covers current issues by providing historical context, explaining the event or mechanism, and exploring its effects. This is a first example, not the exclusive product direction.
- Visual capability direction: combine reusable infographic scenes with topic-specific illustrated motion. The initial reusable foundation covers typography, maps, timelines, comparisons, charts, labels, and connectors; topic-specific assets may be animated with reusable motion behaviors.
- Representative brief: an eruption of Krakatau prompts a video about Krakatau's history and the effects of eruptions. This is a user-provided example, not confirmation of a recent eruption.
- Develop the specification through an interview with recommendations and tradeoff discussion.
- Produce a spec, an adversarial spec refinement, and an implementation plan before implementation.
- MVP 1 starts from prepared production artifacts: script, scene plan, assets, and narration. Research and generation may be performed by an agent using a NaraFrame skill, but they are outside the core engine's responsibility.
- Primary MVP user experience is chat-first through Codex. The agent follows the NaraFrame skill and invokes the CLI; users may also invoke the same CLI and edit project files manually.
- A project selects its creative profile before production. The agent uses that profile for creative direction, while the compiler resolves its render-facing values before the engine runs.
- Each project pins a resolved profile snapshot in `profile.lock.json`. Changes to the source profile do not silently change existing projects. Applying another profile is an explicit operation that reports revalidation and regeneration requirements.
- A source profile is a folder with separate agent-facing creative direction and engine-facing configuration. The proposed minimum contents are `direction.md`, `profile.json`, and optional supporting brand/reference assets.
- Narration is authored as ordered story blocks with local clips and phrase timing. The compiler derives one timeline from measured clip durations and explicit pauses; an assembled master is derived output. A block may own multiple scenes. Silent scenes use explicit pause/silent-clip ranges with complete visual coverage. The skill/agent prepares voice/alignment outside core.
- MVP 1 excludes arbitrary per-project TSX `CustomScene` components. Topic-specific visuals use layered compositions of SVG, PNG, text, and native shapes animated through semantic engine primitives. Unsupported recurring needs should first become reusable core capabilities; a custom-code escape hatch is reconsidered after pilot evidence.
- The MVP scene model separates narrative role (for example, hook or explanation) from visual form (for example, diagram, map, or comparison).
- A scene can contain timed semantic visual beats such as reveal, connect, flow, and emphasize. Beats provide progression within a scene without exposing raw keyframes.
- The canonical project is a structured folder rather than one large `motion.json`. Root artifacts are a human/agent-editable working copy. Managed builds capture accepted immutable source revisions; generated compiled input is never edited directly. Direct JSON edits are validated/captured before managed builds, and invalid edits are preserved for correction.
- CLI validation reports use stable issue codes, severity (`error`, `warning`, or `info`), location, responsible party, and a suggested action. Exit codes distinguish validation failures, runtime failures, and incorrect CLI usage.
- MVP commands use safe rerun rather than frame-level resume. Source revision, generation key, scene-render key, assembly key, and approval identity are separate. Publish one complete immutable build and atomically switch its pointer; preserve the previous set after failure. Voice/images, source revisions, receipts, and selected retained builds are not disposable cache.
- MVP provider orchestration belongs to the NaraFrame skill and the operating agent. The core accepts local assets, audio, timestamps, and provenance metadata; it performs no provider network calls, stores no provider API keys, and has no required image, voice, or research provider adapters.
- Configuration resolves in this order: engine defaults, pinned profile, project overrides, then scene overrides. A profile explicitly declares locked and overridable paths. Attempting to override a locked path is a validation error; accepted overrides remain in project source for reproducibility.
- Narration requires phrase/utterance timestamps. Word-level timestamps are optional and only required by profile features such as active-word captions or word-anchored visual beats. Caption cues reference local narration timing. Intended generation text, observed transcript, and attributed display correction remain distinct so an already-correct voice does not need regeneration for caption spelling.
- `naraframe preview <project>` automatically compiles/validates full production inputs. Draft and selected-scene preview have explicit readiness/scope, so unrelated missing media does not block useful local preview. Draft timing/placeholders are labelled and never count as final readiness. `render` captures/revalidates current sources before final export; compile is not a separate required user step.
- Audio scope is one resolved narration track assembled from block clips/pauses, one optional background-music track, and zero or more SFX cues. Narration/captions arrive at M1; music/SFX at M2. Basic volume, looping, fades, and ducking are supported; multitrack editing/automation curves are deferred.
- Skill and core participate in one interleaved pipeline. Codex follows the skill, calls core commands at plan and production checkpoints, fixes reported issues, and only then requests full preview/final render. The core does not wait until every artifact exists before providing useful validation.
- The user gave overall approval for the remaining pre-spec decisions to be resolved using the documented recommended defaults, then reviewed together in the specification artifacts.
- After the review and target-user correction, the user accepted the other proposed revisions and requested consolidation into existing documents, not additional plan/review files. This authorizes the documentation update, not product implementation or paid provider calls.
- Production policy defaults to no-new-spend with authorized quota use distinguished from new cash spend. Record operation receipts, unknown usage, reservations, and at most two attempts per artifact before escalation. Unknown results are not blindly resent. One real narration/timing recipe is required for narrated acceptance; missing tools can only yield a labelled fallback.
- Source revisions support staging, conflict detection, and undo. Restoring a project never rolls back paid usage/receipts. Profile apply shares that mechanism, preserves allowed overrides, exposes conflicts/editorial effects, and may commit a needs-production revision.

## Confirmed technical direction

- Local-first storage and local rendering.
- TypeScript / React / Remotion, with JSON artifacts as the editable project representation.
- Final output at 1080 × 1920 and 30 fps; lower-resolution previews.
- CLI before a minimal browser Studio.
- Reusable semantic scenes plus declarative layered compositions for topic-specific visuals.
- Human approval before final export initially; greater autonomy after quality is demonstrated.

## Details delegated to spec and technical spikes

1. Exact JSON schemas, report shapes, enums, and validation messages.
2. Codec, CRF/bitrate, pixel format, color-space, and audio-analysis defaults.
3. Exact Remotion, browser, Node LTS, and FFmpeg versions proven by the technical spike.
4. Text measurement thresholds and initial motion timing values proven by reference videos.
5. Detailed implementation of the accepted artifact-key/source-revision contracts and actual performance/cost measurements.
6. Natural voice continuity across story blocks and whether particular edits need neighboring regeneration.

## Confirmed phase boundary

### MVP 1 — Production core

Goal: prove that NaraFrame can repeatedly produce consistent, publishable faceless motion explainers through an agent/CLI workflow.

- Use CLI and project files for creation and correction.
- Let Codex provide the primary chat-first workflow by following the NaraFrame skill and calling the CLI automatically; opening a separate terminal is optional.
- Treat script, scene plan, assets, and narration as prepared inputs to the core. Topic research, script writing, and media generation are agent/provider workflows outside the core boundary.
- Treat the project directory as the canonical unit. Editable source artifacts and production policy are captured as revisions; receipts remain append-only. Compilation consumes one snapshot and generates build-local compiled input, with `.naraframe/compiled.json` only a diagnostic convenience copy.
- Provide preview and final render, but no custom NaraFrame GUI.
- Support creative profiles, structured scenes, assets, narration, captions, validation, and rendering only to the extent required by representative videos.
- Judge completion using real video production rather than completion of framework components alone.

Accepted delivery gates inside MVP 1:

- M0: 15–30s visual draft through minimal skill/CLI/core, quickstart, and one reference profile; narrow runtime/safety proof.
- M1: a verified narrated pilot, story-block revision, captions, budget/receipts, source edit/undo, and final export.
- M2: two independent projects plus one profile-switch variant, scoped production preview, profile apply, music/SFX, and tested visual recipes.
- M3: Fatih's mixed skill/CLI/JSON dogfooding, recovery, human video/audio QA, and measured latency/cost/reuse.

Detailed milestone implementation plans are developed in `docs/plan.md` itself. No requirement for separate plan files, novice pilot, or an early GUI is introduced.

### First GUI release — after MVP 1 evidence

The user accepted the proposed control envelope for the first GUI: edit text and narration, replace assets, reorder and resize scene timing, transform/crop objects, select layout/transition/motion presets, and inspect waveform/caption timing. This defines a later authoring surface and is not part of MVP 1.

Manual keyframe editing is excluded from the proposed first GUI. Motion parameters such as speed, delay, direction, and intensity provide bounded adjustment. This exclusion will be reconsidered only if production evidence shows it is necessary.

## Example profile notes

User answer: “penjelasan isu terkini, misal saat ini baru saja terjadi erupsi gunung krakatau, aku mau jelasin sejarah krakatau, efek erupsi dll”.

User clarification: current issues are one intended account/profile. Users must be able to switch to other profiles and niches according to their needs. NaraFrame must not impose a current-affairs workflow on every project. Details about audience, publishing cadence, and editorial approval belong to a separate profile/account specification and are not requirements for the core tool.

Accepted profile-specific operating notes retained for later profile work:

- Intended audience: young and adult Indonesian viewers who follow current events and do not require specialist knowledge.
- Recommended duration: 60–90 seconds.
- Intended cadence: three videos per week.
- Target active human time: at most 60 minutes per video, excluding unattended generation and rendering.

Accepted profile direction; output quality still needs pilot evidence:

- Build the story around one viewer question per video. For the example, choose a clear question about the event's significance, then use the relevant history and mechanism to answer it.
- Store dated sources and distinguish current reports, established historical facts, and general possible effects. A general effect must not be presented as an observed consequence of the current event.
- For the current-issues profile, review the factual script before producing expensive assets or final narration. Retain source references with the project so updates can be traced to affected claims and scenes. Other profiles can have different editorial review requirements.
- Validate the accepted hybrid illustrated/infographic approach with a progressing explanatory scene; do not require physical simulation accuracy.

Further account strategy is outside the current core-tool interview.

## Confirmed visual capability

The user accepted the recommendation to support a hybrid of reusable infographic scenes and topic-specific illustrated motion. This is a capability envelope; each profile chooses its visual language and each scene uses motion appropriate to its explanation.

- Reusable foundation: typography, maps, timelines, comparisons, charts, labels, and connectors.
- Topic-specific illustration: layered SVG/PNG assets or native shapes animated using reusable reveal, path movement, masking, emphasis, and camera operations.
- For the Krakatau example, reuse the same volcano illustration across progressive explanatory beats, such as a cross-section, rising magma, and an illustrative eruption. Mark schematic depictions appropriately; do not imply physical simulation accuracy.
- Avoid restricting every topic to a fixed list of complete scene templates. Reuse layout and motion behaviors while permitting subject-specific visual assets.
- Keep photorealistic simulation, complex character rigging, and general 3D production outside the proposed first release.
- Topic-specific scenes use declarative layers and bounded semantic actions with static geometry/crop/fit. A generated flat image does not automatically provide separately animatable layers; request appropriate assets or use native composition.

M0 starts with text/media/composition and reveal/emphasize/focus. Additional map/timeline/stat/list/comparison/diagram capabilities begin as recipes and grow when reference videos need them. Dedicated components or new formats require evidence, not speculative upfront completeness.

## Corrections to earlier discussion

- Faceless does not imply programming content. The user has not chosen a niche. The Krakatau reference includes illustrated storytelling, which simple text/code/diagram scenes may not cover.
- Reusing motion primitives does not by itself prove good visual direction or narrative continuity.
- Switching fonts, palette, or motion can require layout revalidation. Switching voice or illustration style requires regeneration or asset replacement; it is not an instantaneous renderer setting.
- A reference to a profile version is insufficient for reproducibility. A complete project-local direction/config/assets snapshot is the accepted contract.
- Narrative role (hook, explanation, conclusion) and visual form (diagram, illustration, text) should be evaluated separately.
- The earlier single-source-master requirement is superseded by story blocks, not automatic per-scene/per-word generation. Localized revision is accepted; prosody across boundaries still requires listening and may need a wider, budgeted regeneration scope.
- Screenshots of a third-party GUI establish visible controls, not its implementation, editable project model, or reliability.
- Model names, pricing, and provider capabilities in the original draft remain unverified inputs. Do not use them as implementation commitments.

## Workflow

1. Interview: complete. Intended outputs, constraints, and explicit decisions are captured here.
2. Spec: approved design baseline revision 0.3 in `docs/spec.md`, with the corrected technical-user target, cost/revision contracts, and acceptance criteria. No implementation claim.
3. Refine-spec: historical RF review and accepted AR follow-up consolidated in `docs/refine-spec.md`. AR-01 withdrawn; AR-02–14 accepted-for-spec, runtime evidence not run. Both reviews were inline, not independent fresh-session validation.
4. Plan: approved M0–M3 delivery roadmap in `docs/plan.md`. Expand M0 there into a code/test/interface-level execution plan before implementation. Later milestones use actual earlier evidence.

The workspace started empty on 2026-09-07 and currently contains documentation only, without a Git repository. This is greenfield work: technical experiments and compatibility remain evidence tasks. The temporary dated review/revision-plan documents were consolidated into these four documents and removed to avoid competing authorities.

## Reference workflow

Andrea Bizzotto, “Spec-Driven Development with AI: Building a Real Flutter Feature Step by Step”:
https://codewithandrea.com/videos/spec-driven-development-with-ai/

The requested stages follow the article's spec → refine-spec → plan sequence. The article describes separate-session adversarial refinement; an inline review must be identified as an inline review, not claimed to provide independent validation.

## Product references supplied by the user

- Original master product and technical draft pasted in this conversation.
- Bang-Motion demonstration: https://www.threads.com/@fitrieffendi_edg/post/Dc7JVXAE6jH
- Hermes compatibility reply: https://www.threads.com/@fitrieffendi_edg/post/Dc7WXdYk_xt
- Desktop GUI reference: https://www.threads.com/@kazokufun/post/Dc7UFdrGOVK
- Bang-Motion repository linked in the demonstration: https://github.com/bangtutorial/bang-motion

These references inform evaluation, but no external implementation has been selected or audited for reuse.