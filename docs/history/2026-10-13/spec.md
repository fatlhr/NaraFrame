# NaraFrame MVP Product and Technical Specification

Status: Active product-direction revision; profile-first production and bounded expressive-authoring pilot planned, not implemented

Revision: 0.7

Date: 2026-10-04
Implementation status: M2 closed technically through PR #22 (`93c0a67`); M3.1-A integrated through PR #23 (`8463764`). M3.1-B/B1's audio correction was integrated through M3.P0 via PR #24 (`b1875e2`) with reused gates. D-VIS, pixel repeatability and measured comparative costs remain open. The TutorLog benchmark failed native final export without narration and was judged visually inferior to Bang Motion by Fatih. The new contracts below are requirements, not available capabilities. Execution order and historical dispositions are in `docs/plan.md`, section 0.

**Contract precedence.** Revision 0.7 supersedes the former global narration requirement, semantic-only authoring restriction, universal GUI-editability promise and historical requirement to finish Medan before new product work. Delivered version-1 declarative projects remain supported. Dated M0–M3 evidence and NF-AC-16/17 retain their original scope; no failed or deferred gate is retroactively passed. New implementation requires a separately authorized task.

## 1. Summary

NaraFrame is a local-first, profile-driven production system that helps one creator repeatedly turn briefs and reusable brand assets into visually strong, revisable vertical videos ready for upload.

NaraFrame consists of one production pipeline with two responsibilities:

1. The NaraFrame skill guides Codex through research, script writing, scene planning, asset preparation, narration preparation, validation, preview review, and revision.
2. The production core validates local inputs, resolves a pinned brand profile, tracks revisions/dependencies and coordinates preview/final artifacts. The existing declarative renderer remains supported; a bounded pilot will evaluate parameterized trusted Remotion compositions before selecting the next authoring contract.

The skill and core work in an interleaved loop. Codex invokes core commands at checkpoints instead of preparing the entire project before receiving validation.

## 2. MVP goal

Prove repeated multi-brand production: select a profile, supply a brief/assets and the desired audio mode, review a native-resolution video, request substantive revisions, and receive an approved final MP4 without designing engine features for each episode. Agent mediation is primary; manual files/CLI remain supported.

The MVP is successful when:

- a user can start from a topic in Codex;
- Codex can follow the NaraFrame skill and create conforming local artifacts using available external tools;
- the core can validate partial and complete project states;
- a complete project can produce a reviewable preview, contact sheet, report, and final MP4;
- the same pinned inputs reproduce canonical compiled inputs; frame evaluation is independent of playback order, with pixel repeatability measured rather than claimed from one green run;
- routine content/framing/asset/choreography revisions do not require production-core or renderer-adapter patches;
- three different LBC videos reuse one pinned profile, followed by a compatible profile switch without leaked logo, CTA or unrelated business claims;
- voice + music, music-only and explicitly timed silent projects can each reach legitimate final output when their own dependencies are ready.

Visual quality is a first-class product goal alongside revision control and reuse. The next decisive evidence is a same-brief TutorLog pilot against the owner's chosen Bang Motion result, then repeated LBC production (NF-AC-18–20). Primitive counts, schema strictness and test totals alone are not product success. Historical NF-AC-16/17 remain deferred under D-VIS, not prerequisites to this pilot or passed visual claims.

## 3. Product principles

### NF-PR-01: Vertical-first

MVP output is 9:16. Final rendering is native 1080 × 1920 at 30 fps. Preview defaults to fast 540 × 960, with an explicit native 1080 × 1920 review option; it is not an upscale of the draft. Resolution and draft/production readiness are independent. Current implementation only permits 540 previews; the high-resolution option is planned.

### NF-PR-02: Local-first

Projects, assets, generated build state, preview, and final output live on the local filesystem. MVP has no account, database, cloud storage, or hosted rendering requirement.

### NF-PR-03: Offline render

Compile, validate, preview, and render MUST NOT perform research, image generation, TTS, remote font loading, or other provider calls. Required production media must already exist locally. External network traffic is denied in both the Node process and browser; loopback required by the local renderer is permitted. Draft placeholders follow NF-PV-01 and cannot enter final output.

### NF-PR-04: Agent-neutral

The core accepts the same project and CLI commands whether operated by Codex, another terminal agent, a human, or a future GUI.

### NF-PR-05: Profile-driven identity

Editorial direction, branding, visual rules, caption behavior, and render defaults come from the selected profile rather than global NaraFrame assumptions.

### NF-PR-06: Semantic motion

Semantic forms/actions remain the default for supported declarative projects, not the only permissible authoring language. Parameterized compositions may use frame-indexed keyframes, interpolation, masks and local transforms internally. The user need not author keyframes. Do not expand a universal JSON animation language merely to translate every expressive composition into primitives.

### NF-PR-07: Measured extensibility

Prefer a small reusable composition that proves a real video over a broad capability catalogue. The initial experiment uses installed Remotion and the existing output pipeline. A trusted local custom composition is an explicit escape route when the recipe is insufficient; it is executable code, not passive asset data. Unreviewed code execution and automatic adoption of arbitrary packages remain excluded. Select one production route after the pilot; no multi-renderer framework.

### NF-PR-08: Layout-safe output

Declared geometry and appearance MUST render predictably. Required text may not silently clip, overflow, or collide with other required text. Image masking must match its declared shape. Automatic text fitting, when requested, is bounded by the active profile's minimum readable size; otherwise the build fails with an actionable issue.

### NF-PR-09: Visual storytelling without over-control

Composition, illustration, motion, continuity, and explanatory clarity are judged from the output. Automated aesthetic heuristics are advisory, not a substitute for that review. Negative space, restrained motion, and simple cuts are legitimate choices. Hard creative restrictions apply only when intentionally declared by the owner/profile; safety, source integrity, and required-text readability remain technical constraints.

### NF-PR-10: Reference-first visual delivery

When a working visual reference exists, inspect its actual playback and authoring/export mechanisms. Preserve the brief, copy, official assets and audio as the comparison control; composition and choreography may improve rather than imitate every frame. Prefer reusable parameterized mechanisms and expose the content/framing controls needed by the pilot. Do not implement the whole planned vocabulary before producing a visible comparison.

Matching an adapted reference proves fidelity, not independent creative superiority. The TutorLog quality decision belongs to Fatih and applies to that benchmark. Freeze the selected implementation before the three-video LBC trial; no per-episode engine patches.

Future GUI compatibility applies to declared content/profile/recipe parameters, not arbitrary composition internals. If the pilot remains weaker or needs repeated engine patches, stop expansion and consider the existing Bang Motion workflow as the alternative authoring/export route. Neither sunk costs nor a hypothetical GUI justify a poorer output contract.

## 4. Scope boundary

### 4.1 End-to-end user journey

The intended user journey begins with a topic:

```text
Profile + brief + supplied assets + audio choice
→ agent follows NaraFrame skill
→ copy/art direction/reusable composition + relevant local assets
→ prepared voice/music only when requested
→ staged core validation
→ preview and report
→ Codex/user revision loop
→ user approval
→ final render
```

The user MAY provide or edit any upstream artifact manually. Writing the script manually is not required.

### 4.2 Core boundary

The core begins with local structured artifacts. It owns:

- project/profile schema validation;
- profile resolution and override enforcement;
- asset resolution and safety checks;
- narration-driven or explicitly timed timeline compilation, according to the selected audio mode;
- scene/layout/motion rendering;
- caption/audio composition;
- preview, contact-sheet, report, and final output generation;
- deterministic fingerprinting, caching, and atomic build publication;
- local source revisions, staged edits, undo, and metadata validation without provider execution.

The core does not own:

- topic selection or research;
- factual verification;
- script generation;
- image/video generation;
- TTS or speech alignment;
- provider credentials or routing;
- publishing or scheduling.

### 4.3 Skill boundary

The NaraFrame skill owns the operating procedure used by Codex. It MUST:

- read the selected profile direction;
- establish art direction before scene authoring: concept, identifiable explanatory objects, framing, typography, surface/depth, movement, and relationships between shots;
- use relevant working starters, reference mechanisms, and supported reusable composition patterns; choose a pattern for the story rather than inheriting its example artwork or scene order;
- use provider/tool capabilities available to the current agent;
- check production readiness and budget before external generation;
- reuse valid assets, record operation receipts, and limit generation retries;
- create files using core-generated templates/schema;
- call staged validation early;
- respond to structured core errors;
- inspect preview artifacts and revise the project;
- request user approval before final render unless the user explicitly authorizes autonomous final export.

The skill MUST NOT duplicate the authoritative project schema or write `.naraframe/compiled.json` directly.

The skill MUST NOT default every brief to image-in-card plus text, inherit a reference's shot order as a universal template, or require the user to specify every animation parameter. It may iterate within the authorised brief without repeated micro-approvals. Material editorial choices, paid operations, and final-export approval retain their existing boundaries.

The controlled Medan fidelity experiment is an explicit exception to changing a reference's look: keep its selected artwork, fonts, composition, and timing fixed to isolate renderer losses. Record provenance and licence obligations; do not present adaptation as original creative work. Ordinary briefs, including LBC, derive their own visual language from their profile and subject.

Keep operational discovery compact: reuse known runtime/capability context while its version is unchanged, read only relevant authoritative schema sections, and do not reload full planning history for every creative revision. Before a large implementation batch, show a representative frame and short motion study. Within the M2.4 recovery, allow at most two internal visual correction passes per review checkpoint, then show the result or the specific blocker. Do not impose micro-approval for every object. These are authoring procedures, not new CLI commands.

