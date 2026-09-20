# NaraFrame MVP Product and Technical Specification

Status: Active product contract; M0.9 visual-fidelity correction approved

Revision: 0.4

Date: 2026-09-14
Implementation status: M0.1–M0.8 verified; M0.9 planned; M1 paused until the M0.9 gate passes

## 1. Summary

NaraFrame is a local-first production system for faceless vertical motion explainers. A user can give a topic to Codex, let the NaraFrame skill coordinate content preparation, review a generated preview, and ask the NaraFrame core to render the final MP4.

NaraFrame consists of one production pipeline with two responsibilities:

1. The NaraFrame skill guides Codex through research, script writing, scene planning, asset preparation, narration preparation, validation, preview review, and revision.
2. The NaraFrame core validates declarative project artifacts, resolves a pinned creative profile, compiles a deterministic timeline, and renders preview/final media.

The skill and core work in an interleaved loop. Codex invokes core commands at checkpoints instead of preparing the entire project before receiving validation.

## 2. MVP goal

Prove that one creator can repeatedly produce publishable 9:16 motion explainers through a chat-first Codex workflow while retaining manual control through project files and the CLI.

The MVP is successful when:

- a user can start from a topic in Codex;
- Codex can follow the NaraFrame skill and create conforming local artifacts using available external tools;
- the core can validate partial and complete project states;
- a complete project can produce a reviewable preview, contact sheet, report, and final MP4;
- the same pinned inputs can reproduce the same compiled project and frame pixels in a pinned runtime;
- revisions do not require editing renderer implementation code.

## 3. Product principles

### NF-PR-01: Vertical-first

MVP output is 9:16. Final rendering defaults to 1080 × 1920 at 30 fps. Preview defaults to 540 × 960 at 30 fps.

### NF-PR-02: Local-first

Projects, assets, generated build state, preview, and final output live on the local filesystem. MVP has no account, database, cloud storage, or hosted rendering requirement.

### NF-PR-03: Offline render

Compile, validate, preview, and render MUST NOT perform research, image generation, TTS, remote font loading, or other provider calls. Required production media must already exist locally. External network traffic is denied in both the Node process and browser; loopback required by the local renderer is permitted. Draft placeholders follow NF-PV-01 and cannot enter final output.

### NF-PR-04: Agent-neutral

The core accepts the same project and CLI commands whether operated by Codex, another terminal agent, a human, or a future GUI.

### NF-PR-05: Profile-driven identity

Editorial direction, branding, visual rules, caption behavior, and render defaults come from the selected profile rather than global NaraFrame assumptions.

### NF-PR-06: Semantic motion

Authors choose semantic visual forms and actions. Raw animation keyframes are not part of the MVP project schema.

### NF-PR-07: Measured extensibility

MVP favors a small tested capability set. Unsupported recurring needs become reusable engine capabilities after pilot evidence. Arbitrary per-project React/TSX scenes are excluded.

### NF-PR-08: Layout-safe output

Declared geometry and appearance MUST render predictably. Required text may not silently clip, overflow, or collide with other required text. Image masking must match its declared shape. Automatic text fitting, when requested, is bounded by the active profile's minimum readable size; otherwise the build fails with an actionable issue.

## 4. Scope boundary

### 4.1 End-to-end user journey

The intended user journey begins with a topic:

