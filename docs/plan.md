# NaraFrame — Development Plan

Revision 2.1 · 2026-10-17 · Integrated baseline `a701c399211ba2584f439b59814e8a2d41614e0f` (MVP 2 Batch 3, PR #34)

**Current step:** MVP 2 is integrated; follow-up batches B1–B5 (F1, F6, F2+F3, F4, F5) are integrated through their own PRs. Next is B6 (F7 with the public README C1), which needs Fatih's decisions on engine publication and the code licence.

[spec.md](spec.md) is the product contract. [refine-spec.md](refine-spec.md) records production findings and decisions. [History](history/README.md) preserves the long M0–M3 record, old discovery, and the local Batch F closure before this rewrite.

## 0. Baseline and prior closures

MVP 1 comprises M0–M3. M2 closed for technical scope only. M3's numbered production batches and subsequent explicit recipe binding/text-fit work are integrated. This is not a retrospective approval of deferred visual or publication claims.

| Integrated group | PR / main checkpoint | Disposition |
|---|---|---|
| M0–M2 foundations | Historical task records; M2 closure #22 / `93c0a67` | Technical scope closed; D-VIS open. |
| M3.1-A interruption/recovery | #23 / `8463764` | Graceful render interruption protected; SIGKILL descendants remain open. |
| M3.P0 audio / documentation | #24 / `b1875e2`; #25 / `a54d8b6` | Integrated real export/audio correction and revised production direction. |
| Batch A, M3.P1a/P1b/P2a | #26 / `9ec2b69` | Modes/native preview integrated; parameterized Remotion route accepted technically. |
| Batch B, M3.P2b/P3 | #27 / `0789c47` | Trusted recipes, exact-byte staging, declarative brand contracts. |
| Batch C, M3.P4 | #28 / `00a3269` | ACCEPTED_INTERNAL; three LBC finals, not publication clearance. |
| Batch D, M3.P5 | #29 / `ef88eb7` | CLOSED / INTEGRATED; post-merge review recorded as post-merge, not pre-merge sign-off. |
| Batch E, M3.E | #30 / `cfa244e` | CLOSED / INTEGRATED; explicit recipe identity/palette binding. |
| Batch F, M3.F | #31 / `e008490` | CLOSED / INTEGRATED; declared-slot text fit and slot-scoped cache invalidation. |

The snapshot includes the local **Batch F integration closure** and earlier handoffs. It preserves SHA/tree checks, failures, corrections, evidence provenance, and historical task checkboxes rather than silently marking unsupported ones complete.

### Acceptance carried forward

- NF-AC-06 repeatability: OPEN. Historical pixel variants and interruption/harness timeout caveats remain recorded.
- NF-AC-16/17: D-VIS OPEN/deferred. No competitive visual/publication/export gate is inferred from technical closure.
- NF-AC-18: MET in recorded technical fixtures for audio modes, native preview, and narrated boundaries.
- NF-AC-19: route accepted; parity with Bang Motion OPEN.
- NF-AC-20: ACCEPTED_INTERNAL. Public photo rights remain unresolved.
- Batch E/F: declared binding/slot protection only, not arbitrary recipe validation or a sandbox.

The fuller open register is in [refine-spec.md](refine-spec.md). It remains backlog unless a scoped task explicitly adopts an item.

## 1. Execution rules

1. Follow FDD per user-visible feature: define model and runnable acceptance, implement the real path, show output/manual acceptance, add focused tests, then run integration checks before merge.
2. Use the pinned Node/pnpm and existing CLI. Core stays independent of Remotion. Schema additions remain compatible with source version 1 and existing opted-out projects/recipes.
3. Skill and library changes require fresh-context authoring evidence. Do not count Markdown review or a scene built by someone who read the renderer as proof of that acceptance.
4. Read the public skill/schema first. If authoring requires private source inspection, record the gap rather than hiding the cost in a successful trial.
5. Preserve first drafts before feedback. Use a representative shot or contact sheet before full renders. At most two planned internal correction passes per trial checkpoint; report remaining issues.
6. Freeze engine, built runtime, skill, profile, library/recipe, media, and timing before acceptance trials. Hashes and trust scope belong in the handoff. A fix during freeze starts a distinct approved attempt; retain failed attempts.
7. Track elapsed/active time separately when available, correction count, reused media/builds, and provider calls. Unknown fields stay unknown.
8. No new generation cost by default. Recipe trust, replacing a master, Git integration, and publication need their own authority. Aesthetic acceptance belongs to Fatih.
9. Updated by Fatih on 2026-10-14: confirm the next work package before execution, especially costly operations. During MVP 2 development use the authorized output/manual path and focused unit/integration checks; keep `pnpm verify` as the integration check. Defer E2E to the final M4.5 closure, including when a development batch changes renderer/runtime boundaries. Record skipped/deferred gates and existing failures honestly; deferral is not a pass. Obtain confirmation before the final E2E run. This supersedes the earlier per-batch E2E schedule, not historical evidence.
10. Keep implementation decisions in these documents. Do not create a parallel roadmap or advertise planned work in `schema.capabilities`.

**MVP 2 Git exception authorized by Fatih — 2026-10-14:** keep `main` at the integrated baseline while developing the remaining three-batch sequence. Commit each completed batch, create the next branch from main, then cherry-pick the predecessor's cumulative MVP 2 commits before adding that batch's work. This explicitly supersedes the usual requirement to merge a predecessor before starting the next numbered task. Preserve each batch branch/checkpoint; do not rebase/discard user work or silently integrate main. Final E2E and acceptable final output precede main integration. Commit/cherry-pick and development are authorized; no intermediate push/PR/merge is requested.

Current `pnpm naraframe` acceptance commands run from the repository root. M4.5's installed-engine commands intentionally run from an isolated consumer directory. Production project paths stay outside the repository. `SCENE_ID`, `SOURCE_REVISION`, and `BUILD_ID` come from project/status, not literal IDs to hard-code. New commands and packaging syntax are proposed contracts until implementation/manual evidence; do not advertise them as available.

## 2. M4 — MVP 2: Skill-led recurring production

**Goal:** make repeated content production easier and visually deliberate through better skill instructions, reusable library data, and the minimum supporting engine contracts. The 2026-10-15 addition includes preparing engine/skill distribution and onboarding for use outside this development checkout, with or without Claude/Codex.

**Not authorized by this plan:** M4 feature implementation, recipe trust for new code, or paid generation. All tasks start PLANNED. Fatih's separate 2026-10-13 authorization covers commit/push/PR/squash-merge of this cleanup/documentation package only.

Subsequent authorizations: Fatih approved Batch 1 implementation and accepted its output; on 2026-10-14 he authorized committing it and continuing Batch 2, then Batch 3, under the cherry-pick workflow above. New paid calls, new recipe trust, and publication remain separate decisions.

On 2026-10-15 he authorized the M4.4 commit and inclusion of distribution/cleanup/README in the current scope. This turn implements documentation/research only for that addition. Confirm the expanded M4.5 package before code/install/render work; do not create another roadmap or separate relay task for each internal step. Public npm/GitHub release, changing repository visibility, marketplace submission, licensing and machine-wide installs remain separate decisions.

| Task | Status | Dependencies | Main acceptance | Review batch |
|---|---|---|---|---|
| M4.1 Art direction and production vocabulary | OWNER_ACCEPTED / INTEGRATED `a701c39` | Integrated M3 baseline | NF-AC-21, fresh-context representative shot | 1 |
| M4.2 Captions separate from narration | OWNER_ACCEPTED / INTEGRATED `a701c39`; final serial E2E passed | M4.1 | NF-AC-22, none/selected/full with intact audio/reuse | 1 |
| M4.3 Library and pinned assets | OWNER_REVIEWED / INTEGRATED `a701c39` | M4.1–M4.2 committed/cherry-picked under owner exception | NF-AC-23, editable pinned imports and reuse/undo | 2 |
| M4.4 Prepared audio and series identity | TECHNICALLY_READY / INTEGRATED `a701c39` | Batch 2 cumulative commits cherry-picked through `15d67c1` | NF-AC-24, verified master/timing and reusable identity | 3 |
| M4.5 Distribution, production trial and MVP 2 handoff | CLOSED / INTEGRATED `a701c39`; exported, not published | M4.1–M4.4 | NF-AC-25–27, approved MP4, consumer engine/skill installation and onboarding | 3 |

### M4.1 — Art direction and production vocabulary

**Reason:** agents currently spend too much effort reconstructing layout and motion technique. The skill should translate narration into explanatory objects and shot relationships using the capabilities already shipped.

**Scope:** skill-led. Library examples support the skill; no new motion primitive is assumed. Cover beat purpose, main object, framing, hierarchy, choreography, pace changes, and continuity through focus/direction. Distinguish a neutral cut from a missed transition. Include editable examples for object explanation, a route/diagram, data comparison, spatial pullback, headline emphasis, and a quiet shot. Use profile preferences without imposing one creative template globally.

**Acceptance command:**

```bash
pnpm naraframe validate ../NaraFrame-projects/mvp2/art-direction --stage plan --json
pnpm naraframe preview ../NaraFrame-projects/mvp2/art-direction --draft --scene representative --json
```

Expected: an 8–12 second shot with a recognizable explanatory object, deliberate type hierarchy and motion. A fresh session authors it from brief, skill, public schema, and listed assets without renderer-source reading or repeated supervisor help. Its first draft is saved before owner feedback. This proves the authoring path, not Bang Motion equivalence.

- [x] Define a short authoring procedure and bounded visual vocabulary before editing skill/examples.
- [x] State which existing declarative or trusted-recipe path each pattern uses; list editable parameters, dependencies, and limits.
- [x] Include examples that change explanation/framing, not just colors on the same card.
- [x] Run one fresh-context authoring trial; record exactly what the agent read, commands, help, timing, and corrections.
- [x] Save first draft, contact sheet, source, and frame/shot evidence; obtain owner review of the representative output.
  - Saved first draft and revised output. After reviewing the supplied preview, Fatih explicitly accepted M4.1 as authoring evidence on 2026-10-14. Fresh authoring used controller-assisted renderer escalation/runtime setup, not private renderer reads; this remains bounded supported authoring evidence, not a claim of repeated independent success or Bang Motion parity.
- [x] Revise headline and camera tempo through ordinary project revisions, without private renderer edits.
- [x] Add focused example/schema checks and a skill regression trial for any discovered authoring gap.
- [x] Check legacy examples and registry truth; run `pnpm verify` for integration. No full renderer E2E unless a runtime boundary actually changes.

**Out of scope:** a new effects engine, universal motion quotas, global realistic-art requirements, automatic copy generation guarantees, or a new provider.

### M4.2 — Captions separate from narration

**Reason:** caption policy cannot safely be expressed with zero-width characters or off-screen elements. It needs an explicit contract independent of spoken text and voice generation.

**Scope:** skill explains when captions add value; profile owns styling/layout defaults and intentional locks; engine implements additive `none/selected/full`, selection/timing, rendering, preflight, and render keys. Settle exact schema and precedence in the feature model. Omitted policy on legacy projects preserves the current caption behavior. Selected captions use verified phrase/local timing without pretending to be word timing.

**Batch 1 feature model (2026-10-13):** additive `captions.json.mode` is `none`, `selected`, or `full`; precedence is this declaration, then `profile.render.captions.mode`, then legacy `full`. Profile locks on `render.captions` or `render.captions.mode` reject a differing source mode, including draft/scoped previews. Existing `naraframe.json.overrides` remains the only style override path and retains its allow/lock checks. No caption policy can remove narration.

`captions.json.selections` contains unique `{blockId, phraseId, startOffsetMs?, endOffsetMs?}` targets. Offsets are phrase-local, measured milliseconds, bounded by the phrase; omission uses its complete verified range. `selected` with no entries means no captions. Invalid/unknown targets or inverted/out-of-range windows produce directed errors, not invented word timing. Existing display corrections remain independent of selection and narration text. Full/scoped compilation uses the same resolved cues and frame rounding, then clips to the scene when scoped.

Styling extends the existing profile caption tokens with optional `sideOffset`, `scrimOpacity`, and `lineHeight`; legacy defaults stay 48 design pixels, 0.72, and 1.3. Font family/weight and colors still come from profile typography/palette. Renderer and preflight consume the same resolved style. No cues means the compiled captions object is absent, with no caption measurement/collision region. Renderer behavior changes bump the engine identity; voice generation identity does not change.

**Acceptance commands:** use three source revisions of one narrated fixture, saving status/build evidence per revision.

```bash
pnpm naraframe validate ../NaraFrame-projects/mvp2/captions --stage plan --json
pnpm naraframe preview ../NaraFrame-projects/mvp2/captions --draft --json
pnpm naraframe preview ../NaraFrame-projects/mvp2/captions --resolution 1080 --json
```

Expected: full captions follow narration; selected captions appear only at declared cues; none leaves no glyph, scrim, reserved layout region, or caption-only preflight box. Frame count, narration timing, master hash, and voice generation key remain intact. Caption changes invalidate visuals, not voice.

- [x] Model policy, selection, layout/style inheritance and override/lock semantics; define migration defaults.
- [x] Implement the CLI authoring/preview path and teach it in skill with plain-language revision examples.
- [x] Have a fresh session apply an ordinary caption-policy/style revision using the skill and public schema, without reading the renderer.
- [x] Show none/selected/full at 540 and 1080, including cue boundaries, empty selections, multi-line text, and profile overrides.
- [x] Inspect pixels/layout, not merely absence of text in JSON; compare scrim-on/off and reserved-space behavior.
- [x] Prove unchanged narration/audio and voice key; undo restores source and reuses the matching prior build.
- [x] Add regressions for legacy defaults, invalid selections, boundary timing, style/locks, preflight, cache invalidation and undo.
- [x] Run `pnpm verify`; preserve focused checks and consolidated Batch 1 evidence. Serial full E2E deferred to M4.5 by Fatih on 2026-10-14, not marked passed.
- [x] Advertise only implemented caption forms with named evidence in the candidate registry; collect Batch 1's consolidated handoff. Git integration still requires authorization.

**Out of scope:** karaoke/word-level native motion, audio rewriting, or forcing Bang Nalar's caption position/font onto other profiles.

### M4.3 — Library and pinned assets

**Reason:** a recurring series should change copy, media, and pose without recreating artwork technique. Shared catalog updates must not invalidate an approved episode invisibly.

**Scope:** skill chooses library-first patterns and checks suitability; library supplies stable IDs, versions, parameter contracts and media metadata; engine supports explicit import snapshots/references and their revision/key/binding behavior where needed. The feature model chooses the smallest import interface. A catalog is an authoring source, not a live runtime dependency.

Metadata covers viewport/ROI, focal point, padding, and named attachment anchors for supported asset/pose/prop use. Declare units and transform ownership. Do not assume metadata can infer anatomy or repair every crop. Versioned recipes retain existing trust rules; provenance and license travel with imported assets.

**Feature model — 2026-10-14:** local passive `catalog.json` has schemaVersion1, stable catalog ID/version/provenance, ready asset dependencies, optional local recipe dependencies, and named/versioned scene patterns. Patterns are ordinary source-v1 scene templates with typed string/number/asset parameters bound to explicit JSON pointers; no expressions, remote dependencies, mutable `current`, or alternative motion runtime. Importing expands the template into editable scene data, not a new runtime visual type.

- Public `library inspect CATALOG` reports patterns/dependencies/provenance. `library stage PROJECT --from CATALOG --pattern ID --version VERSION --instance ID --scene SCENE --params PARAMS.json` captures bytes and produces a new staging artifact; it does not mutate the project. The result includes the source revision to pass to existing `edit --from STAGING --expect REVISION`. A version is required, dependencies are checked before staging, and captured bytes rather than later rereads are copied.
- Optional `naraframe.json.libraryImports` carries each instance's selected pattern/template/parameter contract/current values, exact catalog/pattern hashes and asset/recipe dependency receipts. Assets and recipe files are local source dependencies and use existing revision snapshots. Omission keeps legacy source shape/keys. Catalog edits cannot affect an imported project at validate/render time. `library stage PROJECT --instance ID --params PARAMS.json` uses only this pinned local snapshot; an explicit catalog update uses `--from ... --version ... --update`. An existing instance cannot be silently replaced. Refuse regeneration over a hand-edited scene with a directed local-edit conflict rather than dropping those edits; the author can keep ordinary manual edits or review a separately staged replacement.
- Ready PNG assets may declare opt-in `layout`: source-pixel dimensions, viewport, ROI, focal point, padding, and named anchors. Bounds/finite numbers and actual PNG dimensions are validated. The skill distinguishes informational ROI/padding from an explicit viewport crop. Original media bytes remain unchanged. Passive SVG remains supported as a catalog asset; PNG-specific layout/crop is not advertised for SVG/audio.
- One demonstrated engine gap is deliberate source-pixel cropping for declarative PNG layers (currently available only inside recipe parameters). Add optional image-layer `crop`; compile/renderer/preflight and a public pure image-placement helper share its source-to-frame geometry, with a slot-scoped crop rules marker in compiled data. Legacy image behavior/keys stay unchanged; do not bump the global renderer identity unless the actual implementation also changes legacy behavior. Validate against actual PNG dimensions, including scaled 540/1080 frames.
- Named attachment descriptors belong to the pinned pattern's authoring contract. Staging maps target and prop anchors through the same crop/fit/focal geometry into sibling local frames. They produce explicit source coordinates; no dynamic rig or cross-parent/camera follow is promised. Refuse unsupported layout/coordinate relationships. A common parent group can move the assembled parts. Pose substitution through pinned parameters re-stages both artwork and attachment placement, then existing edit/undo handles the revision.
- Recipe files/manifests are captured, checked and snapshotted, but library import never writes or transfers trust authorization. New/changed code still requires project/hash-scoped owner trust. Bindings, licenses and provenance are retained, never inferred as compatible or publicly licensed.

**Additional runnable acceptance:**

```bash
pnpm naraframe library inspect library/starter/catalog.json --json
pnpm naraframe library stage ../NaraFrame-projects/mvp2/library --from library/starter/catalog.json --pattern anchored-note --version 1.0.0 --instance lesson --scene asset-swap --params PARAMS.json --json
pnpm naraframe edit ../NaraFrame-projects/mvp2/library --from STAGING --expect SOURCE_REVISION --json
```

Ship a small starter catalog: an anchored explanatory-object pattern with two padded schematic poses and a prop, plus a second purposeful diagram/note pattern using available motion. Repository-authored examples are technical illustrations, not claims of human-photo rights or competitive visual quality. Prove two project imports, ordinary copy/crop/pose revisions, local re-staging after hiding/changing the catalog, explicit catalog update, stale approval, undo/reuse, and unchanged original media. Then run focused coverage and one `pnpm verify`; no E2E, provider call, or unapproved recipe trust. Fresh-context trial reads skill/catalog/public schema/its own project, not renderer source.

**Acceptance artifact:** an imported-library snapshot receipt containing stable IDs/version/hash, source provenance, resolved local dependencies, and explicit update disposition. Then:

```bash
pnpm naraframe validate ../NaraFrame-projects/mvp2/library --stage plan --json
pnpm naraframe preview ../NaraFrame-projects/mvp2/library --draft --scene asset-swap --json
pnpm naraframe status ../NaraFrame-projects/mvp2/library --json
pnpm naraframe undo ../NaraFrame-projects/mvp2/library --json
```

Expected: fresh-context library-first authoring can substitute copy/assets/pose through ordinary revisions. Crops and attachments remain intentional. Advancing the catalog does not change the pinned old source, approval, or build key. An explicit update is a reviewable revision; undo and media/build reuse are demonstrated.

- [x] Model library/version/import authority and opt-in metadata before choosing storage or adding CLI surface. Feature model above (2026-10-14), recorded before implementation.
- [x] Prepare a small useful pattern set with parameter documentation, pinned dependencies, and editable source; no parallel motion framework. `library/starter`: `anchored-note@1.0.0`, `path-note@1.0.0`, README and deterministic `author-pngs.mjs`.
- [x] Add asset ROI/focal/anchor examples including padding, a pose change, and a prop attachment. Two padded 320×400 poses and a note prop with source-pixel layout and named anchors.
- [x] Import into two episodes; prove local snapshots are complete and independent of later catalog edits. proof-a/proof-b and the external project; hidden then advanced catalog left pinned source and fingerprint stable (`library-manual-evidence.json`).
- [x] Compare copy-only, asset/crop, and pose revisions; inspect reused vs affected dependencies honestly. Each reused original media 3/3 and changed the one affected scene.
- [x] Prove old-project stability, explicit update/trust handling, stale approval, undo, and reuse. Explicit 1.1.0 update/undo; recipe trust never imported (temporary fixtures); synthetic stale-approval fixture; live undo then 1080 preview reuse.
- [x] Run a fresh-context trial using skill/catalog instructions only; save first draft and help/correction log. `work/m4-batch-2/fresh-author-report.md` (path-note only; crop/attachment not exercised by the fresh author).
- [x] Add focused tests for invalid IDs/versions/paths, metadata units/bounds, missing dependencies, snapshots, keys, bindings and undo. `library.test.ts` (17), `image-placement.test.ts`, `capabilities.test.ts`, renderer `browser-bundle.test.ts`.
- [x] Run focused coverage and `pnpm verify`; collect Batch 2's handoff. E2E deferred to final M4.5 closure under the 2026-10-14 owner instruction (not a pass). Controller focused 59/59 and verify 312/369, exit 0.

**Out of scope:** mutable `current` imports, remote assets at render time, automatic character rigging, or animation primitives deferred below.

### M4.4 — Prepared audio and series identity

**Reason:** accepted audio should be usable without regenerating it. A repeatable series also needs reusable identity with a clear timeline and occasional deliberate exceptions.

**Scope:** skill manages preparation/listening checks; library/profile provides versioned intro/signature/sign-off presets and override records; engine adds only missing import/receipt/timeline support. Reuse existing audio import paths first. Do not invent a replacement TTS/alignment service.

Prepared timing records source hash, text binding, units, cue boundaries, alignment method, verification state, and uncertainties. Listening review is required; silence detection is a tool, not authority. A master and block narration have different replacement scopes. Word data can be retained without implying native word-motion enforcement.

Series presets use supported composition/media. Intro omission or sign-off replacement is a recorded override, not a hidden source hack. Timeline shifts, gaps, and numbering are explicit. Do not introduce video layers just to satisfy this task.

**Feature model — 2026-10-14, authorized task:** reuse existing narration blocks, local media, scene partition, captions and revision snapshots. Add the minimum public preparation interface; do not change the narration clock or renderer.

- `audio stage PROJECT --from CLIP --timing PACKAGE.json --block ID --json` captures the clip and timing package once, probes the captured audio, and returns untouched-project staging plus source revision for ordinary `edit --from ... --expect ...`. Store unchanged bytes under a content-addressed audio path. No normalization, stretching, silence insertion, synthesis or provider call. Reject invalid packages and unsupported audio with directed diagnostics.
- The passive package declares schemaVersion 1, `units: "milliseconds"`, source `audioSha256`, intended `text`, local `phrases` (optional existing words), `pauseAfterMs`, alignment method/source, optional known voice-style signature/license, and verification. Duration is measured from captured media. Cues must fit it; supplied word ranges must be ordered and inside their phrase. Retaining words does not establish native word-motion enforcement.
- Opt-in `prepared` on a ready narration block records audio/text/timing hashes, measured duration, units, alignment provenance, uncertainties and `verification` (`pending` or `verified`). Verified requires an actual listening attestation with reviewer and timestamp. The engine validates receipt integrity, not what someone heard. Pending is a draft warning and a production/export blocker, and must not assert confirmed `generation.textSha256`. Verified import uses the existing normalized narration text hash and only a truthfully known voice-style signature; never borrow the current profile's style signature.
- Check receipt hashes against the current block text/phrase/word timing, measured duration and referenced asset hash. Timing hash covers measured audio duration plus local phrases/words, not `pauseAfterMs`: a visual trailing hold may change without claiming a new listening review. Stale bindings reject; keep block-based scoped handling. Blocks without this opt-in retain their behavior/keys. Receipt-only edits change source/approval authority but not identical pixels or generation identity; real text/audio/pause changes follow existing keys. Import is a preparation step, not a production-readiness or permission declaration.
- Series identity is a local versioned catalog under `library/series/study-notes/`, using ordinary declarative scenes and complete scalar episode values. Intro overlays the opening, signature persists, and sign-off uses the trailing `pauseAfterMs` hold. Explicit intro-opacity (0 omit / 1 show), sign-off copy/start and rundown are pinned in `libraryImports`; profile fonts/palette/locks remain authoritative. There is no new identity runtime or trust. This variant prepends no time: omission shifts audio by zero; changing the trailing hold changes total duration explicitly without changing the spoken clip. Standalone silent pre-roll or arbitrary unvoiced scenes are not claimed.
- Short acceptance reuses M4.2's 5851 ms coral clip, SHA `6aadd6f0e65d02ba53f8f986854c05f07323f255b92c8eb9d5b69688dd3ebc4a`, phrases `[0,2731)` and `[3019,5851)`. Fatih answered “Sudah didengar, teks dan batas cocok” on 2026-10-14, authorizing this listening attestation only. Prepare two episodes using the same preset, then omit intro/change sign-off/hold through recorded values. Compare master hashes and voice keys after visual/caption edits, undo and stale approval. Synthetic verification/approval records belong only in temporary regression fixtures, never owner evidence.

Additional acceptance before the existing validate/preview commands:

```bash
pnpm naraframe audio stage ../NaraFrame-projects/mvp2/prepared-audio --from EXISTING_CLIP --timing TIMING_PACKAGE.json --block question --json
pnpm naraframe edit ../NaraFrame-projects/mvp2/prepared-audio --from STAGING --expect SOURCE_REVISION --json
pnpm naraframe library inspect library/series/study-notes/catalog.json --json
```

First prove staging/validation without rendering. Then inspect a short preview against the listening evidence, add focused coverage and run one `pnpm verify`. No E2E. M4.5 and its costly final gate are separate from this checkpoint.

**Acceptance commands:**

```bash
pnpm naraframe validate ../NaraFrame-projects/mvp2/prepared-audio --stage production --json
pnpm naraframe preview ../NaraFrame-projects/mvp2/prepared-audio --resolution 1080 --json
pnpm naraframe preview ../NaraFrame-projects/mvp2/prepared-audio --draft --scene opening --resolution 1080 --json
```

Expected: a verified local master imports unchanged with usable phrase/cue bindings. Series identity is reused on a second episode; an explicit identity override produces the expected timeline. Visual/caption revisions keep master bytes and voice reuse unchanged. Cue/audio comparisons separate encoded offsets from input timing.

- [x] Model prepared-audio receipt and timing verification, supported preset fields, and override precedence. Existing narration clock, optional receipt, complete pinned identity values.
- [x] Import existing audio without provider calls; record file/text hashes and verification by listening. Fatih's confirmation, captured input 5851 ms, unchanged master.
- [x] Inspect cues against the actual audio and check scene boundaries, pauses, and scoped/full consistency. Owner listening plus parent frame/decoded-audio audit; full/scoped 206/206 frames identical, decoded lag 0 ms.
- [x] Use the same identity preset twice, then record an intentional override and inspect its timing impact. General-explainer episode 6851 ms; fresh current-issues draft omits intro/changes sign-off with a 1200 ms hold (7051 ms). Known voice-style mismatch stays visible and blocks production on that second profile.
- [x] Revise visual copy/assets/caption policy without changing or regenerating the spoken master. This bounded preset has no image assets: identity copy/intro values and caption policy exercised; asset substitution evidence belongs to M4.3. No new master or provider call.
- [x] Prove undo, media reuse, cache invalidation and approval staleness for changes that do affect audio or identity. Actual caption edit/undo/reuse and unchanged voice key; identity/hold keys and stale approval covered in temporary synthetic regression fixtures, not invented owner approval.
- [x] Add regression cases for units, stale text/hash binding, invalid cue bounds, preset pinning, overrides, and key behavior. 56 focused integration cases across four files, capability unit 17/17; captured-source mutation and known/unknown style controls included.
- [x] Run focused coverage and `pnpm verify`; preserve evidence for Batch 3. Parent verify exits 0: Biome 212 files, unit 312, integration 398, typecheck/build. E2E deferred to final M4.5 closure under the 2026-10-14 owner instruction.

**Out of scope:** automatic new paid generation, repairing spoken content without permission, global intro duration, or claims of word-accurate motion without the required data/implementation.

### M4.5 — Distribution, production trial and MVP 2 handoff

**Reason:** skill/library improvements count when another user/session can install and use them through production and ordinary revisions. Engine operation must remain independent of Claude/Codex, including a different profile.

**Scope:** one consolidated delivery package: versioned engine distribution, the canonical skill with host adapters, consumer onboarding, motion QA/editorial packaging, then frozen production trial and recoverable cleanup. Library supplies maintained patterns/assets. Packaging changes happen before freeze; no incidental feature work inside the frozen trial. Keep current source installation working and engine/core independent of host apps and Remotion respectively.

#### Numbered work inside Batch 3

| Step | Status | Work and acceptance |
|---|---|---|
| M4.5.1 Distribution discovery and model | AUTHORIZED model below | `refine-spec.md` section 8: private workspace/package/path gaps, official host installation routes, source CLI checks from `/private/tmp`, release authority/rights boundaries. |
| M4.5.2 Installable engine artifact | INTEGRATED (candidate-4 used for the trial exports) | Versioned local 0.1.0 archive, offline consumer installation, doctor/schema/create/profile/library and one installed starter draft evidenced. macOS arm64 only; no public release or final export. |
| M4.5.3 Canonical skill and host installation | INTEGRATED; automatic host activation not observed | Complete copied skill + receipt/launcher verified for isolated Codex/Claude roots; explicit update/removal, identity drift, local-edit/symlink/conflict and rollback checks pass. Actual fresh host discovery/invocation is not yet observed. |
| M4.5.4 Product README and consumer guide | INTEGRATED; public-facing rewrite scheduled as closing task C1 | English product README covers verified source/archive setup, both host installers and agent-independent usage, maintained starter, current authoring/revisions/audio/caption/approval contracts and limitations. File links checked; full final onboarding trial remains M4.5.5. |
| M4.5.5 Frozen production/onboarding trial | CLOSED: attempt 2 exported and owner-accepted; attempt 1 retained; fix `8b22c94` | Freeze the installable engine, skill, profile/library/media and runtime; retain the original NF-AC-25 story/revision/profile requirements below. Demonstrate terminal-only source→preview→approved MP4 as well as fresh-context skill authoring. Use bounded examples and one consolidated review. |
| M4.5.6 Cleanup, final gate and delivery | CLOSED: verify and serial E2E passed, covers retaken from finals, recoverable cleanup executed | After proof is preserved, inventory/archive remaining development experiments and disposable cache with checksum/location index and recovery instructions. Verify before recoverable removal; protect maintained samples/tests/library/history, all external projects, Git/worktrees/stash and AGENTS. Run one approved serial final E2E at closure, audit package contents and hand off versioned artifacts/limitations. Git integration and public publication remain separate. |

**Packaging acceptance model (implemented local candidate and evidence below):**

**Implementation model — 2026-10-15, authorized “next”:** use one local npm-compatible aggregate artifact, retaining compiled CLI/core/renderer module boundaries and pinning runtime dependencies. Bundle the private workspace packages as real captured files (not symlinks back to the checkout); declare pinned third-party dependencies or their captured runtime closure. Do not vendor dev tooling or the entire pnpm store. `scripts/pack-engine.mjs` emits a tarball plus content/rights metadata to an explicit scratch output; npm publication is not part of that command. Keep repository packages private; local candidate metadata may use 0.1.0 with no public availability claim. Initial consumer installation uses offline/cache-local setup; ask before an unavailable network dependency fetch.

Expose `naraframe version --json` with engine version, `skillApiVersion: 1`, source schema version, render-engine identity and installed resource root. It uses the existing structured command-result contract. Resolve built-in profiles/library/demo and recipe React/Remotion from installed resources/modules, retaining source-checkout behavior. No renderer timing/pixel/approval/trust change is intended. A demonstrated runtime change gets deliberate cache treatment rather than a cosmetic engine bump.

`scripts/install-skill.mjs` is a local helper shipped with the artifact, not a paid service or new host dependency. Inputs: `--host codex|claude`, `--scope project|user`, explicit `--project` or optional test/user root, `--engine-entry` (defaults to this engine's compiled entry), `--dry-run`, `--update` or `--remove`, and `--json`. Project installs go to `.agents/skills/naraframe` or `.claude/skills/naraframe`; user installs use the host's documented personal directory. Acceptance only installs under isolated roots, never the real personal folders without explicit permission.

Copy one canonical skill with all relative references/examples. Add an install receipt and an argv-safe Node launcher in the installed folder; it records the chosen engine/version/API/resource root and checks that binding before invoking CLI. Source use remains `pnpm naraframe`; installed skill uses its launcher from any project cwd. Updates/removal require an owned, unchanged receipt/file inventory and refuse unrelated or locally edited destinations, including symlinks. Do not edit host security config or production projects. Installer failure leaves an existing install intact; staging/backup under the exact target parent is recoverable. No silent upgrade through a mutable checkout or catalog.

Ship a maintained neutral, local starter built from supported data with an explicit rights record; keep private media out. Installation tests cover missing/incompatible engine, conflicting/edited destination, missing reference, paths with spaces, dry-run/no mutation and rollback-safe update/removal. Actual Claude/Codex activation is a separate human/fresh-session observation, not a filesystem-test claim.

```bash
# Candidate artifact path/name is recorded by M4.5.2; no registry publish here.
npm install --prefix CONSUMER_DIR PACKED_ENGINE_TGZ
CONSUMER_DIR/node_modules/.bin/naraframe doctor --json
CONSUMER_DIR/node_modules/.bin/naraframe schema --json
CONSUMER_DIR/node_modules/.bin/naraframe create PROJECT_PATH --profile current-issues --json
```

Run from outside the source repository with absolute paths. Network/dependency installation is an explicitly confirmed setup step; rendering afterwards uses local media. Bundle compiled core/renderer entry points, required module resolution, profiles, library and authorized starter files correctly rather than relying on `workspace:*`, hard-coded developer paths or symlinked checkout node_modules. Support the evidenced macOS runtime first; do not claim Windows/Linux until real platform checks exist. Do not silently widen runtime pins or replace the renderer.

Inspectable skill acceptance: installed `SKILL.md` plus each relative reference/example exists under the selected `.agents/skills/naraframe` or `.claude/skills/naraframe` location; engine version/path is explicit; installing/updating does not mutate production projects, host security rules or an unrelated existing skill. Filesystem tests do not prove a Claude/Codex session activated the skill. Record both host versions and actual activation evidence when supplied; unknown stays unknown.

**Release/cleanup contract:** npm metadata/ownership and repository code license need owner decisions before public publication. Inventory redistribution rights for fonts, media and recipes; internal LBC/TutorLog production artifacts and personal assets stay excluded. A package allowlist excludes work/gates, generated MP4/cache, secrets, user config, history-heavy experiments and private media. Preserve gate evidence until final acceptance; do not make this cleanup erase failures. Archive to an explicitly indexed MVP 2 checkpoint before moving source scratch/cache to recoverable Trash. No recursive deletion of workspace or global cache. Re-check active bundling/render first.

**Trial:** short episodes (roughly 15–30 seconds, brief-dependent), using the smallest set that exercises the required revisions and a second profile on compatible content. Use verified prepared voice for at least one episode. Replace brand-bound assets/text explicitly when switching profile. Save first drafts before feedback; no provider cost by default. A neutral/silent-only trial cannot stand in for prepared voice reuse evidence.

**Acceptance commands:**

```bash
pnpm naraframe validate ../NaraFrame-projects/mvp2/production/episode-01 --stage production --json
pnpm naraframe preview ../NaraFrame-projects/mvp2/production/episode-01 --resolution 1080 --json
pnpm naraframe render ../NaraFrame-projects/mvp2/production/episode-01 --approve-preview BUILD_ID --json
pnpm naraframe status ../NaraFrame-projects/mvp2/production/episode-01 --json
```

Expected: a fresh-context agent reaches owner-approved MP4 through skill and public interfaces, without reading private renderer source or needing repeated supervisory relay. Revisions, undo/reuse, and the second profile are evidenced. Review covers composition/type, illustration, purposeful motion, continuity, and explanation without inventing a parity verdict.

- [ ] Freeze source trees, all built runtime files, skill, profiles, library/recipe hashes, trust scope, media, audio/timing and runtime versions.
- [ ] Complete consumer artifact/skill install/update checks before that freeze, including installed resource resolution, unknown/mismatched engine version, collision-safe installs and standalone CLI behavior.
- [ ] Verify package allowlist, resource rights register, README commands/links and source/installed routes; distinguish local release readiness from public publication.
- [ ] Record fresh-context reading/command boundaries, first drafts, elapsed/active time, corrections, reuse and provider usage.
- [ ] Use a representative shot/contact sheet before full previews; review moving frames as well as stills.
- [ ] Exercise headline, motion tempo, object/asset, caption, and profile revisions through ordinary source edits; show undo and reuse.
- [ ] Check identity fields, undeclared recipe params, source/claim limits, media rights, and listening evidence. Do not infer public rights from internal approval.
- [ ] Produce contact sheets, a cover artifact and delivery notes with sources, limitations, caption/post copy and final build receipts.
- [ ] Obtain owner visual acceptance, then export and verify pointer/approval/source/hash, streams, duration/frame count and full decode.
- [ ] Report technical, visual, export and publication statuses separately. Simulated platform overlays are QA aids, not guarantees about every platform UI.
- [ ] Add focused regressions for accepted defects; if a defect forces runtime changes, retain the attempt and start a newly approved freeze.
- [ ] Run `pnpm verify` and one serial full E2E for closure; document failures/caveats without retry-until-green or weakened assertions.
- [ ] Archive experiments recoverably after preserving acceptance/gate evidence; verify checksum index and protected source/user state.
- [ ] Consolidate Batch 3 handoff and NF-AC-21–27 disposition; request integration separately.

**Out of scope:** GUI/hosted runtime/MCP service, stable public SDK expansion, automatic posting, a universal platform layout, new providers, open-ended polish, automatic package/marketplace publication, or declaring older D-VIS/rights/parity gates passed by proxy.

## 3. Review batches and closure

| Batch | Contains | Owner relay |
|---|---|---|
| 1 | M4.1 + M4.2 | One consolidated technical review, with saved authoring/output evidence and caption acceptance. |
| 2 | M4.3 | One review of import/version/metadata authority, editable patterns and frozen proof. |
| 3 | M4.4 + expanded M4.5 | One final review of prepared audio/identity, consumer distribution/onboarding, cleanup and production handoff. Visual/export/publication approvals remain separate owner decisions. |

Use Fatih's 2026-10-14 MVP 2 exception: each next batch branch starts from unchanged main and cherry-picks its predecessor's cumulative batch commits. Keep main untouched until final acceptance. Within an authorized batch, execute its steps without relaying each small command through Fatih; confirm expensive work first. Bring findings together at READY_FOR_REVIEW; stop for materially new authority, a blocking defect outside scope, or a required owner output decision.

MVP 2 closure requires recorded acceptance for NF-AC-21–27 under the 2026-10-15 scope addition, compatible legacy behavior, current capability documentation, consumer onboarding and the operating handoff. Public registry/marketplace publication is not a closure requirement. Any narrowed acceptance needs an explicit owner decision recorded as such. Deferred visual/publication/backlog items remain deferred unless separately accepted.

## 4. Later backlog (not MVP 2 requirements)

- Spring, repeater, cross-scene continuity primitives, animated masks, video layer and word-level motion.
- Generic recipe collision/contrast, unbound identity/claim inference, non-space line-breaking coverage.
- Reliability: pixel repeatability, SIGKILL orphan handling, issue #16 diagnostics/cancellation, harness timeouts and full raw gate logs.
- Targeted undo, fuller reuse reporting, leftover assets after undo, older final-key mismatch.
- D-VIS, Bang Motion parity, publication rights, and unresolved historical claims.

**MVP 2 follow-ups (scheduled 2026-10-16/17 from the M4.5 trial and review; evidence in the M4.5 closure section):**

| ID | Finding | Expected outcome |
|---|---|---|
| F1 (DONE, B1) | Visual preflight samples scene-final/entry frames only, so text pushed off frame by a `match-cut` zoom, or entry motion that starts outside the safe area, passes validate and preview silently. | Text and safe-area checks cover transition and entry-motion frames, with a regression built from the trial seam. |
| F2 (DONE, B3) | Narration cannot be removed through `edit`; the author had to delete `narration.json` by hand after `SCENE_NARRATION_MISSING`. | An ordinary, revision-recorded way to make a voiced project silent. |
| F3 (DONE, B3) | `profile apply` lists `regenerate-narration` for a project without narration and does not name layers bound to palette slots, image plates or literal colours that clash with the new direction. | The dry run reports only relevant effects and names the affected layers and assets. |
| F4 (DONE, B4) | `shape.stroke.color` accepts only hex while path strokes accept palette tokens; `reveal` direction and `strong` emphasis are undocumented or indistinct under some profiles; the skill lacks a revision list and an explanation of why a reused preview gets a new build id. | Consistent colour tokens and documented motion/emphasis semantics in the skill. |
| F5 (DONE, B5; Chrome helpers may still outlive Chrome) | `node` and Chrome crashpad processes sometimes stay alive 7–9 minutes after parallel renders (output unaffected). | Diagnosed; commands exit promptly or the cause is documented. |
| F6 (DONE, B2) | Claim labelling is trust-based. `requireSourcing` only raises `SOURCE_MISSING` from warning to error for blocks or scenes labelled `carriesFactualClaim: true`; the engine does not detect claims. The skill never mentions `carriesFactualClaim`, `sourceIds` or `requireSourcing`, and every art-direction example scene sets `carriesFactualClaim: false`, which authors copy. Both trial episodes therefore labelled causal statements as non-claims, and a strict profile could not catch it. | The skill explains when to label a claim and how to cite sources; examples stop defaulting to `false` without explanation; validation adds an info note when a profile requires sourcing but no scene or block is labelled as a claim. No automatic claim detection is promised. |
| F7 (DONE, B6b) | A skill without a working engine fails poorly. The launcher prints a Node stack trace before `SKILL_ENGINE_MISSING` (its `version` probe inherits stderr) and gives no next step. A skill folder copied without an engine (for example from GitHub) has no install receipt; it is sent to `pnpm naraframe`, fails, and reports a "system blocker" with no concrete install route. | Missing-engine paths end in one clean message. The skill opens with an engine check; when no engine is available the agent offers to install it and, after one yes from the user, performs the setup itself (manual steps stay documented). A clearly labelled director-only plan is available only if the user prefers to wait (see the B6 model). |

**Delivery order (owner, 2026-10-17):** one batch per relevance, each confirmed by Fatih before commit, push and squash-merge: B1 = F1, B2 = F6, B3 = F2 + F3, B4 = F4, B5 = F5, then B6 = F7 together with C1, because the public README and the skill must give the same install route.

**B1 / F1 model — motion-aware text checks in visual preflight.** Cause: `TEXT_OUTSIDE_CANVAS` in `visual-preflight.ts` runs only when a scene has a camera or a `transform`/`follow` beat, so a `match-cut` zoom (scene transition state) or an entry `reveal` never reaches it, although the transition's final frame is sampled. Model:
- The canvas check (error, existing `TEXT_OUTSIDE_CANVAS`) runs on every sampled frame for text at on-screen opacity ≥ 0.9, folding layer motion, group, plane, camera and scene-transition state as today. Fading `push-through` stays below that threshold where it travels.
- New sampled frames: the start and midpoint of each transition window (exit tail and entry head).
- Motion safe-zone check (warning, `TEXT_OUTSIDE_SAFE_ZONE` with the frame): text at on-screen opacity ≥ 0.5 whose static frame is inside the safe zone but whose on-screen bounds leave it, on sampled frames outside transition windows. Camera-framed world text keeps its existing exemption.
- Builds checked by the weaker rules are not reused: a deliberate key/identity treatment, recorded with the change.
- Acceptance: (1) a copy of the trial episode-01 reverted to its pre-correction source is refused by `preview` with `TEXT_OUTSIDE_CANVAS` for the `cause` headline in the match-cut window, and the corrected source previews; (2) a copy of episode-02 at its correction-2 source warns `TEXT_OUTSIDE_SAFE_ZONE` for the scene-2 text during its reveal; (3) unit cases for match-cut off-canvas, fading push-through accepted, slide-in reveal warning, static text unchanged; (4) existing integration and fixtures stay green with no new issues on maintained samples.

**B1 / F1 evidence — 2026-10-17 (branch `f1-preflight-motion-frames`; owner-approved and integrated through its own PR):**
- The canvas check is ungated (on-screen opacity ≥ 0.9, every sampled frame). Transition windows are sampled at start and midpoint through a shared `sceneTransitionWindowsFor`, so sampled and applied windows cannot drift. The motion `TEXT_OUTSIDE_SAFE_ZONE` warning measures the painted glyph extent rather than the box, because full-width boxes always touch the safe edge.
- Cache treatment: `PREFLIGHT_TEXT_RULES = "naraframe-preflight-text/2"` enters the render key of scenes with text layers only, following the Batch F text-fit marker. Pixels are unchanged, so `RENDER_ENGINE` stays `naraframe-draft/13`. Builds checked under the old rules are neither reused nor reported current, so existing production previews read as stale by design.
- Acceptance:
  - episode-01 reverted to `a8a488f8…`: refused with `TEXT_OUTSIDE_CANVAS` for `headline` at frame 229 (scoped `cause`) and 432 (full). Supervisor re-ran the scoped case independently and got the same result. The corrected source previews (`576be4d406f3-80f0385a-0d0`) and reuses.
  - episode-02 correction 2 restored from its own revision object (same revision `aff48e87…`): warns at frame 141 and still previews. The current source does not warn.
  - The maintained Krakatau draft/narrated and current-issues samples raise no new issues.
- Real defect found in a maintained fixture: `test-fixtures/project-general-explainer` `comparison-copy` (x 88–992) left the canvas under its match-cut zoom. It is narrowed to x 128 / width 824, matching the panel text inset. Its `stat-number` now warns `TEXT_OUTSIDE_SAFE_ZONE` while its 1.06 emphasis plays; the warning is kept as a real finding.
- An existing unit test's reveal was slowed (25→40 frames) because the new `transition-out-start` sample showed two genuinely overlapping opaque layers.
- Gates (logs `work/gate-logs/f1/`):
  - lint, typecheck and build exit 0;
  - unit 339/339, including 12 new tests;
  - integration 428/428;
  - full serial E2E 14 files / 24 tests, 1085 s, exit 0 (log SHA-256 `72c30ffb…`).
- Chrome had auto-updated to 155.0.8059.84 by this run; the M4.5 freeze recorded .40. The engine does not pin the browser.
- Known limits: the canvas error still uses the full text box, which is conservative. Checks run on sampled frames only. Exit-beat travel that stays at least half opaque can warn.

**B2 / F6 model — explicit claim labelling.** The engine trusts `carriesFactualClaim`; it never detects claims, and that stays true. The gap is guidance and a silent strict profile. Model:
- Skill: a short "Claims and sources" section saying what counts as a factual claim. A factual claim is a statement about the world presented as true: causes, quantities, dates, places, named people or events. Questions, instructions, opinions marked as such, and on-screen labels are not claims. The section covers how to declare `sources` and cite `sourceIds` on scenes or narration blocks, what `requireSourcing` changes (`SOURCE_MISSING` becomes an error), and that an unsourced restatement needs the owner's decision recorded in the project notes rather than a silent `false`.
- Examples: the art-direction example scenes keep `carriesFactualClaim: false` only where they make no claim, and the guide says why. If an example states a fact, it is labelled and cites a declared example source.
- Validation: when the active profile sets `requireSourcing: true` and no scene or narration block is labelled `carriesFactualClaim: true`, `validate` and later stages report one info issue, `CLAIMS_UNLABELLED`. The issue says the engine cannot see claims, and asks the author to confirm that the episode makes none or to label and source them. It never blocks.
- No render key, schema or approval change.
- Acceptance:
  1. `validate` on a copy of trial episode-02 (contrast, all `false`) reports `CLAIMS_UNLABELLED`.
  2. A copy of episode-01 (general-explainer, sourcing not required) does not.
  3. A contrast fixture with one labelled, sourced claim reports neither `CLAIMS_UNLABELLED` nor `SOURCE_MISSING`.
  4. The same fixture with the source removed reports `SOURCE_MISSING` as an error.
  5. Unit, integration and skill-example checks stay green.

**B2 / F6 evidence — 2026-10-17 (branch `f6-claim-labelling`; owner-approved and integrated through its own PR):**
- `checkSourceProvenance` raises `CLAIMS_UNLABELLED` once, as an info issue on `scenes.json` `/scenes`, through the normal compile issues (validate, preview, render, status).
- The production-check early return in `runner.ts` now deduplicates issues. Before this, a failed draft-plus-final compile printed each issue twice, which is a pre-existing duplication of `SOURCE_MISSING`.
- The skill gains "Claims and sources". In the art-direction examples, `object-explanation` is labelled and cites a declared placeholder source. The other five examples state their "No claim" reason in the scene note, and `check-art-direction.mjs` enforces labelled-cites-declared-source.
- Acceptance, re-run by the supervisor:
  - copy of episode-02: `CLAIMS_UNLABELLED` info, success;
  - copy of episode-01: none;
  - labelled + sourced fixture: neither code;
  - source removed: `SOURCE_MISSING` error, exit 1;
  - the art-direction check passes with schema input.
- Gates: `pnpm verify` exit 0 (Biome 226, unit 345/345 including 6 new, integration 431/431 including 3 new). E2E is not rerun: there is no render change, and E2E issue assertions filter info. Logs are in `work/gate-logs/f6/`.

**B3 / F2 + F3 model — silent edits and a profile-switch report that names what changes.**
- **F2:**
  - `edit` accepts a repeatable `--remove <path>`, limited to the optional source files `narration.json` and `captions.json`.
  - Removal applies to the validation candidate before validation, and to the working copy only after the snapshot is written. The revision records the file's absence, so `undo` restores it.
  - An edit may consist of removals only.
  - Removing a required or absent file is refused with a structured issue, and nothing changes.
  - `SCENE_NARRATION_MISSING`'s suggestion points to this route, and the skill documents "make a voiced project silent" as one staged `naraframe.json` change plus `--remove narration.json`.
- **F3:**
  - `profile apply --dry-run` lists `regenerate-narration` only when the project has narration.
  - The plan gains an additive review section naming:
    - layers whose colours reference palette tokens that change value, with scene, layer, property, token, before and after;
    - layers with literal colours that the switch will not repaint, when the palette or direction changes;
    - image layers to review, with scene, layer and asset, when the palette, direction or illustration signature changes. `replace-assets` names them.
  - No apply behaviour, schema version or render key changes.
- **Acceptance:**
  1. On a copy of trial episode-01, staging `audioMode: silent` with `--remove narration.json` yields a valid silent revision. `undo` brings narration back, and the bad cases are refused.
  2. On that silent copy, `profile apply contrast --dry-run` omits `regenerate-narration` and lists the coral layers bound to `palette.text`, the literal coral/algae colours and the reef plate image. These are the items the trial author found only by previewing.
  3. Unit and integration coverage for both. Existing profile-switch tests stay green.

**B3 / F2 + F3 evidence — 2026-10-17 (branch `b3-silent-edit-profile-report`; owner-approved and integrated through its own PR):**
- **F2 surface:** `edit <project> --expect <rev> [--from <dir>] [--remove narration.json|captions.json]...`, with `--from` optional when something is removed.
  - Refusals change nothing: `REMOVE_NOT_ALLOWED` (required, unknown or unsafe path), `REMOVE_TARGET_ABSENT`, and `REMOVE_AND_STAGED`. Usage errors exit 3.
  - Removal unlinks the hard-linked candidate before validation and touches the working copy only after the snapshot. JSON reports `removedFiles`.
  - `SCENE_NARRATION_MISSING` and the narration `AUDIO_MODE_CONFLICT` now point to the route.
  - The CLI usage text gained its missing `edit` line.
- **F3 surface:** `regenerate-narration` appears only when the project has narration.
  - Dry run and apply carry an additive `plan.review` with `paletteBound` (token, before, after), `literalColors` and `imageLayers`. The section is omitted when nothing applies.
  - The text output summarises it per token.
  - Shadow colours, scene-level media visuals and recipe params are not listed; recipe params stay in `plan.bindings`.
- **Acceptance:**
  - On a copy of trial episode-01, staged `audioMode: silent` with `--remove narration.json` alone was refused: its selected captions target removed phrases, so nothing changed. Adding `--remove captions.json`, or staging `captions.json` as `mode: none`, gave a valid silent revision. The skill says so.
  - `undo` restored both files byte for byte, and redo reproduced the same revision id. Required, absent and staged-and-removed cases were refused.
  - The contrast dry run on the silent copy omits `regenerate-narration`. It reports `palette.text #F2EFE6 → #16202B` repainting 39 layers (the trial's white coral), literal `#D27D4A`/`#7A3F17` on 57 layers, and the reef plate on 3 layers. The supervisor re-ran this independently.
  - The production episodes were not touched; their revisions are still `3ff723d6…` and `d41ecb8d…`.
- **Gates:** `pnpm verify` exit 0 (Biome 229, unit 350/350, integration 453/453). Two existing assertions dropped `regenerate-narration` deliberately, because those created projects have no narration.
- **E2E subset:** the six files that exercise `edit`/`profile apply`/narration codes (caption-policy, font-readiness, recipe-brand-switch, recipe-production, recipe-text-fit, reference-projects) passed 10/10 in 426 s. There is no render change, so the full suite was not rerun. Logs are in `work/gate-logs/b3/`.

**B4 / F4 model — consistent colour tokens, documented motion and emphasis, revision history.**
- **Stroke colours:** shape (and image) `stroke.color` accepts the same palette tokens as path strokes. Tokens resolve through the profile palette in the renderer and in contrast and preflight checks exactly as path strokes do. Hex stays valid. The F3 review already reads tokens on these properties.
- **Motion and emphasis documented in the skill:**
  - `reveal` direction semantics: which edge the layer starts from and how distance applies.
  - `strong`: +200 font weight, capped at 900. With faces that have only regular and bold (for example system Arial), headings at weight 600 or more already render bold, so `strong` can be indistinct. Use `accent` or `quiet` contrast instead.
  - Why a reused preview gets a new build id while its MP4 bytes are reused, and how to recognise reuse (`reusedFromBuildId`).
- **Revision history:** a read-only `history <project> [--limit n] [--json]` command lists the current revision chain from the current revision backwards: id, parent, kind (edit, undo, capture, profile apply…), summary and time, with the current revision marked. `undo` targets stay as they are. The skill points to it before `undo`.
- **Acceptance:**
  1. A shape with `stroke.color: "palette.accent"` validates and renders in the profile accent under two profiles.
  2. `history` on a copy of trial episode-01 lists the revision chain and matches `revisions/` metadata. Undo is a pointer move with no redo, so revisions stepped away from are on disk but not in the chain.
  3. Skill text reviewed against the actual renderer behaviour (reveal offsets and strong weights) with a scoped preview still per claim.
  4. Unit, integration and focused render tests. A full E2E run happens only if render keys change.

**B4 / F4 evidence — 2026-10-17 (branch `b4-colour-motion-docs`; owner-approved and integrated through its own PR):**
- **Stroke tokens:** shape and image strokes use a new `LayerStrokeSchema` (`ColorValueSchema`), resolved by the compiler's existing `resolveColor` exactly as path strokes are; the renderer needed no change. The profile's `appearance.stroke` stays hex-only. An unknown token is refused identically on shape, image and path.
- **Render keys:** a dump of scene keys, assembly keys and compiled-draft hashes for 10 projects (fixtures, samples, both trial episodes, art-direction, captions, prepared-audio, library) is byte-identical before and after. A token that resolves to the same colour as a hex gives the same keys.
- **Pixels:** a scoped preview with `stroke.color: "palette.accent"` sampled `#fb5c36` under current-issues (accent `#FF5A36`) and `#0c7a76` under contrast (`#0B7A75`); the differences are H.264 rounding. Image-layer strokes are covered at compile level only.
- **Skill, each claim backed by a scoped preview still (`work/m4-followups/b4/stills/`, checked by the supervisor):**
  - `reveal` `direction` is the travel direction: `up` starts below its frame, `right` starts to the left. `exit` mirrors this.
  - `strong` is base weight +200 and is indistinct from plain text at base weight ≥ 600 in regular/bold-only faces such as system Arial.
  - A reused preview keeps its assembly-key prefix with a new attempt suffix, and `reusedFromBuildId` names the source.
- **`history <project> [--limit n] [--json]`:** read-only. It follows the current chain through `parentId`, takes no lock and captures nothing.
  - The text marks the current revision with `*`.
  - Errors: `REVISION_HISTORY_MISSING`, `REVISION_CORRUPT`, `CLI_USAGE`.
  - On a copy of trial episode-01 it lists 11 revisions with current `3ff723d6…`, and the copy's `revisions/` is byte-identical to production afterwards.
  - Revision kinds are `baseline`, `edit` and `manual-capture`; a profile apply shows as `edit` and its summary names it.
- **Gates:** `pnpm verify` exit 0 (Biome 231, unit 352/352, integration 463/463). E2E is not run because no render key or compiled draft changed. Logs are in `work/gate-logs/b4/`.
- **Left for later:** shadow colours stay hex-only. `README.md` lacks `history`, and C1 rewrites it.

**B5 / F5 model — commands exit promptly after rendering (diagnosis first).** In the M4.5 corruption diagnosis, `node` and orphaned `chrome_crashpad_handler` processes stayed alive 7–9 minutes after `preview` wrote its JSON result. This happened in parallel renders and once in a serial loaded run; the output was unaffected. The cause is unknown.
- **Diagnose before changing code.**
  - Reproduce on the current main (serial capture, concurrency 1), with the time from the final JSON line to process exit measured for single, back-to-back and two-parallel renders, plus the process tree and leftover Chrome and crashpad processes 30 s after exit.
  - Identify what keeps the process alive, for example open handles or timers, a browser or compositor not closed, or a server still listening.
  - The diagnosis may show that the cause is outside NaraFrame (Chrome's crashpad handler outliving its parent by design). In that case document it and stop; do not mask it.
- **Fix only the identified cause.** Close or release the resource in the normal path and on failure or interruption. A forced `process.exit` that could skip publication cleanup is not a fix.
- **Acceptance:** after the fix, preview and render commands exit within a few seconds of their result in single, back-to-back and parallel runs, and no Chrome or crashpad process started by the command remains 30 s later. Interruption and recovery behaviour is unchanged. A regression check covers the identified cause.

**B5 / F5 evidence — 2026-10-18 (branch `b5-lingering-processes`; owner-approved and integrated through its own PR):**
- **Reproduced on the pre-fix main:** the time from the final JSON line to process exit was 2.9 s median (max 5.4 s) for single runs and 3.5 s median for back-to-back runs. Two of three parallel pairs never exited within a 150 s cap; one earlier uncapped pair lived 15 min 18 s. The load scenario did not linger.
- **Root cause:** Remotion starts Chrome with piped stdout and stderr and keeps those pipes referenced. On close it kills Chrome's process group, but Chrome's crashpad handler and the Google updater helpers it launches (`--wake-all`, `--wake`, `--crash-handler`) sit outside that group and inherit the pipe. Node therefore stayed alive until the last helper exited.
  - Evidence: `process.getActiveResourcesInfo()` showed pipe handles for up to 111 s after the result, and `lsof` matched the stuck node's socket peer in a ppid-1 crashpad handler and updater helpers (`work/m4-followups/b5/diag/`).
  - NaraFrame's own spawns (ffmpeg, ffprobe) had finished before the result.
- **Fix:** `render-draft.ts` opens each browser itself (`openBrowser`) for composition selection and for the render, passes it as `puppeteerInstance`, and releases it in `finally`: an awaited `close`, then `runner.forgetEventLoop()`.
  - Close errors cannot replace the render outcome, and there is no forced exit.
  - Preflight now runs before the render browser opens, so a rejected draft never launches it.
- **Result after the fix:** exit 0.026 s after the result for single and back-to-back runs, 0.034–0.06 s for parallel pairs and 0.04 s under load. SIGINT mid-render still exits 130 with one `COMMAND_INTERRUPTED` result.
- **Acceptance not fully met:** after parallel runs, Chrome's crashpad handler and updater helpers can still outlive Chrome by minutes. They belong to Chrome and the OS, carry an empty environment and ppid 1, and are deliberately not hunted down. They no longer keep NaraFrame alive.
- **Options left for later:** `chrome-headless-shell` or Chrome for Testing through `NARAFRAME_BROWSER_EXECUTABLE`, or an updater-disabling launch flag, which is untested.
- **Remotion internals:** `runner.forgetEventLoop` is public on Remotion 4.0.521's browser handle but internal-leaning, so re-check it on a Remotion upgrade. A replacement browser that Remotion launches after a crash is not ours to release.
- **Regression:** `render-browser-release.test.ts` (8 tests, mocked Remotion) covers release on success, selection failure, render failure and interruption, no render browser on preflight rejection, and tolerant release.
- **Frames:** frame md5s matched between a before run and two of three after runs. Before-run variance also exists, which is the known repeatability item NF-AC-06.
- **Gates:**
  - The corepack pnpm cache had disappeared, so the supervisor ran the `verify` sequence and E2E through the same `node_modules/.bin` binaries. pnpm 12.3.4 was then restored through corepack with Fatih's permission.
  - Biome 232 files, unit 360/360, integration 463/463, `verify-exit 0`.
  - Full serial E2E 14 files / 24 tests, 1007 s, exit 0 (1085 s before the fix). Logs are in `work/gate-logs/b5/`.

**B6 / F7 model — a skill that still helps without an engine (draft, to be confirmed when B6 starts).**
- **Engine check first.** The skill decides its route before any authoring:
  - installed launcher (receipt present);
  - built source checkout;
  - no engine.
  The check is a quiet probe (`doctor --json` through the chosen route) and treats a failure as "no engine", not as an error to retry.
- **No engine → the agent installs it (primary route).** The user should not need to read documentation first. The agent explains in one short message:
  - that NaraFrame needs its local engine to check and render videos;
  - what it will install, where (default a per-user folder such as `~/.naraframe/engine/<version>`), roughly how much space and time it takes;
  - which system tools are missing.
  After **one** yes from the user, it runs the whole setup itself:
  - check prerequisites (pinned Node, Chrome/Chromium, FFmpeg/FFprobe), proposing the platform's usual install for any that are missing;
  - fetch the pinned engine version from the project's published source and verify its checksum before use;
  - install offline-style into the chosen folder;
  - run `doctor`;
  - bind the skill through the shipped installer, adopting a copied skill folder when its files match the canonical skill and refusing edited ones as today.

  Manual installation stays documented for people who prefer it. Nothing is fetched or installed before that yes, and a failed step leaves an existing install untouched and reports the one next step.
- **Distribution prerequisite.** Agent-led setup needs a published, checksummed engine source that the skill can name. Options are a release asset of the packed archive or a tagged source build. Publishing it, and the licence it ships under, are owner decisions tied to C1. Until then the route can run only from a local archive or a checkout.
- **Director-only mode, only on request.** If the user wants to continue without the engine, the skill produces a planning document instead of a project:
  - audience and takeaway;
  - a shot rundown with one explanatory object per beat;
  - on-screen text and caption choices;
  - claims that need sources;
  - timing intent.
  It is marked "not validated, not rendered". It writes no `scenes.json` or other engine source, because the schema comes from the engine and an unvalidated source would look finished when it is not. Once an engine is installed, the plan is the brief for a normal project.
- **Launcher:** the `version` probe no longer inherits the engine's stderr. Every bootstrap failure prints one line with its code plus a next step pointing to `installation.md`, keeping exit 2.
- **Acceptance:**
  1. A copied skill folder with no engine, in a fresh agent session, asks once, installs the engine and binds the skill after a yes, then runs `doctor` green. That run happens on a clean user account or machine profile, without reading documentation.
  2. Declining gives a director-only plan only when asked.
  3. An installed skill whose engine was removed prints one clean line with a next step, and no stack trace.
  4. Installer and launcher regressions stay green.

**References for B6/C1 (owner-supplied, read 2026-10-17; patterns only, no copied text or assets):**
- **`bangtutorial/bang-motion`** (MIT; an agent skill, no engine):
  - the README sells outcomes first: an icon, "works with" badges, a hero image, a style gallery of stills with one-line captions, "Why", "What you can make", workflow and example prompts;
  - installation comes last;
  - it ships a `.claude-plugin` marketplace manifest.
- **`heygen-com/hyperframes`** (Apache-2.0; engine plus skills):
  - the engine is an npm package run through `npx`;
  - skills install through the Claude plugin marketplace (`claude plugin install …`) or `npx skills add`;
  - the quick start is agent-first;
  - it has versioned releases plus SECURITY, CONTRIBUTING and CODE_OF_CONDUCT files.
- **`buildwithhanif/hyperframe-pro`** (MIT; a production layer on HyperFrames):
  - a short README covering why it exists, a one-line plugin install with explicit requirements, the loop, and what it is not.
- **Implications for NaraFrame:**
  1. An npm-published engine run through `npx` with a pinned version is the simplest agent-led install route (registry integrity instead of a hand-rolled checksum). A Claude plugin marketplace entry is the simplest skill route. Both are publication decisions.
  2. NaraFrame renders with Remotion, which has its own licence: free for individuals and small companies, with a company licence required above that threshold. A NaraFrame code licence (for example MIT or Apache-2.0, as in the references) does not change that. The README and installer must state it plainly before anyone installs. Verify the current Remotion terms at the time of C1.
  3. The README follows the outcome-first order: hero still and gallery from synthetic or rights-cleared examples, what you can make, how it works with an agent, example prompts, then install and requirements (macOS arm64, Node, Chrome, FFmpeg).

**B6 decisions and split (owner, 2026-10-18):** the engine is published on npm and NaraFrame's code is MIT-licensed. B6 ships as three reviewable PRs: B6a licence and npm package shape, B6b F7 (skill engine check and agent-led install from npm), B6c C1 (public README with marketing skills and images). `npm publish` needs the owner's npm account and is run by the owner after B6a–B6c are on main; the agent prepares the exact commands.

**B6a model — MIT licence and a publishable npm package.**
- **Licence:**
  - A root `LICENSE` with the MIT text covers NaraFrame's own code.
  - Package metadata says `MIT`.
  - Third-party packages keep their own licences. Remotion 4.0.521's licence is free for individuals, organisations with up to 3 employees, non-profits and evaluation, and requires a company licence above that. It forbids copying or modifying Remotion code to sell, licence or sublicense a derivative.
- **Package shape:**
  - The published package `naraframe` (the name is free on npm as of 2026-10-18) contains only NaraFrame's compiled CLI, core and renderer modules plus maintained resources: profiles, library, starter, skill and installer.
  - Third-party runtime packages, including Remotion and React, are declared as regular dependencies pinned to exact versions, so npm installs them from the registry under their own licences. The local aggregate archive that captured 259 third-party placements is not the published form.
  - The `bin` is `naraframe`, with `engines.node` pinned to the supported runtime. `os`/`cpu` stay unrestricted unless install fails elsewhere; documentation states macOS arm64 as the only verified platform.
- **Engine identity:** `version --json` and the skill receipt keep working from an npm install. `engineIdentity` covers NaraFrame's own modules and resources plus the pinned dependency versions.
- **Acceptance:**
  1. `npm pack` produces a tarball whose file list contains no third-party package code and no private, work or test-fixture files.
  2. In a clean temporary consumer directory, `npm install <tarball>` (third-party dependencies fetched from the public registry), `npx naraframe doctor --json`, `create` and one scoped draft preview succeed, and the skill installer binds to it.
  3. The source checkout routes and existing packaging tests stay green, or are updated deliberately.
  4. No publish.

**B6a evidence — 2026-10-18 (branch `b6a-mit-npm-package`; owner-approved and integrated through its own PR):**
- **Licence:** root `LICENSE` is MIT, `Copyright (c) 2026 Fatiha Rahmat` (owner's GitHub name). `THIRD-PARTY-NOTICES.md` lists the nine direct dependencies with versions and licences and calls out Remotion's free/company tiers and derivative restriction. It also notes the platform compositor binaries and that Chrome, FFmpeg and fonts are user-installed. `starter/RIGHTS.json` now states MIT.
- **Package:** `pnpm pack:npm` (`pack-engine.mjs --registry`) builds `naraframe@0.1.0`.
  - 231 KB, 129 files.
  - NaraFrame's compiled core and renderer are bundled under `node_modules/@naraframe/*` (`bundleDependencies`). Third-party runtime packages are exact-version `dependencies` fetched from the registry, with no vendored third-party code.
  - `bin: naraframe` and `engines.node 24.20.x`.
  - A post-pack guard and a test reject third-party `node_modules`, work, fixtures, samples, logs and personal path strings.
  - The offline aggregate mode is kept; its private archive now says `SEE LICENSE IN LICENSE`.
- **`engineIdentity`:** it now also hashes each third-party dependency's declared pin and installed version. This closes a gap: the source checkout previously hashed none. Two independent installs of the tarball, and an extraction elsewhere, gave the same identity.
- **Acceptance:** in a clean consumer directory whose path contains a space, with an isolated npm cache:
  - `npm install` added 252 packages in about 20 s (391 MB);
  - `version`, `doctor` (8/8), `create`, `library stage` + `edit`, and `validate` all succeeded;
  - a scoped draft preview rendered 540x960, 120 frames, with the frame-integrity guard passing;
  - the skill installer bound to it and its launcher reported the same identity.
- **Skill docs:** six example paths that named `../NaraFrame-projects/…` became `../…`.
- **Gates:** `pnpm verify` exit 0, re-run by the supervisor (Biome 233, unit 360/360, integration 470/470, including 7 new npm-package tests). No render change, so no E2E.
- **Findings for B6b/C1 and publication:**
  - Bare `npx naraframe create … --profile …` is swallowed by npm's own `--profile` flag; documentation and the skill use `npx -y naraframe@<version> …`.
  - Transitive dependencies are not pinned; an `npm-shrinkwrap.json` would pin the whole tree.
  - Yarn Berry ignores `bundleDependencies`.
  - npm skips esbuild's postinstall, which rendering does not need.
  - Only macOS arm64 is verified.
  - `doctor` expects a writable package root, so a root-owned global install reports a filesystem issue.
- **Owner decisions (2026-10-18):** add an `npm-shrinkwrap.json` so an agent-led install gets the whole dependency tree pinned (done in B6b); keep `engines.node 24.20.x`, which only warns on other Node 24 releases.

**B6b implementation model — F7 on top of the npm package (2026-10-18).**
- **Pinned dependency tree:** `pnpm pack:npm` also writes an `npm-shrinkwrap.json` into the package, generated with registry access at pack time, so an install resolves the whole tree to fixed versions. Tests check that it exists, matches the declared direct pins and contains no `@naraframe/*` registry entries.
- **Engine setup script:** `skills/naraframe/scripts/setup-engine.mjs` ships inside the skill. It needs only Node and npm.
  - It checks prerequisites (Node 24 line, npm, Chrome or Chromium, FFmpeg/FFprobe) and reports each missing one with the usual platform command, without running it.
  - It installs the engine with `npm install --prefix <dir> naraframe@<version>`. The default `<dir>` is `~/.naraframe/engine/<version>`, and the default version is the one the skill folder declares.
  - For tests and pre-publication use, the source can be overridden with an explicit local tarball.
  - It then binds the skill through the engine's installer and runs `doctor`.
  - Every step is idempotent: an existing healthy engine is reused, and a failure leaves an existing install untouched and prints one next step. It writes nothing outside the chosen engine folder and the skill folder.
  - It never runs before the user has agreed.
- **Copied skill folder:** the installer gains an explicit adopt path for a skill folder without a receipt whose files are byte-identical to the canonical skill of that engine version. Edited or unknown folders are still refused.
- **Skill flow:**
  - Before authoring, the skill picks its route: install receipt, built source checkout, or none.
  - With no engine, the agent sends one plain message saying what will be installed, where, roughly how big it is and which system tools are missing, then waits for one yes. After that it runs the setup script and any listed prerequisite installs, then continues the user's request.
  - On a no, it offers the director-only plan described in the B6 model, labelled not validated and not rendered, and writes no engine source.
  - Docs use `npx -y naraframe@<version>` for one-off commands.
- **Launcher:** the `version` probe pipes the engine's stderr. Every bootstrap failure prints one line, `CODE: message. Next: …`, pointing to `installation.md`, and keeps exit 2.
- **Acceptance:**
  1. In a fresh temporary project containing only a copied skill folder and no engine, a fresh-context agent told only "make a short explainer about X" asks once. After a scripted yes, it installs from the local package tarball, adopts and binds the skill, runs `doctor` green and reaches a validated project. Pre-publication runs use the tarball override, and the npm default is exercised after publish.
  2. The same setup with a no yields a director-only plan and no engine source.
  3. An installed skill with its engine removed prints one clean line and no stack trace.
  4. Setup is idempotent on a second run.
  5. Installer, launcher, packaging and existing gates stay green.

**B6b evidence — 2026-10-18 (branch `b6b-skill-without-engine`; owner-approved with correction pass 1 and integrated through its own PR):**
- **Implementation:**
  - `pnpm pack:npm` writes an `npm-shrinkwrap.json`: 299 entries, 296 registry packages with `resolved` and `integrity`, and the two bundled `@naraframe/*` marked `inBundle`. A consumer install matched it on every version. The tarball is 274 KB with 132 files, and the pack is reproducible (SHA-256 `3eb15f85…` from both the executor and the supervisor).
  - `skills/naraframe/scripts/setup-engine.mjs` adds `--check`, install into `~/.naraframe/engine/<version>` (staged and swapped, restoring on failure), adopt-and-bind, then `doctor`. It reuses a healthy engine and reports missing tools without installing them. It requires Node 24.20.0 to match `doctor`.
  - `skills/naraframe/engine.json` pins the engine version, and the pack fails if it drifts.
  - The installer gains `--adopt`, accepted only for a receipt-less folder byte-identical to the engine's canonical skill.
  - The launcher prints exactly one `CODE: message. Next: …` line and exits 2, with no stack traces.
  - The skill gains a route choice, a no-engine flow (one plain consent message, then setup) and a director-only plan.
- **Executor acceptance:** a copied skill folder plus the local tarball gave `--check` with no writes; setup in 23 s (237 MB) adopted the skill and turned `doctor` green; a second run reused everything in 1 s; with the engine removed, one clean launcher line appeared.
- **Fresh-agent onboarding (supervisor):** two new Sonnet agents with only a copied skill folder, a scratch HOME and the request "Buatkan video explainer pendek … kenapa langit berwarna biru". The real `~/.naraframe` stayed untouched.
  - **Yes path:** one plain consent message about 13 s in, then setup from the local tarball (about 42 s), the skill adopted, and `doctor` green. A validated project followed, then draft preview `167d6118b5b3-550e24b2-165` (540x960, 465 frames, frame integrity clean; supervisor viewed key frames).
    - Engine ready about 65 s after start; draft about 3.5 min after start.
  - **No path:** the same consent message; after "no", an offer of a director-only plan. With "boleh", the agent wrote `rencana-video-langit-biru.md`, labelled "Belum divalidasi, belum dirender", and no engine source files.
- **Friction they reported (not fixed in B6b; candidates for B6c or a later batch):**
  - Jargon in the consent message.
  - The install question comes before any word about the video itself.
  - No guidance on a default profile when the user names none; `current-issues` is the only built-in and requires sourcing.
  - No guidance on where to place the project folder or how to populate the first source before any revision exists.
  - The CLI has no `--help`.
  - The single-column contact sheet is hard to read.
  - Warnings print twice (stderr and JSON).
  - The npm default source is untested until publish.
- **Gates:** `pnpm verify` exit 0, re-run by the supervisor (Biome 236, unit 360/360, integration 497/497, including 27 new setup, installer and package tests). No render change, so no E2E.

**B6b correction pass 1 — nothing written into the skill folder (owner-approved 2026-10-18).** Claude Code installs plugin skills into a versioned cache (`~/.claude/plugins/cache/<marketplace>/<plugin>/<version>/`) and documents "Don't write state there"; the folder is replaced on update. Skill installs through `npx skills add`, Codex `.agents/skills` or a plain copy should behave the same. Correction:
- **Static launcher:** the skill ships `scripts/naraframe.mjs` as an ordinary file rather than a generated one.
  - With no receipt, it reads the engine version from `engine.json` and locates the engine at `$NARAFRAME_HOME/engine/<version>`, with `NARAFRAME_HOME` defaulting to `~/.naraframe`.
  - It checks `version --json` against the pinned version and forwards argv.
  - When an `installation.json` receipt is present (explicit installer route), it keeps today's receipt binding and identity checks.
- **`setup-engine.mjs`:** by default it writes only under `NARAFRAME_HOME`, never into the skill folder. Adopting or binding through the installer becomes an explicit opt-in for manual project installs.
- **Skill text:** no instruction depends on writing to the skill folder. Scripts are referenced through the skill folder, as `${CLAUDE_SKILL_DIR}` for Claude plugin skills, so they resolve from a plugin cache.
- **Acceptance:**
  1. A copied skill folder made read-only (simulating a plugin cache) goes through `--check`, setup, launcher `version` and `doctor` green, with no file in the skill folder changed (tree hash before and after).
  2. The receipt route still works.
  3. Earlier B6b tests and gates stay green or are updated deliberately.

**B6b correction 1 evidence — 2026-10-18:**
- **Implementation:**
  - The static launcher `skills/naraframe/scripts/naraframe.mjs` follows the receipt binding when an `installation.json` is present. Otherwise it resolves `$NARAFRAME_HOME/engine/<engine.json version>` and checks version and APIs.
  - `setup-engine.mjs` writes only under `NARAFRAME_HOME` by default, with `--bind-skill` as an explicit opt-in.
  - The installer copies the canonical launcher instead of generating one.
- **Executor acceptance:** a `chmod -R a-w` copy went through check, setup (19.5 s), launcher `version` and `doctor` 8/8 with the skill tree hash unchanged. The receipt route and `--bind-skill` adopt still work.
- **Fresh-agent retest (supervisor):** both runs used a read-only skill folder, a scratch HOME and the same request. The supervisor's tree hashes of both skill folders were unchanged afterwards, and the real `~/.naraframe` stayed absent.
  - **Yes path:** one consent message; setup (33 s); engine ready at about 65 s; a validated project at about 176 s; first draft `fa0d966570d9-7f7a1e37-74c` at about 222 s. One ordinary `edit` revision followed (clearing `TEXT_OUTSIDE_SAFE_ZONE`), then draft `c00ad34f29cc-e1f3dcf6-de4`: 450 frames, 0 integrity outliers, key frames viewed by the supervisor.
  - **No path:** one consent message, then the director-only offer. With "boleh", the agent wrote a plain-text plan and no engine source. The read-only folder caused no errors.
- **Gates:** `pnpm verify` exit 0, re-run by the supervisor (Biome 237, unit 360/360, integration 508/508).
- **Onboarding friction from both runs (for B6c, B6d or a later batch; not fixed here):**
  - There is no command that lists built-in profiles, and no guidance on a default profile. `current-issues` is news-styled and requires sourcing. `profiles/series` and `profiles/starter` look like profiles but fail `profile inspect`.
  - Consent wording still leans on jargon, and a "no" leads to a second question; one message could offer both options.
  - The director-only plan has no template and no resume hint.
  - The skill does not state that transitions play on scene exit.
  - `--help` says "advertised M0 commands".
  - SKILL.md is 38 KB, so first-time agents read it in pieces.
  - An unverified source URL was cited to satisfy `requireSourcing`, which needs the owner's check in real use.

**B6 order revised (owner, 2026-10-18):** B6c = first-run onboarding and profiles, B6d = distribution channels (Claude plugin marketplace, `npx skills add`, Codex and other agents), B6e = public README (C1). Public copy names no other engines or skills; it states NaraFrame's own strengths.

**B6c model — a new user understands NaraFrame and picks the right profile in the first minutes.**
- **What NaraFrame is, told early:** the skill opens with a short "Start here" section that the agent can relay in plain words. The points are:
  - NaraFrame makes vertical explainer videos for a recurring series;
  - a profile keeps the look, type, voice style and sourcing rules consistent across episodes;
  - each episode goes preview → owner approval → export of exactly the approved version;
  - work is reused (unchanged scenes are not re-rendered, prepared audio is imported once, library patterns are pinned, and a series can switch profile with a dry-run report);
  - the engine checks text fit, safe areas, transitions and corrupted frames before anything is exported.
- **Choosing a profile:** the agent asks one question, whether this is a one-off video or a series.
  - One-off or unspecified → the neutral built-in explainer profile.
  - News or current affairs → `current-issues`, which requires sources.
  - A series or brand → a local profile copied from a built-in into the user's workspace, with palette, type and direction edited, then `create --profile <path>`.
  - The agent never invents sources to satisfy a profile; it asks.
- **Engine support:**
  - `profile list [--json]` lists the built-in profiles with id, version, a one-line purpose, whether sourcing is required, preferred duration and voice style.
  - The neutral explainer profile (today a test fixture, `general-explainer`) becomes a built-in after a rights check of everything it references.
  - CLI usage errors drop internal wording such as "advertised M0 commands".
- **Consent and director-only plan:**
  - The no-engine consent becomes one plain-language message that offers both options at once: install now, or a plan only.
  - The skill ships a short director-plan template whose last line tells the user how to continue later.
  - The skill states that a scene's transition plays as it exits.
- **Acceptance:**
  1. `profile list` and its tests.
  2. The new built-in profile validates, creates a project and previews.
  3. A fresh agent asked for a one-off science explainer explains the flow briefly, picks the neutral profile and does not cite unverified sources.
  4. A fresh agent asked for "a weekly series for my channel" sets up a local series profile before the first episode.
  5. Gates stay green.

**B6c evidence — 2026-10-18 (branch `b6c-onboarding-profiles`; owner-approved with correction pass 1 and integrated through its own PR):**
- **Implementation:**
  - `profile list [--json]` reports id, version, a summary (the first sentence of `direction.md`, so the strict lock schema stays unchanged), whether sourcing is required, preferred duration and voice style.
  - `general-explainer` moved from test fixtures to `profiles/` byte-identical. The rights check found no font, image or audio files, only system font names and repo-authored text. It is recorded in the distribution rights and notices, and both pack modes ship it.
  - CLI usage errors no longer mention internal milestones.
  - The skill gains "Start here" (12 lines, no other products named), "Choosing a profile", a single consent message with two numbered options, `examples/director-plan.md` with a resume line, and the rule that a scene's transition plays as it exits.
  - The supervisor fixed two README lines that still pointed at the old fixture path.
- **Gates:** `pnpm verify` exit 0, re-run by the supervisor (Biome 241, unit 364/364, integration 518/518).
- **Fresh agents** (read-only copied skill, scratch HOME, local tarball; both skill folders were byte-identical to the repo skill afterwards; the real `~/.naraframe` stayed absent):
  - **One-off ("kenapa es mengapung", 20 s, silent):**
    - The agent explained the flow in plain Indonesian and asked the one-off/series question, then sent the two-option install message.
    - It chose `general-explainer` and invented no source: claims were labelled and the scene notes record that the owner has none.
    - Engine ready at about 46 s; draft `7eb2348120f1-672a2676-7de` about 3.7 min after start.
  - **Weekly series ("Sains Santai", dark green and yellow, silent):**
    - The agent combined the explanation and install offer into one message, then asked for the series details.
    - It copied `general-explainer` to `<workspace>/profiles/sains-santai`, recoloured it and rewrote `direction.md`. `profile inspect` passed.
    - The episode was created with `--profile ./profiles/sains-santai` (locked `sains-santai@1.0.0`, local source) and revised once through `edit`.
    - Draft `c6406df24de9-ca25b419-1b5`: 915 frames, 0 integrity outliers, series look confirmed by the supervisor.
    - Engine ready at 42 s, series profile at 72 s, draft at 252 s.
- **Remaining friction (for B6e docs or a later batch):**
  - The skill does not say that the first `scenes.json` is written directly and only later changes go through `edit`.
  - It does not say which profile fields are safe to change for a series; the stroke colour follows the surface colour.
  - Variety warnings pull against deliberate repeated structures.
  - There is no field to record an owner's "no source" decision, so `SOURCE_MISSING` warnings persist.
  - `PANEL_DEAD_SPACE` fires on drawn objects such as water.
  - The tall single-column contact sheet needs ffmpeg to review.
  - Human-readable text on stderr sits alongside the JSON on stdout.
  - The order of series questions versus the install offer is a judgement call.

**B6c correction pass 1 — remove onboarding friction the simplest way (owner, 2026-10-18).** Principle: the user answers ordinary questions; the agent and engine do the technical work. Fixes:
1. **One first message.** A short explanation, the one-off-or-series question and the install options (when no engine) go together in one message. Series details are asked after the engine is ready.
2. **`profile new`:** a command creates a series profile in the user's workspace from a built-in profile, a series name and up to three colours (background, accent, optionally text).
   - The engine derives dependent values, such as the stroke and surface contrast, so the colours stay consistent.
   - It writes a short `direction.md` template in plain language.
   - It runs the same checks as `profile inspect`.
3. **First source:** one sentence in the skill. A new project's first `scenes.json` is written directly; later changes go through `edit`.
4. **Owner "no sources" decision:** a project-level record of the owner's choice to go without sources (who, when, a short reason), set after asking once.
   - It replaces per-scene `SOURCE_MISSING` warnings with one info issue.
   - It never relaxes a profile that requires sourcing.
   - Claims stay labelled.
5. **Variety warnings:** the skill says they are suggestions, not to be chased for a deliberately repeated structure.
6. **`PANEL_DEAD_SPACE`:** it applies only to backdrop panels that actually hold content, not to drawn objects such as water or a line. Narrowest engine change, with a regression for the trial case.
7. **Storyboard image:** a grid image of the checked frames is added next to each build for at-a-glance review. The existing contact sheet stays unchanged, so earlier builds and reuse stay valid.
8. **JSON output:** with `--json`, the human-readable summary is no longer printed to stderr. Errors still exit non-zero with structured issues.

**Acceptance:** each fix has focused tests and gates stay green. Two fresh agents (one-off and weekly series, read-only skill) repeat the B6c scenarios: one first message, the series created with `profile new` from a name and colours, and no repeated `SOURCE_MISSING` noise after the owner's decision.

**B6c correction 1 evidence — 2026-10-18:**
- **Fixes:**
  - One combined first message.
  - `profile new <dir> --from <id> --name … --background … --accent … [--text] [--language]`, which derives text, panel and stroke colours with contrast checks (text ≥ 4.5, accent ≥ 3), writes a plain `direction.md` and refuses unsafe inputs without leaving files.
  - Optional `naraframe.json` `sourcing.ownerDecision: "no-sources"`: with `requireSourcing` false, per-claim `SOURCE_MISSING` collapses into one `SOURCES_WAIVED` info; with it true, nothing changes.
  - A skill note that variety warnings are suggestions.
  - `PANEL_DEAD_SPACE` applies only to panels wholly containing a text or image layer; the Krakatau case is unchanged.
  - An optional `storyboard.png` grid in new preview builds. It is hashed and validated when present, older builds and reuse stay valid, and `contact-sheet.png` is unchanged.
  - With `--json`, issue text is no longer printed to stderr as well. Render and export progress lines stay on stderr; the first E2E run showed that removing them broke interruption timing and hid progress from agents.
- **Supervisor fixes:**
  - Storyboard time labels sit in a strip under each frame (cell 270x504) instead of over the frame, so headlines and captions stay visible. Checked on a real render.
  - Skill sentences on the storyboard as the first review image, turning colour words into hex values and saying which were picked, the `--language` form, running from the workspace folder, `decidedBy` defaulting to "owner", and what each transition looks like (checked against `motion.ts`).
- **Render keys:** no pixel or render-key change. A scene reused from an older build keeps its old `PANEL_DEAD_SPACE` warning in its report until re-rendered.
- **Gates:** `pnpm verify` exit 0 (Biome 243, unit 370/370, integration 529/529). Skill tests 54/54 after the supervisor's doc edits.
- **First full E2E failed (2/24, retained, log SHA-256 prefix `d5fe1e98`):**
  - `interruption-recovery` waits for progress on stderr, which the `--json` quiet change had removed. Progress was restored, which is a real regression fix.
  - `owner-flow` asserts the exact build artifact list and now expects `storyboard.png`, a deliberate change.
  - Verify and full E2E were then re-run: `pnpm verify` exit 0 (Biome 243, unit 370/370, integration 529/529), and full serial E2E 14 files / 24 tests passed in 983 s, ending 14:30:09 WIB (log SHA-256 prefix `1bb26321`).
- **Fresh-agent retest (read-only skill, scratch HOME, local tarball):**
  - **One-off:** one message before any work, `general-explainer`, the owner's no-sources decision asked once and recorded (only `SOURCES_WAIVED` remains), draft `0ea9aa49eafd-6428d532-22a` in about 4 min.
  - **Weekly series:** one message before any work. `profile new` built `sains-santai` from a name and two colours, needing only `direction.md` wording by hand. The episode was pinned to it, preflight passed first time, decision recorded, draft `fcd690978a8e-afc5ed60-6ed` in about 4 min 20 s.
- **Follow-ups (not in B6c):**
  - The storyboard tiles every checked frame (about 6,200 px tall for 28 s); it should show key frames per scene.
  - There is no minimal first-scene template for a new profile or language.
  - Colours outside the palette, such as a blue for water, need literal hex values and are not repainted on a profile switch.

**B6d model — one-line skill installation on every common route.**
- **Claude Code plugin:** `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json` at the repository root, with plugin and marketplace both named `naraframe` and source `./`. The existing `skills/naraframe/SKILL.md` is discovered by the default `skills/` scan.
  - Install: `/plugin marketplace add fatlhr/NaraFrame`, then `/plugin install naraframe@naraframe`; the skill is invoked as `/naraframe:naraframe`.
  - The plugin version follows the engine version in `skills/naraframe/engine.json`, and a test keeps them equal.
  - License MIT, author Fatiha Rahmat, description in NaraFrame's own words.
- **`npx skills add` and Codex:** the repository layout (`skills/<name>/SKILL.md` with `name` and `description` frontmatter) is what these tools scan. Codex reads skills from `.agents/skills` (project) or `~/.agents/skills` (user).
- **Other agents and plain chat:** copy `skills/naraframe` and point the agent's instructions at its `SKILL.md`. Because the skill writes nothing into its own folder, any copy works.
- **Acceptance:**
  1. `claude plugin validate` passes on the repository.
  2. A marketplace added from the local checkout installs the plugin into an isolated Claude config directory (never the owner's real one), with the skill present in the plugin cache.
  3. A test checks the manifest fields, the version match, the skill frontmatter and that no excluded material (work, fixtures with private media) is required.
  4. Real GitHub-based installs and `npx skills add` are verified after the repository is public; they are not run before, because executing a third-party installer is outside the agent's allowed actions.
- The user-facing installation table is written in the public README (B6e).

**B6d evidence — 2026-10-18 (branch `b6d-distribution-channels`; owner-approved and integrated through its own PR):**
- **Manifests:** `.claude-plugin/plugin.json` and `marketplace.json` both pass `claude plugin validate` (Claude Code 2.1.289). Plugin and marketplace are named `naraframe`, the source is `./`, version 0.1.0 matches `engine.json`, licence MIT, author Fatiha Rahmat, and the copy names no other products.
- **Isolated install** (`CLAUDE_CONFIG_DIR` in the scratchpad; the owner's `~/.claude` was untouched):
  - A marketplace added from a clean `git clone` installed `naraframe@naraframe` into a 6.6 MB cache with exactly one `SKILL.md`. `claude plugin details` reports one skill, `naraframe`, at about 31 always-on tokens.
  - Finding: a marketplace added from a raw working directory copies untracked files too (16 GB here, deleted afterwards). Real GitHub installs clone tracked files only, and contributors testing locally should add a clean clone.
- **Skill trigger:** the frontmatter description now matches ordinary requests ("make … a short vertical explainer video … recurring social media series … consistent look across a video series") instead of naming NaraFrame only.
- **Tests:** `plugin-manifest.test.ts` (3) checks the marketplace entry, version equality with `engine.json`, and the skill frontmatter.
- **Gates:** `pnpm verify` exit 0 (Biome 246, unit 373/373, integration 529/529). No render change.
- **Not run before publication:** `/plugin marketplace add fatlhr/NaraFrame` from GitHub (the repository is private) and `npx skills add` (it executes a third-party installer, which the agent does not run). The layout matches what both document. Codex uses `.agents/skills`; the shipped installer's `--host codex` route was verified in M4.5.3.

**B6e / C1 evidence — 2026-10-18 (branch `b6e-public-readme`; owner-reviewed and integrated through its own PR):**
- **Process:** `marketing:draft-content` (landing-page shape, owner's voice: direct, friendly, honest, no other products named), then `marketing:brand-review`.
- **The review caught two false claims before publication, fixed in the README and in the skill's "Start here":**
  - "unchanged scenes are not re-rendered": scene keys only feed the reuse report. Only an unchanged build is reused, or a single scene previewed.
  - "content outside the safe area stops the export": safe-area findings are warnings.
  - It also added an early-release (0.1.0) line.
- **README:** outcome-first, covering why, how it works in four steps, one look per series, example requests, install (Claude Code plugin; Codex and other agents by folder copy; without an agent → technical guide), requirements, limits, licence (MIT plus Remotion's terms) and links. No personal paths or projects.
- **Technical guide:** the former 510-line README moved to `docs/guide.md`, with relative links adjusted, `../NaraFrame-projects` example paths renamed to `../my-videos`, and a pointer to the plugin route.
- **Images** (`docs/assets/readme/`, 104–185 KB each):
  - `hero.png`: four frames of the owner-approved 1080 export of the demo "Kenapa es mengapung di air?".
  - `two-looks.png`: the same two scenes from that export and from an owner-approved export after `profile apply` to the "Sains Santai" series profile.
  - `storyboard.png`: the first two rows of the series demo's preview storyboard, keeping its DRAFT label because it is a preview artifact.
  - The demos were authored by fresh agents from the repository's own profiles, with drawn shapes and system font names only, and no third-party media.
- **Demo exports** (owner approval 2026-10-18 for README images): `es-mengapung` `6ffc820f6beb-ae936181-9d7`, `kucing-kotak` `b8c87fb722fb-4aebd58e-50a`, `es-mengapung-sains` `07b276808be0-32f7eb2b-b44`. All are 1080x1920, full decode clean, 0 integrity outliers, with no DRAFT label in the finals. Sources live in `work/m4-followups/b6e/demo/`.
- **Release order (owner action):**
  1. `npm publish` the `naraframe` package.
  2. Then make the repository public. Before that, the agent-led setup default (`naraframe@0.1.0` from npm) and the GitHub plugin install cannot work for others.
  3. After publication, verify `/plugin marketplace add fatlhr/NaraFrame`, `npx skills add` and a fresh setup without `--source`.

**Revision cost measurement — 2026-10-18 (for the README claim):** two fresh Sonnet agents with the same read-only skill and installed engine, same target. The request changed the density scene's title to "Es 8% lebih ringan dari air" and made the bars rise twice as slowly; both stopped at the draft preview.
- **A, revising the existing `es-mengapung` project through `edit`:** 101,777 tokens, 127.9 s, 14 tool calls. It read only the density scene's part of `scenes.json`, and the engine reported 3 of 4 scenes unchanged (draft `7136a9e093a8-1530e3d2-580`).
- **B, rebuilding the same video from a full brief:** 125,252 tokens, 226.7 s, 19 tool calls, including one `TEXT_OVERFLOW` fix (draft `a8398ccf4e17-16a49b02-e0e`).
- **Result:** the revision used about 19% fewer tokens and finished about 1.8x faster.
- **Most of the remaining cost is fixed per session.** Both agents loaded the 43 KB `SKILL.md`, and every tool turn carries that context.
- **Follow-up F8 candidate:** slim `SKILL.md` by moving rarely used detail into guides loaded on demand, then re-measure with the same test.
- Avoided renders save machine time, not tokens. Revisions inside the same session as the first draft were not measured.

**B6e README presentation (owner review, 2026-10-18):** badges, one emoji per section heading, tables, collapsible details (FAQ, other agents, example session), explicit HTML anchors for navigation (verified with GitHub's Markdown renderer), and a simple five-step flowchart image (`docs/assets/readme/flow.png`, drawn as `flow.svg` and rasterised with local Chrome; no third-party diagram tool was run).

**B6e README additions (owner review, 2026-10-18):** new sections "What you can make", "What you save" (measured first-draft time and revision savings), "Style gallery", "The menus behind the looks" (profiles, shot patterns, moves, transitions, captions, sound, series extras) and "Questions", plus a Mermaid flowchart and an example session. Every claim was checked against shipped behaviour. The gallery has two real cards from approved exports (science explainer, weekly series) and four labelled placeholders.

**G1 (scheduled, separate task) — real gallery cards:** fresh agents make four demos from repository resources only, then the supervisor reviews frames and the owner approves the exports:
- a news explainer in `current-issues`, with sources;
- a paper-and-ink explainer in the contrast profile;
- a route or process with the `path-note` pattern;
- a picture with pointers with the `anchored-note` pattern and a repository synthetic plate.

Their final frames replace the README placeholders.

**B7 model — skill formula from the reference study (owner-approved 2026-10-18; PR order owner-approved: skill restructure first, engine aids second).**
- **Reference study** (`bangtutorial/bang-motion`, `heygen-com/hyperframes`): a router skill with a capability map and "use when" tables, job guides loaded on demand, and checks an agent can verify itself. NaraFrame adopts the pattern; the content stays NaraFrame's own.
- **PR1 — skill restructure (`b7-skill-restructure`):**
  - `SKILL.md` becomes a router ≤ 20 KB (target 15–18): Start here, a first-match table where a specific edit to an existing project goes straight to the revision route, the engine routes and the one-message no-engine consent, choosing a profile, the cheapest-first verification ladder (validate plan → scoped draft → full draft → inspect → production validate → render), a compact claims/sources summary, the result contract and command allowlist, and the guide index.
  - New guides loaded on demand: `authoring.md` (creation workflow, production vocabulary, space/camera/timing/poses, claims detail, visual forms and layer mechanics), `revisions.md` (edit/expect/reuse/remove, history/undo, the correction loop, profile switches), `export.md` (preview inspection, scoped previews, resolution, reuse, audio modes and soundtrack, approval and render). Existing guides stay unchanged.
  - The frontmatter description also triggers on revision phrases.
  - The old-section → new-home mapping is recorded and every block is verified to land somewhere.
  - Formula test: SKILL.md ≤ 20 KB, description triggers, every relative link resolves.
  - Acceptance: the same-day A/B revision test and both onboarding scenarios re-run with the new skill; gates green.
- **PR1 supervisor review (2026-10-18):**
  - Router 14.4 KB (from 44.0 KB), the first-match table with the revision route, one-message consent, the ladder, claims summary, allowlist with `history`, and revision-trigger description all match the model. 47/47 error codes of the old skill are present.
  - One dropped sentence (trusted-recipe dry-run `plan.bindings.recipeParams` states and `recipeCoverage`) was restored in `revisions.md`, and `content-map.md` was corrected.
  - The work moved from uncommitted `main` to `b7-skill-restructure`.
  - Separately, `main` failed Biome because B6e's `flow.svg` had no `<title>`. It was added after B6e's last verify, which was a supervisor mistake. The fix, with a title that matches the five-step image, ships as its own hotfix PR rather than inside PR1.
  - `pnpm verify` exit 0 on the branch (Biome 248, unit 377/377, integration 529/529).
- **PR1 integrated:** PR #49, squash-merged as `1359b32` after the hotfix PR #48 (`298a5c3`).
- **PR1 fresh-agent measurement (2026-10-18, supervisor):**
  - **Setup:** fresh Sonnet subagents with read-only `git archive` copies of the old skill (`24804e8`, 44,019 B) and the new router (`1359b32`, 14,422 B), a scratch HOME and NARAFRAME_HOME, and an engine installed by `setup-engine.mjs --source` from a fresh `pnpm pack:npm` (18 s).
    - Skill tree hashes were unchanged afterwards, and the real `~/.naraframe` stayed absent.
    - The vendored `pack-pr1` tarball is rejected by `setup-engine` (`SETUP_ENGINE_INVALID`); only the registry pack installs.
  - **A/B revision test:** same request as B6e on two copies of `es-mengapung`, run one after the other.

    | | Old skill | New router |
    | --- | --- | --- |
    | Final context | 100,420 tokens | 92,856 tokens (−7.5%) |
    | Input summed over turns | 900,526 | 724,823 (−19.5%) |
    | Time | 108.4 s | 93.4 s |
    | Tool calls | 10 | 10 |

    - The B6e baseline was 101,777 tokens / 127.9 s / 14 tool calls.
    - Both used `doctor`, `status`, one `edit` (3 of 4 scenes reused), `validate` and `preview --draft`. Both drafts had 600 frames and 0 integrity outliers.
    - The new arm read `revisions.md` and `export.md` and skipped `authoring.md`.
    - The harness's own context is 64,292 tokens before any skill read, so the skill-dependent share fell by about 21%.
    - Evidence: `work/m4-followups/b7/runs/pr1-ab/`.
  - **Onboarding, one-off (sky):**
    - First reply at 26.5 s: the Start-here points, "engine already installed", and only the one-off/series question.
    - After "one-off": `general-explainer`, then `create`, then `schema --json`, then one `SCHEMA_INVALID` fix.
    - Draft `8f643206bb03-85089f56-f02`: 38 s, 1140 frames, 0 outliers. 113,895 tokens, 15 tool calls.
    - The sources question was deferred until after the draft.
  - **Onboarding, series (weekly science account):**
    - The agent took "mingguan" as a series and asked for name, colours and language instead of asking the one-off question.
    - It ran `profile new` (it said which hex values it picked) and filled `direction.md` before `create`.
    - One `SCHEMA_INVALID` fix and one `edit`. Draft `0543a9866ffb-2e60f626-4e2`: 30 s, 900 frames, 0 outliers. 135,695 tokens, 24 tool calls. It ended with the one-time sources question.
    - The supervisor viewed all three new storyboards. Evidence: `work/m4-followups/b7/runs/pr1-onboarding/`.
  - **For PR2:** both onboarding agents dumped `schema --json` and failed their first `validate` on missing or unknown fields, which is what `create --template starter` targets.
- **PR2 — engine aids (`b7-engine-aids`):**
  - `outline [project] [--json]`, read-only: plan load only; invalid → exit 1 with issues; valid → `data.outline` with project (including `currentRevision`), each scene's ids, duration, role, transition, camera, narration anchor, claims, note, layer ids with text and frame, and beat ids with timings and params, narration blocks with phrases (word lists excluded), captions mode and asset ids/kinds. Human output: one project line and one line per scene.
  - `create <name> --profile <p> --template starter [--json]`: one built-in template value now (`starter`); an unknown value is a usage error listing the supported names. The content is a typed core constant: three claim-free scenes (~26 s total, inside both built-in profiles' 15–30 s), palette tokens only, no bindings or narration, with notes that teach the structure.
  - Skill diff: the revision route starts from `outline`; the authoring route offers `create --template starter`.
  - Acceptance: the A/B revision test with `outline` and the onboarding scenario with `--template` (no 150 KB schema dump); gates green.
- **PR2 implementation and review (2026-10-18):**
  - **`outline [project] [--scene <id>] [--json]`:**
    - It is read-only and loads only the plan. It is built by the pure `buildOutline` and `narrowOutlineToScene` in `packages/core/src/project/outline.ts`.
    - `currentRevision` equals `status` and `validate`'s `sourceRevision`; the supervisor checked this on a scratch `es-mengapung`.
    - `--scene` keeps one scene in full, with only the narration blocks and assets it uses. An unknown id gives `SCENE_NOT_FOUND`, as `preview --scene` does.
    - Human output is one line per scene, plus one line per layer and per beat with `--scene`.
  - **`create --template starter`:**
    - It is a typed core constant (`templates.ts`): hook, explanation and payoff scenes, 25,500 ms, palette tokens only, no assets, narration or recipes, and a `cut` on the last scene.
    - It validates with zero issues under `general-explainer`. Under `current-issues` the only issue is the info `CLAIMS_UNLABELLED`.
    - An unknown or missing value is a usage error that lists `starter`.
  - **Supervisor changes:**
    - The template carries no `carriesFactualClaim` label, so agents are never shown a `false` to copy; the engine treats an absent label as no claim.
    - `outline --scene` was added after measurement showed the full JSON outline costs more than it saves.
    - `authoring.md` now says the starter is text only and that each scene needs its drawn object.
  - **Skill:**
    - The revision route is `status`, then human `outline`, then `outline --scene <id> --json`, then a targeted `jq` staged copy, then `edit`.
    - The authoring route starts from `--template starter`.
    - `SKILL.md` is 14,610 B with `outline [--scene <id>]` on the allowlist.
  - **Gates:**
    - `pnpm verify` exit 0, run by the supervisor before the `--scene` change (Biome 253, unit 380/380, integration 544/544) and by the executor after it (unit 383/383, integration 547/547).
    - After the final wording edit: Biome clean, skill and template tests green.
    - One earlier run had a one-off failure in `recipe-project.test.ts`, where one of three concurrent trust appends was lost. It was raised as a separate task and is not in this PR.
  - **Measurements** (`work/m4-followups/b7/runs/pr2/`), same revision request:

    | Run | Final context | Time | Tool calls |
    | --- | --- | --- | --- |
    | Old skill | 100,420 tokens | 108.4 s | 10 |
    | PR1 router | 92,856 tokens | 93.4 s | 10 |
    | PR2, full `outline --json` | 97,247 tokens | 118.0 s | 12 |
    | PR2, `outline` + `--scene` | 90,534 tokens | 106.4 s | 10 |

    - Draft `7136a9e093a8-524661c6-796`: 600 frames, 0 outliers.
    - The token saving is the router's. `outline --scene` keeps the route explicit at no extra cost.
  - **Onboarding with `--template`:**
    - No schema dump, and the first `validate` had no errors. The sources question was asked once before the preview.
    - Draft `c03a4489c365-598d43c2-b87`: 25.5 s, 765 frames, 0 outliers. About 109k tokens, 16 tool calls.
    - The video came out as a text-only slideshow, which led to the `authoring.md` sentence above.

**Closing task C1 — public README (after F1–F6, owner request 2026-10-17):** rewrite the repository README for a public audience before the repository is opened. Remove references to the owner's personal paths, projects and accounts; lead with what NaraFrame does for a creator in plain language, then installation and use of the engine and skill; add relevant images (stills/contact sheets or short loops from rights-cleared or synthetic examples only, never the trial's uncleared media or private LBC/TutorLog material). Keep claims tied to current behaviour, note the macOS arm64 limit and that no registry release exists. Publishing the repository, a code licence and asset redistribution rights stay separate owner decisions.

Each needs its own demand/evidence and authorization. None is automatically a new task just because M4 is documented.

## 5. Cleanup and documentation package — 2026-10-13

**Scope authorized:** archive scratch/evidence and cache recoverably, snapshot documents, compact active documentation, record M4, redirect README production examples. No engine, skill, test, dependency or feature behavior changes.

- [x] Capture old spec/refine/plan/discovery exactly, including the local Batch F closure, under `docs/history/2026-10-13/`; verify their hashes in `snapshots.json`.
- [x] Inventory `work/`: 36,228 regular files, 3,412,492,972 bytes; preserve symlink targets and relative paths.
- [x] Copy to `/Users/fatih/Code/Playground/NaraFrame-archive/2026-10-13/work/`; compare every file hash and symlink target, then recheck unchanged source.
- [x] Record original/destination mapping and verification in the archive's `index.json`.
- [x] Confirm no active bundling/render; move original `work/` to `/Users/fatih/.Trash/naraframe-work-2026-10-13` and Webpack cache to `/Users/fatih/.Trash/naraframe-webpack-2026-10-13`.
- [x] Make discovery historical; retain existing source/runtime/tests/fixtures/profiles and both Krakatau samples.
- [x] Rewrite active spec/refine/plan and record M4.1–M4.5 PLANNED with three review batches.
- [x] Redirect README production examples outside the repository; retain English product/install/use documentation.
- [x] Verify active links, historical snapshot hashes, protected source/skill/test/AGENTS hashes, samples, worktree, stash and pre-existing refs.
- [x] Run `git diff --check`, pinned build/typecheck and `doctor --json`; record exact results below.

Archive and Trash moves are recoverable. Trash does not free disk space until the user empties it; this package does not empty Trash. Restore an old project from the external archive (or the Trash copy), not from a fresh empty scratch directory. Historical `work/...` references resolve against that archived root.

### Handoff record — cleanup / MVP 2 documentation

Status: **CLOSED / INTEGRATED**, PR #33 / `aab831c`. Branch `cleanup-mvp2-docs`; code baseline `e008490`. Cleanup, documentation and scoped verification complete. Fatih authorized commit/push/merge on 2026-10-13 after the READY_FOR_REVIEW handoff. Subsequent Batch 1 authorization is recorded separately below.

Evidence run in this cleanup: 36,228 file checksums and symlink targets matched; four immutable document snapshots include local closure; 231 tracked non-document files unchanged against the starting snapshot, including source/skill/tests and the user's dirty AGENTS.md. Both sample inventories, HEAD, worktree registration and branch/stash refs match the baseline after creation of this task branch. Original scratch and cache are recoverable in Trash.

Verification: `pnpm typecheck` and `pnpm build` exit 0 with Node 24.20.0 / pnpm 12.3.4. `pnpm naraframe doctor --json` exit 0, ready, zero issues, eight ready checks, no download/render. All 43 active local links and historical snapshot hashes match; `git diff --check` exits 0. The [verification receipt](history/2026-10-13/cleanup-verification.json) records baseline and archive hashes. Unit/integration/E2E suites and rendering were not rerun for this documentation-only package; old gate results in history remain historical evidence.

Protected: unrelated `AGENTS.md`, `.git`, Miss Ayu linked worktree, stash, old branches, samples and runtime source. README was already untracked at task start and is included as the English product document in this authorized integration. Stage documentation paths explicitly; exclude AGENTS.md, generated runtime, work/ and external archive contents. Use a PR and squash-merge with an exact-head guard, then sync main without discarding user changes. The verification receipt records the earlier cleanup checkpoint, before Git authorization.

### Handoff record — Batch 1 / M4.1 + M4.2 (2026-10-14)

Status: **OWNER_ACCEPTED / COMMIT_AUTHORIZED; final E2E deferred**. Branch `m4-batch-1` from `aab831c`, no push/merge. Independent task reviews and whole-branch review found no remaining critical/important source defect. Fatih accepted NF-AC-21's representative authoring output and confirmed the caption behavior, then authorized committing Batch 1 and cherry-picking it into the next batch branch. Main integration is withheld until the end of MVP 2; historical failures remain disclosed.

**M4.1:** compact shot rundown/vocabulary in skill; six source-v1 editable patterns plus public-schema check helper. Baseline used old skill; fresh updated author read skill/reference/examples, public schema/CLI and its own profile/project only. Controller handled renderer escalation and one runtime/PATH repair; active time/cost are unknown after a usage interruption. This is supported authoring evidence, not a claim of repeated completely independent success. First draft saved before the two ordinary headline/camera revisions. Technique examples were rendered and manually inspected; numeric line-box overflow found in an initial example was corrected through edit, failed source preserved and regression check demonstrated. The earlier request for an explanation was not treated as approval; the subsequent explicit owner acceptance is recorded below.

- Detailed source/reads/commands/corrections: `work/m4-batch-1/task-1-report.md`, `art-direction/baseline-report.md`, `art-direction/updated-report.md`.
- Preserved first updated draft: `fabcdcb9f309-677ff2c7-e33`; final ordinary revision: `241db472…`, build `d3e2ca4888d4-d9b2f5ff-482` (10 s, engine 11 during the skill-only trial).
- Exact external acceptance: `../NaraFrame-projects/mvp2/art-direction`; validate and scoped preview successful, same source revision, candidate engine 12 build `2d06b51b0f22-4d6b36b9-804`. `external-art-validate.json` / `external-art-preview.json` preserve outputs. Only the deliberate short-duration recommendation remains. Six-example total/cut/viewpoint/dead-space/route-contrast advisories remain disclosed, not suppressed. No parity or publication approval.

**M4.2:** none/selected/full, phrase-local selections, profile defaults and locks, inherited styling and allowed overrides. Shared frame-window calculation and measured wrapping; none/empty selected omit the caption object. Renderer version 12 invalidates old visual caches while leaving voice generation identity untouched. Independent review exposed a positive1ms full/scoped mismatch; correction rounds globally before clipping and includes preceding-block cues, with same/cross-block regressions. Old dist probe and failed exact-pixel audit retained. No dependency/provider/audio rewrite or new recipe trust.

- Public manual evidence: `work/m4-batch-1/caption-evidence/` (initial audit), `external-caption-evidence/` (final acceptance). Final external project `../NaraFrame-projects/mvp2/captions` ran three source revisions at 540/1080, status/edit/validate/preview, scrim-only change, and undo/reuse. All final audit checks true. The initial bitwise crop oracle was too strict for separately encoded MP4; original failed result retained. Qualified MSE/PSNR checks verify cue presence/absence and stable geometry, not raw pixel repeatability.
- Full source `a88b0858…`: native `33cd099612ef-b0ccaf8d-b38`; selected `56699478…`: native `d8cd6917d23b-722fc719-22f`; none `55d57c20…`: native `7e7574096bba-c9081d22-8c2`.
- All modes retain 185 frames, narration hash `d0f5dc26…`, voice key `010e0b6b…` and master `6aadd6f0…`; decoded PCM hashes are identical. Selected cue appears only frames9–53 ([9,54)); full includes both original phrases. None has no glyph/scrim/measurement/collision region; scene geometry remains fixed within stated compressed-pixel tolerance. Undo selected/full names the matching prior build and identical copied MP4.
- Fresh-context ordinary policy/style revision: `caption-fresh-report.md`; one edit, no source correction, no renderer/private-code read. Native `119686b0079b-2188a8c0-7f6`, first phrase only9–53, font40designpx, scrim0; input master and decoded preview audio unchanged. Technical fixture contrast is not an owner design approval.

**Freeze/evidence provenance:** `work/m4-batch-1/freeze-1.json` and `freeze-after-trial.json` agree for source/runtime/skill/profile/narration/media. Core source `2c15c797…`; core dist253 files `ebfa98e0…`; CLI dist33 files `fc891fcc…`; renderer dist53 files `c0123918…`; skill5 files `1d3eb473…`. Node24.20.0 / pnpm12.3.4 / Remotion4.0.521 / Chrome155. Existing supplied audio only, no generation provider. Actual owner active time and monetary/token cost unmeasured.

**Checks:** focused final task checks passed (48 caption/narration/scoped/preflight; 63 with registry/example checks before the boundary regression). `pnpm verify` exit0: Biome197, 303 unit / 351 integration, typecheck/build. Complete raw log `work/gate-logs/m4-batch-1/verify.log`, SHA `a53586d165e58d2803c1f21616baa966c8b03761ea15c04a49b074c71b6a9ce1`. Doctor ready; diff check clean. Final task/whole-branch reviews are `task-1-review.md`, `task-2-review.md`, `batch-review.md`; reviewer reports distinguish code inspection from tests read rather than rerun.

**Continuation audit — 2026-10-14:** runtime/core/renderer/skill trees, external profile, narration and media still match freeze 1 (`freeze-resume.json`). The caption E2E fixture now conditionally adds `render.captions`; the original unconditional append duplicated a path already present in the supplied profile. This is test setup, not an engine defect, and its original failure remains recorded. Current test SHA `6cdb9d49d62869d87bd6fb0b6941d0330400353e2a73f121a2adb380dd183e90`. Focused resume checks: four affected unit/integration files, 44/44, exit0 (`focused-resume.log`). No runtime or skill change during this continuation.

- First serial E2E (`e2e.log`, SHA `6bb51540372e5d388cd35df0084e4269a0943ed57074ad52346e65696e91c979`): exit1, 22/24, 12/14 files, 1106.38 s. Caption policy failed before rendering because of that duplicate override. Interruption/recovery failed at the recovery `--rerender` process's 180 s timeout; baseline render and interruption assertions completed first. The timeout snapshot contained the Node CLI, with no recorded Chrome survivor; teardown reported no cleanup failure. Cause remains unproven. Owner-flow passed in this run; do not misreport it as a repeatability failure.
- A second serial run was already active when supervision resumed (`e2e-after-fixture-fix.log`, launched by the continued session at approximately 06:47 with `caffeinate -i`). It spans clamshell sleep at 06:58 and a 17:50 wake, recorded in `resume-sleep-events.log`; reference scenario 1 reports 39,270,066 ms. This run cannot establish a clean uninterrupted full-suite gate. Remaining checks are being collected, not replaced by a retry-until-green run. No additional full suite/render launched by the supervisor.
- At 17:57, available disk was 858 MiB; a later check showed 8.5 GiB. The supervisor did not delete files or free that space. Disk pressure is an observed constraint, not a proven cause of either timeout. No archive, Trash, unrelated process, or user file was deleted. Before another clean full gate, verify disk headroom and an uninterrupted host; keep the failed/sleep-affected logs and unchanged assertions.

The resumed test file passes a focused Biome check; `fixture-guard-probe.json` reproduces the original duplicate-path rejection and accepts the guarded fixture. `git diff --check` remains clean. Miss Ayu is still detached at `00942b5`, and stash@{0} remains the old unrequested word-timing work. Historical cleanup evidence has been moved back under its own handoff heading; it is not evidence for this feature batch.

The sleep-affected second run subsequently stopped without a final summary or wrapper exit line. Its Vitest/CLI/wrapper processes are no longer present; how they stopped is unknown. Partial log also names a silent-export failure; it lacks the final error stack. Do not infer passing tests from absent failed-test lines.

**Bounded final check:** only caption-policy and the named silent-export case ran in isolation after the old run stopped, with unchanged assertions/timeouts, pinned runtime and no concurrent render. `e2e-targeted-resume.log`: exit0, two files / 2 passed, 2 deliberately unselected tests skipped, 106.53 s. Caption policy now exercises full/selected/none, native preview, cue boundaries, unchanged master/PCM/voice key, empty-selection reuse, stale approval and undo. Silent export passes without a code change. That isolated result does not explain its earlier failure and does not replace a clean full-suite gate; interruption timeout and the sleep-affected run remain disclosed.

**Owner acceptance — 2026-10-14:** Fatih: “M4.1 diterima untuk bukti authoring, caption sudah sesuai.” This applies to representative build `2d06b51b0f22-4d6b36b9-804` and the linked full/selected/none native caption builds `33cd099612ef-b0ccaf8d-b38`, `d8cd6917d23b-722fc719-22f`, `7e7574096bba-c9081d22-8c2`. M4.1's owner-review checkbox is now complete; M4.2's displayed behavior is accepted. Scope remains authoring/feature evidence, not competitive visual parity, publication, export approval, a full-gate waiver, or Git authorization.

**Stopped gate — 2026-10-14:** one serial `pnpm test:e2e` began using pinned Node24.20.0 / pnpm12.3.4 with `caffeinate -dims` at 18:33 WIB, AC power, load about 2.4, 5.5 GiB available, no other NaraFrame render/test active. `freeze-final-gate-start.json` confirms source/dist/skill still match the reviewed freeze. Fatih then instructed that actions be confirmed first and E2E deferred to the end of MVP 2. The supervisor stopped the exact Vitest runner with SIGINT; session exit130, not a test verdict. Raw log `work/gate-logs/m4-batch-1/e2e-clean-final.log` is retained. A subsequent process check found no remaining runner or test Chrome/CLI. No assertions/timeouts or runtime code changed. No Git operation occurred.

**Authorized next step — 2026-10-14:** commit this accepted batch with explicit paths excluding AGENTS/work; create `m4-batch-2` from unchanged main and cherry-pick this commit. Develop M4.3 there, then use the same pattern for Batch 3. Do not push/merge/sync main now. Final E2E belongs to M4.5 and requires confirmation; earlier failures are not retrospectively passed. The current code/skill freeze is unchanged; the only resumed test correction is the guarded fixture setup.

**Pre-commit verification:** fresh pinned `pnpm verify` exit0 at 18:47 WIB: Biome197, 303 unit / 351 integration, typecheck/build; raw `work/gate-logs/m4-batch-1/verify-commit.log`. No E2E rerun. Staging is limited to the Batch 1 source/test/skill/README/three active documents; exclude user AGENTS and scratch evidence. Commit/cherry-pick preserves the owner-approved feature candidate and does not move main.

**Local commit/cherry-pick closure:** `m4-batch-1` commit `eb7a7d59c87478d4504bf817996c3ef5cc0aadf0`, exactly 27 task files, author Fatih, no agent identity/trailer. New `m4-batch-2` from main contains cherry-pick `d4f9d82cc11915553d9cffaefcc161fb3db4f331`; both trees are `b2f8edf42aea608cd985d098bafb35893d045a7b`. Local main and origin/main remain `aab831cd0a30ea53ba6274556729060d8ff29ba5`. No push, PR, merge, stash, discard or main sync. AGENTS SHA `c55c4025…` remains unchanged and uncommitted. This closure note is local Batch 2 documentation and will travel with its eventual commit.

**Preservation / boundaries:** AGENTS SHA `c55c4025…` unchanged from entry; Miss Ayu worktree at `00942b5`, old stash and branches preserved. Only numbered batch scope and supporting docs/tests changed. Existing repeatability/reliability caveats, D-VIS and publication rights remain open. No final export/production approval. Git integration still requires separate authorization; owner acceptance does not close M4 or waive remaining integration gates.

### Handoff — Batch 2 / M4.3 (2026-10-14)

Status: **READY_FOR_REVIEW; commit awaits Fatih's explicit approval.** No separate supervisor reviews this batch; Fatih reviews it directly. Branch `m4-batch-2`, base checkpoint `d4f9d82` (Batch 1 cherry-pick), unchanged-main base `aab831c`. Implementation, manual acceptance and the fresh-context trial were done by Codex; it stopped at its usage limit before the controller steps. Claude (controller) then reviewed the candidate, ran focused checks and `pnpm verify`, and wrote this handoff. The plan's MVP 2 Git exception authorizes batch commits, but Fatih's standing instruction requires explicit approval before any commit, so nothing is committed, pushed or merged.

**Candidate** (`work/m4-batch-2/candidate.json`): tracked code diff vs `d4f9d82` `087cfe42185d…`, 13 new source/test/library files with hashes, dist trees cli `b32e6c94b9f8…`, core `b3ba1063ba8c…`, renderer `c10799566381…`, skill tree `2a804a17a7f6…` (6 files), `library/` tree `5f5ba20f674b…`, starter catalog `b0e0f3bc8ead…`; Node 24.20.0, pnpm 12.3.4, Remotion 4.0.521.

**What changed.** Core: `schema/library.ts` (passive catalog schema 1), `library/stage.ts` (`inspectLibrary`, `stageLibrary`: capture-once with hash checks, namespaced asset IDs/paths, pinned `libraryImports` receipts, local regeneration, explicit `--update`, local-edit conflict, candidate validation on a hard-linked copy), `asset/image-placement.ts` (pure crop/fit/focal placement, browser-safe subpath `@naraframe/core/image-placement`), PNG `layout` and image-layer `crop` in schemas, compile marker `naraframe-image-crop/1` with source size only on cropped slots, capabilities for proven forms. CLI `library inspect|stage`. Renderer: cropped image path and preflight through the shared helper; uncropped legacy images unchanged; no global renderer bump. Skill: `library.md` and SKILL.md links. Starter catalog under `library/starter`. Not changed: recipe trust rules, audio, motion runtime.

**Evidence (Codex, public CLI; `work/m4-batch-2/task-report.md`, `library-manual-evidence.json`, `fresh-author-report.md`).** First native 1080 preview failed before frames with `SYSTEM_ERROR`; a direct entry bundle showed the core root import pulled `node:child_process` into the browser bundle; fixed with the browser-safe subpath and protected by `browser-bundle.test.ts` (failed attempt retained). External project `../NaraFrame-projects/mvp2/library`: import `anchored-note@1.0.0` → 1080 preview `f435ded12330-49393991-fdf` (crop and left-hand attachment); pinned re-stage (title, `pose-right`, `crop-x` 70) → revision `4cab08f8…`, media 3/3 reused, 540 preview `5e906d5fd36f-8d370416-5cb` (prop moved to the right hand); undo → `7072667b…`, 1080 preview reused `f435ded12330-49393991-fdf` as `f435ded12330-15802d08-208` with the same MP4. Second project imported `path-note`; copy, crop and pose revisions each with edit/status/undo; catalog hidden then advanced without changing pinned source or fingerprint; pinned staging without any catalog; explicit 1.1.0 update and undo; duplicate instance and local-edit regeneration refused; original PNG bytes unchanged. Recipe import (temporary fixtures only): code captured and snapshotted, `RECIPE_NOT_TRUSTED` until trusted, trust never imported. Stale approval shown on a synthetic fixture; no real owner approval was created.

**Fresh-context trial** (`fresh-author-report.md`): read only SKILL.md, library.md, the catalog, its own project and public profile listing; imported `path-note`, 1080 preview `83a54e2e6747-71910345-427` (first draft preserved), pinned copy re-stage, undo and status. Help: one profile pointer from the coordinator, one invalid `--help` recovery, one status retry under a sandbox restriction; zero source repairs. Limits: the fresh author did not exercise crop, pose or attachment (path-note only); the revised copy was not rendered; schema output was too large to read whole (skill now says to save and grep it).

**Controller findings.** Code review of `stage.ts`, the CLI command and the renderer crop path found no blocking defect (dependency paths through the safe resolver, pointer writes refuse prototype keys, candidate validation writes only to unlinked copies, legacy image path untouched). Fixed: seven `noNonNullAssertion` lint warnings in `libraryCommand` (behaviour-neutral refactor). Catalog drift: `library/starter/catalog.json` was edited at 19:29, after the trials, adding `binding: "neutral"` and `origin`/license to the three asset entries without a version change; patterns, provenance, asset bytes and layout are unchanged (pattern hashes `ccf8a4d0…` and `22d81ea6…` match the pins). Trial evidence therefore pins catalog `56431c6d…`; the shipped catalog is `b0e0f3bc…`. A public-CLI check of the shipped catalog (inspect → stage → edit → validate, no render; `work/m4-batch-2/shipped-catalog-check.json`) passes and its receipt carries the neutral bindings and origin. Owner decision (Fatih, 2026-10-14): accepted as pre-release metadata; the catalog stays `schematic-starter@1.0.0` at `b0e0f3bc…`, and the trial evidence keeps its recorded pin `56431c6d…`.

**Gates** (`work/gate-logs/m4-batch-2/`): Codex focused 4 files 42/42; controller focused 6 files 59/59 (`focused-controller.log`: image-placement, capabilities, library, browser-bundle, CLI command-contract, revision-commands); `pnpm verify` exit 0, Biome 205 files, unit 312/312, integration 369/369 (`verify.log`, SHA-256 `cba262e080b9…`). E2E deferred to M4.5 closure by owner instruction; not run, not passed. No provider call, no recipe trust, no Git write.

**Limits.** Import copies the whole small catalog (no per-pattern dependency closure). Parameters are complete scalar values, not expressions. Attachments: unrotated siblings in one absolute parent and plane only; chains, cycles, cross-parent or dynamic rigs refused. SVG/audio stay passive without layout/crop. Crop is a view; files are never edited. Manual edits block regeneration (stage a separate instance to compare). Schematic examples make no claim about artwork quality, human identity or publication rights. Open from earlier: NF-AC-06 repeatability, interruption caveat, D-VIS.

**Local commit closure — 2026-10-14:** Fatih approved the commit. `m4-batch-2` commit `9c01b1eaf408c446ca2fd60cfca8ef5eb6694b69` on top of `d4f9d82`, 32 task files, author Fatih, no agent identity/trailer; `AGENTS.md` and `work/` excluded. Before staging the candidate still matched `work/m4-batch-2/candidate.json` (only documentation changed after the gates). Local main and origin/main remain `aab831c`; no PR, merge, stash or discard. At Fatih's request the branch was then pushed: `origin/m4-batch-2` = `9c01b1e` (`m4-batch-1` was not pushed). This note is local and will travel with the next batch's commit.

**Follow-up review — 2026-10-14: CHANGES_REQUESTED.** Fatih asked for a check before moving to M4.4. The reviewer independently inspected the commit, current diff, snapshot/attachment/crop paths, and gate logs; the 13 candidate file fingerprints still match and verify.log SHA is `cba262e080b92db5ecd01543464e8a9a27cde13edfe04f92373a694a1e7424dd`. The recorded 312/369 verify result is controller evidence, not a suite rerun in this review. AGENTS remains `c55c4025…`, and only the pre-existing local closure note was dirty before review.

- P2: `stage.ts` tests an anchor against the layer frame, but not the cropped viewport. Under `contain`, letterbox space can contain a mapped point whose source anchor was clipped out. Repro: copy the starter catalog, set pose-left's hand anchor to `(40,190)`, retain crop `(60,50,200,300)`, and set the object frame to `(140,640,800,840)`. Staging through the public CLI incorrectly succeeds. The image fits at scale 2.8 with 120 px of left letterbox; the mapped anchor is `(64,392)`, inside the frame but outside the painted crop's x interval `[120,680]`. The actual renderer clips that point away. Evidence: `work/m4-batch-2/review-letterbox.mjs` and `work/gate-logs/m4-batch-2/anchor-review-before.json` (success true, no issues, not applied).
- Bounded correction: require the source anchor to be inside the selected crop as well as its mapped point inside the visible frame; keep `LIBRARY_ANCHOR_CLIPPED`. Add a letterboxed-contain regression and a visible-anchor control; keep existing cover behavior. No renderer, key, trust, media, library version or dependency change is needed. A focused public probe and focused tests are sufficient to establish this correction before the ordinary integration check; no render/E2E rerun without need.
- No engine/skill/test/Git mutation in this review. Scratch diagnostic fixtures were generated in temporary directories only. Batch 3 remains unstarted pending correction authority; preserve the existing commit and evidence.

**Anchor correction — 2026-10-14: VERIFIED / UNCOMMITTED.** Fatih authorized the bounded correction with “bereskan”. `applyAttachments` now checks the source anchor against the selected crop, then retains its existing fitted-frame check. Letterbox space no longer makes clipped points appear usable. Only `packages/core/src/library/stage.ts` and its integration test changed; no renderer, engine identity, cache key, catalog, media, skill, dependency or trust change.

- Regression: four clipped anchors (left/right/top/bottom, all mapped inside letterbox frames) failed against the old implementation with `expected true to be false`; the visible-anchor control passed. After the guard, the complete library integration file passes 22/22, including existing cover/crop/pinning/undo cases. Logs: `anchor-regression-red.log`, `anchor-regression-green.log` under `work/gate-logs/m4-batch-2/`.
- Actual compiled CLI: the reproduced catalog now returns exit 1, `LIBRARY_ANCHOR_CLIPPED`, invalid readiness and no staging artifact (`anchor-review-cli-after.json`); previously success true/no issues (`anchor-review-before.json`). The helper probe also rejects without staging (`anchor-review-after.json`). No edit or render was applied to the diagnostic project.
- Fresh pinned `pnpm verify` exits 0: Biome 205 files, unit 312/312, integration 374/374, typecheck/build. Complete log: `anchor-verify.log`. No render or E2E was run. Existing accepted output and earlier failed evidence remain intact. Unrelated AGENTS and the local Batch 2 closure are preserved.
- Technical blocker is closed. Commit/push/new branch operations were not performed in this correction; M4.4 remains next, unstarted, with the approved batch/cherry-pick workflow and separate confirmation for costly final operations.

### Handoff record — Batch 3 / M4.4 (2026-10-15)

**Status:** TECHNICALLY_READY / UNCOMMITTED; M4.5 is queued, not started by this checkpoint. Fatih authorized the correction commit and M4.4 continuation. No push/PR/merge is authorized here; main remains `aab831cd0a30ea53ba6274556729060d8ff29ba5`.

**Batch transition:** Batch 2's bounded anchor correction is committed as `57ac91faad3a410b6ed2bca27af66f68fd74373e` (three explicit paths: plan, stage helper, library integration tests). The precommit library file passed 22/22 and build passed; the earlier full verify 312/374 is retained, not rerun for the commit. `m4-batch-3` was created from unchanged main and received the three cumulative commits as `3a1d91f`, `655044d`, `15d67c1`. Batch 2 and Batch 3 trees match at `4eb1d80bafbc0b75e4499156a3e690be9c4d81b8`. Earlier “uncommitted/unstarted” entries above are historical checkpoints.

**Listening evidence:** Fatih answered “Sudah didengar, teks dan batas cocok”; recorded at `2026-10-14T16:55:36Z` (2026-10-14 23:55:36 WIB). This attests the reused coral clip and its two phrase boundaries only, not new audio or publication. The original master stays read-only. Prepared receipt checks validate the attestation's bindings, not listening itself.

**Work split:** backend/public staging and series catalog implementation; parent skill/reference and consolidated acceptance. Evidence under `work/m4-batch-3/`, gates under `work/gate-logs/m4-batch-3/`. Development uses only the authorized short output path, focused checks and one verify. E2E stays deferred until final M4.5 confirmation. No provider, dependency, new recipe trust or final export.

Unrelated `AGENTS.md` SHA `c55c4025c99a042ccf845402f5b1c53284edc02c0059d70b43d0d211c5a771cb`, Miss Ayu worktree, old stash/branches and archived evidence remain untouched.

**Implemented/public evidence:** `audio stage` captures clip/package once, probes the captured media, returns guarded-edit staging and refuses mismatched hash/intended text/cues/mode. Opt-in pending receipts are draft warnings and production blockers without a confirmed generation binding; verified receipts require real listening metadata, current hashes and truthful known style. Public schema and registry expose only proven staging/receipt capabilities. Core stays Remotion-free; renderer, narration clock, dependency and engine identity are unchanged. Series catalog uses existing library source/pins, not recipe execution/trust. Detailed implementation/manual command record: `work/m4-batch-3/m4-4-report.md` (implementer evidence; parent did not rerun every reported command).

**Parent output/revision audit:** source-only external acceptance project `../NaraFrame-projects/mvp2/prepared-audio`, production validation ready with only deliberately short-duration recommendation. Native full `b51208404019-0eba0381-820` and scoped `ad463c1c10d4-9270636f-ad6`: 206 frames / 6.866667 encoded seconds; parent inspected contact sheets (intro exit, persistent signature, trailing sign-off and cues). Decoded RGB hashes match on all 206 frames; normalized decoded mono PCM correlation `0.9999919633`, best lag 0 ms at 12 kHz within a ±100 ms search. This is one fixture measurement, not a universal encoding guarantee. Actual input timing remains 5851 ms plus 1000 ms hold. Logs: `full-1080.json`, `scoped-1080.json`; audit: `media-audit.json`.

Caption-none revision yields `41f7b52ecd6d-0e97320a-516`; undo restores source and reuses full `b51208404019-0eba0381-820` as `b51208404019-3026fb0e-034` in 752 ms, MP4 hash identical. Before/after/undo master SHA, voice key `010e0b6b…` and timing hash `c186981f…` match (`revision-evidence.json`). Initial parent caption fixture omitted required `corrections: []`, so edit was refused before any mutation/render; corrected fixture then passed. This is a setup correction, not an engine defect; no failed preview was relabelled successful. Real owner preview approval was not created; approval staleness is synthetic-test evidence only.

**Fresh-context skill/library proof:** independent author read skill/routed references, public schema/catalog/CLI and its own project only; no renderer/private source or prior project reads except the explicitly supplied master. Thirteen public calls produced validated first source, preserved under `fresh-author/first-validated-source`, and ordinary note edit with voice/scene 1/1 reuse (`fresh-author-report.md`). The catalog changed while candidate authoring was underway; the author inspected/pinned actual staged bytes rather than claiming a frozen trial. Parent copied source-only to `../NaraFrame-projects/mvp2/prepared-audio-second` and rendered draft `1394141c048e-d32ff8ba-afd` (212 frames, 540×960). Contact sheet confirms omitted intro, persistent signature and “Pelajari lagi besok” in the 1200 ms hold. Known teaching voice vs editorial current-issues style remains `VOICE_STYLE_MISMATCH`; that draft is not production-ready and no relabel/regeneration was performed. Its source citation is the supplied narration, not independently researched scientific/publication evidence.

**Review/gate:** independent consolidated source review found no concrete blocker (`review-report.md`); it inspected contracts/tests and supplied parent logs, but ran no suite/render/probe. Additional bounded test coverage then protected source mutation during probe, pending-with-generation, verified-without-generation and known/unknown style. Implementer focused 56/56 integration + capability 17/17. Parent's single final `pnpm verify` exits 0: Biome 212, unit 312/312, integration 398/398, typecheck/build. Log `work/gate-logs/m4-batch-3/verify.log`, SHA `9a94daaf440573471aec081c7776037710445a1c030e5fd7192943668971cab2`. `git diff --check` clean. Skill frontmatter/routed links inspected and fresh-author proof succeeded; standalone `quick_validate.py` could not start because ambient Python lacks PyYAML, with no dependency installed. Candidate source/dist/catalog/media hashes recorded in `checkpoint.json`; code/skill stay uncommitted.

**Limits/effort:** four short fresh renders (full/scoped native, caption variant, second draft) plus one pixel reuse; measured render command times 19.8/19.8/20.1/17.4 s, reuse 0.752 s. Manual import/preflight setup failures and test-harness mistakes are retained/reported, not claimed product failures or erased. Owner active time, agent active time and token cost unknown; paid provider calls 0, prior generation spend untracked. No E2E, final export, visual parity, publication claim, new trust or main integration. Next is M4.5 with separate confirmation for costly final operations, not another engine feature by default.

**Commit authorization — 2026-10-15:** Fatih requested “commit” before distribution-scope discovery. All 21 code/test/skill/catalog fingerprints still match the reviewed checkpoint; final verify log hash matches. Fresh precommit focused integration 56/56 and build exit 0 (`work/gate-logs/m4-batch-3/precommit.log`), `git diff --check` clean. Stage only the 24 M4.4 source/document paths; exclude unrelated AGENTS, README and work. No push/PR/merge. The requested distribution/cleanup/onboarding scope will be recorded after this checkpoint commit, not mixed into its implementation.

**Commit closure:** `4b49ebe4974fa70907e0d85148d24ccf6257f763` on `m4-batch-3`, Fatih author/committer, exactly 24 explicit paths, no agent trailer/identity, work or AGENTS. Main/origin-main remain `aab831c`. “Uncommitted” statuses above describe the precommit checkpoint. No push/PR/merge or E2E.

### Active handoff — expanded M4.5 preparation (2026-10-15)

**Status:** READY_FOR_REVIEW for the M4.5.2–4 packaging/onboarding checkpoint, uncommitted. Scope excludes npm publication, host-wide installation, license selection or costly final render/E2E. Current in-place Batch 3 is the explicitly selected workspace; no new worktree and no main changes. Offline isolated artifact installation was part of the authorized consumer acceptance, not a baseline dependency fetch. The prior discovery-only entry is preserved as the starting checkpoint.

**Discovery checkpoint (before implementation):** inspected workspace package metadata/bin/resource resolution, skill folder and README; fetched official Codex/Claude skill, plugin and npm package docs (links and source conclusions in refine section 8). Actual CLI doctor from `/private/tmp` returned ready; absolute-path create with bundled current-issues profile succeeded in isolated `/private/tmp/naraframe-standalone-Dz7BLa/episode`. Neither used an agent session, paid provider, download or render. They still loaded the existing checkout, so clean consumer installation was then PLANNED. `work/` was approximately 12 MB at that discovery checkpoint; it was inventoried read-only, not removed.

**Recommended next package:** M4.5.2–6 as one consolidated Batch 3 delivery after scope confirmation, not five owner relays. Portable CLI artifact + one canonical skill with host adapters is preferred over repo-only links or a hosted MCP/GUI. Existing source/JSON/trust/approval routes stay valid. Build packaging first, then freeze/produce output, preserve receipts, and archive experiments after acceptance. Finish with one separately approved serial E2E and integration decision.

**Documents:** spec/refine/plan and README updates are local after the M4.4 commit. Include them in the next authorized implementation commit; do not create a standalone administrative PR. AGENTS remains owner work and is excluded. Owner must choose code license/redistribution terms before public release; that decision does not authorize a publication in this batch.

**Discovery documentation check (historical):** four updated files had no broken local file links; `git diff --check` passed. README copy was revised around actual recurring production, standalone terminal use and current audio/library/slot contracts; no public npm install or marketplace availability was claimed. Those scope changes were documentation only, so no render/E2E/full verify rerun at that checkpoint. Fresh 56/56 focused + build were run before `4b49ebe`; subsequent CLI doctor/create checks used the same implementation. No archive/removal or global skill installation was performed; AGENTS hash remained `c55c4025…`.

#### Packaging/onboarding checkpoint — 2026-10-15

**Candidate:** uncommitted M4.5.2–4 on `m4-batch-3`, HEAD `4b49ebe`; main/origin-main still `aab831c`. The local npm-compatible artifact is `work/m4-packaging/candidate-3/naraframe-engine-0.1.0.tgz`, SHA-256 `2ee5cae004094abca63b827d0e731f4607bf0c78e9df0d1012176d36445e202a`. Its `engine-manifest.json` inventories 259 captured runtime package placements. Package metadata is private/UNLICENSED, macOS arm64, not an npm/marketplace release. Normal offline install used an empty npm cache and completed without skipping install scripts.

**Engine/library:** public `version --json` reports version/API/schema/resource root plus `engineIdentity`; the latter hashes NaraFrame's built modules, maintained resources, installer and dependency pins. It detects installation drift, not arbitrary third-party binary tampering. Source schema, compiler motion clock, render keys and `naraframe-draft/12` are unchanged. The CLI's entry guard handles npm executable symlinks; doctor tests the consumer cwd; recipe aliases resolve installed React/Remotion instead of assuming pnpm's layout. Core stays independent of Remotion. Neutral resources are allowlisted, with no private episode/media/approval/trust or test fixture dependency.

**Skill:** complete canonical folder copied to isolated `.agents/skills/naraframe` and `.claude/skills/naraframe`; public version/profile commands ran through both generated launchers from the consumer cwd. Dry-run and explicit update succeeded on the actual installed engine. Receipts bind engine path, version/API/resource root and fingerprint; unrelated/edited/symlink installs are refused. Review found and closed backup-loss, same-version drift and parent-replacement cases. The 17 installer regressions pass. Parent inode checks protect cooperative concurrent changes, not a hostile filesystem sandbox. No actual personal installation, host security change or paid agent invocation.

**Public path:** `work/m4-packaging/consumer-check.mjs` installed the artifact under `/private/tmp/naraframe packaging consumer-fLeh95`, outside the checkout. Logs/command receipts: `work/gate-logs/m4-packaging/consumer-check.json`. Doctor, both host installers/launchers and plan/production validation succeeded. First sandbox preview failed with generic SYSTEM_ERROR; the separate uncensored probe found `No available ports found`. Re-running only that public preview with localhost/Chrome permission succeeded: `bc0565e50f56-c9332f4c-d0d`, H.264 540×960, 30 fps, 120 frames/4.000 seconds, no audio, full decode exit 0, MP4 SHA-256 `499568de1b106c81f0e4ea551e404b3c5b5c185370107adeeddd9fc829f95e56`. Contact sheet inspected: headline and path diagram render; it is a technical starter, not a visual benchmark. Receipts are `consumer-preview-local.json`, `consumer-media-check.json` and stderr alongside the failed attempt evidence.

**README:** English product/benefit copy, both source/archive installation routes, safe host installation/update/removal, neutral terminal quickstart, prepared audio/library/captions, revisions, approval/export and troubleshooting. Humanizer/copywriting pass kept claims tied to current behavior. Seven current documents/skill/starter guides have no broken local file links. Packaged README points only to included guides/resources. Documentation does not claim a registry release, public media rights or tested Windows/Linux/Intel artifacts.

**Review/check provenance:** read-only consolidated reviewer audited the capture graph (259 placements/235 names, no source/version resolution mismatches in the current graph) and source changes, then re-reviewed corrections; it ran no render/Git changes. Parent ran the actual consumer/install/media checks and regression gates. Early distribution harness failures (macOS realpath/bin assumptions) and a prematurely started test before tarball completion are retained. A diagnostic probe's initial result-access typo is not classified as an engine defect.

**Gate history:** first `pnpm verify` stopped on unchanged harness.test.ts's 5-second import timeout (311/312 unit; Biome/typecheck succeeded). The file passed alone. The subsequent integration run returned 419/421 with two timeouts; `pmset` proves Low Power Sleep from 04:46:12 to 05:51:34 (3922 seconds), then a second 87-second sleep. That run also invoked npm under ambient Node 22 because PATH assignment did not carry across a shell command; it is not accepted as a valid complete gate. No assertion/timeout was changed. With pinned PATH, 37/37 focused recovery (packaging/installer/preview publication) and 312/312 unit passed. A full pinned verify with command-scoped sleep prevention is recorded separately below; failures are not overwritten.

**Accepted current gate:** `verify-2.log`, exit 0, Biome 219 files, TypeScript/build, unit 312/312 and integration 421/421. Node 24.20.0 and pnpm 12.3.4; inherited PATH also pinned npm's Node. Command-scoped `caffeinate -i -s` used on AC after the observed sleep, without changing assertions. Log SHA-256 `5e72e3a6552239dcbc6c5803d679b7f338bc18ed044fd4a781fc6f45872ddd41`. Focused recovery log SHA-256 `cdb2ab34a65d564b9cada6b862512b1c8779ed137a61e76fc07c3c2ef6bdcc0f`; manifest SHA-256 `028db7a779d248c7f618ac34a20900e4f25f98a6ad8d42282b26bdaf23861a44`. All files in CLI/core/renderer built trees compare byte-identical with the installed candidate after the gate. This is a runtime-file check, not a pixel-equivalence claim. E2E remains deferred, not passed. Final `git diff --check` clean; seven document/skill/starter guides have no broken local file links.

**Limits/next:** actual Claude/Codex activation and fresh-session onboarding are not observed; installed recipe bundling and source-vs-installed pixel equivalence remain separate final proof targets. No final export, E2E, provider calls, publication/license selection, personal installation, archive/removal, commit/push/merge or main sync. M4.5.5/6 remain pending. Preserve this candidate/evidence for the final freeze; include these docs with the next authorized implementation commit, not an administrative PR. Worktree Miss Ayu, old stash/branches and owner AGENTS (`c55c4025…`) remain intact. Active owner time and token cost unknown; command timings are in receipts.

#### M4.5.5 trial attempt 1 and renderer frame-corruption fix — 2026-10-15

**Attempt 1 (retained, superseded):** packaging committed as `eac6eea` with Fatih's approval; freeze `work/m4-batch-3/m4-5-trial/freeze.json` (frozen 2026-10-14T23:28:16Z, tgz `2ee5cae0…`, engineIdentity `2380b073…`). Fresh-context authoring of `NaraFrame-projects/mvp2/production/episode-01` (voice, general-explainer, three prepared clips with Fatih's listening attestation) reached a validated 21.47 s draft. Frame review then found silent single-frame corruption in three of its preview builds (duplicated top band, missing headline/label/caption) although the commands reported success and full decode passed. A scan of 99 archived MP4s found the same defect in 7, including one TutorLog FINAL (`f26a3f0c7d18-8f540218-c81`, frame 69). Per the trial rule, the attempt is retained and a new freeze follows the runtime change.

**Diagnosis:** neighbour-outlier detector (`work/m4-batch-3/m4-5-trial/corruption/scan2.py`). Unloaded or two-parallel renders: 0 of 58 MP4s affected. Under CPU load (8 `yes` processes, 8-core/8 GB arm64) with Remotion's default concurrency 4: 9 of 9 renders corrupt (source CLI and installed engine alike, 3–22 bad frames of 644); concurrency 2: 4 of 4; `gl=swangle`: 6 of 6 at twice the time; concurrency 1: 0 of 12 at about 56 s versus 52 s. Results: `work/m4-batch-3/m4-5-trial/repro/results/`.

**Fix (uncommitted):** `renderMedia` captures serially (`RENDER_CONCURRENCY = 1`); temporary diagnosis environment knobs removed; render identity `naraframe-draft/13` so racy builds are not reused. New post-render guard (`packages/cli/src/frame-integrity.ts`, method `neighbour-outlier/1`) scans every newly rendered preview/final MP4 (about 0.1–0.3 s) and fails with `RENDER_FRAME_INTEGRITY` before publication; the passing record is stored as `frameIntegrity` in report/manifest without a schema bump. A deliberate one-frame flash would be refused, which the message states. Regressions: unit detector cases, render-concurrency call assertion, synthetic-MP4 integration and preview/final/CLI failure publication paths. Acceptance with the rebuilt CLI: 3 loaded + 2 unloaded renders, all clean by guard and independent rescan, about 50 s each. Logs: `work/gate-logs/m4-batch-3/fix-corruption/`.

**Freeze 2:** `work/m4-batch-3/m4-5-trial/freeze-2.json` (copy `NaraFrame-projects/mvp2/production/reports/freeze-2.json`). Candidate-4 `work/m4-packaging/candidate-4/naraframe-engine-0.1.0.tgz` SHA-256 `ba4937d2…11cb`, 259 captured packages, offline install into `production/engine` (attempt-1 install kept as `engine-attempt1`). Installed CLI/core/renderer byte-identical to the build (41/277/53 files). engineIdentity `64b5676e…0eb3f`, `naraframe-draft/13`, doctor 8/8 ready. Project skill updated through the shipped installer (receipt `c6babc77…`). All input/profile/library/starter/repo-skill hashes match attempt 1. The fix is uncommitted, so the freeze records the source-only diff hash (`3023d45c…`) and per-file hashes of the four new files. Gate: `pnpm verify` exit 0 (Biome 223, unit 327/327, integration 428/428; log `work/gate-logs/m4-batch-3/fix-corruption/verify.log`, SHA-256 `9e5637af…`).

**Trial attempt 2 (fresh-context Sonnet authors, installed skill/launcher only, no repo or engine reads; supervisor-written neutral inputs `inputs/revisions-01.md` and `inputs/brief-02.md`):**

- *episode-01 revisions* (`reports/trial-2-episode-01.md`, about 7.5 + 3 minutes): pre-revision full draft `7b68f6b5aa33-54c2c8d0-a60` preserved in `episode-01-before-revisions/`. Headline, colour-tempo and object-removal notes applied through `edit`; `undo` reverted the object removal and a re-applied identical staged file reproduced the same source revision; an unchanged full preview was reused in 0.43 s with identical MP4 bytes. The partial-phrase caption ("bisa kembali") was declined honestly: cues are phrase-level and word timing must not be guessed. Supervisor frame review found the `cause`→`recovery` match-cut zoom pushing the headline off frame and the thermometer vanishing between adjacent frames. Correction pass 1 (fade both out before the zoom) fixed it, verified on every seam frame. Candidate for owner review: 1080 `1e6d367364da-c665da06-260` (21.47 s, voice), frameIntegrity 644/0.
- *episode-02 profile switch* (`reports/trial-2-episode-02.md`, about 13 minutes): copied from episode-01, made silent, `profile apply contrast` dry run then apply, plate/coral/tint redrawn for the light profile, three on-screen beats. First draft preserved (`episode-02-first-draft`, `b2a284f0717f-a9cabb1a-9e1`). Correction 1 enlarged the type; correction 2 regressed (entry text crossed the left safe line) and was reverted with `undo`, so the final previews were reuses (0.4–0.5 s). Candidate for owner review: 1080 `1a0b9845f692-e37c055f-087` (15.4 s, silent), frameIntegrity 462/0.
- Every full build passed the new guard; independent rescans agree. Paid providers 0. Final export awaits owner visual acceptance.

**Engine findings from attempt 2 (not fixed inside the frozen trial):**
1. Visual preflight samples scene-final/entry frames only, so text pushed outside the frame by a `match-cut` zoom, or entry motion that starts outside the safe area, passes validate and preview silently.
2. Removing narration cannot be expressed through `edit`; the author had to delete `narration.json` by hand after `SCENE_NARRATION_MISSING`.
3. `profile apply` lists `regenerate-narration` for a project without narration and does not name layers bound to palette slots, image plates or literal colours that clash with the new direction.
4. The contrast profile sets `requireSourcing: true`, yet production validation passes while the project declares no factual-claim sourcing. This is an owner policy question.
5. Shape `stroke.color` accepts only hex while path strokes accept palette tokens. Reveal direction semantics are undocumented, `strong` emphasis is not distinguishable under contrast, and the skill has no command for listing revisions or explaining why a reused preview gets a new build id.

**Open side finding:** after concurrent renders, `node` and Chrome crashpad processes sometimes stayed alive 7–9 minutes after the JSON result. Not yet diagnosed; it did not affect output.

**Final gates on the fixed tree:** `pnpm verify` exit 0 (above). Serial final E2E `pnpm test:e2e` exit 0: 14 files, 24/24 tests, 1047 s, 2026-10-15 ending 02:30:02Z, command-scoped `caffeinate -i -s`, no other render running. Log `work/gate-logs/m4-batch-3/fix-corruption/e2e.log`, SHA-256 `6b788311a28dc19c0a1ca2caa88f259d905debf244db700c94150cce4cdbe9c8`.

**Delivery package (drafts for owner review):** `NaraFrame-projects/mvp2/production/delivery/`, containing `REVIEW.md` (what to watch and listen for, with a decision line per episode), plus per episode `cover.png`, `cover-candidates.png` and `delivery-notes.md` (identity and hashes, claims, rights inventory, Indonesian post copy and alt text, limitations, and the export commands for the owner). The 1080 candidate MP4 SHA-256 values are `7665cab5…802da` (episode-01) and `d20d0e6d…f8ed` (episode-02). Covers come from DRAFT-labelled previews and must be retaken from the approved exports. Rights are not cleared for public use: synthetic plate, locally synthesised Damayanti voice from the repository fixture, agent-drawn artwork, system Arial/Helvetica.

**Recoverable cleanup proposal (approved and executed 2026-10-16; see closure execution below):** archive with a checksum index under `NaraFrame-archive/<date>/`, then move to Trash. Candidates are the `work/m4-batch-3/m4-5-trial/repro/` episode copies and builds (209 MB; keep the extracted frames, summaries and two representative corrupt MP4s in place), `production/engine-attempt1/` (462 MB, after the attempt-2 export is accepted) and `work/m4-packaging/candidate-3/` (archive only, attempt-1 evidence). Episode projects, first drafts, reports, freezes, gate logs and maintained repository files stay where they are.

**Waiting for Fatih (decisions received 2026-10-16, execution below):**
1. DONE — both 1080 candidates approved as is.
2. DONE — renderer fix committed as `8b22c94` on `m4-batch-3` (17 paths: 15 source/test + `docs/spec.md` + `docs/plan.md`; AGENTS excluded). Integrated later through PR #34.
3. DONE — episode-02 sourcing resolved as (b) illustrative restatement: the three on-screen statements restate `inputs/brief-02.md`/episode-01 narration with no new numbers/places/dates; episode stays "claims unsourced"; `contrast` profile unchanged and strict for future factual work; post copy must not add claims beyond the on-screen text.
4. DONE — recoverable cleanup executed (evidence below).
5. DONE — attempt-2 engine findings + lingering-process finding scheduled as backlog F1–F5; the review added F6 (section 4).

Integration: Fatih authorized push/PR/squash-merge; PR #34 merged as `a701c39` on 2026-10-17.

#### Closure execution — 2026-10-16 (fix commit `8b22c94`; this evidence follows in the same PR)

**Exports (owner-approved, `naraframe-draft/13`, engineIdentity `64b5676e…`):**
- episode-01 final build `e470d85201ba-4cbfbbf3-368` (21.467 s, 644 frames, h264 1080x1920 30fps + AAC 48kHz stereo). `final.mp4` SHA-256 `de38e1b0…d3a7e558` (1,851,730 bytes), matches manifest; `manifestSha256 1e84e545…` matches pointer; approval preview `1e6d367364da-c665da06-260`, sourceRevision `3ff723d6…`; full decode clean; `frameIntegrity` 644/0; visualPreflight issues empty (one info `CONTRAST_UNVERIFIED`, already disclosed). Cover retaken from final frame 30: `delivery/episode-01/cover-final.png` (`c6977511…`), DRAFT label gone.
- episode-02 final build `944926cda123-7c5f110b-bdc` (15.4 s, 462 frames, single h264 stream, no audio). `final.mp4` SHA-256 `28161c0c…471a88`, matches manifest; `manifestSha256 391a89c3…` matches pointer; approval preview `1a0b9845f692-e37c055f-087`, sourceRevision `d41ecb8d…`; full decode clean; `frameIntegrity` 462/0; visualPreflight issues empty (`SINGLE_TRANSITION_TYPE`/`VIEWPOINT_STATIC` warnings deliberate, disclosed). Cover retaken from final frame 33: `delivery/episode-02/cover-final.png` (`bfe4d02b…`), DRAFT label gone.
- Stated "exported", never "published". Rights (synthetic plate, Damayanti synthesis, agent artwork, system font) remain open per delivery notes.

**Cleanup (executed, recoverable):** 15,340 entries / 727,074,976 bytes archived to `NaraFrame-archive/2026-10-16/` with `index.json` (per-file SHA-256, 0 copy mismatches on re-hash, restore instructions). Originals moved to `~/.Trash/naraframe-cleanup-2026-10-16/` (no active render during the move; Trash not emptied). Kept in place: `repro/results/` frames+summaries, repro scripts/logs, two corrupt-MP4 build dirs (`episode-installed/.../385ff2e7fbcf-e08b6a07-386`, 22 bad frames; `episode/.../385ff2e7fbcf-5968da6f-036`, 28 bad frames). `repro/` is now 9.8 MB; `engine-attempt1/` and `candidate-3/` removed from the working tree.

**Follow-up backlog (scheduled, each needs its own feature model + authorization):**
- F1 preflight mid-transition/entry-motion gap (text pushed off frame by `match-cut` zoom passes silently).
- F2 narration removal not expressible through `edit` (manual `narration.json` deletion).
- F3 `profile apply` report gaps (`regenerate-narration` on narration-less projects; unnamed palette/plate clashes).
- F4 `shape.stroke.color` hex-only, undocumented `reveal`/`strong` semantics, skill missing revision-list/reuse explanation.
- F5 node/Chrome crashpad processes lingering 7–9 min after parallel renders (undiagnosed, output unaffected).
- F6 claim labelling is trust-based (added 2026-10-17 from the closure review): see section 4.

#### Independent closure review — 2026-10-17

Read-only review of `a701c39`; verdict **ACCEPT_WITH_NOTES**. Verified independently: refs and PR metadata (author Fatih, no AGENTS/work paths, no agent identity); the fix diff (no approval/trust/schema change; diagnosis knobs only in a negative test); a fresh build of main byte-identical to the installed candidate-4 (41/277/53 files); frame-integrity, publication and contract tests 57/57; both final MP4 hashes, manifests, pointers, approvals, `frameIntegrity`, empty `visualPreflight.issues`, ffprobe streams, full decode and an independent rescan; covers identical to final frames 30/33; 31 random archive entries across all roots; keepers present and still corrupt; removed paths gone; Trash folder present.

Corrections recorded here rather than rewriting earlier evidence:
- Spec and plan status rows had lagged behind the closure. They were updated in this revision.
- The source-diff hash `3023d45c…` recorded with freeze 2 cannot be reproduced from the commits (`git diff eac6eea 8b22c94 --diff-filter=M -- packages scripts skills` gives `f7c824c1…`). Runtime identity is established by the byte-identical build. The five modified test files cannot be matched to the reviewed tree by that hash.
- The archive `index.json` notes describe three `node_modules/.bin` entries of `engine-attempt1` as links left dangling. In the archive they are regular files with their targets' bytes, so a restore produces copies rather than symlinks. Run `npm rebuild` in a restored engine before use. The archive itself is not edited.
- `~/.Trash/naraframe-cleanup-2026-10-16/` exists, but its contents are not readable from an agent session (macOS privacy), so the originals there were not re-hashed.

### Handoff template for an authorized M4 batch

- Task/batch, branch/base, status and exact candidate/freeze hashes.
- Model/scope decisions; what changed in skill, library and engine; what did not change.
- Public commands, first-draft/output paths, failed attempts and correction count.
- Fresh-context reading/help provenance; measured effort/reuse/provider use and unknowns.
- Owner visual decisions separated from technical/export/publication status.
- Focused tests, regression bite evidence where useful, integration gates with raw logs and runtime versions.
- Known limits/blockers and bounded recommendations, collected in one review packet.
- Git/trust/provider authority received and still required; no silent expansion into later tasks.