## 5. Users and operating modes

### 5.1 Primary user

Fatih remains the first operator; installation and the manual route may assume familiarity with Codex, JSON, terminal, and local files. The approved M2.4 product direction also supports users who do not understand the schema: ordinary creative requests and revisions go through the agent. This is a usability requirement, not a claim that novice onboarding has already been validated or a mandate to build a GUI now.

### NF-UX-01: Technical-user ergonomics

Document command inputs/defaults/output paths and configuration fields. Errors identify the file, field or scene, reason, and corrective action. Normal content/style revisions MUST NOT require editing renderer code. Installation needs a quickstart and `doctor`; guided onboarding, mandatory starter-profile selection, and a nondeveloper pilot are not MVP requirements. The initial reference setup is Fatih's local macOS/Codex environment; other OS support is unverified until tested.

### NF-UX-02: Shared skill/manual workflow

Skill and manual routes use the same project format, validation rules, revision tracking, and artifact reuse. Users may switch between them within one project. Reuse installed runtime, profiles, and capability configuration across projects. Chat is convenient, not mandatory for every change.

### NF-UX-03: Plain-language revisions and future GUI authoring

Users can request changes such as “slow down the camera”, “replace this object”, or “change the visual identity” without learning JSON or writing code. The agent maps them to stable content/asset/recipe parameters and records affected dependencies through managed revisions. A bounded custom composition may require the agent to edit its trusted code; this is distinct from patching the shared engine. The resulting code/parameter changes must be revisioned, hashed and reversible. Only declared parameters are promised as future GUI controls. No GUI or onboarding wizard is added now.

### 5.2 Primary mode: chat-first

The user works in Codex. Codex reads the NaraFrame skill, creates or edits the project, calls the CLI, inspects results, and communicates approval/revision checkpoints.

### 5.3 Secondary mode: manual CLI/files

The user may call the same commands and edit the same JSON/Markdown artifacts without Codex. No custom GUI is required for MVP completion.

## 6. Interleaved production flow

### NF-FL-01: Project creation

1. User supplies a topic and profile.
2. Codex runs `naraframe create <name> --profile <profile> --json`.
3. Core creates a valid project skeleton and a pinned profile snapshot.

### NF-FL-02: Plan checkpoint

1. Codex prepares research notes, script, scene IDs, narrative roles, visual forms, and planned asset IDs.
2. Codex runs `naraframe validate --stage plan --json`.
3. Core validates machine-readable structure, declared references, and profile-required artifact presence while allowing production media to remain absent when declared as planned. It does not judge factual/script quality.
4. Codex fixes agent-responsible issues.
5. A profile MAY require user approval of script/sources before expensive production artifacts are created.
6. A labelled draft preview can be produced before all production media exists.

### NF-FL-03: Production checkpoint

1. Codex checks NF-CAP-01 and NF-CO-01, then prepares only needed local assets, narration blocks and local timing, caption grouping, music, and SFX within authorized limits.
2. Codex runs `naraframe validate --stage production --json`.
3. Core requires all render-critical inputs and validates timeline/layout readiness.

### NF-FL-04: Preview loop

1. Codex MAY run `naraframe preview --draft --scene <scene-id>` with provisional timing/placeholders, or `naraframe preview --scene <scene-id>` for production-ready selected dependencies.
2. Codex runs `naraframe preview --json` for the complete project.
3. Core produces preview video, contact sheet, sampled-frame manifest, and report.
4. Codex and user inspect the result.
5. Codex/user edits source artifacts through NF-REV-02 and repeats scoped validation/preview until accepted. Already authorized no-cost corrections do not need repeated approval.

### NF-FL-05: Final render

1. User approves the preview, or explicitly authorizes autonomous export.
2. Codex runs `naraframe render --json`.
3. Core captures/revalidates current sources and renders one immutable source revision. Approval references that revision, preview build, and reviewed scope; source changes require reconsideration of approval.
4. Core publishes one complete immutable build and atomically switches the final current-build pointer. `output/final.mp4` is a convenience export, not the build authority.

### NF-CAP-01: Production capability readiness

The skill checks available/unavailable/unverified capability status before production. Research depends on the profile/brief; image generation is optional when native or existing assets suffice. TTS is needed only when speech is requested and ready narration is not supplied; measured phrase timing is required for narrated production. Music-only/silent projects use explicit timing and require no TTS or dummy narration. Local readiness is checked by `doctor`, not inferred for external accounts.

Distinguish prepared-media diagnostics, no-new-spend visual draft, and narrated production. Missing TTS allows a labelled silent draft and actionable next step, not a narrated-success claim. MVP requires one documented and runtime-tested Indonesian narration/timing recipe outside core. Record tool/provider, settings, timing support, usage limits, price source/date when available, and recipe evidence; do not invent provider availability.

### NF-CO-01: Production budget and receipts

`production.json` stores provider-neutral policy and reported capability observations; current status is derived/rechecked, not trusted as a manually asserted success flag. Default policy:

```json
{
  "schemaVersion": 1,
  "mode": "no-new-spend",
  "budget": {"currency": "USD", "limitMinor": 0},
  "limits": {"maxGenerationAttemptsPerArtifact": 2},
  "capabilities": {
    "narration": {"status": "unavailable"},
    "phraseTiming": {"status": "unavailable"}
  }
}
```

- Before each generation operation, append an operation ID, artifact ID, request/generation key, authorization scope, and known upper estimate or unknown-price status to `production-events.jsonl`.
- Cash uses integer minor units in the configured currency. Track subscription/quota usage separately; unknown usage is never zero. No-new-spend permits existing/native assets and authorized included-quota tools, not unapproved new charges.
- Reserve a known upper estimate before a request. Require observed spend + unresolved reservations + next upper estimate <= budget. Unknown upper cost pauses spending unless explicitly authorized for that uncertain operation with stated scope.
- Start with sequential operations and a local append-only ledger, not a billing service. Concurrent generation remains disabled until reservation locking is tested.
- Reconcile succeeded, failed, or unknown results. Record charged failures. A timeout with unknown result retains its reservation and provider operation ID; check status instead of blindly resending.
- A resolved operation with unknown actual cost retains a conservative unresolved cost reservation until reconciled. Estimates are labelled, never reported as observed spend.
- Reuse valid artifacts first. At most two generation attempts per artifact before escalation, including failed attempts; budget and unknown-result rules can stop earlier.
- Receipts survive undo/cache clean and contain no credentials. Each JSONL record has `schemaVersion`; production metadata is validated locally, while execution and policy enforcement belong to the skill/orchestration helper outside renderer/provider-free core.

This is auditable workflow accounting, not universal hard billing enforcement over agent tools. Local rendering still uses compute/storage; host subscription and asset/font/voice usage rights are separate costs. Recheck the pinned Remotion license and intended distribution model before release. No free-video, exact cost/video, or unlimited included-quota promise is made.

### NF-CO-02: Separate development effort from content-production effort

M2.4 records engine development, content authoring, owner-requested revisions, and render/verification compute separately. For each trial retain the engine/skill version, brief, time to first visible result, elapsed/active time when measured, internal correction count, render count, renderer-change count, and owner interventions (creative feedback versus setup/coordination). Agent-operated CLI commands are not counted as manual user actions.

Record input/output/cached token usage and cost only when the host/provider supplies actual usage evidence, with its source and scope. Otherwise label them unavailable; schema bytes, line counts, subscription access, and zero media-generation calls are not token counts or zero total cost. Existing provider receipts remain authoritative for paid media, without adding a host-billing collector to core.

Content trials freeze implementation first. Do not compare a run that develops the engine to a reference run that only authors content and call the difference a per-video cost. Do not claim cheaper/faster than Bang Motion without comparable measured work. Routine revisions must not require the user to carry detailed review notes between agents; engineering handoffs are separate from the product's chat-first flow.

## 7. System architecture

```text
User
  ↓
Codex + NaraFrame skill
  ↓ filesystem + CLI
NaraFrame CLI
  ↓
Core schema / profile resolver / compiler / validator
  ↓ CompiledProject
Remotion renderer adapter
  ↓
Preview artifacts or final MP4
```

The CLI and project schema are the stable boundary between agent workflow and core execution. MCP is not required in MVP.

## 8. Repository architecture

Proposed workspace:

```text
NaraFrame/
├── packages/
│   ├── core/
│   ├── renderer-remotion/
│   └── cli/
├── skills/
│   └── naraframe/
├── profiles/
│   └── current-issues/
├── test-fixtures/
└── docs/
```

The core package MUST NOT import Remotion. Only the renderer package imports Remotion APIs. The renderer boundary exists to contain vendor-specific code, not to promise drop-in renderer replacement.

## 9. Project directory and authority

### 9.1 Structure

```text
my-video/
├── naraframe.json
├── profile.lock.json
├── narration.json
├── scenes.json
├── captions.json
├── production.json
├── production-events.jsonl # append-only; not reverted by undo
├── script.md              # optional globally; profile may require
├── sources.json           # optional globally; profile may require
├── assets/
│   ├── manifest.json
│   ├── images/
│   ├── video/
│   ├── svg/
│   └── profile/
├── audio/
│   ├── narration/          # immutable block clips
│   ├── music.mp3
│   └── sfx/
├── revisions/             # durable snapshots, manifests, current source pointer
├── .naraframe/
│   ├── compiled.json
│   ├── cache/
│   └── attempts/
├── preview/               # immutable builds/<id>/ + current.json + convenience exports
└── output/                # immutable builds/<id>/ + current.json + convenience exports
```

### 9.2 Authoritative artifacts

