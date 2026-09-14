---
name: naraframe
description: Use when creating, validating, previewing, resuming, or revising a NaraFrame motion explainer project.
---

# NaraFrame

Operate NaraFrame through its public CLI and authoritative project files. Keep the pinned profile in control of creative decisions and treat structured command results as the authority for readiness, repair, and resume decisions.

## Workflow

Run commands from the NaraFrame repository root with `pnpm naraframe`. Before the first command, activate the Node and pnpm versions pinned in `.node-version` and `packageManager`; do not let an ambient runtime rewrite dependencies. If the pinned runtime is unavailable, report that system blocker instead of treating a failed package-manager preflight as a NaraFrame result.

1. Run `pnpm naraframe doctor --json`. Resolve every structured system issue before previewing; `doctor` performs no download or render.
2. Run `pnpm naraframe schema --json` and use the returned schemas when creating or repairing source. Do not reproduce schema definitions in this skill.
3. Establish the project and profile before creative edits:
   - New project: run `pnpm naraframe create <project> --profile <id-or-path> --json`, then read the created `profile.lock.json`, including its pinned direction text.
   - Existing project: run `pnpm naraframe status <project> --json`, then read that project's `profile.lock.json` before revising it.
4. Before editing scenes, turn the pinned profile direction into a short shot rundown: one dominant statement per shot, the intended `display`/`heading`/`body`/`label` roles, the main media crop/focal point, and the semantic reveal/emphasis/focus beats. Keep these decisions in the profile or authoritative scene source, never in renderer code.
5. Edit only authoritative source such as `naraframe.json`, `scenes.json`, and `assets/manifest.json`, following the returned schema and pinned profile direction. Prefer bounded `stack`/`grid` groups for repeated content, declare text limits and avoidance targets, and declare image crop, focal point, radius, stroke, and shadow when profile defaults are insufficient. Never edit generated preview files.
6. Run `pnpm naraframe validate <project> --stage plan --json`. Use each issue's `code`, `responsible`, `artifact`, `path`, `message`, and `suggestion` to decide who should repair what; validate again after repairs.
7. Run `pnpm naraframe preview <project> --draft --json`, optionally adding `--scene <scene-id>`. Treat any visual-preflight issue as a source/profile repair, not a renderer override.
8. Inspect the video and contact sheet at the exact paths in the successful result's `artifacts`. Review scene entry, settled, beat peak, transition/final states, and any requested editorial timestamps; check masks during motion, hierarchy, overflow, collisions, and whether the sequence reads as composed shots rather than slides. Metadata alone is not visual acceptance.
9. Run `pnpm naraframe status <project> --json` to resume or verify. Continue only from its authoritative current build and reported artifacts. A stale preview must be rebuilt and inspected.
10. For revisions, reread the pinned profile, edit authoritative source, then repeat validation, preview inspection, and status verification. Shorten/reflow copy or change layout bounds before reducing text below the profile minimum.

## Boundaries

- Treat one newline-terminated `CommandResultEvent` on stdout as the machine result; diagnostics and progress on stderr are not the result.
- Stop on `success: false`. Repair agent-responsible source issues, ask the user for user-responsible choices, and surface system-responsible dependency issues.
- Never import private package modules, write `.naraframe/compiled.json`, write preview metadata, or invent identifiers absent from the result.
- M0 output is a labelled, muted, `draft-only` preview. Do not claim narrated, production, final, or publish-ready status.
- Call only `doctor`, `schema`, `create`, `validate --stage plan`, `status`, and `preview --draft`; do not advertise or guess future commands.
