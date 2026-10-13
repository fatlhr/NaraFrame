# NaraFrame MVP Implementation Plan

> **For execution:** implement the active numbered task in this workspace, with a review checkpoint after each task. The plan defines intent, boundaries, contracts, and proof; implementation details belong to the work stage.

**Goal:** Repeated profile-driven production of visually strong, revisable vertical videos across brands. Owner-reviewed output, reusable identity/assets and ordinary substantive revisions are the success criteria, not feature/test counts.

**Architecture recommendation:** Keep the proven profile/assets/revisions/audio/artifact production layer and declarative-v1 compatibility. Pilot parameterized trusted local Remotion compositions using installed 4.0.521 before selecting one authoring route. Agent manages technical authoring; external provider operations stay outside core/renderer. No multi-renderer framework. Recommendation is not proof that the pilot will pass.

**Tech Stack:** Verified workspace pins for M0: Node 24.20.0 LTS, pnpm 12.3.4, TypeScript 7.0.2, React/React DOM 19.2.8, Remotion/@remotion packages 4.0.521, Zod 4.5.4, Vitest 5.0.0, and Biome 2.5.12. Install, frozen-lockfile, test, typecheck, build, the local H.264 draft renderer, atomic publication, operator CLI/skill route, offline sandbox, and cross-feature E2E are verified.

Status (synced 2026-10-06): **M2 is closed technically; M3.1-A integrated via PR #23 (`8463764`). M3.P0 integrated the M3.1-B/B1 audio checkpoint via PR #24 (`b1875e2`); documentation via PR #25 (`a54d8b6`). Batch A (M3.P1a + P1b + P2a) is integrated via PR #26 (`9ec2b69`); the Remotion route is accepted as a technical approach. Batch B (M3.P2b + M3.P3) is integrated via PR #27 (`0789c47`). Batch C (M3.P4) is ACCEPTED_INTERNAL / INTEGRATED via PR #28 (`00a3269`): three LBC episodes on freeze 2 with Fatih's visual approval and verified finals; publication not cleared. Batch D (M3.P5) is CLOSED / INTEGRATED via PR #29 (`ef88eb7`); NF-AC dispositions and open items are in its evidence register. Batch E (brand-safe recipe params and profile switching) is CLOSED / INTEGRATED via PR #30 (`cfa244e`). Batch F (recipe text fit) is CLOSED / INTEGRATED via PR #31 (`e008490`). No next scope is authorized. See section 0.** D-VIS/NF-AC-16/17, pixel repeatability and comparative cost remain open. Section 0 is the active production-direction sequence; Git operations require their own authority.

Earlier status (2026-09-27/28), kept for history, not current sequencing: M0, M1 and M2.1–M2.3 are delivered with recorded evidence.

- **M2.4 integrated so far:**
  - M2.4.1 (reference-fidelity Medan opening) via PR #12, `3133af8`; its first attempt `9747193` stays recorded as rejected.
  - M2.4.2 (frozen-engine LBC transfer) via PR #13.
  - M2.4.3 (river, route and data storytelling) via PR #15.
  - M2.4.4 technical part (full Medan) via PR #17.
  - M2.4.4b (spatial authoring guide, timing diagnostics) via PR #18.
  - M2.4.5a (soundtrack-only preview publication) via PR #19.
  - M2.4.5 frozen authoring and revision trial, technical scope only, via PR #20 (`44d172e`).
- **Not passed; deferred by owner decision:** the NF-AC-16 Medan visual gate, the NF-AC-17 LBC visual/publication judgement and export. M2 is not complete.
- **Integrated since:** M2.4.5-F1 (contrast against the actual backdrop) via PR #21 (`4298f3a`).
- **Then:** M2.4.5-F2 (layout feedback after a profile change) was diagnosed and implemented in the M2 closure branch together with the shared-fixture flake fix. See the M2.4.5-F2 section.
- **Held:** M3, until Fatih starts it; its entry gate was revised on 2026-09-28.

Revision: 1.7
Date: 2026-10-04
Inputs: `docs/spec.md` revision 0.7 and `docs/refine-spec.md` section 13; owner's TutorLog benchmark and profile-first brief.
Implementation baseline: main/origin-main at `b1875e2` (PR #24, audio checkpoint integrated through M3.P0); the documentation revision was drafted on `8463764` and carried unchanged onto `m3-p0-docs`. Existing work and per-task handoffs remain intact. Historical 2026-09-21 baseline was `7b232c9` with rejected attempt `9747193`, not current code. M0.10 and M1 retain their recorded owner acceptance within their scope. No historical runtime gate is rerun or retroactively passed by this documentation update.

**Current authorised scope (2026-10-06): none open. Batch F (recipe text fit) is CLOSED / INTEGRATED via PR #31 (`e008490`); the next scope needs Fatih's authorization.** Batch E is CLOSED / INTEGRATED via PR #30 (`cfa244e`). Batch D (M3.P5) is CLOSED / INTEGRATED via PR #29 (`ef88eb7`). Batch C (M3.P4) is ACCEPTED_INTERNAL / INTEGRATED via PR #28 (`00a3269`). Before that, Batch B (M3.P2b + M3.P3) was integrated via PR #27 (`0789c47`) and Batch A (M3.P1a + M3.P1b + M3.P2a) was integrated via PR #26. Before that, M3.P0 integration and its documentation PR completed. Earlier on 2026-10-04 the scope was audit and revision of spec/refinement/plan only: No engine/skill/test implementation, dependency installation, rendering or Git mutation. Proposed execution begins only after Fatih authorizes it. Preserve uncommitted audio work, unrelated `AGENTS.md`, Miss Ayu worktree, stash and failed benchmark artifacts.

**Earlier authorised scope, historical (2026-09-28): M2 technical closure batch**, integrated through PR #22 (`93c0a67`).

**Earlier authorised scope, historical (2026-09-28): M2.4.5-F2 diagnosis only.**

**Earlier authorised scope, historical (2026-09-27): M2.4.5-F1, contrast diagnostic against the actual backdrop**, integrated via PR #21.

**Earlier authorised scope, historical: M2.4.2 frozen-engine LBC transfer.** Engine, schemas, CLI, recipes and skill are frozen at `3133af8`; only new LBC project/profile/source data may change. A needed runtime or skill patch fails the trial and must be recorded, not applied silently. No paid generation, new dependency, or later milestone work. Integration, when authorised, follows PR plus squash per AGENTS.md. M2.4.1 scope is complete and recorded in its handoff record.

## 0. Active production-direction plan — 2026-10-04

This section supersedes conflicting sequencing and exclusions in historical sections 2–12. It does not rename delivered milestones or check off their unfinished tests. M3.P tasks are the next production feature track, not a parallel plan. Spec revision 0.7 / refinement section 13 define the contracts and alternatives. Settled: profile-first workflow, explicit audio modes, native output, real visual/revision acceptance and preservation of useful infrastructure. Experimental: expressive authoring route and its minimal composition interface.

### 0.1 Outcome, limits and task tracker

Workflow: choose profile → brief/assets/audio mode → agent authors → technical validation/native preview → ordinary revision → owner approval → final MP4. Do not ask the user to choose primitive/schema details. Account/profile selection does not silently approve unrelated business claims.

| Task | User-visible outcome | Dependency / status |
|---|---|---|
| M3.P0 | Existing audio-correct native export checkpoint safely integrated | INTEGRATED via PR #24, squash `b1875e2` (2026-10-04) |
| M3.P1a | Native final with voice+music, music-only or silent as requested | INTEGRATED via PR #26 (`9ec2b69`) |
| M3.P1b | 1080 preview for honest crop/type review | INTEGRATED via PR #26 (`9ec2b69`) |
| M3.P2a | Same-brief TutorLog motion study and 20s expressive pilot | Route accepted by Fatih as a technical approach (2026-10-04); not visual parity or publication; the 3.0 s headline overlap was fixed inside the product-flow recipe in Batch B |
| M3.P2b | Accepted recipe operated through the production CLI, revision and undo | INTEGRATED via PR #27 (`0789c47`) |
| M3.P3 | Usable brand profile and safe asset/CTA selection | INTEGRATED via PR #27 (`0789c47`) |
| M3.P4 | Three LBC episodes, substantive revisions and compatible profile switch on a freeze | ACCEPTED_INTERNAL / INTEGRATED via PR #28 (`00a3269`), Fatih 2026-10-05: internal production scope; photo publication rights, recipe-param brand checks, voice reuse, cost and repeatability remain open |
| M3.P5 | Proportionate release evidence and handoff for repeated use | CLOSED / INTEGRATED via PR #29 (`ef88eb7`), supervisor post-merge review 2026-10-05: register, operating guide, finals audit 11/11, one bit-identical repeatability pair, verify (run 2) and serial E2E 21/21; open items stay open as listed |
| M3.E | Brand-safe recipe params and profile switching (Batch E) | CLOSED / INTEGRATED via PR #30 (`cfa244e`), 2026-10-06; findings (recipe text fit, noisy coverage, undo leftovers, old `tutorlog-recipe` key) stay open |
| M3.F | Recipe text fit after revision and profile switch (Batch F) | CLOSED / INTEGRATED via PR #31 (`e008490`), 2026-10-06; reliability caveats (owner-flow variant, interruption timeout) and the declared-slot/trusted-code limits stay open |

No task above is completed by this document. Do one independently reviewable task per branch from integrated main; no stacked work. For each: define output → implement real path → show manual acceptance → add focused regression → integration gate. Do not build the whole architecture before showing a video. Existing CLI commands below remain entry points; `preview --resolution 540|1080` is available since P1b (PR #26), default 540. Pilot experiment files belong under `work/`, not new planning documents.

### M3.P0 — Preserve and integrate the audio checkpoint

**Scope/dependency:** First disposition M3.1-B/B1 on `m3-1b-audio-delay`; do not overwrite it with a new renderer experiment. Runtime candidate consists of `keys.ts`, `render-draft.ts`, new `audio-encoding.ts`, its unit test and `audio-boundaries.test.ts`. Keep checkpoint evidence and failed exports; exclude unrelated `AGENTS.md`. Documentation direction changes are not permission to bundle all local work into a commit.

**Acceptance artifact:** existing `work/m3-1b/narrated/output/builds/e20cd950d34b-db83869c-1e6/final.mp4` and M3.1-B handoff. Expected native 1080×1920/30, 560 frames, 18.666667 s, AAC 48 kHz stereo; input edges [0,400], [700,1237], [2237,3224] ms versus output [0,400], [700,1234], [2233,3220] ms. Engine `/11` invalidates old renders, not generated voice keys. These are recorded checkpoint results, not newly measured here.

**Manual/focused/gate:** supervisor compares live fingerprints/diff with reviewed candidate and verifies preserved artifacts/logs. Reuse unchanged candidate's 6/6 focused, verify 274/280 and serial E2E 15/15 evidence; do not run another long suite without changed runtime, stale evidence or a concrete hypothesis. Follow AGENTS integration requirements, record whether evidence reuse is accepted; otherwise gate once. Only after separate explicit commit/push/merge authority integrate exact approved paths via PR and sync main, preserving unrelated work. Stop at this checkpoint if authority is absent. No new feature, audio model or provider action.

**P0 verification — 2026-10-04 (implementer): READY FOR INTEGRATION, awaiting Git authority.** No runtime change, render or long suite. Pinned Node 24.20.0.
- Candidate: the five runtime/test fingerprints equal the M3.1-B table; `git diff HEAD -- packages` touches only `keys.ts` (comment plus `/10`→`/11`) and `render-draft.ts`; the three untracked files are exactly the candidate. Base `8463764` still equals `origin/main` (`git ls-remote`); the branch is not on the remote.
- Gate logs: `verify-2.log` SHA-256 `dcb2e89f…a376`, 274 unit / 280 integration; `e2e-1.log` `16ff68a2…089e`, 8 files / 15 tests, 916.54 s. Both hashes match the handoff. One gap found: `keys.ts` mtime (06:13:49 WIB) is after `verify-2` started (06:12:32); the diff confirms only the `/11` history comment came later, as the handoff states. Serial E2E (06:14:23) ran after it. Hypothesis "comment breaks format/lint" was checked with `biome check .`: 162 files, no fixes, exit 0. Typecheck/tests not rerun (a comment cannot change types or behavior).
- Native final `work/m3-1b/narrated/output/builds/e20cd950d34b-db83869c-1e6/final.mp4`: SHA-256 `d90ea475…7dfb` (matches); ffprobe H.264 1080×1920, 30/1, 560 frames, 18.666667 s; AAC 48 kHz stereo 18.645 s; full FFmpeg decode exit 0. `output/current.json` selects it; manifest SHA-256 `99263495…fb85` matches the pointer. `narrated-final-fixed-verification.json`: hashes valid, manifest matches, selected, approval matches.
- Boundaries: `boundary-measurements-fixed.json` reads [0,400]/[700,1234]/[2233,3220] ms vs authored [0,400]/[700,1237]/[2237,3224], deltas ≤4 ms, zero offset correction, `pass: true`. Failed final `86e3276ce78b-d078c2bd-68c` and `boundary-measurements.json` (+38–43 ms) remain, as do first narrated final `1da9b758834c-1dba9ed0-946`, corrected synthetic final `c80f295af3d1-dedb8247-ef6`, branch `m3-1b-final-export`, the Miss Ayu worktree (`00942b5`), `stash@{0}` and the unrelated `AGENTS.md` (`cfc4f217…32ef`).
- Proposed evidence reuse: accept the recorded focused 6/6, verify 274/280 and serial E2E 15/15 for the unchanged candidate. Integration needs Fatih's explicit commit/push/PR/squash-merge authority and a decision on which documentation paths ship with it.

**P0 integration — 2026-10-04: CLOSED / INTEGRATED.** The supervisor accepted reuse of focused 6/6, verify 274/280 and serial E2E 15/15 for the unchanged candidate and chose option A (runtime PR first, documentation PR separately). With Fatih's explicit authority, commit `fec7d22a691c469c94f5e7a7cd3d470a51a5e51a` on `m3-1b-audio-delay` (base `8463764` = origin/main, fingerprints rechecked unchanged) staged exactly the five candidate files (+399/−4). [PR #24](https://github.com/fatlhr/NaraFrame/pull/24) recorded fingerprints, reused gates, the post-verify comment gap and implementer/supervisor evidence ownership. The supervisor signed off on that head; after Fatih's merge authority it was squash-merged with `--match-head-commit fec7d22…` at `2026-10-04T11:19:44Z`, producing `b1875e2083af4600dc298ec665874e0af50521d2` (parent `8463764`). Squash tree and reviewed head tree are both `fb55562d274d868c54e264cebb545e149c2ffc80`; the squash message has no agent identity or trailer. The repository has no CI checks, so review/sign-off was the integration gate; no suite was rerun. Local main fast-forwarded to `b1875e2` without stash or discard; the documentation changes were carried onto `m3-p0-docs`. `AGENTS.md`, `work/`, the Miss Ayu worktree, `stash@{0}`, branch `m3-1b-final-export`, failed builds and gate logs are untouched. Branch `m3-1b-audio-delay` still exists locally and on the remote pending a cleanup decision. F-A2, D-VIS and word-level enforcement remain open.

**Branch cleanup — 2026-10-04:** with supervisor approval, `m3-1b-audio-delay` was deleted locally and on the remote after both refs were confirmed at `fec7d22a691c469c94f5e7a7cd3d470a51a5e51a`. Branch `m3-1b-final-export`, the Miss Ayu worktree, `stash@{0}` and the `work/m3-1b` artifacts were not touched.

### Batch A — delivery grouping of M3.P1a + M3.P1b + M3.P2a (authorized 2026-10-04)

**Authority.** Fatih authorized one delivery batch covering P1a, P1b and P2a as internal steps. This records the regrouping; the three task sections below keep their scope, acceptance and stop rules. Nothing in Batch B (P2b onward) or other backlog is in scope. The batch does not claim the expressive pilot as an integrated NaraFrame production path; that remains P2b.

**Execution model.** One branch `m3-batch-a` from main `a54d8b6`, commits split by concern (audio-mode readiness, native preview, pilot sources/evidence documentation), one batch PR after Git authority. Merge waits for supervisor review and Fatih's permission. Internal steps follow the plan's feature order: real path → output inspection → focused regression. `pnpm verify` and one serial full `pnpm test:e2e` run once on the final candidate, not per step. The 3–5 s study is an internal checkpoint; the full 20 s pilot proceeds without waiting for owner review. At most two internal corrections per checkpoint. Schema, layout and choreography details are implementer decisions.

**Acceptance for the review package (READY_FOR_REVIEW):**
1. P1a: `validate --stage production` and `render --approve-preview <id>` reach native 1080×1920/30 finals through the CLI for voice(+music), music-only and silent projects with explicit timing. Music-only has AAC, silent has no audio stream; full decode, duration and manifest/approval agree. Missing required voice still fails; a legacy project without a declared mode is reported, not silently promoted.
2. P1b: `preview <project> --resolution 1080` renders native 1080×1920 (not upscaled) with separate keys; default 540 output is unchanged.
3. P2a: a 20 s / 600-frame native 1080×1920/30 TutorLog pilot from a parameterized local Remotion composition using the benchmark brief, copy, official assets and exact prepared music, plus a 3–5 s study, the parameter sources, the exact render command, crop/framing evidence with unchanged original media hashes, typography and object-motion frames, a copy+framing revision rendered from parameters, and comparison frames against Bang Motion at equal timestamps.
4. Gate results, diff summary, limits and measured effort in one consolidated handoff below. Owner visual acceptance is not claimed.

#### Batch A handoff — 2026-10-04 (implementer): READY_FOR_REVIEW

**Integration closure — 2026-10-04: CLOSED / INTEGRATED.** The supervisor marked PR #26 TECHNICALLY_READY FOR MERGE on head `ddde796c05d22579c89bcb79bdce25bbd58a0d0a`. Supervisor evidence: 43 focused tests passed; the CLI matrix refused 15/15 before render with pointer/builds unchanged; the artifact hashes of both owner-flow probe builds matched. Full verify, E2E, positive renders and the bite check were audited as implementer evidence, not rerun by the supervisor. Repeatability was accepted as a Batch A integration caveat without a main-versus-branch probe. **Qualification of the correction record below:** where it says code changes "cannot explain" the owner-flow mismatch, the accepted wording is: audit diff tidak menemukan perubahan jalur 540 yang menjelaskan mismatch; penyebabnya belum terbukti. E2E stays exit 1, 18/19; variant `dbf73700…` is new and repeatability is unresolved. Fatih's decision: accept the parameterized Remotion route to continue, as a technical approach only. This is not a claim that the pilot matches Bang Motion or is ready to publish. The headline overlap around 3.0 s is to be fixed in a bounded way in the next batch, with no separate polish round now. P2b needs its own authorization. With Fatih's merge permission, PR #26 was squash-merged with `--match-head-commit ddde796…` at `2026-10-04T16:15:42Z`, producing `9ec2b69732d1cd0b869d4dffa4f058ae4c9f44d5` (parent `a54d8b6`). Squash and reviewed head trees are both `a1358287bd09dab9fc3dc5839860e1f88fdfdbab`; the squash message has no agent identity or trailer. Local main fast-forwarded without stash or discard; `m3-batch-a` was deleted locally and remotely after both refs were confirmed at `ddde796`. `AGENTS.md` (`cfc4f217…32ef`), the Miss Ayu worktree, `stash@{0}`, `m3-1b-final-export`, `m2-4-5-frozen-trial` and all `work/` evidence are untouched. No suite was rerun. This closure note and the tracker update are local documentation changes, not part of squash `9ec2b69`.


Branch `m3-batch-a` from main `a54d8b6`, local commits only (no push/PR yet): `3032065` P1a, `b52a381` P1b, and a documentation commit for this handoff. `AGENTS.md`, the Miss Ayu worktree, `stash@{0}`, `work/` evidence and earlier benchmark outputs are untouched. Pinned Node 24.20.0 / pnpm 12.3.4, Remotion 4.0.521, Chrome 154.0.8037.58, FFmpeg 7.1.1. Pilot sources and evidence live under `work/production-pilot/` (ignored by Git, per section 0).

**P1a — audio mode decides final readiness (`3032065`).**
- Contract: `naraframe.json` `audioMode` = `voice | music | silent`; profile `production.audioMode` is the default and is enforced when `production.audioMode` is in `lockedPaths` (`AUDIO_MODE_LOCKED`). Without a declaration the mode is read from the files (`legacy`): narration → voice, music bed → music, nothing → silent. A legacy voice project stays exportable unchanged; a legacy non-voice project is reported `AUDIO_MODE_UNDECLARED` at final, because its durations were draft timing. Voice without narration stays `NARRATION_REQUIRED`; music without a bed is `MUSIC_REQUIRED`; narration under a non-voice mode, or a soundtrack in silent mode, is `AUDIO_MODE_CONFLICT` (preview and final). `validate --stage production`, `preview` and `render` report `data.audioMode {mode, source}`; the final `report.json` records it and `render.audio` (`aac`/`none`). Silent finals skip the audio decode only after the probe has proven no audio stream. Approval rejects a silent preview for an audio export (`APPROVAL_PREVIEW_SILENT`, unchanged) and, new, a preview with audio for a silent export (`APPROVAL_PREVIEW_AUDIO_MISMATCH`). The capability registry adds `audioModes`; the skill explains the modes and errors.
- Real path (`work/production-pilot/`, source-only copies; `logs/` holds every JSON result): TutorLog music copy without a mode → `AUDIO_MODE_UNDECLARED` (`music-validate-legacy.json`). Declared:

  | Project | Preview | Final | Probe (`p1a-verification.json`) |
  |---|---|---|---|
  | `tutorlog-music` (`audioMode: music`) | `7ee7990e9d70-a607d139-0cf` | `cb8a149252cd-1a1cbc6b-777` (later superseded as the selected final by P1b's `cb8a149252cd-b80d351c-894`) | H.264 1080×1920 30/1, 600 frames 20.000 s; AAC 48 kHz stereo; decode OK; correlation with `shared/music.wav` 0.999984, lag 0 ms |
  | `tutorlog-silent` (`silent`, no soundtrack) | `c11f8b29cc1a-10d9c7b1-ffa` | `789787a21222-79ec4a2d-d38` | H.264 1080×1920, 600 frames; no audio stream; decode OK |
  | `voice-music` (M3.1-B narrated fixture + the same music, ducked) | `866640e43190-2150f948-ad5` | `c38f5ac5fd71-8a23f5b2-6a7` | H.264 1080×1920, 560 frames 18.667 s; AAC; music trimmed to the narration clock; decode OK |

  Every final: manifest hashes valid, `output/current.json` selects it, report audio and mode as expected. Negative copies (`negative/`): voice without narration → `NARRATION_REQUIRED`; music with narration → `AUDIO_MODE_CONFLICT`; silent with music → `AUDIO_MODE_CONFLICT`. A copy of the narrated checkpoint without `audioMode` validates `ready` as `voice/legacy`. The music project's assembly key equals the old benchmark preview key `7ee7990e9d70…`: declaring a mode changes the source revision, not the pixels. The voice-music music level/ducking was not listened to; only stream/decode/duration were checked.
- Regression: `core/test/integration/audio-mode.test.ts` (resolution matrix, final readiness per mode, undeclared, conflicts, profile lock); `production-readiness.test.ts` updated where it encoded the old global narration rule (still blocks, now by mode); `render-command.test.ts` (undeclared/voice/silent validation, preview-audio mismatch); `capabilities.test.ts`; E2E `audio-modes.test.ts` renders and probes a music-only and a silent native final through the CLI (2/2, 31 s when first run).

**P1b — native 1080 preview (`b52a381`).** `preview --resolution 540|1080` (default 540; anything else is `CLI_USAGE`). 1080 compiles the draft at the design format, still `DRAFT`, with dimensions inside the assembly and scene keys; the draft label scales with the frame (540 pixels unchanged, so no engine bump). A full 1080 preview of the current source is approvable: render compares a 1080 manifest with the 1080 compile, so a 1080 manifest carrying the 540 key is `APPROVAL_PREVIEW_STALE`. Real path: `preview work/production-pilot/tutorlog-music --draft --resolution 1080 --json` → `7becf9be9076-1262df84-54c`, native 1080×1920, 600 frames, AAC; the default 540 preview then reused `7ee7990e9d70-a607d139-0cf` (`reusedFromBuildId`), proving the 540 key is unchanged; `render --approve-preview 7becf9be9076-1262df84-54c` → final `cb8a149252cd-b80d351c-894`. `p1b-evidence/invoice-zoom-540-vs-1080.png`: the 414×290 invoice source is as soft at 1080 as at 540; native preview exposes source limits, it adds no detail. Regression: `draft-resolution.test.ts` (default unchanged, 1080 geometry equals final, distinct keys), two render-command cases, E2E `preview-resolution.test.ts` (1080 and 540 builds probed, final approved from the 1080 preview, decoded).

**P2a — TutorLog expressive pilot (direct Remotion render, not NaraFrame publication).**
- Source: `work/production-pilot/tutorlog-expression/` — `src/` (one trusted local composition `TutorLogPromo`: `lib.ts` frame-derived timing/easing/crop maths, `parts.tsx` crop view, headline roll, device, web window, backdrop, `TutorLogPromo.tsx` choreography), `params/brand.json` (identity: colours, fonts, logo, tag, CTA), `params/recipe.json` (reusable product-flow layout and motion defaults), `params/episode.json` (copy, asset references, crops, beat timing, music). Exact command: `node work/production-pilot/tutorlog-expression/render.mjs --out <mp4> [--params <dir>] [--frames a-b] [--stills list]`, using the installed `@remotion/bundler`/`@remotion/renderer` 4.0.521 from `packages/renderer-remotion` and reading official media in place from `work/tutorlog-promo/shared` (no copies). It mixes PCM and encodes AAC once at the stitcher, the same remedy as M3.1-B; each render writes `<mp4>.manifest.json` with code, params, media and runtime hashes. No network, provider, install or secret is used. Bang Motion was studied for mechanisms only (continuous stage, overlapping hand-offs, 3D tilt, eased drift; its generator is marked MIT); no code was copied.
- Output: candidate `out/pilot-v3.mp4` (SHA-256 `bff987b0812f…`), H.264 1080×1920 30/1, 600 frames 20.000 s; AAC 48 kHz stereo; full decode OK; music correlation 0.999984 with `shared/music.wav`, lag 0 ms. Study `out/study-v2.mp4` (0–4.5 s) and every earlier attempt (`study-v1`, `pilot-v1`, `pilot-v2`) are kept. `review/pilot-v3-contact-sheet.png`; Bang Motion vs pilot at the audit timestamps: `review/compare/cmp-<t>.png`. All evidence: `pilot-evidence.json`.
- What the pilot shows (owner judges quality): headline hierarchy with an accent line and a drawn marker under "rekap?"; three real session cards cropped from one `sessions.png` rising and flying into the phone; one phone carrying "record" and "recap" with a 3D flip between screens; home and recap shown from the full 1080×2400 originals through animated crop rects (focus on "Mulai mengajar" with a tap ring, push into the recap list); the "36 sesi" summary lifted out of the same recap screenshot; the invoice in a neutral web frame with a drawn box around the real total; CTA with logo pop. Device bezel, shadows and drifting backdrop separate assets from the background. Near-empty-frame metric (audit method): 0/600, versus 60/600 for the old NaraFrame preview.
- Crop is data: seven crop rects in `episode.json` over four originals; `mediaUnchanged: true` in every render manifest. Revision: `params-revision/` changes the recap headline to three lines ("Sebulan sesi, / langsung jadi / rekap.") and the callout crop to the Bima row; render `out/pilot-v3-revision.mp4` (`ae98d254…`) has identical code hashes; `review/revision-compare.png` at 10.2 s. Determinism: six frames rendered as stills forward and reverse give identical PNG hashes.
- Internal corrections used: study 1 of 2 (card spacing, status-bar crop, frame-0 headline); full video 2 of 2 (headline roll overlap, CTA overlap, tap ring; then symmetric roll, marker fade, CTA after web exit). **Known weaknesses kept, not fixed past the bound:** around 2.95–3.1 s the three-line hook rolling into the two-line headline shows old and new lines together for about six frames; the proposed fix is a short exit before the next entry instead of a simultaneous roll. The invoice is soft because the official source is 414×290. In the revision, the lifted Bima row duplicates the row visible below it, an editorial choice to reconsider. There is no automated text-fit, collision or contrast check for the custom composition; layout was reviewed from frames. Typography uses the official Courier Prime bold and Source Serif 4 files registered under brand aliases.

**Gates.** `pnpm verify` on the final code candidate: Biome 167 files, typecheck/build, 275 unit / 294 integration (`work/gate-logs/m3-batch-a/verify.log`). Full serial `pnpm test:e2e` on code head `b52a381` (`work/gate-logs/m3-batch-a/e2e.log`, SHA-256 `af340d14…a6dc6a`, 770.26 s, `caffeinate`, no concurrent render): **exit 1, 17/18 tests, 9/10 files**. Both new files (`audio-modes`, `preview-resolution`) and `audio-boundaries`, interruption, soundtrack, reuse, font and reference workflows passed. `owner-flow` failed its pixel-repeatability assertion: one of three sampled lossless frame hashes differs between a preview and its `--rerender` (`0b8f0d18…` vs `0b7a7a30…`). `0b7a7a30…` is the exact variant hash recorded in the 2026-09-27 determinism investigation (M2.4.3 run 3), the open two-variant renderer non-determinism on `samples/krakatau-draft`; this batch does not change that sample's pixels (540 label maths unchanged, no engine bump). Because the test stops at that assertion, its later stale/revise/invalid-motion steps did not run in this gate; they are covered elsewhere only partly (`command-contract`, render-command). Per the no-retry rule the suite was not rerun. This is not a pass; the supervisor decides whether to accept it as the known caveat or require a dedicated rerun. Focused runs during the batch: core audio/readiness/soundtrack/profile 32/32 then 48/48 with CLI, render-command 20/20, new E2E files 2/2 and 1/1.

**Effort (measured from file and commit times; owner active time 0, no owner input during the batch).** First CLI real-path run 19:26; P1a commit 19:37; P1b commit 19:43; pilot params 19:45; study v1 19:49; pilot v3 19:54; revision 19:56; verify 19:57 (local time, 2026-10-04). Render times: CLI previews/finals about 47–51 s each; pilot 20 s renders 39–41 s, study 12–17 s. Agent tokens and cost are unknown; no provider was called.

**Correction batch on PR #26 — 2026-10-04 (implementer): READY_FOR_REVIEW.**
- *Supervisor finding (CHANGES_REQUESTED on `a11ec767`, supervisor evidence):* `preview --draft` skipped `checkAudioModeConflicts`, because only the production preview ran the readiness checks; a silent project with a soundtrack was refused by `preview` but rendered with `--draft`.
- *Implementer reproduction before the fix:* a source copy of `negative/silent-with-music` under `work/production-pilot/correction/` rendered `preview --draft` as `DRAFT • WITH AUDIO`, build `7ee7990e9d70-226d3f7a-696` (`correction/repro-before-fix.json`).
- *Fix `e93ab18`:* every preview resolves the audio mode once and refuses `checkAudioModeConflicts` issues (`AUDIO_MODE_CONFLICT`, `AUDIO_MODE_LOCKED`) before sync, reuse lookup and render, for draft and production, full and scoped, 540 and 1080; the existing resolver/validator are reused, not duplicated. `NARRATION_REQUIRED`, `MUSIC_REQUIRED` and `AUDIO_MODE_UNDECLARED` stay final-only. The refusal reports `readiness: invalid`, `data.audioMode` and `data.stage`. The skill states the rule.
- *Implementer CLI matrix (`correction/run-matrix.py`, `matrix-result.json`):* silent+soundtrack, music+narration and a profile-locked mode violation are each refused for `--draft`, production, `--draft --resolution 1080`, `--draft --scene cta` and `--scene cta --resolution 1080` (15/15) with exit 1, no build ID, and `preview/current.json` and the builds directory unchanged (the reproduction's earlier pointer survives). A legacy undeclared draft (`music/legacy`) and a voice project without narration still render scoped drafts (`bbdc75825dd2-4cc01baf-fbe`, `bbdc75825dd2-cc852e34-2ec`).
- *Regression:* `render-command.test.ts` refuses all five preview forms for the three conflicts and asserts the pointer bytes and absent builds directory. Bite check: with the runner fix reverse-applied and rebuilt, the silent case fails (`--draft` exited 0); restored, 3/3 pass. `audio-modes.test.ts` adds a provisional scoped draft before declaration and a voice-pending draft that previews but fails production validation with `NARRATION_REQUIRED` (3/3, 72 s).
- *Gates (implementer):* `pnpm verify` on `e93ab18`: Biome 167, typecheck/build, 275 unit / 297 integration (`work/gate-logs/m3-batch-a/verify-correction.log`, SHA-256 `e047fa5e…63b8`). One full serial `pnpm test:e2e` on `e93ab18` (`e2e-correction.log`, `e2892ded…88a4`, 878.73 s): **exit 1, 18/19, 9/10 files**; all audio-mode, preview-resolution, audio-boundary, interruption, soundtrack, reuse, font and reference tests passed. `owner-flow` again failed only its pixel-repeatability assertion at the middle sampled frame: first render `0b7a7a30…` (the variant recorded on 2026-09-27), `--rerender` `dbf73700…`, **a hash not recorded before**. The first and third sampled frames matched. Both renders in that assertion use the same code in the same run, and the only renderer change in this branch is the draft-label scale, which is exactly 1 at 540; so code changes cannot explain a difference between the two, but this run alone does not prove the variant set is unchanged from `main`. Not rerun, assertion untouched.
- *Rest of owner-flow, targeted probe (`correction/owner-flow-probe.py`, `owner-flow-probe/probe-result.json`):* under the test's network-denying `sandbox-exec` profile, through the public CLI: first draft `78b434b95f8d-0b7040b4-ed4`; after the one-line closing edit `status` reports `previewState: stale` with `PREVIEW_STALE`; the revised draft `7f6bb21f54ce-4e8a57a1-de0` has a new source revision and the first build is retained; `bounce` is refused with `SCHEMA_INVALID` at `/scenes/0/beats/0/action`; restoring `reveal` validates again. PASS. This probe does not repeat the frame-hash comparison.
- *Limits:* the repeatability failure stays open with a third observed middle-frame variant; a main-versus-branch determinism probe (the existing `work/gate-logs/m2-4-3/determinism-probe.sh` method) would be needed to show the variant set is unchanged, and was not run without authority. The pilot was not changed.
- *PR status:* PR #26 stays open; this batch adds the fix commit and this documentation commit to the same branch; no merge.

**Decisions for review.** Supervisor: P1a/P1b diff and contract (mode precedence, `AUDIO_MODE_UNDECLARED` for legacy non-voice, 1080 approval). Fatih: watch `pilot-v3.mp4` against `tutorlog-bang-motion.mp4` at equal size and decide whether the Remotion composition route is accepted, needs one more bounded pass (the 3.0 s roll), or should switch routes. P2b stays unauthorized until then. Git: permission to push `m3-batch-a` and open one batch PR.

### M3.P1a — Final readiness follows the requested audio mode

**Scope/dependency:** P0 integrated. Add explicit voice(+optional music), music-only and silent intent with an authoritative timeline. A profile may default the mode; project intent resolves it explicitly. Required missing narration still fails. Music/silent must use approved explicit scene durations, not fake narration or music length as story timing. Keep old declarative-v1 projects valid; define a conservative legacy mapping (narration → voice; soundtrack with explicit durations → music-only; no audio with explicit durations → silent), and report unresolved/provisional timing rather than silently declaring it final. Do not change speech alignment merely to implement non-voice readiness.

**Real path:** source-only copies under `work/production-pilot/tutorlog-music` and `work/production-pilot/tutorlog-silent`; `pnpm naraframe validate <project> --stage production --json` then `pnpm naraframe render <project> --json`. Expected 20s/600-frame native 1080×1920/30 H.264; prepared music yields AAC, silent has no audio stream. A copied narrated checkpoint remains valid. No silent-to-narrated downgrade when voice was requested.

**Acceptance:** inspect ffprobe/full decode, music start/end and waveform/boundary evidence, source/approval manifest and failure with intentionally missing required voice. Do not upscale the old 540 preview. Upload approval remains Fatih's decision, not a validator inference.

**Regression/gate:** mode/legacy-resolution matrix; missing required voice and unresolved clock; soundtrack/silent full publication, scoped audio policy, cache/metadata and audio-checkpoint preservation. `pnpm verify` plus one serial full E2E before integration because production/publication behavior changes. No new paid generation.

### M3.P1b — Native-resolution preview

**Scope/dependency:** P1a integrated. Default remains 540; expose explicit 1080 preview without changing the project's design canvas, audio intent or draft/final readiness. Preview resolution, font/layout measurement and render dependencies must agree and affect preview keys/manifests. 1080 does not remove the draft label or authorize final. Avoid a generalized resolution/backend system.

**Proposed acceptance command:** `pnpm naraframe preview work/production-pilot/tutorlog-music --draft --resolution 1080 --json`. Expected native 1080×1920/30 preview, not post-upscaled MP4. Render existing 540 once for comparison; original media hashes unchanged. Show crop/line wrapping and limitations of the 414×290 invoice source at final size.

**Regression/gate:** option/schema validation; separate 540/1080 cache keys/reuse; measured/full/scoped layout consistency; old default compatibility and exact manifest dimensions. Manual playback, focused tests, `pnpm verify` and serial full E2E for this runtime/resolution boundary. Do not promise better source detail from more pixels.

### M3.P2a — Bounded expressive TutorLog pilot, before a framework

**Scope/dependency:** P1b. Use `work/tutorlog-promo/shared/BRIEF.md`, exact copy, official logo/UI/fonts and prepared music segment/gain/fades. Preserve original files and all three earlier outputs. Review the available Bang Motion generator/capture workflow for mechanisms, not as an engine to imitate blindly. Use installed Remotion 4.0.521 first; no dependency upgrade, new provider or general 3D system.

**Authoring experiment:** one trusted local, frame-evaluated Remotion composition with JSON content/brand/framing/timing parameters; seeded randomness if needed, no playback-order state. Separate composition implementation, reusable recipe parameters and episode content. Parameterize enough to prove copy/framing revision, not every visual detail. Internal keyframes/CSS/perspective are allowed. Current declarative paths remain available, but do not extend a universal primitive vocabulary to reproduce each shot. Record local composition/import/asset/font hashes, environment and explicit code approval. Use restricted local imports and no external network, dependency installation, shell/provider calls or secrets; this is trusted owner code, not a secure untrusted-code sandbox. Inspect adaptation provenance/rights first.

**Artifacts:** `work/production-pilot/tutorlog-expression/` containing source, input manifest, 3–5s study MP4 and later `pilot.mp4` (native 1080×1920/30, 20s/600 frames, same music). Record exact executable command used against the installed renderer; do not advertise a new NaraFrame CLI capability until P2b proves it. The study must show distinct text emphasis/surface separation, non-destructive crop/subject placement and conspicuous meaningful object motion. Full pilot must communicate all five copy beats with coherent handoffs, not just a polished opener. A direct-render experiment is not yet NaraFrame final publication.

**Manual acceptance:** show study before completing the video; maximum two internal correction passes at each checkpoint. Fatih compares actual full playback at equal display size with the chosen Bang Motion output: composition/type, framing/separation, purposeful motion/continuity and explanation; overall at least comparable, no unacceptable weakness. Preserve first output and concrete review notes. Exact imagery or choreography copying is not required. Do not redraw invented UI to hide weak source resolution.

**Revision proof/focused checks:** change substantive headline wrapping and one crop/framing through parameters, not original media mutation; compare rendered results and hashes. Check deterministic frame evaluation and local dependency manifest; use small rendered probes rather than a broad framework/test suite. No core change in this experiment unless separately proposed and authorized. Report authoring/render/operator time, corrections and available tokens/cost; unknown remains unknown.

**Route decision/stop:** recommendation is the Remotion composition route, not a predetermined pass. If still visually rejected after the bound, needs repeated engine patches, or managed integration demands a broad framework, stop. Fatih then chooses a separately scoped Bang Motion workflow pilot/bridge, narrows the product, or pauses. Never silently build both. Acceptance selects one route and authorizes P2b separately; do not defend the current engine on sunk cost.

### Batch B — delivery grouping of M3.P2b + M3.P3 (authorized 2026-10-04)

**Authority.** Fatih authorized one delivery batch with P2b then P3 as internal steps, one PR and one consolidated review, including a bounded fix of the TutorLog headline overlap around 3.0 s (no pilot redesign). P3's LBC proof uses the declarative-v1 route. P4 and other backlog are out of scope. Stop before P3 and report if P2b needs more than one recipe/route or a general framework.

**P2b minimal source interface (recorded before implementation).**
- Declaration: `naraframe.json` `recipes: [{ id, path }]`, `path` under `recipes/`. Each recipe directory holds `recipe.json` `{ schemaVersion: 1, id, version, entry, files }`; `files` lists every code file (`.ts`/`.tsx`), entry included. No symlinks, no paths outside the directory.
- Episode content: a scene `visual: { type: "recipe", recipe, params }`; `params` is JSON. Any `assetId` inside refers to a ready PNG in the asset manifest, and a sibling `crop {x, y, width, height}` must lie inside that image's pixels. Timing is the scene's `durationMs`; audio follows the P1a `audioMode` and project soundtrack (the recipe renders no audio). Brand values come from the pinned profile (palette, typography, font assets); recipe-specific values stay in `params` until P3 roles exist.
- Pinning and history: the loader hashes `recipe.json` and every listed file into the source (`recipes[].codeSha256`), so code and params change `sourceRevision`, scene render keys and assembly keys; revisions snapshot those files, and undo restores them.
- Static boundary (load time): imports only from listed relative files, `react` and `remotion` (`RECIPE_IMPORT_FORBIDDEN`); network, clock and randomness APIs, `eval`/`Function`, `process` and `require` are refused (`RECIPE_CODE_FORBIDDEN`). This is trusted-code hygiene, not a sandbox.
- Trust: `naraframe recipe trust <project> --recipe <id> --authorized-by <name>` records the current code hash in project state, only when the owner approved the code in chat. Preview, production validation and render refuse a recipe whose current code hash is not trusted (`RECIPE_NOT_TRUSTED`) before bundling or executing anything. A code change makes it untrusted again; undo to trusted code works without re-approval.
- Rendering: the renderer builds a per-render wrapper entry that registers the trusted recipe modules, then loads the normal entry; the recipe draws at 1080×1920 design pixels, scaled to the draft size. Declarative preflight does not inspect recipe internals; that is reported, not implied.

**Batch B acceptance (review package).** P2b: a TutorLog project built on the pilot recipe previews and renders natively through the CLI (music-only), edits copy and framing through `edit`, undoes to the previous snapshot, refuses untrusted, forbidden-import and changed code before rendering, and leaves an old v1 sample's preview unchanged. P3: one short LBC declarative project created from an LBC profile and brief through skill/schema/public CLI reports its asset roles, CTA and audio mode; a dry-run switch to the TutorLog profile classifies branded, neutral, incompatible and unknown bindings, and unresolved logo/CTA/brand bindings block production readiness. Then focused regression, `pnpm verify`, one serial E2E, consolidated handoff.

#### Batch B handoff — 2026-10-05 (implementer): READY_FOR_REVIEW

Branch `m3-batch-b` from main `9ec2b69`, local commits only: `7a91b1f` P2b, `f0b15f9` P3, plus one documentation commit (this handoff and the Batch A closure note kept locally after PR #26). `AGENTS.md`, the Miss Ayu worktree, `stash@{0}`, earlier branches and `work/` evidence are untouched. Pinned Node 24.20.0 / pnpm 12.3.4, Remotion 4.0.521, Chrome 154, FFmpeg 7.1.1. Real-path projects and logs live under `work/production-pilot/` (`tutorlog-recipe`, `p2b/`, `profiles/`, `lbc-p3`, `p3/`).

**Owner authority used.** Fatih authorized recording recipe trust in his name for Batch B test projects in `work/production-pilot/` (standing, every code hash reported). Trusted `product-flow` hashes: `0e82892e87f4…` (first), `9c7b98172e9a…` (after the logo-param fix; current). The test hash `ac9324593135…` was never trusted.

**P2b — one trusted recipe through the production CLI (`7a91b1f`).** Interface as recorded above. Implementation: `RecipeDeclarationSchema`/`RecipeManifestSchema`, loader `loadRecipes` (hashes `recipe.json` + listed files, static scan, PNG sizes only for recipe projects so other projects keep their source revision), compiled recipe visual with `codeSha256` and asset sizes, `RECIPE_UNKNOWN`/`RECIPE_PARAM_INVALID` (unknown or non-PNG asset, crop outside the image, beats/camera on a recipe scene), recipe files in revision snapshots, append-only `revisions/recipe-trust.json`, `recipe trust` command, trust gates in draft/production preview, production validation and render, a renderer guard that re-reads the project and refuses changed or untrusted code, and a per-render wrapper entry (`ignoreRegisterRootWarning` because it imports the real entry) that registers recipe modules and draws them at 1080×1920 scaled to the draft. The recipe gets params, its referenced PNGs with real sizes, the profile render tokens, fps and duration; it renders no audio.
- Real path (`work/production-pilot/tutorlog-recipe`, pilot code adapted: no audio or font loading, profile fonts/palette, `assetId` params, full-size `home.png`/`recap.png`/`sessions.png` framed by crop): untrusted `preview --draft`, `preview` and `validate --stage production` refuse `RECIPE_NOT_TRUSTED` with no preview directory. After trust: `preview --resolution 1080` → `37480351829f-3ccdb275-8f8`; `render --approve-preview` → final `f26a3f0c7d18-8f540218-c81` (H.264 1080×1920, 600 frames, AAC 20 s, music mode, full decode OK, SHA-256 `b593d026af43…`). `p2b/review/pilot-vs-cli-final.png` matches pilot v3 at five timestamps.
- Revision: `edit` (recap headline to three lines, callout crop to the Bima row) → revision `01f7b89d3928…`, images reused 8/8, scenes 0/1; new 1080 preview `9d6c66822cac-d9016cf5-f8b`; the old approval is `APPROVAL_PREVIEW_STALE`; `undo` → `cc53ae893b44…`, preview reuses `37480351829f-3ccdb275-8f8`.
- Code boundary through `edit`: `node:fs` import and an unlisted `./extra` import → `RECIPE_IMPORT_FORBIDDEN`; `fetch()` → `RECIPE_CODE_FORBIDDEN`; all refused with `STAGED_SOURCE_INVALID`, nothing changed. A one-value code change is accepted as source but its preview is refused (`RECIPE_NOT_TRUSTED`, `ac9324593135…`); `undo` restores `parts.tsx` byte-identical (`31e8781bed64…`) and its preview reuses the earlier build without new trust.
- Offline: `preview --rerender` under the owner-flow `sandbox-exec` profile (loopback only) rendered `f0f0a5d40d94-a4caf9bf-2b6`; `curl https://example.com` from the same profile failed (exit 6). Old v1 project `tutorlog-music` previews by reusing `7ee7990e9d70-ee3f8dc6-3bd`: v1 compile keys unchanged.
- Headline overlap fix (bounded, inside the recipe): old lines leave in 260 ms and the next headline rises after, never sharing a slot (`p2b/review/recipe-transitions.png`; 2.95 s shows no overlap). Trade-off: a short headline-free moment at each beat change; at 7.95 s it coincides with the phone flip edge. No other pilot change.
- Validation boundary: params JSON, asset references/readiness, crop bounds, code imports/APIs, trust and the publication/media checks are enforced; text fit, collisions and contrast inside a recipe are not inspected (skill says so).
- Regression: `recipe-scan.test.ts` (5), `recipe-project.test.ts` (7: pinning, non-recipe projects unchanged, key invalidation on code and params, unsafe code, params checks, trust by hash, undo restores code), `recipe-command.test.ts` (2), capability `visuals` now evidences `recipe`, E2E `recipe-production.test.ts` (trust → preview → native final → edit → stale approval → undo reuse) on committed fixture `test-fixtures/recipes/frame-card`.

**P3 — profiles that carry and guard brand identity (`f0b15f9`).** Profile `brand {name, audience, editorial, cta {label, url}}`, PNG asset `role`, default `production.audioMode`; `profile inspect` reports them. Manifest `binding` (`"neutral"` or `{brand, role}`) on images/vectors; text `binding` to `brand.name`/`brand.cta.label`/`brand.cta.url`. Drafts warn; final readiness refuses `ASSET_BINDING_UNKNOWN` (brand-managed profiles only), `BRAND_ASSET_MISMATCH`, `BRAND_TEXT_MISMATCH`, `BRAND_FIELD_MISSING`. `validate --stage production` reports `data.brand`. `profile apply` plans add `bindings` (branded with replacement by role, incompatible, neutral, unknown, bound text, claims) and editorial-review/replace-assets effects. Copy is never rewritten.
- Profiles (`work/production-pilot/profiles/`): `lbc` = existing `lbc-daylight` 0.2.0 plus brand (name Lentera Binar Cendekia, parents audience, three editorial rules, CTA "Konsultasi gratis via WhatsApp" → `lbc-privat.id`, the domain in the LBC site config), default music, logo role from `lbc-logo.svg` rendered to an 800×800 PNG by headless Chrome (preparation step); `tutorlog` 1.1.0 plus brand (CTA "Mulai gratis" → `tutorlog.id`) and the official logo as logo role.
- LBC project `lbc-p3` through the public CLI: `create --profile profiles/lbc`; two declarative scenes from the existing brief (6.6 s, silent by project choice over the profile's music default); LBC logo and photos bound to `lbc-daylight`, report card/check neutral, the parent photo deliberately unbound. Two authoring errors of mine were caught by validation and fixed (`LAYER_OUTSIDE_CANVAS`, missing source for the service claim → `lbc-privat.id`). Production was blocked by `ASSET_BINDING_UNKNOWN:orang-tua` until an `edit` bound it. Then 1080 preview `2c8822e66a9e-c04c0abf-7eb`, final `9a9056f9c0af-0c8541df-508` (H.264 1080×1920, 198 frames, no audio stream, decode OK, `ad32010b3d4b…`); `p3/review/lbc-final-frames.png` shows logo, name, CTA and URL.
- Dry-run switch to `tutorlog` (before binding): branded `lbc-logo` → `tutorlog-logo`; incompatible `tutor-dan-siswa` (person); neutral `report-card`, `check`; unknown `orang-tua`; three bound texts with new values; claim scene `visit`; nothing changed.
- Isolation and apply/undo (`p3/logs`): editing a copied source profile leaves the project's revision `0e379b569498` and lock unchanged; applying it (`7c148b0bf6b5`) blocks production with `BRAND_TEXT_MISMATCH:cta-label`; `undo` restores ready. Applying `tutorlog` (`fe6b226cda67`) blocks three assets and three texts; `undo` restores ready; re-applying yields the same revision `fe6b226cda67`.
- Regression: `brand-profile.test.ts` (5: final-only blocking, dry-run classification without change, reproducible apply/block/undo, profiles without brand unaffected, font role refused), `profile-command.test.ts` inspect case. The fixture has no narration, so no voice reuse is claimed.

**Gates.** `pnpm verify` on `f0b15f9`: Biome 180, typecheck/build, 280 unit / 312 integration (`work/gate-logs/m3-batch-b/verify.log`). One full serial `pnpm test:e2e` on `f0b15f9` (`work/gate-logs/m3-batch-b/e2e.log`, SHA-256 `a388f4dd…9435`, 858.41 s, `caffeinate`, no concurrent render): **exit 1, 19/20, 10/11 files**. The new `recipe-production` E2E and all audio-mode, preview-resolution, audio-boundary, interruption, soundtrack, reuse, font and reference tests passed. `owner-flow` failed only its pixel-repeatability assertion at the middle sampled frame: `0b7a7a30…` vs `9354e93e…`, another previously unrecorded variant (Batch A saw `0b8f0d18…` and `dbf73700…`). An audit of the diff finds no change on the 540 path that explains it (the renderer gained a recipe branch and wrapper entry used only when a draft has recipe scenes); the cause is not proven and repeatability stays open. Not rerun; assertion unchanged. The targeted probe of the remaining owner-flow steps (`correction/owner-flow-probe-batch-b/probe-result.json`) passed under the sandbox: stale after edit, revised rerender with the first build kept, `bounce` refused at `/scenes/0/beats/0/action`, recovery. Its build keys `78b434b95f8d…`/`7f6bb21f54ce…` equal the Batch A probe, so v1 compile inputs are unchanged.

**Limits.** Recipe code is trusted owner code with static hygiene, not a sandbox; recipe layout is reviewed by eye. Recipes are project-local copies (no shared recipe root yet). The LBC photos' video rights are unconfirmed (as recorded in M2.4.2), so the LBC output is not a publication candidate. P3 does not replace assets on a switch; that is P4 work through `edit`. Agent tokens/cost unknown; no provider calls.

**Effort (local times).** Batch B authorization ~23:20 (2026-10-04); recipe project scaffold 23:47; recipe final 23:57; offline probe 00:00; P2b commit 00:06; LBC profile 00:10; LBC final 00:13; P3 commit 00:15; verify 00:16 (2026-10-05). Renders: recipe 1080 preview 55 s, sandboxed 540 preview 54 s.

**Decisions for review.** Supervisor: P2b/P3 diffs and contracts (trust in project state, static boundary, bindings/blocking rules). Fatih: whether the recipe route and the brand guard behave as he expects, and Git permission to push `m3-batch-b` and open one batch PR. P4 stays unauthorized.

#### Supervisor Batch B review — 2026-10-05: CHANGES_REQUESTED

Reviewed PR #27 at head `a50d0cf8c109c4470ead2f4049ac6beb1625d530`: live OPEN, main base, three commits, 35 files, MERGEABLE/CLEAN, no CI checks. This is one consolidated correction request on the same batch, not authorization for P4 or merge. Runtime, skill, tests and Git were not modified by the supervisor; this review/status record is local documentation.

**Independently run/observed:** 37/37 focused tests across six files (recipe scan/project/command, capabilities, brand-profile, profile-command). Probes used Node 24.20.0 and the candidate's built core; original projects were loaded read-only or cloned in memory. A scratch directory `/private/tmp/naraframe-batch-b-review.Z6PBLL` contains harmless resolver and synthetic trust fixtures. The installed Remotion 4.0.521 resolver configuration plus the renderer's extension alias resolved an unlisted `helper.ts` while the scan accepted an import because `helper.tsx` was listed. This was a resolver probe, not a video render. `crop: null` threw a TypeError in compileDraft. Concurrent synthetic recordRecipeTrust calls both succeeded but persisted only one entry. Same-profile binding planning for lbc-p3 placed three brand-bound images, including its logo, in neutral. The transition sheet supports the bounded headline separation at its sampled times; full playback and visual parity were not assessed.

**All requested corrections:**

1. **P1 — trusted dependency graph differs from bundled graph.** `load-recipes.ts:80–85` accepts any listed candidate, while `render-draft.ts` bundles imports from the live project with Remotion's resolver (`.ts` precedes `.tsx`). Repro: list `index.ts` and `helper.tsx`; leave both helper.ts and helper.tsx on disk; import `./helper`. Scan returns no findings, resolver selects unlisted helper.ts. It is not hashed/scanned/snapshotted/trusted. Computed `import(name)` also returns no scan findings (scanner-only observation). Close the executable file graph over the approved bytes, not merely a matching filename; reject unbounded imports and prevent bundling mutable/unlisted recipe dependencies after the hash guard. This is an exact-code/trust requirement, not a demand for an untrusted-code sandbox. Account for old recipe cache validity if execution semantics change.
2. **P2 — malformed crop crashes compile.** `compile-draft.ts:132–140` dereferences null. Repro: a valid recipe's params contain `{assetId: <ready PNG>, crop: null}`. compileDraft throws `TypeError: Cannot read properties of null (reading 'x')` instead of RECIPE_PARAM_INVALID. Validate the crop's object shape before reading fields; cover null/array/primitive/missing fields and the existing valid/out-of-bounds controls through the public validation path.
3. **P2 — trust append loses concurrent approvals.** `recipe-trust.ts` performs read/append/atomic-write without a project lock; recipeCommand does not acquire one. Two parallel writes for synthetic probe-a/probe-b return success, but only probe-b persists. Atomic rename prevents a partial JSON file, not a lost update. Serialize the read-modify-write using the existing locking convention and regress two concurrent appends plus history preservation; do not touch owner trust in the original work projects.
4. **P2 — a compatible brand binding is misreported as neutral.** `brand-bindings.ts:180–181` pushes any binding matching target.id into neutral. Repro: planBrandBindings(lbc-p3 source, its pinned profile) calls lbc-logo/tutor-dan-siswa/orang-tua neutral despite explicit lbc-daylight bindings. Preserve branded-compatible identity in the plan/report; only explicit `binding: "neutral"` should mean neutral. Do not add automatic copy/media rewriting or P4 replacement behavior.

**Evidence read, not rerun:** verify.log records 280 unit / 312 integration, lint/typecheck/build, exit 0 at f0b15f9; e2e.log records exit 1, 19/20, with the middle-frame repeatability mismatch `0b7a7a30…` vs new `9354e93e…`. The tail owner-flow probe report is PASS for stale/edit/invalid-motion/recovery, with the same compile keys as Batch A; execution was implementer-reported, not rerun by the supervisor. Full verify/E2E, real exports, audio comparisons, offline enforcement and bite checks were not rerun.

**Repeatability disposition:** acceptable as an explicitly open integration caveat, not a passing gate or proven root cause. Diff inspection found no change to the old non-recipe 540 rendering branch that explains the mismatch; renderer wrapper selection is conditional on recipe scenes. Unchanged keys and a passing tail probe do not prove pixel equality. No mandatory main-versus-branch rerender solely to seek a green run, and no assertion relaxation. The four findings above independently block sign-off. One correction batch should supply focused regressions, bounded real recipe/CLI evidence, verify and one serial E2E because the executable recipe/bundling boundary changes; report any failure without retry-until-green. P3's demonstrated text binding coverage is declarative text layers, not arbitrary recipe params; do not claim a safe recipe CTA/profile switch yet. P4 remains unauthorized.

#### Batch B correction — 2026-10-05 (implementer): READY_FOR_REVIEW

Answers "Supervisor Batch B review — 2026-10-05" (CHANGES_REQUESTED on `a50d0cf`) in one round on `m3-batch-b`. Commits `8ef3390` (findings 1–3) and `68a2e70` (finding 4), plus this documentation commit. The supervisor's findings and probes above are the supervisor's evidence; everything below was run by the implementer. Original projects' trust logs, `AGENTS.md`, the Miss Ayu worktree, `stash@{0}` and earlier evidence are untouched; new real-path material is under `work/production-pilot/batch-b-fix/`.

**Reproduced first (candidate build, before any fix).** (1) Through the public CLI, test project `batch-b-fix/resolver-probe` (listed `index.tsx` + `helper.tsx`, unlisted `helper.ts`, trusted under the Batch B test-project authority) rendered `UNLISTED_TS_MODULE` in its preview (`repro-before-fix.png`); the supervisor probe also showed computed `import(name)` passing the scan. (2–4) `repro-batch-b.mjs` (run from the CLI package, now kept in `batch-b-fix/`; output `logs/repro-before-fix.json`): `crop: null` threw `TypeError`; two concurrent appends both returned and only `probe-a` persisted; same-profile planning for `lbc-p3` put the brand-bound logo and both photos in `neutral`.

**Fixes.**
1. *Executable graph = hashed, trusted bytes (`8ef3390`).* `prepareRecipeEntry` reads every listed file once, hashes those bytes with the shared `recipeCodeHash`, requires equality with the compiled and trusted `codeSha256`, writes exactly those bytes to a private staging directory and bundles from there; the wrapper imports the staged entry. Unlisted files cannot be resolved. Bytes changed between compile and staging are refused by the hash comparison; edits to the original files after staging do not change the bundle, which already holds the captured bytes. The scan now requires a relative import to match exactly one listed file and refuses computed `import()`. Compiled recipe visuals carry `executor: "naraframe-recipe/2"`, so recipe builds made before staging are never reused; `RENDER_ENGINE` and non-recipe keys are unchanged. Bounded: no sandbox or new framework.
2. *Crop shape.* A present `crop` must be a plain object with finite numeric `x`, `y`, `width`, `height` before bounds are checked; otherwise `RECIPE_PARAM_INVALID` at `…/crop`.
3. *Trust append.* `recordRecipeTrust` reads and writes under `withProjectLock`, which gained an optional bounded wait (`waitMs`, 10 s for trust) for a live holder; it returns a `Result`. An existing log that cannot be read is refused (`RECIPE_TRUST_LOG_INVALID`) instead of being rebuilt from empty.
4. *Compatible brand assets (`68a2e70`).* `planBrandBindings` adds `compatible` for assets bound to the target brand; only `binding: "neutral"` is neutral. No automatic replacement or copy change.

**After the fixes (implementer real path).** `resolver-probe` previews `LISTED_TSX_MODULE` (`resolver-before-after.png`, build `40f2c791ffad-683cbc16-603`, not reused from the old build). Through `edit`: listing both `helper.ts` and `helper.tsx`, and a computed `import(name)`, are each refused (`RECIPE_IMPORT_FORBIDDEN`, nothing changed). The TutorLog recipe project still previews from staging with its trusted code hash unchanged (`c24e29ec4a7a-904817a1-e47`, 53.9 s, no reuse because of the executor change). `logs/repro-after-fix.json`: `crop: null` → `RECIPE_PARAM_INVALID /scenes/0/visual/params/beats/hook/cards/0/crop`; concurrent appends → `probe-a`, `probe-b` persisted; `lbc-p3` same-profile → compatible `lbc-logo`, `tutor-dan-siswa`, `orang-tua`, neutral `report-card`, `check`.

**Regression.** Renderer `recipe-staging.test.ts` (3: staged files are exactly the listed ones with identical bytes while unlisted `crop.tsx`/`extra.ts` sit beside them; code changed after compile is refused; untrusted code is refused before staging). `recipe-scan.test.ts` (+2: ambiguous listed match, computed import). `recipe-project.test.ts` (+2: null/array/string/number/missing/non-numeric/out-of-bounds/valid crops with path; three concurrent appends after an earlier entry all persist and history stays first; unreadable log refused and left byte-identical). `brand-profile.test.ts` (+1 compatible vs neutral; the existing dry-run expectation gains `compatible: []`). E2E `recipe-production.test.ts` (+1: listed `label.tsx` with an unlisted `label.ts` that throws on import; preview succeeds). Bite check: with the staging change reverse-applied and rebuilt, that E2E case fails; restored, it passes. P3's proven text-binding coverage is declarative text layers only; brand names or CTAs inside recipe params are not checked, and the skill says so.

**Gates.** `pnpm verify` on `68a2e70`: Biome 181, typecheck/build, 282 unit / 318 integration (`work/gate-logs/m3-batch-b/verify-correction.log`). One full serial `pnpm test:e2e` on `68a2e70` (`work/gate-logs/m3-batch-b/e2e-correction.log`, SHA-256 `7bd863fe…7fa5`, 891.30 s, `caffeinate`, no concurrent render): **exit 0, 21/21, 11/11 files**, including both recipe E2E cases and `owner-flow`. This single green run does not resolve repeatability: earlier runs on nearby candidates failed at the same middle frame with varying hashes (`0b8f0d18…`, `dbf73700…`, `9354e93e…`), and the cause is not proven. No retry was needed or made; no assertion changed.

**Candidate fingerprints (SHA-256 prefix, files changed since `a50d0cf`).** runner.ts `817d8d806d03fc3c`; recipe-production.test.ts `d476a31acb283036`; compile-draft.ts `3870ff39e94630c9`; core index.ts `5aa4198738090cc8`; brand-bindings.ts `da54830a40e65cde`; load-recipes.ts `1da2bf42b073ee97`; lock.ts `4ca0654d57666895`; recipe-trust.ts `143f44dea88f1dab`; compiled.ts `7a9e256d893afbc7`; brand-profile.test.ts `fe7bf11a748d865c`; recipe-project.test.ts `7667c75643248222`; recipe-scan.test.ts `9a6be9c784d63c43`; render-draft.ts `73aabd08d8cb4f4f`; recipe-staging.test.ts `a1b23f992dd8e6ee`; SKILL.md `d050c6fba394c2e4`.

**Remaining limits.** Recipe code is trusted owner code with static hygiene and an exact-bytes bundle, not a sandbox. Recipe-param brand text is not covered by bindings. The owner-flow repeatability caveat remains open despite this green run. Staging uses a per-render OS temp directory that is removed afterwards.

#### Batch B integration closure — 2026-10-05: CLOSED / INTEGRATED

With Fatih's explicit merge permission, PR #27 was squash-merged with `--match-head-commit 97583f45759d89bce4f2c1b9df42ac2885032958` (the signed-off `bce45d7` plus one documentation-only commit; all 15 reviewed non-document fingerprints unchanged) at `2026-10-04T22:19:32Z`, producing `0789c47e008a6cdb8880ee4c44ac6b6d143cd54a` (parent `9ec2b69`). Squash and head trees are both `cf374527401a13cd271dd9a7498def9acf8ea90c`; the squash message has no agent identity or trailer. No suite or render was rerun for the documentation delta. Local main fast-forwarded without stash or discard; `m3-batch-b` was deleted locally and remotely after both refs were confirmed at `97583f4`. `AGENTS.md`, the Miss Ayu worktree, `stash@{0}`, `m3-1b-final-export`, `m2-4-5-frozen-trial` and `work/` evidence are untouched. Open: owner-flow pixel repeatability (cause unproven despite the last green run) and brand text inside recipe params (not covered by bindings). P4 is not authorized. This note and the tracker update are local documentation for the next PR, not part of squash `0789c47`.

#### Supervisor Batch B correction review — 2026-10-05: TECHNICALLY_READY FOR MERGE

Sign-off on PR #27 head `bce45d72d377aef10c6fc541c17ba58444a3b142`. All four findings on a50d0cf are closed within the bounded Batch B contract; no new blocking finding. Live PR is OPEN/MERGEABLE/CLEAN, main base, six commits and 37 files, with no CI checks. Local and origin/m3-batch-b equal the reviewed head. Commit metadata has no agent identity/trailers. `68a2e70..bce45d7` changes docs/plan.md only, and all 15 reported non-document fingerprints match the current files. Merge needs Fatih's authority; P4 is not authorized.

**Supervisor evidence, freshly executed:** 63/63 focused tests: seven files covering scan, capabilities, recipe project/command, brand profile, profile command and revision/lock behavior (60), plus renderer staging (3). Read-only/in-memory probes on the real projects confirm malformed crops return RECIPE_PARAM_INVALID at the crop path while a valid rectangle compiles; lbc-p3's three brand-bound images are compatible and only report-card/check are neutral. A synthetic fixture in `/private/tmp/naraframe-batch-b-rereview.Ywviyv` accepted and retained all 16 concurrent trust appends. Preparing the real resolver-probe's staging entry and resolving `./helper` with the installed Remotion resolver selected only staged helper.tsx, whose bytes matched the approved source; ambiguous listed imports and computed imports were refused by the scanner. Removing executor from an in-memory draft changed both recipe scene and assembly keys. RENDER_ENGINE stays /11 and the correction adds executor only to recipe visuals; no non-recipe pixel/key code was changed. Temporary staging created by the supervisor probe was cleaned in finally. No video render or original-project trust/source mutation was performed.

**Evidence audited, not rerun:** verify-correction.log SHA-256 `25c09a841cba75828b076a15a04ada77d166e45d0d7cbe55a55bd5e9a31905fb` records lint/typecheck/build, 282 unit / 318 integration, exit 0 at 68a2e70. e2e-correction.log SHA-256 `7bd863fe5868483372257d84bf6d85897ad06a7376f90f20f60258a813e87fa5` records 21/21 tests across 11 files, exit 0 in 891.30 s at the same candidate. CLI logs report the fresh corrected resolver build with no reuse and directional import-edit refusal. Full verify/E2E, the staging bite check, actual rendered labels/exports and the no-retry execution chronology remain implementer evidence; they were not independently rerun in this review.

**Precision and remaining limits:** edits that change bytes between compile and staging are refused by the hash comparison; edits to the original files after staging do not alter the already-captured bundle, rather than necessarily causing an error. Use that wording in the PR description instead of promising every post-check edit is refused. Trusted-code hygiene is not a security sandbox. P3's proven CTA/name text binding coverage remains declarative layers, not recipe params. The latest E2E passed, but earlier repeatability failures and their unexplained variants remain open; no general determinism or visual/publication approval is implied.

**Integration handoff:** include this local review record and status update with documentation only, preserve all reviewed non-document fingerprints, and update the PR's overview/evidence to reflect the correction and evidence ownership. If the final delta is only these review/status/wording records, no new runtime gate or administrative supervisor round is required; verify the delta and fingerprints before integration. After explicit merge authority, use the actual final head with --match-head-commit, preserve unrelated AGENTS.md/worktree/stash/evidence, sync main safely, and record closure. Any implementation/test/skill change invalidates this unchanged-candidate shortcut. Do not start P4.

### M3.P2b — Operate one accepted recipe through NaraFrame

**Scope/dependency:** accepted P2a route. If Remotion is selected, wrap only that trusted local recipe in existing preview/render/revision flows. Before implementation record its minimal source interface: route/version, pinned code entry and transitive local dependencies, JSON content/profile parameters, asset references and explicit timing/audio intent. Code/parameter snapshots participate in sourceRevision, render keys, invalidation, approval and undo. Passive SVG sanitization is not approval to execute a script. No arbitrary upload/code marketplace or multi-renderer abstraction. If the alternative route is selected, revise this task's bounded adapter/acceptance in this document before implementing; do not implement both interfaces.

**Acceptance:** `preview` and `render` on the new TutorLog project through CLI, same native video; edit copy/framing via the public edit route and undo to the previous snapshot. Demonstrate offline/local operation and reused untouched media. Untrusted/unapproved code, external import/path and changed dependency hash must fail directionally; stale code cannot reuse approval/cache. Old v1 sample still previews unchanged.

**Validation boundary:** label which checks apply to recipe parameters, assets, fonts, actual text boxes, runtime and publication. For custom layout expose measurable text/safe-zone regions or document uncovered geometry for manual review; do not pretend old declarative preflight fully inspects TSX. Future GUI edits declared parameters only; opaque internals require an agent code change and review.

**Regression/gate:** code/import/parameter/asset key invalidation; revisions/undo and approval; offline enforcement and unsafe references; final audio/artifact metadata; old-v1 compatibility. Show public real path first, then focused protection, `pnpm verify` and serial E2E before integration. Capability registry/skill advertise only the proven bounded path. Stop if integration expands beyond one recipe/route.

### M3.P3 — Profiles that choose brand assets and production defaults

**Scope/dependency:** P2b integrated. Extend existing pinned profiles only where needed for LBC/TutorLog: audience/editorial intent, logo/font/approved-media roles, CTA/contact/destination, audio/default production preferences and recipe defaults. Content pattern is a reusable recipe; episode facts/copy/assets remain project content. Preserve existing font/PNG pinning, overrides and explicit profile apply. No GUI/catalog service, marketing claim generator or mandatory fresh media generation.

**Acceptance artifact:** create one short LBC project from profile + brief using skill/schema/public CLI, without opening renderer implementation during authoring. Report selected asset roles, CTA, audio mode and snapshot. Dry-run a compatible profile switch: identify branded, neutral, incompatible and unknown bindings. Unknown is not automatically compatible; unresolved logo/CTA/claim bindings block production readiness. Source-profile edit alone leaves the project unchanged; explicit apply/undo is reproducible.

**Manual/focused/gate:** review visible branding/CTA and relevant asset selection, not just JSON diffs. Cover locked overrides, profile hash/assets, brand-bound versus neutral references, role conflicts, editorial claims not silently rewritten, default precedence, apply/undo and reusable media. Focused tests + `pnpm verify`; full serial E2E if the runtime/publication boundary changes, otherwise existing E2E at P5. Claim no voice reuse proof without voice in the fixture.

### Batch C — M3.P4 preparation and trial (authorized 2026-10-05)

**Authority and scope.** Fatih authorized one delivery batch: M3.P4 preparation, freeze and trial. P5 and other backlog are out of scope. No engine, CLI, skill or dependency change; any shared-code or runtime change during the freeze stops the trial as a recorded defect.

**Owner decisions during preparation (2026-10-05).**
- Route: one parameterized Remotion recipe for LBC, shared by all three episodes (the integrated P2b route). Declarative-v1 alone was not accepted for this trial. Episodes may end with a declarative end card so logo, name and CTA keep their declarative bindings; text inside recipe params is not brand-checked.
- CTA: if the button points to the site, it reads "Konsultasi gratis melalui situs LBC" → `lbc-privat.id`; a WhatsApp CTA would need a verified WhatsApp destination. The LBC profile gets a new version for this; `lbc-p3` stays pinned to 0.2.0.
- People: the tutor episode stays generic; no named tutor (Miss Ayu) appears.
- Media: LBC site hero photos (`tutor-dan-siswa`, `materi-belajar`, `laporan-orang-tua`, `tutor-menjelaskan`) are allowed for this internal trial; publication rights stay unconfirmed. Fonts are SIL OFL.
- Audio: all three episodes are silent (declared over the profile's music default); the only local music bed has unverified rights.
- Trust: Fatih allows trust records in his name for recipe iteration hashes only in the development project `work/production-trial/lbc-recipe-dev`; the frozen hash needs his separate approval before it runs in `lbc-01`..`lbc-03`.

**Facts allowed in copy** (from `lbc_kimi/src/config.ts`, the LBC site source): tutor comes to the home; SD–SMA; Bekasi and Jakarta; 1-on-1; parents review recommended tutor profiles; selection by subject/level, teaching experience, area/schedule and the child's needs; a 90-minute trial session; monthly package of 8 sessions; a report after every session (material, understanding, exercises, next-session notes); monthly evaluation. No prices, rankings or grade promises.

**Acceptance (review package).** Three native previews (20–25 s) through the public CLI with first drafts kept, contact sheets, a substantive copy revision that changes wrapping, an asset/crop change, undo, reuse evidence, a compatible profile switch on a copy of neutral content (no tutor endorsement turned into another brand's promotion), an issue list and factual time/cost. At most two internal corrections per checkpoint. Final export only after Fatih's visual approval, then manifest, ffprobe and full-decode checks.

#### Batch C trial package — 2026-10-05 (implementer): READY_FOR_REVIEW (lbc-01 final only)

Branch `m3-batch-c` from main `0789c47`, documentation only so far (no commit yet). Everything under `work/production-trial/` (projects, logs, review media, freeze record) and `work/production-pilot/profiles/lbc` (0.3.0). `AGENTS.md`, the Miss Ayu worktree, `stash@{0}`, `lbc-p3` and earlier evidence are untouched.

**Preparation (before the freeze).** LBC facts checked against `lbc_kimi/src/config.ts`. Profile `lbc-daylight` 0.3.0: CTA "Konsultasi gratis melalui situs LBC" → `lbc-privat.id`, editorial notes for this trial, recommended duration 15–30 s (was 5–15 s). One new recipe `lbc-story` 0.1.0 (`index.tsx`, `parts.tsx`, `lib.ts` reused from product-flow, `types.ts`): headline beats, each with one proof object: a photo card with a crop that pushes in, a session-report card whose rows tick in, a numbered checklist, or a candidate-profile card with field labels only (no invented person). Brand palette and fonts come from the profile; the recipe's extra colours are params. Episodes end with a shared declarative end card whose logo, name, CTA label and URL are bound to the profile. Development ran in `lbc-recipe-dev` under Fatih's dev-only trust authority with hashes `a8c0f98f6ac0…` and `71f80fe561f9…`; `checklist` and `profile` kinds were proven there too (`review/dev-kinds.png`).

**Freeze** (`work/production-trial/freeze/freeze.json`, accepted by Fatih 2026-10-04T23:52:15Z): main/HEAD `0789c47`, tree `cf37452…`, no tracked code change; Node 24.20.0, Remotion 4.0.521, Chrome 154, FFmpeg 7.1.1 and dist hashes of three entry files only (`cli/dist/index.js`, `core/dist/index.js`, `renderer-remotion/dist/render-draft.js`; other dist modules, including the Remotion entry, were not fingerprinted, so "dist unchanged" in `freeze-check.json` covers those three files); skill hash; profile 0.3.0 files; recipe `lbc-story` 0.1.0 code hash `71f80fe561f96bcbaaf603ed2dcd001d9f9fd3b41888280e4decbc8e20b36773` with per-file hashes; five media files (four LBC site photos converted to PNG, the LBC logo SVG). Fatih approved trust of that hash in the three trial projects and the switch copy. `freeze-check.json` after the trial: HEAD, tracked code, dist, skill, profile, recipe (in all four projects) and media all unchanged; no shared patch was needed.

**Episodes** (public `create`/`validate`/`recipe trust`/`preview`/`edit`/`undo`; silent; first drafts kept in `review/`):

| Project | Message | Length | First draft | Internal corrections |
|---|---|---|---|---|
| `lbc-01` | Matching a tutor to the child (generic: four selection criteria, parents review a candidate profile, 90-minute trial session) | 23.5 s | `50aa71c06d46-6dc6a721-0d1` | 0 |
| `lbc-02` | One-to-one learning at home (one tutor one student, the child's pace, Nasional/Cambridge/IGCSE/IB, monthly package of 8 × 90-minute sessions with reports) | 23.5 s | `e272077aeeac-33cabda9-d44` | 0 |
| `lbc-03` | Progress reports (parents informed, report after every session, monthly evaluation) | 23 s | `f2ed830ed189-b640117a-377` | 0 |

Contact sheets: `review/lbc-0N-first-draft-sheet.png`. Each first-draft command took 53–56 s.

**Revision, undo, reuse, switch.**
- Copy that changes wrapping: `lbc-01` opening "Mencari tutor / yang cocok / untuk anak?" → "Bingung memilih / tutor untuk anak?" (3 → 2 lines) through `edit`; images reused 4/4, scenes 1/2 unchanged; preview `7fc9e773bceb-c0613546-8d2` (`review/lbc-01-revision-compare.png`).
- Asset and crop change: `lbc-03` closing photo from `tutor-menjelaskan` to a tighter crop of `tutor-dan-siswa`; preview `082656ba94d5-04f1de22-130` (`review/lbc-03-revision-compare.png`).
- Undo: `lbc-03` back to `3b8399cd3e27…`; the next preview reused the first draft `f2ed830ed189-b640117a-377` in 1.4 s.
- Compatible switch on a neutral copy (`lbc-neutral-switch`: generic study-habit copy, no LBC photos or service claims, label "BELAJAR PRIVAT"): dry-run listed the LBC logo as branded (replacement `tutorlog-logo`) and the three bound texts; no claims. Applying `tutorlog` blocked production (`BRAND_ASSET_MISMATCH:lbc-logo`, three `BRAND_TEXT_MISMATCH`). One `edit` replaced the logo with the TutorLog logo bound to `tutorlog`, set the bound texts to the TutorLog values, removed LBC-bound assets from the manifest and changed the recipe's colour params; production became ready and preview `b1efd5e12b21-6b005024-6ea` shows TutorLog fonts, colours, logo and CTA with no LBC logo, name or contact (`review/switch-compare.png`). The recipe id `lbc-story` stays as an internal name. `lbc-01`..`03` sources and both source profiles were byte-identical before and after.

**Issues found.** (1) Recipe params (label, headlines, colours) are not brand-checked; the switch needed a manual colour/label decision, as expected. (2) Each beat change has a short headline-free moment (the frozen exit-then-enter rule); it is most visible when the outgoing card is also fading. (3) The candidate-profile card shows an empty avatar circle by design (no named tutor). (4) `CONTRAST_UNVERIFIED` info on the CTA label over the rounded button (checked by eye: white on navy). (5) The 13 s neutral copy is below LBC 0.3.0's recommended 15–30 s and, after the switch, below TutorLog's recommended 20 s (`DURATION_OUTSIDE_PROFILE_RECOMMENDATION`); production validation of the TutorLog version also reports two `TEXT_OUTSIDE_SAFE_ZONE` warnings on the end card's `name` and `cta-url` layers. All three are warnings: readiness stays `ready`, and they are recorded, not resolved. (6) All four LBC photos look like stock or generated imagery and their publication rights are unconfirmed; the trial is internal. No defect required a shared-code change.

**Time and cost (measured).** Preparation from the dev project's creation (06:17 local) to freeze acceptance (06:52 local, 23:52Z) ≈ 35 min, including two dev renders. Trial: three first drafts at 06:53, 06:55, 06:56; revisions, undo and switch done by 07:02 local. Render commands 53–57 s each; the undo preview 1.4 s. Owner time: three decisions (media/route/CTA/audio; trust scope; freeze acceptance); active minutes unknown. Agent tokens and cost unknown. No provider or generation calls; audio silent.

**Native previews for review** (`preview --resolution 1080`, current sources): `lbc-01` `95a884310edf-bbedf264-0db` (revised copy, 705 frames), `lbc-02` `67d359b82792-bf5f7f45-9ad` (705), `lbc-03` `3bb590feb20b-b7a94df2-ccb` (690, after undo); each 1080×1920, no audio stream, 53–55 s to render; copies and contact sheets in `review/lbc-0N-native-1080*`.

**Owner visual review (2026-10-05).** Fatih approved `lbc-01` only (preview `95a884310edf-bbedf264-0db`). `lbc-02` and `lbc-03` were not approved and have no final export. Feedback for the next recipe iteration: "kurangi zoom in tiap menampilkan card, terlalu monoton" — every beat's card enters with the same rise/scale-in and holds with the same push/drift, so the motion repeats. Not patched during the freeze; it needs a new recipe version (different entrances per visual kind, fewer push-ins), a new hash and a new trust decision.

**Final export `lbc-01`.** `render --approve-preview 95a884310edf-bbedf264-0db` after `validate --stage production` ready with no errors: build `d9aa2a933f4b-f9659ff9-a9b`, 64 s, selected by `output/current.json`. Manifest approval binds source revision `e84109da1067…` (equal to the manifest's source revision) and the preview build; every manifest artifact hash matches. ffprobe: one H.264 video stream, 1080×1920, 30/1 fps, 705 frames, 23.5 s, no audio stream (silent). Full decode `ffmpeg -xerror … -f null -` exit 0. Final MP4 SHA-256 `36d6fc8c9459a90d0643f46d181a71e8ff33402d6947a11bfa86d6f0666e75fd`. This is visual approval for the internal trial, not publication approval: photo rights are unconfirmed and posting stays out of scope. Evidence `logs/lbc-01-final.json`. After the export, HEAD, tracked packages and the `lbc-01` recipe files still match the freeze.

**Result against P4 acceptance.** Not met as a whole: one of three episodes has the owner's visual approval for the internal trial; none is cleared for publication (photo rights unconfirmed). Proven on the freeze: three episodes from one shared recipe through the public CLI, a wrapping-changing copy revision, an asset/crop change, undo with reuse, a compatible profile switch on neutral content without leaked LBC logo/name/contact, and a verified final for the approved episode. Open: card motion monotony (owner feedback), recipe-param text not brand-checked, photo rights, active owner time and agent cost.

**Next (superseded).** The supervisor asked for one correction pass; see below.

#### Batch C correction pass — 2026-10-05 (implementer): ACCEPTED_INTERNAL / INTEGRATED (see closure below)

**Scope.** One correction pass inside Batch C, not P5: documentation corrections from the supervisor review, then `lbc-story` 0.2.0 for the owner's motion feedback on copies of the three episodes. No engine, CLI, skill or dependency change; no copy, fact or CTA change; no wider redesign. The first freeze, its projects (`lbc-01`..`03`, `lbc-neutral-switch`), the `lbc-01` final and all earlier evidence stay as recorded. The 0.1.0 source is archived byte for byte in `work/production-trial/freeze/lbc-story-0.1.0/` (hashes equal `freeze.json`).

**Documentation corrections.** Current-scope pointer now names Batch C; the stale "`--resolution 1080` proposed, unavailable" pointer now says P1b shipped it; neutral-copy warnings corrected (TutorLog recommends 20 s; two `TEXT_OUTSIDE_SAFE_ZONE` warnings on the end card); the `lbc-01` final is internal visual approval, not publication approval; freeze 1's dist fingerprint is stated as three entry files only.

**Recipe `lbc-story` 0.2.0** (`index.tsx`, `parts.tsx`, `types.ts`, `recipe.json` changed; `lib.ts` unchanged):
- No photo zoom or whole-card scaling. The 0.1.0 rise-tilt-scale entrance, hold drift and fade-lift exit are gone (the report checkbox keeps its small tick pop).
- Photos keep a fixed crop (`crop`; `focusCrop` is accepted for 0.1.0 params but unused) and slide in from the right over 640 ms, pushing the previous object out left in step; the photo's tilt is static.
- Report, checklist and profile cards cut in at the beat start and their contents carry the motion: report rows tick from +300 ms (was +700), checklist items slide in from +200 ms (was +450), profile fields reveal from +300 ms (was +600). An object cuts out when the next object is a card; the last object stays until the scene transition.
- Headline gap fixed without overlap: the first headline still rises line by line; at each beat change the old block rolls up out of a fixed slot (`max lines × line height + 24 px`, clipped) while the next block follows exactly one slot height below it over 560 ms, so some headline is always on screen and the two blocks never share pixels. The last headline still leaves line by line before the end card.

**Development (dev-only trust authority, `lbc-recipe-dev`).** One iteration, no internal correction: dev drafts on the current scenes of all three episodes (`v2/review/dev-c1-lbc0N.mp4`, sheets), frame strip of the first headline swap (`v2/review/dev-c1-swap-5000.png`). Code hash `93b9ad611c4a2b488d52ae23190b0aa51c263d6834376521569486b3ec452132`.

**Freeze 2** (`work/production-trial/freeze/freeze-2.json`, accepted by Fatih 2026-10-05T12:56:47Z): same HEAD/tree `0789c47`/`cf37452…` (only unrelated `AGENTS.md` changed outside docs/work); same runtime; dist now fingerprinted as complete trees (cli 33 files, core 245, renderer-remotion 49) plus the three freeze-1 entry hashes, which are unchanged; skill, LBC profile 0.3.0 tree, media and end-card template unchanged from freeze 1; recipe 0.2.0 per-file hashes and code hash above. Fatih approved trust of that hash in the three copies only; the 0.1.0 trust was not reused. `freeze-2-check.json` after the review renders: all true, including the recipe in the three copies and the dev project.

**Copies** (`v2/make_copy.py`: `create` from the LBC profile, then the original's current `scenes.json`, assets manifest and files, title/audio/recipe declaration; profile lock and scenes byte-equal to the original; recipe files checked against freeze 2):

| Copy | Content from | Source revision | Native 1080 preview | Frames | Internal corrections |
|---|---|---|---|---|---|
| `lbc-01-v2` (regression control) | `lbc-01` approved revised copy | `9d5ac4636392…` | `bcefe19e6d6a-13695188-f11` | 705 | 0 |
| `lbc-02-v2` | `lbc-02` | `6ca6fe77af5b…` | `d50275bc45bc-7daaf437-c4c` | 705 | 0 |
| `lbc-03-v2` | `lbc-03` after undo | `d8689aa14b0d…` | `a142df8d7d6e-36b3eef0-7a0` | 690 | 0 |

Each: `recipe trust` → `validate --stage production` ready with no warnings → `preview --resolution 1080`, 1080×1920, no audio stream, 56–66 s. Copies and sheets: `v2/review/lbc-0N-v2-native-1080*`; old-versus-new (1 fps, freeze-1 native preview above, 0.2.0 below): `v2/review/lbc-0N-old-vs-v2.png`. In the compares, the 0.1.0 frames at beat changes show an empty headline slot and a fading card; the 0.2.0 frames show the rolling headline and the next object in place. Switch and undo were not repeated (runtime unchanged); no E2E run.

**Open after the correction.** Same as the first trial except motion: recipe-param text not brand-checked, empty avatar circle, CTA contrast info, photo rights unconfirmed (internal trial only), owner time and agent cost unknown. Report→report changes in `lbc-03` are a plain cut of the card with its rows ticking again; Fatih judges whether that reads well. Measured time: dev check 19:25 local, freeze-2 acceptance 19:56, three native previews done by 20:00.

**Owner visual review and finals (2026-10-05).** Fatih approved all three 0.2.0 previews. Each copy: `validate --stage production` ready with no warnings → `render --approve-preview <preview>` (`v2/final.py`, evidence `v2/logs/lbc-0N-v2-final.json`):

| Copy | Approved preview | Final build | Render | Frames | Final MP4 SHA-256 |
|---|---|---|---|---|---|
| `lbc-01-v2` | `bcefe19e6d6a-13695188-f11` | `5cd3d4385ef7-c4cd391e-f20` | 65 s | 705 | `3c5f7bd19431…3961` |
| `lbc-02-v2` | `d50275bc45bc-7daaf437-c4c` | `7f62e5e9cc13-19d4f154-0fd` | 61 s | 705 | `76c7f5085e5c…a21e` |
| `lbc-03-v2` | `a142df8d7d6e-36b3eef0-7a0` | `2b64d478b9f8-e9a96aa0-4e6` | 55 s | 690 | `53d28a85724b…293b` |

For each: manifest approval binds the copy's source revision and the approved preview; every manifest artifact hash matches; `output/current.json` selects the final; ffprobe shows one H.264 stream, 1080×1920, 30/1 fps, no audio stream; `ffmpeg -xerror` full decode exit 0. `freeze-2-check.json` after the finals: all true. The `lbc-01` final from freeze 1 (`d9aa2a933f4b-f9659ff9-a9b`) stays as recorded.

**Result.** On freeze 2, all three LBC episodes from one shared recipe have the owner's visual approval and verified finals; with freeze 1's revision, undo, reuse and compatible switch evidence, this is the P4 review package. It is internal: photo publication rights are unconfirmed and posting is out of scope. Whether P4 is accepted is the supervisor's and Fatih's decision.

**Next (superseded).** See closure.

**Batch C integration closure — 2026-10-05: ACCEPTED_INTERNAL / INTEGRATED.** Supervisor signed off PR #28 at head `f6014e61f798fb927016c4bd54a113c1cef3e55b`; Fatih accepted P4 for the internal production scope and authorized the merge. Squash-merged with `--match-head-commit` on that SHA as `00a3269e514f30f0eebfc54bb1929bc3ef7735c5` (parent `0789c47`, no agent identity or trailer); squash tree `7a537ca1799b55e8c1a1e009fc37897559998904` equals the PR head tree. Local `main` fast-forwarded to `00a3269` with the unrelated `AGENTS.md` change kept (no stash/discard); branch `m3-batch-c` deleted locally and on origin after its target was confirmed. `work/` (projects, freezes, finals, review media), the Miss Ayu worktree and `stash@{0}` are untouched. No suite or render was rerun. Still open: photo publication rights, recipe-param brand checks, voice binding/reuse (no narration in this trial), active owner time and agent cost, and pixel repeatability. This note is a local documentation change for the next update; no administrative PR. P5 not authorized.

### M3.P4 — Frozen repeated LBC production and compatible brand switch

**Scope/dependency:** P3 accepted/integrated; record exact Git/tree/code/skill/shared-recipe hashes, runtime and artifact baseline. Three new LBC episodes with different messages: tutor introduction, personalised one-to-one study, and parent progress reports, subject to current verified business facts. Use one pinned profile and relevant local assets; audio modes follow each brief, not forced voice. Shared choreography reuse is legitimate brand consistency, not a heuristic failure.

**Artifacts/commands:** `work/production-trial/lbc-01` through `lbc-03`; each reaches public `validate --stage production`, native `preview` and `render`, with first draft/final MP4 and revision/receipt reports. Final posting remains separate. Record active owner/operator and agent authoring time from the start, render time, internal versus user corrections, raw reuse hashes/key reports, provider calls and actual/estimated/unknown costs. Do not equate byte/hash reuse with reported generation savings or compare mismatched benchmark timers.

**Acceptance:** Fatih judges each a usable upload candidate. Request substantive copy that changes wrapping/communication, a materially different crop or asset, and undo. One neutral, compatible-content project switches to another approved profile with different logo/CTA/fonts; review content/claims explicitly rather than turning an LBC tutor endorsement into TutorLog promotion. Original profile/projects stay unchanged; no leaked logo/contact. Voice binding/reuse is demonstrated only if actual narration participates; otherwise explicitly open.

**Freeze/stop:** no engine/compiler/renderer/CLI/skill/shared-recipe patch during the trial. Episode content/parameters and recipe-supported choreography edits are allowed. A needed shared patch is a failed trial checkpoint, preserved with reproduction; propose a separate task/new freeze. At most two internal corrections per episode/revision checkpoint, then ask Fatih instead of silently burning tokens. Do not add new primitives as a trial workaround.

**Focused/gate:** primarily evidence from real public paths; add regression for defects only in separately approved tasks, not mid-freeze. No full suite rerun for every content edit. Audit keys/revisions/undo/brand/audio artifacts and measure output effort; any new runtime change invalidates the frozen trial rather than passing it.

### M3.P5 — Release evidence and practical handoff

**Scope/dependency:** P4 owner acceptance. Reconcile NF-AC-18–20 and old evidence in one register, current capabilities/skill instructions and short operator workflow. Fresh runtime gates cover changed authoring/audio/profile/publication boundaries; do not duplicate historical tests just to fill unchecked boxes. Run `pnpm verify` and one serial `pnpm test:e2e` on the final code candidate. Run two fresh comparable renders once for repeatability, recording differences without retry-until-green. Bit-identical pixels are not proven by deterministic input/keys; disposition remaining differences explicitly.

**Acceptance:** operator can pick profile, produce, revise and obtain the approved native MP4 from the documented commands; manifest/ffprobe/full decode agree with intended audio and timing. Preserve cancellation/atomicity evidence and open hard-kill process/reliability findings. No claim of safe untrusted-code hosting, universally better/cheaper output or full word-timing support without proof. Review D-VIS separately for any actual Medan/LBC publication; its old outputs do not become approved by this pilot. Release/package/provider expansion requires a separate owner decision.

### Batch D — M3.P5 release evidence and handoff (authorized 2026-10-05)

**Authority and scope.** Fatih authorized Batch D: M3.P5 only, to READY_FOR_REVIEW, on branch `m3-p5` from main `00a3269`, carrying the local Batch C closure note. No engine, dependency, provider, publication or backlog work; no new installer, recipe catalogue or packaging. Commit/push/PR need Fatih's permission; merge needs sign-off and separate permission. `AGENTS.md`, the Miss Ayu worktree, `stash@{0}` and historical artefacts are untouched.

#### P5 evidence register (NF-AC-18–20 and open items)

Status words: **MET** = the stated evidence exists and was re-checked in P5; **PARTIAL** = part of the criterion has evidence, the rest does not; **OPEN** = no passing evidence. Owner acceptance is quoted at its scope; nothing here is publication approval or a Bang Motion parity claim.

| Item | Status | Evidence (re-checked 2026-10-05 unless noted) | Limits |
|---|---|---|---|
| NF-AC-18 voice + music | MET (fixture) | `work/production-pilot/voice-music` final `c38f5ac5fd71-8a23f5b2-6a7`: H.264 1080×1920 30/1, 560 frames, AAC 48 kHz stereo, 18.667 s | Music level/ducking not listened to; music-bed rights not reviewed |
| NF-AC-18 music only | MET (fixture) | `tutorlog-music` selected final `cb8a149252cd-b80d351c-894` (approved from the 1080 preview `7becf9be9076-1262df84-54c` in P1b; the earlier P1a final `cb8a149252cd-1a1cbc6b-777` from the 540 preview remains on disk): 600 frames, 20.000 s, AAC; P1a music correlation 0.999984 | Benchmark music, not a production licence decision |
| NF-AC-18 silent | MET (fixture and trial) | `tutorlog-silent` `789787a21222-79ec4a2d-d38` (600 frames, no audio stream); `lbc-p3`, `lbc-01`, `lbc-0N-v2` silent finals | — |
| NF-AC-18 native 1080 preview, keys, approval | MET | P1b `preview --resolution 1080`; separate keys; finals approved from 1080 previews (`tutorlog-music`, all Batch C finals); E2E `preview-resolution` | Draft label stays on previews; more pixels add no source detail |
| NF-AC-18 narrated boundaries, voice still required | MET | M3.1-B `work/m3-1b/narrated` final `e20cd950d34b-db83869c-1e6` (SHA-256 `d90ea475…7dfb`, 560 frames, AAC) and `boundaries` `c80f295af3d1-dedb8247-ef6`; negative copies (`NARRATION_REQUIRED`, `AUDIO_MODE_CONFLICT`) from Batch A | Word-level timing enforcement not implemented |
| NF-AC-19 route choice | MET (decision) | Fatih accepted the parameterized trusted Remotion route as a technical approach (2026-10-04); P2b runs it through the CLI (`tutorlog-recipe` final `f26a3f0c7d18-8f540218-c81`, music, 600 frames) | — |
| NF-AC-19 quality comparable to Bang Motion | OPEN | `pilot-v3.mp4` and the recipe final exist; Fatih's acceptance explicitly excluded parity | No "comparable" or "better" claim |
| NF-AC-20 three episodes, revisions, undo, switch, isolation | MET for internal production (ACCEPTED_INTERNAL, PR #28) | Freeze 1: `lbc-01`..`03` first drafts, wrapping copy revision, asset/crop change, undo with reuse, compatible switch of neutral content to TutorLog; freeze 2: `lbc-01-v2`..`03-v2` finals `5cd3d4385ef7-c4cd391e-f20`, `7f62e5e9cc13-19d4f154-0fd`, `2b64d478b9f8-e9a96aa0-4e6` with Fatih's visual approval | Revisions/undo/switch ran on freeze 1 (recipe 0.1.0), not repeated on 0.2.0; upload candidacy is internal only |
| Photo publication rights (LBC site photos) | OPEN | Recorded as unconfirmed in every Batch C record | Blocks publication of the LBC finals |
| D-VIS / NF-AC-16/17 (Medan, early LBC) | OPEN | Unchanged since M2 closure | Not passed by any M3 output |
| Recipe-param brand checks | OPEN | Bindings cover declarative logo/name/CTA only; Batch C switch needed a manual label/colour edit | Review recipe params by eye before a brand switch |
| Voice binding / reuse | OPEN | No narrated episode in P4; voice reuse proof exists only from M1/M3.1 fixtures | No reuse claim for brand episodes |
| Cost and active time | OPEN | Render times and elapsed times recorded; owner active minutes, agent tokens/cost unknown; no provider calls | No cheaper/faster claim; earlier render timers have different boundaries |
| Pixel repeatability (NF-AC-06) | PARTIAL / OPEN | P5 pair below: bit-identical; historical owner-flow variants (2026-09-20, M2.4.3, Batch A/B E2E) remain unexplained | One identical pair does not prove the variant cannot recur |
| Hard-kill/process reliability (F-A2, issue #16), contrast/collision limits | OPEN | Unchanged; cancellation/atomicity evidence from M3.1-A retained | — |

**Finals audit** (`work/gate-logs/m3-p5/audit_finals.py`, read-only, `finals-audit.json`). Eleven selected finals: `m3-1b/narrated`, `m3-1b/boundaries`, `tutorlog-music`, `tutorlog-silent`, `voice-music`, `tutorlog-recipe`, `lbc-p3`, `lbc-01`, `lbc-01-v2`, `lbc-02-v2`, `lbc-03-v2`. For every one: `output/current.json` manifest SHA-256 matches; every manifest artifact hash matches; the approval names a preview build and binds the manifest's source revision (no autonomous export); ffprobe streams match the declared audio (AAC 48 kHz stereo for voice/music, no audio stream for silent; H.264 1080×1920 30/1); `ffmpeg -xerror` full decode exit 0. No trial was repeated and no new video was rendered for this audit.

**Repeatability** (`work/gate-logs/m3-p5/repeatability.sh`, evidence `work/gate-logs/m3-p5/repeatability/`). Fixed fixture: a source-only copy of the tracked `samples/krakatau-draft` with the owner-flow test's scene durations (3/6/3/3 s), the E2E network-denying `sandbox-exec` profile, main `00a3269` code, Node 24.20.0, one machine. Two fresh renders, once, no retry: `preview --draft` → `78b434b95f8d-01840486-909` (51 s) and `--rerender` → `78b434b95f8d-c6517fb0-a36` (48 s); same source revision `7b953e27aa38…` and assembly key. Result: 450/450 decoded frames identical by rgb24 `framemd5` (including the E2E samples 0/195/449) and identical MP4 SHA-256 `5bf45d04ad1b…1c35`. Load average during the runs 9–13 on 8 cores (browsers open). Disposition: this pair repeats exactly; the earlier variant pairs on the same sample stay recorded and unexplained, so NF-AC-06 stays open rather than passed.

#### Operating guide — repeated profile production (current main)

Detailed agent rules stay in `skills/naraframe/SKILL.md`; commands below are the public CLI, run from the repository root as `pnpm naraframe <command> <project> … --json` (one JSON result on stdout; `<project>` is the project directory). Leaving out `<project>` is refused (`SOURCE_MISSING` or `CLI_USAGE`).

1. **Setup.** Node 24.20.0 (`.node-version`), pnpm 12.3.4, `pnpm install --frozen-lockfile`, `pnpm build`; `ffprobe`/`ffmpeg` on `PATH` for the output checks below (recorded runtime: FFmpeg 7.1.1, Chrome 154, Remotion 4.0.521). `pnpm naraframe doctor --json` checks the runtime.
2. **Pick the profile and read the brief.** `profile inspect <profile-dir>` shows palette, fonts, brand block (name, audience, editorial notes, CTA), asset roles and `production.audioMode` (default, maybe locked). Decide the audio mode from the brief: `voice` (needs narration), `music` (needs a music bed) or `silent`.
3. **Create and author.** `create <project> --profile <profile-dir>`; then in the project: `naraframe.json` (`title`, `audioMode`, optional `recipes`), `assets/manifest.json` (every image with `sha256` and a `binding`: `"neutral"` or `{"brand", "role"}`), `scenes.json` (copy, sources/claims, durations; a recipe scene carries its `params`). Brand name/CTA as declarative text layers with `binding` so production can check them.
4. **Recipe code (when a scene uses one).** Copy the recipe directory into `recipes/<id>` and declare it. Code runs only after the owner accepts that exact code: `recipe trust <project> --recipe <id> --authorized-by <owner>` after the owner says so; any code change needs acceptance again. Preflight checks schema, imports, assets and crops, not text fit, collisions, contrast or brand text inside the recipe, so review recipe frames by eye.
5. **Validate and preview.** `validate <project> --stage plan` → `preview <project> --draft` (540, quick) → `validate <project> --stage production` (audio, bindings, readiness) → `preview <project> --resolution 1080` (native size for crop/type review).
6. **Revise.** Put changed files in a staging directory laid out like the project; `status <project>` for `sourceRevision`; `edit <project> --from <staging> --expect <sourceRevision> --summary "…"`; `undo <project>` returns to the previous revision without provider calls. Every revision needs a new preview and review.
7. **Brand switch (compatible content only).** `profile apply <profile> <project> --dry-run` lists branded/neutral/incompatible/unknown assets, bound texts and claims; apply, then fix content through `edit`; production refuses brand mismatches.
8. **Approve and export.** Owner reviews the full preview of the current source; `render <project> --approve-preview <preview-build-id>`. Check the result: `output/current.json` → manifest hashes, ffprobe (streams match the audio mode, 1080×1920/30, expected frames), full decode (`ffmpeg -v error -xerror -i final.mp4 -f null -`). The final is not a publication; posting and rights are separate decisions.

**What is in Git and what is local.** In Git: code (`packages/`), the skill, docs, `profiles/current-issues`, `samples/` (including the repeatability fixture `samples/krakatau-draft`). Local only (the `work/` tree is ignored): the production profiles, recipes, media, projects, finals and gate logs. Back them up outside Git before relying on them elsewhere. Current local inputs:

| Input | Location (`work/…`) | Fingerprint |
|---|---|---|
| LBC profile `lbc-daylight` 0.3.0 | `production-pilot/profiles/lbc` | `profile.json` `8bd7f76c2f76…`; tree (8 files) `f17515e572e6…` |
| TutorLog profile `tutorlog` 1.1.0 | `production-pilot/profiles/tutorlog` | `profile.json` `17afcc837131…`; tree (6 files) `45b83cff428c…` |
| Recipe `lbc-story` 0.2.0 (LBC) | `production-trial/lbc-recipe-dev/recipes/lbc-story` | code `93b9ad611c4a…` (per-file hashes in `production-trial/freeze/freeze-2.json`); 0.1.0 archived in `production-trial/freeze/lbc-story-0.1.0/` (`71f80fe561f9…`) |
| Recipe `product-flow` 1.0.0 (TutorLog) | `production-pilot/tutorlog-recipe/recipes/product-flow` | current trusted code `9c7b98172e9a…`; directory tree `aeff6d9e8a83…` |
| LBC trial media (4 site photos as PNG, logo SVG) | `production-trial/media` | per-file hashes in `freeze-2.json`; tree `43a2c1e0139e…`; publication rights unconfirmed |
| Production scripts used in the trials | `production-trial/*.py`, `production-trial/v2/*.py` | helpers around the public CLI, not product code |

Trust is per project (`revisions/recipe-trust.json`); copying a recipe to a new project needs the owner's acceptance there too.

#### Gates and review package — 2026-10-05 (implementer): READY_FOR_REVIEW

**Candidate.** Code is main `00a3269` unchanged (`git diff 00a3269 -- packages` empty); the batch changes `docs/plan.md`, `docs/spec.md`, `docs/refine-spec.md` and one line of `skills/naraframe/SKILL.md` (the stale "M0 output is … `draft-only`" boundary, which contradicted the final-export rules below it, now says a preview is a `DRAFT` review build and a final is not a publication). Logs are complete (run through `rtk proxy`, unfiltered); the Batch B gate logs were filtered summaries, so their per-test detail is not available.

**Gates** (`work/gate-logs/m3-p5/`, Node 24.20.0, pnpm 12.3.4):
- `verify.log` (SHA-256 `4f2f1ccd…3fed`), run 1, exit 1: Biome 181 files and typecheck passed; unit 281/282, `packages/cli/test/unit/harness.test.ts` timed out (5000 ms default; 6.7 s to import the CLI sources). Load average 11.3 on 8 cores with browsers busy. Diagnostic, not a gate rerun (`diag-harness-isolated.log`): the same test alone passes in 1.49 s. The test is unchanged since M0 and no code changed. Suspected cause: resource contention during the parallel unit run, supported by the high load and the fast isolated pass but not proven (no controlled reproduction). No earlier verify log records this failure, so it is recorded as a newly observed, possibly environment-sensitive failure, not as an old caveat.
- `verify-2.log` (SHA-256 `d02242cc…41ed6`), after Fatih closed the busy browsers (load 3.6), exit 0: Biome 181, typecheck/build, unit 282/282, integration 318/318. The only rerun in this batch; run 1 stays recorded.
- `e2e.log` (SHA-256 `e44b864a…f9fb`), one serial `pnpm test:e2e --reporter=verbose` (e2e project `fileParallelism: false`), `caffeinate`, no concurrent render: exit 0, 11/11 files, 21/21 tests, 950.05 s, including `owner-flow` (pixel repeatability sample), `recipe-production`, `audio-modes`, `preview-resolution`, `audio-boundaries` and `interruption-recovery`. A green owner-flow run does not close NF-AC-06 (see repeatability).

**New findings (recorded, not fixed here).**
1. *Unit harness timeout, observed once.* Observation: in verify run 1 (load average 11.3 on 8 cores, browsers busy) `harness.test.ts` took 6.7 s and hit the 5000 ms default; alone it passed in 1.49 s, and verify run 2 at load 3.6 passed. Suspected, unproven cause: resource contention while the test imports the whole CLI source graph in a fresh worker. No reliable reproduction exists; a separate task would first try to reproduce it under controlled load, then, if confirmed, give import-heavy harness tests an explicit timeout or cap unit workers.
2. *Gate logs filtered by the shell proxy.* Batch A/B gate logs are summaries because commands ran through `rtk`. Proposal: keep running gates through `rtk proxy` (as here) and say so in the handoff rule.
3. *Record gap fixed in docs.* The Batch A table named the first `tutorlog-music` final; the selected final is P1b's `cb8a149252cd-b80d351c-894` (annotated in the table).

**Use limits.** Internal production on this machine and runtime: trusted recipes are owner-accepted local code with static hygiene, not a sandbox; recipe frames need visual review (no text-fit/collision/contrast/brand check inside); LBC photo rights unconfirmed, so no publication; no Bang Motion parity, cost or speed claim; voice reuse for brand episodes unproven; pixel repeatability not guaranteed; hard-kill/orphan reliability (F-A2, issue #16) open; word-level timing not enforced.

**Backlog (unchanged priorities, each a separate decision).** Photo rights/licensed media for LBC; D-VIS (NF-AC-16/17); recipe-param brand checks; voice binding/reuse on a narrated brand episode; owner active time and agent cost tracking; repeatability root cause; F-A2/issue #16; contrast/collision limits; recipe polish seen in review (empty avatar circle, report→report cut in `lbc-03`, product-flow headline gap); the two findings above.

**Supervisor review — 2026-10-05: technical evidence accepted; CHANGES_REQUESTED for two documentation corrections.** Independent supervisor checks: the 11-final audit (hashes, approval/source binding, streams, full decode) matches; a fresh decode of the repeatability pair gives 450/450 identical frames and equal MP4 SHA-256; the gate log hashes match; verify and E2E were not rerun by the supervisor; commands without a project reproduce `SOURCE_MISSING` and `CLI_USAGE`. Requested: name `<project>` in the operating guide's `validate`, `preview`, `status` and `undo` steps, and state the timeout cause as suspected, not proven.

**Correction pass — 2026-10-05 (implementer): READY_FOR_REVIEW.** Documentation only: the guide now names `<project>` on every command and the repository-root context; the gate note, finding 1 and Current step describe the timeout as suspected resource contention without a proven reproduction. No render, suite, runtime, test or further skill change; findings and acceptance limits unchanged.

**Next (superseded).** See closure.

**Batch D integration closure — 2026-10-05: INTEGRATED.** With Fatih's commit/push/PR permission the four documented files were committed as `0204f0a57aba8de0f4622b74059417766dd658b0` (PR #29). Fatih then authorized the merge; no separate supervisor sign-off on PR #29 was forwarded before it, so the supervisor's last recorded verdict is the technical acceptance plus the two documentation corrections carried by that head. Squash-merged with `--match-head-commit 0204f0a…` as `ef88eb7c0414ed9a62742b6ecb2fe32ad45ecaf4` (parent `00a3269`, no agent identity or trailer); squash tree `e6d18c500bbf14f10f1b9b754b5e5916de8d35f7` equals the PR head tree. Local `main` fast-forwarded to `ef88eb7` with the unrelated `AGENTS.md` change kept; branch `m3-p5` deleted locally and on origin after its target was confirmed. `work/`, the Miss Ayu worktree and `stash@{0}` are untouched. This note is a local documentation change for the next authorized PR; no administrative PR.

**Supervisor post-merge review — 2026-10-05: M3.P5 CLOSED / INTEGRATED on `ef88eb7`.** Verified after the merge: PR #29 MERGED; squash tree equal to head `0204f0a`; exactly four files changed; local and remote `main` in sync; `m3-p5` deleted; both requested documentation corrections present. The supervisor reran no suite or render. This is a post-merge review: the PR sign-off was not forwarded before the merge, and this record does not turn it into a pre-merge approval.

**Proposed next scope (for Fatih's decision; not authorized).** One batch on brand-safe recipes and profile switching: explicit identity bindings inside recipe params, dry-run and mismatch diagnostics, a neutral-content trial across profiles, revision/undo/cache/approval behaviour, skill text and regressions. If Fatih approves the scope, it runs as one batch to READY_FOR_REVIEW with all findings collected for one consolidated review. Until then no code, rendering, dependency or other backlog work starts. No merge without sign-off and separate permission. Nothing beyond P5 starts.


### Batch E — brand-safe recipe params and profile switching (authorized 2026-10-06)

**Scope.** One batch to READY_FOR_REVIEW (supervisor: GPT; implementer: Claude): recipes declare which params carry brand identity, a profile switch reports them, production and final refuse mismatches. Engine changes are allowed for this feature only; no visual polish, publication, voice, provider, dependency or repeatability work. Git needs Fatih's separate permission. Handoff follows below when the batch is complete.

#### Batch E handoff — 2026-10-06 (implementer): READY_FOR_REVIEW

Branch `brand-safe-recipes` from main `ef88eb7`, uncommitted. Carries the local Batch D closure note. `AGENTS.md`, the Miss Ayu worktree, `stash@{0}`, original projects/profiles, earlier freezes, finals and evidence untouched; all Batch E inputs are copies under `work/brand-safe-recipes/` (ignored by Git).

**Contract (implemented).**
- `recipe.json` may declare `bindings: [{ "param": "<JSON pointer into the scene's params>", "field": "<profile field>" }]`. Fields: `brand.name`, `brand.cta.label`, `brand.cta.url`, `render.palette.background|surface|text|accent`. Pointers are explicit (`/brand/name`, numeric array segments allowed, ≤16 segments); no wildcard, expression, regex search or code evaluation. A param bound twice, or inside another bound param, or an unknown field/extra key, is `RECIPE_MANIFEST_INVALID`.
- Values are compared, never rewritten. Text compares exactly; palette compares case-insensitively against the palette after the project's valid overrides.
- Draft: warnings `RECIPE_BINDING_MISMATCH`, `RECIPE_BINDING_PATH_MISSING`, `RECIPE_BINDING_TYPE_INVALID`, `BRAND_FIELD_MISSING` at `/scenes/<i>/visual/params<pointer>`. `validate --stage production` and `render` turn them into errors (same path as the existing brand codes).
- Coverage: `RECIPE_BINDING_COVERAGE` (info) per recipe scene names the declared count and the text params no binding covers; `data.brand.recipes` on `validate --stage production`, `preview` and `render` lists bindings (value, match) and uncovered params. A recipe without bindings stays compatible and reports 0 declared.
- Switch: `profile apply --dry-run` adds `plan.bindings.recipeParams` (scene, recipe, param, field, current, target, state `unchanged|changes|missing|invalid-type|field-missing`) and `recipeCoverage`; target palette values include the overrides that survive the switch; a changing param adds `editorial-review`.
- Trust/snapshot: `recipe.json` is already one of the hashed, snapshotted and bundled recipe files, so bindings are part of `codeSha256`; changing or removing them needs trust again and `undo` restores them. `LoadedRecipe.bindings` is present only when declared, so recipes without bindings keep their source revision.
- Files: `core/src/schema/recipe.ts`, `core/src/recipe/load-recipes.ts`, `core/src/profile/brand-bindings.ts`, `core/src/profile/apply.ts`, `core/src/compiler/production.ts`, `cli/src/runner.ts` (brand summary on preview/render; preview issues deduplicated), `skills/naraframe/SKILL.md`; tests below. No dependency, renderer executor or cache-key change.

**Old builds not misused.** Read-only check with the new code (`work/gate-logs/brand-safe-recipes/identity-check.json`): `lbc-01`, `lbc-0N-v2`, `lbc-p3`, `tutorlog-music`, `tutorlog-silent` keep their current source revision and the assembly key of their selected final. `tutorlog-recipe` keeps its source revision, but its selected final's assembly key differs from a compile today; the same check on a clean build of main `ef88eb7` (temporary worktree, removed) shows the same difference, so it predates Batch E (the final was promoted 2026-10-04T16:57Z, before the Batch B correction). It is recorded, not fixed.

**Freeze.** Freeze 1 (`work/brand-safe-recipes/freeze/freeze.json`, 2026-10-05T23:21Z): HEAD `ef88eb7` plus the Batch E code diff (hash and untracked test files), complete dist trees, skill, copied LBC 0.3.0 and TutorLog 1.1.0 profiles, recipe `brand-note` 0.1.0 (`2061ec149554211cd1acd53f8289f8567a7699c67f634f4d63acd8a501d28f7a`), logos, runtime (Node 24.20.0, Remotion 4.0.521, Chrome 154, FFmpeg 7.1.1). Trust: Fatih authorized that hash for dev/trial projects under `work/brand-safe-recipes/` only. Attempt 1 on freeze 1 passed A–D but every production preview reported `RECIPE_BINDING_COVERAGE` twice (the preview merged the draft compile's issues with the production checks' info issues). Evidence kept in `attempt-1/`. Patch: `runner.ts` deduplicates preview issues with the existing `dedupeIssues`; the E2E now asserts one coverage issue (red on the freeze-1 dist, `focused-e2e-2-red-on-freeze1.log`; green after the patch). Freeze 2 (`freeze-2.json`, 2026-10-05T23:24Z) differs from freeze 1 only in the code diff and dist; recipe, profiles, media, skill and runtime unchanged. `freeze-2-check.json` after the trial and gates: all true.

**Trial (freeze 2, `work/brand-safe-recipes/note-2`, public CLI only; logs `logs/f2-*.json`, summary `logs/f2-trial-A-D.json`).** Neutral silent 9 s study note (headline, three points) closing on logo, name, CTA, URL and an accent rule; recipe `brand-note` declares the four identity params; logo `lbc-logo` bound `{brand: lbc-daylight, role: logo}`.

| Check | Result |
|---|---|
| A. Matching identity → ready, native 1080 | `validate --stage production` ready (duration warning only; coverage 4 declared, 5 neutral text params uncovered); `preview --resolution 1080` `9794115a13fc-f209baf5-f4e` |
| B. Switch LBC → TutorLog | dry-run lists `/brand/name`, `/brand/cta/label`, `/brand/cta/url`, `/colors/rule` with current LBC and target TutorLog values (`changes`) plus the logo as branded (replacement `tutorlog-logo`); source files and revision unchanged. After `apply`: production refuses `RECIPE_BINDING_MISMATCH` ×4 and `BRAND_ASSET_MISMATCH:lbc-logo`; `render --approve-preview` of the A preview is refused the same way; no final pointer or build existed before or after |
| C. One identity edit | `edit` (params name/CTA/URL/rule and the logo asset bound to `tutorlog`) → production ready; `preview --resolution 1080` `b86742cb4421-31b3e2e0-846`. Frames (`review/f2-A-vs-C-last.png`, `review/f2-C-tutorlog-1080-sheet.png`): TutorLog logo, name, "Mulai gratis", `tutorlog.id` and green rule; no LBC logo, name, CTA or URL in the managed fields |
| D. Undo, reuse, approval | undo → switched state, production refuses again; undo → original LBC: every source file byte-equal to A, `lbc-logo.png` hash unchanged; production ready; `preview --resolution 1080` reuses A's pixels (`reusedFromBuildId` `9794115a13fc-f209baf5-f4e`); `render --approve-preview` of the C preview → `APPROVAL_PREVIEW_STALE`; no final created |
| E. Legacy and declarative | source-only copy of `lbc-01-v2` (`lbc-story` 0.2.0, no bindings): plan valid, coverage 0 declared and 38 uncovered params including `/label` and `/colors/mark`; production refuses only `RECIPE_NOT_TRUSTED` (the copy was deliberately not trusted). Copy of `lbc-p3` (declarative): production ready, no recipe coverage, dry-run text/asset plan as before (`logs/E-legacy-declarative.json`) |

No final export was made and no approval or autonomy was created; the dev project (`dev`) only proved the recipe renders before the freeze.

**Trial findings (recorded, not patched in the trial).**
1. Text fit inside recipes is still unchecked: with TutorLog's wider display face the first headline line "Belajar sedikit," shows only "Belajar" (the word wraps into a clipped line). Known limit of recipe preflight; the fixture recipe was not adjusted.
2. Coverage lists every string leaf, including ids and enum values (`/beats/0/id`, `…/emphasis`, `…/kind`), so the uncovered list for `lbc-story` (38) overstates real copy.
3. `undo` leaves an asset file added by the undone edit in the working copy (`assets/tutorlog-logo.png`), unreferenced by the restored manifest; source files and hashes are restored. Not changed here; separate decision.
4. Pre-existing: `tutorlog-recipe`'s selected final no longer matches a compile of its source (see above).

**Regression.** `core/test/integration/recipe-bindings.test.ts` (9): valid bindings and coverage; mismatch warning→final error; missing path, non-text value and missing profile field; palette after overrides and hex case; duplicate/nested/wildcard/non-pointer/unknown-field/extra-key declarations; legacy recipe without bindings; dry-run values, effective target palette and no mutation; bindings in the trusted hash (removal and change need trust again); switch → blocked → edit → ready → undo ×2 restoring params, profile and `recipe.json`. `brand-profile.test.ts` exact plan expectation extended with the two new empty fields. E2E `cli/test/e2e/recipe-brand-switch.test.ts` (fixture recipe and test profiles, no LBC media): create → trust → ready with coverage once → final → dry-run → apply → production and render refused with pointer/builds unchanged → edit → ready → undo (blocked) → undo → pixel reuse → stale approval refused.

**Gates** (`work/gate-logs/brand-safe-recipes/`, Node 24.20.0, pnpm 12.3.4, logs through `rtk proxy`): focused 6 files 33/33 (`focused.log`); `pnpm verify` exit 0, Biome 183, unit 282/282, integration 327/327 (`verify.log`); one serial `pnpm test:e2e --reporter=verbose` (`e2e.log`, SHA-256 `ee325819…`; verify log `f9e2ef30…`), `caffeinate`, no concurrent render: exit 0, 12/12 files, 22/22 tests (the 21 earlier tests plus `recipe-brand-switch`), 918.33 s, `owner-flow` included. No failure to classify; earlier flake/repeatability caveats are unchanged, not closed by this pass.

**Supervisor review — 2026-10-06: CHANGES_REQUESTED.** `uncheckedParams` built pointers as `${pointer}/${key}` without escaping, so an object key containing `/` (for example a literal `"brand/name"`) produced the same pointer as the bound nested path `/brand/name` and was silently treated as bound, dropping it from coverage; keys with `~` were reported unescaped. Requested: escape object-key segments as JSON pointers (`~` → `~0`, then `/` → `~1`) without widening the bindings schema, rejecting old params or rewriting copy; regressions for a literal `brand/name`, a nested `cta/url`, a `~` key, true nested bound paths and arrays, failing on the old code; a public probe; status sync; freeze 3.

**Correction pass — 2026-10-06 (implementer): READY_FOR_REVIEW.**
- Change: `core/src/profile/brand-bindings.ts` adds `pointerSegment` (RFC 6901 escaping) and uses it for object keys in `uncheckedParams`. Bindings schema (pointer segments `[A-Za-z0-9_-]` only), lookup, comparison, production escalation, executor and cache identity unchanged; old params still load.
- Regression: `recipe-bindings.test.ts` "escapes object keys in uncovered params…" asserts `/brand~1name`, `/brand/cta~1url`, `/a~0b`, `/x~01y` (order `~` before `/`), `/points/0`, `/points/1` are reported; the true bound paths `/brand/name`, `/brand/cta/label`, `/brand/cta/url`, `/colors/rule` are not; final errors stay empty, and a real mismatch at `/brand/name` still blocks. On the unpatched code it fails (`correction/regression-red-old-impl.log`: the list lacked `/brand~1name` and `/brand/cta~1url` and had `/a~b`, `/x~1y`); after the patch 10/10 (`regression-green.log`).
- Probe (freeze 3, `work/brand-safe-recipes/probe-escape`, public CLI, no render; `logs/corr-probe*.json`): params with literal keys `"brand/name": "TutorLog"`, `brand["cta/url"]: "tutorlog.id"` and `"a~b"`; `validate --stage production` ready, `data.brand.recipes[0].unchecked` includes `/brand/cta~1url`, `/brand~1name`, `/a~0b`, the four real bindings still match; after one `edit` making the real `/brand/name` "TutorLog", production refuses `RECIPE_BINDING_MISMATCH` at `/scenes/0/visual/params/brand/name` only. The coverage message samples the first five paths; the full list is in `data.brand.recipes`.
- Freeze 3 (`work/brand-safe-recipes/freeze/freeze-3.json`, 2026-10-06T00:03Z), compared with freeze 2: code diff and the core dist tree changed; cli and renderer dist, skill, both profiles, recipe `brand-note` (`2061ec14…`, same scoped trust), media and runtime unchanged. Freeze 1/2 files and attempt evidence are untouched. `freeze-3-check.json`: all true after the gates.
- Gates on freeze 3 (`work/gate-logs/brand-safe-recipes/correction/`): focused 6 files 34/34 (`focused.log`, `207671b0…`); `pnpm verify` exit 0, Biome 183, unit 282/282, integration 328/328 (`verify.log`, `0a6796fe…`); E2E `recipe-brand-switch` 1/1, 36.9 s (`e2e-recipe-brand-switch.log`, `e392e9a7…`).
- Evidence limits: the full serial E2E (22/22) and the A–E render trial ran on freeze 2, not on this candidate; they were not repeated because the change only affects the uncovered-param list in diagnostics (no binding, blocking, render or key path). Coverage noise (ids/enums), recipe text fit, the asset left after undo and the old `tutorlog-recipe` key mismatch remain recorded, not handled here.

**Supervisor verdict — 2026-10-06: TECHNICALLY_READY on the freeze-3 candidate.** Supervisor checks: focused tests 34/34, fingerprint audit of the candidate against freeze 3, and the public-CLI escaping probe. Fatih authorized commit, branch push and a PR to `main`; merge is not authorized. Before staging, the candidate was rechecked: `origin/main` still `ef88eb7`, and code diff, new test files, dist trees, skill, profiles, recipe, media and runtime all equal freeze 3. Documentation changed afterwards only, so no suite or render was rerun.

**Batch E integration closure — 2026-10-06: CLOSED / INTEGRATED.** Supervisor signed off PR #30 at head `fc81619cb921b3640cdea249dfabc8ca981034a6`; Fatih authorized the squash-merge. Rechecked before merging: head unchanged, `main` still `ef88eb7`. Squash-merged with `--match-head-commit` as `cfa244ef4e3f22b69b0ceca12f3134cfbcb25f7f` (parent `ef88eb7`, explicit subject/body, no agent identity or trailer); squash tree `29d0a661829bba52dde3062b6034aefb00bf7278` equals the reviewed head tree. Local `main` fast-forwarded to `cfa244e` with the unrelated `AGENTS.md` change kept (no stash/discard); `brand-safe-recipes` deleted locally and on origin after its target was confirmed as `fc81619`. `work/` (trial projects, freezes 1–3, attempt evidence, gate logs), the Miss Ayu worktree and `stash@{0}` are untouched. No suite or render was rerun. This note is a local documentation change for the next authorized PR; no administrative PR.

**Coverage still open.** Recipe text other than declared params (headlines, labels, colours not mapped to a palette slot) is not brand-checked; no automatic check of claims or copy truth; no text-fit/collision/contrast checks inside recipes; recipe trust remains owner acceptance of local code, not a sandbox; logo assets in recipe params are checked through the existing asset bindings only.

**Effort (recorded).** Branch and contract work 2026-10-05 23:20–23:26 local, interrupted (app closed, trust question declined); tests and development checks 2026-10-06 01:24–01:35; waiting for trust until 06:20; dev render, freeze 1 and attempt 1 06:20–06:22 (trial 58 s); patch, freeze 2 and trial 06:24:46–06:25:42 (56 s); gates from 06:27. The whole A–D sequence, including two fresh 1080 renders and one reused preview, took 56 s. Owner time: one trust decision (and one declined question). Agent tokens/cost unknown; no provider calls.


### Batch F — recipe text fit after revision and profile switch (authorized 2026-10-06)

**Status.** CLOSED / INTEGRATED via PR #31 (`e008490`, 2026-10-06); see the closure note below. Originally: Fatih authorized Batch F to READY_FOR_REVIEW with the supervisor's contract corrections (below), without Git permission at the time. Branch `recipe-text-fit` from main `cfa244e`, carrying the local Batch E closure. Trial copies under `work/text-fit-recipes/`. Motivation: in the Batch E trial, TutorLog's wider display face clipped the headline line "Belajar sedikit," to "Belajar" (freeze-2 preview `b86742cb4421-31b3e2e0-846`), and nothing reported it: today's text-fit preflight (`TEXT_OVERFLOW`, `MIN_FONT_SIZE_VIOLATION`) measures declarative text layers only.

**How the existing check works (reused, not replaced).** The renderer bundle runs a visual preflight in `calculateMetadata` after the profile fonts are loaded and before any frame renders; text is measured with `@remotion/layout-utils` `measureText` in the real face, and a failing preflight refuses the preview or render with issues and no published build. Core (`validate`) runs in Node without fonts, so it cannot measure text.

**Contract (opt-in, per recipe; corrected 2026-10-06).**
1. `recipe.json` may declare `textSlots: [{ "id", "param", "role", "fontSize", "lineHeight", "letterSpacing"?, "fontWeight"?, "box": { "width", "height" }, "maxLines", "wrap" }]`. Units: every length is a CSS pixel in the 1080×1920 design frame. `lineHeight` is a pixel distance between baselines (CSS `line-height: <n>px`), not a multiplier; `letterSpacing` is a finite pixel value and may be zero or negative (CSS `letter-spacing: <n>px`, default 0). `role` is one of `display`, `heading`, `body`, `label`. `maxLines` is an integer ≥ 1. `wrap` is `"words"` or `"none"`.
2. `param` is an explicit JSON pointer (Batch E rules: `[A-Za-z0-9_-]` segments, no wildcard or expression) to a string, or to an array whose elements are each one independent slot instance (for example `/headline`, one line per element). Array elements are checked one by one; no claim is made about their combined height. Duplicate ids, a param declared twice or inside another slot's param, and invalid numbers make the manifest invalid (`RECIPE_MANIFEST_INVALID`).
3. Resolved style, one source: core resolves each slot against the profile after valid overrides. Family: the role's `fontFamily`, else `displayFontFamily` for `display`, else the profile `fontFamily` (the renderer's text-layer rule). Weight: the slot's `fontWeight`, else the role's `fontWeight`, else the profile `headingWeight` for `display`/`heading` and `bodyWeight` for `body`/`label`. The compiled recipe visual carries the resolved style (`fontFamily`, `fontWeight`, `fontSize`, `lineHeight`, `letterSpacing`, `width`, `height`, `maxLines`, `wrap`) and each instance (pointer, text); the renderer passes `props.textSlots[id]` to the recipe, and the preflight measures exactly those values.
4. Whitespace and line boxes (corrected after supervisor review, rules version `naraframe-text-fit/2`): `wrap: "words"` means CSS `white-space: pre-line`; `"none"` means `pre`. `\n` and `\r\n` are one forced break each; a segment followed by a break is a line box even when empty, the last segment only when it paints, so a trailing break adds no line, an internal blank line counts, and empty text has no line box. In `pre-line` only spaces and tabs (and a lone CR, treated as a space) collapse and drop at line edges; NBSP, ideographic space and other non-collapsible characters keep their width; lines wrap only at spaces (other break opportunities are not modelled, which can only refuse conservatively). In `pre` nothing collapses or wraps; each line is measured whole, a lone CR as a space (Chrome draws it narrower, so this side is conservative too). The recipe must use the same `white-space` for the slot; the preflight follows it.
5. Overflow: more lines than `maxLines`, lines × `lineHeight` taller than the box (0.5 px tolerance), or a line/word wider than the box. Measured with `@remotion/layout-utils` `measureText` (a DOM measurement with the same CSS properties) in the loaded face, in design pixels, so 540 and 1080 previews give the same verdict. No shrink, auto-layout, re-flow into other slots or copy rewriting.
6. Diagnostics: `RECIPE_TEXT_OVERFLOW` (error, preview/render) at `/scenes/<i>/visual/params<pointer>[/<index>]`, entity = slot id, naming scene, recipe, slot, text, face, size, lines and widths against the box, with correction steps. Compile/validate: `RECIPE_TEXT_SLOT_PATH_MISSING` and `RECIPE_TEXT_SLOT_TYPE_INVALID` (warning in drafts, error at production/final) at the same kind of path. `FONT_NOT_LOADED` as today.
7. When it runs: `preview` (draft 540 and native 1080) and `render` measure in the renderer preflight and refuse before any frame. `validate --stage plan|production` cannot measure (no fonts in Node): it checks declarations and reports `RECIPE_TEXT_FIT_COVERAGE` (info) per recipe scene: which slots and instances are measured, that measurement happens at preview/render, that other recipe text is not measured, and that a trusted recipe must draw the slot text with `props.textSlots` (NaraFrame cannot verify its code does). Recipes without `textSlots` keep working and report "text fit not checked".
8. Identity: `textSlots` lives in the hashed `recipe.json` (trust again on change; undo restores). The compiled fields (`textSlots` and the rules version `textFitRules`) are present only when slots are declared, so legacy recipe keys stay unchanged; copy edits, profile switches and a new rules version change the keys of slot recipes and therefore approvals. Preview reuse skips the preflight, so the rules version in the key is what stops a build checked under older rules from being reused. Executor/engine bump: none unless analysis shows existing builds could be reused for different pixels; the analysis is recorded in the handoff.

**Example recipe correction.** `brand-note` 0.2.0 (copy in `work/brand-safe-recipes`, new hash, needs Fatih's scoped trust): declares slots for `/headline` (each line: role display, 104 px, line height 112, letter spacing −2, box 888×118, 1 line), `/brand/name` and `/brand/cta/label`, and draws them from `props.textSlots`. Choreography unchanged otherwise. Skill text: how to declare slots, what is and is not measured, and that copy is fixed through `edit`.

**Acceptance (engine evidence).** On a freeze, through the public CLI, on copies under `work/text-fit-recipes/` (also covering `wrap: "none"` with several words, a forced newline, negative letter spacing, and the same verdict at 540 and 1080):
1. Detects the known case: the Batch E trial content on TutorLog ("Belajar sedikit," in the display face) → `preview --resolution 1080` refused with `RECIPE_TEXT_OVERFLOW` at `/scenes/0/visual/params/headline/0`; no build or pointer created.
2. Control: the same content on LBC, and a short TutorLog line, pass; no false positive on the declared brand name and CTA.
3. Re-check: a copy `edit` that lengthens a line under LBC is refused; a profile switch LBC → TutorLog re-measures in the new face and is refused; a targeted copy edit makes it pass.
4. Undo restores source byte-for-byte and the earlier preview is reused; the copy/profile changes make the older approval `APPROVAL_PREVIEW_STALE`; changing a slot declaration changes the recipe hash and needs trust.
5. Output agreement: one native 1080 preview of the passing TutorLog version, plus the existing clipped Batch E preview of the failing input, cropped at the headline slot: the check's verdicts (fit / overflow, line count) match what the frames show.

**Visual judgement (separate).** Fatih or the supervisor look at the 1080 frames for readability and composition; the engine only claims fit inside the declared boxes.

**Regression.** Unit: slot schema and pointer rules (string and array, invalid pointer, unknown role, non-positive numbers, duplicate ids/params). Renderer integration: preflight measures a fitting and an overflowing slot in a loaded test face, honours `maxLines`, height and unbreakable words, reports the right path/entity, and refuses before rendering; legacy recipe without slots unchanged. CLI/E2E (fixture recipe and test fonts, no LBC media): switch → refused → edit → passes → undo → reuse → stale approval; draft and native previews agree.

**Gates.** Focused tests; `pnpm verify`; one serial `pnpm test:e2e` on the final candidate (the renderer preflight boundary changes, so the full suite is proportionate); full logs through `rtk proxy`; no retry-until-green.

**Out of scope.** Auto-rewrite, auto-shrink or auto-layout; collision/contrast for recipes; slots for `lbc-story`/`product-flow`; visual polish; publication; voice; dependencies; repeatability/orphan work.

**Decisions taken.** One batch to READY_FOR_REVIEW; draft previews refuse on overflow like declarative text; array pointers are per element; the corrected `brand-note` hash needs a new scoped trust before the trial (the 0.1.0 trust does not carry over).


#### Batch F handoff — 2026-10-06 (implementer): superseded by the correction pass below (first full E2E red 21/23, classified)

Branch `recipe-text-fit` from main `cfa244e` (uncommitted when this handoff was written; integrated later via PR #31); carries the Batch E closure. `AGENTS.md`, the Miss Ayu worktree, `stash@{0}`, earlier freezes, finals and evidence are untouched. An untracked root `README.md` (26.5 KB, created 19:21 local during the trial, not by this batch's commands) is left as found and is not part of the batch.

**Implementation.**
- Core: `schema/recipe.ts` (`RecipeTextSlotSchema`, manifest `textSlots` with duplicate/nested checks), `recipe/load-recipes.ts` (slots only when declared), new `recipe/text-slots.ts` (style resolution, per-element instances, `RECIPE_TEXT_SLOT_PATH_MISSING` / `RECIPE_TEXT_SLOT_TYPE_INVALID`, `RECIPE_TEXT_FIT_COVERAGE`), new `recipe/param-pointer.ts` (the Batch E pointer helpers moved here and shared), `schema/compiled.ts` (`CompiledTextSlotSchema`, optional `textSlots` on the recipe visual), `compiler/compile-draft.ts`, `compiler/production.ts` (slot path/type errors at production), `index.ts` exports.
- Renderer: new `remotion/recipe-text-fit.ts` (`measureSlotText` with `@remotion/layout-utils` `measureText`: words = pre-line with collapsed spaces and greedy wrap, none = pre with whole lines; `RECIPE_TEXT_OVERFLOW`; `FONT_NOT_LOADED`), `visual-preflight.ts` (runs it for every recipe scene before frames), `draft-video.tsx` and `recipe-registry.ts` (`props.textSlots` by slot id; empty for recipes without slots).
- Skill: recipe text fit, units, whitespace, weight precedence, when it runs and what is not measured.
- Executor/engine identity: unchanged (`naraframe-recipe/2`). Analysis: a recipe without slots compiles to the same visual (no `textSlots` field), so its keys are unchanged and its earlier builds stay valid (the extra empty prop is ignored); a recipe with slots carries resolved styles and texts in the compiled visual, so copy edits, profile switches and slot changes produce new keys and never reuse an earlier build. The preflight decides whether a build is published, not its pixels. Read-only check with the new code: `lbc-01`, `lbc-0N-v2`, `lbc-p3`, `tutorlog-music`, `tutorlog-silent` keep source revisions and final keys; preview keys of `note-2` (1080), `brand-safe-recipes/dev` (540) and `lbc-01-v2` (1080) are unchanged and compile without `textSlots`; `tutorlog-recipe` keeps the mismatch recorded before Batch E (`work/gate-logs/text-fit-recipes/identity-check*.json`).

**Trust and freezes.** Recipe `brand-note` 0.2.0 (copy in `work/text-fit-recipes/recipes/brand-note`: slots `headline` per line, `point` per element, `name`, `cta` with `wrap: none`; slot text drawn from `props.textSlots`; choreography unchanged) has code hash `273e0bd7563981df281f33b597bf306fed88afc243ceb2d311ccfff950bdddfc`; Fatih authorized trust of that hash for dev/trial projects under `work/text-fit-recipes/` only (the 0.1.0 trust was not reused). Freeze 1 (`freeze/freeze.json`, 2026-10-06T12:16Z) after the dev project showed the LBC pass and the TutorLog overflow and after the skill update: code diff, dist trees, skill, copied LBC 0.3.0/TutorLog 1.1.0 profiles, recipe, logos, runtime. Freeze 2 (`freeze/freeze-2.json`, 12:35Z, final candidate) differs only by the added tests and the `text-card` fixture; tracked diff, new source files, dist, skill, profiles, recipe, media and runtime are identical, so the trial ran this candidate's runtime. Fingerprints (freeze 2): code diff `839d6fb8aae2…`; dist cli `4a64f97f8c0a…`, core `df807f626ddc…`, renderer `41c6fb60fa11…`; skill `1d01cea14143…`; `recipe.json` `907f4f0d2b61…`, `index.tsx` `f5426b095a9a…`.

**Trial (freeze 1, `work/text-fit-recipes/trial`, public CLI only; logs `logs/f1-*.json`, summary `logs/f1-trial.json`; no final, no approval).**

| Check | Result |
|---|---|
| A. LBC content | `validate --stage production` ready, coverage names `headline (2), point (3), name (1), cta (1)`; `preview --draft` `e60110c00c08-2915afb8-f5c` and `--resolution 1080` `3f5e2a1fbc94-a0cc147d-7cf` pass (negative letter spacing −2 on the headline; multi-word CTA "Konsultasi gratis melalui situs LBC" with `wrap: none` fits) |
| B. Copy revision | edit `/headline/0` → "Belajar sedikit demi sedikit,": 540 and 1080 refused, `RECIPE_TEXT_OVERFLOW` at `/scenes/0/visual/params/headline/0` ("needs 2 lines; the slot allows 1", Fraunces 600 104px); pointer unchanged; undo restores every source file; 1080 preview reuses A (`3f5e2a1fbc94-9675cdff-2ad` from `…a0cc147d-7cf`) |
| C. Profile switch (TutorLog case) | `profile apply` TutorLog + identity edit: `validate --stage production` ready (it cannot measure); 540 and 1080 refused with the same diagnostic for "Belajar sedikit," in Courier Prime 700 104px; pointer unchanged |
| D. Targeted correction | headline ["Belajar rutin,", "tiap hari."]: 540 `3c5c055429d7-b671bb58-a1a` and native 1080 `1d3e38359e24-1913c7e4-4ea` pass |
| E. `wrap: none`, several words | "Mulai gratis hari ini tanpa kartu kredit" fits (frame: about 730 px of the 776 px box; kept as a control, preview `febce926d4c6-8c8ac870-377`); "Mulai gratis hari ini tanpa kartu kredit apa pun" refused at 540 and 1080 ("has a line 894px wide; the box is 776px"); undo |
| F. Newline | `/points/1` "Catat\nyang belum paham" refused at 540 (2 lines, 1 allowed) at `/scenes/0/visual/params/points/1`; undo restores the D sources |
| G. Reuse and approval | 1080 preview reuses D (`1d3e38359e24-43f385c0-1c8`); `render --approve-preview` of the LBC preview → `APPROVAL_PREVIEW_STALE`; no final |

**Output agreement (engine verdict versus frames).** `review/f1-old-clipped-vs-D-fixed.png`: left, the Batch E 0.1.0 frame with the same headline metrics (104/112/−2, 888×118 box) showing "Belajar sedikit," clipped to "Belajar", which is exactly the input C now refuses; right, the passing native 1080 D frame with both lines whole. E's frame confirms the fitting multi-word CTA at about 730 px against the 776 px box. Visual judgement of the frames (readability, composition) is separate and is not claimed by the engine.

**Regression.** Core `recipe-text-slots.test.ts` (7): pixel line height, zero/negative spacing accepted; duplicate id/param, nested param, wildcard/non-pointer, unknown role, zero/infinite line height, NaN spacing, fractional maxLines, unknown wrap, zero box, extra key refused; weight slot → role → profile and family rule; per-string and per-element instances; missing path and non-text element/object (warning in draft, error at production, valid elements still measured); legacy recipe without slots compiles without the field and reports "not checked"; copy edit changes keys, slot change or removal changes the trusted hash. Renderer `recipe-text-fit.test.ts` (10): words wrap and maxLines, height overflow, unbreakable word, pre-line space collapse and newline, pre whole-line width with kept spaces and newline, negative spacing, preflight path/entity/message, same issues for 540 and 1080 drafts, unloaded face, legacy scene unmeasured, slot family equals the text-layer family rule. E2E `recipe-text-fit.test.ts` (fixture `text-card`, system faces Arial/Courier New, no LBC media): fits → switch refused at 540 and 1080 with pointer unchanged → edit passes → undo refused → undo reuses the first build → stale approval refused.

**Gates** (`work/gate-logs/text-fit-recipes/`, Node 24.20.0, pnpm 12.3.4, full logs through `rtk proxy`): focused 8 files 70/70 (`focused.log`); `pnpm verify` exit 0, Biome 190, unit 292/292, integration 335/335 (`verify.log`); one serial `pnpm test:e2e --reporter=verbose` (`e2e.log`, SHA-256 `c376ba082dd1…`; verify `cce1073581cb…`, focused `833345f4bbb4…`), `caffeinate`, no concurrent render, started at load 7.3 and ended at 6.3: **exit 1, 21/23 tests, 11/13 files, 1003 s.** The new `recipe-text-fit` E2E, `recipe-brand-switch`, `recipe-production`, audio, preview, font, reuse, reference and soundtrack files passed.
  - `owner-flow`: the repeated-build middle frame hashed `0b7a7a30…` instead of `d243f8f4…`. `0b7a7a30…` is the variant already recorded for this sampled frame in the Batch A and Batch B gates (open NF-AC-06 repeatability caveat); the Krakatau sample has no recipe scene, so the new slot check returns nothing for it. Classified as the old caveat, by that recorded hash.
  - `interruption-recovery`: one `preview --draft` of the 540-frame Krakatau sample exceeded the test's 180 s limit (the harness then stopped the survivor; no process was left afterwards). This timeout was not seen in the P5 or Batch E gates (about 107 s there). Diagnostic, not a gate rerun (`diag-interruption-isolated.log`): the same file alone on the same candidate passed 4/4, its main test in 108 s, at load 3.8–4.5. Recorded as a newly observed timeout that did not reproduce in isolation; suspected resource contention during the full run, not proven; it belongs with the open slow/timeout and process-reliability findings (F-A2, issue #16). The full suite was not rerun.

**Evidence limits.** The engine proves fit only for declared slots, in the measured face and box, with the whitespace and units above; it cannot prove that recipe code draws slot text with `props.textSlots` (the example recipe and the fixture do; frames were checked for the trial). `validate` never measures. Array elements are measured one by one, not their combined height. No shrink, auto-layout, copy rewriting, collision or contrast check inside recipes. `lbc-story` and `product-flow` declare no slots and stay unchecked. The measurement uses greedy word wrapping like the existing text-layer preflight; hyphenation, kerning-dependent line breaks or non-space break opportunities (CJK, soft hyphens) are not modelled.

**Effort (recorded).** Branch 19:01 local; contract and implementation to the dev check 19:01–19:12; trust given 19:14; freeze 1 19:16; trial 19:16:39–19:19:30, E2 shortly after; regressions and freeze 2 by 19:35; gates from 19:36. Owner time: one authorization and one trust decision. Agent tokens/cost unknown; no provider calls.

#### Supervisor review — 2026-10-06: CHANGES_REQUESTED (one consolidated whitespace correction)

**Run independently.** Six focused files passed 67/67 (core slots, bindings, recipe-project, brand-profile; renderer slots and visual-preflight). HEAD and origin/main are both `cfa244ef…`; the tracked packages/skill diff hash, all eight new code/test/fixture hashes and the skill hash match freeze 2. The focused/verify/E2E log hashes match the handoff. A local Chrome DOM probe runs the actual candidate `measureSlotText` and installed Remotion 4.0.521 `measureText` alongside recipe-style CSS, without rendering video: `work/text-fit-recipes/supervisor/whitespace-probe.mjs` and `whitespace-results.json`.

**P2-F1 — false overflow from terminal newlines and empty text** (`recipe-text-fit.ts:35–48,69–72`). With Arial 700 at 100px, lineHeight 110px, a 420×110 box and maxLines 1, `"abc\n"` is refused as two lines in both wrap modes; the browser lays it out at 110px (one line). `"abc\n\n"` is counted as three instead of the browser's two. Empty text paints no line but is counted as one, so a box shorter than lineHeight can be falsely refused. Match the CSS line-box behavior, keeping genuine internal blank lines. Add focused regressions and browser-backed evidence for both `pre-line` and `pre`, including empty text and one/two terminal newlines.

**P2-F2 — false fit after removing non-collapsible whitespace** (`recipe-text-fit.ts:43–45`). In `words` mode, `.trim()` strips edge NBSP (U+00A0) although `pre-line` preserves it. `"\u00a0\u00a0WWWW\u00a0\u00a0"` is accepted as 377.55px wide, while Chrome measures 488.67px and scrollWidth 489 in a 420px box. This can publish clipped text. Normalize only CSS-collapsible whitespace, preserving NBSP and other non-collapsible characters; regression must include NBSP at both edges and an ordinary-space control. Do not fix by rewriting source copy or expanding slots.

**Read/audited, not rerun.** Implementer's verify log is exit 0 (292 unit / 335 integration); full E2E log is exit 1, 21/23. `owner-flow` fails at the middle-frame hash with the historically recorded `0b7a7a30…` variant; this non-recipe scene returns before the new check. Interruption timeout occurs in the baseline preview (`interruption-recovery.test.ts:329`), before sending SIGINT, not in the interrupted cleanup assertion. Its isolated file passes 4/4 on the same candidate; this supports a non-reproduced reliability caveat, not a proven contention cause. Neither result makes the full gate green. Audited trial JSON and viewed the old-clipped/fixed comparison; no claim of universal visual acceptance. No full verify/E2E, trial replay, final export or bite check run by the supervisor.

**Disposition.** No additional repeatability investigation or full-suite rerun just to obtain green is required now. The two real text-fit defects block technical sign-off and Git recommendation. Correct both together, add browser/CLI whitespace checks and focused regressions, rebuild and record a new freeze, then run verify and the recipe E2E; run the scheduled full serial gate once on the final candidate, without retries or weakened assertions. Review whether successful slot-bearing builds created before the correction can bypass its guard through reuse; use scoped invalidation/revalidation if necessary while preserving legacy no-slot identities. Keep prior failed evidence and the two reliability caveats open. Return one consolidated READY_FOR_REVIEW handoff; no commit, push, PR, merge, new recipe/art-direction scope or unrelated changes. README.md and AGENTS.md remain outside this batch.


#### Batch F correction pass — 2026-10-06 (implementer): READY_FOR_REVIEW

**Scope.** The supervisor's P2-F1 (false overflow from terminal newlines and empty text) and P2-F2 (false fit after stripping non-collapsible whitespace), plus the review of preview reuse. No copy change or slot enlargement; recipe `brand-note` 0.2.0 unchanged (same hash `273e0bd7…`, same scoped trust). Earlier freezes, trial projects, builds, logs and the supervisor's probe files are kept unchanged; the untracked root `README.md`, `AGENTS.md`, the Miss Ayu worktree and `stash@{0}` are untouched.

**Defects reproduced first through the public CLI (freeze-2 dist, new project `work/text-fit-recipes/ws-check`, `logs/ws-old*.json`).** `"Belajar sedikit,\n"` in the LBC headline was refused at 540 ("needs 2 lines") although Chrome lays it out as one line; 30 NBSP before "Belajar rutin," was accepted and published at 540 (`4684359106db-b6f72bc6-b74`) and 1080 (`4a4b04d2d6fa-abc60862-540`), and the 1080 frame shows the line wrapped and "rutin," clipped by the slot mask (`review/ws-old-nbsp30-1080-headline.png`). (10 NBSP on both sides, `f2a3b3383d1d-0a0a887a-f94`, really fits in Fraunces and stays a pass.)

**Fix.** `renderer-remotion/src/remotion/recipe-text-fit.ts`: segments split at `\r\n`/`\n`; a segment followed by a forced break is a line box even when empty, the last only when it paints; empty text has none; in `pre-line` only `[ \t\r]` collapse (NBSP and other spaces kept, so `"\u00a0\u00a0WWWW\u00a0\u00a0"` measures its real width); in `pre` lines are measured whole with a lone CR as a space.

**Reuse.** `findReusablePreview` matches the assembly key, scope, checked frames and runtime, and a reused preview is published without running the renderer, so its preflight is skipped: a slot build accepted by the old rules (such as the 30-NBSP builds) would have been reused for the same source after the fix. Scoped invalidation: the compiled recipe visual carries `textFitRules: "naraframe-text-fit/2"` only when the recipe declares slots (`core/src/schema/compiled.ts`, `compiler/compile-draft.ts`); it is part of the scene key. Evidence: the 30-NBSP source now keys `536a7f5c7034…` (540) / `39fb09334b95…` (1080) instead of the old `4684359106db…` / `4a4b04d2d6fa…`, and both previews are refused with no reuse; the true-fit 10-NBSP state is re-rendered (`43439cf06380-162c475f-495`, `reusedFromBuildId` null) instead of reusing `f2a3b3383d1d…`; the Batch F trial project's current preview no longer matches its compile (invalidated as intended). Legacy recipes without slots and declarative projects keep every key: final keys of `lbc-01`, `lbc-0N-v2`, `lbc-p3`, `tutorlog-music`, `tutorlog-silent` and preview keys of `note-2`, `brand-safe-recipes/dev`, `lbc-01-v2` are unchanged, with no `textSlots` or `textFitRules` (`work/gate-logs/text-fit-recipes/correction/identity-check*.json`; `tutorlog-recipe` keeps its pre-Batch-E mismatch). No executor or engine bump.

**CLI after the fix (freeze-3 dist, `logs/ws-new.json`).** 30 NBSP: `preview --draft` and `--resolution 1080` refused with `RECIPE_TEXT_OVERFLOW` at `/scenes/0/visual/params/headline/0` ("needs 2 lines; the slot allows 1"), preview pointer unchanged, no reuse. Undo to 10+10 NBSP: native 1080 passes (`43439cf06380-162c475f-495`). Undo to the trailing-newline headline: 540 `a3da611508d5-f165f6da-2e1` and 1080 `5a8397827ace-74e172b3-972` pass. No final, no approval.

**Browser evidence (real fonts and styles).** `work/text-fit-recipes/probe/dom-probe.mjs` (adapted from the supervisor's probe, which is unchanged) runs the candidate `measureSlotText` and the installed Remotion 4.0.521 `measureText` in Chrome 154.0.8037.98 next to a div styled exactly like a slot (font, weight, size, px line height, px letter spacing, width, white-space), with the profile faces loaded as `FontFace` (Fraunces 600, Space Grotesk 700, Courier Prime 700/400, TutorSerif 400) and Arial. Verdict = overflow when the div is taller than the box or wider than it. Old code: 45 cases, 9 disagreements (`dom-probe-old-code.json`; trailing newline, lone `\n`, NBSP and U+3000 edges, 30 NBSP in Fraunces). New code: 51 cases (adding CR cases in a narrow box), 0 disagreements (`dom-probe-new-code.json`), covering both modes, empty text, spaces only, CR, CR LF, tab, NBSP, U+3000, internal blank lines, and the trial strings (LBC/TutorLog headline, TutorLog CTA 730 px fit and 893 px overflow, newline point). The supervisor's own probe on the new code agrees on all 16 cases (`probe/supervisor-probe-on-new-code.json`).

**Regression.** Renderer `recipe-text-fit.test.ts` gains five tests (terminal newline not a line in both modes; internal blank lines kept; empty text has no line even in a box shorter than a line, spaces-only differs between pre-line and pre; CR LF one break and lone CR as a space; NBSP edges counted with an ordinary-space control, U+3000 kept, tabs collapsed). Four fail on the unpatched code (`correction/regression-red-old-code.log`; the internal-blank-line test is the control that already passed) and all 15 pass after the fix (`regression-green.log`). Core `recipe-text-slots.test.ts` asserts the rules marker on slot visuals and its absence on recipes without slots.

**Freeze 3** (`freeze/freeze-3.json`, 2026-10-06T13:20Z), compared with freeze 2: code diff, the three dist trees and the skill changed; profiles, recipe, media and runtime unchanged. Fingerprints: code diff `7d72c6a2dae9…`, skill `0b7d8a757993…`, recipe `273e0bd7…`. `freeze-3-check.json`: all true after the CLI checks and gates.

**Gates on freeze 3** (`work/gate-logs/text-fit-recipes/correction/`): focused 8 files 75/75 (`focused.log`); `pnpm verify` exit 0, Biome 190, unit 297/297, integration 335/335 (`verify.log`); `recipe-text-fit` E2E 1/1, 46 s (`e2e-recipe-text-fit.log`); one serial full `pnpm test:e2e --reporter=verbose` (`e2e.log`, SHA-256 `9a3352dfc670…`), `caffeinate`, no concurrent render, load about 6–9: **exit 0, 13/13 files, 23/23 tests, 993 s**, including `owner-flow` (144 s) and `interruption-recovery` (108 s). Log hashes: focused `88621ba55bf5…`, verify `43106e09c9fc…`, recipe E2E `20859a443e20…`, red `c06d7b56b218…`, green `777780f12b2f…`. One green run does not close the owner-flow repeatability caveat or the earlier interruption timeout; both stay open as reliability caveats, separate from the two text-fit defects fixed here.

**Evidence limits.** The rules model CSS line boxes and collapsing for spaces and tabs; non-space break opportunities (U+3000, CJK, soft hyphen, hyphenation) and a lone CR's exact width are not modelled and can only cause conservative refusals. The diagnostic message shows the text as written, so NBSP looks like spaces in it. Earlier limits stand: declared slots only, recipe code must draw them with `props.textSlots`, validate does not measure, no shrink/collision/contrast. The two reliability caveats from the first full run (owner-flow repeatability variant, interruption-recovery timeout) stay open.

#### Supervisor correction review — 2026-10-06: TECHNICALLY_READY on freeze 3

**Independent checks.** Six focused files passed 72/72 (core slots, bindings, recipe-project and brand-profile; renderer slots and visual-preflight). Reran the unchanged supervisor Chrome DOM probe against the corrected source and installed Remotion measurement: 16/16 overflow verdicts agree with CSS; `abc` followed by one terminal newline is one line in both modes, and the NBSP probe measures 488.67px and correctly refuses a 420px box. Results saved separately as `work/text-fit-recipes/supervisor/whitespace-results-correction-review.json`; the earlier probe/evidence is unchanged. HEAD and origin/main still `cfa244ef…`. The tracked packages/skill diff, all eight new source/test/fixture hashes and SKILL.md match freeze 3. Audited the code and tests for the slot-only rules marker: it is part of the compiled scene visual and therefore render keys, while absent on legacy no-slot recipes. No remaining blocker in P2-F1/P2-F2 or the scoped reuse correction.

**Evidence audited, not rerun.** Log hashes match the correction handoff: verify `43106e09…` records 297 unit / 335 integration and exit 0; recipe E2E `20859a44…` is 1/1; serial full E2E `9a3352df…` is 23/23, 13 files, exit 0. Red regression log `c06d7b56…` records four failures on old code, green log `777780f1…` records 15/15. Read the implementer's real-font DOM probe and its 51-case output, public-CLI `ws-new.json`, legacy key audit and old/new slot keys: overflow refuses at 540/1080 without publishing, true-fit content rerenders under the new key, and terminal-newline controls pass. Full verify/E2E, bite checks, CLI renders and the 51-case probe were not run by the supervisor. Their original red gates remain preserved; one later green run does not close repeatability or the earlier interruption timeout.

**Git recommendation.** Fatih may authorize commit, branch push and a PR for this unchanged freeze-3 candidate plus the handoff. Use explicit task paths, include all new source/test/fixture files, and exclude README.md, AGENTS.md and work/. Carry the local Batch E closure with docs/plan.md. No further suite/render is needed solely for this review-note addition if fingerprints still match; recheck base and candidate before staging. PR description must separate supervisor-run checks from implementer logs and retain declared-slot/trusted-code/layout/reliability limits. Merge requires its own approval after exact-head integration review. No Git operation or next task was performed by this review.

**Git authorization — 2026-10-06.** Fatih authorized commit, push of `recipe-text-fit` and a PR to `main`; merge is not authorized. Before staging, `origin/main` was still `cfa244e` and `freeze-3-check` was all true (code diff, new source/test/fixture files, dist, skill, profiles, recipe, media, runtime). Only documentation changed after the review, so no suite or render was rerun.

#### Supervisor integration review — 2026-10-06: TECHNICALLY_READY FOR MERGE

Reviewed live PR #31 at exact head `262aff45929a501e4441b34846ac9a7f1c992e43`, base `cfa244ef4e3f22b69b0ceca12f3134cfbcb25f7f`, tree `c533f200230af18402e3a09ffa00270ae1369d5f`. GitHub reports OPEN, non-draft, MERGEABLE/CLEAN, no checks. Remote main and recipe-text-fit refs match; local HEAD and origin/recipe-text-fit match the head. Exactly 20 task files, no README.md, AGENTS.md or work/; author Fatih and commit message has no agent identity/trailer. The existing tracked code/skill diff hash is `7d72c6a2dae9…`, all eight new source/test/fixture hashes match freeze 3, and SKILL.md matches `0b7d8a757993…`. No task-path working-tree delta; `git diff --check` passes. PR body accurately separates earlier supervisor-run 72/72 focused and DOM 16/16 from implementer gates and trial evidence. No suite, render or DOM probe rerun in this integration review.

No new technical blocker. Minor documentation status drift: current summaries still say uncommitted/no Git permission, and Current step says the Batch E closure stays local, although the later Git authorization entry and this commit supersede those snapshots. Sync these summaries with the integration closure; this does not require another test/render or a separate administrative PR. Sign-off applies to this exact head, not a changed implementation. Merge still requires Fatih's separate authorization; use an exact-head guard. Keep declared-slot/trusted-code limitations and repeatability/interruption caveats open. This review changes only this local handoff note; no commit, push, merge or next task.

**Batch F integration closure — 2026-10-06: CLOSED / INTEGRATED.** Fatih authorized the squash-merge of PR #31 at head `262aff45929a501e4441b34846ac9a7f1c992e43`. Rechecked before merging: head unchanged, base `main` still `cfa244e`, OPEN/MERGEABLE. Squash-merged with `--match-head-commit` as `e008490e983d52e89da4ba6f25426e6467a5b831` (parent `cfa244e`, explicit subject/body, no agent identity or trailer); squash tree `c533f200230af18402e3a09ffa00270ae1369d5f` equals the reviewed head tree. A plain switch to the stale local `main` would have overwritten the local review note in this file, so it was not forced: the local `main` ref was fast-forwarded to `e008490` (ancestor checked; same tree as the branch), then checked out with the working tree unchanged. `recipe-text-fit` was confirmed at `262aff4` and deleted locally and on origin. `AGENTS.md`, the untracked `README.md`, `work/` (trial projects, freezes 1–3, probes, gate logs), the Miss Ayu worktree and `stash@{0}` are untouched. No suite or render was rerun. This note and the supervisor's local reviews are a documentation change for the next authorized PR; no administrative PR. Open: owner-flow repeatability variant and the interruption timeout (reliability caveats), declared-slot/trusted-code limits, non-space break opportunities. Supervisor post-merge confirmation (2026-10-06): CLOSED / INTEGRATED on `e008490`; checkpoint reached. Next is production use of NaraFrame on a new brief from Fatih; backlog stays recorded and is not worked on automatically.

### 0.2 Historical task and contract disposition

| Existing work / constraint | Disposition under this direction |
|---|---|
| M0–M2 delivered technical tasks, F1/F2, M3.1-A | Retain their scoped evidence and regressions; no blanket visual success inferred. |
| M3.1-B/B1 audio correction | Integrated through P0 via PR #24 (`b1875e2`) with reused gates. No restart/rewrite. |
| M3.1-C broad hardening/repeatability | Re-scope into P5 after real production proof; existing open findings remain open. |
| M3.2 mixed-route/visual dogfooding | Superseded for next execution by P1–P4; retain unchecked historical gates, not mark passed. |
| M3.3 metrics/handoff | Production metrics start in P2/P4, consolidated in P5. Packaging/bootstrap only when needed. |
| NF-AC-16/17 and old M2.4 publication/export checkboxes | D-VIS OPEN, deferred case-specific owner review; not an automatic blocker to the new pilot and not a retrospective pass. Population “ke-4” still blocks that Medan publication. |
| Semantic-only/raw-keyframe/project-code exclusions | Superseded by bounded trusted NF-AU-01; existing declarative-v1 projects supported, no arbitrary-code GUI promise. |
| Global mandatory narration and 540-only preview | Revised by NF-TL-06/NF-AC-18, to be implemented in P1; failed old export remains failed. |
| F3/F4, voice/style binding, SYSTEM_ERROR, issue #16, F-A2, contrast/collision limits, M2.4.4 test checkbox without evidence | Keep open; take only concrete production blockers as separate tasks, not silently add backlog to pilot. |
| Word-level timing enforcement | Not currently proven; optional/request-driven, no schema field advertised as implemented enforcement. |
| GUI/cloud/provider marketplace/general 3D/universal primitives | Deferred or stopped as default expansion; revisit only after repeated production needs. |

Historical sections below retain dated checklists/reviews. Labels such as “M3 held”, “M2 not complete”, “silent final excluded” describe their original decision, not current policy. This section and spec 0.7 take precedence.

### 0.3 Claude handoff — next authorized execution

Settled product requirements: profiles drive repeated multi-brand production; all three explicit audio modes; native final/native preview; substantive revisions and safe reuse; actual owner output acceptance. Recommendation: expressive parameterized Remotion on the existing production layer. Open experiment: whether that route matches the TutorLog reference with bounded work, then integrates economically. Do not interpret “recommended” as “visually proven”.

**Status 2026-10-04:** M3.P0 is CLOSED / INTEGRATED via PR #24 (`b1875e2`). The next task is M3.P1a; it starts only after Fatih authorizes it. The original P0 instruction follows for history.

First task is M3.P0, not Medan polish or new primitives. Read live status/AGENTS/spec 0.7/refinement 13/this section and the exact M3.1-B handoff. Preserve candidate hashes and prior gates, unrelated files, failed outputs and existing worktrees/stash. Present checkpoint artifact/evidence and request missing Git authorization; absent that authorization stop without implementation/Git. If authorized, integrate only the approved unchanged audio checkpoint, then stop and report SHA/paths/evidence. P1a and later require the corresponding task authorization, not a wholesale architecture rewrite. Supervisor reviews code/diff/runtime evidence; Fatih decides visual acceptance and route changes. No new parallel plan.

## 1. Global constraints

- MVP output is 9:16. Final rendering defaults to 1080 × 1920 at 30 fps. Preview defaults to 540 × 960 at 30 fps.
- The core package MUST NOT import Remotion. Only the renderer package imports Remotion APIs.
- Declarative-v1 stays supported. Bounded trusted local compositions may use frame keyframes/CSS under NF-AU-01; unapproved arbitrary executable components remain excluded. No renderer-framework or general 3D scope.
- Phrase/utterance timing is required when narration/phrase synchronization is used, not for explicit-duration music/silent projects. Word-level timing is request-driven; current enforcement is unproven and must not be claimed from a profile field alone.
- Updating the source profile MUST NOT silently alter existing projects.
- First operator: Fatih, comfortable with JSON and terminal. Ordinary agent-mediated revisions must be usable without schema knowledge (NF-UX-03). Future GUI may edit declared profile/content/recipe parameters, not necessarily custom code internals. No GUI or novice wizard now.
- No GUI, MCP, cloud publishing, provider SDKs/keys in core/CLI, generic billing service, distributed cache, or frame resume.
- External render-time network is denied in Node and browser; required local loopback is allowed. No implicit browser download.
- Provider operations are sequential initially. Receipts/unknown charges survive undo; reused source audio/images are not disposable cache.
- Safety is implemented with each feature, not postponed to the final milestone.
- Keep discovery/spec/refinement/plan in the four existing documents. Update this file for milestone details and runtime decisions; do not create parallel plans, review files, or empty `examples/` directories.

## 2. Historical delivery sequence and rationale (through M2)

The old Phase 0–9 / 41-task sequence is superseded. It placed CLI and skill late and built many visual components before testing the user flow. The accepted order is:

| Gate | Usable outcome | Main risk being tested |
|---|---|---|
| M0 | One 15–30s visual draft through skill + CLI/core | Can the local runtime and declarative motion loop actually work? |
| M0.9 | LBC draft with reliable typography, masks, layout, and stronger shot continuity | Can declarative output approach direct Remotion without per-project TSX? |
| M0.10 | Initial transition/font growth and visual diagnostics | Can the first monotony complaints be addressed? Counts are not aesthetic proof. |
| M1 | Narrated pilot, caption, budget, edit/undo | Can one spoken section be revised economically and sound natural? |
| M2 | Two independent projects + one profile-switch variant | Do styles, partial preview, recipes, and audio remain coherent? |
| M2.4 | Medan visual benchmark plus a distinct LBC first draft and plain-language revisions | Can expressive declarative output compete visually and transfer to another topic? |
| M3 | Owner dogfooding and release evidence | Is the workflow repeatable and recoverable on the reference setup? |

AR-01 was withdrawn after the original target-user clarification. The new owner-approved approachability requirement is NF-UX-03, not a retroactive revival of the novice-onboarding proposal. AR/VF implementation evidence is retained in `docs/refine-spec.md`; new VS-01–VS-07 findings are accepted-for-spec and await M2.4 execution.

M0 is a draft milestone, not an excuse to count a silent video as narrated-MVP completion. M0.9 is a corrective visual gate, not a retroactive failure of M0's runtime/CLI deliverables. Missing TTS can produce an actionable fallback, but M1 cannot begin until M0.9 passes and cannot pass without a verified Indonesian narration/timing recipe.

### Where this tool competes

NaraFrame uses Remotion as its renderer. Bang Motion is a relevant output/workflow reference: the owner's Medan example combines illustrated objects, camera travel, typography, transitions, and supplied narration. Its public workflow also includes verification and export; neither agent operation nor basic validation/export is unique to NaraFrame.

NaraFrame must compete on visual storytelling while retaining structured revision, reusable assets, pinned identities, and controlled export. The former policy against expressive growth is withdrawn. A named visual benchmark is sufficient justification for a reusable capability; an aesthetic gap need not first become a compiler error.

Art direction belongs in the skill/profile and is checked against visible output. Technical checks protect safety, integrity, and readability. Repetition/dead-space heuristics are advisory unless the owner intentionally opts into a hard creative restriction. Do not force extra transitions, motion, or content merely to silence a taste warning. The M2.4 target is benchmark-specific quality, not an attempt to reproduce all arbitrary-code effects or a claim that every future video will outperform Bang Motion.

## 3. File ownership and growth boundaries

Paths below are planned implementation targets, not files created by this documentation revision. Create only what the active milestone needs. Tests live under package test roots so the configured runner can discover them.

| Area | Exact root / primary target | Responsibility |
|---|---|---|
| Workspace | `/Users/fatih/Code/Playground/NaraFrame/package.json`, `/Users/fatih/Code/Playground/NaraFrame/pnpm-workspace.yaml`, `/Users/fatih/Code/Playground/NaraFrame/tsconfig.base.json`, `/Users/fatih/Code/Playground/NaraFrame/vitest.config.ts` | Pinned toolchain, explicit test discovery, checks |
| Core | `/Users/fatih/Code/Playground/NaraFrame/packages/core/src/index.ts` | Schema, safe loader, profile, local timeline/captions, validation, keys, revision metadata |
| Renderer | `/Users/fatih/Code/Playground/NaraFrame/packages/renderer-remotion/src/index.ts` | Narrow compiled input → preflight/preview/final adapter, frame/audio rendering |
| CLI | `/Users/fatih/Code/Playground/NaraFrame/packages/cli/src/index.ts` | Commands, JSON events, runtime orchestration, attempts and atomic pointers |
| Skill | `/Users/fatih/Code/Playground/NaraFrame/skills/naraframe/SKILL.md` | Profile-first interleaved workflow; reads core schemas, never duplicates them |
| Production helper | `/Users/fatih/Code/Playground/NaraFrame/skills/naraframe/scripts/production-ledger.ts` | Local reservation/reconciliation for agent operations; no provider SDK or credentials |
| Profile | `/Users/fatih/Code/Playground/NaraFrame/profiles/current-issues/profile.json`, `/Users/fatih/Code/Playground/NaraFrame/profiles/current-issues/direction.md` | First identity; current-affairs policy stays profile-local |
| Core tests | `/Users/fatih/Code/Playground/NaraFrame/packages/core/test/` | Schemas, assets, blocks, captions, invalidation, revisions |
| Renderer tests | `/Users/fatih/Code/Playground/NaraFrame/packages/renderer-remotion/test/` | Fonts/media/offline, frame boundaries, layouts, deterministic pixels, audio |
| CLI/skill tests | `/Users/fatih/Code/Playground/NaraFrame/packages/cli/test/` | CLI contract, skill command compatibility, fake-provider ledger, E2E/recovery |
| Fixtures | `/Users/fatih/Code/Playground/NaraFrame/test-fixtures/` | Minimal draft, media safety, two source projects, contrasting test-only profile |
| Operator quickstart | `/Users/fatih/Code/Playground/NaraFrame/README.md` | Installation/doctor, skill and manual commands; needed alongside M0 |
| Design authority | `/Users/fatih/Code/Playground/NaraFrame/docs/spec.md` | Active product contracts |
| Evidence/disposition | `/Users/fatih/Code/Playground/NaraFrame/docs/refine-spec.md` | Finding states and linked runtime evidence |
| Delivery authority | `/Users/fatih/Code/Playground/NaraFrame/docs/plan.md` | This roadmap, active-milestone expansion, decisions and gate status |

Avoid speculative generic workflow engines, broad renderer portability layers, and separate profile-only transaction systems. Reference projects live in `test-fixtures/`; generated evidence is local build output, not example source duplicated in another directory.

## 4. How to use this plan

This is the implementation plan described by the spec-driven workflow; there is no second planning layer between this document and coding. Section 0 is the next authorized-task sequence, subject to explicit execution permission. M0–M3 histories preserve delivered and unfinished evidence; M2.4/D-VIS are not automatically the next work unit. Implementation bodies belong to execution, not this documentation-only revision.

Delivery is feature-driven, confirmed in practice during M0.9: build the real path first, show the working output, then add focused automated coverage. Tests protect behavior that has already been demonstrated; they are not the first gate. Each task is a small user-visible feature and must end in behavior Fatih can run or an artifact he can inspect. M0.8 adds cross-feature E2E, failure-injection, and runtime evidence; it is not the first testing point. TypeScript bodies, fixtures, package manifests, and renderer details belong to execution. If implementation reveals a material product or architecture change, update the relevant spec/refinement decision before continuing.

Create the initial lockfile with an ordinary install, then verify a frozen reinstall. No Git initialization, commit, push, paid generation, or product implementation is part of this documentation edit.

Workspace commands that M0 must make real:

```bash
pnpm install
pnpm install --frozen-lockfile
pnpm typecheck
pnpm lint
pnpm test:unit
pnpm test:integration
pnpm build
pnpm verify
pnpm test:e2e
```

`verify` covers lint/format checks, typecheck, unit/integration tests, and build. Renderer E2E stays separate because it is slower, but it is mandatory for the M0 gate. During M0.2–M0.7, run the current suite plus the completed feature's focused tests before merge. M0.8 fills cross-feature E2E, recovery, and runtime-evidence gaps and runs the complete exit gate.

## 5. M0 — First usable visual draft

**Goal:** Fatih can start with a topic and profile in Codex, inspect or edit JSON directly, validate the same project through CLI, and render a labelled 15–30 second silent draft without changing renderer code.

**M0 boundary:** M0 includes text/image/native-shape composition, reveal/emphasize/focus, plan validation, draft preview, contact sheet, structured reports, and one current-issues profile. It excludes narration, captions, music/SFX, production ledger, durable edit/undo, production-ready scoped preview, profile apply, SVG/video layers, final export, and every visual recipe reserved for M1/M2.

**Exit evidence:** one real preview MP4, contact sheet, report/manifest, FFprobe result, repeated selected-frame hashes, an external-egress-denied render, failure-injection proof for atomic publication, skill/CLI compatibility, and Fatih's manual JSON correction. These results must be recorded in section 11 and `docs/refine-spec.md`; checking boxes without artifacts is insufficient.

### M0 contract map

The implementation must preserve these boundaries. Exact TypeScript definitions are written and tested during the owning task.

| Contract | Owner | Required shape/behavior |
|---|---|---|
| `Issue` and `Result<T>` | Core | Stable code, severity, responsible party, source path/entity, message, optional suggestion/details |
| `PlanProject` | Core | Validated project config, frozen profile, scenes, asset manifest, project root, canonical source revision |
| `DraftScope` | Core | Full-project draft or one selected scene; M0 scene offsets remain project-scoped because every draft duration is known |
| `CompiledDraft` | Core | Schema version, draft mode, dimensions/fps, half-open scene/beat frames, resolved profile/layers/assets, source revision, assembly key, visible silent-draft label |
| `RenderDraftRequest` / `RenderedAttempt` | Renderer | Compiled input plus explicit browser/project/attempt paths and cancellation; returns MP4, review stills, checked frames, and runtime facts |
| `DraftBuild` | CLI orchestration | One immutable build ID containing preview, contact sheet, frame index, report, and manifest |
| `CommandResultEvent` | CLI | One final versioned JSON event with command, success, readiness, source revision, fingerprint/build ID, scope, artifacts, issues, duration, and command-specific data |

Core remains renderer-independent. Renderer consumes only compiled data. CLI coordinates filesystem state and publication. The skill calls the same CLI available to a human and never duplicates schemas or writes compiled files directly.

### Task M0.1: Bootstrap the pinned workspace

**Files:**
- Create: `/Users/fatih/Code/Playground/NaraFrame/package.json`
- Create: `/Users/fatih/Code/Playground/NaraFrame/pnpm-workspace.yaml`
- Create: `/Users/fatih/Code/Playground/NaraFrame/.node-version`
- Create: `/Users/fatih/Code/Playground/NaraFrame/tsconfig.base.json`
- Create: `/Users/fatih/Code/Playground/NaraFrame/vitest.config.ts`
- Create: `/Users/fatih/Code/Playground/NaraFrame/biome.json`
- Create: `/Users/fatih/Code/Playground/NaraFrame/packages/core/package.json`
- Create: `/Users/fatih/Code/Playground/NaraFrame/packages/core/tsconfig.json`
- Create: `/Users/fatih/Code/Playground/NaraFrame/packages/core/src/index.ts`
- Create: `/Users/fatih/Code/Playground/NaraFrame/packages/renderer-remotion/package.json`
- Create: `/Users/fatih/Code/Playground/NaraFrame/packages/renderer-remotion/tsconfig.json`
- Create: `/Users/fatih/Code/Playground/NaraFrame/packages/renderer-remotion/src/index.ts`
- Create: `/Users/fatih/Code/Playground/NaraFrame/packages/cli/package.json`
- Create: `/Users/fatih/Code/Playground/NaraFrame/packages/cli/tsconfig.json`
- Create: `/Users/fatih/Code/Playground/NaraFrame/packages/cli/src/index.ts`
- Create by install: `/Users/fatih/Code/Playground/NaraFrame/pnpm-lock.yaml`

**Interfaces:**
- Consumes: Node 24.20.0 LTS and registry packages available on 2026-09-07.
- Produces: three private workspace packages, explicit test discovery, exact dependency pins, `pnpm naraframe`, and a lockfile used by all later tasks.

- [x] **Step 1: Create the workspace manifest and package boundaries.**

Create a private ESM pnpm workspace with `packages/*`. Pin the candidate versions recorded in the document header without ranges and keep every Remotion package on exactly the same patch. The dependency direction is CLI → core/renderer and renderer → core; core has no renderer dependency. Package exports must resolve built `dist` files, while the test configuration resolves package names to source so tests cannot accidentally use stale builds.

Expose root commands for build, typecheck, lint, format, unit, integration, E2E, verify, and the local CLI. The local CLI runs built output; development tests may execute TypeScript through the test runner.

- [x] **Step 2: Configure strict TypeScript, Biome, and explicit Vitest projects.**

Use strict NodeNext TypeScript with project references and separate source/build directories. Configure three explicit Vitest projects named `unit`, `integration`, and `e2e`, including the corresponding package test directories and source aliases. Configure Biome recommended checks and exclude dependencies, build outputs, generated project state, previews, and final outputs.

- [x] **Step 3: Install once to create the lockfile, then verify the frozen path.**

Run:

```bash
rtk corepack prepare pnpm@12.3.4 --activate
rtk pnpm install
rtk pnpm install --frozen-lockfile
rtk pnpm exec tsc --version
rtk pnpm --filter @naraframe/renderer-remotion exec remotion versions
```

Expected: both installs exit 0; TypeScript prints `Version 7.0.2`; Remotion prints `4.0.521`. If Node 24.20.0 plus these pins do not install, stop M0. Record the actual conflict and select a mutually compatible stable set in this section before editing product code. Never mix Remotion patch versions.

- [x] **Step 4: Prove test discovery and built-package resolution.**

Add one unit harness test per package, run `rtk pnpm test:unit`, then run typecheck/build and a smoke import from each built package. Expected: every test project is discovered, built exports resolve from `dist`, and no package imports source TypeScript at runtime.

**Checkpoint:** Exact installed versions and lockfile hash are recorded in section 11. Later render compatibility is not yet proven. Git now exists; commit only this task's explicit files.

### Task M0.2: Deliver the first runnable draft vertical slice

**Outcome:** Fatih can build the repository and run one real CLI command against a checked-in Krakatau sample to produce and open a 15-second vertical MP4. This is the first product checkpoint, not a schema-only checkpoint.

**Primary files:**
- Core source contracts, loader, and compiler under `packages/core/src/`
- Minimal Remotion composition and renderer under `packages/renderer-remotion/src/`
- Runnable `validate` and `preview --draft` commands under `packages/cli/src/`
- Editable sample under `samples/krakatau-draft/`

- [x] Implement the smallest strict source contracts needed by the sample: project, profile lock, scenes, planned/ready PNG assets, compiled draft, and structured issues.
- [x] Load the sample from disk and compile known scene durations into 540 × 960, 30 fps draft input.
- [x] Render text, rectangle/circle shapes, and labelled planned-asset placeholders through one Remotion composition.
- [x] Implement `naraframe validate <project>` and `naraframe preview <project> --draft`. The preview command may publish a development MP4 directly before atomic build publication exists.
- [x] Add the 15-second three-scene Krakatau sample with `DRAFT • NO AUDIO` visibly inside the safe zone.
- [x] Run typecheck/build and the current existing test suite only after the product path is implemented.
- [x] Manually run the built CLI against the sample and inspect the resulting MP4. Command: `pnpm naraframe preview samples/krakatau-draft --draft`; artifact: `samples/krakatau-draft/preview/dev-preview.mp4`.
- [x] After the manual path works, add focused tests for this feature's source validation, compilation, CLI contract, and one smoke render; rerun the integration gate.

**Checkpoint:** M0.2 completes only when the real CLI produces a watchable MP4 and its focused tests pass. Broader cross-feature and failure-injection coverage remains M0.8.

### Task M0.3: Make project creation and profile locking usable

**Outcome:** Fatih can create a new project from a profile instead of copying the sample manually.

- [x] Implement `naraframe create <name> --profile <id-or-path>` using atomic staging and rename.
- [x] Create `naraframe.json`, `profile.lock.json`, `scenes.json`, `assets/manifest.json`, preview directories, and attempt directories.
- [x] Copy/hash render-critical profile assets so the project no longer depends on the source profile.
- [x] Implement safe relative-path resolution, ready-PNG hash checks, and deterministic source revision calculation.
- [x] Run the built CLI to create a temporary project, add one scene through direct JSON editing, validate it, and produce a draft preview.
- [x] Add focused create/profile-lock/path/hash tests after the manual flow works, then run the integration gate.

**Checkpoint:** Keep the created project and preview path long enough for manual inspection, then protect the accepted behavior before merge.

### Task M0.4: Complete the M0 visual and motion capability set

**Outcome:** The runnable draft supports every visual capability promised by M0.

- [x] Add text, local PNG image, rectangle/circle shape, and non-recursive group layers.
- [x] Add scene visual types `text`, `media`, and `composition` plus `cut` transitions.
- [x] Add bounded `reveal`, `emphasize`, and `focus` actions using deterministic frame arithmetic.
- [x] Resolve full-project and selected-scene draft scope, half-open frame boundaries, and labelled placeholders.
- [x] Reject raw keyframes, executable fields, unknown actions, recursive groups, broken references, and unsupported SVG/video.
- [x] Manually render the reference frames twice and compare hashes as an early determinism signal.
- [x] Add focused layer/action/reference/frame-boundary tests after the visual flow works, then run the integration gate.

**Checkpoint:** Watch the full video and confirm the explanatory state changes, rather than accepting motion on a title alone.

### Task M0.5: Publish complete preview builds atomically

**Outcome:** Every successful preview is an immutable review package instead of a loose MP4.

- [x] Render into `.naraframe/attempts/<id>/` and publish complete builds under `preview/builds/<build-id>/`.
- [x] Produce `preview.mp4`, `contact-sheet.png`, `frames.json`, `report.json`, and `manifest.json` under one build ID.
- [x] Validate hashes/signatures and promote `preview/current.json` atomically only after every artifact is complete.
- [x] Preserve the previous current build on render failure, interruption, corrupt MP4, or incomplete report.
- [x] Include runtime versions, source revision, assembly key, draft scope, checked frames, and the silent-draft label in reports.
- [x] Manually inject one publication failure and inspect that the previous current build remains selected.
- [x] Add focused atomic-publication and artifact-integrity tests after manual failure injection, then run the integration gate.

**Checkpoint:** Fatih can inspect one directory containing the video and all review evidence for the same build.

### Task M0.6: Finish the operator-facing CLI and NaraFrame skill

**Outcome:** The same product path works from terminal and from an agent using the skill.

- [x] Complete `doctor`, `schema`, `create`, `validate --stage plan`, `status`, and `preview --draft`.
- [x] Support concise human output and exactly one final versioned JSON event on stdout in `--json` mode.
- [x] Map usage, source, system, and cancellation failures to exit codes 3, 1, 2, and 130.
- [x] Return actionable issues with stable code, artifact, path/entity, responsibility, message, and suggestion.
- [x] Add `skills/naraframe/SKILL.md` with the profile-first interleaved flow. The skill calls the public CLI and does not duplicate schemas.
- [x] Follow the skill once against the reference sample and confirm it reaches the same preview build as direct CLI use.
- [x] Add focused CLI/skill compatibility and exit-code tests after both operator paths work, then run the integration gate.

**Checkpoint:** Terminal and skill operation resolve the same project contract and artifact paths.

### Task M0.7: Run the owner trial and revise the real workflow

**Outcome:** Fatih tries the product before test coverage is frozen around it.

- [x] Give Fatih the shortest exact setup and preview commands.
- [x] Open the real preview/contact sheet for review.
- [x] Have Fatih change one closing line directly in JSON, validate, and preview again without renderer-code edits.
- [x] Run one intentionally invalid `bounce` action and assess whether the error identifies the source path and correction clearly.
- [x] Fix usability or contract problems found during this trial and add regression tests before merge.
- [x] Record active time, render time, assistance needed, source/build IDs, and review notes.

Trial evidence: the clean M0.7 worktree started from `0789b08`. Ambient Node `23.10.0` correctly failed `doctor` with `NODE_VERSION_INCOMPATIBLE`; prepending `/opt/homebrew/opt/node@24/bin` activated Node `24.20.0` and pnpm `12.3.4`, after which every doctor check passed. The first full baseline preview published build `41b6900277c8-5a908e88-4e1` from source revision `09b2333daa03081bc485868915d413d09556a22e81fa95a93c84cb48c8e7f531` and assembly key `41b6900277c8ed8533002fbaadecf8cd9b39a9cae4d758d344d6389f6ec63d7d`. The CLI measured 38.283 seconds; the immutable report spans 37.945 seconds and the observed wall time was 52.58 seconds. Fatih directly changed the closing copy in `scenes.json` to “Dampaknya melampaui Selat Sunda. Laut, atmosfer, dan iklim dunia ikut berubah.” without touching renderer code. Validation passed with new source revision `0e2f2b8aef04611c672f7edb872d5bda29a5bea81d74591545b72917f6fcf60b` and assembly key `0654538e7ce0a856b23a707520b7472c0c21aaf1f4261eec86b7c4de5d3daa5c`; `status` first reported the baseline stale, then the rerender published current build `0654538e7ce0-2b154c13-273`. The rerender CLI measured 43.471 seconds, its report spans 43.074 seconds, and observed wall time was 66.98 seconds. Both 540 × 960, 30 fps, 18-second silent MP4s and their 11-frame contact sheets were opened for review. The revised closing remains inside the visual safe area with one additional text line. Owner visual review rejected the first motion result as ordinary cuts with image motion too subtle to notice. Inspection explains the result: the previous image focus reached only about 4.2% scale and 8 px vertical translation, its reveal travelled about 32 px over 0.8 seconds, and the marker pulsed once. The revision adds bounded `linear`/`smooth`/`snappy` easing presets to the generic reveal/emphasize/focus contract, makes focus smooth by default, and increases generic camera travel. Profile `current-issues` 0.2 raises focus scale to 1.14 and instructs context-derived choreography. The Krakatau sample alone stages panel, map, marker, and copy reveals, uses a 4.2-second map push, and pulses its event marker twice; this sample choreography is reference evidence, not a global video template. Revised build `96b57423d8ff-16e8cc76-28a` is current for source revision `f256ab60b4ff34fff5e260c20a51a7b02466d180927eb3a575d6d4357581993d` and assembly key `96b57423d8ff015bd1f5b2941e4d847c8ac49bc94dcd01f8bb5c64786e37649f`; CLI/report/wall timing was 37.019/37.019/51.88 seconds. FFprobe reports H.264, 540 × 960, 30 fps, 18 seconds, and no audio. Its 14-frame contact sheet shows the staged context progression. Focused unit 7/7 and integration 7/7 checks passed, followed by the full `pnpm verify` gate with unit 13/13 and integration 39/39. A separate source copy with `bounce` at `/scenes/1/beats/3/action` exited 1 with `SCHEMA_INVALID`, responsible `agent`, the exact `scenes.json` path, the supported actions, and a correction suggestion; restoring `focus` validated successfully. Remotion required loopback permission in the Codex sandbox, which is an execution-environment constraint rather than a project-source failure. Agent assistance supplied the tested runtime command and ran validation/render after Fatih saved the edit. Fatih accepted the revised, context-driven motion on 2026-09-14. Owner active time was not measured during the trial and is recorded as unavailable; the next timed trial must start its timer before setup. M0.7 passes with that explicit measurement limitation.

**Checkpoint:** M0.7 requires Fatih's hands-on confirmation; agent-only inspection is insufficient.

### Task M0.8: Add cross-feature coverage, harden failures, and close M0

**Outcome:** Cross-feature and runtime tests protect the complete workflow that already worked feature-by-feature.

Live execution tracker:

Current step (2026-10-06): **Batch F (recipe text fit) CLOSED / INTEGRATED via PR #31 (`e008490`, tree equal to reviewed head `262aff4`); main synced; `recipe-text-fit` deleted. The Batch E closure is integrated with it. Open: owner-flow repeatability variant and interruption timeout (reliability caveats), declared-slot/trusted-code limits, non-space break opportunities, plus the P5 register items. Supervisor confirmed the closure; next is production use on a new brief from Fatih. No engineering scope is authorized.** Earlier the same day: Batch B integrated via PR #27 (`0789c47`). Batch A remains INTEGRATED via PR #26 (`9ec2b69`); M3.P0 via PR #24 (`b1875e2`), docs via PR #25; M2 technically closed. Latest Batch B E2E is exit 0, 21/21; historical repeatability failures remain unresolved despite this pass. D-VIS and existing reliability/reuse/cost findings remain open. Preserve unrelated AGENTS.md, the Miss Ayu worktree, stash and all previous evidence. Section 0 is authoritative; older checkpoint/handoff records below are history.

Historical tracker snapshot (audio checkpoint; retained): **M2.4.4 technical part INTEGRATED via [PR #17](https://github.com/fatlhr/NaraFrame/pull/17), squash `cf9411f`. M2.4.4b INTEGRATED via PR #18, squash `f065e4d`. B1 correction M2.4.5a CLOSED / INTEGRATED via [PR #19](https://github.com/fatlhr/NaraFrame/pull/19), squash `159ed08`. M2.4.5's failed attempt remains BLOCKED_CONFIRMED on its original freeze; the separate freeze-2 retrial is TECHNICALLY_READY after supervisor evidence review; it is CLOSED / INTEGRATED for its technical scope via PR #20 (`44d172e`). Fatih chose F1 next: M2.4.5-F1 (contrast against the actual backdrop) is INTEGRATED via [PR #21](https://github.com/fatlhr/NaraFrame/pull/21), squash `4298f3a`, closure verified by the supervisor 2026-09-28. Fatih then chose F2 and asked to close M2: the batch on branch `m2-technical-close` implements F2, fixes the shared-fixture flake and records M2's technical closure. The NF-AC-16/17 visual gates and export are not passed and are tracked as D-VIS. M2 is closed for its technical scope via PR #22 (`93c0a67`); D-VIS stays OPEN. M3.1-A is CLOSED / INTEGRATED via PR #23 (`8463764`), with F-A2 still OPEN. M3.1-B/B1 is TECHNICALLY_READY on `m3-1b-audio-delay`: audio boundaries 0–4 ms, verify 274/280 and full serial E2E 15/15 pass. Fatih requested a checkpoint stop; review/integration is pending, with no commit/push/merge; M3.1-C is not started.** Shared-fixture flake: fixed in the M2 closure batch. `status` on the shared `samples/krakatau-draft` (run by `command-contract.test.ts`) makes `computeReuse` create and remove `.naraframe/attempts/reuse-*`, while `draft-project.test.ts` copied the whole sample. A 20 s reproduction gave 321 ENOENT failures in 613 copies; copying only source and assets gave 0 in 1184. M2.4.1–3 are integrated. The NF-AC-16 visual assessment, further video polish and export are deferred by owner decision, not passed. The population scene's "ke-4" claim still blocks publication. Pixel repeatability, E2E diagnostics (issue #16), unknown style bindings and measured comparative cost remain open.

- [x] **M0.8.1 — Isolated pinned baseline:** create the short-lived worktree from current `origin/main`, complete a frozen install without lockfile drift, and pass the existing verification suite.
- [x] **M0.8.2 — Contract gap closure:** mapped existing coverage and added the missing source/reference, key-order determinism, motion-boundary, and public-package assertions; unit coverage passes 16/16.
- [x] **M0.8.3 — Runtime boundary hardening:** explicit browser/FFmpeg failures and no-download behavior pass; the owner-flow render succeeds with loopback allowed and external egress denied; existing atomic failure-injection coverage remains green.
- [x] **M0.8.4 — CLI safety matrix:** all M0 commands retain structured success/failure results and exit mappings; interruption coverage remains green and unexpected renderer secret/path details are absent from JSON and stderr.
- [x] **M0.8.5 — Owner-flow E2E:** a copied 15-second Krakatau source validates, renders, passes complete artifact checks, becomes stale after one-line editing, rerenders, rejects `bounce` at the exact source path, and validates again after recovery.
- [x] **M0.8.6 — Determinism and artifact evidence:** repeated sandboxed renders match at lossless frames 18/180/405; FFprobe, full decode, immutable artifact hashes, and the sampled-review limitation are recorded below.
- [x] **M0.8.7 — M0 exit gate:** final frozen install reused 279 packages with zero downloads; `pnpm verify` passed unit 16/16 and integration 41/41; final serial `pnpm test:e2e` passed 2/2 in 180.37 seconds; evidence registers are current.

- [x] Add unit tests for source schemas, references, timing/compiler determinism, motion boundaries, and package exports.
- [x] Add integration tests for create/load, safe paths, renderer/browser/FFmpeg behavior, external-egress denial with loopback allowance, and atomic preview publication.
- [x] Add CLI tests for commands, structured output, exit codes, cancellation, and failure redaction.
- [x] Add an E2E test that copies the Krakatau sample, validates it, renders a 15-second silent draft, inspects all review artifacts, edits one line, rerenders, and verifies the invalid-action failure.
- [x] Run `pnpm install --frozen-lockfile`, `pnpm verify`, and `pnpm test:e2e` on the pinned runtime.
- [x] Record FFprobe output, repeated selected-frame hashes, sandbox evidence, failure-injection evidence, artifact hashes, and owner-review notes in section 11 and `docs/refine-spec.md`.

**M0 completion rule:** M0 remains in progress until both the manual owner trial and the final automated/runtime evidence pass. M0.8 closes integration gaps after feature-level tests already exist; it does not replace manual review.

### Task M0.9: Correct visual fidelity before narration work

**Outcome:** The same LBC source intent and local assets render through NaraFrame with reliable rounded media, non-overlapping text, clear type hierarchy, revision-tolerant layout, and context-appropriate motion—without project-specific React/TSX.

**Why this interrupts M1:** The original M0 gate proved the runtime, compiler, renderer, CLI/skill loop, publication safety, and context-driven motion. The later side-by-side LBC trial exposed that box coordinates alone are not a sufficient visual contract. Starting narration now would protect audio work on top of a layout system that still corrupts real content.

**Expected source areas:** modify `packages/core/src/schema/scene.ts`, `packages/core/src/schema/profile.ts`, `packages/core/src/schema/compiled.ts`, and `packages/core/src/compiler/compile-draft.ts`; split focused layer/layout/preflight responsibilities out of `packages/renderer-remotion/src/remotion/draft-video.tsx` when implementation begins; update corresponding core/renderer/CLI tests, `skills/naraframe/SKILL.md`, and the `current-issues` profile. Exact file decomposition is an implementation decision, not a reason to create another plan.

Live execution tracker:

- [x] **M0.9.1 — Freeze the defect benchmark:** retained `work/lbc-benchmark/engine/`, direct-Remotion source, both 30-second 540 × 960 silent outputs, comparison sheet, hashes, and review notes for seconds 8/15/21/27. VF-01–VF-07 classify the defects across schema, profile, renderer, preflight, layout, choreography, and roadmap order. Result: a repeatable failing baseline, not a visual pass.
- [x] **M0.9.2 — Add the layer appearance contract:** optional schema-version-1 typography, image crop/focal point, radius/stroke/shadow, and bounded group layout compile through profile/default resolution. Existing Krakatau remains render-compatible through explicit legacy defaults; bounded contract regressions pass.
- [x] **M0.9.3 — Strengthen profile typography and visual tokens:** `current-issues` 0.3 and the LBC profile lock now define role scale, minimum size, radius, stroke/shadow, and media defaults. Profile direction and the NaraFrame skill require a shot rundown, one dominant statement, bounded layout, and visual state review.
- [x] **M0.9.4 — Render exact primitives:** resolved type, padding/alignment, crop/focal point, radius, stroke, and shadow are applied by dedicated layer branches. Media and its motion are clipped by the declared mask; the corrected LBC frames visibly preserve rounded geometry.
- [x] **M0.9.5 — Add measured layout and visual preflight:** exact `@remotion/layout-utils@4.0.521` measurement runs after fonts load, bounded shrink updates render input, and stable visual issues block publication. The deliberate LBC collision exited 1 with `TEXT_COLLISION`; the corrected project published with zero issues. A follow-up review found collision rectangles for members of a transformed/animated group were checked at their untransformed local position, not the position `GroupView` actually renders — group transform/beat motion is now folded into both the collision rectangle and visibility-opacity check (`groupScreenTransformFor` shared between `draft-video.tsx` and `visual-preflight.ts`), with a regression test for a collision that only exists after the group's static transform is applied.
- [x] **M0.9.6 — Improve shot continuity without exposing keyframes:** reveal/emphasize/focus use one shared numeric motion model and focus accepts bounded anchors. The benchmark did not require another transition primitive, so cut timing remains stable and no speculative wipe was added.
- [x] **M0.9.7 — Rerender and accept LBC parity:** after the M0.9.5 group-transform preflight fix, rerendered build `16abeb583bc2-086fdfc0-b9f` (same source revision/assembly key as the earlier build; the LBC engine's own groups use identity transforms with no beats, so the fix does not change its pixels, but the build is re-attested against the corrected code rather than carried forward unverified), its 93-state contact sheet, four-moment comparison, targeted regressions (including the new group-transform unit tests), `pnpm verify`, and `pnpm test:e2e` all pass. Fatih reviewed the rendered MP4 and the four-moment comparison and accepted it on 2026-09-14, noting precision (masks/collision/hierarchy) is clearly improved over the prior baseline; residual transition/font-family/shape-variety monotony versus the direct-Remotion reference is acknowledged and explicitly deferred to M2.2 (`docs/plan.md` §M2.2), not treated as an M0.9 defect. M1.1 is unpaused.

Primary operator proof:

```bash
pnpm naraframe validate work/lbc-benchmark/engine --stage plan --json
pnpm naraframe preview work/lbc-benchmark/engine --draft --json
pnpm test:unit
pnpm test:integration
pnpm verify
pnpm test:e2e
```

The first two commands must return the same source/build contract used by normal projects; the corrected preview must not depend on `work/lbc-benchmark/direct-remotion/src/`. Tests are added after each manual feature path works, then the full gates run at M0.9.7.

**M0.9 exit gate — passed 2026-09-14:** declared rounded images are visibly rounded; required text has no collision, unintended clipping, or out-of-frame content; typography has clear roles; representative copy-length changes reflow or fail explicitly; the full 30-second silent LBC engine video and frames around seconds 8, 15, 21, and 27 were reviewed and accepted by Fatih. M1.1 is unpaused. Broader visual variety (additional transition recipes, bundled font families, domain shape recipes) remains open for M2.2 and is not part of this gate.

### Task M0.10: Break the slide ceiling before narration

**Historical outcome:** Initial transition/font growth and repetition diagnostics, accepted within the M0.10 scope. These heuristics did not establish competitive visual storytelling; M2.4 adds the output-based gate.

**Why this runs before M1:** M0.9 fixed precision, not monotony. Two independent reviews have now flagged the same class of problem — the M0.7 trial rejected motion as too subtle, and the accepted M0.9 build was still described as monotonous in transitions, type, and shapes against the direct-Remotion reference. Narration is recorded on top of these visuals, so doing this after M1 means re-rendering the pilot anyway. The scope is deliberately three bounded items plus a report; it is not the M2.2 recipe library.

**Expected source areas:** add `packages/core/src/compiler/variety.ts` for repetition checks over pre-render project/compiled data, wired from `packages/core/src/compiler/compile-draft.ts`; add a `variety` policy to `packages/core/src/schema/profile.ts`; add transition primitives through `packages/core/src/schema/scene.ts` and `compile-draft.ts`; enable profile font assets already declared by `profile.ts`; extend the published build artifacts in `packages/cli/src/preview-build.ts`.

- [x] **M0.10.1 — Detect sameness mechanically.** Added `checkVariety` in `packages/core/src/compiler/variety.ts`, run from `compileDraft` only for project-scope compiles (a single scene cannot repeat against neighbours it does not see), with stable codes `MOTION_REPETITION` (more than a policy-bounded run of consecutive scenes sharing the same earliest-beat entry signature), `VIEWPOINT_STATIC` (a run of scenes with no `focus` beat), `SINGLE_TRANSITION_TYPE` (every scene in a 3+-scene project shares one transition), and `TYPOGRAPHY_FLAT` (4+ resolved text layers all share one font size). Default severity is warning; `profile.render.variety` can raise it to error or change the bounds. Pure function over compiled data — no browser, no measurement, no render. Manually run before any test existed: `pnpm naraframe validate samples/krakatau-draft --stage plan --json` and `pnpm naraframe validate work/lbc-benchmark/engine --stage plan --json` both surfaced `SINGLE_TRANSITION_TYPE` (every scene in both projects is still `cut`, since M0.10.2 has not landed); neither surfaced `MOTION_REPETITION`, `VIEWPOINT_STATIC`, or `TYPOGRAPHY_FLAT` — the accepted LBC build's remaining monotony is specifically the missing transition variety, not motion or type, which matches the informal review that flagged transitions ahead of the other two. 10 unit tests (`packages/core/test/unit/variety.test.ts`) and 2 integration tests confirming the project/scene-scope wiring boundary; full `pnpm verify` (unit 35/35, integration 43/43) and `pnpm test:e2e` (2/2, 180.45s) pass, after widening three pre-existing CLI/e2e assertions from an exact issues-array match to `arrayContaining`, since they were incidentally asserting "zero other issues" rather than the specific code they named.
- [x] **M0.10.2 — Add bounded transition primitives.** `scene.transition` is now a discriminated union — `cut | push-through | mask-reveal | match-cut` — each carrying a bounded `durationMs` (200–1200ms) plus its own params (direction, mask shape, or anchor). No compiled frame ranges overlap: each primitive is implemented as two independent halves, an exit treatment in the outgoing scene's own tail frames and an entry treatment in the incoming scene's own head frames (`sceneTransitionStateFor` in `packages/renderer-remotion/src/remotion/motion.ts`), so the existing non-overlapping scene-timeline contract, `visual-preflight`'s frame model, and the CLI's checked-frame selection all stay unchanged. Push-through translates+scales+fades along a direction with the entry arriving from the opposite edge; mask-reveal clips the entry with an expanding circle/rectangle `clipPath` while the exit fades; match-cut scales in/out around a shared anchor with no fade, for continuity across the cut. Compile-time validation added three codes: `TRANSITION_DURATION_EXCEEDS_SCENE` (doesn't fit inside either neighbouring scene), `TRANSITION_OVERLAP_WITHIN_SCENE` (a short scene's own incoming and outgoing halves would overlap each other), and `TRANSITION_ON_FINAL_SCENE_IGNORED` (warning; a transition on the last scene has no next scene to play into). Following the M0.9.7 group-transform precedent, `visual-preflight.ts` folds the same scene-transition state into every checked-frame text rectangle and opacity check (`applySceneTransition`), so a layer checked mid-transition is checked at its actual on-screen position/scale — `clipPath` is deliberately excluded from that fold since it clips paint, not layout. Manually proven before any test was written: a 4-scene probe (`work/m0-10-2-transitions-probe/`) using one of each primitive rendered cleanly with `SINGLE_TRANSITION_TYPE` gone (four distinct types now in use), and a boundary-frame contact sheet around each cut confirms the three primitives are visually distinct; a second probe confirmed `TRANSITION_DURATION_EXCEEDS_SCENE`, `TRANSITION_OVERLAP_WITHIN_SCENE`, and `TRANSITION_ON_FINAL_SCENE_IGNORED` all fire on the inputs designed to trigger them. Full `pnpm verify` (unit 35/35, integration 43/43) and `pnpm test:e2e` (2/2, 184.44s) pass against the existing samples, which still use `cut` only — new unit coverage for the primitives themselves is deferred to the M0.10 test pass rather than added per sub-task.
- [x] **M0.10.3 — Enable bundled profile fonts.** Copying/hashing/locking profile font assets already worked since M0.3 (kind-agnostic); the missing piece was that `family`/`weight` were declared in schema but silently dropped by `prepareProfileAssets` when writing `profile.lock.json` (fixed), and nothing exposed the locked font to the compiled draft or actually loaded it in the browser. Added `render.typography.displayFontFamily` (bounded to the `display` role and the scene-level "text" visual only — every other role keeps the base family) and a `fonts: CompiledFont[]` field on `CompiledDraft`, resolved from `source.profile.assets` in `compile-draft.ts`. `root.tsx`'s `calculateMetadata` registers each bundled font via the `FontFace` API (`loadBundledFonts` in the new `packages/renderer-remotion/src/remotion/typography.ts`) before `visual-preflight` runs. Manual testing surfaced a real gap and two fixes followed: (1) `document.fonts.check()` cannot distinguish "a declared family that was never registered at all" from "genuinely loaded" — an unrelated string typo'd into `displayFontFamily` rendered successfully via silent system-font fallback instead of failing, so a compile-time check (`DISPLAY_FONT_NOT_DECLARED`) now requires `displayFontFamily` to match a locked font asset's `family` before render is attempted; (2) `loadBundledFonts` now returns the `Set` of families that actually finished loading, and `resolveVisualPreflight` cross-checks a layer's resolved family against that set specifically when the family is a declared bundled asset, so a font that is correctly declared but fails to parse/load still fires `FONT_NOT_LOADED` rather than silently falling back (confirmed both ways: a genuinely corrupt-but-hash-matching `.ttf` fails with `FONT_NOT_LOADED`; a tampered hash still fails earlier with the pre-existing `ASSET_HASH_MISMATCH`). Manually verified end-to-end on a scratch profile (`work/m0-10-3-font-probe*/`, a real macOS system TTF copied in for pipeline testing only — no bundled face or licence decision has been made for actual product profiles yet, that remains open) before any test was written. Full `pnpm verify` (unit 35/35, integration 43/43) and `pnpm test:e2e` (2/2, 185.61s) pass; new unit coverage is deferred to the M0.10 test pass.
- [x] **M0.10.4 — Choice menus in the profile.** `render.variety.menu` (`packages/core/src/schema/profile.ts`) declares a permitted vocabulary — `entryDirections`, `transitionTypes`, `focusCameras` — and `checkVariety` (`packages/core/src/compiler/variety.ts`) enforces it: `ENTRY_STYLE_NOT_PERMITTED` when a scene's earliest reveal beat uses a direction outside the menu, `TRANSITION_NOT_PERMITTED` for a disallowed transition type, `FOCUS_STYLE_NOT_PERMITTED` for a disallowed focus camera. The menu is optional and additive to M0.10.1's repetition checks, not a replacement — no existing project is affected unless its profile opts in. Manually verified all three codes fire on a probe with a restrictive menu, and confirmed no regression on the unrestricted samples, before any test was written. What the menu does NOT do, to keep this honest against the original framing: it does not itself scan sibling projects or persist a cross-project/cross-time history — "checkable across projects and across time" describes a structural property (choices are now explicit literals in `profile.lock.json`/`scenes.json`, so a person or a future tool can diff them file-to-file), not an implemented scanner. Building that scanner is deferred until a real workflow needs it, per the plan's own evidence-driven-growth rule for M2.2. Full `pnpm verify` (unit 35/35, integration 43/43) and `pnpm test:e2e` (2/2, 177.81s) pass; new unit coverage is deferred to the M0.10 test pass.
- [x] **M0.10.5 — Publish a visual QA report.** Added `CONTRAST_INSUFFICIENT` (`packages/core/src/compiler/contrast.ts`): pure WCAG relative-luminance math (no DOM/canvas/render) comparing resolved text color against `palette.background`, using the WCAG large-text/normal-text 3:1/4.5:1 thresholds by font size; runs unconditionally in `compile-draft.ts` (not scope-gated like M0.10.1, since a contrast defect is real on one scene regardless of the rest of the project) so it fires during `validate` in milliseconds. Documented limitation: it only checks the flat profile background, not an actual photo/shape behind a layer at render time. `report.json` gains two new fields computed from the final `CompiledDraft` in `packages/core/src/compiler/qa-report.ts` and wired in `packages/cli/src/preview-build.ts`: `varietyMetrics` (scene count, distinct entry signatures, transition types used, focus cameras used, distinct font sizes — the M0.10.1/2/4 signals as numbers instead of issues) and `readability` (smallest font size expressed at the fixed 1080px final width, not the 540px draft-preview width it was measured at, plus every text layer's contrast ratio/threshold/pass-fail). Manually verified before any test: rendered `work/m0-10-2-transitions-probe` and `work/m0-10-3-font-probe`, inspected `report.json` directly for correct `transitionTypesUsed`/`smallestFontSizeAtFinalWidthPx`/`contrastSamples` values; a probe with a near-background text color correctly fails `validate` with `CONTRAST_INSUFFICIENT` at a computed 1.09:1 ratio. Full `pnpm verify` (unit 35/35, integration 43/43) and `pnpm test:e2e` (2/2, 178.23s) pass; new unit coverage deferred to the close-out test pass below.
- [x] Rerender the LBC engine and the Krakatau sample after the above. `samples/krakatau-draft/scenes.json` migrated its scene-to-scene transitions from all-`cut` to `push-through` (hook→context) / `mask-reveal` (context→evidence) / `cut` (evidence→impact, the last scene, which never plays a transition by rule); its frozen legacy profile lock is untouched. Rebuilt `7ca2307f9962-c723b736-548` (`preview.mp4` SHA-256 `b52e3df7c67b310411cae13d70dd7abbbb41eb6fde7648195015736b0a20d978`) compiles with zero issues, `SINGLE_TRANSITION_TYPE` gone, `varietyMetrics.transitionTypesUsed` = `["cut","mask-reveal","push-through"]`. `work/lbc-benchmark/engine/` gained a bundled display font (a macOS system TTF, Trebuchet Bold, explicitly a technical placeholder — no product font/licence decision has been made) wired through `displayFontFamily`/a locked `kind: "font"` asset, and transitions `push-through` (hook→offer) / `mask-reveal` (offer→matching) / `match-cut` (matching→progress, with an anchor) / `cut` (progress→cta, cta being the final scene). Rebuilt `4c4228974b3c-33688229-032` (`preview.mp4` SHA-256 `1aef1be2ded542dd4da58f9f7ef382d2ed97f4948ca9483205d20cf9f6a1f6c9`) compiles and renders with zero issues; `varietyMetrics` shows all four transition types used, 11 distinct font sizes, and zero failing contrast samples. Visual proof (hook scene in the bundled display face; a three-row boundary contact sheet across the push-through/mask-reveal/match-cut cuts; both full rendered MP4s) sent to Fatih for review.
- [x] Add focused tests for M0.10.1–5 and run the full close-out gates. New coverage: `packages/core/test/unit/contrast.test.ts` (10, WCAG math + `CONTRAST_INSUFFICIENT`), `packages/core/test/unit/qa-report.test.ts` (5, `computeVarietyMetrics`/`computeReadabilityMetrics`), `packages/core/test/integration/compile-draft-m0-10.test.ts` (9, `TRANSITION_DURATION_EXCEEDS_SCENE`/`TRANSITION_OVERLAP_WITHIN_SCENE`/`TRANSITION_ON_FINAL_SCENE_IGNORED`/`DISPLAY_FONT_NOT_DECLARED` via hand-built `PlanSource` fixtures), 8 new cases extending `packages/core/test/unit/variety.test.ts` for the M0.10.4 menu, `packages/renderer-remotion/test/unit/motion-transitions.test.ts` (11, `sceneTransitionStateFor` exit/entry math for all three primitives, including that travel distance scales from the draft's own width), `packages/renderer-remotion/test/unit/typography.test.ts` (2, `fontFamilyForRole`), and 3 new cases extending `visual-preflight.test.ts` for the scene-transition opacity/geometry fold. One test was dropped after the math didn't hold up under scrutiny: a uniform scene-wide scale+translate can never flip a genuine gap between two plain co-scene layers into a collision (proven algebraically — the gap is always multiplied by the same positive scale factor, never crossing zero), so "opacity-fade suppresses an otherwise-real collision" needed a reveal-beat-isolated construction instead of the naive one. Full `pnpm verify` (unit 74/74, integration 52/52) and `pnpm test:e2e` (2/2, 184.08s) pass.

**M0.10 exit gate — passed 2026-09-15:** a project that repeats one entry action across every scene, uses a single transition, or places unreadable copy is reported before publication (implemented and verified, M0.10.1–5); the rerendered LBC engine uses more than one transition type with at least one in depth, more than one type role, and a display face distinct from body text; Fatih reviewed the rerendered LBC build (`4c4228974b3c-33688229-032`) and accepted it. M1.1 is unpaused. The bundled display font is an explicit placeholder pending a real product font/licence choice; expressive parity with hand-written Remotion was never the bar.

## 6. M1 — Narrated pilot and affordable revision

**Goal:** One topic becomes a narrated explainer, then one spoken section is corrected without replacing valid unrelated audio.

**Consumes:** Tested M0 runtime/CLI/skill plus the accepted M0.9 visual contract/preflight and the M0.10 variety checks/transitions/fonts, source schemas, asset hashes, production policy, and provisioned external capabilities.
**Produces:** Story blocks and local phrase timing, one verified voice recipe, ledger/limits, captions, full preview/final export, source snapshots/edit/undo, and a per-build cost report.

Cost accounting is an intended workflow differentiator, not a verified exclusive market capability. Reports must distinguish recorded spend, reuse, and unknown usage. M1's pilot-specific untracked-cost exception is recorded in its exit gate; comparative savings still need receipts and measurement.

### M1.1 — Production readiness and accounting before generation

- [x] Skill distinguishes prepared media, silent draft, and narrated route. Verify one Indonesian TTS + phrase-timing recipe without adding provider SDKs/keys to core. (The skill now documents the three routes and what each command does on each; `resolveProductionRoute` remains a tested helper that the CLI does not call, because the routes are already distinguished by whether `narration.json` and ready audio exist.)
- [x] Implement `production.json` and append-only versioned receipts with operation IDs, request keys, authorization, upper estimates, reservations, actual/unknown usage, status, and retries.
- [x] Use sequential requests and a narrow local ledger helper. Fake-provider tests precede paid pilot calls; no generic billing service or concurrency scheduler.
- [x] Prove budget 100/spent 40/reserved 40/next 30 denies, timed-out unknown requests are not blindly resent, unknown actual cost stays conservatively reserved, two-attempt limit escalates, and undo never erases charges.
- [x] Record renderer/asset/font/voice rights and host subscription assumptions. No-new-spend does not mean unlimited free generation. Any real paid call requires the applicable user authorization.
- [x] Publish a cost report alongside each build: estimated, actual, and still-unknown spend for that source revision, plus the receipts it derives from. Unknown must stay visible as unknown rather than being rounded into a total. (`computeCostReport` implements and manually proves the estimated/actual/unknown/receipts shape from a ledger; the final export's `report.json` now carries it (`cost`, from `production.json`, null when the project has no ledger). It is project-wide; the cost of one revision is reported by `computeReuse` from receipts matched by generation key. Accepted by the owner as untracked for the free, hand-made Kore pilot.)

**Rights and subscription assumptions, recorded 2026-09-16:**

- **Renderer (Remotion 4.0.521):** dual free/company license (`LICENSE.md` bundled with the package). Individuals and small companies may use it commercially for free; a company license is required past a size threshold Remotion defines. Fatih's current individual use falls under the free tier — recheck this if NaraFrame is ever operated on behalf of a larger organization.
- **Browser/FFmpeg (Chrome, FFmpeg/FFprobe):** system-installed local binaries orchestrated for local rendering only, never redistributed as part of a build artifact. No additional obligation beyond their own end-user terms for local use.
- **Font:** the only non-system font in use is the M0.10 LBC placeholder — a macOS system font (Trebuchet MS Bold) copied only into that local project's `assets/profile/`, never redistributed publicly. This is an explicit technical placeholder, not a cleared product choice; a real display face and its licence must be chosen before any public/commercial release (already flagged at the M0.10 exit gate).
- **Voice (TTS), update 2026-09-19:** the owner generated the M1.2 pilot clips by hand in Google AI Studio (Gemini TTS, voice Kore) in the free tier. NaraFrame made no API call and holds no key. Google's terms for commercial use of generated audio, and paid pricing, have not been reviewed and must be recorded here before any published video or automated call. Original entry: no real vendor is integrated. Only the offline `createFakeTtsProvider` exists, which makes no network call and has no rights implications. When a real vendor is chosen, its terms over synthesized audio (ownership, commercial-use scope, and its actual per-character/per-minute pricing) must be recorded here before the first real paid call is authorized.
- **Images/illustration:** no paid generation service is integrated; current samples use only local/system assets.
- **Host subscription assumption:** none is currently in effect for any provider. This is a deliberate default, not an oversight: a pre-paid subscription's included quota does not make a generation call free to authorize, because consuming that quota is itself a real cost (it can exhaust the quota, trigger overage billing, or crowd out other use). Concretely, this is already enforced in code, not just written down: `ReceiptAuthorizationSchema` (`packages/core/src/schema/production.ts`) makes `authorization` a required field on `Receipt`, so `requestReservation` (`packages/core/src/production/ledger.ts`) cannot construct a receipt — reserved or otherwise — without recording who granted it and when. There is no "no-new-spend" bypass path in the ledger.

### M1.2 — Block timeline, captions, and voice continuity

- [x] Implement ordered story blocks, probed clip durations, local phrases/optional words, pauses, stable IDs, source-text/settings bindings, and derived global offsets. (`NarrationSchema` and `resolveNarrationTimeline` cover blocks, phrases/words, pauses, planned blocks, and derived offsets. `importPreparedAudio` now measures duration with ffprobe and stores the clip content-addressed; mp3/wav/m4a assets are ready/planned manifest kinds with hash verification at load. Ready audio assets may record `generation.textSha256` (and an optional `voiceStyleSignature`); `compileDraft` then refuses `STALE_VOICE` when the block text no longer matches the spoken text, `VOICE_STYLE_MISMATCH` when the profile's voice style changed, and only warns `VOICE_BINDING_MISSING` (with the hash to bind) for prepared audio that predates the binding. Whitespace-only edits are ignored. Covered by `voice-binding.test.ts`.)
- [x] Compile complete scene partitions with natural gap ownership and sample-safe final coverage. Adapt exclusive frame ends for inclusive renderer APIs; reject zero-frame intervals. (`partitionScenes` does the partition, shared rounded boundaries, ceil final end, and zero-frame rejection. Scenes carry a `narration` reference and `compileDraft` derives frame ranges and audio clips from the narration clock; the renderer plays them. Narrated Krakatau build: 1134 frames = ceil(37.8 s × 30). Covered by `compile-draft-narration.test.ts`.)
- [x] Implement phrase captions and attributed display corrections separate from intended speech. Long phrases without words wrap/display whole; guessed split timing is draft-only. (`deriveCaptionCues` and `CaptionsSchema` produce stable-id cues with attributed corrections; no split timing is ever guessed. Cues are now compiled to frames, drawn by the renderer inside the safe zone above the draft label, and checked by visual preflight: `CAPTION_OVERFLOW` when a cue needs more lines than `render.captions.maxLines`, `CAPTION_COLLISION` when scene text sits in the caption zone, and `FONT_NOT_LOADED` for the caption font. Style comes from the optional profile `render.captions` (fontSize, maxLines, bottomOffset; defaults 44/2/24 design px). Scoped previews omit captions until M2.1. Covered by `caption-preflight.test.ts` and the caption cases in `compile-draft-narration.test.ts`. Limitation: long sentences need small type or several lines because phrases are whole sentences; word-level splitting is not attempted.)
- [x] Prove the spec example starts at 0/2700 ms, totals 4500 ms, and a 3000 ms first clip moves block two to 3300 ms without replacing its media/timing.
- [x] Produce three voice blocks and replace the middle one. First/third hashes remain; listen across both joins and compare natural continuity with a complete-utterance sample. Explain any neighbor regeneration and budget impact before doing it. (2026-09-19 pilot with Google AI Studio TTS, voice Kore, clips generated by the owner in the free tier so no NaraFrame ledger spend: three blocks plus a replacement middle block; the revised build changed only the mechanism audio, kept the opening and impact clips byte-identical, and shifted impact by +960 ms. Fatih listened to both joins and accepted the audio as natural, with no neighbor regeneration needed. Earlier local-voice trial for reference: macOS `say`/Damayanti, zero cost: mechanics proven — deterministic output, replacing only the middle block changed only its hash, and measured durations shifted block C from 9850 to 10350 ms. Fatih listened to both joins and found the voice stiff with little intonation and no significant difference between the versions. That is expected and inconclusive: `say` voices phrases independently, so a neighbor's prosody cannot depend on the edited block. The natural-continuity question remains open until a context-aware vendor voice is tested.)
- [x] Test reorder, 1000 ms pause, 300 ms breath gap, caption spelling, and last sample coverage. Synthetic scheduling tolerance: at most one frame at 30 fps; listening separately establishes perceived sync/prosody. (Covered by `narration.test.ts`, `scene-partition.test.ts`, `captions.test.ts`; frame boundaries are exact integers here.)
- [x] Implement checkable source provenance for factual claims. A block or scene marked as carrying a factual claim must reference a declared source entry; `SOURCE_MISSING` blocks publication when the active profile requires sourcing. (Block-level `checkProvenance` is implemented: `SOURCE_MISSING` is an error when sourcing is required, else a warning; `SOURCE_UNKNOWN` is always an error. The profile `requireSourcing` flag exists (`current-issues` sets it) and `compileDraft` runs the check. Scenes can also be marked `carriesFactualClaim` with `sourceIds`; sources are declared once in `narration.json` or `scenes.json` (the union is used, a duplicate id is `SOURCE_DUPLICATE`), so a claim shown on screen in a silent project is as accountable as a spoken one. Manually proved on the Kore sample and covered by `scene-provenance.test.ts`.) The `current-issues` profile direction already demands separating confirmed facts from estimates, so enforce that as a contract instead of prose the agent may ignore.

### M1.3 — Revisions, preview, and final export

- [x] Implement `edit <project> --from <staging-dir> --expect <revision>` and `undo <project>` with one writer, immutable snapshots/current pointer, stable conflict errors, durable media, and append-only receipts. (Core in `packages/core/src/revision/`: content-addressed blob store under `revisions/objects`, immutable `revisions/<sourceRevision>/revision.json` with parent, summary, and kind, atomic `revisions/current.json`, a project lock that recovers from dead owners, `editProject`, `undoProject`. `production.json` is never part of a snapshot, so receipts and spend survive undo. CLI: `edit`, `undo`, and `status` reports the revision state. Manually proved on the Kore project by staging `narration-revision.json` through `edit`: baseline captured automatically, `REVISION_CONFLICT` exit 1 on a stale `--expect`, `undo` back to the original source revision, then `NOTHING_TO_UNDO`. Covered by `revisions.test.ts` (18) and `revision-commands.test.ts` (5).)
- [x] Detect direct JSON edits before preview/render/mutation, capture valid changes, and preserve invalid/uncommitted files for repair. A stale snapshot must not silently stand in for failed manual edits. (`syncWorkingCopy` runs under the lock before `edit`, `undo`, and `preview`: valid direct edits become a `manual-capture` revision; an invalid working copy is never captured and `undo` first copies its files to `revisions/recovered/<time>/`. Preview selections are stored per revision outside the immutable snapshot.)
- [x] Separate sourceRevision, generationKey, sceneRenderKey, assemblyKey, and approval identity. Do not include operational receipts in source snapshots or pixel keys. (`generationKeyForBlock` = spoken text (whitespace-normalised) plus the profile voice style, used as the receipt `requestKey`. `computeSceneRenderKeys` hashes a scene's own content, the assets and fonts it uses, the pixel-relevant profile subset, captions and narration audio overlapping it, and its timing relative to the scene start, so moving a scene in time does not invalidate it; the lint-only `variety` policy is excluded. `assemblyKey` is now built from the ordered scene keys with their placement, the narration mix, captions, and export format instead of `sourceRevision`, so a change that cannot alter the render, such as adding a source register, leaves it unchanged. Runtime (browser/FFmpeg) is not yet part of the keys; builds record it in their manifest. Approval identity is `{sourceRevision, assemblyKey, previewBuildId or explicit autonomy, scope, timestamp}`, an append-only log per source revision under `revisions/approvals/`, and never carries to another revision. Covered by `identity-keys.test.ts` and `production-readiness.test.ts`.)
- [x] Deliver production validation, full preview, caption/audio preflight, and H.264/AAC final export from one captured source revision. Review current preview or use explicit autonomous-export authorization. (`validate --stage production` compiles the project at the design format and checks production readiness: narration is required, every asset a scene uses is ready, and a missing text-to-audio binding is an error rather than a warning; the audio preflight probes each clip and rejects unreadable audio or a length that differs from the declared block by more than 60 ms. `render <project>` needs exactly one approval: `--approve-preview <build-id>` for a full narrated preview of the current source that the owner reviewed, or `--autonomous --authorized-by <name>` only when the owner explicitly authorised export without review. It syncs the working copy into a revision first, records the approval, renders at 1080x1920 with no draft label, verifies H.264, AAC, dimensions, frame rate, duration and full video and audio decode, then publishes `output/builds/<id>/` with `final.mp4`, `report.json` (runtime, approval, cost report, preflight) and `manifest.json` (hashes) and switches `output/current.json` last. Real export of the Kore project: 1080x1920, 30 fps, 1134 frames, 37.845 s, H.264 plus AAC 48 kHz, 5.2 MB, no draft label; its stand-in image and synthetic figures were in a temporary directory only. Editing the source afterwards marks the export stale and the old preview approval is refused (`APPROVAL_PREVIEW_STALE`). Also fixed: ready `wav` and `m4a` audio assets were compiled as images and never played. Covered by `render-command.test.ts`, `final-publication.test.ts` and `production-readiness.test.ts`.)
- [x] Inject staging and build-promotion failures; test caption undo, voice undo retaining spend, and stale expected revision. Preserve audio/media and referenced preview selections. (Staging failures for edits are covered in `revisions.test.ts`: invalid staged source, unsafe or empty staging and a stale expected revision leave the accepted snapshot and working copy unchanged. Final build promotion is covered in `final-publication.test.ts`: an injected failure before the pointer switch keeps the previous export current, and tampered artifacts, mismatched metadata, unlisted files, missing or corrupt audio, wrong dimensions and an existing destination publish nothing. Voice undo keeping spend is covered by the production.json test in `revisions.test.ts`.)
- [x] Report a reuse ratio for every revision: what share of voice clips, images, and rendered scenes survived unchanged, and what the revision cost against a full regeneration of the same project. This number is the practical claim the tool makes, so it must come from receipts and artifact hashes, not from an estimate. (`computeReuse` compares a revision with its parent: voice clips and images by asset hash, rendered scenes by scene render key, cost from receipts matched by generation key. Cost is a recorded actual only; a timed-out request stays `unknown`, audio with no receipt stays `untracked`, and no ratio is produced unless every block is tracked. `edit` prints and returns it, and `status` includes it for the current revision. On the real Kore revision (mechanism voice replaced): voice 2 of 3 unchanged, scenes 3 of 4 (the `impact` scene survived a 960 ms shift), overall 75 percent; with no `production.json` the cost is reported untracked. Cost figures in the proof were synthetic and only in a temporary directory. Covered by `reuse.test.ts`.)

**Exit gate:** A real narrated pilot and spoken revision pass NF-AC-11/12/14, with current source/build/approval provenance, a cost report, and a measured reuse ratio. A silent draft or missing-capability report cannot satisfy M1. Full final encoding may rerun; upstream voice/image reuse is the cost requirement.

**M1 exit gate — passed with owner-scoped cost exception, 2026-09-20.** Fatih accepted final export `115247388b67-98323b06-dd5` and untracked cost for the free, hand-made Kore pilot. Recorded evidence in `work/kore-pilot`: baseline revision, middle-block spoken edit (voice 2 of 3 and scenes 3 of 4 retained; exit record reports overall 78 percent), production validation, previews A/B reviewed for narration/captions/timing, and approval of preview B. Final: 1080x1920, 30 fps, 1163 frames, 38.827 s, H.264 plus AAC 48 kHz, 5.4 MB, full decode OK, zero preflight issues, source `e9ca16b70a`, approval bound to preview `54c312e59358-476d1dd5-8ec`, rendered in 81 s. `cost: null` remains untracked because the audio was prepared outside the ledger; receipts-based cost-versus-full-regeneration proof remains M3.3. Acceptance of this functional pilot did not establish the desired illustration/motion quality. That visual gap now has an explicit M2.4 gate. The earlier sentence saying the owner had not accepted this final is superseded by the recorded acceptance, not a remaining M1 blocker.

## 7. M2 — Reference scenarios, profiles, and scoped preview

**Goal:** Demonstrate the same architecture across two independent projects and one derived identity-switch variant.

**Consumes:** M1 source transactions, production accounting, block timeline, render/cache keys, and one working voice route.
**Produces:** Production-ready scoped preview, reversible profile apply, music/SFX, justified recipe/media growth, three acceptance scenarios.

### M2.1 — Scope-aware preview and artifact reuse

- [x] Implement selected ready-scene dependency closure including shared assets/audio/transition handles. Missing unrelated scene production assets are reported separately, not blocking selected preview. (`computeSceneClosure` names a scene's assets, its block and audio, and the previous scene whose transition plays inside it. `preview [--scene <id>]` without `--draft` and `validate --stage production --scene <id>` check only that closure; other scenes' planned assets or unrecorded blocks come back as `info` (`OUT_OF_SCOPE_*`) and never block. A preview of one narrated scene now has its own timeline: the block clip is trimmed to where the scene starts (`trimStartFrames`), captions are shifted, the previous scene's transition handle (`transitionIn`) and `hasNextScene` are carried on the scene, and a scene has the same render key alone as inside the project. Before this, a scoped narrated preview used the whole project's frame count and global audio offsets.)
- [x] Test ready scene 2 / missing scene 7: selected preview succeeds and final fails. Unknown earlier block durations produce local timeline scope with unknown global offset, never invented timestamps. (`render-command.test.ts` and `scoped-preview.test.ts`: a ready scene passes while the last scene's image is planned, the whole project and `render` fail with `ASSET_NOT_READY`, and with an earlier block unrecorded the later scene previews on a local timeline whose scope frames are `null`, while the unrecorded scene itself is refused with `SCENE_BLOCK_NOT_READY`. This also fixed a validation bug: a scene naming a phrase of a planned block was rejected, so such a project could not load.)
- [x] Check caption/style-only edits make no generation calls and preserve unrelated scene keys. Notes can invalidate editorial approval without re-rendering identical pixels. (`pendingGeneration` lists only blocks with no audio, changed text or changed voice style; `edit-scope.test.ts` shows caption corrections, caption style, layout and note edits list nothing, keep every voice `generationKey`, and change only the scenes they touch. A scene `note` changes the source revision but not the assembly key. `preview` reuses the pixels of an earlier build with the same assembly key, scope and runtime: on the Kore pilot a note edit produced a new approvable build in 1 s instead of 70 s, with the same video hash and `reusedFromBuildId`, and the earlier approval was refused for the new source. `--rerender` forces a real render; `owner-flow` uses it so its determinism check still renders twice. Covered by `preview-reuse.test.ts` (e2e).)
- [x] Add cache clean limited to disposable computed artifacts. Retained source media, history, receipts, and selected builds survive. (`cache clean [project] [--dry-run]` removes leftover attempts, the diagnostic `compiled.json`, and preview builds that nothing points to. It keeps the current preview, builds selected for a revision or reviewed for an approval, every final export, source and media, `revisions/`, and `production.json`; it does not follow symlinks and refuses while the project lock is held. Covered by `cache-clean.test.ts`.)

### M2.2 — Profile apply and visual/audio growth

- [x] Implement profile inspect/dry-run/apply using the M1 transaction system. Diff render/production/editorial effects and existing overrides; preserve allowed overrides, block unresolved conflicts, never silently reset locked values. Evidence: `profile-apply.test.ts`, `profile-command.test.ts`, `project-overrides.test.ts`.
- [x] Permit schema-valid apply as needs-production when voice/assets become stale. Final remains blocked until replacements are ready. Undo restores the old profile/media while retaining any incurred cost. Evidence: `VOICE_STYLE_MISMATCH` is a draft warning and a production error; `status.needsProduction`; undo test in `profile-apply.test.ts` (cost lives in `production.json`, outside snapshots).
- [x] Direct profile editing/clone supports future defaults; project overrides affect the current project. No new profile GUI is needed.
- [x] **Historical M2.2 recipe decision:** no dedicated domain recipe was shipped. The named Krakatau `context` defect was a 1040 px `map-panel` with 345 px (33%) of unused lower space. `PANEL_DEAD_SPACE` and `visual-preflight.test.ts` demonstrated a warning and a corrected sample. This is evidence of that layout repair, not proof that the wider illustration/motion complaint was solved. A blanket six-recipe commitment remains unnecessary; M2.4 instead adds capabilities justified by the Medan benchmark. Aesthetic dead-space warnings must not prohibit intentional negative space.
- [x] **Historical M2.2 motion/media decision:** no new motion/transition recipe or SVG/video support was shipped; WAV soundtrack decode preflight was enabled. This closes the original scoped investigation only. The old requirement that visual growth must first have a catching compiler check is withdrawn. SVG/path, camera, and object motion now have a named reference and explicit M2.4 tasks; video formats remain outside this insertion.
- [x] Add one optional music track plus SFX, volume/loop/trim/fades/ducking; verify decode, intelligibility, and no timeline-duration changes from transitions. Progress: schema, compile (fades, ducking windows, scene-anchored SFX), assembly key, renderer mix, decode preflight, masking warning and no-duration-change tests done (`soundtrack.test.ts`, `soundtrack-gain.test.ts`); checked by a real render in `soundtrack-mix.test.ts` (e2e, 214 s): real Kore narration, synthetic bed and effect; ducked music is 0.25x the flat level under speech, both ends fade, the effect lands in its scene, length unchanged. Samples stay outside git, so the test skips where they are absent. Intelligibility is checked against the files themselves, not the declared numbers: `preflightSoundtrackAudio` measures the track's and the narration's mean level and warns when music under speech is within 6 dB of the voice (`MUSIC_MASKS_NARRATION`) or more than 20 dB below it (`MUSIC_INAUDIBLE`). Thresholds come from the owner's own material: narration averages -16.7 dB; a first demo mix sat 26 dB under it and he reported hearing neither the fades nor the ducking; the corrected mix sat 12 dB under it and he confirmed both. `soundtrack-loudness.test.ts` pins both mixes, and a preview of the quiet project reports the warning.

### M2.3 — Two source projects and one variant

- [x] Build `test-fixtures/project-current-issues/` and `test-fixtures/project-general-explainer/` as independent source projects. Both validate at production stage and render; `test-fixtures/README.md` documents how the images, music and narration are regenerated. Narration is real speech (macOS `Damayanti`) whose phrase timing is measured by `importPreparedAudio`, not estimated.
- [x] Current issues exercises map/timeline/diagram-composition/captions/music/SFX and dated factual source review. The second exercises media/stat/list-comparison/composition without globally inheriting current-affairs rules. The second project has its own profile (`test-fixtures/profiles/general-explainer/`), which carries no current-affairs direction and does not require dated sourcing.
- [x] Use `test-fixtures/profiles/contrast/` to derive the profile-switch variant; it is not the user's next public niche. The variant is derived in the e2e test rather than committed, so the switch itself is the evidence.
- [x] Both projects and the variant preview/render without executable per-project code. Review profile distinction, layout, audio, and source/asset invalidation. Evidence: `packages/cli/test/e2e/reference-projects.test.ts` (3 scenarios, 203 s) — both projects validate at production stage and render; the variant's dry run changes nothing, the apply reports all three voice blocks as `voice-style` in `status.needsProduction`, the draft re-renders without reuse, final is blocked by three `VOICE_STYLE_MISMATCH` errors and nothing else, and undo restores the previous fingerprint and clears the report.

**Four defects the reference projects exposed, all fixed here.** (1) The contrast check compared every text layer against `palette.background`, so dark type on a light panel was reported as failing; it now reads the opaque rectangle painted under the text. (2) A production report repeated one finding up to three times, because the draft compile, the final compile and the readiness escalation each carried it; `dedupeIssues` keeps the most severe copy. (3) Captions drew dark profile type on a hard-coded black scrim, which is unreadable under a light profile; the scrim is now the profile's own background. (4) Scene colours could only be literal hex, so a profile switch repainted the type and the page but left every rule, panel and marker in the old palette; `palette.*` tokens in `fill` and `color` resolve at compile time (`palette-tokens.test.ts`), and the variant's timeline rule and panels now follow the profile.

**Exit gate: met.**

- **NF-AC-03** — three scenarios in `reference-projects.test.ts`, real renders, 203 s.
- **NF-AC-08** — editing a profile leaves a project alone until `profile apply`: the dry run changes nothing (asserted on the compiled fingerprint), a locked override blocks the apply, and the effects and kept/reset overrides are read back from the project's own files (`profile-apply.test.ts`, `profile-command.test.ts`, `project-overrides.test.ts`).
- **NF-AC-13** — scoped preview, reuse and build integrity carried over from M2.1 (`scoped-preview.test.ts`, `preview-reuse.test.ts`, `final-publication.test.ts`), with the reference projects now exercising the same paths on real source.
- **Capability/media registry** — `capabilityRegistry()` is read from the schemas that accept each form, published in `naraframe schema` alongside them, and `capabilities.test.ts` fails if a form is advertised without evidence or appears in both the supported and unsupported lists. SVG, video and JPEG stay listed as unsupported with their reason.

No source `examples/` directory is needed.

### M2.4 — Visual storytelling and Bang Motion benchmark

**Status (2026-09-28):** closed for its technical scope with M2 (see "M2 technical closure"). The NF-AC-16/17 visual and publication gates and export are not passed; they are tracked as D-VIS. Earlier status (2026-09-27): M2.4.1–M2.4.5 technical work integrated, visual gates and export deferred, M2.4.5-F1 in progress. M2.3 remains delivered, and M3 is held. The first M2.4.1 attempt's owner rejection stays on record.

**Goal:** Recover reference-fidelity on one opening, prove immediate transfer to a distinct topic, then earn the full Medan benchmark and LBC revision gates. Reuse working visual foundations rather than inventing a weaker replacement while expanding infrastructure.

**Consumes:** Existing CLI/core/Remotion/skill, source revisions, profiles, retained local assets and narration.
**Produces:** A reusable illustrated-shot foundation and editable source data, accepted opening and early LBC proof, then full story/revision evidence. Future GUI editability is retained without a universal animation schema prerequisite.

#### Live tracker and evidence rules

| Task | Expected inspectable output | Status |
|---|---|---|
| M2.4.1 | Font/SVG recovery; matched frame and 2–3s motion study; reference-fidelity 6–10s Medan opening | INTEGRATED — opening owner-approved 2026-09-21 (build `536f182ba54b-d7c57043-698`); exit overlap fix after supervisor review; verify + E2E passed on the final candidate; squash-merged via PR #12 (2026-09-26) |
| M2.4.2 | Distinct 6–10s LBC opening on frozen engine/skill; headline/camera edit and undo | INTEGRATED — early transfer TECHNICALLY_READY 2026-09-26, squash-merged via PR #13; rich-text span defect open as a separate small task |
| M2.4.3 | River-history framing, shipping route, moving ships and population/data explanation | INTEGRATED — squash-merged via PR #15 (2026-09-27) after supervisor technical sign-off (serial E2E 9/9 on `94fe4b0`; later commits documentation only) and Fatih's visual approval and merge authorisation. Earlier 8/9 runs and the open repeatability/timeout questions are kept in the handoff record; follow-up issue #16. Project `work/visual-parity/medan-story`; "ke-4" claim blocked for publication |
| M2.4.4 | Approximately 67.5s Medan, full reference comparison and approved export | TECHNICAL PART INTEGRATED via PR #17 (`cf9411f`, 2026-09-27): ten scenes, production-ready preview `18a2906ac565-9566e37d-8e1`, count-label limit. **Not complete:** the NF-AC-16 visual gate, further comparison/polish and the approved export stay DEFERRED by owner decision; the spoken "ke-4" claim still blocks publication |
| M2.4.4b | Spatial authoring guide and timing diagnostics (inserted 2026-09-27 by the priority change; before M2.4.5) | INTEGRATED — squash-merged via PR #18 (2026-09-27) after supervisor TECHNICALLY_READY FOR MERGE on head `30d5e4b` and Fatih's approval; the merge adds only this handoff documentation. Separate follow-up: shared-fixture test isolation (unproven race, not fixed) |
| M2.4.5a | B1 correction outside the frozen trial (approved by Fatih 2026-09-27, option a): soundtrack-only full draft preview publishes with its AAC audio | CLOSED / INTEGRATED — PR #19 squash `159ed08`, verified 2026-09-27. Reviewed implementation unchanged; task branch deleted locally/remotely, main synced. M2.4.5 retrial requires a separately recorded new freeze |
| M2.4.5 | Frozen end-to-end authoring/revision trial on a copy of the LBC project (rescoped by Fatih 2026-09-27): short example, headline/camera/object/profile revisions, undo, asset/audio reuse | CLOSED / INTEGRATED for the bounded technical scope — retrial on freeze 2 (`159ed08`), documentation squash-merged via PR #20 (`44d172e`), closure verified by the supervisor 2026-09-27. Public revisions/undo and independent artifact/hash audit accepted with recorded gaps. Attempt 1 BLOCKED_CONFIRMED on `f065e4d`, kept unchanged. Technical trial only; NF-AC-17 visual/publication judgement and export stay DEFERRED; findings F1–F5 recorded |
| M2.4.5-F1 | Contrast diagnostic against the actual backdrop (Fatih's choice 2026-09-27; retrial finding F1) | CLOSED / INTEGRATED — closure verified by the supervisor 2026-09-28; PR #21 (`4298f3a`) squash-merged into `main` on Fatih's approval (2026-09-28) after supervisor TECHNICALLY_READY FOR MERGE on head `9b705eb`. The recorded serial E2E 10/10 tested the pass-2 candidate; pass 3 was accepted on focused tests, verify and unchanged reference diagnostics. F2–F5 not started |
| M2.4.5-F2 | Layout feedback after a profile change (Fatih's choice 2026-09-28; retrial finding F2) | CLOSED / INTEGRATED — PR #22 squash-merged as `93c0a67` on 2026-09-29 after supervisor sign-off and Fatih's standing merge authorization. Skill guidance, compile-time `IMAGE_MASK_INVALID`, overflow-message hints; shared-fixture flake fixed alongside. D-VIS remains open and M3 not started |

Task IDs are unchanged. Former M2.4.2 camera/world work moves into M2.4.1 where indispensable for the opening and M2.4.3 for river-history expansion. Former route/data work remains in M2.4.3. Early LBC is now M2.4.2; full LBC remains M2.4.5. No full acceptance obligation is dropped.

Update the owning checklist only with command/artifact evidence and the required owner decision. Record source revision, engine/skill revision, build ID, paths/hashes, internal corrections, checks, limitations and next action. Technical implementation and visual approval are separate states. Do not repeatedly read all milestone history or dump all schemas for an ordinary edit; use the active handoff, relevant schema subset and targeted source.

**Baseline:** the owner's read-only Medan directory is recorded in the historical handoff below and `docs/refine-spec.md` section 12. Source declares ten parts, 67.5s and 1080 × 1920. The supplied 8.9-second screen recording has now been sampled at 2 fps, establishing opening design and the city-to-newspaper sequence, not full playback, exact timing or phrase alignment. The original prompt and total effort remain unavailable. Do not bypass browser restrictions; full-story parity still requires full reference playback.

#### Implementation contracts shared by the five tasks

- Keep public authoring through the existing CLI and source artifacts. Extend `scenes.json`/profile/manifest and their compiled representation additively; no new executable project format or parallel timeline authority.
- Preserve legacy version-1 defaults and coordinate interpretation. Nested groups/composition instances use explicit local transforms and stable IDs; reject cycles, duplicate ownership, and unresolved targets. Reusable definitions are source data, not opaque rendered clips.
- Treat imported SVG as passive data: reject scripts, handlers, `foreignObject`, built-in animation, unsafe embedded content, and external references. Validate local gradients/clipping and isolate asset-local IDs. Independently moving illustration parts are separate objects. Profile-linked vector colours use explicit token bindings rather than silently repainting literal artwork colours.
- Separate world content from screen overlays. Evaluate nested transforms, camera framing, parallax, and motion from a shared frame-derived model used by rendering and preflight. Do not report intentionally off-camera scenery as clipped required text.
- Sequential motion keeps resolved end states; overlapping writes to the same property/target fail explicitly. Independent properties may animate together. All poses, including a selected scene's first frame, must be available without playing earlier frames.
- Phrase anchors resolve inside the existing narration clock; local scene timing remains supported. Text stagger without word alignment is decorative. Transitions never extend or shorten narration. Any neighbour world/asset/transition state needed by a scoped preview belongs to its dependency closure and render key.
- Rich-text measurement must use the same font-role/span/highlight layout as actual rendering. Preserve required-text collision/overflow/minimum-size checks; do not introduce unbounded shrink or layout changes caused by animated text splitting.
- Include shared compositions, vector hashes, resolved fonts, camera, motion, and transition dependencies in scene/assembly keys. Bump `RENDER_ENGINE` for pixel-changing renderer work. Preserve unrelated media generation keys; final encoding may still rerun.
- Keep aesthetic rules advisory by default. Preserve existing explicit owner/profile restrictions; changing their locked values is a visible profile revision, not a silent migration. Capability publication follows successful source-to-render implementation and focused tests.
- Reuse local assets and the supplied audio; no new generation spend by default. Bundle fonts locally with recorded rights rather than importing the reference's CDN runtime. `@remotion/paths`, if added, belongs only to the renderer and uses the project's exact Remotion version. See [path drawing](https://www.remotion.dev/docs/paths/evolve-path) and [path positions](https://www.remotion.dev/docs/paths/get-point-at-length).
- No GUI, map service, general 3D engine, arbitrary TSX/JS, silent-final-export feature, or unrelated billing/provider work. The schema should support a future GUI without asking current users to author its details.


**Reference-first additions (NF-PR-10).** Adapt proven camera/world/object/typography mechanisms into trusted versioned renderer components or recipes. Keep project content and choreography as editable data with stable IDs. No Medan-specific renderer conditionals, embedded reference player, arbitrary project HTML/TSX/JS, or flattened reference-video/image workaround. Record exact upstream revision, adapted sections, asset/font provenance and applicable license terms. Preserve reference artwork, typography, framing and choreography for the controlled fidelity comparison; disclose unavoidable conversions. New visual identity is tested separately with LBC.

**Recovery additions.** Preserve permitted SVG root paint, text and local gradients/clips or reject unsupported constructs explicitly; reject every external URL form, including wrapped paint URLs. Prove bundled face/weight readiness in actual render contexts, not only metadata or mocked measurement. Deliver the minimum coherent camera/world/object path the opening requires; do not force long reveal fades or tiny scale presets merely because they already exist.

**Iteration and cost boundary (NF-CO-02).** First show a frame and short motion study, then the full opening. Allow at most two internal visual correction passes per checkpoint; if still inadequate, report the artifact and exact blocker instead of widening the engine silently. Keep separate development, content-authoring, owner revision, and render/verification records. Log actual host/provider token/cost evidence when available; otherwise unavailable, never zero or bytes converted to guessed tokens. Count owner actions separately from agent CLI calls. No telemetry service, new cost promise, or paid generation default.

#### M2.4.1 — Recover and prove the reference-fidelity opening

**Primary areas:** existing SVG sanitizer/loader and targeted regressions; Remotion font readiness, layer/transform/motion evaluator and shared preflight; scene/profile contracts only as needed; `skills/naraframe/SKILL.md`; ignored benchmark source/assets. Implement the smallest end-to-end illustrated-shot path, not a broad schema catalogue.

- [x] Preserve the rejected source/build, existing branch changes and historical handoff. Record recovery starting revision; inspect relevant code instead of reimplementing working parts. No stash/drop/reset of unrelated work. Done: rejected build `5d3b28594596-96b47423-ac5` and all checkpoints preserved; no stash/reset of task work.
- [x] Repair confirmed SVG root-paint/text-loss/external-paint-URL defects and actual-frame font readiness. Validate permitted local gradients/clips and separate asset IDs. Add bounded regressions for these known failures after the real fix works; do not wait for a full benchmark to protect safety. Done: shared root/child validation, XML text fidelity, render-context font readiness with `FONT_NOT_LOADED`, regressions in `svg-sanitize.test.ts` and `font-readiness.test.ts`.
- [ ] Complete accessible reference playback for the opening (0–6.4s), record matched moments, ten-part baseline and source/audio hashes; listen before claiming phrase alignment. Preserve original inputs. Identify the concrete visual mechanisms and provenance to adapt. **Open at integration, carried forward:** hashes, ten-part baseline and measured silence boundaries are recorded, but the only playback is an 8.9 s recording that starts after title entry, so 0–6.4 s was not fully watched and no phrase alignment was claimed by listening.
- [x] Revise skill art direction around working shot patterns: statement → explanatory object/action → framing/type → movement/continuity. Preserve the reference look for this controlled trial; normal profiles give defaults, not unwanted generic-card constraints. Keep ordinary context/discovery compact. **Open at integration, carried forward:** the skill's art-direction step from the first attempt stayed unchanged through recovery and does not describe camera moves, world planes, `transform` or `exit`; those are discoverable only through `naraframe schema`. The skill is frozen as-is for M2.4.2, so the trial also tests authoring without that guidance. **Closed 2026-09-28 by reference:** M2.4.4b (PR #18) added the skill's "Space, camera and timing" section, which covers camera moves, world and overlay planes, `transform`, `follow` and `exit`. It was used by the fresh-context trial and the M2.4.5 retrial.
- [x] Adapt the needed trusted Remotion primitives/recipe and minimum editable source inputs, including actual object travel/exit and coherent camera/world/overlay if required. Bundle licensed local fonts/assets; do not substitute weaker handmade art without explicit reason or ask the user to author schema details. Done: camera moves, world/overlay planes with parallax, `transform` and `exit` beats; local OFL Fraunces/Space Grotesk.
- [x] Show one matched keyframe and a 2–3s motion study, with the reference beside it where accessible. Produce the study via the existing preview route on a short source scope/project; it is a diagnostic checkpoint, not a new CLI command or a substitute for public-CLI acceptance. After at most two internal corrections, present it for Fatih's visual direction review; do not extend the full shot while this direction is rejected. Done: static frame and study build `67cb9fb19695-51ffa299-f9b` accepted by Fatih (2026-09-21).
- [x] Produce the 6–10s `opening` through the exact command below (reference length 6.4s). Inspect actual video and matched frames at equivalent size, including real fonts, depth/framing, opaque object movement and within-shot continuity. Obtain Fatih's no-worse assessment of relevant dimensions before closing the opening gate. Done: build `536f182ba54b-d7c57043-698`, 6.4 s, approved by Fatih 2026-09-21 as an overall approval ("approve dari aku"), not a per-dimension table. Rendered by the same CLI via the pinned Node because ambient `pnpm` was unavailable.
- [x] Complete focused source-to-render, legacy coordinate, font/span/overflow, SVG safety/fidelity, sequential pose/conflict, scoped/full and cache-version checks for changed boundaries. Run `pnpm verify` before integration and serial renderer E2E where changed font/vector/render-runtime boundaries require it. Stop with failures recorded, not repeated-until-green evidence. Done: `pnpm verify` (214 unit, 240 integration) and serial `pnpm test:e2e` (9 tests) passed on the final candidate before PR #12.

**Command acceptance:** `pnpm naraframe preview work/visual-parity/medan --draft --scene opening --json`

**Expected:** recognisable reference-quality city artwork, correct typography, deliberate framing and meaningful camera/object movement. No generic replacement blocks, long fade-as-travel workaround, or improvement judged only against the rejected attempt. Fidelity is not originality or generalisation. Full-video “at least two better” remains M2.4.4; no claim of full NF-AC-16 completion here.

#### Active handoff — M2.4.4

**Integration decision — 2026-09-27.** Fatih authorised the supervisor to accept and merge PR #17. Reviewed head `4ba62481ee83d472e9c33efb156cd881cd82bab0`: four scoped files, no renderer/skill changes or generated artifacts. The only follow-up amendment is this tracker clarification. PR #17 is the authoritative merge record; M2.4.4b starts from its merged main, not from an unmerged task branch. Earlier statements below about awaiting merge permission or uncommitted work are historical. No visual/export acceptance is implied.

**Fresh integration verification:** pinned Node 24.20.0 and pnpm 12.3.4 `run verify` exited 0: Biome checked 155 files; typecheck/build passed; 238 unit and 263 integration tests passed. The first invocation accidentally selected the bundled pnpm/runtime and aborted before tests on a module-purge confirmation; no dependency changes were made, and the successful run used the explicit cached pinned pnpm entry point. Full renderer E2E was not repeated for this schema-only boundary extension, as accepted in the bounded review. The separate Miss Ayu worktree and old stash remain out of scope.

**Supervisor status: TECHNICALLY_READY for owner visual review — 2026-09-27.** No blocking runtime defect found in this bounded review. This is not NF-AC-16 acceptance, final-export approval, milestone completion or Git integration authorisation. Only this handoff was edited; engine, project data and Git state were not changed.

**Independently checked:**

- Tracked package/skill diff contains only count prefix/suffix limits 24 → 48 in source and compiled schemas plus two source-schema tests. Renderer/skill files are unchanged; retaining `naraframe-draft/10` is justified. The handoff records the gap as preceding implementation, but temporal ordering and the implementer's mutation/bite check cannot be independently established from an uncommitted diff.
- Three focused files passed **34 tests** (visual schema, M2.4.3 compilation and count formatting). Additional direct probes of both `BeatSchema` and `CompiledBeatSchema`: prefix and suffix lengths 24/25/48 accepted, 49 rejected. The actual facilities prefix is 25 characters. Retained regression tests currently exercise source prefix only; add the same bounded suffix/compiled cases before integration rather than a broader test campaign.
- Public CLI `validate work/visual-parity/medan-story --stage production --json` exited 0; warnings remain advisory. All four artifacts of build `18a2906ac565-9566e37d-8e1` match their manifest hashes. MP4 SHA-256: `97fe613fb14c52702311e5dd32ec2cacd2884d8c411b346dd0ce4af71a20bd67`. FFprobe: H.264 540×960, 30 fps, 2025 frames / 67.500 s; AAC stream 67.562667 s. Full FFmpeg decode exited 0. Retained visual-preflight report has no errors, one `PANEL_DEAD_SPACE` warning. Preview is still a watermarked draft, even when invoked without `--draft`.
- Master and reference `vo.mp3` both hash to `e3d67194db8721bef69bd61a2fe290ceb418f67e84ed7a400d15b5cf643f4f97`; master duration 66.576 s and source pauseAfterMs 924. Decoded mono 8 kHz waveform cross-correlation in one-second windows at 1/20/40/60 s finds a stable 42.625 ms lag (correlations 0.975/0.995/0.985/0.993), supporting unchanged playback speed at those samples. Silence detection alone gives variable edges and is not proof of exact phrase timing. No fresh full listening acceptance is claimed.
- Compared current scene objects with the retained revision used by M2.4.3 full build `ca83f6f0b4d0-d8a209c7-fd9`: opening, river-history, population and shipping-route are exactly unchanged; all old media hashes still match. Ten source scenes are present. Reference HTML matches recorded SHA-256 `b7cc95df3b0f1eeb55f2b0a53f8fec527b561a9c1eb52574053b92eb0e52a78b`.
- Inspected both matched comparison sheets and capture script. Seeking the reference's own paused timeline at shared audio times is suitable for still-frame comparison; reference lossless PNG versus decoded draft H.264 and different capture resolution are disclosed. The sheets do not prove motion/transition quality or meet the full-playback gate. Capture script does not fail explicitly if readiness polling expires; future captures should assert `OPENER.ready` and successful font loading, and retain capture settings.

**Review limits and next handoff:** Full `pnpm verify` (237 unit / 263 integration) and the pre-change mutation check are implementer-reported, not rerun here. Deferring the serial full renderer E2E is proportionate under the M2.4 policy: the renderer and timing/publication implementation did not change, the new 25-character case has a real full-build artifact, and full E2E remains due at M2.4 close-out or another runtime-boundary change. Do not call it passed on this candidate. Complete the small source/compiled prefix/suffix regression matrix and verify before integration. Supply actual matched playback or short transition comparisons for owner assessment; the documented missing blur/word reveal/3D/odometer/whips and disappearing facilities lines prevent inferring competitive parity from stills. Add the visible date-retiming difference to the review notes: at 26.9 s the Maimun label is still at 1590 while its phrase caption names 1888; at 49.5 s the rail label reads an intermediate 1994 rather than the reference's settled 2013. These are deliberate count animations, not a newly found engine defect; the owner should judge their clarity in motion. Refresh inherited provenance metadata (still describes a 3-second study) without inventing artwork rights. Preserve the `ke-4` factual/publication block and obtain Fatih's decision before altering master audio. No export, commit, push or merge is authorised by this review.

**Priority change — 2026-09-27 (owner).** Engine and skill quality come first to save tokens. Art direction, video polish, further comparison playback and the aesthetic assessment package are deferred; the NF-AC-16 gate and export stay open, not passed. The factual and publication blockers stand and the audio is unchanged.

**Current status — 2026-09-27 (read this first).** Technical part of M2.4.4 accepted by the supervisor (count-limit change; independent schema tests 11/11). The visual review requested earlier is deferred, not pending: no five-dimension assessment, comparison polish or export is due now. The spoken "ke-4" claim still blocks publication; audio unchanged. Fatih allowed commit, push and a PR for branch `m2-4-4-full-medan` on 2026-09-27; no merge authorisation yet. Next task: M2.4.4b, started only after this branch is integrated.

**Technical close-out — 2026-09-27 (implementer).** Status READY_FOR_REVIEW for the technical part only.

- *Change and regressions.* The only runtime change is engine gap 1 (count `prefix`/`suffix` limit 24 → 48 in the scene and compiled schemas). `packages/core/test/unit/visual-schema.test.ts` covers both schemas and both fields: 25 and 48 characters accepted, 49 rejected. Bite checks: lowering the source suffix limit failed the source case, lowering the compiled one failed the compiled case; both files restored. No rerender was needed; the existing build evidence stands.
- *Checks.* `pnpm verify` passed: 238 unit, 263 integration, build. `validate work/visual-parity/medan-story --stage production` → ready, no errors. Serial E2E not run: no renderer or runtime-boundary change.
- *Skill review from the Medan work (bounded).* Discovery works: `schema --json` lists the capabilities, and the skill covers paths, counts, billboards and phrase anchors. The three most costly gaps:
  1. **Skill gap — spatial authoring is not explained.** Corrected 2026-09-27 after supervisor review: `SKILL.md` does mention the camera (framing), world groups, billboards and phrase anchors, but it does not explain how to author coordinates: how `space`, `parallax` depth and the camera `x`/`y`/`zoom` place a layer on screen, how to draw world plates for a camera pose, or that `transform` poses start from the base pose and what `exit` leaves behind. Every camera scene in M2.4.3/M2.4.4 needed the plane transform read out of `motion.ts` (in draft pixels: screen = centre + zoom^depth·(P − centre) − camera·depth) and a per-scene conversion from a reference pose (camera = zoom·(target − base)); a pop-in needed a hidden one-frame pre-pose. Impact: an agent reads engine source to place plates and frame shots, spending tokens and risking misframing. Smallest fix: an authoring section with that model in terms of the project canvas, the settled-pose recipe, depth 0 as static, billboards, and the pre-pose pattern.
  2. **Engine limitation plus skill gap — millisecond timings are rounded to frames silently.** `stigma`: 60 ms shake steps spaced 60 ms became 2-frame beats 1.8 frames apart and failed `MOTION_PROPERTY_OVERLAP`; `singapore`: 13 beats spanning exactly the scene failed `BEAT_OUTSIDE_SCENE` after rounding. The messages name no frames, so repair was trial and error across scoped previews of 40–60 s each. Smallest fix: put the resolved start/end frames and the scene's frame count in those two messages, and one skill line on rounding (keep a frame of margin).
  3. **Engine limitation — visual checks do not know what covers or sits behind text.** `CONTRAST_INSUFFICIENT` measures text over SVG plates against the profile background: 18 warnings in the Medan project whose real backdrops measure 4.7–12:1, so the warning channel is noise. `TEXT_COLLISION` fired for sign labels hidden under the newspaper, which had to be faded out to pass. Related workarounds: no transparent fill (the stamp outline is a `path`), and an oversized overlay is refused, so the light leak became a depth-0 world layer. Smallest first fix: when an image or world plate lies under the text, report the backdrop as unknown (info) instead of warning against the profile background. Occlusion-aware collision checks are a larger follow-up.
  Not gaps for this priority: blur, per-word reveals, 3D swings and odometer digits are art-direction features the engine lacks; they stay deferred with the aesthetic work.
- *Recommended next task.* Recorded as M2.4.4b (spatial authoring guide and timing diagnostics) in the tracker and task list; gap 3 (contrast/occlusion) stays a separate later task and no warning is weakened now.

**Superseded implementer status (2026-09-27, before the priority change):** READY_FOR_REVIEW (owner visual gate). Branch `m2-4-4-full-medan` from `origin/main` `00942b5`, uncommitted; project `work/visual-parity/medan-story`. The pre-existing stash (`M3.1 word-level timing enforcement`, 2026-09-20) is left untouched.

**Shot plan (six placeholders; the accepted opening, river-history, population and shipping-route keep their content).**

1. `stigma` (6.8–13.7 s): the opening's grey street continues without a cut; the "Kabar Kota" newspaper swings in, the TERKOTOR stamp lands, then the paper grows past the lens into the river map.
2. `tobacco-palace` (22.5–30.8 s): the afternoon street at the reference's third stretch, tobacco in front, warehouse and mosque behind, Istana Maimun; its label counts 1590 to 1888 when the narration names the palace (p4b); the camera pushes into the palace door.
3. `kesawan` (30.8–36.4 s): front view of the Kesawan shophouse row and lamps; "Dijuluki Paris van Sumatra." lands with its phrase (p5b); the view falls back into the population street.
4. `facilities` (42.6–52.4 s): the map closes from 60 to 20 px/km on Medan; Belawan, the toll roads, Kualanamu and the airport rail appear in the narration's order within p7b; the camera ends on shipping-route's opening pose.
5. `singapore` (59.0–62.1 s): the sea view, Belawan cranes in front, Singapore on the horizon, container ships crossing.
6. `compete` (62.1–67.5 s): back to the opening street as a bookend, grey turning to evening, no signs or potholes; "Harusnya Medan bisa bersaing." with its phrase (p10b).

**Engine gap 1 (recorded before the change), 2026-09-27.** The facilities label counts "kereta bandara pertama · 1888 → 2013" as in the reference, but a `count` beat's `prefix` and `suffix` accept at most 24 characters and this prefix has 25. Scope: raise both limits to 48 in the scene and compiled schemas; no renderer or pixel change, so the renderer identity stays `naraframe-draft/10`. Evidence of need: `SCHEMA_INVALID "Too big: expected string to have <=24 characters"` on `preview --scene facilities`.

**Factual claim.** "terbesar keempat" is spoken in the master (p6a, confirmed by listening). It fails the BPS 2024 check; options go to Fatih before any change to the master. Nothing is marked publishable.

**Full preview checkpoint — 2026-09-27.**

- *Commands (pinned Node, public CLI).* `validate work/visual-parity/medan-story --stage production --json` → success, readiness `ready` (warnings: single transition type, static-viewpoint heuristic, 18 contrast warnings from the static model). `preview work/visual-parity/medan-story --json` → build **`18a2906ac565-9566e37d-8e1`**, source `58b9e8104435836f1d8be539f9873da60db615ed409a1d94eb95a51f0442a36d`, no preflight errors (one advisory `PANEL_DEAD_SPACE` on a newspaper bar under the stamp). The `--draft` build of the same source is `18a2906ac565-ae9c2c23-434` (MP4 SHA-256 `0ebc576fe2e24a1dd7cb254e4f2d75c8302e7664ef1381fdf000351f6e8734da`). Video and contact sheet: `work/visual-parity/medan-story/preview/builds/18a2906ac565-9566e37d-8e1/{preview.mp4,contact-sheet.png}`.
- *Media.* H.264 540×960, 30 fps, 2,025 frames (67.5 s), AAC. Audio master unchanged: SHA-256 `e3d67194…4f97` equals the reference `vo.mp3`, 66.576 s, plus the 924 ms terminal hold; pauses in the preview land 43 ms after the master's (e.g. 13.727 → 13.770 s, 22.461 → 22.505 s), no stretching.
- *Scenes.* Ten, no placeholders. New: `stigma`, `tobacco-palace`, `kesawan`, `facilities`, `singapore`, `compete`, each from a generator or builder in `work/visual-parity/medan-story-art/` (`build_stigma.py`, `make-street-r3.py` + `build_tobacco.py`, `make-front.py` + `build_kesawan.py`, `build_facilities.py`, `make-sea.py` + `build_sea_compete.py`). The accepted `opening`, `river-history`, `population` and `shipping-route` are unchanged. Every new scene is checked by scoped preview first; review sheets in `work/visual-parity/medan-story/checkpoint/m2-4-4/`.
- *Continuity.* opening → stigma: same street and camera, no cut. stigma → river: the paper grows past the lens. tobacco → kesawan: the camera ends in the palace door. kesawan → population: the camera falls back into the street. facilities → shipping: the facilities map ends on shipping-route's opening framing. shipping → singapore: the push into the strait. singapore → compete: the light leak crosses the cut. Remaining boundaries are plain cuts.
- *Timing against narration.* Beats are phrase-anchored. Where the narration names something, it appears then: palace label and 1590 → 1888 count on p4b, "Dijuluki Paris van Sumatra." on p5b, "Fasilitasnya lengkap." on p7a with Belawan, toll roads, Kualanamu and rail in spoken order inside p7b (local offsets, not word timings), "Harusnya Medan bisa bersaing." on p10b.
- *Matched comparison with the reference.* `work/visual-parity/tools/capture-reference.mjs` renders the reference through its own `OPENER.seek(t)` in headless Chrome at 1080×1920 (GSAP and fonts from its CDNs) and saves 540-px frames; ours are extracted from the 540×960 H.264 preview (reference frames are lossless PNG, so encoding differs). Ten matched audio times (3.0, 10.3, 18.5, 26.9, 34.0, 40.5, 49.5, 56.5, 60.5, 65.5 s): `compare-a.png`, `compare-b.png` (reference above, ours below). Framing, artwork, palette and typography match closely at every moment.
- *Specific shortfalls against the reference (not parity claims).* (1) No blur anywhere: the reference's whip transitions, lens, rack focus and per-word blur reveals are cuts, fades or camera moves here. (2) Sentences reveal as whole lines, not word by word; markers slide in instead of wiping. (3) The newspaper swings in the picture plane, not in 3D. (4) Counts are plain numbers, not rolling odometer digits, and the "+" of 50.000+ shows while counting. (5) Two reference whips (river → tobacco, population → facilities) are plain cuts. (6) Pins do not bob; the street's slight breathing zoom and the film-grain overlay are absent. (7) The facilities lines vanish at the cut into shipping-route. (8) The engine always shows captions with narration; the reference has none. (9) At 3.0 s our opening pin and signs sit differently from the reference (the approved M2.4.1 framing). Deliberate differences: phrase-anchored timings above, cream tower labels (contrast), BPS 2024 tower heights.
- *Engine change.* One, recorded above as engine gap 1: `count` `prefix`/`suffix` limit 24 → 48 (schema only; renderer identity unchanged). Regression: `packages/core/test/unit/visual-schema.test.ts` (accepts the 25-character label and 48, rejects 49; bite-checked against the old limit). `pnpm verify` passed: 237 unit, 263 integration, build. Serial E2E not run: no renderer or runtime-boundary change.
- *Open at that point (superseded).* The owner visual review requested here was deferred by the 2026-09-27 priority change: no five-dimension assessment or export is pending now; the "ke-4" decision remains open for publication.

#### Handoff record — M2.4.3 (integrated)

**Final status — 2026-09-27: INTEGRATED (read this first; entries below are history, newest first).**

- *Git.* INTEGRATED: [fatlhr/NaraFrame#15](https://github.com/fatlhr/NaraFrame/pull/15) marked ready and squash-merged into `main` on 2026-09-27 under Fatih's authorisation; task branch deleted afterwards. It was first opened as a Draft under Fatih's exception for 8/9 E2E. M2.4.4 not started.
- *Owner.* Three scenes visually approved 2026-09-27; all 18 phrase texts confirmed by listening; population "ke-4" claim fails the BPS 2024 check and is blocked for publication.
- *Supervisor.* Technical sign-off, 2026-09-27: serial E2E 9/9 on `94fe4b0`; the only later change before merge (`12d9de6` and this record) is documentation. The two earlier findings (count settling order, follow on transformed paths) were fixed and verified first.
- *Gates.* `pnpm verify` passed (235 unit, 263 integration). Serial E2E: 8/9 in runs 2 and 3 (scenario-3 timeout; `owner-flow` hash failure matching the open 2026-09-20 repeatability caveat), then **9/9 in run 4** on a recovered machine (below).
- *Measurement wording, corrected 2026-09-27.* A counted layer is measured for overflow at each count beat's start and end text plus its settled text, not at every intermediate value. Skill, code comments and the test name now say so; the earlier "every value" wording in this handoff, the PR text and the commit message overstated it.
- *Follow-up.* [fatlhr/NaraFrame#16](https://github.com/fatlhr/NaraFrame/issues/16): keep CLI logs when an E2E command fails or times out, and audit cancellation by reproducing each stage. The run-2 timeout and the 2026-09-20 `owner-flow` repeatability caveat stay open; neither is claimed fixed.
- *Hypothesis run, 2026-09-27 09:00–09:11 (`work/gate-logs/m2-4-3/run4/`).* Before the run the machine had recovered without intervention: PID 60970 and any `bloc` or VS Code process were gone (not killed by the implementer; no reboot, uptime 16 days), swap 2.1 of 3 GB, memory free 45%, disk 90% with 44 GB free; nothing was deleted. One serial `pnpm test:e2e --reporter=verbose` on HEAD `94fe4b0` with the full vitest output kept: **9/9 passed, 632.08 s**. Scenario 3 took 47.2 s (604 s timeout in run 2); `owner-flow` passed its frame-hash check in 147.1 s. A sidecar sampled swap, memory and render processes every 15 s: 27 samples, swap used 2,090–2,558 MB, memory free 37–49%; it missed 09:00:45–09:04:39 through a wrong process pattern (recorded in `resources.log`). This supports the memory-pressure hypothesis for the run-2 timeout without proving it. The `owner-flow` repeatability caveat from 2026-09-20 stays open: a pass here is weak evidence either way.

**Scenario-3 timeout investigation — 2026-09-27, 01:37–01:45 (bounded to 20 minutes).** Evidence in `work/gate-logs/m2-4-3/`.

- *Where the time went.* In run 2 the `reference-projects` file took 780.7 s, 603.7 s of it in scenario 3; the other five files took about 526 s in total, in line with run 1's 701 s for the whole suite. So one render hung; the machine was not uniformly slow.
- *Which stage.* The test keeps only stdout, so the CLI's progress on stderr (the stage) was lost. The child closed 3.7 s after the 600 s `execFile` SIGTERM. The CLI turns SIGTERM into an abort that only `renderMedia` (Remotion cancel signal) and the `throwIfAborted` checkpoints obey; `bundle`, `selectComposition` and the post-render FFmpeg steps do not stop on it. A prompt exit therefore points to a stall inside `renderMedia` (frame capture or stitching), not proven. No Chrome, FFmpeg, vitest or NaraFrame process remained afterwards (checked at 01:41).
- *Environment.* The machine has 8 GB RAM. Swap stood at 25.0 of 25.6 GB (563 MB free) and the data disk at 97% (13 GB free). One process holds 23 GB, 22 GB of it compressed or swapped: PID 60970, the language server of the VS Code extension `felixangelov.bloc` (`bloc_0.1.0-dev.21`), orphaned to launchd, started 2026-09-26 23:50:40. Swap files 6–11 appeared between 23:49 and 23:53, and swap kept growing during run 2 (new 1 GB files at 00:54 and 00:58) but not during the fast run 3. A ChatGPT/Codex disk-write diagnostic covers 00:22–00:48 as well. Chrome was not updated during the run (last change 2026-09-22), and no crash or hang report exists for it.
- *Reproduction (scenario 3 only, per-stage timing, `scenario3-staged-repro.txt`).* Under the same memory state: validate 3.8 s, bundle and composition 6.7 s, render 35.3 s, post-render checks and publication 11.5 s, total 57.5 s, success. It did not reproduce.
- *Conclusion.* No defect in this branch's code was found; the stall most plausibly came from severe memory pressure caused by the runaway language server, but causation is not proven. Remaining hypotheses: a Chrome frame-capture stall under memory pressure; an FFmpeg stitching stall; an unrelated intermittent Remotion stall. Not tested: a hang in the non-abortable stages, since the prompt exit argues against it.
- *Recommendation.* Safe to track as a separate reliability issue rather than block this Draft PR on code grounds: the isolated render path is healthy and the branch shows no render difference from `main`. Before merge: Fatih stops PID 60970 (it is not NaraFrame's) and frees disk, then one serial E2E run tests the memory-pressure hypothesis. Separate follow-up issue: make E2E keep CLI stderr when a command fails or times out so the stage is recorded, and let abort stop `bundle`/`selectComposition`/post-render FFmpeg. Neither is in this PR; no timeout was raised and no assertion changed.

**Supervisor status: REVIEW FIXES VERIFIED — 2026-09-27.** Both findings below are closed within the bounded correction scope. Reviewed resolved-frame count ordering against `countedTextFor`, the transformed-path guard and its allowed draw/fade cases, and the updated skill restriction. Independently reran six focused files: **86 tests passed**, including all five new regressions (2.38 s). The tests reject stale count text, accept the correct final text after anchor reversal/retiming, reject rotated or moved/scaled follow paths, and accept draw/opacity-only animation. No renderer change is required for these validation fixes; retaining `naraframe-draft/10` is appropriate. Full verify (235 unit / 263 integration) remains implementer-reported; final-candidate serial E2E is not yet recorded as complete. This is sign-off on the two corrections, not owner visual approval or Git integration authorisation. Keep M2.4.3 open until the remaining gates pass. No runtime files or Git state were changed in this review.

**Previous supervisor review: CHANGES_REQUESTED — 2026-09-27 (resolved above).** Independently reran six focused test files: 81 tests passed (compiler M2.4.3, count formatting, path/count motion, visual preflight, capabilities and preview publication). Full verify and serial E2E results below are implementer evidence, not independently rerun in this review. Two additional read-only source-to-compiler/motion probes reproduced gaps not covered by those tests:

1. **Count final text uses authored rather than resolved timing.** `validatePathsAndCounts` chooses the last count using source `startMs`, before phrase anchors resolve. A valid context scene with a count authored at 0 ms but anchored to c2 (1200 ms), ending at 20, and another authored at 1000 ms but anchored to c1 (100 ms), ending at 10, compiles successfully with layer text `10`; the renderer settles at `20`. Resolve anchors before validating the final count and use the effective compiled ordering. Add regressions for anchors reversing authored order and phrase retiming, proving both acceptance of the correct final text and rejection of the wrong one.
2. **Follow ignores the path's rendered transform.** An accepted path `M0 50 L100 50`, viewBox 0/0/100/100, frame 100/100/100/100 and rotation 90 degrees renders a rotated line, but its follower still follows the unrotated coordinates. At draft scale 0.5 the probe ends at (100,75), while the rotated path endpoint is (75,100); orientation is also unrotated. Either share the rendered path transform with follow evaluation or, as the bounded fix, explicitly reject follow targets with unsupported static/animated transforms. Add rotated-path and animated/translated-path regressions; do not silently accept a trajectory different from the visible path.

**Previous correction request (fixes now verified):** fix only these gaps, demonstrate each real compiler/motion path, add focused regressions, then rerun the required final-candidate gates before integration. Keep the three-scene owner visual gate open. The recorded population `ke-4` claim remains blocked for public publication independently of technical acceptance. No runtime changes, commit, push or PR were made by that review.

**Fix record — supervisor findings of 2026-09-27 (implementer).** Scope limited to the two gaps; no renderer output changed, so the renderer identity stays `naraframe-draft/10`.

1. *Count settling.* `validatePathsAndCounts` now runs after phrase anchors resolve and picks each layer's settling count by resolved start frame, a tie going to the later beat, which is the order `countedTextFor` plays them. The supervisor's probe (count to 20 authored at 0 ms but anchored to c2, count to 10 authored at 1000 ms but anchored to c1): layer text `10` → `COUNT_TEXT_MISMATCH`; text `20` → compiles, and the renderer's last frame reads `20`.
2. *Follow on a transformed path.* Bounded fix: a `follow` whose path has `rotationDeg ≠ 0`, or whose path is targeted by any beat writing x, y, scale or rotation (transform, emphasize, focus, travelling reveal/exit), fails with `FOLLOW_PATH_TRANSFORMED` and a repair suggestion. Draw and opacity-only reveal/exit stay allowed. Probe: the 90° path `M0 50 L100 50` is refused; the same path unrotated compiles and the follower's centre ends at (100, 75), the path's end at draft scale. Skill text records the rule.
3. *Regressions.* Five cases in `compile-draft-m2-4-3.test.ts`: anchors reversing authored order (wrong text rejected, right text accepted); a phrase retime swapping which count ends last (both directions); rotated path; path moved by transform, emphasize and travelling reveal; path drawn and faded still accepted. Bite check: restoring authored-order selection and removing the follow guard failed four of them; source restored from a copy. The Medan project still validates with no errors.
4. *Gates on this candidate.* `pnpm verify` passed: 235 unit, 263 integration, build. **Serial E2E not green; integration stopped (no commit, push or PR).** Logs in `work/gate-logs/m2-4-3/`:
   - Run 2 (`e2e-run2-scenario3-timeout.log`): 8/9, 1306.65 s. `reference-projects` scenario 3's `preview --draft` was killed by the test's 600 s `execFile` timeout (empty stdout, JSON parse error). The same preview run alone on a fixture copy afterwards succeeded in 54.3 s (`scenario3-isolated-preview.txt`). An idle node process from 2026-09-14 (a krakatau-draft debug render) was then stopped at the owner's request; any link to the timeout is unproven.
   - Run 3 (`e2e-run3-owner-flow-frame-hash.log`): 8/9, 654.65 s. Scenario 3 passed; `owner-flow` failed its determinism check: one of three sampled lossless frame hashes differs between the first preview and a `--rerender` of the same source revision (`4d6238d9…` vs `0b7a7a30…`). After the run no vitest, Chrome or NaraFrame child process remained. Correction: this check has failed before. The 2026-09-20 finding in the verification register ("Deterministic compiled/selected frame hashes") records the same pre-existing renderer non-determinism on unchanged `samples/krakatau-draft` (289 of 540 frames differing at `a11b3a7`, PSNR about 81 dB), a deterministic encoder, four failures in seven `owner-flow` runs, and the NF-CP-03 promise not met on this machine; my earlier note that no record existed was wrong.
   - Two different failures in two runs are an unexplained reliability problem, not a pass. Per owner instruction the suite is not being rerun until green.
   - *Determinism investigation (owner-authorised, 2026-09-27).* `work/gate-logs/m2-4-3/determinism-probe.sh` repeats the owner-flow setup outside vitest (copy of `samples/krakatau-draft`, the test's scene durations, the same network-denying `sandbox-exec` profile), renders once plus three `--rerender`s, and compares all 450 decoded frames by rgb24 `framemd5`. On this branch and on `main` `7af87d9` (clean detached worktree, frozen offline install, removed afterwards) the result is the same: renders fall into exactly two variants, differing only in frames 234–249 (PSNR 88 dB at 234 falling to 54 dB at 249, identical again from 250; a difference image shows nothing visible). The pattern fits one input frame differing by a sub-visible amount and the encoder carrying it to the next keyframe. Cross-comparison: every branch render is bit-identical to the `main` render of the same variant. No difference between this branch and `main` was found in this probe. That is consistent with the open repeatability caveat recorded on 2026-09-20 (same sample, same kind of sub-visible noise, root cause open with box-shadow or rotated-image rasterisation as suspects) and does not show that this branch adds or removes non-determinism. The E2E failure hit a different sampled frame (the middle sample, frame 195 in this probe), so the unstable frames are not always the same block. Root cause (renderer, browser or encoder) is not established. The run-2 timeout remains unexplained. Evidence: `work/gate-logs/m2-4-3/determinism/{branch-m2-4-3,main-7af87d9}/`.

**Implementer note — 2026-09-27: Draft PR authorised.** Fatih allowed an exception: commit, push `m2-4-3-river-route-data` and open a Draft PR to `main` with serial E2E at 8/9; no merge, no M2.4.4. Earlier note: Owner decision after the determinism investigation: hand the E2E evidence to the supervisor before any Git operation. Question for review: may the PR open with serial E2E at 8/9, the owner-flow hash failure matching the open 2026-09-20 repeatability caveat (no branch/main difference found in the probe), and the scenario-3 timeout recorded as unexplained? No commit, push or PR has been made.

**Owner decisions, 2026-09-27.** Fatih approved the three scenes visually and authorised, once serial E2E passes on the final candidate: commit with explicit paths and no agent identity, push `m2-4-3-river-route-data`, open a PR to `main`, then stop. No merge.

**Superseded implementer status (2026-09-27, before the E2E failures):** READY_FOR_REVIEW. Branch `m2-4-3-river-route-data` on `7af87d9`, all work uncommitted, no push/merge. Owner order 1–3 done and gate 4's verify + serial E2E passed (records below); supervisor review, then a PR only after Fatih allows it. Owner visual acceptance of the three scenes (review-2 copies, then the full draft) is still open, so checklist items 1–2 stay unchecked. The six placeholder scenes remain M2.4.4 work. Earlier supervisor-takeover notes below are kept as history.

**Takeover checkpoint — full-preview publication.** Rebuilt core/renderer/CLI successfully. The real project has two population beats whose old settled-frame expression produces frame 1278, exactly the next scene's first frame. The implementer's existing `selectCheckedFrames` clamp now keeps all 141 selected samples in their owning scenes. Added two focused regressions for the inter-scene boundary and source-frame offset in a scoped preview; the preview-publication file passes 13 tests. TypeScript build and Biome checks for the two touched CLI files pass. Full unit run: 215 passed, 2 failed in capabilities evidence for the newly advertised path/draw/follow/count surface; do not amend evidence expectations without feature tests.

**Additional production blocker.** The rebuilt public command `preview work/visual-parity/medan-story --json` stops before rendering with `VOICE_BINDING_MISSING`. No text binding was fabricated: the 18 phrase texts were inferred from script order and silence, not verified against spoken audio. The official `--draft --json` path succeeded without weakening production checks (result below). Reported 33–45 ms silence-boundary differences do not establish semantic phrase alignment. Population source comparability and the known low-contrast labels also remain unresolved. Full verify/E2E, new-feature regressions, skill/capability evidence and a retained-copy LBC regression are still pending.

**Full draft recovered — 2026-09-26.** Pinned Node executes `packages/cli/dist/index.js preview work/visual-parity/medan-story --draft --json`. Fresh build `60a98f8f618a-77719f32-3a3`, source `b9cd9a89d5f0bce1094f50f126d97afb45e2ff26dc4b3160ac9a0fdb237c3443`, assembly `60a98f8f618a747a57a54691aa3e34915680e889e305d2fc5fa751724781ef82`, `reusedFromBuildId: null`, published successfully in 121.022 seconds of CLI time. MP4: `work/visual-parity/medan-story/preview/builds/60a98f8f618a-77719f32-3a3/preview.mp4`, SHA-256 `9dbbfbcb270fae47a04ac995b0c7565f3f42b7bf3f22925ebfb2bf68719c59c9`, matches manifest. FFprobe confirms H.264 540×960, 30 fps, 2025 video frames (67.5 s), AAC audio; container duration 67.562667 s. `frames.json` published with 141 samples. This proves full draft publication after the frame clamp, not completed-story quality, audio/text verification or production readiness: six scenes remain placeholders. No new feature or project data was changed in this bounded recovery; only regression coverage and formatting were added around the implementer's existing CLI patch. No full-video visual/listening acceptance is claimed.

**Implementer checkpoint — content and delivery pass (owner order 1–2), 2026-09-26.** Implementer resumed after the takeover; status IMPLEMENTING, awaiting owner phrase confirmation and visual review. The six placeholder scenes stay placeholders (M2.4.4 scope); they only hold their narration spans.

- *Population figures.* Checked against BPS provincial tables for one year (2024), read in the browser because BPS refuses the fetch tool: DKI Jakarta 10,684.9 thousand (Kota Jakarta Timur 3,086.0), Kota Surabaya 2,922.0, Kota Bekasi 2,644.1, Kota Bandung 2,528.2, Kota Medan 2,486,283 people, Kota Palembang 1,718.0. Medan is fifth by these figures, and still fifth with Jakarta split into its administrative cities. The reference's 3.02 (Surabaya) and 2.58 (Bandung) came from other data. **Owner decision:** keep the reference's "ke-4" headline and four towers without Bekasi, with BPS 2024 heights (Surabaya 2.92, Bandung 2.53); the claim is recorded as **not passing fact check** in the scene note and must be resolved before publication. "Largest outside Java" holds. Sources `bps-*-2024` replace the earlier secondary citation.
- *Phrase text.* No local speech recognition exists and the macOS recogniser needs Apple's servers for Indonesian. **Owner decision:** Fatih listens. Eighteen per-phrase clips with the inferred text were delivered for confirmation; `generation.textSha256` stays absent (`VOICE_BINDING_MISSING` warning) until he confirms, so no binding is fabricated.
- *Contrast (real backdrops, WCAG ratio).* Tower labels ink on asphalt 1.87 → cream 7.51; SELAT MALAKA 4.59 → 6.13; MALAYSIA/SUMATRA 3.04 → 4.73. The remaining `CONTRAST_INSUFFICIENT` warnings compare text with the profile background because the static model cannot see SVG plates or world planes; their real backdrops measure 8.17 (2,5 juta on the tower) and above 12 (headlines).
- *Timing.* Shipping headline moved from 2.63 s to 1.00 s so it lands while "Selat Malaka" is spoken (phrase p8a, 0–1.79 s); its marker follows at 1.71 s. River-history stresses the Kampung Medan Putri label when "dirintis Guru Patimpus" starts (p3c). Object reveals already tied to phrases: river labels to p3b, "terbesar di luar Jawa" to p6b, the ship count to p8b.
- *Output.* Scoped narrated builds `1eb7a72b140e-c4e46381-0ea` (river-history), `4d614b3056f3-4cb805bc-933` (population), `1803cea9b502-a39a5d51-406` (shipping-route); review copies in `work/visual-parity/medan-story/checkpoint/review-2/`. No preflight errors.

**Implementer checkpoint — binding and technical evidence (owner order 3), 2026-09-27.**

- *Audio binding.* Fatih listened to the eighteen clips and confirmed every phrase text ("cocok semua", 2026-09-26). `voice-medan` now records `generation.textSha256` `72d62f8317fe0712942afe137ff2e698505275eb82e640db779fb19f728fa022` (the block text, whitespace-normalised); `VOICE_BINDING_MISSING` is gone. Phrase starts come from `silencedetect` (−32 dB, 0.25 s); the rendered scoped MP4s show the same pauses 33–45 ms later, within two frames.
- *Engine surface added in this task.* `path` layer; `draw`, `follow` (with `orient`, facing its travel) and `count` beats; `at: {phraseId, offsetMs}` on beats and camera moves, resolved from the scene's own block and conflict-checked at resolved times; `billboard` on world groups; a reveal without travel writes only opacity, like an exit; camera-framed world text is exempt from the static canvas check (preflight still checks it on screen); text collisions use oriented outlines, not bounding boxes; checked frames of a beat ending at its scene's end stay in that scene. `formatCount` lives in `@naraframe/core/count-format` so the browser bundle imports no Node module. Renderer-only dependency `@remotion/paths` 4.0.521 (the plan's sanctioned choice) supplies path length, points, tangents and cutting. Renderer identity `naraframe-draft/10`.
- *Focused regressions.* `packages/core/test/integration/compile-draft-m2-4-3.test.ts` (16: schema target rules, plane rule, billboard, viewBox aspect, count text, property overlaps for x/draw/text, fade-without-travel, camera-framed world text, phrase start/retiming/silent fallback/resolved-time overlap/unknown and outside phrases/scoped preview, assembly key for path data and retiming), `packages/core/test/unit/count-format.test.ts` (3), `packages/renderer-remotion/test/unit/path-count-motion.test.ts` (12: geometry, draw endpoints and sequencing, rendered path, follow hold/centre/turn/hand-off, count text and variants, billboard plane), three preflight cases in `visual-preflight.test.ts` (rotated label, path without length, counted overflow). Bite checks: removing the resolved-start use and the fade rule failed two compile cases; restoring bounding boxes and settled-only count measurement failed two preflight cases; files restored from copies afterwards.
- *Capabilities and skill.* Registry now advertises layer `path`, beats `draw`/`follow`/`count`, composition motion `billboard` and audio feature `phrase-anchors`, each with named evidence in `capabilities.test.ts`. `skills/naraframe/SKILL.md` describes paths, draw/follow/count, billboards, camera-framed world text and phrase anchors, including the rule to confirm phrase text before recording a binding.
- *LBC regression on the new runtime.* Copy `work/visual-parity/lbc-regression-draft10/` (retained `work/visual-parity/lbc*` untouched). The copy's current source and three `undo` steps re-render all four retained revisions (`174d41ea`, `a5bff464`, `ca37acc6` first draft, `610f7a49`) through the public CLI: builds `92a44aba2f9b-a848389a-b3b`, `fe1fa4183c66-beed65a9-3f1`, `3036c0fb8feb-a5f48922-19a`, `43538e132da3-032d9c29-55d`. Against the retained `naraframe-draft/8` builds of the same source: SSIM 0.9977 / 0.9969 / 0.9996 / 0.9970, PSNR 48.5 / 47.4 / 55.8 / 44.4 dB; worst frame 40.2 dB; a difference image shows only faint edge noise. No visible change; bit identity is not claimed. This is regression evidence, not the original frozen trial.
- *Gates.* `pnpm verify` passed: Biome, typecheck, 235 unit, 258 integration, build. Serial `pnpm test:e2e` passed: 6 files, 9 tests, 701 s.
- *Full framing.* Fresh full narrated draft `ca83f6f0b4d0-d8a209c7-fd9` (67.5 s, no preflight errors). Each scoped build compared with the same frames of the full video: river-history (full frames 412–673) SSIM 0.9971, population (1093–1277) 0.9934, shipping-route (1571–1769) 0.9975; the population minimum (0.9915) sits in the exit fade, and a side-by-side shows the same pose, so scoped previews match full-video poses without prior playback. Silence boundaries in the MP4 land 33–45 ms after the phrase anchors.
- *Not done here.* No owner acceptance of the final visuals is claimed; the population "ke-4" claim stays failed; the six placeholders, full-video comparison and export are M2.4.4.

**Owner decisions, 2026-09-26.** (1) The Medan story is built in a new project `work/visual-parity/medan-story/`, seeded from the approved opening; `work/visual-parity/medan` keeps the rejected first attempt as evidence and the acceptance commands above are retargeted. (2) River, route and data scenes are adapted from the reference source HTML only. There is no playback recording for them, so no motion similarity to the reference is claimed for these scenes.

**Working order.** Static frame per scene, owner review, then motion; only capabilities these scenes actually need are added (plan bullet 3). The early LBC opening is re-rendered on the new runtime as regression evidence in a copy, never over the retained `naraframe-draft/8` trial.

**Checkpoint 1 — static `river-history` frame, 2026-09-26.**

- *Project.* `work/visual-parity/medan-story/`, seeded from the approved `medan-opening` (its `opening` scene unchanged) plus a new `river-history` scene. Artwork generator `work/visual-parity/medan-story-art/make-river.py`; glyph widths for mark placement from `ttfwidth.py`, which reads the bundled TTF tables directly (no font tooling installed).
- *Adaptation from source only.* The reference draws its map at runtime from kilometre coordinates (`x=(lon-98.67)*111`, `y=(3.59-lat)*111`) with a camera zooming from 480 to 210 px/km across scene 3. The visible part of that map was rewritten as passive SVG at one fixed scale, the reference camera pose at authored t=16 s (220 px/km, centre −0.174 / 0.926 km; real time ≈19.2 s through the reference's `T()` stretch): city ground and 1 km grid at the reference's 0.55 opacity, Sungai Deli and Sungai Babura at their real widths (0.16 and 0.11 km), and the traditional house at the confluence. Colours and strokes are the reference's. World files share one viewBox so they register exactly and can take camera motion later without new engine capability.
- *Labels and sentence.* Kampung Medan Putri pin and its two-line label (Guru Patimpus · 1590), Sungai Deli and Sungai Babura labels, each as a world rig with a paper pill and native text; sentence "Padahal lahir sejak 1590." at the reference's 116 px Fraunces, 1.04 line height, top 230, with the yellow marker placed from measured glyph widths under "1590" and the paper glow (reference `.pk`) behind it.
- *Assumption, unverifiable here.* The reference CSS does not centre pins or labels on their map points; the scene-1 recording showed the pin tip sitting on its point, so pins are placed tip-on-point and labels centred beneath. No recording exists for this scene to confirm it.
- *Output.* `preview work/visual-parity/medan-story --draft --scene river-history --json` → build `48e4b5a26030-1a8793dc-525`, source `a48769afe0f89875c86f5bf7d3f9ffbee5082a3f0527569ce5818653b0a336a9`, engine `naraframe-draft/9`, 0.5 s diagnostic hold. Review image `work/visual-parity/medan-story/checkpoint/river-history-static.png` (SHA-256 `2ded00c2416d2799420a…`).
- *Checks.* `validate --stage plan` valid; one new warning, `CONTRAST_INSUFFICIENT` on the sentence, the known limitation that the contrast model cannot see an SVG map behind text (the glow keeps it readable in the frame). Label text passes because each sits on an opaque pill. No internal visual correction was needed. No engine change.
- *Not claimed.* No comparison with the reference's look or motion for this scene: there is no playback of it, only source.


#### Handoff record — M2.4.2 (integrated)

**Final status — 2026-09-26: INTEGRATED** via PR #13 (`1d62f3d`) after supervisor TECHNICALLY_READY; the rich-text follow-up it found was fixed separately in PR #14 (`7af87d9`). The trial's own evidence stays on `naraframe-draft/8`.

**Supervisor status — 2026-09-26: TECHNICALLY_READY for the early transfer gate, integration pending.** Verified against fixed commit `3133af8`, not just a moving remote ref: tracked `packages/` and `skills/` diff is empty, no untracked files in those paths, and the skill hash matches the freeze. Inspected the retained first-draft contact sheet; it uses a distinct LBC photo/report composition, not the Medan city artwork. Owner direction approval remains the recorded decision below, not a new supervisor playback claim. All seven retained build MP4 hashes match their manifests; the three reuse builds are byte-identical to their named originals. Revision parent links, unchanged profile/asset-manifest hashes and media hashes confirm the two source edits and retained media. Freshly reran `revision-commands`, `revisions`, and `edit-scope`: 3 files / 31 tests passed.

**Decision on the rich-text defect.** The source confirms that direct span children are flex-column items while preflight measures inline runs. This remains a correctness defect; the first failed render reports no preflight issues. However, the delivered workaround uses supported editable text layers, keeps profile-driven colour, and does not patch the frozen runtime or skill. It therefore does not invalidate this early cross-topic trial. Do not require a repeat merely to erase the recorded correction, and do not claim rich-text correctness from this pass. Recommend a separately authorised bounded rich-text fix with render/measurement regression evidence before relying on spans in later output; any post-fix trial must record a new freeze and preserve this original trial. Audio reuse and unknown-style handling after a profile switch are not proved here and remain explicit later obligations. Full integration gates were not rerun by the supervisor in this source-only review. No commit, push, merge, runtime/skill edit or later task was authorised/performed by this review.

**Implementer status:** INTEGRATED via PR #13 after supervisor TECHNICALLY_READY (record below). Fatih judged the first LBC opening's direction worth developing as an LBC video on 2026-09-26 ("Layak, lanjut revisi"). Branch `m2-4-2-lbc-opening`, cut from `origin/main` `3133af8`.

**Freeze.** Recorded before any trial authoring, 2026-09-26:

| Frozen part | Identity |
|---|---|
| Repository (`main`) | `3133af8a5d6655db24617f5465f59ca26e499358` |
| `packages/` tree (compiler, renderer, schemas, CLI) | `5528aa10fa2afff1f33599754f8a06c2d030c646` |
| Renderer identity | `naraframe-draft/8` |
| `skills/naraframe/SKILL.md` | SHA-256 `02e23797095dc4e95447eb876bf579aecb33860718cb44a38f244c16eee11724` |
| Published capabilities | beats `emphasize, exit, focus, reveal, transform`; visuals `composition, media, text`; layers `group, image, shape, text`; media png, svg, mp3/wav/m4a, ttf/otf/woff2 |

The CLI `dist/` was rebuilt from this tree before the trial. Only files under `work/visual-parity/lbc*` may change during the trial. Any change under `packages/` or `skills/` ends the trial as failed and must be recorded here.

**Known condition of the frozen skill.** It describes art direction and the `reveal`/`emphasize`/`focus` beats but not camera moves, world planes, `transform` or `exit`. The trial has to find those through `naraframe schema`, which is the discovery route the skill itself prescribes. This is recorded as a limitation, not patched.

**The brief.** Recorded verbatim in `work/visual-parity/lbc-profile/brief.md` before authoring: an opening of 6–10 s, 9:16, for LBC (Lentera Binar Cendekia), home tutoring for SD–SMA in Bekasi and Jakarta, for parents; tutor comes home and parents can follow progress through a report every session; close on a free WhatsApp consultation; LBC's visual identity; do not imitate the Medan opening.

**Sources.** Read-only `/Users/fatih/Code/Playground/lbc_kimi`: logo `public/brand/lbc-logo.svg`, photos `public/images/hero/tutor-dan-siswa.webp` and `laporan-orang-tua.webp` (converted to PNG, the only raster format the engine accepts), palette from `tokens.css` (paper, ink, dark-gold accent text, WhatsApp green), service copy from its pages. Fonts are the local SIL OFL Fraunces 144/600 and Space Grotesk already carried with licences. The old `work/lbc-benchmark/direct-remotion` composition was not opened. Provenance is in `work/visual-parity/lbc/provenance.json`.

**Direction (not a Medan swap).** Daylight paper and navy instead of a night street; real photographs for the people and a drawn session report as the explanatory object; brand-motif cards with a navy outline and hard offset shadow; statements in Fraunces, form text in Space Grotesk; WhatsApp green only on the call to action. Choreography follows the service order: tutor arrives, the report fills in row by row, it reaches the parent, then the invitation; the camera leans to the report and settles back. Profile `lbc-daylight@0.1.0` in `work/visual-parity/lbc-profile/`, pinned direction in its `direction.md`.

**First delivered opening (retained before feedback).** `work/visual-parity/lbc-first-draft/lbc-opening-first-draft.mp4`, SHA-256 `eb02e48d24bd074ef9dd…`, copied from build `6df19e63dfe1-d6eada36-202`, source `ca37acc6ffcb27efb70d61e8602e7ff83fcdc7f82604f148a09306f015e4b317`, `naraframe-draft/8`. 240 frames, 8.000 s, 540 × 960, no audio. Its exact source is retained as `scenes.first-draft.json`, with `contact.png`. Command, pinned Node on the public CLI:

```
/opt/homebrew/opt/node@24/bin/node packages/cli/dist/index.js \
  preview work/visual-parity/lbc --draft --scene opening --json
```

The frozen skill procedure was followed in order: `doctor`, `schema` (camera moves, `space`/`parallax`, `transform` and `exit` found there, not in the skill text), `create`, a written shot rundown kept in the scene `note`, `validate --stage plan` (valid on the first attempt, no warnings), `preview`, inspection. The opening uses a media photo, three passive SVG objects, a world-plane report rig with its rows and parent photo, a screen-plane statement, brand line and call to action, two camera moves, and `reveal`, `exit` and `emphasize` beats.

**Trial finding — a runtime defect, worked around in data, not patched.** Headline `spans` do not render as runs within a line. `DraftVideo` places each span as a direct child of a `display: flex; flex-direction: column` text box, so every span becomes its own line; the statement "Progres anak " / "kelihatan" / "." stacked on three lines and the final period was clipped by `overflow: hidden`. Preflight measures the same spans as one flowing paragraph, so it reported nothing. This breaks the contract that rich-text measurement uses the same layout as rendering, and the frozen skill's own advice (set the turning word as a `spans` run) produces it. The approved Medan opening is unaffected: it uses no spans. The rejected first Medan attempt did, and its headline "Medan? / Katanya / semrawut" without a period was this defect, previously misread as ordinary wrapping. For the trial the accent word was authored as its own text layer coloured with the `palette.accent` token, inside an overlay group that carries the statement's reveal and emphasis, so the profile still owns the colour. No file under `packages/` or `skills/` changed (`git diff origin/main -- packages skills` is empty). A bounded reusable correction needs a decision; per this task's rule, correcting it means a separately recorded fresh trial afterwards.

**Internal corrections: one.** After inspecting render 1: the span workaround above, and world content moved 70 px lower with a gentler camera lean (y 80 → 60) because the tutor photo pressed against the statement's last line mid-lean.

**Effort, measured from command timestamps.** Trial start (freeze confirmed, `doctor`) 11:52:39Z; authoring start 11:55:04Z; render 1 11:56:06Z (20.6 s render command); correction 11:58:16Z; first draft retained 11:59:01Z. About 6.5 minutes of command-side wall clock from trial start to retained draft; model reasoning time between commands is included in that span but not separable. Two renders of 240 frames. No paid provider or new dependency. Token and cost figures are **unavailable**; M2.4.1 engine development is excluded from these numbers.

**Not yet done.** Owner judgement of the direction; then the ordinary "change headline" and "slow camera" requests through source edits, scoped preview and `undo`; the media-reuse and style-binding checks; focused edit/undo checks. No commit, push or merge.


**Owner direction.** Fatih judged the first opening's direction worth developing as an LBC video, 2026-09-26 ("Layak, lanjut revisi").

**Ordinary revisions, through the public CLI only.** Each plain-language request was translated into a source edit staged outside the project, applied with `edit --from <staging> --expect <revision>`, then checked with `preview --scene opening`. No user coding, no runtime or skill change.

| Request | Source change | Revision | Build | Reuse report |
|---|---|---|---|---|
| (first draft) | — | `ca37acc6…` | `6df19e63dfe1-d6eada36-202` | — |
| "Ganti headline" | `statement-1` text → "Tutornya yang datang ke rumah." | `a5bff464…` (parent `ca37acc6…`), only `scenes.json` | `f4a8d12591e3-33c2ad5a-4f1`, fresh | images 2/2 unchanged, voice 0, scene 1 changed |
| "Perlambat kamera" | `lean-to-report` 2800 → 3400 ms and `settle` 2800 → 3000 ms, same destinations | `174d41ea…` (parent `a5bff464…`) | `118a48d27119-731161fe-50e`, fresh | images 2/2 unchanged, scene 1 changed |

**Undo.** Two `undo` calls stepped back `174d41ea… → a5bff464… → ca37acc6…`. After each, the preview reused the earlier build's pixels without rendering (`reusedFromBuildId` `f4a8d12591e3-33c2ad5a-4f1`, then `6df19e63dfe1-d6eada36-202`), so each undo restored the exact earlier output. Re-applying the same two staged edits produced the same revision ids `a5bff464…` and `174d41ea…` (content-addressed), and the preview reused `118a48d27119-731161fe-50e`. The project is left at the revised state.

**Retained drafts.** `work/visual-parity/lbc-first-draft/` (first delivered, unchanged) and `work/visual-parity/lbc-revisions/`: `lbc-opening-rev1-headline.mp4` (SHA-256 `e14bcf06c686fa5187b4…`), `lbc-opening-rev2-headline-slower-camera.mp4` (`de042dc03f386dcaf47e…`), `scenes.rev2.json`, and `compare-draft-rev1-rev2.mp4` (`38f19f2c6f3b580f83d2…`), the three side by side.

**Media reuse and style bindings — what was and was not shown.** Both edits left every media file untouched: the reuse report shows the two photographs unchanged at ratio 1, and the three SVG files' hashes are unchanged in the manifest. Two limits are recorded rather than claimed away. The reuse report counts only raster `images`; the three vector assets are not reported in it at all, so vector reuse is visible only through the manifest hashes. This opening has no audio, so audio reuse was not exercised. For style bindings, the frozen engine has no image style-binding record: these assets carry `origin` only and nothing infers their compatibility with a profile. No profile change was made in this task, so the explicit-review path for unknown bindings after a profile change was not exercised here; it remains M2.4.5 scope.

**Focused checks.** Existing edit/undo/revision suites only, since adding tests would modify `packages/` and break the freeze: `revision-commands`, `revisions`, `edit-scope`, 3 files / **31 tests** passed. `git diff origin/main -- packages skills` is still empty.

**Effort.** From the command log: headline edit 12:01:16Z, camera edit 12:02:01Z, undo sequence 12:02:36Z; about 10 minutes of command-side wall clock from trial start (11:52:39Z) to the revised state, model reasoning between commands included and not separable; each edit plus scoped preview was one render of 240 frames, and each undo preview was a reuse with no render. Totals for the trial: four fresh 240-frame renders (two for the first draft, one per revision) and three reuse previews. Token and cost figures are **unavailable**.

**Remaining for M2.4.2.** Authorised integration and its required checks/evidence. Supervisor early-transfer review is complete with the explicitly open rich-text defect above; do not silently patch the frozen trial. No commit, push or merge yet.


**Integration gate — 2026-09-26.** Supervisor set TECHNICALLY_READY for the early transfer gate and asked for integration under the project gates; the accepted trial is not repeated. The M2.4.2 change in Git is this plan evidence only: the trial's project, profile, artwork, renders and retained drafts live under `work/`, which is git-ignored by design, and `git diff origin/main -- packages skills` is empty (checked raw, without the `rtk` summary). `pnpm verify` on this tree passed: 24 unit files / **214 tests**, 29 integration files / **240 tests**, Biome and TypeScript clean. `pnpm test:e2e` was not rerun: no runtime, schema, CLI or skill file differs from `3133af8`, where the serial E2E gate last passed, and the plan schedules the full E2E close-out at M2.4.5. Integrated through PR #13 (https://github.com/fatlhr/NaraFrame/pull/13), squash-merged into `main`, with no agent identity in Git metadata per AGENTS.md.

**Follow-up, separate small task (not part of M2.4.2).** Fix the rich-text defect before `spans` are used again: render a headline's spans as inline runs within one text flow instead of stacked flex items, keep preflight measuring the same layout as rendering, add a regression with a trailing run (for example a final "."), and bump `RENDER_ENGINE` because pixels change. Until then, authors should keep an accented word as its own text layer coloured with a `palette.*` token, as the trial did.

**Follow-up done — rich-text span fix, 2026-09-26** (branch `fix-inline-headline-spans`, separate from the M2.4.2 trial).

- *Reproduced on the real render path first.* Throwaway project `work/visual-parity/span-probe` renders "Progres anak kelihatan." twice: with spans (runs `"Progres anak "`, accented `"kelihatan"`, `"."`) and as plain text. On `naraframe-draft/8`, build `dcaa10655fb4-29179687-8a6`, the span version lost its final "." while the plain version kept it, and preflight reported nothing.
- *Fix.* `LayerView` in `draft-video.tsx` now wraps the runs in one element, so the column text box has a single child and the runs flow and wrap as one line of text, which is the layout preflight already measured. The no-spans path is unchanged. `LayerView` is exported as a test seam; no other runtime change. `RENDER_ENGINE` moves to `naraframe-draft/9` because pixels change.
- *Proof after the fix.* The same probe renders fresh as build `1190b21796b5-891a5531-698` (`reusedFromBuildId: null`): "kelihatan." keeps its period, the unstyled "." sits directly after the gold word on the same line, and both versions wrap identically.
- *Regression.* `packages/renderer-remotion/test/unit/text-spans-render.test.ts` renders `LayerView` with `react-dom/server` (already a renderer dependency, nothing installed) and checks the markup: one wrapper holding all three runs, the accent colour only on its own word, the trailing "." present as an unstyled run, and plain text unchanged. With the wrapper temporarily replaced by a fragment, the structural case fails (1 failed / 2 passed); restored, all pass.
- *The M2.4.2 trial is untouched.* Its project, first draft and revisions stay on `naraframe-draft/8` as recorded; nothing under `work/visual-parity/lbc*` was rendered or edited for this fix, and the retained MP4 checksums are unchanged.
- *Gates.* `pnpm verify`: 25 unit files / **217 tests**, 29 integration files / **240 tests**, clean. Serial `pnpm test:e2e`: 6 files / **9 tests**, 645.7 s, exit 0. Integrated through a PR squash-merged into `main` under the owner's order (fix → real render → regression → integration), no agent identity in Git metadata.



#### Handoff record — M2.4.1 (integrated)

**Final status — 2026-09-26: INTEGRATED** via PR #12, squash commit `3133af8`, after owner approval of the opening (2026-09-21), supervisor TECHNICALLY_READY, and green `pnpm verify` / serial `pnpm test:e2e` on the final candidate. The status lines below are the historical sequence and are kept as evidence; they no longer describe current state.

**Supervisor status — 2026-09-26: TECHNICALLY_READY for final integration gates.** The exit overlap finding is closed. Supervisor inspected the compiler change and all six regression cases, freshly ran six focused files / **80 tests** (passed) and the TypeScript core/renderer/CLI build (passed). The original independent source-compiler probes now reject both `exit` + `reveal` and `exit` + `exit` with `MOTION_PROPERTY_OVERLAP`; sequential, independent-property and legacy-only cases pass the regression suite. Previous CHANGES_REQUESTED evidence is retained in the fix record below. This scoped technical sign-off is not a fresh full-suite pass, milestone completion, or merge authorisation: final-candidate `pnpm verify` and `pnpm test:e2e` remain required, with the 2026-09-21 full results kept as implementer-reported history. Keep the owner-approved opening unchanged. Do not start M2.4.2 before authorised integration. Recommended integration remains PR/squash per AGENTS.md. No commit, push or merge was performed during this review.

**Implementer status (historical):** Final-candidate gates passed 2026-09-26; integrated via PR #12 (squash `3133af8`). The implementer earlier wrote TECHNICALLY_READY here, which is a supervisor-only state under the coordination rule below; corrected on 2026-09-26. Fatih approved the full 6.4-second opening build `536f182ba54b-d7c57043-698` on 2026-09-21 ("approve dari aku"). This is the owner's visual acceptance of the opening shot. It is not supervisor sign-off, not a passing integration gate, and not merge authorisation. Fatih accepted the static direction ("cukup dan terlihat sama persis") and, on 2026-09-21 after receiving the two cloud-hosted review MP4s, accepted the 3-second motion study ("sudah oke"). Study build `67cb9fb19695-51ffa299-f9b` uses camera/parallax and opaque object travel through the public CLI; source and renderer remain editable and topic-independent. Static/rejected checkpoints are preserved. This accepts the study's direction, not full opening or benchmark parity. Full opening, broader review and integration gates remain pending. Task HEAD `9747193`, recorded main baseline `7b232c9`; no commit, merge or push.

**Required next execution (historical, done):** run the final-candidate integration gates, then obtain explicit Git integration authorisation. The exit overlap fix has supervisor sign-off; the full opening is already assembled and owner-approved according to the handoff. Do not rebuild or redesign it for this compiler-only finding. Do not jump to M2.4.3 or rebuild the full Medan story. M2.4.2 is the mandatory next transfer gate after integration, not optional final-stage testing.

**Supervisor findings:** see `docs/refine-spec.md` section 12, VS-02/08–11. Preserve rejected build `5d3b28594596-96b47423-ac5`, source revision `ac7be815bcf955ab3278ec7d9e1c87d1a814d64f1fbbeb1f84ccd033f2a27e93`, MP4 SHA-256 `f108dbe925c073fa8087dbfa25aad6ec22faa086f2f204cab3c80759c0d4ad6e`, and contact-sheet SHA-256 `aca671a2bf7a11ec5229c3c2b9585a4134fc9fea393a1ba6123a7c2b81b24c81`. Near-zero cached-build timings do not measure fresh rendering. Owner-reported token dissatisfaction is retained; exact tokens/cost are unavailable.

**Coordination:** one writer at a time. Implementer records IMPLEMENTING, then READY_FOR_REVIEW and stops at the requested checkpoint. Supervisor explicitly sets IN_REVIEW, then CHANGES_REQUESTED or TECHNICALLY_READY with evidence. TECHNICALLY_READY is not Fatih's visual approval or merge authorization. Claude learns review has started by reading this handoff when instructed/resumed; this file is not an automatic notification or polling system. No concurrent edits, automated waiting, or new coordination file is required. Record owner decision separately before closing the task; proceed to the next numbered task only after required acceptance/integration and trunk sync under project rules and applicable authorization.

**Handoff evidence fields:** active checkpoint; exact changes and source/engine/skill revision; command and artifact path/hash; observed visual differences; checks actually run; reference-playback status; internal versus owner corrections; development versus authoring/render effort; actual usage or unavailable; blocker and next action. Keep it compact.

##### Supervisor checkpoint — 2026-09-21

- [x] Inspect the supplied recording as an 18-frame sequence (2 fps): centered serif headline, yellow emphasis, layered muted city, Malay motif, three explanatory road signs, followed by the newspaper/stamp. This is not full-speed motion acceptance or full-story playback. The clip starts after title entry; its original timeline offset is estimated.
- [x] Produce and inspect a static reference adaptation through the public CLI. Eleven passive SVG layers retain separate illustration objects; headline and road-sign labels remain native editable text. No reference screenshot, executable project code, paid generation or new dependency is used. Google Fonts OFL files are local, including Fraunces optical-size 144 / weight 600. Source attribution and unresolved public-redistribution rights are recorded in the project's `provenance.json`.
- [x] Owner accepts this frame: "cukup dan terlihat sama persis", followed by "lanjut". This accepts the static direction only.
- [x] Produce the 3-second motion study: public CLI build `67cb9fb19695-51ffa299-f9b`, 90 frames, inspected sampled sequence, focused checks below.
- [x] Owner accepts the study's motion direction: "sudah oke", 2026-09-21, after cloud delivery of the study and comparison. Full opening, one-prompt authoring and cross-topic generalisation remain unproved.

**Active feature — short motion study:** command `node packages/cli/dist/index.js preview work/visual-parity/medan-motion-study --draft --scene opening --json` under the pinned Node. Expected output: 3 seconds, retained artwork/type, one coherent camera move with depth-dependent parallax, screen-fixed headline and opaque pin travel; no scene fade masquerading as motion. World sign labels must remain attached to their sign plane. Add only explicit camera framing/moves, world/overlay plane metadata and bounded object transform actions needed for this shot. Defaults preserve existing coordinates; frame-derived shared transforms serve rendering and preflight, sequential moves retain end poses, overlapping same-property writes fail. Preserve static output; no new plan or project-specific renderer branch. Stop at study review, not full opening or merge.

**Actual command:** pinned Node 24.20.0 runs `packages/cli/dist/index.js preview work/visual-parity/medan-fidelity-frame --draft --scene opening --json`. This uses the public CLI directly because the ambient pnpm does not match the repository pin; no package-manager replacement was installed. Output is a 15-frame / 0.5-second diagnostic hold at 540 × 960 / 30 fps, not the completed opening.

**Result:** fresh build `756b6958b781-13491d1f-243`, source `d80fca81a0520b3d3b5005beddc1a6c9d462b4d0e8e1e31747c89ef8be48f64b`, engine `naraframe-draft/5`, no cached build reuse. Inspect `work/visual-parity/medan-fidelity-frame/reference-vs-engine.png` (reference left, engine right) and `frame-review.png`; the latter SHA-256 is `a65ef9f50633f4ec3d91b2e12092c7e057278e56ff2e6362c63a25117dd224e7`. MP4 at `preview/builds/756b6958b781-13491d1f-243/preview.mp4`, SHA-256 `b1f398d881d07e9702b9433eb6bba8ad4a5fe1af81c873c119586e9db750502c`. The original rejected artifacts are unchanged.

**Observed differences and limits:** headline family/optical size, highlight, street signs, layered city and ornament now follow the reference. Building/window details, grain, exact highlight geometry and framing still differ. The draft watermark remains. There are four contrast warnings: the SVG sign backdrop is not understood by the contrast model, and the keyword's text box extends past its highlight rectangle although visible glyphs sit on yellow. The right sign label also triggers a profile safe-zone warning; it is visibly readable but close to the edge. These warnings are retained, not suppressed or counted as a clean production gate. No motion-quality or superiority claim is made.

**Reference evidence:** recording `/Users/fatih/Personal/Screenshots/Screen Recording 2026-09-21 at 01.04.30.mov`, 1018 × 1808 / 60 fps / 8.9 s, SHA-256 `088b1360df772ce42a3742e76bd51e7b7edd6e611f1fcb36955f130006549366`. Its contact sheet and first frame are under `work/visual-parity/reference-recording/`. Reference HTML hash stays `b7cc95df3b0f1eeb55f2b0a53f8fec527b561a9c1eb52574053b92eb0e52a78b`; no browser-policy workaround was used.

**Technical checks from supervisor recovery:** 93 focused tests across 7 files, TypeScript build and focused Biome checks passed before artwork authoring. Static authoring did not change the engine further. The earlier font E2E rerun had an unresolved generic failure on its valid-font case; standalone direct/public CLI and exact-fixture probes subsequently rendered successfully, but that does not turn the failed suite into a pass. Full `pnpm verify` and `pnpm test:e2e` remain mandatory before integration. No merge readiness is claimed.

**Effort:** two successful 15-frame renders; two additional preview invocations stopped at measured text overflow/collision before rendering, and initial source validation caught schema/label bounds mistakes. One visual correction after inspecting the first render: static optical font, highlight size and pin pose. Final render command reported 4.873 seconds; this is render-command time, not total development/authoring time. Token/cost and complete wall-clock authoring time are unavailable. No paid provider was invoked. Skill unchanged; automatic authoring improvements remain unproved.

##### Motion-study execution evidence — 2026-09-21

**Output:** `work/visual-parity/medan-motion-study/preview/builds/67cb9fb19695-51ffa299-f9b/preview.mp4`, SHA-256 `f8a811ea76b2a0c653f4779a0ad2120fe13c758182592378fc5d1fbb0a316001`. Source `0490ea9951a36f27b4bac59377b57e9e4d44b14e7dc63ac6fac915ac8ae01d3c`, assembly `67cb9fb19695e06fbf33c802e31b6f2948c1d06f21e4d9d3306b1c0d01364bfb`, renderer `naraframe-draft/7`, fresh render, `reusedFromBuildId: null`. ffprobe confirms H.264, 540 × 960, 30 fps, 90 frames, 3.000 s and no audio stream. Command: pinned Node executes `packages/cli/dist/index.js preview work/visual-parity/medan-motion-study --draft --scene opening --json`.

**Observed:** sampled frames at 0.5-second intervals show camera drift, depth-dependent city movement, sign labels staying on their plane, fixed headline, and opaque pin travel left then back. World SVG viewboxes have horizontal overscan to avoid exposed artwork edges. `motion-review-contact.png` and `reference-vs-motion.mp4` are comparison artifacts in the study project; the latter places the supplied recording's first 3 seconds left and NaraFrame right. They are not timestamp-verified matched choreography: reference headline exit is not reproduced in this component study. No full opening or motion-parity approval is claimed.

**Editable contract delivered:** optional `scene.camera.initial` and sequential timed `moves` (x/y viewport offsets and zoom); explicit `space: world` with `parallax` on a layer or flat group, omitted/overlay stays screen-fixed. Group members inherit their parent's plane and are projected once. `transform` beats write explicit endpoint offsets for x/y/scale/rotation, preserve prior per-property endpoints, and do not imply a fade. New conflicting property writes and overlapping camera windows are rejected after frame quantisation. Legacy-only beat combinations retain previous behavior. Required text is checked through the same object/group/camera transforms as rendering at diagnostic sample frames. Off-camera world scenery is permitted; moving required text beyond canvas produces an error. This is not nested-world reuse, path following, or phrase-anchor timing delivery.

**Checks:** TypeScript build passed. Four focused files passed **60 tests**, including source-coordinate scaling, scoped/full scene camera equivalence with a preceding scene, camera cache invalidation, overlapping motion rejection, direct frame seeking with sequential endpoints, independent property motion, positive depth zoom, parent world-label collision and animated text clipping. `biome check` on the 12 touched motion-related source/test files passed without warnings. These use real pure motion/compiler logic plus existing mocked text measurement; MP4 render supplies separate browser runtime evidence. Full verify, renderer E2E, broader review and previous font E2E rerun are still pending before integration.

**Process/effort:** the helper stopped mid-implementation at a reported usage limit; supervisor continued the saved partial changes, corrected compiled-schema placement, connected shared preflight and plane z-order, then rendered before adding focused tests. Two successful 90-frame renders (first engine /6, final /7); no visual correction after the first rendered study, one technical hardening pass. Final render command reported 10.049 s, not total authoring/development time. Paid providers/dependencies: none added. Actual token/cost and complete authoring wall time unavailable. Four existing SVG/highlight contrast warnings and the right-label safe-zone warning remain visible. Static fidelity output and rejected attempts remain unchanged. Skill/art-direction automation and full integration are not marked complete.

##### Final-candidate gates and integration — 2026-09-26

**Direction.** After the exit overlap-validation fix, the owner directed: run `pnpm verify` and `pnpm test:e2e` on the final candidate, report, and once both pass integrate through PR + squash per AGENTS.md.

**Candidate.** Branch `m2-4-1-first-illustrated-shot`: commit `9747193` plus the full working tree at that point (all M2.4.1 source, tests, and the M2.4 spec/refine-spec/plan revisions). `origin/main` was `7b232c9` and already contained in the branch, so no rebase was needed and the tested tree is the integrated tree. Runtime: Node 24.20.0 and pnpm 12.3.4 as pinned.

**`pnpm verify`: passed.** Biome, TypeScript build, 24 unit files / **214 tests**, 29 integration files / **240 tests** (the 234 of 2026-09-21 plus the six exit-overlap cases), second typecheck. 13.5 s.

**`pnpm test:e2e`: passed.** 6 files / **9 tests**, 654.7 s, run serially on its own, exit 0. Includes font readiness in the frame render context (valid and broken face), reference projects, scoped preview reuse, owner flow and soundtrack mix, all under `naraframe-draft/8`.

**Integration.** Committed with explicit paths, pushed, and opened a PR against `main`; squash-merged after the gates above. No agent or tool identity in commit or PR metadata, per AGENTS.md. PR #12, https://github.com/fatlhr/NaraFrame/pull/12. Generated preview/output under `work/` is git-ignored and not part of the change.


##### Exit overlap-validation fix — 2026-09-26

**Finding (supervisor, CHANGES_REQUESTED).** Overlapping `exit` + `reveal` and `exit` + `exit` writes to the same target's opacity compiled with `ok: true` and no `MOTION_PROPERTY_OVERLAP`. Cause: `validateMotionWindows` only compares two windows on a shared property when at least one of them is `modern`, and only `transform` set `modern`. My earlier record claimed exit already took part in the rule; it did not.

**Reproduced before fixing** on the built package, by compiling the approved opening's source with substituted beats on `headline`:

| Beats on one target | Before | After |
|---|---|---|
| `reveal` 0–1000 ms + `exit` 500–1500 ms | `ok: true` | `ok: false`, `MOTION_PROPERTY_OVERLAP` |
| `exit` 0–1000 ms + `exit` 500–1500 ms | `ok: true` | `ok: false`, `MOTION_PROPERTY_OVERLAP` |
| `reveal` 0–1000 ms then `exit` 1500–2000 ms | `ok: true` | `ok: true` |
| `reveal` + `reveal` overlapping (legacy-only) | `ok: true` | `ok: true` |

**Change.** One line in `packages/core/src/compiler/compile-draft.ts`: `modern: beat.action === "transform" || beat.action === "exit"`, with a comment giving the rule. Overlaps among the original presets (`reveal`, `emphasize`, `focus`) are still accepted, so existing projects keep compiling. No schema, renderer, motion or visual change; `RENDER_ENGINE` stays `naraframe-draft/8` because compiled output and pixels are unchanged.

**Regression coverage.** New `describe("compileDraft — exit beat overlap validation")` in `packages/core/test/integration/compile-draft-m0-10.test.ts`, six cases: exit+reveal overlap rejected (and the issue names `opacity`); exit+exit overlap rejected; an exit's drift overlapping a transform on the same axis rejected; reveal then exit sequential accepted; a fade-only exit overlapping emphasize (scale) and a transform (x) accepted as independent properties; overlapping reveal+reveal still accepted. Verified that the tests bite: with the fix temporarily reverted, exactly the two supervisor cases fail (2 failed / 16 passed); fix restored.

**Approved opening unaffected.** `validate work/visual-parity/medan-opening --stage plan` passes with source revision `e67c56cbb968d74e…`, identical to approved build `536f182ba54b-d7c57043-698`; only the known artwork warnings (`CONTRAST_INSUFFICIENT`, `TEXT_OUTSIDE_SAFE_ZONE`). Its exits run 5.5–5.92 s and 6.3–6.4 s, after every other write to the same properties, so the stricter rule does not touch it. No re-render.

**Checks actually run.** TypeScript build (`tsc -b` core, renderer, CLI) clean. Six focused files, **80 tests**, passed: motion-transitions, capabilities, visual-preflight, compile-draft-m0-10, render-engine-identity, visual-schema (74 before plus the 6 new). `biome check` clean on both touched files. Full `pnpm verify` and `pnpm test:e2e` were not rerun for this one-line compiler change; the last full runs (2026-09-21) are implementer-reported history, and both remain required on the final candidate before authorised integration.

**Not done.** No commit, push or merge. Recommended integration route per the supervisor is PR plus squash (AGENTS.md); not authorised in this pass. The opening's visuals, the motion system and M2.4.2 were not touched. Token and cost figures are **unavailable**.


##### Supervisor decision on the exit gap — relayed 2026-09-26

**Received.** The supervisor's decision on the reported exit gap was: add an `exit` beat at small scope with the five conditions recorded above (5.5 s statement exit, 6.3 s pin exit, hidden after the window including direct seek, one opacity shared by renderer and preflight without globally disabling text checks, renderer identity bump); then implement → render the opening → focused regression tests → review; no camera extension and no new animation system; M2.4.1 stays open.

**Already done before this relay.** All of it was implemented on 2026-09-21 under the owner's matching instruction and is recorded in "Exit beat and re-rendered opening" below: build `536f182ba54b-d7c57043-698`, engine `naraframe-draft/8`, three `exit` motion tests, full `verify` and serial `test:e2e` green. No code was changed for this relay.

**Recorded difference, not resolved: an empty yellow bar on screen.** The supervisor observed that the marker appears as a yellow block sliding in before the keyword. That is visible in the build, roughly 1.00–1.46 s: `highlight-wipe` runs 1.00–1.46 s and `keyword-in` only starts at 1.46 s. It is a direct consequence of the second internal correction, which ordered the marker before the keyword because the keyword is dark ink and read as "emrawut" while an unfinished sweep crossed it. Swapping the order back reintroduces that defect. The reference avoids both with a `scaleX` wipe that grows the marker under an already-visible word; this engine has no axis-only scale and no clip reveal, so neither ordering matches it. The exit beat does not affect this. Per the supervisor, word stagger and the marker sweep are deferred and stay listed as differences against the reference; no workaround was authored.


##### Integration gates — 2026-09-21

**Owner approval.** Fatih approved the full 6.4-second opening, build `536f182ba54b-d7c57043-698`, on 2026-09-21. This covers the opening shot's visuals and motion. It is not supervisor sign-off and not merge authorisation.

**`pnpm verify`: passed.** Biome, TypeScript build, 24 unit files / **214 tests**, 29 integration files / **234 tests**, second typecheck. First full run since the renderer identity moved `naraframe-draft/4` → `/8`; nothing was left broken by those bumps.

**`pnpm test:e2e`: passed.** 6 files / **9 tests**, 635 s, run serially on its own. This includes `font-readiness`, whose valid-font case previously failed with an unresolved generic error; it passes here, so that open item is closed by a real run rather than by a standalone probe. It also re-covers scoped preview reuse, reference projects, the owner flow and the soundtrack mix under the new engine.

**State.** Nothing committed. Branch `m2-4-1-first-illustrated-shot`, HEAD still `9747193`, working tree carries every change. No push, merge or upload.

**Remaining before M2.4.1 can be called complete (historical; resolved 2026-09-26 by supervisor sign-off and PR #12):** supervisor review of this handoff, and integration authorisation. Open items that are recorded and not blockers: the five plan-stage artwork warnings (contrast model cannot see the SVG backdrop behind sign text; right label near the safe-zone edge), sentence-level rather than word-level text entry, marker slide instead of a `scaleX` wipe (visible as an empty yellow bar for roughly 1.00–1.46 s before the keyword arrives), and reference playback still limited to the 8.9 s recording that starts after title entry.


##### Exit beat and re-rendered opening — 2026-09-21

**Owner decision implemented.** Fatih approved adding an `exit` beat at small scope: headline, keyword and highlight leave together from 5.5 s, the pin from 6.3 s, elements stay hidden once the window has passed including a direct seek, renderer and preflight share one opacity, text checks are not globally disabled, and the renderer identity moves so old cache cannot be reused.

**Change.** `exit` is the mirror of `reveal`, and nothing more.

| File | Change |
|---|---|
| `packages/core/src/schema/scene.ts` | `ExitBeatSchema`: optional `direction`, optional `distance`, optional `easingPreset` |
| `packages/core/src/schema/compiled.ts` | compiled `exit` variant |
| `packages/core/src/compiler/compile-draft.ts` | `exit` claims `opacity`, and an axis only when it actually drifts, so it takes part in the existing overlap rule; its distance is scaled to draft space like a reveal's |

> **Correction, 2026-09-26.** The claim in the row above was wrong. Declaring exit's properties did not by itself enable overlap rejection: `validateMotionWindows` only compares windows when one side is `modern`, and only `transform` was. The supervisor found `exit`+`reveal` and `exit`+`exit` overlaps compiling with `ok: true`. Fixed in the record "Exit overlap-validation fix" below.
| `packages/core/src/compiler/keys.ts` | `RENDER_ENGINE` `naraframe-draft/7` → `naraframe-draft/8` |
| `packages/renderer-remotion/src/remotion/motion.ts` | `state.opacity *= 1 - progress` plus the optional drift |
| tests | three `exit` cases in `motion-transitions.test.ts`; `capabilities.test.ts` now expects `exit` in the published beat list |

**Hidden after the window, from any frame.** `exit` reads only the beat window and the frame being drawn, and `interpolate` clamps, so every frame after the window resolves to opacity 0 with no memory of earlier frames. Tested directly: frame 191 and frame 60 both evaluate to 0 for a beat whose window ends at frame 45, with no frames rendered before them.

**One opacity, shared.** Preflight does not carry its own visibility model: `visual-preflight.ts` calls the same `motionStateFor` in five places and already gates each frame-sampled text check on `opacityOnScreen(...) < 0.9`. An exited layer therefore stops being checked for collision and canvas bounds at the frames where it is invisible, and only at those frames. Nothing was disabled globally: the static overflow, minimum-size and font checks still run for every text layer, and a visible layer is still checked exactly as before.

**Cache.** `naraframe-draft/8`. The same project input now compiles to assembly `536f182ba54b…`, which no earlier build carries; the render reported `reusedFromBuildId: null`.

**Re-rendered opening.** `work/visual-parity/medan-opening/preview/builds/536f182ba54b-d7c57043-698/preview.mp4`, SHA-256 `fd0f3b1ad169e75ede3e…`. Source `e67c56cbb968d74e6298712fc422e4ef…`, engine `naraframe-draft/8`, fresh render. ffprobe: 192 frames, 6.400 s, 540 × 960, 30 fps, no audio. Command, pinned Node 24.20.0 on the public CLI:

```
/opt/homebrew/opt/node@24/bin/node packages/cli/dist/index.js \
  preview work/visual-parity/medan-opening --draft --scene opening --json
```

The shot now matches the reference's scene-1 timeline end to end: pin in 0.3 s, sentence 0.7 s, marker 1.0 s, keyword 1.46 s, pin reading the street, statement out 5.5 s, pin out 6.3 s, cut at 6.4 s.

**Checks actually run.** `validate --stage plan` before rendering. Inspected `opening-exit-window.png` (frames 160–191): the sentence, its marker and the keyword lift and fade together and are gone by roughly 5.9 s, and the pin is mid-fade at the final frame, which is what the reference's `popOut` at 6.3 s does before its own cut. Six focused test files, **74 tests**, passed: motion, capabilities, visual preflight, M0.10 compile, render-engine identity and visual schema. `biome check` clean on the package tree. TypeScript build clean. The five plan-stage warnings are unchanged and still the known artwork ones. Full `pnpm verify` and `pnpm test:e2e`, and the pending font E2E rerun, remain the integration gate.

**Renders and corrections.** One render for this change, no visual correction pass needed after it. Earlier in the same session the opening itself took three attempts and the two allowed correction passes, recorded above.

**Not claimed.** No motion parity, no owner visual approval of the full opening, M2.4.1 not complete. No commit, push, merge or upload; no dependency or paid generation. Token and cost figures are **unavailable**.


##### Full opening execution evidence — 2026-09-21

**Output:** `work/visual-parity/medan-opening/preview/builds/c74100140ff2-e2f55cd9-79b/preview.mp4`, SHA-256 `e64d87b124191bf9877e…`. Source `bef024292a535eb8f2f16d920876553026acd1deb9d93f50fd74391313ec4874`, assembly `c74100140ff2a07a27271f72017406a41bfa0db5e2f6f7a1d68c8a2664f40efd`, renderer `naraframe-draft/7`, `reusedFromBuildId: null`. ffprobe: H.264, 540 × 960, 30 fps, 192 frames, 6.400 s, no audio stream.

**Command.** Pinned Node 24.20.0 runs the public CLI directly, because the ambient shell has no `pnpm` on PATH and its default Node is 22.23.2; no package manager was installed or replaced.

```
/opt/homebrew/opt/node@24/bin/node packages/cli/dist/index.js \
  preview work/visual-parity/medan-opening --draft --scene opening --json
```

**Project.** New `work/visual-parity/medan-opening/`, copied from the accepted study so artwork, fonts, profile and `provenance.json` are unchanged. The accepted study project and its build `67cb9fb19695-51ffa299-f9b` are untouched as the checkpoint. Only `scenes.json` (duration, camera, beats, note) and `naraframe.json` (id, title) differ. No renderer, schema, compiler or skill change was made in this pass; no project code, no reference screenshot or video stands in for an object.

**Choreography, against the reference shot.** The reference scene-1 timeline is `popIn(aPinR1, 0.3)`, `say('s1', 0.7, 'up')` with 0.09 s word stagger and the highlight marker at `at + n×0.09 + 0.35`, then `unsay('s1', 5.5)` and `popOut(aPinR1, 6.3)` before the 6.4 s cut. What was authored:

| Reference | This opening |
|---|---|
| pin in, 0.3 s | `pin-in` reveal, 0.30–0.82 s |
| sentence in, 0.7 s | `headline-in` reveal, 0.70–1.50 s |
| marker wipe, ≈1.32 s | `highlight-wipe` reveal from the left, 1.00–1.46 s |
| keyword settled with the sentence | `keyword-in` reveal, 1.46–1.98 s, then `keyword-hit` emphasize 2.05–2.51 s |
| — (our accepted study direction) | camera drift to x 95 / zoom 1.030 over 0–3.3 s, then easing back to x 46 / y −12 / zoom 1.048 over 3.4–6.4 s |
| — (our accepted study direction) | pin travels left 0.9–2.3 s, returns 2.5–4.2 s, settles 4.5–6.3 s |
| headline out, 5.5 s | **not reproduced** |
| pin out, 6.3 s | **not reproduced** |

**Gap that blocks exact choreography.** The engine has four beat actions: `reveal`, `emphasize`, `focus`, `transform`. None of them removes an element. `transform` writes x/y/scale/rotation endpoints and explicitly does not imply a fade, and moving required text off-canvas is an error, so an exit cannot be faked by translation either. The reference's headline exit at 5.5 s and pin exit at 6.3 s are therefore held on screen instead. Smallest options, in ascending cost, for a decision rather than a unilateral change:

1. An `exit` beat mirroring `reveal` (opacity 1→0 with an optional direction/distance). Smallest and symmetric with what exists.
2. An optional `opacity` endpoint on `transform`'s `to`, reusing the existing sequential-endpoint and conflict rules.
3. Per-layer visibility windows in source. Largest, and it overlaps the timeline authority the compiler already holds.

A second, smaller gap: the reference staggers the sentence word by word and wipes the marker with `scaleX`. This engine reveals a text layer as one block and has no axis-only scale, so the sentence lands together and the marker slides in rather than wiping. Recorded, not worked around.

**Checks actually run.** `validate --stage plan` before rendering. The first render was refused by the real check with `TEXT_OUTSIDE_CANVAS`: the one-way camera drift pushed `label-begal` off the canvas at frame 191. Corrected by making the second camera move ease back rather than continue. Inspected `opening-contact.png` (12 frames, every 16th) and `opening-keyword-window.png` (frames 24–60): text readable, sign labels stay attached to their planes through the parallax, movement is continuous with no jump at the camera hand-off at 3.4 s, no exposed artwork edges, framing consistent. The five plan-stage warnings are the ones already recorded for this artwork — three sign-label and one keyword `CONTRAST_INSUFFICIENT` where the contrast model cannot see the SVG backdrop behind the text, and the right label's `TEXT_OUTSIDE_SAFE_ZONE`. They are unchanged and not suppressed. No test suite was run: this pass changed project data only. Full `pnpm verify` and `pnpm test:e2e` remain the integration gate, together with the still-pending font E2E rerun.

**Corrections and renders.** Three render attempts: one refused by the canvas check, two rendered. Two internal visual correction passes, the limit for this checkpoint: (1) the camera easing back so the left sign label stays in frame; (2) ordering the marker before the keyword, because the keyword is dark ink meant to sit on yellow and read as "emrawut" while the sweep was still crossing it. Final render command reported 16.3 s wall clock, which is render time, not authoring time.

**Not claimed.** No motion parity with the reference, no full-speed matched comparison, no owner visual approval, and M2.4.1 is not complete. Reference playback evidence remains the supplied recording only, which starts after title entry, so its offset against the source timeline stays estimated. Token and cost figures are **unavailable**; no per-task provider record is exposed to the implementer. No commit, push, merge or upload; no dependency, paid generation or new plan document.


##### Implementer recovery record — supervisor findings 1–4 (historical)

**Where this ran.** Branch `m2-4-1-first-illustrated-shot`, HEAD `9747193`, nothing committed. The implementer reported that a previous recovery narrative was overwritten during a plan revision; this attribution has not been independently established. The code changes survived in the working tree and are included below. This record is written into the existing Active handoff, not a new file.

**Working tree changed by this pass**

| File | Change |
|---|---|
| `packages/core/src/asset/svg-sanitize.ts` | shared attribute path for root and children; XML character-data handling |
| `packages/core/src/compiler/keys.ts` | `RENDER_ENGINE` → `naraframe-draft/4` |
| `packages/renderer-remotion/src/remotion/draft-video.tsx` | font readiness enforced, failure cancels the render |
| `packages/renderer-remotion/src/render-draft.ts` | translates a font failure into a directed source issue |
| `packages/core/test/unit/svg-sanitize.test.ts` | double-escaping expectation corrected; entity/CDATA/root cases added (38 cases) |
| `packages/core/test/unit/render-engine-identity.test.ts` | new |
| `packages/cli/test/e2e/font-readiness.test.ts` | new |

**Finding 1 — root bypassed reference validation. Closed.** The root's attributes were collected by a separate code path that never ran the URL checks or the id rewriting. Both paths now call one `sanitizeAttributes`, and the dangerous forms are judged before the root filter narrows what is kept, so a handler on the root is refused rather than quietly dropped. Probe on the built package:

| Root attribute | Before | Now |
|---|---|---|
| `fill="url(https://example.invalid/a.svg#g)"` | `ok:true` | refused `SVG_EXTERNAL_REFERENCE` |
| `stroke="url(data:image/svg+xml,x)"` | accepted | refused `SVG_EXTERNAL_REFERENCE` |
| `fill="url(#g)"` with the gradient renamed | kept `url(#g)`, dangling | rewritten `url(#probe-g)` |
| `fill="url(#missing)"` | accepted | refused `SVG_REFERENCE_UNRESOLVED` |
| `onload="alert(1)"` | accepted (silently dropped) | refused `SVG_UNSAFE` |
| `style="fill:red"` | accepted | refused `SVG_UNSAFE` |

**Finding 2 — text was corrupted. Closed.** Character data is now resolved to the characters it means and escaped once, instead of escaping the source again. CDATA inside `<text>` is kept as the artwork's literal wording rather than discarded; comments are still removed because they are not drawn. An entity this parser cannot resolve without a DTD is refused as `SVG_UNSUPPORTED_ENTITY` instead of being printed, and a numeric reference to an undrawable code point is refused the same way. No DTD, custom entity or external entity is enabled.

| Input inside `<text>` | Before | Now |
|---|---|---|
| `A &amp; B` | `A &amp;amp; B` | `A &amp; B` (one ampersand) |
| `caf&#233; &#x2014; 50%` | literal reference text | `café — 50%` |
| `<![CDATA[KOPI & TEH]]>` | dropped, wording lost | `KOPI &amp; TEH` |
| `a &nbsp; b` | printed literally | refused `SVG_UNSUPPORTED_ENTITY` |
| `a&#0;b` | — | refused `SVG_UNSUPPORTED_ENTITY` |

The test that asserted the double-escaped form was wrong and was corrected, not loosened.

**Finding 3 — renderer identity. Closed.** `RENDER_ENGINE` is `naraframe-draft/4`; the comment records that bundled faces now load in the frame context, so type that previously rendered substituted renders differently. The same project input now compiles to assembly key `8e3f35ca2e9b…`, which no existing build directory carries (`5d3b28594596`, `823c0877653d`, `b00666ce2b1a`, `ef866689de27`, `2ef27e0a9d78`), so the old renderer cache cannot be matched. A fresh preview confirmed it end to end: `reusedFromBuildId: null`, new build `8e3f35ca2e9b-2fefe436-c15`. Media generation is unaffected: `generationKeyForBlock` derives from spoken text and voice style only, which `render-engine-identity.test.ts` pins by producing the same key across two sources whose render tokens and engine string differ.

**Finding 4 — font failures were swallowed. Closed.** `useBundledFonts` now reads the result of `loadBundledFonts`, and additionally checks each declared face with `document.fonts.check` at its weight, because a registered family can still be unusable. Any failure calls `cancelRender`; `continueRender` is only reached when every declared face is ready. The node side recognises the failure and raises it as a `FONT_NOT_LOADED` source issue rather than a redacted `SYSTEM_ERROR`, so the message names the face the author must fix.

Proven in the render context, not in measurement:

```
node packages/cli/dist/index.js preview work/visual-parity/font-probe-ok     --draft --rerender --json
node packages/cli/dist/index.js preview work/visual-parity/font-probe-broken --draft --rerender --json
```

- valid face → `success: true`, `readiness: draft-only`
- unparseable face → `success: false`, `readiness: invalid`, `error FONT_NOT_LOADED — The render context could not use the bundled font(s): NaraFrame Probe Display 700.`

`packages/cli/test/e2e/font-readiness.test.ts` keeps both: the failure case builds its own corrupt face so it is self-contained, and the success case uses a local OFL face and skips where that file is absent. 15-frame projects, 15 s for the pair.

**Commands actually run in this pass**

```
node packages/cli/dist/index.js preview work/visual-parity/medan --draft --scene opening --json
node packages/cli/dist/index.js preview work/visual-parity/font-probe-{ok,broken} --draft --rerender --json
pnpm exec vitest run --project unit --project integration svg-sanitize vector-assets visual-preflight visual-schema capabilities render-engine-identity
pnpm exec vitest run --project e2e font-readiness
```

Results: 6 files / 84 tests passing for the touched suites; 2 e2e font cases passing; Medan opening build `8e3f35ca2e9b-2fefe436-c15`, source revision `f61f9dd5e57083d8`, `issues: []`, MP4 sha256 `ac6f51b5d0783049…`. One 192-frame render in this pass, plus three 15-frame probes.

**Checks deliberately not run.** Full `pnpm verify` and full `pnpm test:e2e`. Both remain the integration gate before merge, and the renderer change in finding 4 is behavioural, so both must pass before this branch is integrated.

**Still open.**

1. Reference playback remains unavailable. No MP4, MOV, WEBM or GIF exists in or beside the reference directory; the browser restriction was not bypassed and no motion comparison is claimed.
2. Reference provenance and asset rights for a fidelity adaptation are undecided.
3. No visual approval. The rejected first attempt and its artefacts are preserved; this pass claims no visual improvement and did not re-render old artwork to chase one.
4. Minimum camera/world/object motion for the opening (VS-03) is not implemented. It belongs to M2.4.1 when the shot needs it; the next visual step is a single reference-adaptation frame for review, then a motion study.

**Effort and usage.** Development, probing and regression tests were separate steps; no artwork authoring in this pass. Token and cost figures are **unavailable**: no per-task provider record is exposed to the implementer.


#### Historical first-attempt evidence — M2.4.1 (rejected)

**Historical implementer handoff:** originally READY_FOR_REVIEW; subsequently **rejected by Fatih**. The following change/test descriptions record what the implementer reported, not a fresh supervisor verification. Font readiness and safe SVG claims are superseded by the review findings in `docs/refine-spec.md` section 12. Preserve source/artifacts; do not use this record to check recovery tasks complete.

**Git snapshot.** Branch `m2-4-1-first-illustrated-shot`, cut from `main` at `7b232c9` (= `origin/main`). The M2.4 documentation revision was already uncommitted on the working tree at cut time and was carried onto the branch unchanged; nothing was stashed, reverted, or discarded. An unrelated pre-existing stash (`M3.1 word-level timing enforcement`) was left untouched. Nothing pushed, nothing merged.

**Reference baseline (retained unchanged, never written to).**

| File | sha256 | Observation |
|---|---|---|
| `index.html` | `b7cc95df3b0f1eeb55f2b0a53f8fec527b561a9c1eb52574053b92eb0e52a78b` | Ten `say` blocks `s1`–`s10`; artwork drawn as inline SVG with `defs` (`street`, `paper`, `stamp`, `map`, `front`, `sea`, `vig`, `grain`); headline runs use `<span class="hl">` highlights |
| `vo.mp3` | `e3d67194db8721bef69bd61a2fe290ceb418f67e84ed7a400d15b5cf643f4f97` | mp3, mono, 24 kHz, 160 kbps, **66.576 s measured** |
| `vo-script.md` | `aab96c5987f83f27b506bc9d06f5f7334578d0e106bae2e0df7357aa307133d4` | Ten numbered paragraphs plus a source list |
| `README.md` | `2936e3734812f065c87c1f75b41a56bca9c7c4b5b0285a90f7c14dcc3827e98f` | Declares 67.5 s total and the scene starts below |

Independently measured with `ffmpeg silencedetect=noise=-30dB:d=0.6`: speech ends at 6.00 · 13.03 · 21.70 · 25.89 · 30.16 · 35.71 · 41.90 · 51.54 · 58.21 · 61.28 s and resumes at 6.79 · 13.73 · 22.46 · 26.52 · 30.83 · 36.44 · 42.68 · 52.36 · 59.00 · 62.08 s. Eleven speech runs for ten paragraphs: section 4 contains an internal sentence pause at 25.89–26.52 s. These intervals numerically align with the README's stated scene starts (0 · 6.4 · 13.4 · 22.1 · 30.5 · 36.1 · 42.3 · 52.0 · 58.4 · 61.7). This does not establish phrase alignment by listening. The declared 67.5 s exceeds the measured 66.576 s audio by 0.92 s, so the full sequence needs an explicit terminal pause in M2.4.4 rather than a stretched voice track.

**Playback gap — open.** The reference has been read as source only. Its `index.html` has **not** been played and its motion has **not** been watched; the browser URL restriction recorded during planning was respected and not worked around. Static source analysis does not establish motion quality, so no motion comparison against the reference is claimed here, and the visual baseline for M2.4.1 acceptance remains incomplete until an MP4 or recording is supplied.

**Changes.**

- Core: `asset/svg-sanitize.ts` (new) accepts shapes, paint and geometry and refuses scripts, event handlers, `foreignObject`, self-animation, `image`/`iframe`/media, `style` elements and attributes, internal DTD/entities, external references, unresolved paint targets, and elements it cannot draw. It prefixes the artwork's own ids with the asset hash so two illustrations on one scene cannot capture each other's gradients or clips.
- Core schema: asset `kind: "svg"` (ready and planned); `RelativeSvgPathSchema`; compiled `svg` asset carrying the sanitised body and viewBox; text layer `spans` with `emphasis` of `accent` / `strong` / `quiet`, refused unless the runs join back to `text`; typography role `fontFamily`.
- Core loader: `loadPlanProject` reads and sanitises every vector asset into `PlanSource.vectors`, keyed by asset id, after the existing hash checks. The compiler refuses to inline markup nobody validated.
- Renderer: inline `<svg>` rendering for vector assets, per-span painting where the profile decides what an emphasis looks like, per-role font resolution shared by measurement and rendering, and weight-aware text measurement so a heavier run cannot overflow unnoticed.
- `RENDER_ENGINE` bumped `naraframe-draft/2` → `naraframe-draft/3`; inline vector artwork and per-span weights change pixels, so earlier builds must not be reused.
- Capability registry: `media.vectors: ["svg"]` and `textEmphasis` published; `svg` removed from `unsupported`. Two existing tests failed on this change and were corrected rather than the registry loosened.
- Skill: the art-direction procedure now requires an explanatory object, framing, type hierarchy, motion intent, and the relationship to neighbouring shots before source authoring, and states that a shot must not be flattened into one picture.

**Benchmark sources** live at `work/visual-parity/medan` (project), `work/visual-parity/medan-profile` (profile `medan-explainer@0.1.0`), and `work/visual-parity/tools/make-medan-art.py` (artwork generator). `work/` is git-ignored by design, so the evidence below is paths and hashes.

| Artwork | sha256 (first 16) |
|---|---|
| `sky.svg` | `93231369370d16b9` |
| `skyline.svg` | `b17e8e2d43328a1d` |
| `shophouses.svg` | `b2e6b3b5b30ec886` |
| `street.svg` | `d4882ee73053fc51` |
| `becak.svg` | `448ae4c4a20adb5b` |

The bundled label face is Source Code Pro (SIL OFL 1.1), copied from the local font library into `work/visual-parity/medan-profile/fonts/label.ttf` and pinned as the `label` role family. No CDN runtime or web font was fetched, and the reference's Fraunces/Space Grotesk were not used.

**Command and result.**

```
pnpm naraframe preview work/visual-parity/medan --draft --scene opening --json
```

`success: true`, `issues: []`, scope `{type: scene, sceneId: opening, sourceStartFrame: 0, sourceEndFrame: 192}`.

- Source revision `ac7be815bcf955ab3278ec7d9e1c87d1a814d64f1fbbeb1f84ccd033f2a27e93`
- Build `5d3b28594596-96b47423-ac5`
- `preview.mp4` sha256 `f108dbe925c073fa…`, 6.400 s, 540×960 @ 30fps, 192 frames
- `contact-sheet.png` sha256 `aca671a2bf7a11ec…`
- Artifacts under `work/visual-parity/medan/preview/builds/5d3b28594596-96b47423-ac5/`

**What the shot contains.** A night street: sky gradient, far skyline, a six-unit shophouse row with awnings, lit doorways and signage, asphalt with lane paint and four lit-rim potholes, and a becak crossing it. Five separate vector objects, not one flattened picture. Screen-space type above: a mono `MEDAN · SUMATERA UTARA` label and the headline `Medan? Katanya semrawut.` with `Katanya` quiet and `semrawut` accented. Beats: a `focus` push on the street and the row, `reveal` for the label and headline, a long `reveal` carrying the becak across, and one `emphasize` on the headline.

**Manual inspection and corrections.** Three renders. The first put a dead band under the road, drew potholes as dark holes on dark asphalt that vanished at draft size, and repeated an identical shophouse unit six times; the road was extended to the frame bottom, the potholes given a lit rim, and the row's widths, heights and paint varied with two dark poles in front. The second render revealed a thick kerb reading as a brown wall and the road overlapping the row so its doorways disappeared; the kerb was thinned and the road moved below the row. The third render is the one recorded above.

**Verification.**

- `pnpm verify` — 175 unit, 231 integration, clean typecheck and lint.
- New focused tests: `packages/core/test/unit/svg-sanitize.test.ts` (18 cases: accepted geometry, id namespacing across two assets, stability, width/height fallback, hex-colour-is-not-a-reference, metadata dropping, and refusals for script, handler, `foreignObject`, self-animation, `image`, stylesheet, style attribute, entity, external link, unresolved paint, missing root, missing viewBox, undrawable element); `packages/core/test/integration/vector-assets.test.ts` (4 cases: load → compile with gradient and clip preserved, render key changes only when the artwork changes, an unsafe asset refuses the whole project load, spans survive to the compiled layer); rich-text and per-role-font cases appended to `packages/renderer-remotion/test/unit/visual-preflight.test.ts`, including a weight-aware overflow case and a legacy no-spans regression.
- The preflight measurement mock was made weight-sensitive above 700 so the span assertions test something real; weights at or below 700 measure exactly as before, leaving the older cases unaffected.
- `pnpm test:e2e` after the `RENDER_ENGINE` bump: 5 files, 7 tests, all passing, run serially on its own. The engine bump invalidates earlier pixel reuse, and the reuse e2e still passes because it re-renders its own baseline within the run.

**Known gaps, not yet resolved.**

1. Reference playback is still unwatched, so no motion-quality comparison is claimed.
2. Fatih subsequently assessed and rejected this shot. NF-AC-16 remains unmet.
3. The illustration is orthographic. There is no perspective or vanishing point, so the street reads as a side-on band rather than a street receding from the viewer.
4. Layer frames must stay inside the design canvas, so world scenery cannot bleed past the edges. The becak therefore settles in frame instead of exiting. World-versus-overlay placement and off-camera scenery were deferred under the old M2.4.2 scope; the revised M2.4.1 now brings forward the minimum needed for faithful opening choreography.
5. Native `path` layers were not added; the opening is served by imported SVG assets. The checklist allows either, and only what the shot needed was enabled.
6. A faint warm ellipse on the upper road still reads slightly smudged at draft size.
7. Only the draft format was rendered. No final render, no audio, no narration binding for this shot.



#### M2.4.2 — Early frozen-engine LBC transfer

**Primary areas:** existing skill and public CLI, new LBC project/profile/source data only. Freeze compiler, renderer, schemas, CLI, trusted recipes and skill at the accepted revision before the trial.

- [x] Record the freeze and one LBC brief; use existing assets under read-only `/Users/fatih/Code/Playground/lbc_kimi`. Create a distinct 6–10s opening under `work/visual-parity/lbc`, not a Medan palette swap. Do not consult the old direct-Remotion composition as an implementation shortcut. Done: freeze and brief in the Active handoff; distinct daylight direction; direct-Remotion composition not opened.
- [x] Produce and retain the first delivered opening before feedback, recording internal corrections and available effort/usage separately from M2.4.1 engine development. One brief permits bounded internal iteration, not one model call. Done: `work/visual-parity/lbc-first-draft/`, one internal correction, effort recorded; the span-stacking runtime defect is recorded, not patched.
- [x] Ask Fatih whether the independent direction is worth developing as an LBC video. Then perform ordinary “change headline” and “slow camera” requests through source edits, scoped preview and undo, with no user coding or runtime/skill modifications. Done: accepted 2026-09-26; headline and slower-camera revisions applied with `edit`, scoped preview and `undo`, exact restoration shown by pixel reuse.
- [ ] Prove unchanged assets/audio are reused and unknown media-style bindings stay explicit. Preserve original and revised drafts; complete focused edit/undo/source compatibility checks after the manual path. **Partly shown:** photographs reused unchanged (ratio 1) and SVG hashes unchanged; drafts preserved; existing edit/undo suites pass (31). Not shown: audio reuse (no audio in this opening), vector assets are absent from the reuse report, and there is no image style-binding record to keep explicit; the profile-change binding review is M2.4.5 scope.
- [x] Record early transfer acceptance and integration evidence before longer Medan work. A needed runtime/skill patch fails this freeze: record the gap and seek a bounded reusable correction decision, then rerun a separately recorded fresh trial. Do not silently patch and call it generalisation. Done: owner accepted the direction, supervisor TECHNICALLY_READY, integrated via PR #13; no runtime or skill patch was needed, the span defect was worked around in data and fixed afterwards in PR #14.

**Command acceptance:** `pnpm naraframe preview work/visual-parity/lbc --draft --scene opening --json`

**Expected:** a different, credible LBC visual direction, obtained by source/profile changes on the frozen foundation; headline/camera revisions and undo work. This is the early NF-AC-17 gate, not the final 30s publication-candidate gate. Failure holds M2.4.3–5.

#### M2.4.3 — Extend river, route and data storytelling

**Primary areas:** core reusable composition, scoped dependencies and beat/phrase contracts; shared renderer geometry, path/object/data motion. Retain the opening foundation; grow only what these stories need.

- [x] Build `river-history` with nested/reusable world data, explicit detail-to-context framing, parallax and object-attached labels; retain readable screen overlay. Preserve legacy coordinates and reject cycles/duplicate ownership. Done: owner approved 2026-09-27 (review-2 copies and full draft `ca83f6f0b4d0-d8a209c7-fd9`). Reusable world data is shared vector plates plus billboard rigs; group ownership rules unchanged.
- [x] Build `shipping-route`: draw a route, move an opaque ship along it, and animate the associated figure. Add population comparison through visual data growth, not numbers alone. Done: owner approved 2026-09-27; population scene ID `population`, public command `pnpm naraframe preview work/visual-parity/medan-story --draft --scene population --json`. Its "ke-4" claim fails the BPS 2024 check and stays blocked for publication.
- [x] Add only missing draw-path/follow-path/count-up/transform/enter-exit/text-highlight capabilities required by these outputs. Keep all poses frame-derived, sequential end states retained and overlapping property writes explicitly rejected. Done 2026-09-27: `path`, `draw`, `follow`, `count`, `billboard`; existing reveal/exit/transform covered enter-exit and the marker highlight; overlaps rejected at resolved times (handoff record).
- [x] Bind required narrative beats to verified phrase anchors alongside local times; no fabricated word synchronization. Inspect actual audio alignment and both scene/full framing. Done 2026-09-27: 18 measured phrases, texts confirmed by Fatih listening; beats and camera moves carry `at` plus `startMs`; MP4 pauses within two frames; scoped/full poses compared.
- [x] After manual acceptance, add focused nested transform, path/count endpoints, conflict/retiming, text stability and dependency/cache regressions. Run required integration checks. If runtime changes since early LBC, rerun its retained opening/revisions as regression evidence on the new version; do not claim this is the original frozen trial. Done 2026-09-27: 34 focused cases, verify + serial E2E green, LBC copy re-rendered at `naraframe-draft/10` (SSIM ≥ 0.9969).

**Command acceptance:** `pnpm naraframe preview work/visual-parity/medan-story --draft --scene river-history --json` and `pnpm naraframe preview work/visual-parity/medan-story --draft --scene shipping-route --json`. (Retargeted 2026-09-26 by owner decision from `work/visual-parity/medan`, which holds the rejected first attempt and is kept as evidence.) Record the population scene's actual ID and public scoped-preview command alongside its evidence.

**Expected:** spatial context, direction and magnitudes become understandable through objects. World labels stay attached and scoped previews match full-video poses without prior playback.

#### M2.4.4 — Full Medan with continuity

**Primary areas:** source story/illustrations, transition dependencies and renderer focus/object continuity, existing narration/preview/final route.

- [x] Compose the ten-part narrative with shared capabilities; all Medan drawings, data and choreography remain source/assets. Add only required object/focus handoffs, no transition quota or Medan runtime branch. Technical: done 2026-09-27 (ten scenes, one schema-limit change, no Medan runtime code); visual quality not assessed.
- [x] Import the unchanged audio master with verified phrase references; explain its larger spoken-content revision scope. Recheck duration/listen: the recorded 66.576s audio needs an explicit approximately 0.924s terminal hold for 67.5s, not stretching or fabricated phrase timestamps. Done: master SHA equals the reference, 66.576 s + 924 ms hold, phrase texts confirmed by listening; a spoken revision (for example of the "ke-4" phrase) would replace audio and re-time every later phrase.
- [x] Produce full preview/contact sheet and inspect all scenes plus transitions. Compare matched narrative moments at equivalent size. Opening fidelity was a controlled starting experiment, not a ban on subsequent evidence-backed improvements. Done as evidence only: build `18a2906ac565-9566e37d-8e1`, ten matched reference frames; further comparison playback and polish cancelled by the priority change.
- [ ] **DEFERRED (owner, 2026-09-27).** Record Fatih's five-dimension assessment: none worse, at least two better than the reference. Document scene/time examples and factual-claim checks needed before publication.
- [ ] **DEFERRED (owner, 2026-09-27).** After explicit approval of the current full preview, export through the existing `--approve-preview` flow using its real build ID. Retain source/audio/build hashes.
- [ ] Add focused transition-boundary/scoped-neighbour/audio-duration/publication/cache tests after the real path; run integration checks before merge.

**Command acceptance:** `pnpm naraframe validate work/visual-parity/medan-story --stage production --json`, then `pnpm naraframe preview work/visual-parity/medan-story --json`; final export requires current-preview approval. (Retargeted 2026-09-27 to the real story project; `work/visual-parity/medan` keeps the rejected first attempt.)

**Expected:** approximately 67.5s with varied pace, strong illustration, purposeful motion and coherent explanation. Full NF-AC-16 gate, not universal superiority over Bang Motion. Pixel identity is not required.

#### M2.4.4b — Spatial authoring guide and timing diagnostics

**Why:** the Medan work showed that an agent could not author camera shots from the skill and public schema alone, and that frame rounding made timing errors a trial-and-error loop (M2.4.4 handoff, gaps 1 and 2). Inserted 2026-09-27 when Fatih moved priority to engine and skill quality.

**Primary areas:** `skills/naraframe/SKILL.md`; compiler timing diagnostics (`MOTION_PROPERTY_OVERLAP`, `BEAT_OUTSIDE_SCENE`).

- [x] Add a spatial authoring guide to the skill: overlay versus world space, `parallax` depth (0 static, 1 main plane), how camera `x`/`y`/`zoom` move each depth, drawing world plates for a settled camera pose, billboards, `transform` poses starting from the base pose (hidden pre-pose for a pop-in) and what `exit` leaves. State positions in terms of the project's own canvas (design and draft sizes from `naraframe.json`), never a fixed 540/960.
- [x] Make the skill direct `validate --stage plan` before any preview, and show one small world/overlay/camera example built only from the skill and `schema --json`, confirmed by one small scoped render. Done 2026-09-27: fresh-context trial `work/m2-4-4b/fresh-trial` (record below), validation-first, one scoped render, no help needed.
- [x] Extend the two timing messages: name the beat and target, the resolved frame range after rounding, the conflicting beat or the scene's frame count, and a concrete correction (for example a start or duration that clears it).
- [x] Keep coordinate and rounding semantics unchanged. Add focused regressions for the message content and one for the example; no new Medan benchmark. The contrast/occlusion gap stays a separate task; no warning is weakened here.

**Command acceptance:** the example project's `validate --stage plan --json` and `preview <example> --draft --scene <id> --json`, plus a reproduced overlap and an out-of-scene beat showing the new messages.

**Expected:** an agent composes the small world/overlay/camera example from the skill and public schema without reading renderer source, and repairs either timing error from its message alone.

**Supervisor second-pass status — 2026-09-27: TECHNICALLY_READY (after IN_REVIEW).** Both previous P2 findings are closed. This is technical acceptance for M2.4.4b only, not a commit/merge, visual benchmark approval, publication approval or permission to start the next task.

- **Independently checked:** diff scope (compiler diagnostic messages/helpers, skill and tests, no renderer implementation/schema changes); corrected follow guidance against the pose reducer; billboard/group semantics against `planeTransformFor`, `GroupView` and compiler group handling; linear camera interpolation against `cameraStateFor`; anchor-aware fallback and regressions applying both edits. Fresh focused run with pinned Node: 3 files / 48 tests passed (`compile-draft-timing-messages`, `compile-draft-m2-4-3`, `path-count-motion`). No detection or frame-semantic change found. `git diff --check` clean before this handoff update.
- **Trial artifacts independently checked:** inspected `fresh-trial-frames.png` and build manifest `b219edc41687-04ffc6de-dde`. The sampled frames support the framing, fixed overlay and constant-size billboard claims. MP4 SHA-256 `afe6fbd5136503515827ce901759de20d82a8b270af1c32fee1358c421f5405e` matches the manifest; ffprobe confirms 540×960, 90 frames, 3.000 seconds. Manifest records no preflight errors, with advisory panel warnings. No new render or full-playback comparison was performed.
- **Evidence reported, not independently observed:** the subagent's fresh context, restricted file access, first-try validation and absence of authoring help; mutation/bite checks; full verify run 2 (244 unit / 272 integration / build) and run 1's ENOENT. Accept the reported trial plus inspectable project/render as proportionate evidence for this small authoring task, not proof that all future agents will need no help. The spatial clarifications added after that trial were source/test-reviewed here; a new trial is not required for those clarifications.
- **Non-blocking follow-up: shared-fixture isolation.** `draft-project.test.ts` recursively copies the complete shared sample, while `computeReuse` creates and removes transient `.naraframe/attempts/reuse-*` directories. That supports the reported race hypothesis and the classification as unrelated to this diagnostic-only diff. It does not independently prove which concurrent test triggered the failure or reproduce it on main. Track a bounded test-isolation task: reproduce the copy/cleanup race, isolate writable fixtures or exclude transient generated state as appropriate, add a regression, and retain failure logs. Do not call the flake fixed or conclusively diagnosed; no automatic retries or weaker assertions. No separate GitHub issue was opened in this review.
- **Integration note:** no full verify or E2E rerun by supervisor. E2E omission is acceptable for this diagnostic/documentation-only diff; rendering semantics and engine identity remain unchanged. No engine, skill, project artifact or Git mutation by supervisor; only this plan/tracker was updated. Any further runtime change requires a new gate decision.

**Supervisor closure — 2026-09-27: M2.4.4b CLOSED / INTEGRATED.** Independently verified GitHub PR #18 is MERGED with head `20a0e5e4eac18a9cf239a16bf0336cfd24671e29` and squash `f065e4d65b37d35b2414e91d8943f52b450632fe`. Local `main` and `origin/main` resolve to that squash. `git diff 30d5e4b..f065e4d` changes only `docs/plan.md`; the trees of `20a0e5e` and `f065e4d` are identical (`f83568a672d223a85e1013c6cca7ebf4c0f7c20a`). Commit metadata contains no agent identity/trailer. Integration notes accurately retain the unresolved shared-fixture hypothesis; no flake fix or visual acceptance is claimed. No tests rerun because implementation is identical to the reviewed candidate. Working tree was clean before this documentation entry; this closure entry itself is local and uncommitted. No Git mutation or next-task execution performed.

**Recommendation for owner decision (not a scope change or task start).** Next, align M2.4.5 with the owner's engine/skill priority: propose a bounded end-to-end authoring/revision trial on a frozen engine, using one short project and the public CLI/skill to exercise headline/camera/object/profile revisions, undo and reuse. Keep visual competition and publication/export decisions explicitly deferred rather than marking them passed. The existing M2.4.5 still depends on the deferred Medan gate; obtain Fatih's decision and update the existing acceptance/dependency text before execution. Shared-fixture isolation remains a separate bounded follow-up, not an extra blocker inferred for this closed task.

**Integration record — 2026-09-27 (implementer).** Fatih approved integration. The supervisor's PR integration review below was committed to the branch as documentation only (`docs/plan.md`); no implementation, skill or test change after the reviewed head `30d5e4b`. PR #18 squash-merged into `main`, task branch deleted, `main` synced. The Miss Ayu worktree and the old stash untouched; next task not started.

**PR integration review — 2026-09-27 (supervisor): TECHNICALLY_READY FOR MERGE, awaiting explicit Fatih approval.** Inspected [PR #18](https://github.com/fatlhr/NaraFrame/pull/18) live: OPEN, non-draft, base `main`, head `30d5e4b8a310475b75fb840c7779446ccd0f8918`, MERGEABLE, no registered checks. Local commit matches that head and has parent `cf9411f8dc12e827c1dceeb445e7ec3862c194e6`. Exactly the six scoped files are committed; no generated artifacts or agent identity/trailers. Working tree was clean before this review entry.

- Re-inspected the five non-plan files against the preceding second-pass review: no additional implementation/skill/test changes found; the added integration statements are confined to `docs/plan.md`. This is a content/diff comparison against the prior review evidence, not a claim of an archived pre-commit tree hash (none was recorded). Fresh focused verification on this committed candidate: 3 files / 48 tests passed. No full suite or render rerun.
- PR description accurately separates implementer full-verify results from supervisor checks, reports the initial failure as well as the successful rerun, qualifies fresh-context access as self-reported, and explains the scoped E2E omission. Both the PR and current plan explicitly leave the shared-fixture trigger/root cause unproven and the flake unresolved. No blocking finding.
- Only this local handoff entry was edited. No staging, commit, push, branch change, merge, engine/skill edit or project-artifact change. Technical sign-off is bound to the head above; any subsequent implementation change requires renewed review. Merge remains pending Fatih's explicit permission. This entry is not yet included in the PR.

**Integration note — 2026-09-27 (implementer).** Scope unchanged after the supervisor's TECHNICALLY_READY: no new feature, render or code change. The six task files were committed and a PR opened to `main` with Fatih's authorisation; no merge. The shared-fixture flake is a separate follow-up (recorded in "Current step"), not part of this task and not resolved by it.

**Correction pass — 2026-09-27 (implementer): READY_FOR_REVIEW.** Same branch, still uncommitted; runtime semantics unchanged; Miss Ayu worktree and old stash untouched.

- *Follow poses (P2).* The skill's "Poses" paragraph now matches `motion.ts`: a transform eases the properties it names from the current pose; while a `follow` runs the layer's centre sits on the path point (turned with `orient`) whatever came before; a first follow pre-positions the layer at its `from` point; a later follow does not blend in, so the preceding pose must end on the path's `from` point (or the path must start at the object) for a continuous move; a transform after a follow eases from where it left. The path bullet now says the waiting applies only to the first beat that moves the layer. New regressions in `path-count-motion.test.ts`: the first follow waits at `from` 0.25 (translation 180/390, not 0/0 or the path start); a follow after a transform jumps from (50, 0) to the path midpoint (280/390) with no blend.
- *Anchored fallback (P2).* `BEAT_OUTSIDE_SCENE`'s fallback for a beat longer than its scene now names the start through the existing anchor-aware helper: supervisor repro (s1, exit `out`, 5000 ms at c1 + 5000) → "The beat is longer than the scene; shorten it to durationMs 1216 or less and set offsetMs -100 on its phrase anchor." Regressions in `compile-draft-timing-messages.test.ts` (+3): the exact message and suggestion; both edits applied clear the error while either alone does not; an unanchored beat gets "set startMs 0". With the previous wording the two new message cases fail.
- *Plan validation scope.* Skill step 6 now says `validate --stage plan` catches compile-time problems (schema and references, timing windows, static layer bounds, counts, phrase anchors) and that visual preflight (text overflow and collisions, text leaving the screen under motion, font loading, masks) runs only in `preview`.
- *Fresh-context authoring trial.* A new subagent with no prior context read only `SKILL.md`, the `schema --json` output and its own project files, and ran only the CLI (doctor, schema, create, validate, preview, status) plus ffmpeg for frames; it reported opening nothing under `packages/`, `docs/`, `samples/`, `test-fixtures/` or other `work/` projects. Project `work/m2-4-4b/fresh-trial`, scene `market-pullback` (3 s): depth-1 map plate, depth-1.5 tree canopies, a billboard label at the market Q = (720, 1180), an overlay heading on its own panel, camera from (360, 440, 2) = 2·(Q − C) to (0, 0, 1). `validate --stage plan` → 0 errors on the first try (duration warning); `preview --draft --scene market-pullback` → build `b219edc41687-04ffc6de-dde`, no errors (duration and `PANEL_DEAD_SPACE` warnings). No help or correction was given. Frames `work/m2-4-4b/fresh-trial/frame-{start,move,settle,end}.png`, sheet `work/m2-4-4b/fresh-trial-frames.png`, checked by the implementer too: market centred at the start, heading fixed, canopies moving and zooming more than the plate, label constant in size. Its measured positions matched the guide's formula.
- *Trial friction fixed in the skill (spatial scope).* Billboard members are ordinary design-canvas frames around the pin point as at camera (0, 0, 1); a group without a frame keeps its members' frames, member `zIndex` is local to the group; within a camera move x, y and zoom share one eased progress and zoom interpolates linearly (regression added: midpoint of a linear move is zoom 1.5, not √2), so on the main plane covering both end poses is enough.
- *Trial friction not addressed here (out of scope, candidates for later tasks).* `PANEL_DEAD_SPACE` fires on map geometry (river, streets, blocks) with draft-pixel figures; the duration-recommendation suggestion omits the range and value; sourcing (`requireSourcing`, `carriesFactualClaim`) is not in the skill; the burned-in draft label is undocumented; `emphasize` requires `scale` despite a profile default; no check for world content under overlay text (the trial added its own panel).
- *Checks.* Focused: `compile-draft-timing-messages` 9/9, `path-count-motion` 18/18. `pnpm verify`: first run 244 unit passed, 271/272 integration — `draft-project.test.ts` "rejects a ready PNG…" failed with ENOENT while copying `samples/krakatau-draft/.naraframe/attempts/reuse-…`, a transient attempt another parallel test file creates in the shared sample (`packages/core/src/revision/reuse.ts`); the file passes alone (9/9) and the second full run passed (244 unit, 272 integration, build). Pre-existing flake, not caused by this change; worth its own small task. Serial E2E not run: no runtime change.

**Supervisor review — 2026-09-27: CHANGES_REQUESTED.** Review completed; the implementer's READY_FOR_REVIEW report below is retained as historical evidence. No implementation, Git integration, or render was performed by the supervisor.

- **P2 — Follow pose guidance.** `skills/naraframe/SKILL.md`, "Poses", incorrectly generalises that every transform/follow starts from the preceding settled pose and that the initial pose is always zero. In `motion.ts`, a first `follow` pre-positions the follower at the path's `from` point; a later `follow` uses path geometry directly, not interpolation from the preceding transform endpoint. The existing passing test "waits at the start of its path" asserts initial translation (80, 390), not (0, 0). Correct the guide (and avoid contradictory wording in its path bullet); explain endpoint alignment for continuity. Do not change runtime semantics to match the prose.
- **P2 — Anchored out-of-scene fallback.** The new fallback in `compile-draft.ts` says "start it at 0" without naming the anchor offset. Independent direct-compiler probe using `narratedSource()`, scene s1, exit beat `out`, `startMs: 0`, `durationMs: 5000`, `at: {phraseId: 'c1', offsetMs: 5000}`: frames 153–302 exceed the 36-frame scene. Suggestion is duration 1216 ms or less and start at 0. Applying duration 1216 and `startMs: 0` still produces BEAT_OUTSIDE_SCENE (frames 153–188); setting `offsetMs: -100` instead clears that issue. Use the existing anchor-aware edit helper in this fallback and add a regression applying both suggested edits. Keep error detection and frame semantics unchanged.
- **Acceptance evidence pending.** The example was authored with prior renderer knowledge, so it cannot establish guide-only usability. Keep its artifacts; after the corrections, run one bounded fresh-context authoring trial using the skill, public schema and CLI only, not implementation source or the existing example. A minimal world/overlay/camera scene, validation first and one short scoped render are sufficient; record any extra help or corrections honestly. No Medan polish or full-video trial is requested. Narrow "Timing and layout errors are found here" to compile-time checks so preflight-only failures are not implied to be covered by plan validation.
- **Independently checked:** changed-file scope; compiler and motion code; 42/42 focused tests across `compile-draft-timing-messages`, `compile-draft-m2-4-3` and `path-count-motion`; the anchored fallback probe above; visual inspection of `spatial-example-frames.png`. The sheet supports the small example's camera/overlay intent, not independent authoring or a full playback review. **Read from implementer only:** `pnpm verify` 241 unit / 269 integration, preview/build manifest details, mutation-test evidence. No long suite or render rerun; full E2E remains unnecessary for the scoped documentation/diagnostic-only correction unless runtime boundaries change.

**Handoff — 2026-09-27 (implementer, before supervisor review): READY_FOR_REVIEW.** Branch `m2-4-4b-spatial-timing` from `origin/main` `cf9411f`, uncommitted. The Miss Ayu worktree and the old stash are untouched.

- *Skill.* `skills/naraframe/SKILL.md` gains a "Space, camera and timing" section before Boundaries: coordinates in the project's `format.design` canvas with centre C = (W/2, H/2) and drafts scaled to `format.draft`; overlay versus world (grouped layers take the group's plane; overlay must fit the canvas; world text may leave it only under a camera); the plane rule screen = C + zoom^d · (P − C) − d · (x, y) with depth meaning; camera moves, limits and easing presets; the settled-pose framing recipe camera = z · (Q − C); billboards; `transform` as a pose chained with `follow` from x 0, y 0, scale 1, rotation 0, the hidden one-frame pre-pose, and what `reveal` and `exit` do; frame rounding (start round(ms·fps/1000), duration max(1, round(...)), end exclusive, `at` first) and the two timing errors. Workflow steps 6–7 now require `validate --stage plan` after every edit and before any preview, and preview only when it reports no errors. Checked against `planeTransformFor`, the pose reducer, `validateLayerFrames` and the compiler's rounding; nothing in them changed.
- *Timing messages.* `MOTION_PROPERTY_OVERLAP` and `BEAT_OUTSIDE_SCENE` keep their codes, severity, paths and detection. Messages now name the beat and target, the frames after phrase anchors and rounding (noting the phrase when anchored), the conflicting beat or the scene's frame count and fps; suggestions give a start or duration in whole milliseconds that clears the problem under the same rounding, as `offsetMs` on the anchor when the beat is phrase-anchored. Probe `work/m2-4-4b/timing-probe` (`validate --stage plan`, no render): before `timing-probe-before.txt` ("Beat nudge-2 overlaps another write to x on card."; "Beat card-out ends after scene outside."), after `timing-probe-after.txt` ("Beat nudge-2 writes x on card over frames 41-42, overlapping beat nudge-1, which writes it over frames 40-41 …" / "Start nudge-2 at frame 42 or later (startMs 1384) or end nudge-1 by frame 40 (durationMs 49 or less)"; "Beat card-out on card runs over frames 57-61, but scene outside has 60 frames (0-59) at 30 fps." / "End it by frame 59: durationMs 116 or less, or startMs 1849 or earlier."). Applying each of the four suggested values clears its error (`timing-probe-fixes.txt`).
- *Spatial example.* `work/m2-4-4b/spatial-example` (created with `create --profile current-issues`; scene note shows the arithmetic): depth-1 ground, river and bridge, depth-0.5 hill, a billboard label at the bridge, an overlay title, and a camera opening at zoom 2 centred on the bridge by the recipe (x 440, y 380) and pulling back to (0, 0, 1). `validate --stage plan` → valid (one profile-duration warning); `preview --draft --scene riverside` → build `7546643d5bcf-1e5834c8-ff9`, no preflight errors. Frames at 0.0/0.7/1.2/2.0/2.9 s: `work/m2-4-4b/spatial-example-frames.png` (bridge centred at the start, hill moving less, label at design size, title fixed).
- *Regressions.* `packages/core/test/integration/compile-draft-timing-messages.test.ts` (6: exact overlap and out-of-scene messages, anchored offset suggestion, suggested values clear the errors, a value one past the limit does not, runtime frames and severity unchanged; against the previous compiler the three message cases fail and the three semantic cases pass). `path-count-motion.test.ts` +3: the skill's plane rule and framing recipe against `planeTransformFor` (main plane, depth 0.5, depth 0 and overlay). `compile-draft-m2-4-3.test.ts`: three message matchers updated to the new wording, same property/target checks. `pnpm verify` passed: 241 unit, 269 integration, build. Serial E2E not run: no renderer or runtime change.
- *Limits.* The example was authored by the implementer, who already knows the renderer, so it shows the guide is sufficient and correct, not that a fresh agent needs nothing else; a clean-agent trial would be the stronger test. Camera-move messages (`CAMERA_MOVE_OVERLAP`, `CAMERA_MOVE_OUTSIDE_SCENE`) are unchanged, as scoped. In the example the label pill uses `palette.surface`, the same as the ground, so it reads faintly; cosmetic. Contrast and occlusion diagnostics are untouched.

#### M2.4.5a — Soundtrack-only preview publication (B1 correction)

**Inserted 2026-09-27 by Fatih's option (a).** Separate from the frozen M2.4.5 trial, whose source, revisions, logs and failed-freeze identity stay as recorded. The trial does not resume until this task is integrated and a new freeze is recorded.

**Primary areas:** `packages/cli/src/preview-build.ts` publication/integrity checks, the preview command result in `runner.ts`, their tests. No renderer, compiler, schema or skill change.

- [x] Align the audio-presence expectation in preview metadata with `narration || soundtrack`, without weakening codec, stream, hash, duration or muted checks.
- [x] Prove it through the public CLI on a short soundtrack-only fixture; no repeated full LBC render.
- [x] Add publication/integrity regressions; confirm silent, narrated and scoped previews are unchanged and a repeated preview reuses the build.
- [x] Decide engine/cache identity from the change's real effect on renders, acceptance and reuse.
- [x] `pnpm verify` and serial `pnpm test:e2e` before integration; failures are diagnosed, not rerun blindly.
- The generic `SYSTEM_ERROR` redaction is a separate follow-up, not part of this task.

**Command acceptance:** `pnpm naraframe preview work/m2-4-5a/soundtrack-only --draft --json` exits 0 with label `DRAFT • WITH AUDIO`, `data.muted: false` and a manifest recording `audio: "aac"`, `muted: false`; a second run reports `reusedFromBuildId`; `--scene two` stays `DRAFT • NO AUDIO`.

#### Active handoff — M2.4.5a

**Supervisor closure — 2026-09-27: CLOSED / INTEGRATED.** Independently checked live PR #19: MERGED at `2026-09-27T14:05:44Z`, head `3cb2868d40f3853b37b96ffce2ea06a565ee541b`, squash `159ed0874cd8a789d13ba3d6dd24fad4711b4d12`. Squash and branch-head trees are identical (`10a06af1b1547a444e82c57f599c7c32e27c9cea`); diff from reviewed `7416384` touches only `docs/plan.md` (+8 lines). Squash metadata has no agent identity/trailer. Live remote `main`, local HEAD/main and origin/main all match `159ed08`; task branch is absent locally and from remote heads. Failed-trial branch `m2-4-5-frozen-trial` remains at `f065e4d`. Working tree was clean before this closure entry. Corrected stale Current step/tracker text that still said "not merged"; historical reviews below remain unchanged. No tests or renders rerun, no implementation/skill/test/Git mutation. This closure update itself is local and uncommitted.

**Next step for M2.4.5 (not executed by supervisor):** start a separately identified retrial from merged main `159ed08`, recording commit/package tree/skill tree/skill SHA-256 and unchanged render identity, and rebuild the pinned runtime output. Preserve failed attempt source, revisions, builds and logs at `work/visual-parity/lbc-trial` with its original `f065e4d` freeze; do not overwrite or relabel it successful. Use a separate retrial directory and document its initial source provenance. Carry out the approved bounded public skill/CLI authoring, headline/camera/object/profile revisions, undo and media-reuse checks. Record new evidence independently of attempt 1; stop on another engine/skill blocker. No need to reopen art direction, visual benchmark or export scope; those gates remain DEFERRED. Integration of B1 alone does not complete M2.4.5 or M2.

**Integration record — 2026-09-27 (implementer).** Fatih approved integration. The supervisor's integration review below was committed to the branch as documentation only (`docs/plan.md`). No implementation, test or render change after the reviewed head `7416384`; the four fingerprints were rechecked before the merge. PR #19 was squash-merged into `main` using the head-commit guard; the task branch was deleted and `main` synced. The M2.4.5 trial has not resumed. It needs a new freeze recorded from the merged `main` first. The Miss Ayu worktree and the old stash were not touched.

**Supervisor integration review — 2026-09-27: TECHNICALLY_READY FOR MERGE, awaiting explicit Fatih approval.** Live [PR #19](https://github.com/fatlhr/NaraFrame/pull/19) is OPEN, non-draft, base `main`, head `m2-4-5a-soundtrack-preview-metadata` at `7416384b0d6d61993ebef154e1b34e691ce22ab1`, MERGEABLE/CLEAN, with no registered checks. Local HEAD and remote-tracking branch match that live SHA; parent is `f065e4d65b37d35b2414e91d8943f52b450632fe`. The live PR and local commit both contain exactly the five scoped files. Author is Fatih, with no agent identity/trailer or generated artifact in the commit.

- Recomputed all four implementation/test SHA-256 values: exact matches to the reviewed candidate recorded below. No implementation or test drift; the remaining changes since review are plan integration/status notes. Descriptions of the fix, runner scope, unchanged render identity and required new retrial freeze are accurate.
- Live PR description correctly distinguishes the implementer's verify, full E2E and bite checks from the supervisor's focused integration/E2E runs and artifact/log inspection. The aborted first run and caffeinate warning remain disclosed; no new pass or root-cause claim is inferred. No blocking finding. No suite or render rerun was warranted for the identical candidate.
- Working tree was clean before this entry; only this local plan entry was added by the supervisor and it is not yet in the PR. No staging, commit, push, merge, engine/skill/test change or trial continuation. Sign-off is bound to head `7416384b0d6d61993ebef154e1b34e691ce22ab1`; any later code/test change needs renewed review. M2.4.5 remains stopped until authorised integration and a new freeze.

**Integration note — 2026-09-27 (implementer).** Scope unchanged after the supervisor's TECHNICALLY_READY. No new implementation, test or render. The four implementation and test files still match the supervisor's reviewed SHA-256 fingerprints below. The five task files were committed and a PR opened to `main` on Fatih's instruction. Not merged. Nothing under `work/` or any generated artefact is included. The M2.4.5 trial stays stopped until this is integrated and a new freeze is recorded. The Miss Ayu worktree and the old stash were not touched.

**Supervisor status — 2026-09-27: TECHNICALLY_READY (after IN_REVIEW).** No blocking findings. Recommend preparing the scoped commit/PR for integration review; no merge or frozen-trial continuation has occurred. Only this plan/handoff was edited by the supervisor; engine, skill, tests and Git state were not modified.

- **Fix and scope:** inspected both implementation diffs. `carriesAudio` makes codec and muted expectations consistent with the existing probe. Codec/stream-count/hash/duration checks remain intact. The `runner.ts` change is within B1's user-visible scope: otherwise a successfully published AAC preview would falsely report `data.muted: true` and "no audio" to agents/users. It adds no new rendering feature.
- **Fresh independent checks:** `preview-publication.test.ts` 14/14 passed, including accepted AAC soundtrack-only publication, rejected metadata and missing audio. Ran only the new soundtrack-only E2E by test-name filter: full preview, actual non-silent audio, repeated-preview reuse, and silent scoped preview passed in 18.43 s outside the sandbox. The other narrated case was skipped by that filter, not claimed as freshly rerun. The first supervisor attempt inside the sandbox failed after 2.2 s at render startup with generic SYSTEM_ERROR; the same test passed outside it without code changes. This supports an environment restriction, without identifying the precise suppressed low-level cause. Built CLI predicates were inspected and match source. No full E2E rerun.
- **Saved artifacts checked:** first and reused full-preview MP4s both hash to `2aebc29a61055f5a8783a14c541876fedcca4cbd5b75e0a7aaef3b4a6335ab27`, matching their manifests (AAC, unmuted); reuse points to `73e34c5e873f-a611cabd-1bb`. Scoped build `366c78774643-b54f43e8-0fb` hash also matches its manifest (no audio, muted). Public-path E2E above independently exercises the corresponding behavior on a new temporary fixture.
- **Coverage and evidence limits:** regression assertions would detect restoration of the old codec predicate and old `data.muted`; implementer mutation/bite runs were not repeated by the supervisor. Existing publication tests protect rejected/corrupt builds; original narrated soundtrack E2E remains in the suite. Full verify and serial E2E are log evidence, not independent full-suite executions: inspected verify log (244 unit, 273 integration, lint/typecheck/build) and run-2 log (6 files, 10 tests, 655.04 s, exit 0), with SHA-256 `54a1eb3242895b4be0ef4195bb13e26c3d98cc1d2f0f25b3a7c125e27aaef5ae` confirmed.
- **Interrupted gate:** stored pmset evidence confirms idle sleep at 16:05:02 and full wake at 20:12:33; run 1 is aborted/incomplete (143), not a passing gate or an established product defect. Run 2 is valid completed gate evidence. Independently querying pmset found no matching sleep/wake entries in 20:26–20:37. The caffeinate warning remains recorded and is not proof sleep prevention worked; neither its warning nor the invalid first run negates the completed second run. The claim of unchanged code between those implementer runs is reported, not reconstructed from per-run source hashes.
- **Identity decision accepted:** no renderer/compiler/key change; existing silent and narrated acceptance is unchanged. Newly accepted soundtrack-only drafts were rejected before promotion under the prior predicate, so there is no valid old-format published build requiring invalidation for this fix. Retain `naraframe-draft/10`. M2.4.5 must nevertheless use a new source commit/package freeze after integration: unchanged render identity does not mean unchanged engine code.
- **Reviewed candidate SHA-256 (excluding evolving plan):** `packages/cli/src/preview-build.ts` = `98588cc5524017b48cd649eacbce972b4aa4416ac33107ddfcc85d594f9c2d80`; `packages/cli/src/runner.ts` = `b59687d268cfda80947e41facaf26e7ecccf5747c081c14bd7d0f03e25e6774f`; `packages/cli/test/integration/preview-publication.test.ts` = `b961ed56ff9deaf4797a4df994012bfd8c06cfac365e7c5f2a9496335bb377b8`; `packages/cli/test/e2e/soundtrack-mix.test.ts` = `76642114de5f8ffbde7bb3bc5ab4a2d02bd5e6d2d1b93033c99764e32971e6ac`. Further implementation changes require renewed verification. Generic error diagnostics and shared-fixture isolation remain separate follow-ups.

**Handoff — 2026-09-27 (implementer): READY_FOR_REVIEW.** Uncommitted; the Miss Ayu worktree, the old stash and the M2.4.5 trial artefacts are untouched.

- *Real path, before the fix.* Fixture `work/m2-4-5a/soundtrack-only` has two 1 s text scenes and a copy of the music bed `93f1b4b5…`, with no narration. Running `preview --draft --json` on it exits 2 with `SYSTEM_ERROR` after 8 s (`work/m2-4-5a/before-fix-preview.*`).
- *Fix in `preview-build.ts`.* One `carriesAudio(draft)` helper (`narration || soundtrack`) now feeds `validateProbe` and both the `audio` and the `muted` expectations in `assertCompleteMetadata`. The codec, stream, hash, duration and muted checks themselves are unchanged. The preview result's `data.muted` and its human summary in `runner.ts` used `!narration`; they now use the same predicate. Before this, the CLI reported `muted: true` for a build whose own manifest said `muted: false` and which contained an AAC stream.
- *Real path, after the fix.*
  - Full preview: build `73e34c5e873f-a611cabd-1bb`, `DRAFT • WITH AUDIO`, `data.muted` false; the manifest records `audio: "aac"`, `muted: false`; ffprobe finds h264 2.000 s plus aac 2.048 s.
  - Repeat preview: build `73e34c5e873f-74f521ec-a7b`, `reusedFromBuildId` pointing at the first build, identical MP4 hash.
  - `--scene two`: build `366c78774643-b54f43e8-0fb`, `DRAFT • NO AUDIO`, `audio: "none"`, no audio stream.
- *Regressions.*
  - `preview-publication.test.ts` gains one case. A soundtrack-only draft with AAC metadata and an AAC stream publishes. Metadata claiming `none`, or `aac` with `muted: true`, is rejected without changing `current.json` or leaving a build. A missing audio stream is rejected. The staged-build helper now takes an optional draft and render audio.
  - `soundtrack-mix.test.ts` gains an E2E case that needs no owner samples. A 2 s project with a generated tone runs through the CLI: the full preview has audio, the result says unmuted, the second preview reuses the first, and the scoped preview is silent (13.9 s alone).
  - Bite checks: with the old audio predicate the integration case fails, and with the old `data.muted` the E2E case fails. Both fixes were restored and rebuilt afterwards.
- *Engine/cache identity: no change.*
  - No renderer, compiler or pixel change, and no assembly or scene key changes.
  - For silent and narrated drafts the old and new expectations are identical.
  - The only draft whose expectation changes is music without narration. Under the old code it could never publish, so no stored build carries the old expectation and none can be picked up or rejected differently by reuse.
  - `RENDER_ENGINE` stays `naraframe-draft/10`.
- *`pnpm verify`: passed.* Biome checked 156 files; typecheck and build passed; 244 unit and 273 integration tests passed (`work/gate-logs/m2-4-5a/verify-1.log`).
- *Serial `pnpm test:e2e` run 1: invalid, stopped.*
  - Started 15:59 WIB. At 16:04 the `reference-projects` case began its `project-current-issues` preview.
  - At 16:05 the host entered idle sleep on battery (22%) and stayed asleep apart from dark wakes until 20:12 (`e2e-1-sleep.txt`).
  - After wake, the process tree used no CPU and wrote no output, so the implementer stopped its own processes and deleted the temporary project. The log is kept (`e2e-1.log`, exit 143).
  - This is a host sleep, not a test result, and gives no pass/fail evidence. A rerun needs the machine on power with sleep prevented.
- *Serial `pnpm test:e2e` run 2: passed.*
  - Rerun on the same diagnosis (host sleep): Fatih connected AC power and the run was wrapped in `caffeinate -dims`. Nothing in the code or tests changed between the two runs.
  - Started 20:26:23 WIB; 6 files and 10 tests passed in 655.04 s, exit 0 (`work/gate-logs/m2-4-5a/e2e-2.log`, SHA-256 `54a1eb32…aef5ae`). The 10 are the previous 9 plus the new soundtrack-only case; the narrated soundtrack mix case ran as well, with none skipped.
  - caffeinate printed "Failed to create PreventUserIdleSystemSleep assertion". The pmset log shows no sleep or wake event between 20:26 and 20:37, so the run was not interrupted.
  - The default reporter printed no per-test durations.
- *Separate follow-up, not in this task:* the generic `SYSTEM_ERROR` redaction that hid B1's cause.

#### M2.4.5 — Frozen end-to-end authoring and revision trial (LBC copy)

**Rescope — 2026-09-27 (Fatih).** Replaces the earlier "distinct 30s LBC first full draft" acceptance, which waited on the deferred Medan gate. This task now tests the engine and skill end to end on a frozen foundation; it does not judge visual competitiveness. The 30-second target, the publication-candidate assessment (NF-AC-17 visual part) and export stay DEFERRED and are not passed by this task. M2 as a whole is not complete: the technical parts are separated from the deferred visual gates (NF-AC-16 for Medan, NF-AC-17 for LBC).

**Primary areas:** skill, `schema --json` and the public CLI only; a copy of the LBC project; existing assets and audio. No engine, compiler, renderer or skill change inside the trial.

- [x] Freeze the engine and skill: record the main commit, package and skill tree hashes, the skill file hash and `RENDER_ENGINE`; rebuild `dist` from that tree. Any needed engine/skill change is recorded as a blocker and the trial stops there; no silent fix during a trial claimed as frozen.
- [x] Copy the existing LBC project (source and assets, no previews or revision history) to `work/visual-parity/lbc-trial`. The original `work/visual-parity/lbc` and its baseline build `118a48d27119-74598617-246` stay untouched. The Miss Ayu worktree and the old stash are out of scope.
- [x] Author a short example on the copy using only the skill, `schema --json` and the CLI, validating before any preview. Long enough to exercise the flow; no 30-second target or publication polish. Done in attempt 1 (`visit-route`), reapplied unchanged in the retrial; see the retrial handoff for provenance.
- [x] Through public commands only (`edit` from a staging directory with `--expect`, `profile apply` with `--dry-run` first, `undo`, `status`, scoped `preview`): revise a headline, slow a camera move, replace an object, change the profile, undo. Record each revision ID, the files changed, `data.reuse` and the scope that needed a new render. Do not re-render scenes the change does not affect.
- [x] Reuse existing assets and suitable existing audio; no paid provider call and no change to any audio master. Show which assets and audio survived each revision unchanged. What the reuse report or the output cannot prove is reported as a gap, not as a pass.
- [x] Focused checks where the trial exposes something, then `pnpm verify` before review. Serial `pnpm test:e2e` only if the runtime changes, which would invalidate the frozen trial anyway.

**Command acceptance:** the sequence recorded in the handoff below: `validate --stage plan`, `edit`, `profile apply --dry-run` / `profile apply`, `undo`, `status` and `preview work/visual-parity/lbc-retrial --draft [--scene <id>] --json`, with the revision IDs, reuse data, build IDs and changed source they produce. The earlier `lbc-trial` directory remains the immutable failed attempt, not the retrial command target.

**Expected:** every requested revision and the undo go through normal source transactions without user code or an engine/skill patch; unaffected scenes are not re-rendered; asset reuse is shown and audio reuse is either shown or reported as a gap. Any blocker is recorded with its reproduction and the trial stops at that point.

#### Active handoff — M2.4.5

**Integration record — 2026-09-27 (implementer).** Fatih approved integration. The supervisor's integration review below was committed to the branch as documentation only (`docs/plan.md`). Nothing else changed after the reviewed head `7994b0e`. As the supervisor requested, the PR description was corrected: the music master keeps its hash from revision `c85131c1`, the revision that added it, onward; earlier revisions had no music. No evidence or claim changed. PR #20 was squash-merged using the head-commit guard, the task branch deleted, and `main` synced. No suite or render was rerun. F1–F5 and the next milestone are not started. M2 is not complete, and the visual, publication and export gates stay as recorded.

**Supervisor integration review — 2026-09-27: TECHNICALLY_READY FOR MERGE, awaiting explicit Fatih approval.** Live [PR #20](https://github.com/fatlhr/NaraFrame/pull/20) checked: OPEN, non-draft, MERGEABLE, base `main`, head `m2-4-5-retrial` at `7994b0eba9e9f2bdc402325f60906f3ab84c9969`, no registered checks. Local HEAD and remote-tracking branch match; parent is `159ed0874cd8a789d13ba3d6dd24fad4711b4d12`. Exactly one changed file, `docs/plan.md` (+107/-8); author Fatih, no agent identity/trailer or artifacts.

- Committed plan retains the reviewed evidence, failed-attempt history, replay provenance and wording corrections: retrial command target, finite PSNR, qualified F2 remedy, and actual post-undo status/preview sequence. PR description separates implementer gates from supervisor artifact inspection and leaves visual/publication/export gates deferred. No blocking finding. Small wording qualification for the PR's media summary: the music hash is unchanged from revision `c85131c1` onward, when music was introduced; it is absent in the earlier revisions, as the detailed handoff correctly records.
- Technical sign-off is limited to this documentation/evidence integration, not all of M2 or a new implementation task. No suite/render rerun warranted. Working tree was clean before this local review entry; only this plan entry was added, not staged/committed/pushed. No Git mutation, merge, engine/skill/test edit, or follow-up execution. This entry is not yet part of PR #20.

**Integration note — 2026-09-27 (implementer).** Nothing changed after the supervisor's retrial TECHNICALLY_READY except this note and the tracker wording. The change is documentation only: `docs/plan.md` is the only file committed, and it carries the supervisor's local wording corrections. Nothing under `work/`, no render, and no implementation, test or skill change is included. The suite and the renders were not rerun for this documentation change. A PR was opened to `main` on Fatih's instruction; it is not merged. The failed attempt, the replay provenance, the retrial evidence and every recorded gap stay as written. F1–F5 and the next milestone are not started; they are separate decisions. M2 is not complete, and the deferred visual, publication and export gates are not passed.

**Supervisor retrial status — 2026-09-27: TECHNICALLY_READY (after IN_REVIEW), bounded technical trial only.** No blocking findings. Recommend documentation-only integration; do not mark all of M2 complete or treat deferred visual/publication/export gates as passed. No engine/skill/test/Git changes or renders by the supervisor; only this plan/handoff was updated.

- **Independent freeze/provenance audit:** HEAD and origin/main are `159ed08`; package tree, skill tree and skill file SHA match Freeze 2. No packages/skills diff; Freeze 1 to 2 changes only PR #19. Original LBC and failed-attempt current source/media files all match their recorded revision hashes, with pointers respectively `118a48d27119-74598617-246` and `2dcce997f37b-25714ca3-a0d`. Retrial's first three edits have the same content revisions as attempt 1, consistent with declared replay rather than fresh authoring. This is current integrity evidence, not a historical filesystem-access audit.
- **Independent revision/build audit:** parsed all 38 saved command events, checked parent chains for 11 revision records and recomputed hashes for 121 referenced source/media objects. Checked all eight successful preview MP4 hashes against manifests and matched build IDs/source revisions to events; two rejected preflights are correctly reported as failures. Source scene diffs match the claimed headline, camera and object edits. Isolated revisions used the affected scene scope; full runs establish the initial audio-bearing composition and accumulated/profile-wide edits. No evidence of unrelated scoped renders; this does not claim automatic per-scene caching inside every full render.
- **Independent undo/reuse audit:** four undo events return to `01299580`; current scenes are byte-identical to the object-replacement stage, profile is `lbc-daylight@0.1.0`, original fonts are restored with their hashes. The final full MP4 is byte-identical to R1 and records reuse of `afb3fe1121bb-c122894e-895`. All SVG/PNG/music revision hashes agree where present. Independently hashed the encoded AAC stream of all four full builds with ffmpeg stream-copy: each is `53f2057d6ef7a7ee5b82683e1cabbc71`. This proves retained audio content, not reuse-provider accounting or narration reuse. Those stated gaps remain open.
- **Observed versus reported:** inspected camera/object comparison sheets and the before/after report-card crops, supporting the specific visual changes and F1's readability problem; no full playback, visual benchmark or PSNR recomputation. Recomputed event totals: 38 calls, 165308 ms total, 163413 ms preview time. These are command durations, not total authoring time or cost. Full verify log shows 244 unit / 273 integration with lint/typecheck/build; accepted as implementer evidence, not rerun. No E2E rerun needed for this source-only retrial on the same accepted runtime. Dist rebuild, exclusive public-CLI access, no provider calls/user intervention, and mutation-free chronology remain implementer-reported rather than independently observed.
- **Non-blocking F1–F5:** F1 warrants a separate targeted diagnostic task: report-card text became nearly unreadable without warning, then readable dark text raised the wrong-background warning. The final selected state restores LBC styling, so this does not block this non-publication trial. F2 shows preflight friction, not a failure of the documented compile-time/preview boundary; earlier/batched diagnostics are a candidate, not a proven one-pass remedy. F3 is expected one-transaction-per-undo behavior, with optional workflow improvements later. F4 is conservative full-project soundtrack invalidation/reuse reporting; the observation alone does not prove a cache defect. F5 warnings belong to the subsequently undone profile state; the final successful full event has no issues. Unknown media-style compatibility and final-export enforcement are not proven by draft-only profile previews.
- **Documentation precision corrected in this review:** acceptance command now targets `lbc-retrial`, not the retained failed project; finite PSNR is not described as pixel identity; F2's proposed dry-run benefit is qualified. After undo, there was a status check with plan valid and preview stale, not a fresh `validate` command: it returned to the already validated revision `01299580`, then correctly regenerated the selection via full preview reuse. That is sufficient for this artifact-based technical acceptance, but the handoff must not claim an additional command was run.

**Retrial handoff — 2026-09-27 (implementer): READY_FOR_REVIEW.** Branch `m2-4-5-retrial` from `origin/main` `159ed0874cd8a789d13ba3d6dd24fad4711b4d12`, uncommitted; only `docs/plan.md` changed in Git. No engine, compiler, renderer, schema, CLI or skill change during the retrial. The Miss Ayu worktree and the old stash were not touched. Evidence lives under `work/m2-4-5r/` (event JSON per command, stage directories, frames) and `work/gate-logs/m2-4-5r/`; both are gitignored.

*Freeze 2.*

| Item | Value |
|---|---|
| main commit | `159ed0874cd8a789d13ba3d6dd24fad4711b4d12` (M2.4.5a squash) |
| `packages/` tree | `cd6678e42ff22e08302879e42a7ec30a04b7ae03` |
| `skills/` tree | `661ae569b339a20897a3e253aadaabb79d3bdf30` (same as freeze 1) |
| `skills/naraframe/SKILL.md` SHA-256 | `314d45739851aeb56b1710a3d469e5f1e7c22473134cc4e4cc66debe3c9dfeca` (same) |
| `RENDER_ENGINE` | `naraframe-draft/10` (same) |
| Runtime | Node 24.20.0, pnpm 12.3.4; `dist` rebuilt from this tree |

`main` had not moved since the M2.4.5a closure. Freeze 1 → freeze 2 differs only by PR #19: `packages/cli/src/preview-build.ts`, `packages/cli/src/runner.ts`, two CLI test files and `docs/plan.md`.

*Retained attempt 1.*
- `work/visual-parity/lbc-trial` still holds its seven revision entries, current revision `c85131c1…` and scoped build `2dcce997f37b-25714ca3-a0d`.
- Its logs are in `work/m2-4-5/`.
- The original `work/visual-parity/lbc` was re-hashed after the retrial: unchanged, pointer still `118a48d27119-74598617-246`.

*Retrial source and provenance.* Directory `work/visual-parity/lbc-retrial`.
- It is a fresh copy of the original LBC source and assets (starting revision `174d41ea…`, the M2.4.2 source), not a copy of attempt 1.
- The short example is not new authoring. The three staged edits from attempt 1 were reapplied verbatim through `edit`, with `validate --stage plan` after each:
  - `work/m2-4-5/stage-01-author`: the `visit-route` scene, authored in attempt 1 from the skill, schema and CLI;
  - `stage-02-safezone`;
  - `stage-03-music`: a copy of the existing synthetic bed `93f1b4b5…`.
- They produced the same content-addressed revisions as attempt 1: `0d4a5c81`, then `e795866f` (the same safe-zone warning was cleared again), then `c85131c1`.
- The retrial does not claim a new first draft or new artwork; all images are the existing LBC assets.

*Revision sequence.* Authoring/edit/profile stages went through `edit --from <stage> --expect <sourceRevision>` or `profile apply`, followed by `validate --stage plan` before previewing that source revision. Four undo commands later restored the already validated revision `01299580`; `status` then reported plan valid and preview stale, and the final full preview reused R1. No separate post-undo validate event was recorded.

| Step | Revision | Change | `data.reuse` images / scenes unchanged | Preview (scope, build) |
|---|---|---|---|---|
| R0 | `c85131c1` | example + music, as above | 2/2 · 0/2 (adding the soundtrack marks both scenes changed) | full `f49019cda6d6-78b7a94b-3d5`: `DRAFT • WITH AUDIO`, `muted: false`, h264 12.500 s + aac, 26.1 s. The B1 case now publishes |
| 1 headline | `03f4150b` | `statement-1` → "Tutor datang, anak belajar di rumah." | 2/2 · 1/2 | `--scene opening` `f497a5c066d8-99418340-1d3`; frame at 3.5 s checked |
| 2 slower camera | `1d27100d` | `lean-to-report` 1600+3400 → 1600+4400 ms; `settle` 5000+3000 → 6000+2000 ms | 2/2 · 1/2 | `--scene opening` `1aebd4dc3560-9cec9fce-d86`. Implementer-measured PSNR against revision 1 at 1.0 / 3.3 / 5.0 / 7.9 s = 49.0 / 18.5 / 23.7 / 44.8 dB: very similar before the move, lagging in the middle, converging toward the same settle pose; finite PSNR does not establish pixel identity |
| 3 replace object | `01299580` | `tutor-dot` shape → round `tutor-badge` image of the existing `tutor-dan-siswa` photo on the same `follow` | 2/2 · 1/2 | `--scene visit-route` `a88817f60b02-f8119bea-876`; the photo waits at the route start, travels and lands at home |
| full before profile | `01299580` | none | none | full R1 `afb3fe1121bb-c122894e-895`, with audio |
| 4 profile | `c28bb650` | `profile apply current-issues`, after `--dry-run`: 49 changes, effects including `revalidate-layout`, no conflicts, two LBC fonts removed | none | full preview **rejected by preflight**: 6 `TEXT_OVERFLOW` (Arial 800 display at 128 px), 3 `IMAGE_MASK_INVALID` (profile media radius 44 on 56 px check icons) |
| 4b repair | `169a874e` | `overflowPolicy: "shrink"` on six long text layers; `cornerRadius: 0` on the check icons | 2/2 · 0/2 | full preview rejected: `TEXT_COLLISION` `statement-2a`/`2b`. The source boxes overlapped by 2 px (262 + 124 > 384), which the LBC fonts never exposed |
| 4c repair | `1ce09ffe` | `statement-2a` height 124 → 122 | 2/2 · 1/2 | full R2 `7c7209a57cbc-c803012f-e93`, with audio; warnings only |
| 4d repair | `f84139e7` | report rows get the card's literal ink `#101A37`: the profile's light `palette.text` was nearly invisible on the white card artwork | 2/2 · 1/2 | `--scene opening` `63a31c4974ef-6928bdcc-763`; rows readable |
| 5 undo ×4 | back to `01299580` | `undo` four times: f84139e7 → 1ce09ffe → 169a874e → c28bb650 → 01299580 | — | full `afb3fe1121bb-046a722d-b23`: `reusedFromBuildId: afb3fe1121bb-c122894e-895` after 0.55 s; MP4 hash identical to R1 |

After undo:
- `profile.lock.json` is back to `lbc-daylight@0.1.0`.
- `scenes.json` is byte-identical to the step 3 stage.
- Both LBC font files are restored under `assets/profile/` with their hashes.
- `status` reports plan `valid`.

*Asset and audio reuse.* Table in `work/m2-4-5r/35-media-reuse.txt`, built from each revision's media list.
- Across all 11 revisions:
  - `check.svg`, `lbc-logo.svg`, `report-card.svg`, `orang-tua.png` and `tutor-dan-siswa.png` keep the same SHA-256 throughout;
  - the music master `bed.mp3` keeps `93f1b4b5…` from the moment it was added;
  - the two LBC fonts are absent only under `current-issues`.
- The encoded AAC stream of all four full builds (R0, R1, R2 under the other profile, and the undo reuse) has the same MD5, `53f2057d…`; mean volume is −15.6 dB. No provider call, no audio master change.
- **Gaps, reported rather than passed:**
  - `data.reuse` counts only voice, PNG images and scenes. It says nothing about the music, SVG artwork or fonts; their reuse above comes from revision hashes and the builds, not from the reuse report.
  - Voice reuse is not tested: the LBC project has no narration and no suitable existing voice.
  - Scoped previews carry no music by design, so audio evidence comes from the full builds only.

*Findings. None needs an engine or skill change to finish the trial.*
- **F1 — the contrast diagnostic measures against the scene background, not what lies under the text.**
  - Step 4c: light `palette.text` rows on the white report card were nearly unreadable, and no contrast warning was raised.
  - Step 4d: after the fix, the readable dark rows got `CONTRAST_INSUFFICIENT` "1.09:1 against the background". The suggestion also says to size text at or above 24 px when it already is.
  - This belongs to the deferred contrast and occlusion diagnostics. Nothing was weakened.
- **F2 — a profile change can pass `validate --stage plan` and still fail preview preflight** (overflow, masks, collision). The skill says so, and the dry-run's `revalidate-layout` effect hints at it. It took three repair revisions; two full previews were rejected before a successful full preview, and the final contrast repair used a scoped preview. Earlier/batched layout preflight might reduce that feedback loop; detecting all dependent problems in one pass has not been demonstrated. This is a candidate for later, not a blocker.
- **F3 — undoing a multi-revision change takes one `undo` per revision.** There is no "undo to revision". It worked, but four steps for one visual-identity change is friction.
- **F4 — adding a soundtrack marks every scene as changed in `data.reuse`.** First seen in attempt 1, seen again here.
- **F5 — profile warnings left on purpose.** Under `current-issues` the safe zone is 4 px narrower than LBC's 84 px margins, so eight `TEXT_OUTSIDE_SAFE_ZONE` warnings remained, plus `DURATION_OUTSIDE_PROFILE_RECOMMENDATION`. They were not repaired because the identity change was undone.

*Effort.*
- 38 CLI calls, 165.3 s in total by their own `durationMs`:
  - 10 previews, 163.4 s, including two rejected by preflight;
  - 9 edits, 1.0 s;
  - 11 validates, 0.5 s;
  - 2 profile, 4 undo and 2 status calls.
- Internal corrections: 1 carried over from attempt 1 (the safe zone) plus 3 layout repairs after the profile change (4b, 4c, 4d).
- User interventions: none. Owner time and host token cost were not measured.

*Checks.* `pnpm verify` passed on freeze 2: Biome checked 156 files; typecheck/build; 244 unit and 273 integration tests (`work/gate-logs/m2-4-5r/verify-1.log`). Serial E2E not run: the runtime did not change during the trial, and freeze 2's E2E was the M2.4.5a gate (10/10).

*Not claimed.* No visual benchmark, publication judgement or export (NF-AC-17 visual part and NF-AC-16 stay DEFERRED). The `current-issues` look was a revision exercise, not a design proposal. M2 is not complete.

**Supervisor review — 2026-09-27: BLOCKED_CONFIRMED.** Stopping the frozen trial is correct: the defect is in CLI publication/integrity validation, part of the frozen engine boundary, not in the authored LBC source. No fix, test edit, render, Git mutation or continuation of the trial was performed in this review; only this handoff/tracker was updated.

- **B1 reproduced independently at the assertion boundary, not by rerendering the full video.** Loaded and compiled the current trial from the frozen built core: 375 frames, no narration, soundtrack present, label `DRAFT • WITH AUDIO`. Imported the existing built preview module in memory, exposing the unchanged private `assertCompleteMetadata` only for the diagnostic; no package file was written. Existing scoped manifest with its actual scoped draft passes. A metadata object derived from that manifest, aligned with the full compiled draft and the publisher's AAC/unmuted fields, throws the exact reported metadata-mismatch error. Keeping that metadata unchanged and adding only a truthy narration marker to the in-memory draft passes the assertion. This counterfactual is a diagnostic control, not a valid narrated project or a suggested workaround.
- **Cause confirmed for B1.** `validateProbe` treats narration OR soundtrack as AAC-bearing, publication records that codec, and `assertCompleteMetadata` checks muted using narration OR soundtrack but checks the codec using narration alone. The contradictory predicate rejects the correctly described soundtrack-only output. Fixing source data, running doctor, or rerendering does not resolve that contradiction. The stored CLI failure and internal stack support the full-publication failure; they were read as implementer evidence, not independently rerun. Generic SYSTEM_ERROR redaction is confirmed in the CLI result and `command-result.ts`; improving safe diagnostics is a separate usability follow-up, not permission to expose raw paths/stacks indiscriminately.
- **Freeze and original independently checked.** HEAD and recorded origin/main are `f065e4d65b37d35b2414e91d8943f52b450632fe`; package/skill trees and skill SHA-256 match the table below; no diff under packages/skills; source engine identity is draft/10. Recomputed all 11 source/media hashes listed by original LBC revision `174d41ea4ca2057e247545cef9a4aeb6631110ccd5cf2dcd5803a6da63808a4e`: zero mismatches. Original preview pointer still names `118a48d27119-74598617-246`. Fixture and copied music both hash to `93f1b4b5d13982408715a85b565ee39f5b794acea83c5cc5beb21a07b215bdb2`. This proves current agreement with the recorded baseline, not an audit of every historical operation. The dist rebuild, restricted authoring access and prior render runs remain implementer-reported.
- **Evidence qualification.** The saved `08-preview-full.json` has `durationMs: 25021`; the narrative's approximately 49-second figure is not independently tied to that run and must not be used as a benchmark. No systematic cost/time claim is accepted. The stored diagnostic script uses a `<repo>` placeholder; resolve it before using it. Prefer a small standalone correction fixture instead of repeatedly rendering the whole trial.
- **Recommendation (a), pending Fatih approval:** isolate B1 correction outside this frozen trial; preserve its source, revisions, logs and failed-freeze identity. Align the audio-presence predicate without weakening media integrity checks. Demonstrate a minimal soundtrack-only project through the real public preview path, then add regression coverage for publication/integrity and unchanged silent/narrated/scoped behavior; check a repeated preview/reuse. Run the required verify and serial E2E gates before integration because this changes a runtime publication boundary. Decide engine/cache identity from actual render/acceptance/reuse effects, not solely from whether pixels changed. After integration, record a new freeze and a separately identified retrial; retain the failed attempt rather than relabelling it successful. Option (b) is an owner-approved reduced-coverage workaround only: it leaves B1 and audio-reuse acceptance open, so it must not be described as a complete end-to-end pass.

**Freeze — 2026-09-27.** Branch `m2-4-5-frozen-trial` from `origin/main` `f065e4d65b37d35b2414e91d8943f52b450632fe` (the M2.4.4b squash). `dist` rebuilt from this tree before the trial.

| Item | Value |
|---|---|
| main commit | `f065e4d65b37d35b2414e91d8943f52b450632fe` |
| `packages/` tree | `aad5662d48590391cf6c2e75159bb01ae613a3f3` |
| `skills/` tree | `661ae569b339a20897a3e253aadaabb79d3bdf30` |
| `skills/naraframe/SKILL.md` SHA-256 | `314d45739851aeb56b1710a3d469e5f1e7c22473134cc4e4cc66debe3c9dfeca` |
| `RENDER_ENGINE` | `naraframe-draft/10` |
| Working-tree changes under `packages/` or `skills/` | none |

**Status — 2026-09-27 (implementer): BLOCKED, trial stopped.** A needed engine change was found; per the approved scope it is recorded here and not fixed inside the frozen trial. No engine, skill, test or Git change was made. `packages/` and `skills/` are still clean against `f065e4d`.

*Done before the blocker.*

- Copy: `work/visual-parity/lbc-trial` holds the source files and `assets/` of `work/visual-parity/lbc`, with no `preview/` and no `revisions/`. The original was re-hashed afterwards: no source or asset file changed, and its `preview/current.json` still points to `118a48d27119-74598617-246`. The copy's starting `sourceRevision` is `174d41ea…`, the same as the original's current revision. Its `status` shows revision `untracked` and plan `valid`.
- Authoring used only the skill, `schema --json` and the CLI. One new 4.5 s scene, `visit-route`:
  - an overlay headline with an accent span, "Satu tutor, jadwal kamu.";
  - a dashed `path` route that a `draw` beat draws while a `follow` beat carries a tutor dot along it;
  - a home marker with an `emphasize` beat, a label, and the reused WhatsApp CTA group.
- Revisions, each applied with `edit --from <staging> --expect <sourceRevision>`, with `validate --stage plan` run after every one:

| Revision | Change | `data.reuse` | Validate |
|---|---|---|---|
| `0d4a5c81…` | add scene | images 2/2 unchanged; scenes 1 unchanged + 1 added | one warning, `TEXT_OUTSIDE_SAFE_ZONE` on `home-label` (x 600 + width 400 > 1080 − 84) |
| `e795866f…` | internal correction 1: label width 396 | scenes 1 unchanged / 1 changed | clean |
| `c85131c1…` | add the existing synthetic music bed as `soundtrack.music` | images 2/2 unchanged; scenes 0/2 unchanged | clean |

  - The music bed is a copy of `test-fixtures/project-current-issues/audio/music/bed.mp3` (SHA-256 `93f1b4b5…15bdb2`, the same as the fixture). Its settings are volume 0.6, no loop, fade in 800 ms, fade out 1500 ms. The master file was not changed and no provider was called.
  - Adding the soundtrack marks both scenes as changed in the reuse report, although scoped previews carry no music. This is recorded as an observation, not investigated further.
- Scoped preview: `preview work/visual-parity/lbc-trial --draft --scene visit-route --json` exits 0 in 11.8 s.
  - Build `2dcce997f37b-25714ca3-a0d`: frames 240–375 of the project, label `DRAFT • NO AUDIO`, no issues.
  - The implementer checked the contact sheet (`…/builds/2dcce997f37b-25714ca3-a0d/contact-sheet.png`). The dot waits at the route start and then travels as the route draws, the label and the home emphasis land, the CTA enters, and the headline stays fixed.

*Blocker B1 — full draft preview with music and no narration always fails.*

- Reproduction:
  - Command: `preview work/visual-parity/lbc-trial --draft --json` at revision `c85131c1…`.
  - Result: rendering reaches 100%, then the command exits 2 with `SYSTEM_ERROR` "A local system dependency or renderer operation failed." (`work/m2-4-5/08-preview-full.{json,err}`).
  - `doctor --json` reports everything ready.
- The redacted cause was read with a diagnostic script that calls the same `loadPlanProject` → `compileDraft` → `publishPreviewBuild` path (`work/m2-4-5/diag-full-preview.mjs`; output `work/m2-4-5/10-diag-full-preview.txt`; reproduced twice). It throws "Build metadata is incomplete or does not match the compiled draft." from `assertCompleteMetadata` (`packages/cli/src/preview-build.ts:667`) inside `validatePreviewBuildIntegrity`.
- Cause, read from the source and not yet proven by a fix:
  - The published metadata records `render.audio` from `verifiedMedia.audio` (`preview-build.ts:1390`). `validateProbe` (line 844) returns `"aac"` whenever `draft.narration || draft.soundtrack`.
  - `assertCompleteMetadata` instead expects `render.audio === (draft.narration ? "aac" : "none")`, so a soundtrack-only draft is always rejected after a successful render.
  - The `muted` check in the same function already uses `narration || soundtrack`.
  - Existing coverage uses a fixture with narration and music, so this path has no test.
  - Scoped previews are unaffected because they carry no music.
- Effect on the trial: the full-project preview needed for the reuse and undo evidence cannot be produced while the project has music. Removing the music would let the trial continue, but the audio-reuse part would then only be a reported gap.
- Also noted: the CLI redacts the underlying error to a generic `SYSTEM_ERROR` with `errorName: "Error"` and points to `doctor`, which reports everything ready. Diagnosing it needed internal access that the public workflow does not give.

*Not done, because the trial stopped at B1:* the headline revision, slower camera, object replacement, profile change, undo, the reuse evidence for those steps, and `pnpm verify`. Nothing in the code changed, so no gate was run. Timing was not measured systematically. The CLI steps themselves were short: `edit` took about 0.1 s, scoped preview 11.8 s, and the failing full preview 49 s. Internal corrections so far: 1 (the safe zone). User interventions: none.

*Decision needed (owner/supervisor).*

- **(a)** A scoped correction task outside the frozen trial: make the metadata audio expectation match `narration || soundtrack`, add a regression for a full soundtrack-only draft preview, bump nothing unless pixels change, then restart the trial on a new recorded freeze.
- **(b)** Continue this trial without music and report audio reuse as a gap, with B1 kept open.

The recommendation is (a). Music without narration is an advertised route in the skill (`soundtrack`), and a trial that works around it would not test the engine as frozen.

#### M2.4.5-F1 — Contrast diagnostic against the actual backdrop

**Chosen by Fatih 2026-09-27** from the M2.4.5 retrial findings (F1), and recommended first by the supervisor. It picks up M2.4.4's recorded gap 3, first fix: when an image or world plate lies under the text, report the backdrop as unknown instead of warning against the profile background.

**Problem, reproduced in the retrial.** `CONTRAST_INSUFFICIENT` compared text with `palette.background`, or with an opaque rectangle only when the rectangle fully covered the text. Images were skipped as if absent.
- Light profile text on the white report-card SVG was nearly unreadable and raised nothing.
- Readable dark ink on the same card warned "1.09:1 against the background".
- In Medan, all 18 warnings compared text over SVG plates with the page.

**Scope.**
- Judge text against what can actually be painted under it, when source data determines it reliably: the page background, opaque flat-fill rectangles and circles, and their strokes. Accent and quiet runs and the text's own opacity are included.
- Report `CONTRAST_UNVERIFIED` (info) when this cannot be determined. That covers an image or SVG, a path, a translucent shape, a shadow, a group movement not tracked here, or a layer at another camera depth that the camera brings under the text. This replaces a ratio against a backdrop the text is not on.
- Keep every valid check and the warning severity; nothing is switched off.
- Not included: image or SVG pixel analysis, general occlusion, render-time sampling, F2–F5, visual gates, export and M3.
- If the solution needs a large expansion, stop and ask for a decision.

**Implementation boundary.**
- Core `packages/core/src/compiler/contrast.ts`, with the design canvas and the resolved beat start times passed from `compile-draft.ts`; the latter through an optional `beatStartsMs` on `VarietyScene` in `variety.ts`.
- Focused unit and integration tests.
- One skill line documenting both codes.
- No renderer, schema, CLI or render-identity change.

**Acceptance.**
- A small fixture reproduces both retrial conditions through `validate --stage plan` before the change.
- After the change, both report `CONTRAST_UNVERIFIED`, while computable cases (text on a panel, a palette-token colour) still warn with the right backdrop.
- Other issue codes are unchanged on the repository's sample, fixture and work projects.
- Regressions fail without the change.
- `pnpm verify` passes.
- Serial E2E only if a runtime boundary changes.
- No claim that legibility over artwork is guaranteed.

#### Active handoff — M2.4.5-F1

**Integration record — 2026-09-28 (implementer).** Fatih approved integration. The supervisor's integration review below was committed to the branch as documentation only (`docs/plan.md`). No implementation, test or skill change after the reviewed head `9b705eb`, and the seven fingerprints were rechecked before merging. As the supervisor requested, the PR description now says the review checks ran across the series and that the final round validated both fixtures, not that every round did. PR #21 was squash-merged using the head-commit guard, the task branch deleted and `main` synced. No suite or render was rerun. F2–F5, the visual gates, export and M3 were not started.

**Supervisor integration review — 2026-09-28: TECHNICALLY_READY FOR MERGE, awaiting explicit Fatih approval.** Live PR #21 is OPEN, non-draft, MERGEABLE/CLEAN, base `main`, head `f1-contrast-diagnostic` at `9b705eb9f75722ac5ee38a237003c530737d4206`, with no registered checks. Local HEAD, remote-tracking branch and live remote head all match. Parent and live remote main are `44d172efaec863a15097f02db1951371f55b128b`. Working tree was clean before this review note.

- Exactly eight files in the commit and live PR: the seven reviewed code/test/skill files plus this plan; no work artefacts or generated output. Author/committer are Fatih; commit message has no agent identity or trailer. Independently recomputed all seven SHA-256 fingerprints: exact matches to the pass-3 review. No implementation/test/skill drift from the accepted candidate.
- Committed handoff retains pass-3 sign-off, evidence limits, fingerprints and correction history. Its integration note and tracker describe an open, unmerged PR. PR body separates implementer gates from supervisor checks, correctly labels E2E 10/10 as pass-2 evidence, states no final-candidate E2E, discloses the earlier gate error and accurately qualifies the info/undo assertions. No blocking integration finding.
- Small non-blocking wording correction for the PR: replace “In each round ... public CLI validations of both fixtures” with a description of checks performed across the review rounds; the initial review validated the original fixture, while the separate supervisor-probe fixture was introduced later. Final pass did independently validate both. This does not change technical sign-off or the final evidence.
- No suite or render rerun: reviewed implementation is byte-identical. Only this local handoff entry was added by supervisor; no engine/skill/test/project/Git mutation, commit, push or merge. Merge awaits Fatih's explicit approval. F2–F5, deferred visual/export gates and M3 remain separate decisions.

**Integration note — 2026-09-28 (implementer).** No implementation, test or skill change since the supervisor's pass-3 TECHNICALLY_READY. The seven reviewed files match the recorded SHA-256 fingerprints. Only this note and the tracker wording were added. On Fatih's approval, the eight task files (the seven reviewed files and `docs/plan.md`) were committed and a PR opened to `main`; it is not merged. Nothing under `work/`, no render and no gate artefact is included. F2–F5, the visual gates, export and M3 were not started.

**Supervisor pass-3 review — 2026-09-28: TECHNICALLY_READY (after IN_REVIEW).** P2-C is closed for the supported group-emphasize sweep. No blocking findings in this bounded correction review; the previously accepted P2-A/P2-B and original four corrections remain accepted. Recommend proceeding to documentation/code integration preparation after Fatih authorises the Git actions; no commit/push/merge authorised or executed by this review.

- **Fresh supervisor checks:** focused tests 39/39 passed (36 unit contrast + 3 compiler integration, 480 ms). Public CLI validation of `work/f1-contrast/probes` and the original fixture returned success. P7 crossing reports 1.00:1 against panel marker; its far control reports only the black page, as expected from that fixture's black text/background. Earlier probe codes remain correct. Read the two-case regression proving both the off-centre sweep and loss of opaque coverage; static/shared-motion/far controls also pass.
- **Source reasoning:** for the supported positive, uniform group scale about the fixed group centre, each member edge is affine in scale; the bounding union of resting and maximum-scaled boxes contains the intermediate positions. Outside the common group, `groupScaled` makes `layerStill` false, so that swept reach cannot stop the backdrop walk as guaranteed opaque coverage. Within the same group the shared emphasize cancels, preserving the existing relative-coordinate check. This closes P2-C without a new renderer/motion capability.
- **Recorded evidence audited, not rerun:** all 12 available `after7`/`after6` log pairs have identical contrast code/path/message tuples and identical non-contrast code sequences. Read `verify-5.log`: Biome 157 files, typecheck/build, 270 unit and 276 integration passed. Full verify and bite/restoration remain implementer evidence; the supervisor did not rerun them or render video.
- **Gate decision:** accept no new serial E2E for this final diagnostic-bound correction: publication, renderer, keys and E2E assertions are unchanged in this pass, fresh targeted coverage passes, and reference diagnostic outputs are unchanged. The recorded 10/10 E2E belongs to pass 2 and must remain labelled as such, not as a pass-3 run. If subsequent implementation/runtime/assertion changes occur, reassess the gate instead of carrying this exemption forward.
- **Documentation:** pass-2 assertion wording is now accurate: error/warning checks remain, all info codes are allowed, and undo compares baseline codes rather than asserting a predetermined info set. This tradeoff is accepted for this scope, not claimed to retain the old zero-issue strictness. Existing limits and UNVERIFIED meaning remain; no proof of universal artwork legibility or visual benchmark acceptance. F2–F5, export, visual gates and M3 are not started.
- **Review boundary:** only this handoff/tracker updated by supervisor. No engine/skill/test/project/Git edits, no commit/push/merge. Reviewed implementation/test/skill SHA-256 fingerprints for the integration check:

```text
packages/core/src/compiler/contrast.ts 1e312285c217131dbf04c251ea20c1fff6aee52d5224e664bef47133a4fbffad
packages/core/src/compiler/compile-draft.ts 5f4c08b428a58aaa8fe454ad5e724e0c478319ac50d6c891b4c9039d21483517
packages/core/src/compiler/variety.ts 22c6c08f74842d5b033d7856de62b0b0426b9fa9fec0a4fd1ffe79d7224a8e52
packages/core/test/unit/contrast.test.ts 84ef3b9247d00cc9ea1cd97bebb407fca6958be79fef1f9020d1e482dba94849
packages/core/test/integration/compile-draft-contrast.test.ts 4f757d9a359a32f40cf160c2c0b991872b0411271ebab982fc8654829c5318ea
packages/cli/test/e2e/reference-projects.test.ts 4ca6f866d89cba05fd262e1525c3416b90a54eb015724780fc7ea25378e32ae9
skills/naraframe/SKILL.md 8e6bebfc3509080362dd6ee15ef1ca272bf1096152caeb360d29e8def669cec5
```

**Correction pass 3 — 2026-09-28 (implementer): READY_FOR_REVIEW.** Same branch, still uncommitted; answers P2-C from the supervisor's pass-2 review below. P2-A, P2-B and the four original reproductions were not reopened. No other motion model or capability was added. The Miss Ayu worktree and the old stash were not touched.

*P2-C — group-emphasize sweep.*
- A group's emphasize scale passes through every value from 1 to its largest, and each edge of a member scaled about the group centre moves linearly with that scale. So the backdrop reach is now the union of the resting and largest boxes. The previous two separate boxes skipped the span between them.
- Reach is kept apart from coverage. A new placement flag, `groupScaled`, marks a member moved by its group's emphasize, and such a member is never "still", so its swept box is never taken as an opaque cover. Within the same group the emphasize is shared and cancels, as before.
- Regressions (`contrast.test.ts`, 36 cases):
  - the supervisor's off-centre two-member probe: marker 600–640 sliding to 715–775 across the text at 675–695 now warns against panel marker;
  - a white marker covering black text at rest but sliding away as the group scales warns against the page: the sweep is not treated as cover.
  - The existing controls still pass: the far-away pulsing marker measured against the page, the shared-group move, and the static panel.
- Bite checks:
  - restoring the two separate endpoint boxes fails the off-centre case;
  - letting the swept box count as still fails both group-emphasize cases.
  - Code was restored and compared with `cmp`.
- Public CLI: `work/f1-contrast/probes` gains p7. The crossing case warns against panel marker. Its far-text control warns against the background only because that fixture's page and text are both black; the marker is not implicated. p1–p6 are unchanged. The original fixture is unchanged.

*Affected reference diagnostics reassessed* (`work/f1-contrast/cmp*/after7-*`): every project's contrast codes and messages are identical to `after6`, and other issue codes are identical everywhere. No reference project has a group emphasize whose sweep reaches text.

*E2E wording, corrected.*
- Pass 2 said the `reference-projects` assertions changed "without weakening them". That was not accurate, and the wording in that entry is corrected.
- `blocking()` drops every info code. Scenario 2 still guards errors and warnings, but it now allows info notes both before the profile change and under the contrast profile.
- After `undo`, it checks that the issue codes equal the pre-change baseline. That checks restoration, not an exact expected info set, and it is not the old assertion's zero-issue strictness.

*Checks.*
- Focused: `contrast.test.ts` 36/36 and `compile-draft-contrast.test.ts` 3/3.
- `pnpm verify` passed: Biome 157 files, typecheck/build, 270 unit and 276 integration (`work/gate-logs/f1/verify-5.log`).
- No serial E2E was run for this pass. The recorded E2E (`e2e-1.log`, 10/10, 659.11 s) tested the pass-2 candidate before this correction and is not a run of this candidate. This pass changes only the group-emphasize bound in the core diagnostic and its unit tests, and the reference diagnostics are unchanged.

*Limits.* As in pass 2. Emphasize bounds cover the scale sweep only. Focus and group transform/follow/focus stay unverified. Boxes, not glyphs. F2–F5 were not started.

**Supervisor pass-2 review — 2026-09-28: CHANGES_REQUESTED (after IN_REVIEW).** P2-A/P2-B and the original four reproductions are closed for their tested cases. One remaining finding is in the newly added group-emphasize bound; do not reopen accepted fixes or add motion capabilities.

**Independent checks.** Focused contrast unit/integration tests passed 38/38 (581 ms). Fresh CLI validations of `work/f1-contrast/probes` and the original fixture succeeded with the reported contrast codes; P5 X-only/Y-only and P6 focus now produce UNVERIFIED, and clear controls remain clear. Saved `after6-*` counts and unchanged non-contrast code sequences match the report: Krakatau samples 1 each, current-issues 6, Medan 47, LBC 6, retrial 8, explainer 9, fresh/spatial 2 each. Inspected verify-4 (269 unit / 276 integration) and E2E log (6 files / 10 tests, 659.11 s, exit 0); full gates are implementer evidence, not fresh supervisor runs. E2E log SHA-256 independently matches `458a1782190ecb61d1dfeb37551956b28dbd45744d713ef3d277b41563ae7b6e`; SKILL SHA-256 matches `8e6bebfc3509080362dd6ee15ef1ca272bf1096152caeb360d29e8def669cec5`. Bite checks and the pmset no-sleep observation remain implementer-reported. No video render or full-suite rerun by supervisor.

**P2-C — A group-emphasize sweep has a gap between endpoint boxes (`contrast.ts`, group emphasize `grown.flatMap`, around line 443).** The bound stores the resting member box and maximum-scaled box separately. For a member away from the group centre those boxes can be disjoint, while the renderer passes continuously between them. Reproduction, schema-valid and `compileDraft` succeeds with no CONTRAST issue: white page; two black square group members, `marker` frame `(600,200,40,40)` and `other` `(100,200,40,40)`, cornerRadius 0; identity group transform, group zIndex 0; top-level black text `M`, 24 px, frame `(675,205,20,20)`, zIndex 2; group emphasize scale 1.5 over 0–1000 ms, scene 3000 ms. The group centre is `(370,220)`. Marker X coverage moves from `[600,640]` to `[715,775]`; text `[675,695]` is in the skipped sweep. Independently called the unchanged renderer's `groupScreenTransformFor`: at frame 2 on the 540px draft, scale is `1.2770833138400457`, marker X is `[331.8646,357.4062]`, fully covering text X `[337.5,347.5]` (Y overlaps too). The diagnostic still reports no issue. This is a source/runtime-motion probe, not a fresh video render.

**Bounded correction for P2-C.** Include the full swept box between resting and maximum group-scaled member poses, rather than treating only the endpoints as the reach; an explicitly unknown fallback is also acceptable if a sound bound is not supported. Preserve the distinction between reach and guaranteed opaque coverage (a swept union is not a solid backdrop at every instant). Add the off-centre two-member regression above, retain the far-away and shared-group/static controls, and keep changes limited to this bound. Do not add another motion model. Run focused tests, the small CLI probe and verify; reassess only the affected reference diagnostics. The already recorded E2E result describes this pre-correction candidate and must not be labelled a fresh run of the next candidate.

**E2E assertion review and corrected history.** Allowing the newly introduced advisory CONTRAST_UNVERIFIED info while preserving error/warning checks is a reasonable contract adjustment; undo now checks restoration of baseline issue codes. It is not literally unchanged strictness: `blocking()` drops all info codes, and baseline-derived equality checks restoration rather than the exact expected info set. Qualify the handoff's “without weakening” wording accordingly; optionally limit permitted baseline/apply info to the expected contrast code. The implementer's admission that prior assertions would fail is valid and supersedes the earlier no-impact justification (including the supervisor's conditional acceptance of that justification). Running serial E2E after updating the assertions was appropriate.

**Recommendation.** Remain CHANGES_REQUESTED for P2-C, not for P2-A/P2-B. The region-axis fix and conservative focus fallback are accepted. Correct the narrow sweep and evidence wording, return READY_FOR_REVIEW, no commit/push/merge. Only this plan/handoff/tracker changed in supervisor review; no engine/skill/test/project/Git changes. F2–F5, visual/export and M3 remain out of scope.

**Correction pass 2 — 2026-09-28 (implementer): READY_FOR_REVIEW.** Same branch, still uncommitted; answers the supervisor's correction review below. The four earlier reproductions were not reworked; their regressions and CLI probes still pass. The Miss Ayu worktree and the old stash were not touched.

*P2-A — partial transform after a follow.*
- The centre is now tracked as a region: a point while the pose is known, the path's frame after a follow, and a band after a transform that sets one axis. The named axis moves to its new place; the other keeps the band it had.
- Any step from a region, or one that turns, is bounded by the frame's swept disk over both regions.
- Regressions:
  - the supervisor's x-only case (image reaching the text at (600, 90)) is now `CONTRAST_UNVERIFIED`;
  - a mirrored y-only case is `CONTRAST_UNVERIFIED`;
  - control: x-only to 600 with the text at y 700, which the image provably never reaches, has no issue.
- The public CLI fixture `work/f1-contrast/probes` gains the same three scenes (p5).

*P2-B — focus.*
- A `focus` beat on a layer, or on its group, makes that layer unbounded here: `CONTRAST_UNVERIFIED` ("a focus beat moves …", or "moves with its group …, and group movement is not tracked here").
- It is not simulated. The renderer's `motionStateFor` does have simple bounds (pan −spacingUnit·12·intensity; push and zoom up to `focusScale` about the anchor, persisting), which a later task could use.
- Regressions:
  - the supervisor's panel-focus case is unverified;
  - the same with focus on the panel's group is unverified;
  - control: the same panel without focus covers the text, no issue.
- CLI fixture scenes p6: the focused panel is unverified and the static control is clear.

*Emphasize, found while closing P2-B.* Backdrop motion that was treated as stationary.
- As a backdrop, a layer's own `emphasize` grows its boxes by the largest scale, about each box's centre. A convex fill scaled up about its centre still contains the text it covered, so the cover holds, but the outline is no longer treated as exact.
- A group's `emphasize` scales its members about the centre of their frames, as `GroupView` does. Across groups, both the resting and the scaled boxes count and cover is not assumed. Within the group it cancels.
- As text, the layer's own emphasize stays a transition and is not judged, as before.
- Regressions:
  - a dark shape next to the text reaches it only while emphasized: warning, and the resting control is clear;
  - an emphasized panel under the text still covers it;
  - a pulsing marker group far from the text is measured against the page, with no unverified entry;
  - next to the text, the group's pulse makes the marker count.

*Bite checks* (targeted mutations on this pass's code; restored and compared with `cmp`):
- keeping the old one-axis rule fails both axis cases;
- dropping the focus check fails the focus case;
- dropping emphasize scaling fails the emphasize case;
- dropping group emphasize scaling fails the group case.

*Effect on existing projects* (`work/f1-contrast/cmp*/after6-*`; other issue codes identical everywhere):
- Medan (47), LBC (6), LBC retrial (8), explainer (9), fresh trial and spatial example (2 each) are unchanged from the previous pass.
- New: `samples/krakatau-draft` and `samples/krakatau-narrated` each gain 1 unverified (text over `map-image`, which a `focus` beat moves).
- `project-current-issues` goes from 3 to 6 unverified (3 fades plus 3 focus).

*Gate correction.*
- The previous pass skipped E2E on the claim that no E2E assertion changed. That was wrong from correction pass 1 on.
- `reference-projects` scenario 2 asserts that production validation of `project-current-issues` returns no issue codes at all, and under the contrast profile nothing besides `VOICE_STYLE_MISMATCH`. The fixture's genuine `CONTRAST_UNVERIFIED` info notes (3 from pass 1, 6 now) would have failed both assertions. This was confirmed by running the same CLI sequence directly.
- The assertions were changed to keep guarding errors and warnings while allowing the new advisory info notes (wording corrected in pass 3):
  - the baseline before the profile change may have no errors or warnings, and info is allowed;
  - under the contrast profile, no errors or warnings besides voice, and info is allowed;
  - after `undo`, the production issue codes must equal the baseline's. This checks restoration; it is not an exact expected info set, and it is not the old zero-issue strictness.
- File: `packages/cli/test/e2e/reference-projects.test.ts`. No other E2E or contrast test was loosened.

*Checks.*
- Focused: `contrast.test.ts` 35/35 and `compile-draft-contrast.test.ts` 3/3.
- `pnpm verify` passed: Biome 157 files, typecheck/build, 269 unit and 276 integration (`work/gate-logs/f1/verify-4.log`).
- Serial `pnpm test:e2e` passed:
  - started 04:36:35 WIB, on battery under `caffeinate -dims`;
  - 6 files, 10 tests, 659.11 s, exit 0 (`work/gate-logs/f1/e2e-1.log`, SHA-256 `458a1782…63ae7b6e`);
  - `caffeinate` printed its usual `PreventUserIdleSystemSleep` warning, and pmset records no sleep or wake that day.
- `SKILL.md` was edited after verify; it is markdown only (SHA-256 `8e6bebfc3509080362dd6ee15ef1ca272bf1096152caeb360d29e8def669cec5`).

*Supported coverage, as the skill now states.*
- Bounded motion: `transform`, `follow`, emphasize (own or group), reveal/exit windows, and camera moves.
- Unverified: `focus`, and group transform, follow or focus against layers outside the group.
- Boxes, not glyphs; the text's own fades, drift and emphasize are not judged.
- F2–F5 were not started.

**Supervisor correction review — 2026-09-28: CHANGES_REQUESTED (after IN_REVIEW).** The four original reproductions and their controls now pass; two reachable-motion cases still fall through as known/clear. Do not reopen the four fixed reproductions or expand into general scene simulation. Prefer explicit UNVERIFIED for unsupported motion combinations.

- **Independent verification:** focused unit/integration tests 32/32 passed (408 ms). Fresh public CLI `validate work/f1-contrast/probes --stage plan --json` returns the three expected background warnings, opacity-half UNVERIFIED and rotating-image UNVERIFIED, with both interior/shared-motion controls clear. Fresh validation of the original fixture still returns two image UNVERIFIED entries plus panel/token warnings. Parsed saved `after4-*` against corresponding `before-*`: reported counts match (Medan 47, LBC 6, retrial 8, current-issues 3, general-explainer 9, fresh-trial/spatial-example 2 each); other issue-code sequences match. Those project-wide comparisons are saved-log audits, not fresh reruns. Verify 263 unit / 276 integration and bite/restoration are implementer evidence, not rerun by supervisor.
- **Model review:** rounded containment and rectangle Minkowski/ellipse intersection math are appropriate for the stated axis-aligned, static fill cases. Group-opacity and independently moving members address the original reproductions. Resolved `starts.beats` wiring and the new anchored-reveal regression agree with the intended source-time window check. More UNVERIFIED entries are an acceptable consequence of conservative coverage, not evidence of improved visual quality. Disk bounds cover the original rotation case, but not every follow/transform combination as currently claimed. No new pixel or renderer change was made; the existing diagnostic-only E2E exemption remains conditional on that boundary.

**Remaining P2-A — Partial transform after follow drops the changed axis (`contrast.ts`, lines 355–358).** Reproduced with a schema-valid 3000 ms scene on the original fixture source cloned in memory: black background, white text `M`, fontSize 24, frame `(600,90,30,30)`, zIndex 2. Path `route`: `M 0 0 L 100 0`, viewBox `(0,0,100,10)`, frame `(100,100,100,10)`, zIndex 0. Image `photo`, asset `report-card`, frame `(0,0,20,20)`, zIndex 1, follows route over 0–1000 ms, then transforms only `to.x=600` over 1000–2000 ms. Both compileDraft and direct current-source checkContrast produce no CONTRAST issue. The unchanged renderer's `motionStateFor` at frame 60 returns `(translateX,translateY)=(300,45)` on the 540px draft, placing the 10px image at `(300,45)` inside the text's `(300,45,15,15)` draft box. The diagnostic keeps `toCentre=onPath` whenever either axis is missing, so it never includes the changed X coordinate. Preserve the retained-axis range and changed-axis position, or return unknown for partial transforms after follow. Include X-only and Y-only regressions plus a known non-intersecting control; do not accept no issue while the image reaches the text.

**Remaining P2-B — Focus motion is treated as stationary (`contrast.ts`, moves filter around lines 308–314).** Black background and black text `M`, fontSize 24, frame `(450,200,30,30)` above an opaque white square panel `(100,100,400,400)`, radius 0. Give the panel a valid `focus` beat, `camera: pan`, `intensity:1`, over 0–1000 ms. Schema and compile succeed with no CONTRAST issue. At frame 60 the unchanged renderer returns `translateX=-48` in draft coordinates: the panel's right edge is 202 while the text begins at 225, exposing black on black. The effect persists after the beat; it is not merely the text's own transient fade excluded by the handoff. `reachFor` only considers transform/follow, so the panel is still trusted as an opaque cover. Conservatively mark unsupported focus motion (including affected groups) unknown, or correctly bound it. Add this focused regression and retain a static-panel control. Do not build a separate focus simulator just to close this task.

**Next bounded correction:** close P2-A/P2-B with conservative fallbacks or small sound bounds; keep all existing positive controls. Recheck the small CLI fixture, focused tests and `pnpm verify`, then return READY_FOR_REVIEW without commit/push/merge. Qualify the skill/handoff coverage where necessary: recorded text fade/drift/emphasize exclusions do not justify treating unhandled backdrop motion as stationary. Only this plan/handoff and tracker were updated by the supervisor; no engine/skill/test/project/Git changes or video render. F2–F5, visual gates/export and M3 remain out of scope.

**Correction pass — 2026-09-28 (implementer): READY_FOR_REVIEW.** Same branch, still uncommitted; responds to the supervisor's CHANGES_REQUESTED below. Nothing outside core diagnostics, its tests, one skill bullet and this plan changed. No renderer, publication, key or runtime change. The Miss Ayu worktree and the old stash were not touched.

*The four probes, first as failing regressions, then fixed.*

1. **Rounded corner.**
   - Coverage now uses the rounded rectangle's actual outline: its four corners are tested against the radius, which is clamped to half the shorter side as CSS does.
   - A still shape whose fill never touches the text box is not a backdrop, so the probe's text reads against the page and warns 1.00:1.
   - A text box inside the shape's frame that reaches past a curved edge is `CONTRAST_UNVERIFIED` ("its box reaches past the curved edge of …"). It is not measured against the page.
   - Controls:
     - a label well inside the same radius-200 panel stays measured with no issue;
     - the radius-44 `project-current-issues` map label is contained by the exact test;
     - a CTA label whose box equals its rounded button is unverified, not a false warning against the page;
     - text in the corner of a circle's frame reads against what is behind the circle.
2. **Group member moving on its own.**
   - Members of one group are compared in the group's frame. The group's own motion is shared and cancels; each member's own beats still move it.
   - The probe (panel moves to x 600 inside the group) now warns 1.00:1 against the page.
   - Control: the whole group moving keeps the text on its panel, no issue.
3. **Group opacity.**
   - Effective opacity is the layer's opacity times the group transform's opacity; text blending uses it too.
   - Opacity 0: the panel is skipped and the text warns against the page.
   - 0.5: `CONTRAST_UNVERIFIED` (translucent shape).
   - 1: control, no issue.
   - Reveals and exits of a backdrop or its group are handled by showing windows:
     - the text is judged only while it is fully shown;
     - a backdrop that never shows then is ignored;
     - one fully shown for that whole time is used;
     - anything else is `CONTRAST_UNVERIFIED` ("fades in or out while the text is visible").
   - Phrase-anchored beats use the compiler's resolved start times (`starts.beats`, passed as `beatStartsMs`). Without them, timing is "not known here".
4. **Rotation.**
   - The renderer adds the pose rotation to the layer's own rotation, and the model now does the same.
   - A transform step that turns the layer, or follows a pose known only to lie on a path (after a follow, including `orient`), is bounded by the disk the frame sweeps: half the diagonal at the larger scale, around both centres.
   - Steps that keep the rotation keep the exact union of posed boxes: cubic easing never overshoots.
   - The probe (image turning 0→180°) is `CONTRAST_UNVERIFIED`. Control: the same image sliding without turning stays clear of the text, no issue.

*Public CLI.*
- New fixture `work/f1-contrast/probes`, created with `create --profile current-issues`, has palette overrides (black page and text, white surface) and the supervisor's four probes plus two controls. `validate --stage plan` (`final-probes-validate.json`) gives:
  - p1 rounded corner: warning;
  - p1 control: none;
  - p2 member moves: warning;
  - p2 control: none;
  - p3 opacity 0: warning;
  - p3 opacity 0.5: unverified;
  - p4 rotation: unverified.
- The original fixture (`final-fixture-validate.json`) is unchanged: both retrial conditions are unverified, and the panel and token cases warn.

*Regressions.*
- `contrast.test.ts`: 29 unit cases (+7). They cover the four probes with their controls, the CTA-style rounded label, the circle's frame corner, and panels revealed together, before or after the text.
- `compile-draft-contrast.test.ts`: 3 integration cases (+1). The new one shows that phrase-anchored reveals are judged at their resolved times.
- Bite checks:
  - with the previous candidate's `contrast.ts`, the 5 new probe and reveal cases fail;
  - without `beatStartsMs` from `compile-draft.ts`, the narration case fails.
  - Code was restored and compared with `cmp`.

*Effect on existing projects* (`validate --stage plan`, `work/f1-contrast/cmp*/after4-*`; other issue codes identical everywhere):
- `samples/*`: none.
- `project-current-issues`: 3 unverified. `layer-1-text` and similar text is visible from the start while their shapes appear with `layer-stack` at 500 ms.
- `project-general-explainer`: 9 unverified (5 translucent scrim, 4 shapes fading while text shows).
- Medan: 0 warnings, 47 unverified:
  - 16 labels whose box reaches past a rounded pill's curved edge;
  - 9 images;
  - 9 fades;
  - 11 camera depth;
  - 1 path;
  - 1 group movement.
- LBC: 6 unverified (3 image, 2 camera, 1 CTA pill). LBC retrial: 8 unverified (4 image, 2 camera, 2 CTA pill).
- The M2.4.4b fresh trial has 2 unverified (pills); the spatial example has 2 (1 pill, 1 camera).
- More text is unverified than in the first candidate. The difference is the conservative corner and fade rules, not lost checks: no former warning disappeared silently, and the static computable cases still warn.

*Skill.* The `SKILL.md` bullet now states when a shape counts as a backdrop: its fill, rounded corners included, contains the text box, and it is shown for as long as the text. It lists the unverified cases, says the check works on boxes rather than glyphs, and repeats that neither code proves legibility. The unverified suggestion now names the fix (text box inside a panel's straight edges, panel shown as long as the text). SKILL.md SHA-256 `c01921c1f77637ffb2455cc98ea3f9ba3523173f6a7d2b38d6dbf3d24b02a0df`.

*Checks.*
- `pnpm verify` passed: Biome 157 files, typecheck/build, 263 unit and 276 integration (`work/gate-logs/f1/verify-3.log`).
- Serial E2E not run, as the supervisor accepted for this diagnostic-only scope. No renderer, publication, render-key or runtime-acceptance change; `compile-draft.ts` only passes data to the diagnostic.

*Limits.*
- Boxes, not glyphs: labels that fill a rounded pill stay unverified.
- The text's own fades, reveal and exit drift and emphasize scale are not judged.
- Group motion against layers outside the group is not bounded.
- A follower is bounded by its path's frame.
- Unverified text is neither passed nor failed.
- F2–F5 were not started.

**Supervisor review — 2026-09-28: CHANGES_REQUESTED (after IN_REVIEW).** The original image-backdrop cases are corrected, but four schema-valid probes still produce no contrast issue when the backdrop is not the one the diagnostic assumes. Technical integration is not approved. Only this plan/handoff was changed by the supervisor; no engine/skill/test/project/Git mutation or render.

**Independent checks.** Ran the focused unit/integration pair (24/24 passed, 430 ms), and the public CLI `validate work/f1-contrast/fixture --stage plan --json` (exit 0, two UNVERIFIED image cases and the two expected panel/token warnings). Read renderer `LayerView`, `GroupView`, `SceneView`, `motionStateFor` and `planeTransformFor`. Paint stacking order and the plane formula agree for the supported static cases. Parsed all saved before/after pairs in `work/f1-contrast/cmp` and `cmp2`: reported contrast counts agree, including Medan 18 warnings to 31 info entries, and other issue-code sequences are equal. This audits saved evidence, not a new before/after run of each project. Verify 256 unit / 275 integration is from the implementer's log, not rerun; bite checks/restoration remain implementer-reported. The fresh fixture message differs slightly from the earlier saved `after-validate.json` wording, with the same codes/severities. Documentation diff preserves historical handoffs and identifies superseded scope.

**Reproduction setup.** Read `work/f1-contrast/fixture` with `loadPlanProject`; clone its source in memory only, set palette background/text to `#000000`, surface to `#FFFFFF`, and replace scenes with one 3000 ms composition. In every case, `SceneSchema.parse` accepts the scene and `compileDraft` returns `ok: true`, with no error or CONTRAST issue. The same direct call to the current source `checkContrast` returns `[]`. Frames below are design pixels `(x,y,width,height)`. Unless specified: opacity 1, rotation 0; panel zIndex 0, text zIndex 2; text `M`, fontSize 24. These are source/geometry probes, not fresh rendered-frame evidence.

1. **P2 — Rounded cover is not a solid rectangle (`contrast.ts`, `covers`, around lines 562–573).** White rectangle `(100,100,400,400)`, cornerRadius 200; black text `(110,110,45,45)`. The whole text box is outside the rounded fill, so black page remains underneath, but `contains` ends the walk at the white panel and returns no issue. The renderer applies the radius. Do not treat rounded cutouts as covered on an assumption that glyphs are absent. Prove rounded containment, or leave corner-intersecting coverage unverified/continue to the actual backdrop. Keep an interior-label positive control; the existing radius-44 map-label test does not justify accepting every corner.
2. **P2 — Same-group shortcut ignores member motion (`contrast.ts`, around lines 486–490).** White square panel `(100,100,400,400)`, black text `(150,150,80,50)`, both in an identity-transform group. Give the panel alone a transform to `x:600` over 0–1000 ms. After the move, text is black on the black page, yet the shortcut uses resting boxes and sets `layerStill=true`. `GroupView` renders each member through its own `LayerView`, including its independent beats. Only cancel truly shared motion; bound independent member changes or return UNVERIFIED. Regression should demonstrate the panel leaving the text.
3. **P2 — Effective group opacity is ignored (`contrast.ts`, layer filtering/opaque-cover check around lines 454–460 and 556–573).** Same square panel and black text as case 2, but group only the panel and set group transform opacity to 0; the text stays top-level. The invisible panel still ends the walk as an opaque white backdrop. `GroupView` multiplies group transform opacity by group motion opacity. Ignore known-invisible backing layers; handle translucent/animated ancestor opacity conservatively rather than trusting child opacity alone. Include an opacity-zero regression and a fractional-opacity control.
4. **P2 — Endpoint boxes do not bound rotation (`contrast.ts`, `reachFor`, around lines 255–273).** White text `(290,150,30,30)` over black page; image `report-card` `(100,300,400,40)` beneath it, transforming rotation 0 to 180 degrees over 0–1000 ms. Endpoint boxes miss the text, but at 90 degrees the image occupies `(280,120,40,400)` and covers it. Current result is no issue, not UNVERIFIED. Use a sound swept bound or explicitly return unknown for unsupported rotations; do not claim endpoint union bounds rotation. Also keep the renderer's additive base rotation and sequential pose semantics when deciding what is supported.

**Bounded correction.** No pixel analysis, glyph engine, renderer changes or new benchmark requested. Prefer explicit unknown for unsupported motion/opacity geometry over expanding this into a complete scene simulator. Preserve computable static-panel/background warnings. Add focused failing regressions for the four cases, rerun the small public fixture, then `pnpm verify`. Update the skill/handoff limits so they do not advertise reliable coverage where the model returns false negatives.

**Gate assessment.** Not repeating the long renderer E2E is reasonable for this diagnostic-only scope if renderer, publication, keys and runtime acceptance boundaries remain unchanged; focused compiler/CLI checks are the relevant evidence. This is not a blanket waiver if the correction changes those boundaries. Existing full verify and bite evidence do not cover the four probes. F2–F5, visual/export and M3 remain out of scope. Return READY_FOR_REVIEW after correction, without commit/push/merge.

**Handoff — 2026-09-27 (implementer): READY_FOR_REVIEW.** Branch `f1-contrast-diagnostic` from `origin/main` `44d172efaec863a15097f02db1951371f55b128b`, uncommitted. The Miss Ayu worktree and the old stash were not touched. Evidence is under `work/f1-contrast/` and `work/gate-logs/f1/` (both gitignored).

*Reproduction first.*
- Fixture `work/f1-contrast/fixture` was created with `create --profile current-issues` (dark background `#11130F`, light text `#F5F1E8`). It holds the existing LBC `report-card.svg` and four scenes:
  - light profile text on the card;
  - ink `#101A37` on the card;
  - light text on an opaque white rectangle;
  - text coloured `palette.background`.
- Before the change, `validate --stage plan` (`before-validate.json`) gave:
  - condition 1: no contrast issue;
  - condition 2: "1.09:1 against the background";
  - the panel: 1.13:1 against the panel;
  - the token text: 1.00:1.

*Change: `contrast.ts`, rewritten around a backdrop walk.*
- **Paint order** follows the renderer. Each top-level layer and group is a stacking context by `zIndex`, with ties broken by DOM order (top-level before groups); members sort by their own `zIndex`, then `memberIds` order.
- **The walk** goes down from the nearest painted layer under the text:
  - an opaque flat shape that covers the text ends it;
  - a partial one adds its fill (and stroke) and lets the layers below and the page show;
  - an image, path, translucent shape or uncovered shadow makes the result unverified.
  - Rounded corners are not cut out of a rectangle's cover: a legible label whose box reaches a corner of a radius-44 panel warned otherwise, which is the `project-current-issues` map label.
- **Reach of moving layers:**
  - `transform` poses give the union of consecutive posed boxes;
  - `follow` gives the path frame grown by the follower's half diagonal, and a layer whose first move is a follow is not placed at its authored frame;
  - members of a moving or displaced group are not bounded.
- **Camera:** layers on the same plane keep their relation. For different depths with a moving camera, the screen boxes across each camera move are computed exactly from the SKILL plane rule. The text is unverified only when they meet. `compileDraft` now passes `format.design`; without a canvas, such text stays unverified.
- **Ink:** text colour, accent runs (`palette.accent`) and quiet runs (0.62 opacity), blended with the text's opacity over each backdrop colour. The worst ratio is reported, naming its source: panel X, circle X, the stroke of X or the background.
- **Suggestion:** "size the text at or above 24px" now appears only for text below 24 px.

*After the change, same fixture* (`after-validate.json`):
- Both retrial conditions report `CONTRAST_UNVERIFIED` (info): "image card lies under it, and image pixels are not analysed".
- The panel case and the token case still warn, and the panel message names panel `panel`.

*Effect on existing projects* (`validate --stage plan` only, no render; before = HEAD `contrast.ts` rebuilt, after = this change; files in `work/f1-contrast/cmp*/`):

| Project | Before | After | Other issue codes |
|---|---|---|---|
| `samples/krakatau-draft`, `samples/krakatau-narrated`, `test-fixtures/project-current-issues` | none | none | identical |
| `test-fixtures/project-general-explainer` | none | 5 unverified (text on a translucent scrim over a photo) | identical |
| `work/visual-parity/medan-story` | 18 `CONTRAST_INSUFFICIENT` | 0 warnings, 31 unverified (15 image, 12 camera depth, 3 group movement, 1 path); all 18 former warnings are now unverified | identical |
| `work/visual-parity/lbc` / `lbc-retrial` | none | 5 / 6 unverified | identical |
| `work/m2-4-4b/fresh-trial` | none | none (the heading's own panel is now measured) | identical |
| `work/m2-4-4b/spatial-example` | none | 1 unverified (hill under the title at another depth) | identical |

In the LBC retrial:
- The report rows and `statement-1`/`2b` (over the depth-0.35 `blob` circle) are unverified.
- `headline`, `brand-line`, `statement-2a` and the CTA label are measured.
- `home-label` stays unverified because the badge's path box is conservative: it reaches the label's box although the badge itself stops short.

*Regressions.*
- `packages/core/test/unit/contrast.test.ts`: +12, 22 in total. They cover:
  - both retrial conditions;
  - an image away from the text;
  - panel measurement with the exact message;
  - a rounded panel reaching the label;
  - a partial panel;
  - group paint order;
  - a follower far from and near the text;
  - the camera with and without a canvas;
  - an accent run;
  - a shadow;
  - the size suggestion.
- New `packages/core/test/integration/compile-draft-contrast.test.ts` (2) checks that `compileDraft` passes the design canvas.
- Bite checks:
  - with HEAD's `contrast.ts`, 7 of the new unit cases fail, including both retrial conditions;
  - without the canvas argument, the integration case for a plate the camera never brings under the text fails.
  - Code was restored afterwards and compared with `cmp`.

*Skill.* `SKILL.md` gains one bullet: what each code measures, and what to do when a text is unverified (check the preview frames, or give the text an opaque flat panel). Neither code proves legibility over artwork. The new SKILL.md SHA-256 is `a0b30338e6f0b5f3d695ec881bd56841eb5e35a9630cfd9629e588874bc5d24c`.

*Checks.*
- `pnpm verify` passed: Biome 157 files, typecheck/build, 256 unit and 275 integration (`work/gate-logs/f1/verify-2.log`).
- Verify run 1 failed only in Biome, on six stray JSON files the implementer's own earlier shell loop had written to the repository root. They were deleted after checking timestamps and contents; the rerun had no code change.
- Serial E2E was not run. No renderer, render key or CLI code changed. The E2E projects' plan issues are identical before and after, except the explainer's new info entries, and its scenario asserts only `success`. The `contrast` profile scenario still yields only `VOICE_STYLE_MISMATCH`, which was checked directly.

*Limits.*
- Bounding boxes, not glyph shapes; rounded corners, reveal/exit drift and emphasize scale are not modelled.
- Group movement is not bounded.
- Path followers use the path's frame.
- Unverified text is not judged either way; the author or the owner still has to check it on screen.
- F2–F5 were not started.

#### M2.4.5-F2 — Layout feedback after a profile change (diagnosis)

**Chosen by Fatih 2026-09-28** from the M2.4.5 retrial findings (F2). This entry is a bounded diagnosis only: no engine, skill, test, schema or CLI change and no auto-layout. It works from the retrial's saved events (`work/m2-4-5r/`), the source, and one probe (`work/f2-diagnosis/`).

**What happened in the retrial.** `profile apply current-issues` to the LBC retrial project, then:

| Run | `validate --stage plan` | `preview --draft` (full) | CLI time |
|---|---|---|---|
| after apply (`c28bb650`) | valid (warnings: safe zone, duration) | rejected: 6 `TEXT_OVERFLOW`, 3 `IMAGE_MASK_INVALID` | 3.7 s |
| repair 4b (shrink, radius 0) | valid | rejected: 1 `TEXT_COLLISION` (`statement-2a`/`2b`) | 3.9 s |
| repair 4c (2a height 122) | valid | published R2 | 28.0 s |
| repair 4d (row ink colour) | valid, plus one false contrast warning (pre-F1) | scoped `opening`, published | 21.5 s |

**Diagnosis.**

1. **Why `validate` passed while `preview` refused.** This is intended, not a defect. `validate --stage plan` runs only compile-time checks in core. Overflow, minimum size, collision, off-canvas text under motion, captions and font loading need the laid-out text, which the renderer measures in the browser (`visual-preflight.ts`, `measureText`, `document.fonts.check`) during `preview`. The skill already says so: "a valid plan can still fail there". The `profile apply --dry-run` effect `revalidate-layout` names this need, but no command runs a layout-only check.

2. **Which checks need the browser and fonts, and which do not.**
   - Need them: `TEXT_OVERFLOW`, `MIN_FONT_SIZE_VIOLATION`, `TEXT_COLLISION` (measured text rectangle, per frame with motion), `TEXT_OUTSIDE_CANVAS`, `CAPTION_OVERFLOW`, `CAPTION_COLLISION`, `FONT_NOT_LOADED`. `PATH_INVALID` uses the renderer's path geometry.
   - Do not need them: `IMAGE_MASK_INVALID` is pure geometry. It checks whether the image radius exceeds half the shortest edge, and that radius is already resolved at compile time (`resolveLayerAppearance`, `appearance.media.cornerRadius` 44 under `current-issues`). `PANEL_DEAD_SPACE` is also frame geometry only. Both still run only in preview.
   - Already compile-time: schema and references, timing, `LAYER_OUTSIDE_CANVAS`, `TEXT_OUTSIDE_SAFE_ZONE`, duration and contrast.

3. **Why the problems appeared in stages.** The run did not stop early. The first rejection already listed every measurable error together (9), and the probe shows a collision is reported in the same run as other overflow and mask errors. One check is skipped for layers that overflow: the collision, caption-collision and off-canvas loops `return` for any text whose metrics overflow (`if (!leftMetrics || leftMetrics.overflow) return;`). So the `statement-2a`/`2b` collision was present but hidden until their overflow was fixed:
   - **Latent source overlap.** The LBC source boxes overlap by 2 px (2a at 262 + 124 = 386 > 2b at 384). With Fraunces 112/1.04 the measured text height (116.5) stays inside the box, so there was no collision.
   - **Hidden, not new.** With Arial 800 at 128/1.02 the text overflows; its measured rectangle is clamped to the full box (`min(available, content)`), which reaches 2b, but the collision loop skipped it. Shrink then produced text that fits but still fills the box, so the collision became visible.
   - **Probe** (`work/f2-diagnosis/c28-probe`): the `c28bb650` source restored from the revision store, with only 2a/2b set to `overflowPolicy: "shrink"`. `preview --draft` was rejected in 3.6 s with `TEXT_COLLISION` (2a) alongside 4 `TEXT_OVERFLOW` and 3 `IMAGE_MASK_INVALID` in one report (`probe1-preview.json`), while `validate` was valid. The only thing that delays a problem is the per-layer skip.
   - **The contrast repair (4d) was not a preflight error.** The light rows on the white card were found by looking at frames. After F1, `validate` lists them as `CONTRAST_UNVERIFIED` (info) with the image named (`probe1-validate.json`), which points review at them but does not reject.

4. **Faster feedback without a full video.** It already exists:
   - A preview whose preflight fails is rejected before any frame is rendered: the two rejections took 3.7 and 3.9 s, against 28 s for a full render.
   - `preview --draft --scene <id>` limits the check to one scene.
   - So the retrial's layout loop cost about 7.6 s of rejected previews out of 163 s of preview time. The cost of the extra rounds was author turns (edit, validate, preview), not rendering.

**Classification.**
- *Intended boundary:*
  - measured-text checks need the browser;
  - overflowing text has no reliable settled geometry, so collision for it is deferred.
- *Defect:* none found in the checks themselves.
- *UX opportunities, small and optional:*
  - (a) run the pure-geometry `IMAGE_MASK_INVALID` (and possibly `PANEL_DEAD_SPACE`) at compile time as well, so `validate` reports them right after `profile apply`;
  - (b) say in `TEXT_OVERFLOW`/`MIN_FONT_SIZE_VIOLATION` messages that collision and off-canvas checks for that layer resume once it fits, so a second round is expected rather than surprising;
  - (c) report overflow boxes in design pixels as authored. The message says "456x130 box" (draft pixels) for a 912x260 source frame.
  - Checking collision for overflowing text against its clamped box would surface cases like 2a/2b one round earlier, but it can also report collisions that disappear once the overflow is fixed differently. It is left as an option, not recommended now.

**Recommendation: workflow and skill first, engine change optional.**
- *Skill/workflow (enough on its own).* After `profile apply` (or any change with `revalidate-layout`), run `preview --draft`, or `--scene` per affected scene, straight away as the layout check, and repair all reported errors in one pass. A rejected preview costs seconds, not a render. Expect one more round when overflow errors are present, because collisions of those layers are checked only after they fit. Review every `CONTRAST_UNVERIFIED` text in the frames. Before a profile change, keep adjacent text boxes from touching, so a bigger face does not turn a latent overlap into a collision.
- *Smallest engine change, if wanted:* (a) plus the message hint (b). This is core and preflight messages only, with focused tests; no layout behaviour changes.
- *Not recommended:* a new layout pass or auto-layout, or promising that all problems appear in one run.

**Acceptance (for a follow-up task, if approved).**
- Skill only: the `profile apply` and revision bullets state the preview-as-layout-check loop, the overflow-then-collision order, and the unverified-contrast review; checked by reading `SKILL.md`.
- With (a): on the restored `c28bb650` source, `validate --stage plan` reports the three `IMAGE_MASK_INVALID` errors (today it reports none), while `preview` still reports them; pure-geometry regressions pass.
- With (b): the overflow message on 2a/2b names the deferred collision check.
- `pnpm verify`; serial E2E only if a publication, runtime or E2E-asserted output changes.

**Expected effect.**
- On this retrial the preview count stays about the same. The first rejection is still needed for font-measured overflow, and the collision still needs a second measured round unless the latent overlap is avoided beforehand; with the skill guidance the author would likely avoid it.
- (a) moves 3 of the 9 first-round errors to `validate`. It saves an edit round only when the mask errors are the only ones.
- Wall-clock gains are small, since rejections already skip rendering. The gain is fewer surprise rounds and clearer expectations.
- Limits that remain:
  - measured text still needs `preview`;
  - collisions of overflowing text stay deferred;
  - contrast over images or SVG stays a visual review;
  - no guarantee that every problem appears in one run.

**Implementation — 2026-09-28 (implementer): READY_FOR_REVIEW, in the M2 closure batch.** Fatih asked to close M2 and to do the remaining work at once. He chose the skill guidance plus (a), (b) and (c), and let the implementer choose among the follow-ups: the shared-fixture flake was taken, and `SYSTEM_ERROR` diagnostics stay backlog. Branch `m2-technical-close` from `4298f3a` (renamed from `f2-profile-layout-diagnosis`). The Miss Ayu worktree and the old stash were not touched.

- **(a) `IMAGE_MASK_INVALID` at compile time.**
  - `compile-draft.ts` checks each resolved image layer in the compiled units that preflight uses (`scaleLayer`), with the same code, path, message and suggestion. So `validate --stage plan` reports it, including radii that come from the profile's `appearance.media.cornerRadius`.
  - The preflight check stays as the renderer's own safety net. A compile error stops `preview` before preflight, so it is not reported twice.
  - Real path: on the restored `c28bb650` source, `validate` was valid before; it now fails with the three `IMAGE_MASK_INVALID` errors on `check-1`–`check-3` (`work/f2-diagnosis/after-orig-validate.json`).
- **(b) Overflow hint** and **(c) units.**
  - `TEXT_OVERFLOW` and `MIN_FONT_SIZE_VIOLATION` now read, for example: "Text layer statement-2a does not fit its 456x62 box (draft pixels; the draft is 540x960) within 20 lines. Its collision and off-canvas checks run once it fits, so the next preview may report more." (`work/f2-diagnosis/after-orig-preview.json`, rejected in 3.4 s.)
  - (c) is done as unit labelling, not conversion. The compiled draft does not carry the design size, and adding it would change the draft shape and render keys. The lines clause appears only when `maxLines` is set; the profile sets 20 here.
- **Skill.** A new bullet after the profile-change bullet covers the preview-as-layout-check loop: rejections cost seconds and list every measurable problem, then repair in one pass. It also covers the overflow-then-collision order, keeping neighbouring text boxes apart, reviewing `CONTRAST_UNVERIFIED`, draft-pixel sizes, and the fact that mask radii are now caught by `validate`.
- **Shared-fixture flake.**
  - Mechanism proven. `status` on a project with a parent revision runs `computeReuse`, which creates and removes `.naraframe/attempts/reuse-*` in the project; running `status` once on `samples/krakatau-draft` updated that directory. `command-contract.test.ts` runs `status` on the shared sample, while `draft-project.test.ts` copied the whole sample recursively.
  - Scratch reproduction (`race.mjs`, 20 s, `computeReuse` churning while copying): 321 `ENOENT` in 613 copies, with the same `opendir …/.naraframe/attempts/reuse-…/current` error as the flake.
  - The fix is test-only: `draft-project.test.ts` copies only source and assets (`copySampleSource`, no `.naraframe`, `preview` or `revisions`). The same reproduction with that filter gave 0 in 1184 copies.
  - This removes this copy's dependence on shared runtime state. Other tests still run commands on the shared sample, which is safe for copies made this way.
- **Regressions.**
  - `compile-draft-image-mask.test.ts` (new, 3): profile-default radius 44 on a 56 px icon errors with the exact issue; an explicit 40 errors; exactly half, explicit 0 over the default, and no radius all pass.
  - `visual-preflight.test.ts` (+1): the overflow message names draft pixels and the deferred checks, no collision is reported while the layer overflows, and the same layout reports `TEXT_COLLISION` once the text fits.
  - `draft-project.test.ts` (+1): the sample copy has source and assets, and no `.naraframe`, `preview` or `revisions`.
  - Bite checks:
    - without the compile check, 2 of 3 image-mask cases fail;
    - with the old message, the preflight case fails;
    - without the copy filter, the copy case fails.
    - Code was restored and compared with `cmp`.
- **Effect on existing projects.** `validate --stage plan` results on every sample, fixture and work project (`work/f1-contrast/cmp*/after8-*`) are identical to before, with no new errors.
- **Checks.**
  - `pnpm verify` passed: Biome 158 files, typecheck/build, 271 unit and 280 integration (`work/gate-logs/m2-close/verify-1.log`).
  - Serial `pnpm test:e2e` passed on this candidate: started 22:55:58 WIB on battery under `caffeinate -dims`; 6 files, 10 tests, 664.38 s, exit 0 (`work/gate-logs/m2-close/e2e-1.log`, SHA-256 `f7be52d5…d566aa06e`). It was run because preview's preflight messages changed; its assertions were unchanged. No sleep or wake appears in pmset.
- **Limits.**
  - Measured text still needs `preview`.
  - Collisions of overflowing text stay deferred to the next preview; the message now says so.
  - Contrast over images stays a visual review.
  - No promise that every problem appears in one run, and no auto-layout.

**Supervisor batch integration review — 2026-09-29: IN_REVIEW → TECHNICALLY_READY FOR MERGE.** Reviewed PR #22 at head `15798f583e7e0a02fb4f4249bf0af8bad2147636`, base `main`. No blocking finding. This is technical sign-off, not a merge, visual acceptance, export approval or permission to start M3.

- **Live GitHub and source inspection:** PR is OPEN, non-draft, CLEAN, with three commits and seven files, matching the reported batch. No generated artefacts or agent identity/trailers in the commits. No registered CI checks; the local gate evidence below is not represented as CI. The resolved image radius and frame use the same `scaleLayer` path as the compiled renderer input, and the predicate/code/path/message/suggestion match preflight. Compile failure stops preview before preflight; its independent mask guard remains. Overflow/minimum-font messages share the updated branch and qualify both units and deferred per-layer checks without changing fitting or collision behavior. No renderer identity bump is needed for diagnostic wording and earlier rejection of geometry already rejected by preflight; valid compiled render data and keys are unchanged.
- **Executed independently:** three focused files (`compile-draft-image-mask`, `draft-project`, `visual-preflight`) passed **38/38**. Public CLI validation of the current `work/f2-diagnosis/c28-orig` passed: that directory now contains explicit radius 0 on the three icons, so it is not the uncorrected historical source. A read-only in-memory probe removing those overrides reproduced exactly the three `IMAGE_MASK_INVALID` errors on `check-1`–`check-3`. No project source was changed. Compared all 12 retained after8/after7 diagnostic pairs across `cmp` and `cmp2`: issue arrays identical. This is an audit of those recorded projects, not an exhaustive claim about every work directory.
- **Flake assessment:** inspected the shared-sample `status` invocation, `computeReuse` transient-directory lifecycle, and the new copy filter. Excluding generated directories before recursive traversal removes this copy's exposure to that race. The focused copy regression passed. The reported 321/613 and 0/1184 scratch reproduction and bite checks were not independently rerun; they remain implementer evidence, not supervisor measurements. This does not establish that all shared-fixture races elsewhere are fixed.
- **Evidence read, not rerun:** the saved F2 probe records overflow and collision together once the two affected layers fit; its 3588 ms rejection and the 3398 ms post-change rejection support the bounded diagnosis. Read the verify log (271 unit, 280 integration, Biome/typecheck/build command) and E2E log (6 files, 10 tests, 664.38 s, exit 0). E2E SHA-256 independently matches `f7be52d522b2b3503c4c490a9e67f878183ce032fcb2990e3c76d6ad566aa06e`. The log also contains a failed caffeinate sleep-assertion warning; it does not negate the completed test result. The no-sleep claim remains implementer evidence. No full verify, E2E, bite run, race loop or video render was repeated by supervisor.
- **Closure assessment:** F2 stays bounded: no auto-layout, no guarantee of one-pass detection, measured text still requires preview, and overflow can defer collision checks. The M2.4.1 checkbox has earlier art-direction evidence plus PR #18's spatial-authoring guidance; it is not proof of visual parity. Technical closure follows Fatih's decision; D-VIS explicitly retains NF-AC-16/17, incomplete reference playback, approved export and the spoken population claim. Open technical items and the old gate remain recorded, and M3 requires a separate explicit start. The closure PR itself remains unmerged at this review.
- **Integration recommendation:** accept this exact implementation; add only this review/status record, update the PR's pending-supervisor wording with the evidence distinction above, and preserve the candidate fingerprints. No runtime/test change calls for another long gate merely to record this review. Respect the batch's no-merge instruction; merge is a separate authorized action. An unrelated local `AGENTS.md` memory-context change appeared during review and was left untouched; do not include it in the batch.

Candidate SHA-256 fingerprints (six non-document files):

| File | SHA-256 |
|---|---|
| `packages/core/src/compiler/compile-draft.ts` | `c260ee48a48422b6361ed89a0333701991cf82355348bbf2363494100c5b63ce` |
| `packages/core/test/integration/compile-draft-image-mask.test.ts` | `a2fc5592652340a45701f8bb82af4e82aeba7b4e1f63256e93806615cefe7b98` |
| `packages/core/test/integration/draft-project.test.ts` | `de3fb8f667c84b8c2f9078afbee317618d162fb1644c34587dc41002c0da61fe` |
| `packages/renderer-remotion/src/remotion/visual-preflight.ts` | `2f6fe9cdd9e0af96e69ced9ddc8c3c4797569073c181a07632d7f176146cbcb3` |
| `packages/renderer-remotion/test/unit/visual-preflight.test.ts` | `f42e61f3501527209be0cac7fe4601e89106f73c3140808a4b26f37f223c4f77` |
| `skills/naraframe/SKILL.md` | `159a3686ab2fe0c3a9c3aba40ab0be725667e4901f1dc419189ea281d1e6d01f` |

#### Visual acceptance, tests, and exit gate

| Dimension | Owner assessment |
|---|---|
| Composition and typography | Focus, deliberate framing, readable hierarchy and actual font fidelity |
| Illustration | Relevant convincing objects, not placeholder substitution |
| Motion | Purpose, timing and coherent camera/object choreography |
| Continuity | Within-shot spatial consistency and, for full video, legible shot relationships |
| Explanation | Objects make information easier to understand |

**Early gates:** M2.4.1 requires Fatih's no-worse assessment against the matched accessible reference opening after frame/study approval; M2.4.2 requires a distinct LBC direction worth developing plus frozen-engine revision proof. Neither gate alone passes full NF-AC-16/17.

**Full gates:** NF-AC-16 requires full Medan no worse in all five dimensions and at least two better, judged by Fatih with scene/time evidence. NF-AC-17 requires the retained LBC first full draft to be a publication candidate and ordinary revisions without user coding or runtime patches during the frozen trial.

Follow model → real path → visible output/manual acceptance → focused tests → integration. Known security/correctness fixes receive proportionate immediate regression protection after the fixed path works; do not front-load broad testing or postpone all tests to milestone end. Run `pnpm verify` before integration and serial full renderer E2E at close-out or when changed runtime boundaries require it. Do not rerun the full suite for each decorative adjustment. Existing pixel-repeatability failures remain open until independently evidenced fixed; no retry-until-green or blanket determinism claim.

Use a lightweight handoff record, not new infrastructure, for NF-CO-02. Compare like-for-like content trials, not NaraFrame engine development against one competitor content run. Preserve unknown usage/cost, fresh render versus cache reuse, owner versus agent actions, and internal versus feedback-driven corrections. No cheaper/faster claim without measurement.

**Exit gate (original, kept as history; see the technical closure below for the 2026-09-28 decision):** all five outputs accepted with source/build/revision evidence; NF-AC-16/17 passed; new capabilities advertised only after real-path proof and focused protection; required integration/runtime checks recorded and unresolved constraints explicit. M3 remains pending until this gate passes. Historical M2.3 completion is not revoked.


#### M2 technical closure — 2026-09-28 (Fatih's decision)

**Integration closure — 2026-09-29 (supervisor): CLOSED / INTEGRATED.** Under Fatih's standing authorization to merge reviewed work, PR #22 was squash-merged with exact-head guard `6b06a0bb5dd975624ba60f35ec6e03f09fb8b08b`. GitHub reports MERGED at `2026-09-29T14:50:38Z`, squash `93c0a6769cd31f6b6da96c2a06f6e6432fe1cd23`. Independently verified: the final head differs from reviewed `15798f5` only in `docs/plan.md`; all six implementation/test/skill fingerprints match; the squash tree is identical to the final head; its message contains no agent identity/trailers. Focused tests rerun before merge: 38/38. No full verify, E2E or render rerun for the documentation-only follow-up. Local main was fast-forwarded to origin/main; task branches were deleted locally/remotely. The unrelated local `AGENTS.md` memory-context edit was preserved, and the Miss Ayu worktree and old stash were not touched. This closure record and tracker update are local documentation changes, not part of squash `93c0a67`. Current step is now awaiting Fatih's next decision: D-VIS remains OPEN and M3 has not started.

**Decision.** Fatih chose to close M2 for its technical scope now rather than wait for the visual gates. The NF-AC-16 and NF-AC-17 visual and publication judgements and the approved export are **not passed**. They move to one tracked deferred item, **D-VIS**, below. They are not dropped and are not claimed. This replaces the requirement "NF-AC-16/17 passed" in the M2.4 exit gate for the purpose of closing M2 technically. The original gate text stays below as history.

**What closes.**
- M2.1–M2.3 as delivered.
- M2.4.1–M2.4.5 technical work, M2.4.4b, M2.4.5a, M2.4.5-F1 and M2.4.5-F2, integrated through PRs #12, #13, #15, #17, #18, #19, #20 and #21, plus the M2 closure PR.
- The frozen-engine authoring and revision trial passed its bounded technical acceptance: ordinary revisions, profile change and undo through the public CLI, with no engine or skill patch during the trial.
- New capabilities were advertised only after real-path proof and focused tests. Integration and runtime checks are recorded per task.

**Deferred item D-VIS (open, owner-judged).**
- NF-AC-16: the full Medan preview no worse than the reference in all five dimensions and at least two better, with scene/time evidence. This is M2.4.4's deferred checkboxes. It includes the accessible reference playback for the 0–6.4 s opening, which is still incomplete, since the only recording starts after the title entry.
- NF-AC-17: an LBC full draft judged as a publication candidate.
- The approved export of the Medan preview through `--approve-preview`.
- The spoken "ke-4" population claim still blocks any publication.
- No visual competitiveness, publication readiness or export may be claimed until D-VIS is decided.

**Open technical items carried forward (not blocking the technical closure).**
- F3: undo to a named revision.
- F4: reuse report coverage. Adding a soundtrack marks every scene changed, and music, SVG and fonts are not counted.
- Voice reuse is untested on a narrated revision trial. Unknown media-style bindings have no recorded review, which is M2.4.2's partly-shown checkbox.
- Generic `SYSTEM_ERROR` diagnostics hide causes (seen in B1).
- Issue #16, E2E harness diagnostics.
- Pixel repeatability: the owner-flow hash caveat.
- Measured comparative cost.
- Contrast: `focus` motion is left unverified, although its renderer bounds are simple.
- Layout: collisions of overflowing text stay deferred to the next preview.
- M2.4.4's focused transition-boundary, scoped-neighbour, audio-duration, publication and cache test checkbox, for which no evidence is recorded.
- F5 needs no task.

**M3.** Its entry gate is revised below. M3 is not started by this closure and starts only on Fatih's explicit instruction.


## 8. Historical M3 scope and active audio checkpoint evidence

The evidence below is retained. M3.1-B/B1's checkpoint was dispositioned in M3.P0 and integrated via PR #24 (`b1875e2`) on 2026-10-04; later unchecked tasks follow the mapping in section 0.2 rather than automatic execution of the old sequence. Historical entry-gate wording is not authority to require Medan polish before the new pilot.

**Entry gate (revised 2026-09-28 by Fatih's technical-closure decision):**
- M2 is closed for its technical scope.
- M3 starts only on Fatih's explicit instruction.
- Deferred item D-VIS (NF-AC-16/17 visual and publication judgements and export) stays open and must be decided before any release, publication or visual-competitiveness claim in M3.
- Original gate, kept as history: "M2.4 and NF-AC-16/17 must pass first." M3 is not started by the documentation-only insertion.

**Goal:** Establish repeatability and recovery for Fatih on the reference setup; no three-person nondeveloper study is required.

**Consumes:** M2 projects/profile variant, accepted M2.4 Medan and LBC evidence, built CLI/skill, pinned runtime, receipts, and all accepted requirements.
**Produces:** Linked automated/runtime/visual evidence and a usable operating handoff, with honest measured limits.

### M3.1 — Automated acceptance and recovery

- [ ] Run workspace verify plus renderer E2E on both projects and the derived variant.
- [ ] Check exact issue/exit codes, missing browser, unsafe assets, invalid timing/word requirements, stale sources, cache preservation, source/build atomicity, and cancellation.
- [ ] Compare canonical compiled hashes and selected decoded pixel hashes twice on the same runtime; do not claim cross-machine or encoded-MP4 byte identity.
- [ ] Probe final dimensions/fps/codec/audio/duration; check pause/sample-boundary fixtures within one video frame of synthetic scheduling expectations.

#### M3.1 evidence map and first-batch proposal — 2026-09-29 (implementer, proposal only; revised after the supervisor's APPROVE WITH CHANGES)

Started on Fatih's instruction (via the supervisor) with a limited first scope. This entry maps M3.1's acceptance to evidence that already exists and proposes one small batch. Nothing here was executed: no gate run, render or code change. D-VIS stays OPEN, and nothing below claims publication readiness, export approval or visual quality.

**Current candidate.** `main` `93c0a67` (PR #22). Its code and test tree equal the reviewed head `15798f5`; the only later change is documentation.

| M3.1 acceptance | Existing evidence | Status |
|---|---|---|
| Workspace verify plus renderer E2E on both projects and the derived variant | `pnpm verify` (271 unit / 280 integration) and serial `pnpm test:e2e` 10/10 (664 s) on `15798f5`. `reference-projects` scenarios 1–3 cover `project-current-issues`, `project-general-explainer` and the `contrast` profile variant, plus owner flow, reuse, fonts and soundtrack | **Shown on equivalent code.** A formal rerun on the M3.1 head belongs to close-out (M3.1-C) |
| Exact issue and exit codes | `command-contract.test.ts` (versioned events, usage/source/cancellation failures, redaction), `render-command.test.ts`, `validate-command.test.ts`, `cache-clean.test.ts` (exit 3 for usage) | Covered in integration (real CLI entry, in-process) |
| Missing browser / FFmpeg | `command-contract` "reports missing browser and FFmpeg tools without attempting downloads"; M0.8.3 egress-denied run | Covered |
| Unsafe assets | `svg-sanitize.test.ts`; path, hash and symlink checks in core load tests; output-symlink refusal in `preview-publication` | Covered |
| Invalid timing | timing-message and M2.4.3 compiler tests (overlap, out-of-scene, rounding) | Covered at compile level |
| Phrase requirements | narration-source and phrase-anchor tests (phrase ids, anchored starts, measured phrase timing) | Covered at compile level |
| Word-level requirements | `profile.production.timing.wordLevelRequired` exists in the profile schema and is set in test fixtures, but no compiler or CLI code enforces it and no test proves an enforcement | **Open, not proven.** Not in this batch |
| Stale sources | `command-contract` (stale after valid edit); `owner-flow` E2E | Covered |
| Cache preservation | `cache-clean.test.ts` (keeps approved, selected and current builds; lock refusal; no symlink traversal) | Covered |
| Source/build atomicity | preview and final publication failure injection (pointer kept, attempts cleaned); revision lock with stale-owner takeover (`revisions.test.ts`, synthetic lock file) | Covered with injected failures |
| Cancellation | abort-signal paths in publication and command-contract; SIGINT handler unit test (`process-interruption.test.ts`) | **Gap:** no real CLI process interrupted or killed during rendering, with pointer, builds, lock, staging and browser descendants checked afterwards |
| Canonical compiled hashes and decoded pixel hashes, twice on one runtime | key-order determinism (M0.8.2); `owner-flow` compares lossless frame hashes of a repeated build | **Partial/open:** known pixel-repeatability caveat (2026-09-20 failure, earlier 8/9 E2E runs) |
| Final dimensions/fps/codec/audio/duration probe | `final-publication.test.ts` with a mocked probe; the only real final export is M1.3's Kore build (2026-09-20, old engine) | **Gap:** no real export probe on current code |
| Pause and sample-boundary fixtures within one frame | narration timeline unit tests (pause and breath offsets); soundtrack E2E measures levels | **Partial:** compile-level only; not measured in rendered audio |

**Proposed batch M3.1-A: real-process interruption during `renderMedia`, and recovery.**

- **What it covers.** It proves only interruption while frames are being rendered (`renderMedia`). Cancellation during bundling, composition selection and preflight, and during post-processing (media validation, contact sheet, metadata, publication), stays outside this evidence. The publication stages keep their existing injected-failure tests.
- **Setup.**
  - `work/m3-1a/project` is a source-only copy of `samples/krakatau-draft`, with no `.naraframe`, `preview` or `revisions`.
  - One baseline `preview --draft --json` publishes build B0. Record its pointer, `preview/builds` listing and `.naraframe` listing.
- **Execution details (approved with the scope, 2026-09-29).**
  - Each trial is compared with the pointer and build list recorded just before that trial, not with the first B0. A1's recovery publishes a new build, so A2's baseline is that build unless a separate project copy is used.
  - The descendants' identities (PID, start time, command) are saved before the signal. The same PIDs are checked after the parent dies, including any that became orphans. Identity is verified again before any cleanup, and no process outside the trial is stopped.
- **How a trial runs.**
  - Each trial starts the CLI directly as `node packages/cli/dist/index.js preview <p> --draft --rerender --json` from a small scratch driver, so the signal goes to that Node process's PID and never to a `pnpm` or shell wrapper. `--rerender` makes sure there is a real render to interrupt.
  - **Trigger:** the first stderr progress line from `Render 10%` to `Render 90%` inclusive. A trial that reaches `Render 100%` or exits first is recorded as *not interrupted in time* and is not counted as a pass.
  - **Timeout:** 120 s per trial; on timeout the trial is recorded as a failure.
  - **Descendants:** just before the signal and again afterwards, record the trial CLI's descendant process tree (Chrome/Remotion, found by parent PID) with PIDs and commands.
- **A1 — graceful interrupt (SIGINT to the CLI PID).** Expect:
  - exit 130 and exactly one JSON event with `status: "interrupted"` and `COMMAND_INTERRUPTED`;
  - `preview/current.json` byte-identical to B0's, and no new directory under `preview/builds`;
  - automatic cleanup, with no `.naraframe/attempts/*` left by this trial, no `.naraframe/lock`, and none of the trial's descendant processes alive within 10 s. A leftover attempt, lock or process is a finding, even if `cache clean` could remove it later;
  - then `preview <p> --draft --rerender --json` publishes a new build with `reusedFromBuildId: null`.
- **A2 — hard kill (SIGKILL to the CLI PID).** No JSON event or exit 130 is expected; only the kill status is recorded. Then, in order:
  - record which of the trial's descendants are still alive (orphans) before any cleanup;
  - stop only those recorded trial descendants, never other processes;
  - confirm `preview/current.json` is still B0's and no partial build was published;
  - record leftovers (`.naraframe/attempts/*`, `.naraframe/lock`);
  - if an attempt remains, `cache clean --dry-run` must list it, and `cache clean` must remove it and keep B0;
  - if a lock was left, the next command must take it over. If none was left, no takeover is claimed;
  - `status` works, and `preview <p> --draft --rerender --json` publishes a new build with `reusedFromBuildId: null`.
- **A3 — limited addition: a note edit during render.**
  - Start the preview as above, and during `renderMedia` run a valid `edit` that changes only a scene `note`.
  - Expect both commands to succeed, the published build to record the pre-edit `sourceRevision`, `status` to report the preview stale against the new revision, and pointer and revision history to stay consistent.
  - This shows metadata consistency for a note-only edit. It says nothing about isolation of assets, audio or other source changed during a render.
- **Automated coverage, after the manual path.**
  - One E2E file, `packages/cli/test/e2e/interruption-recovery.test.ts`, covering A1 with the same trigger, direct PID, timeout and descendant checks.
  - A2 is added only if it is deterministic; otherwise its manual evidence is recorded. A3 is manual evidence unless its timing proves reliable.
  - No existing test is loosened.
- **Gates.** The new E2E file alone and `pnpm verify`. The full serial E2E waits for M3.1-C unless a runtime or publication change is made.
- **Boundaries.**
  - No runtime change. A defect or new gap found here is recorded with its reproduction and a scoped fix is proposed for approval, never fixed inside this batch.
  - No renders beyond the draft copy, no final export, no F3/F4 or other backlog.
  - The local closure note stays local, and `AGENTS.md` is not staged.
- **Expected size.** A few draft previews of an 18 s sample (about 20–30 s each), one new E2E file (about 1–2 min), and one verify.

**Queued, not proposed now.**
- **M3.1-B, technical final export.** A real `render --approve-preview` of a narrated fixture, with an ffprobe check of dimensions, fps, codec, audio and duration, and a rendered-audio check of pause and sample boundaries within one frame. This is a technical export only; it is not the Medan export under D-VIS and not a publication claim.
- **M3.1-C, close-out.** Repeatability from two fresh renders on the same runtime, compared by canonical compiled hash and selected decoded pixel hashes, reported as they come without retry-until-green. Then formal verify and serial E2E on the M3.1 head.

#### Handoff record — M3.1-A (integrated)

**Integration closure — 2026-10-01: CLOSED / INTEGRATED.** Fatih instructed continuation from the proposed integration and M3.1-B next step. PR #23 was squash-merged with exact-head guard `2d6b812a20e6ef09ce4e96aacb722273d7449b8c`, producing `8463764b77dce149ebb34dd0cf56b89dca21a950`. The squash and reviewed head trees both equal `4ee2fe385ee41ce4307c2ed830494ffd8252d9e7`. The PR contained only this plan and the new interruption E2E; commit metadata has no agent identity/trailer. A fresh pre-integration verify passed 271 unit / 280 integration (`work/gate-logs/m3-1a/verify-integration-1.log`), with the test fingerprint unchanged. Main was synced and task branches removed locally/remotely. Unrelated `AGENTS.md` bytes remained unchanged. F-A2 remains OPEN; no M3.1 completion or D-VIS acceptance is implied.

**Correction takeover — 2026-10-01: TECHNICALLY_READY, uncommitted.** Fatih asked the supervisor to continue after the implementer hit its usage limit. The correction was implemented on `m3-1a-interruption-recovery`; no runtime changes, Git integration or M3.1-B/C. The closure note, unrelated `AGENTS.md` change, Miss Ayu worktree and old stash remain untouched by this correction. Historical implementer evidence below is retained, not claimed as newly rerun.

*Correction evidence (current candidate).*
- The E2E harness owns baseline, interrupted and recovery processes. It records PID/start/command identities in a dedicated process group; timeout, spawn and assertion failures retain their evidence before unconditional teardown. Cleanup signals only re-verified identities, waits for termination, and retains temporary files on cleanup failure. Output drain is bounded to 2 seconds; missing files are accepted only for ENOENT. Browser-survivor assertions still run **before** emergency cleanup, so teardown cannot make a failed product cleanup pass.
- Three short synthetic tests exercise timeout with descendants, assertion failure with descendants, and spawn error/output completion. An initial sandbox-denied `ps` run exposed a constructor leak; ownership inspection now runs before spawning. The implementer recorded and stopped the four synthetic processes by exact identities. Subsequent synthetic runs passed. This is test-harness work, not a product fix for F-A2.
- The supervisor ran the corrected real A1 plus synthetic tests: **4/4**, 125.04 s, exit 0 (`work/gate-logs/m3-1a/e2e-correction-1.log`, SHA-256 `c3be9dd8d882996a7e6794e9fb8710ae3042c62a461d553b941f3f624f53240e`). Candidate test SHA at that run was `7c150f7086fe52cec50137a9ac029aa48036c2682ff32d367273cfcfac1cf3c7`.
- First verify stopped at Biome `noUnsafeFinally`; no unit/integration result is claimed for that run (`verify-correction-1.log`). Throws were moved after `finally`, preserving the original failure and combining cleanup failure if present. The final test SHA-256 is `b60c222c7aeb6e185d10d4ffa0b93a5992fd9737c2fe7b47d5dc66c0dab0472f`.
- On that final candidate the supervisor ran synthetic probes again: **3/3**, real A1 skipped, 1.80 s (`harness-correction-2.log`), then **pnpm verify passed**: Biome 159 files, typecheck/build, **271 unit / 280 integration**, exit 0 (`verify-correction-2.log`). The real A1 render was not repeated after this failure-path control-flow correction; its assertions, rendering and signal trigger were unchanged. No full serial E2E or long mutation/bite run was repeated.
- A separate read-only reviewer found no blocker in the harness and rechecked the final `finally` correction. That review was static; it did not rerun the gates. The tests establish the recorded process-group/identity cleanup cases, not universal descendant ownership across arbitrary detached processes.
- F-A2 remains **OPEN**: the actual SIGKILL trial observed ten Chrome descendants surviving for 10 seconds before manual cleanup. Indefinite survival, arbitrary crash/OOM behavior and actual SIGTERM behavior are not proven. Recommend a separately approved, documented cleanup procedure using recorded and re-verified NaraFrame process identities; do not kill generic Puppeteer/Chrome processes by name/profile.
- Integration recommendation: this bounded test/documentation batch is technically ready for commit/PR when authorized, with F-A2 explicit. No commit, push or merge performed; M3.1 remains open pending B/C, and D-VIS remains OPEN.

**Handoff — 2026-09-29 (implementer): READY_FOR_REVIEW, with one operational finding (F-A2) recorded, not fixed.** Branch `m3-1a-interruption-recovery` from `origin/main` `93c0a67`, uncommitted.
- Runtime, engine and CLI are unchanged. The only new file is one E2E test, and this plan is updated.
- The local closure note is kept, and `AGENTS.md` is not part of this work.
- The Miss Ayu worktree and the old stash were not touched.
- Evidence is in `work/m3-1a/` and `work/gate-logs/m3-1a/` (gitignored).
- Scope as approved: interruption during `renderMedia` only. Bundling, composition selection/preflight and post-processing cancellation are not covered.

*Setup.*
- `work/m3-1a/project` is a source-only copy of `samples/krakatau-draft`, 18 s and 540 frames.
- Baseline `preview --draft` published B0, `d6ad181a0f96-32704642-181`, in 44.3 s.
- The trial driver `work/m3-1a/driver.mjs`:
  - spawns `node packages/cli/dist/index.js preview <p> --draft --rerender --json` directly;
  - triggers on the first stderr `Render 10–90%`, with a 120 s timeout;
  - records the descendant tree (pid, start time, command) at the signal, then checks those identities right after the parent exits and again after 10 s.
- Each trial compares with the pointer and build list taken just before it.

*A1 — SIGINT* (`01-a1-sigint.json`). Signal at `Render 10%` (7.5 s into the run).
- The CLI exited 66 ms later with **code 130** and **one** JSON line: `status: "interrupted"`, `COMMAND_INTERRUPTED`.
- `preview/current.json` was byte-identical to the trial baseline (B0), and `preview/builds` was unchanged.
- Cleanup was automatic: `.naraframe/attempts` was empty and there was no lock.
- All **10** descendants (the headless Chrome for the render) were gone immediately after exit and still gone at 10 s.
- Recovery with `preview --draft --rerender` published `d6ad181a0f96-cb95e786-0b1`, `reusedFromBuildId: null`, in 34.3 s (`02-a1-recovery.json`).

*A2 — SIGKILL* (`03-a2-sigkill.json`). Baseline: the A1 recovery build `…-cb95e786-0b1`. Signal at `Render 10%` (7.4 s); the process exited by SIGKILL with no JSON line and no exit code, as expected.
- The pointer still named `…-cb95e786-0b1`, `preview/builds` was unchanged, and no partial build was published.
- There was no lock. The preview holds the project lock only while syncing source, so none was left and **no stale-lock takeover is claimed**.
- One attempt was left, `.naraframe/attempts/b8cee814-…` (8.7 KB).
- **Finding F-A2: the render browser is orphaned.** All 10 recorded descendants were still alive right after the kill and after 10 s. The root Chrome process was reparented to PID 1 and its 9 helpers stayed under it.
- `work/m3-1a/stop-orphans.mjs` re-verified all 10 identities (pid, start time, command) and stopped only those with SIGTERM; all were gone, none needed SIGKILL (`04-a2-orphans-stopped.json`).
- Then:
  - `cache clean --dry-run` listed the leftover attempt, plus the unselected B0 build as ordinary cache (`05`);
  - `cache clean` removed both and kept the selected build (`06`);
  - `status` returned `previewState: current` (`07`);
  - `preview --draft --rerender` published `…-bef2ec25-d08` with `reusedFromBuildId: null`, attempts empty and no lock (`08`).

*A3 — note edit during render, limited* (`09-a3-edit-during-render.json`).
- A scene-`note`-only `edit` ran at `Render 10%` of a forced preview and succeeded, creating revision `b5c4046e…`.
- The preview finished (exit 0) and recorded the pre-edit revision `6b85450e…`.
- `status` afterwards reported `previewState: stale` against the new revision, with the current revision `b5c4046e…`.
- This is metadata consistency for a note-only edit. It is not evidence about assets, audio or other source changed during a render.

*Automated coverage (original implementer candidate, before the correction above).*
- New `packages/cli/test/e2e/interruption-recovery.test.ts` (SHA-256 `2e2f60ab…c53f891`) automates A1:
  - source-only temp copy and baseline preview;
  - SIGINT to the CLI's own PID at render progress 10–90%, with a 120 s timeout;
  - exit 130 and exactly one `COMMAND_INTERRUPTED` event;
  - pointer and builds unchanged, attempts empty, no lock;
  - no recorded descendant alive within 10 s, checked by identity including orphans;
  - `--rerender` recovery with `reusedFromBuildId: null`.
- Alone it passed 1/1 in 105.6 s (`work/gate-logs/m3-1a/e2e-interruption-1.log`).
- A2 is not automated: asserting on orphan cleanup would be a test that stops browser processes, and F-A2 is an open finding. Its evidence stays manual. A3 also stays manual evidence.
- Bite check: with `controller.abort()` removed from the CLI's SIGINT handler, the test failed after 169.7 s because the render ran on (`e2e-interruption-bite.log`). The code was restored (`cmp`) and rebuilt; no puppeteer Chrome process remained afterwards.

*Checks.*
- `pnpm verify` passed: Biome 159 files, typecheck/build, 271 unit and 280 integration (`work/gate-logs/m3-1a/verify-1.log`).
- The full serial E2E was not run: no runtime or publication change, as approved. It is scheduled for M3.1-C.

*Finding F-A2 (recorded, not fixed; needs a decision).*
- In the recorded SIGKILL trial, the render's 10 recorded Chrome descendants were still alive immediately after CLI exit and at the 10-second check; they were then stopped manually. Indefinite lifetime and behavior after other crashes or OOM were not tested.
- Nothing in NaraFrame reports or removes it: `cache clean` handles files only, and `doctor` does not look for processes.
- The real-process SIGINT trial cleaned up automatically. SIGTERM has handler-level coverage, but was not exercised by this real-process trial.
- This is an operational risk (leaked memory/CPU after crashes), not a data-integrity problem: pointer, builds and revisions stayed consistent.
- Options for a scoped follow-up:
  - (1) `doctor` reports confirmed NaraFrame-owned orphan processes; a Puppeteer profile alone is not sufficient ownership evidence;
  - (2) a documented cleanup step restricted to recorded, re-verified trial/process identities (supervisor's recommended first mitigation; not implemented as a product feature here);
  - (3) launching the browser so that it exits with its parent, if Remotion allows it.
- No fix is made in this batch.

*Acceptance.*
- A1 met, and automated.
- A2 met as specified, since recording and trial-only cleanup were the acceptance, with F-A2 recorded.
- A3 met within its limited claim.
- M3.1's cancellation and atomicity rows now have real-process evidence for the `renderMedia` stage. The other M3.1 rows are unchanged, and the M3.1 checkboxes stay open until M3.1-B/C.
- M3.1-B/C were not started. D-VIS stays OPEN.

#### Active handoff — M3.1-B: technical final export

**2026-10-04: CLOSED / INTEGRATED through M3.P0** via [PR #24](https://github.com/fatlhr/NaraFrame/pull/24), squash `b1875e2`; see the M3.P0 integration record in section 0.

**2026-10-01: TECHNICALLY_READY — checkpoint stop requested by Fatih; not committed or integrated.** M3.1-B technical export and its B1 correction have passing evidence below. Branch `m3-1b-audio-delay` starts from `8463764` (PR #23), carrying this documentation and preserving unrelated AGENTS.md. M3.1-C and D-VIS remain open; no PR, push, merge or new task is performed at this checkpoint.

**History: blocker reproduced.** The initial attempt on `m3-1b-final-export` produced both final MP4s, but synthetic audio edges were 38–43 ms late, beyond the fixed 33.334 ms acceptance. Failed builds and measurements stay intact. Fatih instructed the scoped correction separately. Existing source fixtures remain unchanged.

**Audio correction (M3.1-B1), authorised continuation 2026-10-01.** `work/m3-1b/diagnostic-aac.json` isolates the cause without another video render: the same bundled libfdk_aac encoder produces input intervals [0,400]/[700,1237] ms unchanged when encoded directly into MP4, while AAC/ADTS and that ADTS copied into MP4 both produce [42,443]/[742,1280] ms. Remotion 4.0.521's compressAudio explicitly creates ADTS before its stitcher copies audio. Use PCM as the intermediate and encode AAC once during the final stitcher through its supported ffmpegOverride; preserve H.264/AAC output, default audio quality, cancellation and the one-frame criterion. Raise RENDER_ENGINE for cache invalidation. Prove the corrected public preview/export first with the retained synthetic source, then add a compact portable regression and focused option coverage. Since audio runtime changes, run verify and serial E2E before integration. No fixed timestamp subtraction or source retiming.

**Correction evidence — 2026-10-01 (in progress).** Engine identity is `naraframe-draft/11`. The audio-bearing path uses a lossless PCM intermediate, then libfdk_aac at the final MP4 mux (320k, cutoff 18000, matching the pinned renderer's previous defaults). Remotion requires a `.mkv` temporary filename for PCM; the override explicitly writes MP4 with faststart there, then renames it to the requested output. The private `.audio-render-*` directory is removed in `finally`; silent rendering is unchanged. No extra encoder process outside Remotion's cancellation path, dependency, authored timing adjustment or fixed offset is introduced.

- Retained failing synthetic final: `86e3276ce78b-d078c2bd-68c`, source `ee129ca10633d624061844e51d57c7e4bf34ce47bbcf2604041fcdab8a990448`. `boundary-measurements.json` records [42,443]/[742,1276]/[2275,3263] ms against independent authored [0,400]/[700,1237]/[2237,3224], with deltas +38–43 ms. It is not overwritten or reclassified as passing.
- Corrected public preview: `bee4d3f2f9ac-ea29a1b9-d2b`, fresh, same source. Approved final: `c80f295af3d1-dedb8247-ef6`, H.264 1080×1920, 30 fps, 97 frames / 3.233333 s; AAC 48 kHz stereo / 3.233 s. `boundary-measurements-fixed.json` uses the same 1 ms non-overlapping RMS bins, threshold 0.03 and zero offset correction: [0,400]/[700,1234]/[2233,3220] ms; deltas 0/0, 0/−3, −4/−4 ms. This meets one-frame scheduling tolerance; it does not prove exact sample identity after lossy AAC encoding or speech/caption quality.
- New portable `audio-boundaries.test.ts` generates its own two PCM clips, verifies its independent input detector, and exercises public production validation, full preview and approved final. It checks decoded edges, audible tail, full decode, streams, hashes, approval/source revision, output pointer and attempt cleanup. Initial test run reached the audio assertions but failed a mistaken manifest-map assertion; the manifest is an artifact array. That test assertion was corrected; rerun passed 1/1 in 24.80 s. Runtime was not changed for that harness correction.
- Earlier checkpoint: audio-command unit coverage passed 3/3. Fresh `verify` passed 274 unit / 280 integration, Biome 162 files and build/typecheck (`work/gate-logs/m3-1b/verify-1.log`, exit 0, 12.634 s). Full serial E2E was pending then; its final result is recorded below. No M3.1-C or D-VIS acceptance.
- Read-only review found one container edge: an audio-bearing draft can register no audio at zero gain; the original override then left Matroska at the temporary `.mkv` path. Corrected the override to force MP4 for every stitcher, even without an audio codec, and added the exact no-audio command control. This does not change the public requirement for AAC on audio-bearing drafts. Reviewer inspected the correction and reported no actionable findings; it did not run tests or render (`work/m3-1b/audio-review.md`). Fresh focused coverage passed 6/6 (audio command plus engine/voice identity), and final-runtime `verify-2.log` passed 274/280 in 11.956 s. The `/11` history comment was subsequently added; no behavior changed. Serial E2E remains pending.
- Fresh narrated `/11` preview `fe558fd2fa43-b9c84553-73d` (53.552 s wall time) was approved for technical export only. Final `e20cd950d34b-db83869c-1e6` (53.809 s) retains source `bca225013164bb3bdd68b5b6ca3bae622a853dd0962e4abdb88578b885dd9029`; H.264 1080×1920, 30 fps, 560 frames / 18.666667 s; AAC 48 kHz stereo, 18.645 s. MP4 SHA-256 `d90ea475aa4c1c394cc3d617e5f7505e08d6c3af02782e5b2d88a781adbe7dfb`. `narrated-final-fixed-verification.json` confirms every manifest artifact hash, manifest hash, approval and selected output pointer. Existing narrated fixture's 39-file hash map is unchanged. Whole-speech listening and exact MP3 sample identity are not claimed; the independent PCM boundary fixture isolates scheduling.

- [x] Copy source/assets of the existing general-explainer narrated fixture to `work/m3-1b/narrated`, excluding prior previews, output and revision state. Run public `validate --stage production`, full `preview --json`, inspect its technical artifacts, then `render --approve-preview <that-build-id> --json`. Approval here is restricted to this authorized technical fixture export, not owner visual/publication acceptance.
- [x] Probe the final MP4 for H.264, AAC, 1080×1920, 30 fps, timeline duration and full decode. Check report/manifest hashes, source revision, preview approval and selected output pointer. Preserve the actual MP4.
- [x] Build a small deterministic synthetic-audio fixture at `work/m3-1b/boundaries` using the narration path, with a 1000 ms inter-block pause, a 300 ms internal silent interval and audible terminal samples at a non-frame-aligned clip duration. Label this as synthetic scheduling evidence, not speech quality. Render through the same public preview/approved-export path. Decode audio and measure scheduled edges/last audible tail against independently specified input times, tolerance one frame at 30 fps. Do not compensate away measured offset or expand tolerance to obtain a pass.
- [x] After the manual path works, add focused portable coverage for final export/audio boundaries only if needed to preserve this newly proven path. No existing assertion weakened. Run new focused tests and verify if tracked tests change; full serial E2E remains scheduled for M3.1-C unless runtime/publication changes.
- [x] Record exact commands, build IDs, source hashes, measured offsets, runtime and evidence limits here. A defect is recorded and proposed separately, not silently fixed or bypassed in this evidence batch. Keep F-A2, D-VIS and word-level enforcement open.

**First output — verified 2026-10-01.** Narrated preview `7af2ba753605-9ce3d4d8-512` and final `1da9b758834c-1dba9ed0-946` share source `bca225013164bb3bdd68b5b6ca3bae622a853dd0962e4abdb88578b885dd9029`. Final MP4: `work/m3-1b/narrated/output/builds/1da9b758834c-1dba9ed0-946/final.mp4`, H.264 1080×1920 / 30 fps / 560 frames / 18.666667 s; AAC 48 kHz, stream/container 18.688 s (packet padding recorded separately). The implementer verified full decode and artifact hashes; supervisor independently ran ffprobe and inspected approval/manifest/pointer. Boundary scheduling remains in progress; these stream checks alone do not close it.

**Acceptance commands:** `pnpm naraframe render work/m3-1b/narrated --approve-preview <current-full-preview-id> --json` and the same command for `work/m3-1b/boundaries`. Expected: ready final output with verified streams/hashes and boundary measurements within 33.334 ms, or a precise finding with retained artifacts. No release claim.

**Final checkpoint — 2026-10-01: TECHNICALLY_READY, integration pending.** The final-runtime verify is `verify-2.log` (274 unit / 280 integration, exit 0; SHA-256 `dcb2e89ff56053ca66a15a1d8e7ab16d475fd2d01e81359c2c176effcbfba376`). Full serial `pnpm test:e2e` passed 8 files / 15 tests in 916.54 s (`work/gate-logs/m3-1b/e2e-1.log`, exit 0; SHA-256 `16ff68a21c8001426fcc2d22fa4a6aebaeb0a44c451e3df7aa25e9be623d089e`). It includes the new real preview/final boundary regression, interruption/recovery, existing silent/narrated/soundtrack-only, scoped/reuse, font and reference workflow coverage. This does not close pixel-repeatability investigations or prove cancellation at all stages. No retries-until-green, existing assertion weakening, or second full E2E run. After the gate, the fresh narrated final also decoded completely with FFmpeg (exit 0). Read-only code review has no outstanding actionable findings; execution evidence is owned by this implementation, not attributed to the reviewer.

Commands were run with pinned Node 24.20.0 / pnpm 12.3.4, Chrome 154.0.8037.58 / FFmpeg 7.1.1. The public manual paths were `preview work/m3-1b/boundaries --json`, `render work/m3-1b/boundaries --approve-preview bee4d3f2f9ac-ea29a1b9-d2b --json`, `preview work/m3-1b/narrated --json`, and `render work/m3-1b/narrated --approve-preview fe558fd2fa43-b9c84553-73d --json` via the pinned CLI Node entry. The full E2E gate ran with `caffeinate -dims` on AC, without concurrent renders. One resource snapshot during it showed swap used 1632 MB; this is not continuous monitoring or proof of zero sleep/resource stalls. Active owner time and token/cash cost are unavailable; no generation provider was called.

Resume from review/integration, not a new implementation or render. Final code/test fingerprints:

| File | SHA-256 |
|---|---|
| `packages/core/src/compiler/keys.ts` | `40aa380b732afc23e30d0ca897d9de38994661cbbe531ccf45b4d1aa922f14ba` |
| `packages/renderer-remotion/src/render-draft.ts` | `b69c3d6f8d43ac061c2eb422b32e4455f7bccfee43ce98ff6ea6bb462529cfe3` |
| `packages/renderer-remotion/src/audio-encoding.ts` | `96129b1aa0c528aa6aa4f73e4986478d0be30266daec07d3859777a5d3b37905` |
| `packages/renderer-remotion/test/unit/audio-encoding.test.ts` | `ccfaeb2b98644e0b1abd0ca5f57d77fc7cfd0f8deb8cf87c4f98295a5455ceb1` |
| `packages/cli/test/e2e/audio-boundaries.test.ts` | `9b8e21475fb2bffadecf045b32f506924f1e41a003a1eeafcb6c1577f0030871` |

`AGENTS.md` remains unrelated and byte-identical to the takeover baseline (`cfc4f217…532ef`); it must not be staged. Miss Ayu worktree and the old stash remain untouched. Preserve both failed and corrected artifacts and the evidence-only `m3-1b-final-export` branch. If code/runtime fingerprints remain unchanged on resume, use these recorded gates rather than rerunning the lengthy suite merely for documentation. M3.1-C needs its own execution decision; D-VIS, F-A2 and word-level enforcement remain open.

### M3.2 — Human visual/audio and mixed-route workflow

- [ ] Fatih previews through the skill, changes caption size in JSON, validates/previews via CLI, returns to the skill for export, and exercises undo/error recovery without renderer-code edits (NF-AC-10).
- [ ] Review full videos and contact sheets for safe zones, readable type, caption meaning/timing, voice joins, music balance, illustrated progression, transition continuity, asset consistency, and template repetition.
- [ ] Report sampled layout coverage honestly; an unsampled mid-motion clipping fixture requires motion review, not a false all-frame-safety claim.
- [ ] Record failures with scene/frame/time references, fix only affected dependencies, and rerun the corresponding checks.

### M3.3 — Metrics and handoff

- [ ] Record compile/preflight/scoped-preview/full-preview/final times, active manual steps, failures, attempted generation, reused assets, and estimated/observed/unknown cash/quota usage for each scenario.
- [ ] Record peak resource observations if available. Do not invent performance/cost thresholds or treat local compute as zero total cost.
- [ ] Keep a rework log per finished video: how many manual corrections it needed and what caused each one (layout, motion, caption, asset, cost). Continue M2.4's benchmark/revision measurements; this is an operating habit, not a separate broad competitor study.
- [ ] Reduce the first-run cost to one command. The pinned Node/pnpm/Chrome/FFmpeg setup currently fails for an ambient runtime and needs manual PATH work before `doctor` passes; ship a bootstrap that either fixes or clearly instructs this in a single step.
- [ ] Package each build's review artifacts as one self-contained offline page: the preview, its checked-frame markers, the visual QA report, and the cost report in a file that opens without a server or install. Review is the step repeated most often, so it should cost one double-click.
- [ ] Update README operating guidance and the evidence/status sections in these existing docs. Keep runtime decisions and measured formats here; do not create redundant plan/review documents.
- [ ] Account for NF-AC-01 through NF-AC-17 with evidence. Any unmet High finding requires a corrected implementation/design or explicit scoped deferral; accepted wording alone is not closure.

**Exit gate:** All applicable acceptance criteria have passing evidence and Fatih has reviewed the outputs. Known limits/deferred items are explicit. MVP completion cannot be declared from static checks alone.

## 9. Requirement and finding traceability

**Current additions:** NF-TL-06/NF-AC-18 → M3.P1a/P1b; NF-AU-01/NF-AC-19 → M3.P2a/P2b; NF-PF-06/NF-AC-20 → M3.P3/P4; release/repeatability/metrics → M3.P5. The older traceability rows below retain delivery history; any “required before M3” reference describes the original deferred gate, not section 0 sequencing.

| Requirement area | Delivery / proof |
|---|---|
| NF-PR-01–08 principles | M0.2–M0.8 boundaries, M0.9 layout safety; M1–M3 preserve them |
| NF-UX-01/02 and NF-AC-10 | M0.6 CLI, M0.8 skill/manual loop; M3.2 full mixed-route dogfooding |
| NF-FL-01/02/04 | M0.3 project creation and M0.8 draft loop; M2.1 scoped production preview |
| NF-FL-03/05 and NF-CAP-01 | M1.1/2/3 verified narration and approved final |
| NF-CO-01 and NF-AC-11 | M1.1 ledger/capability tests; M3.3 measured costs |
| NF-PJ-01/02 | M0.2 schemas, M0.3 source revision, M0.6 readiness; M1.3 durable revisions |
| NF-PF-01/02/03/05 | M0.2 profile schema, M0.3 portable lock, M0.8 real profile, M0.9 typography/appearance tokens; M2.2 extended checks |
| NF-PF-04 and NF-AC-08 | M2.2 transactional profile apply |
| Scene/layer/action/transition model | M0.2 contracts, M0.4 compiler, M0.5 renderer, M0.9 appearance/layout/camera correction, M0.10 transition primitives and variety checks; M2.2 evidence-driven recipe growth |
| NF-TL-01–05 and NF-REV-01 | M1.2 block compiler; M2.1 local scoped offsets |
| NF-CAPTION-01 and audio | M1.2 captions/voice; M2.2 music/SFX |
| NF-AS-01–03 | M0.2 schema, M0.3 path/hash safety, M0.5 offline renderer; M1.1/2 provenance; M2.2 formats |
| NF-CP-01–03 | M0.4 deterministic compiler and M0.5 selected pixels; M1.3 key separation; M3.1 repeat proof |
| NF-CA-01–03 | M0.7 complete-build publication; M1.3 additional keys; M2.1 cache clean |
| NF-REV-02 and NF-AC-14 | M1.3 source transactions; M2.2 apply/undo |
| NF-CL-01–04 and NF-AC-09 | M0.6 command contract; M1/M2 new commands; M3.1 acceptance |
| NF-PV-01 and NF-AC-13 | M0.4 draft scope, M0.5 render, M0.7 artifacts; M2.1 production scope; M3.2 sampled QA |
| NF-QA-01–05 | M0.5 renderer, M0.7 review artifacts, M0.8 runtime review, M0.9 visual preflight/parity, M0.10 variety/contrast checks and published QA report; M1.3 final; M3.1/2 full checks |
| NF-AC-01/02 | M1.3 offline final and actual narrated path; M3.1 repeat |
| NF-AC-03 | M2.3 two source projects + derived variant |
| NF-AC-04/05/06/07 | M1.2/3 edits/failures; M3.1/2 determinism and visual QA |
| NF-AC-12 | M1.2 partial voice and continuity evidence |
| NF-AC-15 | M0.9 LBC visual-fidelity parity gate; M0.10 slide-ceiling gate |
| NF-PR-09/10, NF-UX-03, NF-AC-16/17 | M2.4.1 reference-fidelity recovery; M2.4.2 early frozen-engine transfer; M2.4.4 full Medan and M2.4.5 full LBC/revisions; required before M3 |
| NF-CO-02 | Separate development/authoring/render/owner effort and available actual usage in each M2.4 handoff; matched comparisons only, unknown is not zero |
| M2.4 scene/vector/camera/motion and cache contract | M2.4.1 minimal coherent shot and SVG/font recovery; M2.4.3/4 story extension; M2.4.2/5 frozen-engine generalisation/revision gates |
| NF-CO-01 cost visibility (extended) | M1.1 per-build cost report; M1.3 measured reuse ratio |
| Editorial sourcing policy | M1.2 checkable claim provenance (`SOURCE_MISSING`) |

| Finding | Adopted change | Delivery gate |
|---|---|---|
| AR-01 | Withdrawn; preserve technical-user target | No novice gate |
| AR-02 | Budget, receipts, retries, license/usage visibility | M1.1/M3.3 |
| AR-03 | Real voice/timing route and labelled fallback | M0.5/M0.8 fallback; M1.1 voice route |
| AR-04 | Story blocks and local regeneration | M1.2 |
| AR-05 | Scoped/draft readiness | M0.4–M0.7 draft; M2.1 production scope |
| AR-06 | Source snapshots and undo | M1.3 |
| AR-07 | Early complete skill/CLI/core slice | M0.1–M0.8 |
| AR-08 | Executable phase plan before work | Sections 4–5; implementation code stays in work stage |
| AR-09 | Separate source/generation/scene/assembly/approval keys | M1.3/M2.1 |
| AR-10 | Normal gap ownership and inclusive API adapter | M1.2 |
| AR-11 | Reversible needs-production profile apply/overrides | M2.2 |
| AR-12 | Caption display corrections without unwanted retakes | M1.2 |
| AR-13 | External-egress rule, atomic build set, sampled QA limits | M0.5/M0.7/M0.8; M3.2 |
| AR-14 | Separate accepted design from verified evidence | Every gate; refine-spec status register |
| VF-01/02 | Declarative appearance plus exact renderer primitives | M0.9.2/M0.9.4 |
| VF-03 | Loaded-font measurement, collision checks, and stable issues | M0.9.5 |
| VF-04/05 | Bounded layout plus profile typography/appearance tokens | M0.9.2/M0.9.3/M0.9.5 |
| VF-06 | Semantic scene/group camera continuity | M0.9.6 |
| VF-07 | Visual foundation moved ahead of narration | M0.9 exit gate before M1.1 |
| VS-01/02 | Restore visual competition; art direction plus passive vector/rich text | M2.4.1 |
| VS-03/04 | Minimum coherent opening world/camera brought forward, then reusable river/route/data storytelling | M2.4.1/3/4 |
| VS-05 | Plain-language revision with measured dependency/profile effects | M2.4.2 early and M2.4.5 full |
| VS-06/07 | Honest playback/first-draft evidence, early transfer and consistent rejected status | M2.4.1/2/4/5; documentation status correction |
| VS-08/09 | Reference-first adaptation and SVG safety/fidelity recovery | M2.4.1 |
| VS-10/11 | Early bounded visual checkpoint, compact skill context and separated factual effort/usage | M2.4.1–5; NF-CO-02 |

## 10. Revision acceptance matrix

| Edit | External generation | Retained work / required checks |
|---|---|---|
| Caption size/color | None | Voice/images and unrelated scene keys retained; preview affected scene |
| Caption spelling | None if audio already correct | Attributed display correction; intended speech remains distinct |
| Identity palette | None | Revalidate affected layouts/render tokens; final may re-encode |
| Replace scene image | Only if a new asset must be generated and authorized | Preserve other assets; verify dependencies/provenance |
| Shorten one paragraph | Owning block first; neighbor only for explained continuity need | Reuse other clips/local timings; shift global offsets |
| Reorder story blocks | Not automatic | Move blocks/scenes together; review narrative/music boundaries |
| Hold diagram 1000 ms | None | Explicit pause; shift downstream offsets without voice regeneration |
| Apply profile | Only incompatible production dependencies | Show editorial/override conflicts, needs-production state, reversible apply |
| Slow camera or move an illustrated object | None | Recompile motion and dependent scene/transition keys; retain audio; preview affected scope |
| Edit a shared world/vector definition | None unless replacement art requires authorised generation | Invalidate all referencing scenes, preserve non-consumers; compare scoped/full poses and undo |

Every edit uses the same source transaction and preserves spend/receipts across undo. Test failed partial runs, not only successful examples.

## 11. Runtime decisions and evidence register

Rows retain evidence from their named implementation dates. Current M1 and M2.1–M2.3 closure is recorded in sections 6–7; older rows saying a later feature was pending describe that earlier checkpoint. The pixel-repeatability caveat is still open. M2.4.1 has a rejected first-attempt artifact and prior supervisor findings recorded below; this documentation update runs no new product render or test.

| Decision / measurement | Current status | Required before |
|---|---|---|
| M2.4.1 first attempt and owner rejection | Unmerged `9747193`; 6.4s build `5d3b28594596-96b47423-ac5` rejected by Fatih. Historical tests are implementer-reported, not re-run here. Recovery fixes and visual parity are unverified. | M2.4.1 recovery and owner acceptance |
| M2.4.1 SVG/font review | Prior source/frame/probe review found root-paint/text loss, accepted wrapped external paint URL and missing proof of font readiness in actual frame contexts. See refine-spec section 12. | Actual fixed-path and regression evidence |
| Medan reference playback and effort comparison | Source/hashes and reported audio probe retained; reference playback/phrase listening still incomplete. Exact competitor prompt/effort and owner-reported token usage unavailable. | Matched visual baseline and any comparative claims |
| Node/pnpm/TypeScript/React/Remotion/Zod/Vitest/Biome | M0.1 verified on 2026-09-08: 24.20.0 / 12.3.4 / 7.0.2 / 19.2.8 / 4.0.521 / 4.5.4 / 5.0.0 / 2.5.12. Install, frozen install, package graph, tests, typecheck, and build passed. M0.2 additionally proved the basic Remotion bundle/select/render path with the pinned stack. | M0.8 broader hardening |
| Lockfile | `pnpm-lock.yaml` SHA-256 `047e2a98a570ad9a171b4fdba9d8bf297dedfc357986e9ec8b1de49dd3694b82` | Recheck after dependency changes |
| Browser and FFmpeg exact paths/versions | Rechecked at M0 exit in the retained M0.8 report: Node `24.20.0`, Darwin `24.6.0` arm64, Remotion `4.0.521`, Google Chrome `152.0.7977.83` at `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`, and FFmpeg/FFprobe `7.1.1` at `/opt/homebrew/bin`. | Recheck after runtime changes |
| M0.2 runnable draft | `pnpm naraframe validate samples/krakatau-draft` compiled 450 frames. `pnpm naraframe preview samples/krakatau-draft --draft` produced `samples/krakatau-draft/preview/dev-preview.mp4`; FFprobe reported H.264, 540 × 960, 30 fps, 15.000000 s. Three sampled scenes and the visible `DRAFT • NO AUDIO` label were inspected through `preview/m0-2-contact-sheet.png`. Unit 3/3, focused integration 4/4, and full 15-second render smoke 1/1 passed after the manual render. | M0.2 complete; rerun at M0 exit |
| M0.3 project creation/profile lock | `pnpm naraframe create work/m0-3-created-project --profile current-issues` created the four source files plus preview/attempt directories atomically. A scene added directly to JSON validated at 450 frames and rendered to `work/m0-3-created-project/preview/dev-preview.mp4`; FFprobe reported H.264, 540 × 960, 30 fps, 15.000000 s, and `preview/m0-3-contact-sheet.png` was inspected. Focused integration coverage proves repository-profile CLI creation, existing-destination refusal, copied/content-addressed profile assets after deleting the source profile, path/symlink rejection, ready-PNG/profile hash checks, and repeatable source revision. | M0.3 complete; rerun at M0 exit |
| M0.4 visual and motion capability | `pnpm naraframe validate samples/krakatau-draft` compiled a 540-frame project. Full preview `work/m0-4-reference/full-preview.mp4` is H.264/yuvj420p, 540 × 960, 30 fps, 18.000000 seconds, SHA-256 `d5a06bdd257e3eccc0ba4fe8bc5306ae1d7eaf9d6c6dc27011b0bab2e34c274b`; `preview --draft --scene context` compiled a local 180-frame timeline while retaining source frames 120–300. The inspected `work/m0-4-reference/m0-4-contact-sheet.png` and motion sheet prove ready local PNG, rectangle/circle, group transform, text/media/composition, reveal/emphasize/focus, and the labelled planned-media placeholder. Unit 7/7, integration 18/18, and full render E2E 1/1 passed. | M0.4 complete; rerun at M0 exit |
| M0.5 atomic immutable preview | Pinned Node `24.20.0` published sample build `41b6900277c8-4cabf063-58d`; manifest SHA-256 `0281993bab6d6ca463ec4281924ed4e40b080c06d7698a4de1dd5654d6045c39`. Its MP4 is H.264, 540 × 960, 30 fps, 18 seconds, no audio, and passed strict full decode. The 540 × 1228 contact sheet covers all 11 required representative/semantic frames and has SHA-256 `0cd7a812e17a1c5eac985294b1cd57aa0b9c0b797bf22401d9685aef474e5b85`. Pre-pointer failure injection preserved the prior pointer. Integrity checks rejected audio-bearing and decode-corrupt MP4s, mixed metadata, invalid PNG, missing semantic coverage, output symlinks, and empty build collisions. A source-only first run created its missing generated roots and published build `41b6900277c8-9bc1c63d-b17`. Focused tests passed 7/7; final controller `pnpm verify` passed with unit 7/7 and integration 25/25. | M0.5 complete; rerun at M0 exit |
| M0.6 operator CLI and skill | Pinned Node `24.20.0`/pnpm `12.3.4` passed the public CLI route. Review-fix manual evidence: human `create work/m0-6-review-created-human --profile current-issues` and JSON `create work/m0-6-review-created-json --profile current-issues --json` succeeded; a real human full draft preview published current build `41b6900277c8-a2b28188-998`, and JSON `preview --draft --scene hook --json` published `93da18cf5a91-fad10874-1fd` with the returned pointer, MP4, contact sheet, frames, report, and manifest paths. Both report source revision `09b2333daa03081bc485868915d413d09556a22e81fa95a93c84cb48c8e7f531`; project/scoped fingerprints are `41b6900277c8ed8533002fbaadecf8cd9b39a9cae4d758d344d6389f6ec63d7d` and `93da18cf5a91a64feff9909d5b4f62984391d534cdfbb3cc654118d9e0edf7f2`. Review regressions prove cancellation after pointer preparation preserves the prior pointer and cleans its temporary file; public status rejects corrupt pointer hashes, unsafe symlinks, tampered artifacts, and inconsistent manifest/report/frames metadata, while accepting valid scene scope; SIGTERM normalizes to 130. Focused CLI checks passed 3 unit/17 integration tests; final `pnpm verify` passed unit 9/9 and integration 31/31. Skill unchanged. | M0.6 complete; rerun at M0 exit |
| M0.7 owner trial | Complete on 2026-09-14. Baseline build `41b6900277c8-5a908e88-4e1`, direct owner copy edit, stale detection, rerender `0654538e7ce0-2b154c13-273`, and invalid `bounce` recovery passed. Owner rejected the baseline motion as too subtle. Generic bounded easing and stronger smooth focus travel plus `current-issues` 0.2 context guidance now support context-driven choreography; Krakatau-specific staging remains sample data. Fatih accepted revised current build `96b57423d8ff-16e8cc76-28a`, which uses revision `f256ab60b4ff34fff5e260c20a51a7b02466d180927eb3a575d6d4357581993d`, renders H.264 540 × 960 at 30 fps for 18 seconds with no audio, and has a 14-frame contact sheet. CLI/report/wall timing was 37.019/37.019/51.88 seconds. Focused unit/integration passed 7/7 each; full `pnpm verify` passed unit 13/13 and integration 39/39. Owner active time was not timed and is recorded as unavailable; start timing before the next trial. | M0.7 complete |
| M0.8 cross-feature owner flow | On 2026-09-14, the E2E copied the sample, shortened it to 450 frames/15 seconds, validated, rendered, inspected all five build files, detected a one-line edit as stale, rerendered, rejected `bounce` at `/scenes/0/beats/0/action`, and recovered after restoring `reveal`. Sandboxed builds `db7809686cd3-02a70a72-5ef` and `db7809686cd3-982301b0-1c0` share source revision `9558ace64d515f54b555304c507578cbbe9cedbdfae7984ddd07c3013b038af2`; revised build `80ade327b801-2b226e0e-f84` uses `9c01f5438dc0faa52127b7de6d967a2b661cb23679ae2c3e9f9e7d7ac19b216e`. FFprobe reports H.264, 540 × 960, 30 fps, 15 seconds, no audio; full decode passed. First manifest SHA-256 is `dc4dfabd795cf15e776beb2aa2f9e269f1e4f8790b193e6402b5462664707069`; MP4/contact-sheet/frames/report hashes are `55128ab2f766f978d9ed299ec1f3b732a0b4bc21217fcf6fc1cda841bf57e597`, `25cff7f026fc6aa1854ade712848b0eb28e3da40d1727040edd871e5441d3dc2`, `750bdd3b54325ad5823e09b1b83c4cad75bcf2c36bf41a9a3da1b09065cd2e38`, and `ee4f9c81b2c97be13c2187c795e71511cc7354614f9c301ba2a8e52f1f3e6d7f`. Local evidence is under `work/m0-8-exit-Wn5gv8/`. Final gates: frozen install reused 279 packages with zero downloads, `pnpm verify` passed unit 16/16 plus integration 41/41, the evidence-producing serial E2E passed 2/2 in 177.27 seconds, and the post-review cleanup-verification E2E passed 2/2 in 180.37 seconds. | M0.8 complete |
| LBC visual-fidelity benchmark | The original failing engine artifact is retained unchanged. A post-M0.9.5 review found `visual-preflight.ts` checked members of a transformed/animated group at their untransformed local position instead of where `GroupView` actually renders them — a real collision-detection gap, confirmed with a manual before/after probe (pre-fix: a group-shifted collision published with zero issues; post-fix: the same layout correctly exited 1 with `TEXT_COLLISION`) and closed with a shared `groupScreenTransformFor` helper plus two new regression tests in `packages/renderer-remotion/test/unit/visual-preflight.test.ts`. The LBC engine's own two groups (`progress-copy-stack`, `cta-copy-stack`) use identity transforms with no beats, so this defect did not change their prior pixels, but the build was rerendered against the corrected code rather than carried forward unverified: build `16abeb583bc2-086fdfc0-b9f` (same source revision `fe3b2b74936a5bab2ed855ce21ce3ddb94a86dbb03b9e70b64a56f95be62998f` and assembly key `16abeb583bc299b7215e3a96a3c7f034bc7c3dddc96f611f12a8c203b4db0209` as before) published a 30-second 540 × 960, 30 fps, silent H.264 preview with zero visual-preflight issues. `work/lbc-benchmark/output/lbc-naraframe-engine-m0-9-7.mp4` has SHA-256 `4ea68e17e88e7c910ec48126bde03fcfc99686b04295bde17f04de5d1620e741`; its 93-state contact sheet `naraframe-contact-sheet-m0-9-7.png` is `4707636701ff4c1847d4d73542142323231bafd410d31a6db34eb4dbde15ef6a` (the prior register entry's contact-sheet hash, `a5bac85f...`, did not match any file on disk and is superseded by this measured value); the four-moment `comparison-m0-9-7.png` (seconds 8/15/21/27, direct Remotion on top and the corrected NaraFrame engine below) is `60355315ad683607801e12bab038bd40c80efba1690354d58fde34e65be81057`. A dedicated overlap probe (`work/lbc-benchmark/overlap-probe/`, a copy of the engine with `hook-label` deliberately placed on `hook-title`'s frame — the earlier claimed title/copy overlap sits inside a bounded stack-layout group and instead correctly raises `GROUP_LAYOUT_OVERFLOW` before it can collide) exited 1 in 2.65 seconds with structured `TEXT_COLLISION`; both the raw CLI output and the parsed JSON report are retained at `work/lbc-benchmark/output/overlap-probe-cli-output.json` and `overlap-probe-report.json`. `pnpm verify` passed lint/format clean, typecheck clean, unit 25/25, integration 41/41, and build clean; `pnpm test:e2e` passed 2/2 in 179.12 seconds. Direct Remotion remains the art-direction reference, not a pixel-identity requirement. | M0.9.2–M0.9.7 verified and accepted by Fatih on 2026-09-14; M0 complete, M1.1 unpaused |
| Font/PNG/native-layer baseline | M0.4 proved system-font text, ready local PNG decode, rectangle/circle layout, non-recursive grouping, and planned-PNG placeholder rendering. Bundled local-font behavior remains unproven and is not enabled in M0. | M0 complete for the enabled system-font path; test before bundled-font enablement |
| External-egress and explicit-browser behavior | M0.8 passes. `doctor --json` reports configured missing browser/FFmpeg/FFprobe paths with exit 2, stable issue codes, and no download/render. The macOS sandbox probe allowed `127.0.0.1` loopback and returned `EPERM` for non-loopback outbound IP; unrelated socket errors fail the test. The same profile rendered both deterministic 15-second previews successfully. An initial profile that also denied inbound networking blocked Chrome's local `SingletonSocket`; removing that overbroad inbound rule fixed the acceptance environment without changing source or renderer code. | Repeat when runtime/browser changes |
| Deterministic compiled/selected frame hashes | M0.4 early signal passed on the pinned machine. M0.8 additionally proved object-key-order-independent source/assembly hashes and repeated full renders in the same sandboxed reference environment. Lossless frames 18/180/405 matched with SHA-256 `0e2c5c78660a182bb5816256c1f48848676e64cee54190c46b9e52ce5690f2d5`, `42307d79cfaae3ea28002163c7498c1e5aa6b02ad5bee8c654d244463e0ac2d1`, and `eaf4b5086e9c9c42c8705d67259c397168c4abce260383f698f5bd539b5ffde0`. A sandboxed-versus-unsandboxed comparison produced a different transformed-image frame and was rejected because it did not hold the reference environment constant. Encoded MP4 bytes are intentionally not the determinism contract. Sampled frames do not prove that every frame is aesthetically safe. 2026-09-20 finding on the e2e caveat: this is a pre-existing renderer non-determinism, not an encoder or M1.3 effect. Two renders of the unchanged `samples/krakatau-draft` at commit a11b3a7 (before any M1.3 change) differed in 289 of 540 decoded frames (first difference at frame 131); a later pair at the working tree differed in 156 of 540 (from frame 264) with PSNR about 81 dB on a static frame, i.e. tiny pixel noise. Re-encoding one MP4 three times with libx264 gave byte-identical files, so the encoder is deterministic. `owner-flow` compares decoded MP4 frames at fixed indexes, so it passes or fails depending on whether those frames happen to match; four of its last seven runs failed. The NF-CP-03 promise (same fingerprint gives the same selected frame pixels) is therefore not currently met on this machine. Root cause is open (suspects: box-shadow or rotated-image rasterization). Treat a single e2e pass or fail as weak evidence, and do not run two e2e runs at once. | Repeat at M3 and after runtime/render changes |
| Additional SVG/video/audio/font formats | Not enabled until respective tests pass | Feature enablement M1/M2 |
| Encode settings and final audio sample coverage | Not run | M1 narrated export |
| Indonesian TTS/phrase-timing recipe and price/usage evidence | Fake-provider recipe proven (see M1.1 ledger row): deterministic phrase split/timing and content-addressed audio hash for real Indonesian sample text, run through the production ledger end to end. A real vendor's price/usage evidence is still not available — this is an offline stand-in, not a paid pilot. | M1 narrated pilot |
| Block prosody and partial voice replacement | Run 2026-09-19 with owner-generated Google AI Studio (Kore) clips on the local `samples/krakatau-narrated` project (kept out of git: samples with audio are too large). Original build `13462091895a-bfff66b9-fea`: 1134 frames, 37.845 s, H.264 + AAC, not muted, zero visual-preflight issues. Revised build `bc3678494c5e-ab7d0b3c-6a4` (mechanism block replaced): 1163 frames, 38.827 s, same checks; opening and impact audio hashes unchanged, impact offset +960 ms. Fatih listened to the joins and accepted the audio. On 2026-09-19 the owner also watched build `3c647d57ab06-63938115-c12` with rendered captions and confirmed each caption matches the spoken words (the sample's narration text had first been corrected to the text actually generated; a hand-written mismatch had slipped in, which is what the text binding now prevents). The burned-in draft label was corrected the same day: narrated builds read `DRAFT • WITH AUDIO` (owner-chosen wording), silent ones stay `DRAFT • NO AUDIO`, and build validation rejects a label that disagrees with the report's audio (`324e9278abda-cbb7eb1b-22a`: label WITH AUDIO, AAC, not muted). Owner note: the preview image is not yet at the desired quality; recorded as an open visual issue, not audio. The M1 exit gate still needs the spoken-revision pass on a narrated final export (M1.3). | M1 exit |
| Budget/unknown-result/retry tests | M1.1 ledger primitives (`packages/core/src/schema/production.ts`, `packages/core/src/production/ledger.ts`) implemented: append-only versioned receipts per `operationId`, `requestReservation`/`settleReceipt`/`settleUnknown`/`retryReceipt`/`escalateReceipt`. Manual probe proved the exact spec scenario: budget 100/spent 40/reserved 40, a next=30 reservation is denied (`BUDGET_EXCEEDED`); a timed-out request moves to `unknown` and keeps its 40 held against budget rather than releasing it; `retryReceipt` on that `unknown` receipt is refused (`RECEIPT_NOT_RETRYABLE`, "must not be blindly resent") — resolution requires `settleUnknown` once the actual cost is confirmed; a failed operation's first retry (attempt 2) succeeds, a third attempt is refused (`ATTEMPT_LIMIT_REACHED`), and `escalateReceipt` is the only path forward; every historical receipt version (5 for that operation) remains in the append-only array after escalation, proving no version is erased. Since then, a `TtsProvider` port (`packages/core/src/production/tts-provider.ts`) plus a deterministic offline `createFakeTtsProvider` (`fake-tts-provider.ts`) and a sequential `synthesizeNarration` orchestration (`synthesize-narration.ts`) landed, along with pure route resolution (`route.ts`: prepared-media/silent-draft/narrated). Manual probe fed real Indonesian text through the full reserve→call→settle cycle: 3 phrases split on `.`/`,`, each starting exactly where the previous one ended, a deterministic content-addressed `audioSha256` (same input reproduces the same hash/cost, a different `voiceId` changes the hash), and a `succeeded` receipt (`version 2`: v1 reserved, v2 settled) recording the actual IDR cost. No provider SDK or key was added to core. Rights/subscription assumptions are now recorded (Remotion's free/company tier, local-only browser/FFmpeg, the M0.10 font placeholder, no TTS/image vendor yet, and no subscription-covers-it-for-free assumption) — this is already enforced in code, not just written down, since `ReceiptAuthorizationSchema` makes `authorization` a required field, so `requestReservation` cannot construct a receipt without one. `computeCostReport` (`packages/core/src/production/cost-report.ts`) also landed: it derives `{budget, estimated, actual, unknown, reserved, available, receipts}` straight from a ledger's own receipts. Manual probe proved `unknown` stays visibly separate rather than folding into `actual` (settled 35/100 spent, 20 held as unknown, `estimated` sums both receipts' original estimates at 60, `available` correctly nets all three off the budget). The deferred automated test pass then landed: `packages/core/test/unit/ledger.test.ts`, `fake-tts-provider.test.ts`, `route.test.ts`, `synthesize-narration.test.ts`, and `cost-report.test.ts` cover every manually-proved scenario above (budget denial, timed-out→unknown holding its reservation, refused blind retry, two-attempt escalation, append-only version retention, deterministic/voice-sensitive audio hashing, contiguous phrase timing, a real provider failure settling to `failed` without losing the reservation, and both the populated and all-zero cost-report shapes) plus edge cases (`CURRENCY_MISMATCH`, `OPERATION_ALREADY_EXISTS`, `RECEIPT_NOT_PENDING`, `OPERATION_NOT_FOUND`, `RECEIPT_NOT_UNKNOWN`, `ESCALATION_NOT_APPLICABLE`). `pnpm verify` passed clean: lint/format, typecheck, unit 101/101 (up from 74), integration 52/52, and build. Still open: wiring the skill/CLI to actually call `resolveProductionRoute` and `synthesizeNarration`, and publishing `computeCostReport`'s output alongside a real build (deferred until a narrated build exists to spend against — today's draft previews are silently free by design, so attaching a permanently-zero cost report to them would be decorative, not evidence). | M1.1 in progress |
| Source/build crash recovery and profile rollback | Not run | M1/M2 feature gates |
| Owner workflow, render latency, cost/reuse | Not measured | M3 exit |
| Visual variety checks and bounded transitions | M0.10.1/2/4 implemented, tested (74 unit + 52 integration passing), and migrated onto both reference projects: `samples/krakatau-draft` and `work/lbc-benchmark/engine` each now use `push-through`/`mask-reveal`(/`match-cut` for LBC) instead of `cut` only; `SINGLE_TRANSITION_TYPE` is clear on both. Menu enforcement (`ENTRY_STYLE_NOT_PERMITTED`/`TRANSITION_NOT_PERMITTED`/`FOCUS_STYLE_NOT_PERMITTED`) verified on a probe with a restrictive `render.variety.menu`; unrestricted samples unaffected. | M0.10 complete |
| Bundled profile font enablement | M0.10.3 implemented and tested. LBC engine's rebuilt `4c4228974b3c-33688229-032` bundles a real macOS system TTF (Trebuchet Bold) as `displayFontFamily`, rendering `hook-title` in a face distinct from body text with zero font issues. This remains an explicit technical placeholder — no real bundled face or licence has been chosen for a product profile. | Product profile font choice, whenever needed |
| Published visual QA report and contrast checks | M0.10.5 implemented and tested. `report.json` carries `varietyMetrics` and `readability` computed from the published `CompiledDraft`; LBC's rebuilt `4c4228974b3c-33688229-032` shows all four transition types used, 11 distinct font sizes, and zero failing contrast samples. `CONTRAST_INSUFFICIENT` fires at `validate` time (pure color math, no render). Only the flat profile background is checked, not real compositing behind a layer. | M0.10 complete |
| M0.10 owner visual acceptance | Fatih reviewed the rerendered LBC build (`4c4228974b3c-33688229-032`, full MP4 and boundary-frame/display-font proof stills) and accepted it on 2026-09-15. M0.10 exit gate passed; M1.1 unpaused. | M0.10 complete |
| Intended publishing cadence and paid-generation appetite | Open question, owner decision. The M1 ledger, receipt, and partial-regeneration machinery is proportionate to regular publishing with real TTS/image spend, and disproportionate to occasional one-off videos. Decide before M1.1 grows further; revisit M1 sizing if the answer is occasional. | M1.1 start |
| Owner review of the Kore pilot previews | 2026-09-20: Fatih reviewed previews A (original, build `c2419d3e2825-4de9a0e7-f36`) and B (mechanism voice revised, build `54c312e59358-476d1dd5-8ec`) from `work/kore-pilot`. Narration, caption text and timing are fine. Visuals are "far from enough" and are not a M1 concern. This is the named failing project and the evidence M2.2 requires before adding recipes: a real illustrated visual language for scene 3 (still a stand-in flat colour) and richer scene composition. Revision B reuse: voice 2 of 3, scenes 3 of 4, overall 78 percent (a stand-in image counts as unchanged); cost untracked because the clips were made by hand outside the ledger. | M2.2 entry evidence |
| Rework causes per finished video | Not tracked. Intended as a lightweight operating log, not a study. | M3.3 and ongoing |

No table row is passed by updating documents. Store actual build artifact paths/hashes, commands, dates, and observed outcomes when execution happens. Test findings and unresolved design changes remain visible in `docs/refine-spec.md`.

## 12. Post-MVP observation

After acceptance, produce at least 10 real videos before choosing GUI/provider/MCP expansion. Continue the rework log from M3.3 — unsupported visuals, manual corrections, profile changes, voice-sync work, failures, latency, and actual/estimated/unknown cost — and let the recurring causes set the next scope. A capability nobody's rework log asked for does not get built. The first GUI remains a later constrained authoring surface over the same contracts, not an MVP dependency.