| Domain | Authority |
|---|---|
| Project and render settings | `naraframe.json` |
| Resolved creative identity | `profile.lock.json` |
| Ordered narration blocks, intended speech, local timing | `narration.json` |
| Visual scenes and beats | `scenes.json` |
| Caption grouping/emphasis and attributed display corrections | `captions.json` |
| Asset IDs, hashes, and provenance | `assets/manifest.json` |
| Production policy/capability observations | `production.json` |
| External operation/usage history | `production-events.jsonl` (append-only) |

The root artifacts above are an editable working copy. Managed preview/render consumes the immutable accepted source snapshot selected by `revisions/current.json`, not live files changing during a build. Capture valid manual edits before the next managed build/mutation (NF-REV-02). The snapshot includes policy configuration but never rolls back operation receipts or observed spend.

`script.md` and `sources.json` are optional upstream production/audit artifacts. They are retained with the project but are not direct renderer inputs. Profiles may require their presence and machine-readable source schema at plan validation; factual quality remains an agent/human review responsibility.

`.naraframe/`, `preview/`, and `output/` are generated, not editable source. Revision history, receipts, and referenced audio/images are durable and excluded from cache cleanup. Builds referenced by retained preview selections are preserved for undo; unreferenced cache is disposable.

### NF-PJ-01: Schema versioning

Every machine-readable source artifact MUST declare `schemaVersion` (each event for JSONL). MVP reads schema version 1 only. Unsupported versions fail with a migration-oriented message; no migration command is required until a later schema exists. Spec revision 0.6 is a design revision, not a deployed schema migration. M2.4 extensions must be additive: old version-1 inputs retain their coordinate/default behavior; older engines may reject new capabilities explicitly rather than silently ignoring them.

### NF-PJ-02: State derivation

Project state is derived, not manually stored:

- plan readiness: valid or invalid;
- production readiness: draft-only, needs-production, or ready, with missing/stale dependencies;
- preview status: absent/current/stale, with source revision, mode, and local/project scope;
- final status: absent/current/stale, with source revision and build ID;
- reuse status: artifact key matches or misses, independent of editorial approval.

A source revision can be schema-valid and needs-production, including after profile apply. A draft or scoped preview never proves full-project readiness.

## 10. Creative profiles

### 10.1 Source profile

```text
profiles/current-issues/
├── profile.json
├── direction.md
└── assets/
```

`direction.md` is read by the agent. It contains editorial approach, storytelling rules, visual language, asset guidance, factual-review checkpoints, and anti-patterns.

Creative direction supplies defaults and preferences rather than a mandatory scene template. Do not convert every design recommendation into a locked choice menu. Existing explicit locks remain authoritative until the user changes them.

`profile.json` is machine-resolved. It has separate `render` and provider-neutral `production` sections. It contains:

- `id`, `version`, and profile schema version;
- `render`: palette, typography roles, minimum readable type sizes, shape/media appearance tokens, safe zones, spacing, scene/layout/motion defaults, captions, and mix defaults;
- `production`: stable voice identity/style signature, illustration style signature, timing requirements, and asset policy used by the skill and profile invalidation;
- recommended duration and validation thresholds;
- locked and overridable configuration paths;
- capability requirements such as word-level timing.

### NF-PF-01: Selection before production

A project MUST select a profile when created. The agent reads its direction before writing production artifacts.

### NF-PF-02: Pinned snapshot

Creation resolves the source profile into `profile.lock.json`. The lock MUST include the complete resolved machine configuration, complete agent-direction text snapshot plus hash, referenced profile asset hashes, normalized source identity, and version. Render-critical profile assets MUST also be copied/content-addressed into the project.

Updating the source profile MUST NOT silently alter existing projects.

### NF-PF-03: Resolution precedence

Configuration resolves in this order:

```text
engine defaults
→ profile snapshot
→ project overrides
→ scene overrides
```

Profile-declared locked paths cannot be overridden. A locked override is a validation error. Accepted overrides remain explicit in source artifacts.

### NF-PF-04: Applying another profile

`naraframe profile apply <profile> --dry-run` MUST compare the candidate profile with the current lock and report effects without mutation. Applying uses NF-REV-02 for the whole source revision, not a separate lock-only rollback. Candidate schema/config and allowed overrides must validate; old production artifacts may become stale and yield needs-production. Regenerated voice is required for final rendering, not for committing a valid new profile. Effects are classified as:

- recompile;
- revalidate layout;
- regenerate narration;
- replace/regenerate profile-dependent assets;
- editorial/script review, including direction changes;
- existing overrides that mask the new identity or conflict with its constraints.

Core does not regenerate invalidated artifacts. The skill/agent handles them within the production budget. Preserve overrides that remain allowed. Conflicting overrides block apply until explicitly resolved; never silently discard them or bypass locked paths. Resetting them is explicit and reversible. The skill MUST dry-run first and expose production/editorial effects; use existing scoped authorization where applicable, otherwise request approval. Profile apply can be undone through source history.

Editing/cloning a source profile changes defaults for future use, not existing projects until apply. This is distinct from a project/scene override. Direct profile-file editing is supported; no profile GUI/wizard is required.

### NF-PF-05: Profile resolution

MVP profile inputs are either an explicit local directory or an ID resolved from the repository's `profiles/` directory. Remote and global user profile registries are excluded. Once locked, a project does not need the original profile path to compile or render.

### NF-PF-06: Brand, recipe and episode are distinct

- **Brand profile:** pinned identity/direction, audience, editorial constraints, approved CTA destinations/copy, local asset catalogue with roles/ownership/provenance, and audio/render defaults. Logo, tutor photo, product screenshot and background are different roles. Current profiles already pin direction/config/font and PNG assets; machine-readable CTA, audience, asset-role selection and audio-mode policy are planned additions, not implemented fields.
- **Content recipe/composition:** versioned reusable presentation/choreography with declared parameters, compatible asset roles and timing requirements. A profile recommends recipes rather than forcing one shot order.
- **Episode:** brief, verified claims/copy, selected asset IDs, framing, audio/timing, and composition parameters or an explicitly trusted custom composition. An episode does not silently modify shared brand defaults.

A profile switch dry-run must show brand-bound replacements, layout/audio effects, incompatible roles and editorial review. Unknown compatibility does not permit another brand's logo, person or CTA. Preserve neutral assets only when relevance is established; final blocks unresolved required identity bindings. Switching appearance never validates business claims: review meaning and preserve compatible facts with provenance or obtain an explicit content change. Undo restores the prior profile, recipe/code references, parameters and asset selections; receipts remain append-only.

## 11. Scene model

### NF-AU-01: Bounded expressive authoring (pilot contract)

Start with one trusted local Remotion composition and JSON-compatible content/profile/asset/framing/timing parameters, using the installed exact-version runtime. Stable IDs distinguish editable content from reusable presentation. The thin pilot bridge must use normal source revisions, preview approval, output metadata and atomic publication before claiming production-ready NaraFrame output. An isolated direct-Remotion study can inform the choice, but is not managed final success.

Trusted custom authoring is an opt-in local execution boundary, not a schema sanitizer or sandbox guarantee. Agent-produced code is untrusted until reviewed/explicitly accepted for that project. Requirements:

- resolve within designated project/bundled composition roots, with traversal/symlink checks; never execute SVG, Markdown or media as code;
- use pinned installed dependencies and local inputs only; no render-time network, providers, package installs, arbitrary shell execution or secrets/environment-based content;
- derive poses from frame/time and explicit seeds, not playback state, wall-clock time or unseeded randomness; seek/reverse-order checks precede deterministic-evaluation claims;
- hash composition identity/version, entry and local transitive code, parameters, relevant profile/assets/fonts/audio and runtime/settings into render keys; keep unrelated voice generation keys separate;
- retain code dependencies/parameters in immutable source snapshots or equivalent verified local bundles referenced by them. Code edits invalidate approval/render keys; undo restores code/inputs, not merely a path;
- document supported parameter edits and validation coverage. Layer-based collision/contrast checks cannot be assumed to inspect custom markup; use recipe-specific technical checks plus output review and disclose gaps.

No arbitrary-code auto-loader, universal plugin API, GUI code editor or portable renderer abstraction is required. Version-1 declarative projects retain existing coordinate/motion defaults. New authoring is explicit and advertised only after proof, with clear rejection by older engines. The pilot determines the smallest added source contract; it does not already exist.

### 11.1 Separation of meaning and form

Every scene has:

- stable unique `id`;
- `narrativeRole`, such as hook, context, explanation, evidence, conclusion, or CTA;
- `visual.type`, describing its render form;
- an owning narration block ID and local phrase references, or an explicit pause range;
- semantic visual beats;
- optional transition and allowed overrides.

Narrative roles are profile/editorial metadata. The engine does not equate `hook` or `CTA` with one fixed layout.

### 11.2 Initial visual types

M0 starts with `text`, `media`, and `composition`. The MVP capability envelope includes:

```text
text
media
stat
list
comparison
timeline
map
diagram
composition
```

Typed visual forms SHOULD use concise semantic content fields. `composition` provides a declarative layered canvas. Start stat/list/comparison/timeline/map/diagram as reusable recipes that expand into composition; dedicated visual components require a demonstrated recipe limitation. The schema/runtime capability registry advertises only implemented, tested forms. Building nine dedicated renderers is not a prerequisite for the first draft.

### 11.3 Layer types

The layered composition capability envelope supports:

```text
text
image
svg
video
shape
group
```

M0 requires text, image, shape, and group. SVG/video support is enabled only after their safety/decode gates pass. Layers may declare static geometry, crop/fit behavior, rotation, opacity, z-order, and semantic layout slots. Static coordinates use the 1080 × 1920 design coordinate system and are checked against profile safe zones.

