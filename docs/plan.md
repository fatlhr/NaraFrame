# NaraFrame — Development Plan

Revision 1.9 · 2026-10-14 · Integrated baseline `aab831cd0a30ea53ba6274556729060d8ff29ba5`

**Current step:** M4.3's bounded anchor correction is VERIFIED locally on `m4-batch-2` after Fatih authorized it; uncommitted changes follow `9c01b1e`. Public CLI rejects clipped anchors, focused 22/22 and verify 312/374 pass. Next: commit the correction with explicit permission, then prepare Batch 3 from unchanged main and cherry-pick the cumulative Batch 2 commits. M4.4 has not started; main remains `aab831c`, no PR/merge, E2E deferred to MVP 2 closure.

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

Every acceptance command below runs from the repository root. Project paths are outside the repository. `SCENE_ID`, `SOURCE_REVISION`, and `BUILD_ID` are values produced by the authored project/status, not literal IDs to hard-code. Future source syntax and new commands must be settled in the feature model before implementation; examples below use existing CLI entry points.

## 2. M4 — MVP 2: Skill-led recurring production

**Goal:** make repeated content production easier and visually deliberate through better skill instructions, reusable library data, and the minimum supporting engine contracts.

**Not authorized by this plan:** M4 feature implementation, recipe trust for new code, or paid generation. All tasks start PLANNED. Fatih's separate 2026-10-13 authorization covers commit/push/PR/squash-merge of this cleanup/documentation package only.

Subsequent authorizations: Fatih approved Batch 1 implementation and accepted its output; on 2026-10-14 he authorized committing it and continuing Batch 2, then Batch 3, under the cherry-pick workflow above. New paid calls, new recipe trust, and publication remain separate decisions.

| Task | Status | Dependencies | Main acceptance | Review batch |
|---|---|---|---|---|
| M4.1 Art direction and production vocabulary | OWNER_ACCEPTED / COMMITTED `eb7a7d5`; not in main | Integrated M3 baseline | NF-AC-21, fresh-context representative shot | 1 |
| M4.2 Captions separate from narration | OWNER_ACCEPTED / COMMITTED `eb7a7d5`; final E2E deferred | M4.1 | NF-AC-22, none/selected/full with intact audio/reuse | 1 |
| M4.3 Library and pinned assets | OWNER_REVIEWED / COMMITTED `9c01b1e` on `m4-batch-2`; not in main | M4.1–M4.2 committed/cherry-picked under owner exception | NF-AC-23, editable pinned imports and reuse/undo | 2 |
| M4.4 Prepared audio and series identity | AUTHORIZED; queued after Batch 2 | M4.3 committed/cherry-picked under owner exception | NF-AC-24, verified master/timing and reusable identity | 3 |
| M4.5 Production trial and MVP 2 handoff | AUTHORIZED; queued after M4.4, confirm costly final gate | M4.1–M4.4 | NF-AC-25, approved MP4 and second profile | 3 |

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

**Acceptance commands:**

```bash
pnpm naraframe validate ../NaraFrame-projects/mvp2/prepared-audio --stage production --json
pnpm naraframe preview ../NaraFrame-projects/mvp2/prepared-audio --resolution 1080 --json
pnpm naraframe preview ../NaraFrame-projects/mvp2/prepared-audio --draft --scene explanation --json
```

Expected: a verified local master imports unchanged with usable phrase/cue bindings. Series identity is reused on a second episode; an explicit identity override produces the expected timeline. Visual/caption revisions keep master bytes and voice reuse unchanged. Cue/audio comparisons separate encoded offsets from input timing.

- [ ] Model prepared-audio receipt and timing verification, supported preset fields, and override precedence.
- [ ] Import existing audio without provider calls; record file/text hashes and verification by listening.
- [ ] Inspect cues against the actual audio and check scene boundaries, pauses, and scoped/full consistency.
- [ ] Use the same identity preset twice, then record an intentional override and inspect its timing impact.
- [ ] Revise visual copy/assets/caption policy without changing or regenerating the spoken master.
- [ ] Prove undo, media reuse, cache invalidation and approval staleness for changes that do affect audio or identity.
- [ ] Add regression cases for units, stale text/hash binding, invalid cue bounds, preset pinning, overrides, and key behavior.
- [ ] Run focused coverage and `pnpm verify`; preserve evidence for Batch 3. E2E deferred to final M4.5 closure under the 2026-10-14 owner instruction.