```text
User topic
→ Codex follows NaraFrame skill
→ research/script/scene plan/assets/narration
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
- narration-driven timeline compilation;
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
- use provider/tool capabilities available to the current agent;
- check production readiness and budget before external generation;
- reuse valid assets, record operation receipts, and limit generation retries;
- create files using core-generated templates/schema;
- call staged validation early;
- respond to structured core errors;
- inspect preview artifacts and revise the project;
- request user approval before final render unless the user explicitly authorizes autonomous final export.

The skill MUST NOT duplicate the authoritative project schema or write `.naraframe/compiled.json` directly.

## 5. Users and operating modes

### 5.1 Primary user

Fatih is the first creator/user. MVP installation and workflows may assume comfort with Codex, JSON, terminal, and local files. Subsequent users with similar skills are in scope; this is not an assumption about every AI user.

### NF-UX-01: Technical-user ergonomics

Document command inputs/defaults/output paths and configuration fields. Errors identify the file, field or scene, reason, and corrective action. Normal content/style revisions MUST NOT require editing renderer code. Installation needs a quickstart and `doctor`; guided onboarding, mandatory starter-profile selection, and a nondeveloper pilot are not MVP requirements. The initial reference setup is Fatih's local macOS/Codex environment; other OS support is unverified until tested.

### NF-UX-02: Shared skill/manual workflow

Skill and manual routes use the same project format, validation rules, revision tracking, and artifact reuse. Users may switch between them within one project. Reuse installed runtime, profiles, and capability configuration across projects. Chat is convenient, not mandatory for every change.

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

The skill checks available/unavailable/unverified capability status before production. Research depends on the profile/brief; image generation is optional when native or existing assets suffice; TTS is required unless ready narration is supplied; phrase timing is required for narrated production. Local renderer readiness is checked by `doctor`; it cannot infer external tools/accounts that it cannot inspect.

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

Every machine-readable source artifact MUST declare `schemaVersion` (each event for JSONL). MVP reads schema version 1 only. Unsupported versions fail with a migration-oriented message; no migration command is required until a later schema exists. Spec revision 0.4 is a design revision, not a deployed schema migration.

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

## 11. Scene model

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

Silent clipping and unbounded auto-shrink are prohibited. Text measurement uses the actual loaded font, size, weight, line height, letter spacing, and box width. Font readiness is part of renderer preflight.

Image and shape layers may declare corner radius, stroke, and shadow using bounded tokens or validated numeric values. Image crop uses `fit` plus an optional normalized focal point. The rendered media wrapper clips to the same declared geometry so rounded images cannot remain visually square.

Groups remain non-recursive in the initial implementation and may use `absolute`, `stack`, or `grid` layout with bounded padding, gap, and alignment. Existing schema-version-1 projects remain readable: omitted fields resolve through profile and engine defaults instead of acquiring project-specific renderer code.

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

Raw keyframes, arbitrary CSS/JS animation, and arbitrary executable components are excluded.

### 11.6 Camera continuity and transitions

M0 uses `cut`. M0.9 may add a bounded overlap or object-wipe transition only when the LBC benchmark demonstrates the need; later recipes may add `push` and `mask`. Transitions occur within existing visual intervals and MUST NOT alter the resolved narration timeline duration.

`focus` can move a whole scene or declared group as a camera/world rig around a bounded focal anchor. Authors select semantic presets and targets, not raw keyframes, arbitrary CSS/JS animation, or GSAP timelines. Scene-to-scene continuity SHOULD preserve a visual through-line when the content supports one; it must not force the same motion template onto unrelated topics.

## 12. Narration-driven timeline

### NF-TL-01: Resolved composition clock

One compiled timeline resolves ordered narration clips and explicit pauses. Rendering does not generate or align speech. Local clip durations are probed; the compiler derives global offsets. An assembled narration master, if generated, is derived output, never a mandatory authoring input. Draft-only timing is provisional and cannot authorize final rendering.

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

- one resolved narration track assembled from local block clips and explicit pauses;
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

With the same fingerprint and pinned runtime, NaraFrame MUST produce the same compiled manifest and selected frame pixels.

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

Resolve these under `preview/builds/<build-id>/` via `preview/current.json`. Default preview is 540 × 960, 30 fps, H.264/AAC MP4; an explicitly silent draft may omit audio and reports that fact. Scene preview compiles the required scope according to NF-PV-01, including exclusive-to-inclusive frame adaptation. Draft labels must be visible in preview and report; approval of a draft does not authorize final export of placeholders.

### NF-QA-02: Contact sheet

The contact sheet includes scene entry, a settled composition, relevant semantic-beat peaks, transition boundaries, and the last visible state as applicable, rather than only one arbitrary frame per scene. It also includes frames associated with visual warnings. `frames.json` records the exact frame numbers/reasons and whether each frame was part of layout preflight.

### NF-QA-03: Final output

Default final output is `final.mp4` in the selected immutable output build, with `output/final.mp4` as a convenience export: 1080 × 1920, 30 fps, H.264/AAC. Exact CRF/bitrate, pixel format, and color-space settings are selected by the renderer spike and recorded in the build manifest. Consumers use the artifact path reported by CLI, not assumptions about convenience-copy freshness.

### NF-QA-04: Build manifest

Preview/final build manifests record build ID, sourceRevision, fingerprint and applicable artifact keys, mode, local/project scope and known offsets, artifact hashes, source/profile/schema versions, Node/OS/architecture, Remotion package versions, browser, FFmpeg, render settings, checked QA frames, start/end timestamps, and success/failure metadata. Build status does not overwrite the production ledger.

Wall-clock metadata is excluded from the deterministic fingerprint.

### NF-QA-05: Human visual review

Automated checks do not establish motion quality. MVP skill requires review of preview video and contact sheet before final rendering unless explicitly waived by the user. Review covers actual corner masking, type hierarchy, text collision/overflow, crop and focal-point intent, motion continuity, and whether each shot communicates one dominant statement. A technically valid preview may still fail this visual gate.

## 21. Security and trust boundaries

- Project JSON, Markdown, SVG, media, and agent-produced content are untrusted inputs.
- No project artifact may execute arbitrary JavaScript/TSX in MVP.
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

M0.9 may add the exact-version-matched `@remotion/layout-utils` package for deterministic text measurement and fitting. NaraFrame does not adopt Bang Motion's HTML/GSAP/CDN runtime; Bang Motion is a composition and review reference only, preserving NaraFrame's declarative, offline, deterministic Remotion pipeline.

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

Delivery gates are M0 first 15–30s visual draft through skill/CLI, M0.9 visual-fidelity correction using the LBC benchmark, M1 narrated pilot with budget and reversible spoken edits, M2 reference projects/profile variation/scoped preview/music/SFX/needed recipes, and M3 owner dogfooding/reliability evidence. Each gate includes safety for the features it introduces. M0 remains complete for its original technical draft scope, but M1 may not start until M0.9 proves safe typography, masks, and revision-tolerant layout. Detailed sequencing and milestone evidence live in `docs/plan.md`.

## 25. Explicit non-goals

- custom NaraFrame GUI or browser Studio;
- arbitrary per-project TSX/React scenes;
- manual keyframes or curve editor;
- generic node/timeline editor;
- built-in research/image/TTS providers;
- provider API keys;
- MCP server;
- cloud render/storage, auth, collaboration, or multi-user projects;
- publishing, scheduling, or social platform integration;
- multiple aspect ratios;
- 3D production, complex simulation, or character rigging;
- automatic fact-checking;
- frame-level render resume;
- schema migration tooling before a second schema version exists;
- byte-identical encoded video across different runtime environments;
- guided novice onboarding, mandatory starter-profile selection, or no-JSON/no-terminal acceptance;
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

All reference projects render without per-project executable scene code.

### NF-AC-04: Manual correction

Visual-only text, asset references, compatible visual-scene assignment/order, timing anchors, layout/preset, motion parameters, caption grouping, and audio mix settings can be changed through source artifacts and reflected after preview without editing renderer code.

Changing intended speech invalidates its block's audio/timing and dependent cues/beats. Reordering blocks retains clips/local timings and recompiles offsets; report any continuity or dependent audio issue before expanding regeneration. Adding a pause or changing caption typography does not automatically regenerate narration.

### NF-AC-05: Failure behavior

Missing/corrupt assets, invalid timing, unsupported actions, unsafe paths, and locked overrides return stable structured errors. Failed or interrupted attempts preserve the previous successful preview/final output.

### NF-AC-06: Determinism evidence

In the pinned reference environment, repeated compilation produces an identical canonical manifest hash and repeated selected-frame renders produce identical pixel hashes.

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
- No voice: draft reports provisional timing and muted state; it cannot count as final-ready.
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

All acceptance criteria above are requirements, not passed tests. Current implementation/runtime evidence is tracked in `docs/refine-spec.md` and `docs/plan.md`.

## 27. Post-MVP evidence gate

After MVP completion, use NaraFrame for at least 10 real videos before choosing GUI/provider/MCP expansion. Continue the pilot measurements of manual corrections, unsupported visuals, profile overrides, preview/render failures, voice-sync corrections, render time, generation attempts/reuse, and estimated/observed/unknown cost per video. Cost accounting starts before paid production, not after MVP.

The first GUI may edit text/narration, asset selection and crop/transform, scene order/timing, layout/transition/motion presets, and waveform/caption timing. It remains constrained by the same source schemas and compiled representation.

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
- Bang Motion composition reference, pinned review snapshot: https://github.com/bangtutorial/bang-motion/tree/0f1bd1103835890354496d009af62885fe0a05d5