### 11.4 Layer appearance and bounded layout

Text layers select a profile typography role such as `display`, `heading`, `body`, or `label`, with bounded per-layer overrides. A text box may declare `maxLines` and one explicit overflow policy:

- `error` is the default and blocks preview when required copy does not fit;
- `shrink` may reduce type only to the profile's minimum readable size, then fails if the content still does not fit.

Silent clipping and unbounded auto-shrink are prohibited. Text measurement uses the actual loaded font, size, weight, line height, letter spacing, and box width. Font readiness is required both in renderer preflight and in every browser context that paints output frames. A successful metadata/preflight font load does not establish render-context readiness. Verify the actual role face and weight in rendered frames, including a missing/corrupt-font failure; mocked measurements alone cannot close this requirement.

Image and shape layers may declare corner radius, stroke, and shadow using bounded tokens or validated numeric values. Image crop uses `fit` plus an optional normalized focal point. The rendered media wrapper clips to the same declared geometry so rounded images cannot remain visually square.

Groups are non-recursive through M2.3 and may use `absolute`, `stack`, or `grid` layout with bounded padding, gap, and alignment. M2.4 adds explicit parent–child grouping, local transforms, clipping, and reusable composition definitions. Existing schema-version-1 projects remain readable: omitted fields preserve legacy coordinates/defaults instead of acquiring project-specific renderer code.

M2.4 adds rich-text spans for emphasis and highlights and font-family selection per typography role. Measurement and rendering MUST use the same resolved spans, fonts, and styling; text effects must not change wrapping unpredictably. Local passive SVG and native path layers supply illustrations, lines, curves, and filled shapes. Independently animated illustration parts have separate stable object IDs rather than arbitrary DOM selectors or executable SVG animations.

### 11.5 Semantic beats

M0 actions are `reveal`, `emphasize`, and `focus`. Expand toward the following envelope when reference videos require it:

```text
reveal
enter
exit
emphasize
deemphasize
draw
flow
count
focus
```

Supported bounded parameters:

```text
durationMs
delayMs
direction
intensity
easingPreset
```

`focus` may use camera presets such as push, pan, or zoom. A beat MUST target a compatible layer/capability. Unknown actions, targets, or unsupported parameter combinations fail validation.

For the version-1 declarative path, raw keyframes and executable CSS/JS are not schema inputs. NF-AU-01 permits trusted composition internals without a universal scene schema.

M2.4 extends the vocabulary with object translation/rotation/scale, enter/exit, path drawing, path following, count-up/data growth, and text stagger/highlight. These are bounded semantic actions, not a free-form animation language. Each action declares its target and timing. Sequential actions preserve their preceding resolved end state; overlapping writes to the same target property are rejected with a source-targeted issue. Independent properties can animate together. Every pose is evaluated from the frame, without playback-order state. Text stagger is decorative unless verified word timing is explicitly referenced.

### 11.6 Camera continuity and transitions

M0 uses `cut`. M0.9 may add a bounded overlap or object-wipe transition only when the LBC benchmark demonstrates the need; later recipes may add `push` and `mask`. Transitions occur within existing visual intervals and MUST NOT alter the resolved narration timeline duration.

`focus` can move a scene or group as a camera/world rig. Declarative authors select supported presets/targets; expressive compositions can choreograph shared objects under NF-AU-01. Continuity should support the story, not force variety or one template onto unrelated content.

### 11.7 M2.4 composition, camera, and integration contract

- Reusable object/world definitions live in authoritative source data and are instantiated with stable identities and explicit per-shot changes. Reject cyclic or unresolved group/composition references. Shared definitions do not depend on the previous scene having played.
- Separate camera-affected world content from screen-space overlays such as headline/captions. Cameras support explicit target framing, sequential moves, and parallax. World labels follow their objects; declared screen overlays remain fixed.
- Add object-driven transitions and focus handoffs when required by the Medan sequence. They operate inside existing narration intervals, preserve audio duration, and explicitly include neighbouring visual dependencies in scoped previews.
- Preflight and rendering share the same nested transforms, camera projection, clipping, and motion states. Intentional world content outside the camera is not automatically a safe-zone error. Check required content in its intended visible states and report sampled coverage honestly.
- Scene/assembly keys include the resolved shared compositions, vectors, fonts, camera/motion, and transition dependencies. A shared edit invalidates every dependent scene, not unrelated audio or illustrations. Bump the render-engine identity whenever changed rendering can change pixels.
- `schema.capabilities` grows only after each new source-to-render path is implemented and tested. Existing CLI commands, source transactions, approval identities, and atomic publication remain the public workflow.

These are target contracts, not a claim that the complete vocabulary is implemented. M2.4.1 already has partial SVG/rich-text code with open review findings. Implement the minimum coherent camera/world/object/type slice required to retain opening quality first; the original layer-by-layer schedule is superseded by NF-PR-10. Extend remaining mechanisms only with the shots that need them.

## 12. Audio-mode-driven timeline

### NF-TL-01: Resolved composition clock

One compiled timeline has an explicit authority. Voice mode resolves ready narration clips/pauses; rendering does not generate or align speech. Music-only/silent mode resolves approved explicit scene/composition durations. Music never silently sets video length; trim/loop/fades follow that clock. Missing required voice is not converted to music-only by inference. Provisional placeholder timing remains draft-only; approved explicit timing without speech is legitimate production input after the new route is implemented.

### NF-TL-06: Production audio modes

The brief selects voice (optionally with music), music-only, or silent, subject to intentionally locked profile requirements. An unspecified choice can use the profile default but must appear in the rundown/result. Voice requires ready voice, text/style binding and measured timing; music-only requires ready music and explicit video timing; silent requires explicit timing and no accidental audio stream. Planned/corrupt media blocks final in every mode. Do not fabricate empty/silent narration to pass the old gate. Without speech, editorial text is composition content, not speech-derived captions.

Narrated timing and M3.1-B/B1 audio correctness remain intact. Production currently requires narration globally; implementing and proving these three export routes is scheduled work, not a result of this spec edit.

### NF-TL-05: Story-block authoring

`narration.json` contains schema version, an ordered list of block IDs, and block records. Each ready block contains a stable ID, intended generation text, local audio asset ID, measured `audioDurationMs`, nonnegative `pauseAfterMs`, ordered phrases with stable IDs/text and integer clip-local `startMs`/`endMs`, and optional word timing. Bind the ready audio to its generation text/settings hash in the asset manifest; intended speech changes cannot silently reuse stale voice.

Phrase/utterance timing is required. Word-level timing is optional unless required by the active profile or referenced by a beat/caption effect.

Use natural story sections/paragraphs, not a generated clip per word or automatically per scene. One block may own several scenes. Importing an existing complete master creates one block with a documented larger revision scope. Missing audio/timing may remain planned for draft use.

```json
{
  "schemaVersion": 1,
  "order": ["context", "mechanism"],
  "blocks": [
    {
      "id": "context",
      "text": "Krakatau memiliki sejarah erupsi yang panjang.",
      "audioAssetId": "voice-context",
      "audioDurationMs": 2400,
      "pauseAfterMs": 300,
      "phrases": [{"id": "context-p1", "text": "Krakatau memiliki sejarah erupsi yang panjang.", "startMs": 100, "endMs": 2200}]
    },
    {
      "id": "mechanism",
      "text": "Tekanan magma dapat meningkat.",
      "audioAssetId": "voice-mechanism",
      "audioDurationMs": 1800,
      "pauseAfterMs": 0,
      "phrases": [{"id": "mechanism-p1", "text": "Tekanan magma dapat meningkat.", "startMs": 100, "endMs": 1700}]
    }
  ]
}
```

With the corresponding ready asset manifest, block starts are 0 and 2700 ms; total duration is 4500 ms. Replacing only context with a 3000 ms clip moves mechanism to 3300 ms, retaining mechanism's audio and local timing.

### NF-TL-02: Scene ranges

Each narrated scene belongs to one block and references ordered phrases within it. The compiler derives local/global ranges. Reordering blocks moves their scenes and cues together. Visual scene order changes within a block must still respect phrase order; incompatible edits fail rather than rewriting speech automatically.

Normal inter-phrase silence belongs to the current scene until the next scene's resolved start. Leading silence belongs to the first scene of the block; trailing silence belongs to the last. `pauseAfterMs` holds the closing visual. A separate narrationless scene uses an explicit range within that pause, or a verified silent clip interval, with neighboring scene coverage adjusted accordingly. It must not cover audible speech by assertion alone.

At production readiness, scenes form one complete ordered partition of `[0, resolvedDurationMs)`. Transition overlap is visual only. Every boundary has one owner; normal breath gaps do not require authoring extra silent scenes. Draft scenes may use explicit estimated durations and are labelled provisional.

### NF-TL-03: Frame conversion

Time is stored as integer milliseconds. At 30 fps, boundaries compile using:

```text
frame = round(milliseconds × fps / 1000)
```

Compiled ranges are half-open: `[startFrame, endFrame)`. Shared boundaries are calculated once and reused by adjacent ranges to avoid duplicate or missing frames.

Reject zero-frame scenes/beats after rounding. The final end frame uses `ceil(resolvedDurationMs × fps / 1000)` so rounding cannot truncate audible tail samples. Audio trims/duration retain probed sample precision; integer-millisecond metadata has at most its quantization uncertainty. Rendering adapts exclusive ranges to inclusive APIs as `[startFrame, endFrame - 1]`. Synthetic scheduling tolerance is at most one frame at 30 fps; alignment/perceptual quality requires a separate listening check.