**Out of scope:** automatic new paid generation, repairing spoken content without permission, global intro duration, or claims of word-accurate motion without the required data/implementation.

### M4.5 — Production trial and MVP 2 handoff

**Reason:** skill/library improvements count only when another session can use them through production and ordinary revisions, including a different profile.

**Scope:** skill covers motion QA, cheap checkpoints, editorial traceability, cover and delivery packaging; library supplies accepted patterns/assets; engine is frozen during trial. No incidental feature work is allowed inside the frozen acceptance.

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
- [ ] Record fresh-context reading/command boundaries, first drafts, elapsed/active time, corrections, reuse and provider usage.
- [ ] Use a representative shot/contact sheet before full previews; review moving frames as well as stills.
- [ ] Exercise headline, motion tempo, object/asset, caption, and profile revisions through ordinary source edits; show undo and reuse.
- [ ] Check identity fields, undeclared recipe params, source/claim limits, media rights, and listening evidence. Do not infer public rights from internal approval.
- [ ] Produce contact sheets, a cover artifact and delivery notes with sources, limitations, caption/post copy and final build receipts.
- [ ] Obtain owner visual acceptance, then export and verify pointer/approval/source/hash, streams, duration/frame count and full decode.
- [ ] Report technical, visual, export and publication statuses separately. Simulated platform overlays are QA aids, not guarantees about every platform UI.
- [ ] Add focused regressions for accepted defects; if a defect forces runtime changes, retain the attempt and start a newly approved freeze.
- [ ] Run `pnpm verify` and one serial full E2E for closure; document failures/caveats without retry-until-green or weakened assertions.
- [ ] Consolidate Batch 3 handoff and NF-AC-21–25 disposition; request integration separately.

**Out of scope:** automatic posting, a universal platform layout, new providers, open-ended polish, or declaring older D-VIS/rights/parity gates passed by proxy.

## 3. Review batches and closure

| Batch | Contains | Owner relay |
|---|---|---|
| 1 | M4.1 + M4.2 | One consolidated technical review, with saved authoring/output evidence and caption acceptance. |
| 2 | M4.3 | One review of import/version/metadata authority, editable patterns and frozen proof. |
| 3 | M4.4 + M4.5 | One review of prepared audio/identity and production handoff. Visual approvals remain owner's decisions. |

Use Fatih's 2026-10-14 MVP 2 exception: each next batch branch starts from unchanged main and cherry-picks its predecessor's cumulative batch commits. Keep main untouched until final acceptance. Within an authorized batch, execute its steps without relaying each small command through Fatih; confirm expensive work first. Bring findings together at READY_FOR_REVIEW; stop for materially new authority, a blocking defect outside scope, or a required owner output decision.

MVP 2 closure requires recorded acceptance for NF-AC-21–25, compatible legacy behavior, current capability documentation, and the operating handoff. Any narrowed acceptance needs an explicit owner decision recorded as such. Deferred visual/publication/backlog items remain deferred unless separately accepted.

## 4. Later backlog (not MVP 2 requirements)

- Spring, repeater, cross-scene continuity primitives, animated masks, video layer and word-level motion.
- Generic recipe collision/contrast, unbound identity/claim inference, non-space line-breaking coverage.
- Reliability: pixel repeatability, SIGKILL orphan handling, issue #16 diagnostics/cancellation, harness timeouts and full raw gate logs.
- Targeted undo, fuller reuse reporting, leftover assets after undo, older final-key mismatch.
- D-VIS, Bang Motion parity, publication rights, and unresolved historical claims.

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

### Handoff template for an authorized M4 batch

- Task/batch, branch/base, status and exact candidate/freeze hashes.
- Model/scope decisions; what changed in skill, library and engine; what did not change.
- Public commands, first-draft/output paths, failed attempts and correction count.
- Fresh-context reading/help provenance; measured effort/reuse/provider use and unknowns.
- Owner visual decisions separated from technical/export/publication status.
- Focused tests, regression bite evidence where useful, integration gates with raw logs and runtime versions.
- Known limits/blockers and bounded recommendations, collected in one review packet.
- Git/trust/provider authority received and still required; no silent expansion into later tasks.