### NF-TL-04: Beat anchors

A beat may be anchored to:

- milliseconds relative to its scene;
- a block ID and phrase ID plus clip-local offset;
- a block ID and optional word ID plus offset.

Compiled beat time MUST fall within the target scene range after transition allowances.

### NF-REV-01: Localized production invalidation

Spoken-text edits invalidate the owning block's voice/timing and dependent compiled/render artifacts. Unchanged blocks retain audio and local timing while global offsets are recalculated. Story reorder or added pauses does not automatically regenerate speech; inspect narrative continuity and boundary-dependent music/SFX. Prosody may require regenerating a neighboring block: explain the expanded scope and apply budget rules before extra calls. No promise is made to encode only part of the final MP4.

## 13. Captions

Caption text is derived from narration. `captions.json` stores grouping, line-break, emphasis, and attributed display corrections rather than an independent intended script.

### NF-CAPTION-01: Display corrections versus intended speech

Keep generation text/hash, observed alignment transcript, and display correction distinct. A correction references a cue/phrase and records `displayText` plus reason. A typo/transcription correction needs no new voice if the audio is already correct; changing intended speech follows NF-REV-01. Block-local cue IDs remain stable when downstream offsets shift.

Default grouping uses phrase timestamps. Profiles may require word-level timing for active-word highlights.

Without word timing, long phrases use line wrapping or whole-phrase display. Estimated subphrase timing is draft-only and labelled, not precise final alignment.

The caption renderer MUST enforce profile rules for safe zone, maximum lines, minimum font size, grouping duration, and emphasis style. Text intended only for the visual composition is a scene text layer, not a caption.

## 14. Audio

MVP audio graph supports:

- zero or one narration track, required only in voice mode, assembled from local blocks/pauses;
- zero or one background-music asset;
- zero or more SFX cues associated with scene beats or explicit timestamps.

Music controls are limited to base volume, loop/trim, fade-in, fade-out, and narration ducking. SFX controls are limited to start time, volume, and optional fade.

The core MUST probe referenced audio duration and basic decode compatibility. It SHOULD warn about likely clipping or clearly unsuitable mix levels. Multitrack editing, EQ, compression UI, and automation curves are out of scope.

M1 proves narration/captions first; optional music/SFX enter at M2. The narrated pilot compares full-utterance continuity with block-based joins using consistent voice settings. Neither schema validation nor clip concatenation proves natural prosody.

## 15. Assets and provenance

### NF-AS-01: Local-only resolution

Render-critical asset paths MUST resolve within the project directory or explicitly bundled NaraFrame resources. Remote URLs, unresolved paths, and traversal outside allowed roots fail validation. Symlink resolution MUST also remain within allowed roots.

### NF-AS-02: Initial media support

The spike will prove a narrow set from:

- images: PNG, JPEG, WebP;
- illustration: SVG;
- video: MP4, WebM;
- audio: WAV, MP3, M4A;
- fonts: local WOFF2, TTF, or OTF.

The final supported matrix MUST reflect successfully tested formats rather than assumed browser support.

### NF-AS-03: Manifest

Every render-critical asset MUST have a stable ID, media kind, relative path, SHA-256 hash, and origin.

At plan stage, an asset may instead declare `status: planned` with ID, kind, purpose, and intended origin. A ready asset declares `status: ready`, relative path, and hash. A structurally valid asset can be stale against its current generation dependency key. Production validation requires each asset in the requested scope to be ready, intact, and current; full/final validation covers all render dependencies.

Origin-specific provenance:

- `web` or `licensed`: source and license metadata required;
- `generated`: asset hash, generation key, producing tool/provider/settings reference, and receipt reference required for NaraFrame-managed generation; no credentials. Imported generated assets may mark original provider/usage unknown instead of inventing provenance;
- `user`: external source metadata optional;
- `bundled`: NaraFrame/profile source and version required.

SVG content MUST be sanitized or rendered through an isolation approach proven by the spike. Asset hashes are verified before compile/render.

For M2.4, accept only a validated passive SVG subset. Reject scripts, event handlers, `foreignObject`, built-in animation, external references, and unsafe embedded content. Permit validated local gradients and clipping; asset-local IDs must not collide between instances. Preparation may convert unsupported art into supported passive assets, but loading/rendering must not silently discard unsafe content or execute it. Supported SVG must preserve visible root presentation attributes, text content, gradients, and clipping. Unsupported visible features must fail explicitly or undergo an explicit checked preparation step; they must not disappear under a successful import. Validate every URL-bearing paint/reference form, including external URLs wrapped in CSS-style `url(...)`, and reject executable content. Do not treat regex acceptance as browser-parsing equivalence.

Profile-dependent media MUST retain its style binding through edits and undo. After a relevant profile change, missing binding is unknown compatibility, not a match. Report it as needs-production/review and require an explicit recorded retention/rebinding decision or replacement before final export; do not invent provenance or silently claim old media was regenerated.

## 16. Compiler and deterministic contract

### NF-CP-01: Compilation

The compiler reads one validated source snapshot, resolves configuration/profile values, calculates frames and beats, resolves asset IDs, and writes canonical compiled input in the current attempt/build. `.naraframe/compiled.json` is a diagnostic convenience copy, never a shared mutable authority for concurrent operations. Reports identify production/draft mode and local/project scope.

Codex, users, and future GUI implementations MUST NOT edit the compiled artifact.

### NF-CP-02: Separate source, generation, render, and approval keys

| Key | Inputs and responsibility |
|---|---|
| `sourceRevision` | Exact canonical editable source snapshot; excludes receipts, generated outputs, timestamps, and history/preview-selection metadata |
| `generationKey` | Intended text/prompt, voice/model/settings, production signature, dependency hashes; finds a retained asset, not reproducible AI sampling |
| `sceneRenderKey` | Resolved scene content, used asset hashes, relevant render-profile subset, local timing/audio/motion, seed, engine/schema/dependencies/browser/FFmpeg/settings |
| `assemblyKey` | Ordered resolved scene/block inputs, global audio mix, export settings, renderer runtime; permits full final encoding |
| `approval` | Source revision, reviewed preview build ID, scope, timestamp, and any authorized autonomy |

The command-result field `fingerprint` identifies canonical compiled render inputs for its mode/scope (assembly for full render); it is not a separate CLI command. An editorial note can change sourceRevision and require factual review without invalidating pixel caches. Quality/encoding changes need not regenerate voice/images. Cache reuse does not carry approval to a different source revision silently.

### NF-CP-03: Determinism claim

With the same fingerprint and pinned runtime, NaraFrame must produce the same canonical compiled inputs and frame-derived animation independent of playback order. Pixel repeatability is a separate acceptance target with a known open failure, not a current product guarantee. Report differences from two fresh renders without retry-until-green or silently changing tolerances.

MVP does not promise byte-identical encoded MP4 files across operating systems or encoder builds.

Compile/render code MUST NOT use unseeded randomness, wall-clock time, network data, locale-dependent behavior, or remote fonts/assets. Any decorative randomness is seeded from explicit project/scene values.

## 17. Cache and output safety

### NF-CA-01: Safe rerun

MVP supports rerunning whole commands. It does not resume from the last rendered frame.

### NF-CA-02: Content-addressed generated state

Computed artifacts may be reused only when their relevant generation/scene/assembly key matches the current request. Retained audio/images are source media, not disposable cache. MVP needs targeted voice/image reuse and selected-scene preview; distributed caching and frame resume are excluded. Cache cleanup must not delete source snapshots, media, receipts, or selected retained builds.

### NF-CA-03: Atomic promotion

Each preview/render runs in `.naraframe/attempts/<attempt-id>/` on the same filesystem as its destination. After size/hash/decode checks, publish a complete immutable `preview/builds/<build-id>/` or `output/builds/<build-id>/` containing media, report, manifest, and review artifacts. Atomically replace one `current.json` pointer only after the build is complete. CLI reports resolve paths through that pointer/manifest.

Per-file rename is not atomic publication of a set. Stable convenience paths may be refreshed after promotion but are not authoritative. A crash/cancel before pointer promotion leaves the entire previous build current. A fallback copy must first populate and verify a complete sibling build, then switch its pointer. Never mix one build's report/contact sheet with another build's video.

### NF-REV-02: Transactional source edits and undo

`edit(stage, expectedRevision)` validates a staged source set, writes an immutable snapshot, then atomically switches `revisions/current.json`. One writer holds the project lock. A stale expected revision returns `REVISION_CONFLICT` without overwrite. Snapshots retain policy configuration and referenced immutable media. Separate revision metadata records parent ID, plain-language edit summary, and any preview selection valid for that revision; associating a later preview must not rewrite the immutable source or create a circular source/build hash dependency.

Before preview/render or another mutation, detect manual working-copy edits and capture them under the same lock after plan/schema validation. Missing production artifacts may yield needs-production, not transaction failure. Invalid manual edits remain available for correction; do not silently build an old snapshot as if those edits succeeded. Recovery preserves uncommitted working files before restoring a selected snapshot. M0 uses captured build inputs; durable user-facing history/edit/undo becomes available at M1.

Undo restores the previous accepted source/profile/media references and retained preview selection, without provider calls. Receipt history, actual spend, and unresolved reservations never roll back. Failed/cancelled staging preserves the old accepted snapshot. History/media pruning requires a separate explicit recoverable user operation, not automatic cache cleanup.

## 18. CLI contract

### 18.1 Commands

```bash
naraframe doctor
naraframe schema
naraframe create <name> --profile <path-or-id>
naraframe validate [project] --stage <plan|production>
naraframe preview [project] [--draft] [--scene <scene-id>]
naraframe render [project]
naraframe status [project]
naraframe edit <project> --from <staging-dir> --expect <revision>
naraframe undo <project>
naraframe profile inspect <profile>
naraframe profile apply <profile> [project] [--dry-run]
naraframe cache clean [project]
```

Project path defaults to the current directory where sensible.

Commands are delivered by milestone, not advertised before implementation: M0 doctor/schema/create/validate-plan/status/draft-preview; M1 production validation/full-preview/render/edit/undo; M2 production-ready scoped preview/profile inspect/apply/cache clean. `validate --stage plan` is the plan checkpoint, not a separate `plan` CLI command. Full-project `preview --draft` is allowed when every scene has declared draft timing, without claiming production readiness.

### NF-CL-01: Structured mode

`--json` emits versioned structured events/results to stdout. Human diagnostics/progress use stderr. The final event contains status, source revision, applicable fingerprint/build ID, mode/scope, readiness, artifacts, issues, duration, and command-specific metadata. Readiness and cache reuse are distinct from command success. Unavailable identifiers are explicit null/absent, never fabricated.

### NF-CL-02: Exit codes

```text
0 = command completed; warnings may exist
1 = project or validation failure
2 = system, dependency, or renderer failure
3 = incorrect CLI usage
130 = interrupted
```

### NF-CL-03: Issue structure

Each issue contains:

- stable `code`;
- `severity`: error, warning, or info;
- artifact/path and optional scene/layer/segment ID;
- `responsible`: agent, user, or system;
- human message;
- optional machine-readable details;
- suggested next action.

Errors block the requested stage. Warnings are reported but do not change exit code 0.

### NF-CL-04: Doctor and compatibility

`doctor` reports Node, package, browser, FFmpeg, font, filesystem, and renderer readiness. Skill and core version incompatibility produces a stable system-responsible issue. Preview/render MUST use an explicitly provisioned browser and fail with a structured system issue instead of downloading one implicitly. Any future setup/download command is separate and explicitly networked.

## 19. Validation

### 19.1 Plan-stage errors

- invalid schema/version;
- duplicate or invalid IDs;
- missing/invalid profile snapshot;
- locked profile override;
- invalid narrative/visual form;
- invalid layer/beat references;
- undeclared planned asset IDs;
- source/profile-required editorial artifacts missing.

### 19.2 Production-stage errors

- all plan errors;
- missing/corrupt/hash-mismatched asset;
- unsafe asset path;
- undecodable required media;
- missing narration phrase timing;
- stale narration generation text/settings binding;
- invalid timeline gap/overlap;
- beat outside scene;
- required word timing absent;
- caption outside required safe zone or clipped;
- `TEXT_OVERFLOW`: required text exceeds its resolved box or `maxLines`;
- `TEXT_COLLISION`: required text intersects another required text or an explicitly avoided layer at a sampled state;
- `MIN_FONT_SIZE_VIOLATION`: fitting would require text below the profile minimum;
- `FONT_NOT_LOADED`: the resolved font is unavailable when measurement/render begins;
- `IMAGE_MASK_INVALID`: rendered image clipping does not match its declared mask geometry;
- unsupported motion/layout/transition;
- duration beyond configured safety limit;
- renderer dependency unavailable.

Production-stage validation is coordinated by the CLI and contains two internal passes: renderer-independent static validation followed by renderer preflight for loaded fonts/media, text measurement, mask geometry, caption safe zones, and representative scene states. Draft preview runs the same visual preflight for every real asset and font it uses. Collision checks cover text against other required text and explicit avoid targets; a text layer may intentionally overlap its declared background/card. Preflight samples scene entry, settled states, semantic-beat peaks, transition boundaries, and the last visible state, and records the exact frames/states. It does not prove every intervening frame is safe or claim aesthetic quality. Intentional offscreen entry/exit is not automatically clipping failure; inspect motion boundaries/video as separate evidence.

### NF-PV-01: Scoped validation and draft readiness

| Request | Required scope | Missing input behavior | Readiness claim |
|---|---|---|---|
| `preview --draft --scene <id>` | Structurally valid selected scene, profile, declared draft timing | Labelled placeholders or silent draft for planned media | Draft only |
| `preview --draft` | Structurally valid project and all declared draft durations | Labelled planned-media placeholders | Draft only |
| `preview --scene <id>` | Ready selected scene and referenced shared assets/audio/transition handles | Selected dependencies block; unrelated scene issues reported separately | Selected scope only |
| `preview` | All production dependencies | Missing/stale dependency blocks | Full production preview |
| `render` | All production dependencies, current source, reviewed/authorized export | No placeholders, missing or stale inputs | Final export |

Unsafe paths, invalid executable content, broken global profile/schema, or invalid selected references never become permissive draft placeholders. When unfinished earlier blocks have unknown duration, compile the selected scene with `timelineScope: local` and unknown global offset. Do not invent absolute timestamps. Include required transition handles, or label an isolated cut preview and its transition limitation. Full final uses complete resolved offsets.

### 19.3 Warnings

- dense text or caption grouping;
- font below profile recommendation;
- scene remains visually unchanged too long;
- repeated motion/transition pattern;
- low-resolution source asset;
- audio mix near clipping or music likely masks narration;
- project outside profile recommended duration;
- provenance recommended but absent for generated/user assets.

## 20. Preview, rendering, and QA

### NF-QA-01: Preview artifacts

Each successful preview build contains:

```text
preview.mp4
contact-sheet.png
report.json
frames.json
manifest.json
```

Resolve these under `preview/builds/<build-id>/` via `preview/current.json`. Preview defaults to 540 × 960 with a planned native 1080 × 1920 option; both use 30 fps. H.264/AAC is used with audio; silent output has no audio stream and reports that fact. Scene preview follows NF-PV-01 and records isolated scope/music limitations. Resolution, frame checks, labels, artifact metadata and keys must agree. A high-resolution draft remains a draft; approval never authorizes placeholders in final.

### NF-QA-02: Contact sheet

The contact sheet includes scene entry, a settled composition, relevant semantic-beat peaks, transition boundaries, and the last visible state as applicable, rather than only one arbitrary frame per scene. It also includes frames associated with visual warnings. `frames.json` records the exact frame numbers/reasons and whether each frame was part of layout preflight.

### NF-QA-03: Final output

Final output is `final.mp4` in the selected immutable build, with `output/final.mp4` as a convenience export: native 1080 × 1920, 30 fps, H.264 and AAC when audio is requested, no audio stream in silent mode. Record encoding settings and consume the CLI artifact path. Ready music-only/silent output is not a draft fallback after NF-TL-06 is implemented. Final export approval is distinct from posting authorization.

### NF-QA-04: Build manifest

Preview/final build manifests record build ID, sourceRevision, fingerprint and applicable artifact keys, mode, local/project scope and known offsets, artifact hashes, source/profile/schema versions, Node/OS/architecture, Remotion package versions, browser, FFmpeg, render settings, checked QA frames, start/end timestamps, and success/failure metadata. Build status does not overwrite the production ledger.

Wall-clock metadata is excluded from the deterministic fingerprint.

### NF-QA-05: Human visual review

Automated checks do not establish motion quality. MVP skill requires review of preview video and contact sheet before final rendering unless explicitly waived by the user. Review covers actual corner masking, type hierarchy, text collision/overflow, crop and focal-point intent, motion continuity, and whether each shot communicates one dominant statement. A technically valid preview may still fail this visual gate.

M2.4 uses early matched-frame and short-motion review before broad implementation, followed by full playback against the Medan reference using NF-AC-16. Retain the rejected first opening and compare the recovered opening against the actual reference, not merely against that weak attempt. A frame/contact sheet cannot certify motion; a playback baseline remains required. Full NF-QA-01 preview publication remains the public acceptance path; internal stills or short motion studies are diagnostic artifacts and must not be presented as approved full builds. No new browser editor or still-only CLI is required by this revision. Transition counts, viewpoint counts, and panel dead-space warnings are diagnostic hints, not evidence of attractive motion or permission to remove intentional negative space. Aesthetic recommendations remain advisory unless the owner intentionally configured a hard creative restriction.

## 21. Security and trust boundaries

- Project JSON, Markdown, SVG, media, and agent-produced content are untrusted inputs.
- Passive project data/assets never execute JavaScript/TSX. Explicit trusted local compositions follow NF-AU-01; accepting code is a separate trust decision, not a result of JSON/media validation.
- Asset resolution prevents path traversal and symlink escape.
- Rendering does not load remote URLs.
- SVG handling is sanitized or isolated.
- Error reports MUST NOT expose provider credentials, environment secrets, or unrelated filesystem paths.
- Core provider credential storage is prohibited in MVP.

## 22. Technology direction

Proposed stack:

```text
Language/runtime: TypeScript on a pinned supported Node LTS
Workspace: pnpm
Runtime validation: Zod
Rendering: React + Remotion + FFmpeg
CLI: a small Node CLI framework
Testing: Vitest
Contact sheet: renderer stills plus a proven image-composition library
```

All `remotion` and `@remotion/*` packages MUST use the same exact version. No browser Studio/Vite application is created in MVP.

The installed Remotion 4.0.521 pipeline is the first pilot candidate; no upgrade or new dependency is authorized by this document. Bang Motion is a skill plus HTML/GSAP authoring/export workflow, not a replacement engine to import wholesale. Its local stage/world rig, explicit timeline and frame-seek/export mechanisms can inform trusted Remotion compositions. Keep local fonts/media, preserve licence/provenance obligations, and do not embed or flatten a reference video as proof. If the bounded Remotion pilot fails, evaluate the existing Bang workflow as one alternative route and choose explicitly; do not build simultaneous adapters/frameworks.

M2.4 may add exact-version-matched `@remotion/paths` to the renderer for path drawing/following. Core continues to store and validate renderer-independent data. This approved dependency direction is not an instruction to install packages during the documentation-only stage.

M0 includes a narrow spike to lock supported versions and the formats/settings needed for its first draft. M1/M2 extend the tested matrix as narrated/video/illustrated recipes need it. Current local installations are evidence for development availability, not product requirements. Create the initial lockfile with an ordinary install, then verify frozen reinstall; do not request frozen install before a lockfile exists.

The spike MUST prove explicit offline browser use; relying on Remotion's implicit browser download behavior is prohibited during preview/render.

## 23. Duration policy

Profiles define recommended content duration. The current-issues example may recommend 60–90 seconds, but that is not a global core rule.

The renderer defaults to a 180-second safety limit to catch accidental timestamps. Projects may explicitly increase it. Durations outside profile guidance are warnings; non-positive or safety-limit-exceeding durations are errors.

## 24. MVP deliverables

- Core schemas, loader, profile resolver, compiler, validator, and fingerprinting.
- Remotion renderer for the initial scene/layer/beat/audio/caption scope.
- CLI commands and structured report contract.
- NaraFrame operating skill for Codex.
- One real `current-issues` profile.
- A contrasting test-only profile to prove switching/invalidation without choosing the user's next public niche.
- Two independent source projects plus one derived profile-switch variant.
- Production capability recipe, budget/receipts, block-local voice revision, and source edit/undo.
- Technical and visual QA evidence, including the corrective LBC parity benchmark.

Earlier M0–M3 delivery evidence retains its scope. M2 closed technically; historical NF-AC-16/17 remain D-VIS, not passed. The next production sequence is checkpoint disposition → native audio-mode output/review → TutorLog authoring pilot/route choice → reusable brand controls → frozen LBC production/revisions/profile switch. Detailed sequencing is in `docs/plan.md`, section 0; old unfinished checkboxes are not automatic instructions to resume unrelated hardening.

## 25. Explicit non-goals

- custom NaraFrame GUI or browser Studio;
- unreviewed arbitrary code execution and a universal composition/plugin framework; NF-AU-01's trusted local escape route is in scope for the bounded pilot;
- a manual keyframe/curve editor (frame-derived composition internals are allowed);
- generic node/timeline editor;
- built-in research/image/TTS providers;
- provider API keys;
- MCP server;
- cloud render/storage, auth, collaboration, or multi-user projects;
- publishing, scheduling, or social platform integration;
- multiple aspect ratios;
- general 3D production, simulation or character rigging; a small perspective transform inside a trusted composition is not a new 3D-engine project;
- automatic fact-checking;
- frame-level render resume;
- schema migration tooling before a second schema version exists;
- byte-identical encoded video across different runtime environments;
- guided novice onboarding, mandatory starter-profile selection, or removal of the manual JSON/terminal route; NF-UX-03 still requires ordinary agent-mediated revisions without schema knowledge;
- generic billing service, concurrent generation scheduler, distributed cache, or automatic source-history pruning.

## 26. Acceptance criteria

### NF-AC-01: Core fixture path

Given a complete local fixture project, `validate --stage production`, full preview, and final render succeed with external network denied and required local loopback allowed. Missing browser fails without implicit downloads.

### NF-AC-02: Chat-first path

Given a topic, installed profile, and verified narration/timing recipe within authorized limits, Codex can follow the skill, create artifacts, call staged core validation, reach a narrated preview, incorporate revisions, and render after approval. Missing capabilities must produce a labelled draft/actionable report, but that fallback does not satisfy the narrated end-to-end acceptance case. No new provider call is required when valid prepared artifacts suffice.

### NF-AC-03: Reference scenarios

Two independent source projects plus one derived profile-switch variant prove three scenarios:

1. a current-issues explainer using map, timeline, diagram/composition, narration, captions, music, and SFX;
2. a derived variant of the first project after profile re-application, with snapshot comparison, invalidation report, and layout revalidation;
3. a different explainer using media, stat, list/comparison, and layered composition.

These original declarative reference projects render without per-project executable scene code. This preserves their compatibility evidence; it does not prohibit the separately accepted trusted-composition pilot in NF-AU-01/NF-AC-19.

### NF-AC-04: Manual correction

Visual-only text, asset references, compatible visual-scene assignment/order, timing anchors, layout/preset, motion parameters, caption grouping, and audio mix settings can be changed through source artifacts and reflected after preview without editing renderer code.

Changing intended speech invalidates its block's audio/timing and dependent cues/beats. Reordering blocks retains clips/local timings and recompiles offsets; report any continuity or dependent audio issue before expanding regeneration. Adding a pause or changing caption typography does not automatically regenerate narration.

### NF-AC-05: Failure behavior

Missing/corrupt assets, invalid timing, unsupported actions, unsafe paths, and locked overrides return stable structured errors. Failed or interrupted attempts preserve the previous successful preview/final output.

### NF-AC-06: Determinism evidence

In the pinned reference environment, repeated compilation produces an identical canonical manifest hash. Matching selected-frame pixel hashes remain an unfulfilled repeatability target, not a proven consequence of canonical input or frame-based motion; report measured differences and disposition them explicitly.

The reference environment includes the same machine/OS, browser executable and rendering backend, local fonts, Remotion packages, FFmpeg, and render settings. Cross-machine pixel identity remains unproven.

### NF-AC-07: Visual QA

Each reference project passes schema/runtime tests and a documented human review covering clipping, safe zones, legibility, caption timing, motion continuity, asset quality, narration intelligibility, and obvious template repetition.

Compile, preview, and final-render elapsed times and peak resource observations are recorded for the reference scenarios. MVP has no invented performance pass/fail threshold before these measurements exist.

### NF-AC-08: Profile isolation

Editing a source profile does not alter an existing project until explicit apply. Locked overrides fail. Accepted overrides and profile-apply effects are reproducible from project files/report.

### NF-AC-09: Agent operability

Every primary CLI command supports structured output, stable exit codes, actionable issues, cancellation, and project-path operation from Codex.

### NF-AC-10: Owner dogfooding across skill and manual routes

On Fatih's documented reference setup, preview a ready sample through the skill, change caption size in JSON, validate/preview via CLI, and return to the skill for export. All routes preserve one project contract without renderer-code edits. Repeat with an invalid field and verify its error points to source and remedy. Record steps/failures/elapsed time and generation calls; no nondeveloper pilot or ban on JSON/terminal is required.

### NF-AC-11: Capability and cost behavior

Use fake-provider tests before any paid pilot:

- budget 100 minor units, observed 40, unresolved reservations 40, next upper 30: deny request, no provider call;
- unknown result after timeout: preserve operation ID/reservation, no blind resend;
- caption color-only edit: zero image/TTS operations;
- unavailable TTS: draft permitted, narrated readiness absent;
- undo after a successful paid operation: receipt and observed spend remain;
- upper estimate known but actual usage unavailable: label unknown actual and retain conservative budget reservation;
- attempt limit reached: escalate rather than silently continuing.

### NF-AC-12: Localized narration revisions

Given three voice blocks, change the middle block's speech. Initially regenerate only that block; first/third audio hashes and local timings remain unchanged. Recompile downstream offsets and listen across both joins. Explain/authorize any necessary neighboring regeneration within policy. Also test reorder, a 1000 ms pause, two speech phrases separated by 300 ms, caption typo correction, and last audio sample coverage. Synthetic scheduling tolerance is one frame at 30 fps; actual speech/alignment correctness needs listening evidence.

### NF-AC-13: Scoped preview, reuse, and build integrity

- Ready scene 2 and missing scene 7 asset: selected preview succeeds, final fails.
- Missing required voice: draft reports provisional timing and the actual audio state; it cannot count as final-ready. An explicitly timed music-only or silent project follows NF-TL-06/NF-AC-18 instead and must not be rejected solely for lacking narration.
- Caption-only correction: no voice/image calls, unrelated scene key unchanged.
- Editorial note change: new sourceRevision, potentially reusable pixels, factual approval reconsidered as required.
- Crash before current-build pointer promotion: old video/report/contact-sheet remain one current build.
- External requests denied with required loopback allowed: render succeeds.
- Overflow occurring between sampled poses: report sampled coverage honestly; human motion review is separate.

### NF-AC-14: Source transactions and recovery

- Caption-size change then undo restores source/retained preview selection without providers.
- Spoken-block replacement then undo restores old audio references but retains replacement cost.
- Crash halfway through staging leaves the current source unchanged.
- Profile apply requiring new voice commits needs-production; final blocks; undo restores previous profile/media.
- Stale `--expect` returns `REVISION_CONFLICT` without overwrite.
- Invalid manual working-copy edits are preserved and reported, not silently ignored in a render of old sources.

### NF-AC-15: Visual fidelity and revision safety

Using the same LBC source intent and local assets as the direct-Remotion reference:

- every image declared inside a rounded frame is visibly clipped to that radius at rest and during motion;
- required text has no overlap, unintended clipping, or out-of-frame content at recorded preflight states and during full-video review;
- typography roles create a clear display/heading/body/label hierarchy without per-project renderer code;
- changing representative copy length either reflows within declared stack/grid bounds or fails with `TEXT_OVERFLOW`/`MIN_FONT_SIZE_VIOLATION`, never silently corrupting the frame;
- crop/focal-point, stroke, shadow, and padding changes are expressible through profile/project artifacts;
- Fatih accepts the full silent video plus the frames around seconds 8, 15, 21, and 27 as sufficiently faithful for NaraFrame to resume M1.

### NF-AC-16: Competitive Medan visual storytelling

**Historical benchmark contract, deferred as D-VIS.** The criteria below retain their original scope and remain unpassed; they do not dictate the new production pilot's authoring restrictions or sequencing. See NF-AC-18–20 and plan section 0.

**Early fidelity gate (M2.4.1):** compare the same 6–10s opening interval (the current reference boundary is 0–6.4s) at equivalent display size and matched times. Keep reference artwork, typography, framing and choreography as the control; document every unavoidable conversion or omission. Review an initial representative frame and 2–3s motion study before completing the opening. Both sides may be muted for the visual comparison; retain the original narrative schedule. Fatih must judge no relevant dimension worse, including within-shot continuity. A simplified replacement illustration, a clip of the reference, or a test-only composition bypassing public project authoring does not pass. This gate permits a faithful adaptation; it does not satisfy the full superiority criterion.

**Full benchmark gate (M2.4.4):** use the owner's Medan reference, the same narration audio/content, and approximately its 67.5-second duration. Preserve reference source/audio hashes and review actual playback; reading HTML is not visual acceptance. Compare at equivalent display size and matched narrative moments, recording resolution/fps/encoding differences. Do not treat the reference script's factual claims as independently verified by this visual benchmark.

Fatih rates five dimensions as worse/equal/better: composition/typography, illustration, motion/timing, continuity, and explanatory clarity. The gate requires no dimension worse and at least two better, with concrete scene/time observations. Inspect full playback and representative frames; no stand-ins or project-specific executable renderer code may satisfy the gate. Record owner approval and source/build identities. This is a benchmark-specific judgement, not universal superiority over Bang Motion.

### NF-AC-17: Cross-topic first draft and approachable revisions

**Historical benchmark contract, deferred as D-VIS.** The original trial criteria below remain recorded, not silently passed. Their silent-final exclusion and M3 entry rule were superseded; next production acceptance uses NF-AC-18–20.

**Early transfer gate (M2.4.2):** immediately after the recovered Medan opening is accepted and integrated, freeze the renderer, compiler/schema, CLI, bundled runtime/recipes, and skill revision. From one LBC brief and its existing assets, create a distinct 6–10s silent opening. Only project/profile/artwork data may change; no renderer code, new executable scene, or implementation/skill patch is allowed during the trial. Retain the first delivered draft before owner feedback and demonstrate a headline change and camera-speed change with undo. Fatih must consider the opening worth developing into a publication candidate. Failure blocks longer Medan work; record the missing capability and obtain a bounded recovery decision rather than silently patching the frozen engine.

**Full transfer gate (M2.4.5):** freeze the updated implementation again after the Medan build and extend the retained LBC project into a 30-second silent draft with a distinct visual language. The opening trial and the complete-video trial are separate records. If engine/skill changes after the first freeze affect it, rerun the opening regression on the second freeze before judging the full video. Do not copy the Medan shot order or patch renderer code for LBC. Retain the first delivered draft before owner feedback; log internal correction passes, elapsed time, external generation, and subsequent revisions under NF-CO-02. “One brief” allows internal agent iteration; it does not mean one model call or promise equal effort to the unmeasured Bang Motion run.

Fatih accepts the first draft as a plausible publication candidate, subject to normal editorial revisions. Exercise plain-language headline, camera-speed, object, and identity changes through the normal edit/preview/undo path. Preserve unaffected assets, validate shared dependencies and profile bindings, and explain any production impact. If renderer changes are required, the frozen-engine generalisation test has failed: retain that first result, obtain a scoped correction decision, protect the generic fix, and restart the affected trial from a clean source baseline on a new freeze. LBC uses `preview --draft`; silent final export is not added. M3 cannot start until NF-AC-16 and NF-AC-17 have evidence.

### NF-AC-18: Native audio-mode production and review

Voice + music, music-only and silent fixtures each reach production validation, full preview and approved native final 1080×1920/30. A native 1080 preview reveals final-size crop/type, with resolution-sensitive keys and correctly scaled checks. Music-only needs no narration; incomplete required voice still blocks. Verify streams/full decode/duration, retained approval/source hashes and narrated boundary regressions. No upscaling or dummy narration. Status (M3.P5, 2026-10-05): met on the voice+music, music-only and silent fixtures and the Batch C silent finals; see the P5 evidence register in `docs/plan.md`.

### NF-AC-19: TutorLog pilot and authoring-route choice

Reuse `work/tutorlog-promo/shared/BRIEF.md`, official assets and its exact prepared music. Retain old three outputs. Produce a new 20s/600-frame native final and 1080 preview with a reusable composition, not a rendered reference backdrop. Demonstrate non-destructive crop/subject positioning, differentiated type emphasis and background/asset separation, visible object motion and coherent transitions. Changing framing must leave original media hashes intact. Treat low-resolution invoice evidence honestly; neither upscaling nor redrawing invented UI adds source detail.

Fatih compares actual playback with the chosen Bang Motion MP4 at equivalent display size: composition/type, asset framing/separation, motion/continuity and communication. Pilot passes only when he considers the result at least comparable overall with no unacceptable weakness in those dimensions. Record concrete observations; do not claim universal superiority. At most two internal corrections per checkpoint (short study, then full video); if rejected after that bound, stop expansion and seek the route decision in plan section 0. Technical native export alone does not pass quality. Status (M3.P5, 2026-10-05): the route choice is made (parameterized trusted Remotion accepted as a technical approach); comparability with the Bang Motion result is not established and is not claimed.

### NF-AC-20: Repeated production, revision and brand isolation

After the route/profile controls are accepted, freeze core/renderer/CLI/skill/shared recipes. Produce three genuinely different LBC episodes from one profile, preserving first drafts, then exercise substantive copy and framing/asset changes and undo. At least one change must affect wrapping/shot communication, not just a label or file name. Deliberate recipe/choreography reuse is allowed. A compatible-content switch to another approved profile must replace brand-bound logo/CTA and identify neutral, incompatible and unknown assets/claims; it is not a false LBC-to-TutorLog endorsement. No per-video engine/skill/shared-recipe patch or user coding. Record revisions, actual media reuse and voice gaps, active/elapsed/render time and available costs separately; unknown remains unknown. Fatih reviews upload candidacy, and export/posting retain separate approvals. Status (M3.P5, 2026-10-05): accepted for internal production (three LBC episodes, PR #28); photo publication rights, recipe-param brand checks, voice reuse, active time/cost and pixel repeatability stay open.

**Historical acceptance disposition.** NF-AC-01–15 remain applicable within their tested scopes; NF-AC-02 gains non-voice routes through NF-AC-18, NF-AC-04/10/14 extend to composition parameters/code snapshots, and NF-AC-06 remains an open repeatability target. NF-AC-16/17 retain the original deferred Medan/LBC criteria; their old bans on silent final/custom code and M3 sequencing are historical, superseded by NF-TL-06/NF-AU-01 and the new plan. NF-AC-18–20 dispositions are recorded in the M3.P5 evidence register (`docs/plan.md`): NF-AC-18 met on fixtures, NF-AC-19 route chosen but quality comparability open, NF-AC-20 accepted for internal production only.

## 27. Post-MVP evidence gate

After MVP completion, use NaraFrame for at least 10 real videos before choosing GUI/provider/MCP expansion. Continue the pilot measurements of manual corrections, unsupported visuals, profile overrides, preview/render failures, voice-sync corrections, render time, generation attempts/reuse, and estimated/observed/unknown cost per video. Cost accounting starts before paid production, not after MVP.

Any future GUI may edit declared profile/content/recipe parameters. Editing arbitrary custom composition internals is not promised. GUI scope follows observed repeated production needs, not a constraint on today's pilot authoring language.

## 28. References

- Original “Motion System Generator — Master Product & Technical Plan” supplied by the user.
- Product discovery and decisions: `docs/discovery.md`.
- Andrea Bizzotto, “Spec-Driven Development with AI”: https://codewithandrea.com/videos/spec-driven-development-with-ai/
- Remotion programmatic renderer: https://www.remotion.dev/docs/renderer/render-media
- Remotion Player: https://www.remotion.dev/docs/player
- Remotion deterministic randomness guidance: https://www.remotion.dev/docs/using-randomness
- Remotion licensing and version guidance: https://www.remotion.dev/docs/licensing
- Remotion text measurement: https://www.remotion.dev/docs/layout-utils/measure-text
- Remotion text fitting: https://www.remotion.dev/docs/layout-utils/fit-text
- Remotion transition sequencing: https://www.remotion.dev/docs/transitions/transitionseries
- Bang Motion historical review snapshot: https://github.com/bangtutorial/bang-motion/tree/0f1bd1103835890354496d009af62885fe0a05d5
- Bang Motion working explainer starter: https://github.com/bangtutorial/bang-motion/blob/main/assets/starter-explainer.html
- Bang Motion art direction and visual verification: https://github.com/bangtutorial/bang-motion/blob/main/SKILL.md
- Bang Motion architecture and visual failure patterns: https://github.com/bangtutorial/bang-motion/blob/main/references/architecture.md and https://github.com/bangtutorial/bang-motion/blob/main/references/anti-ppt.md
- Remotion metadata/render context distinction: https://www.remotion.dev/docs/calculate-metadata

The moving upstream links identify mechanisms reviewed on 2026-09-20; execution must resolve and record the exact revision used for adaptation rather than assuming it is the historical snapshot.
