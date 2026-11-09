# NaraFrame Project Instructions

## Source of truth

- Read `docs/spec.md`, `docs/refine-spec.md`, and `docs/plan.md` before changing product behavior or milestone scope.
- Execute numbered tasks in `docs/plan.md` in order. Update its checklist and evidence only after the stated manual or automated checks pass.
- Keep implementation details inside the existing project documents. Do not create parallel plans unless the user asks for one.

## Hard gate: finish earlier milestones first

- Fatih's explicit instruction on 2026-11-05: never start or continue a later milestone while any task, finding, acceptance criterion, required review, or closure evidence belonging to an earlier milestone remains unresolved.
- Before work begins, audit the milestone closure register in `docs/plan.md` against the current spec, findings and recorded evidence. Start with the earliest unresolved milestone and follow its numbered task order.
- `INTEGRATED`, `CLOSED technically`, passing tests, historical deferral and partial acceptance do not establish complete milestone closure. Reconcile unchecked checklists and missing or contradictory evidence first. Deferred earlier work remains open until its acceptance is satisfied or Fatih explicitly authorizes a documented scope closure.
- Do not move unresolved work to a later milestone, rename it, silently narrow its acceptance, or mark it complete to bypass this gate. Preserve the original milestone and evidence. Only an explicit owner scope decision may use `CLOSED_NOT_PLANNED`, `CLOSED_ACCEPTED_LIMIT` or `CLOSED_ARCHIVED`; record its date, reason and retained restrictions. Never label these dispositions as tests passed or visual/publication approval.
- Fatih explicitly authorized the final 2026-11-05 product-relevance filter in `docs/plan.md`. It superseded W1-W10 with the queue M2.R1, M3.R1, M3.R2, M4.R1 and M4.R2, whose closure is recorded in the M4.R2 reconciliation. Historical OPEN labels and retired packages do not reopen work or expand the current product scope.
- M5.1 resumed on 2026-11-06 after that closure, received Fatih's visual approval and was delivered in #65. Sections 7 and 8 of `docs/plan.md` record their own closures. V7 stays conditional, Studio (U1-U2) needs separate approval, and the 0.4.0 tasks in section 9 are proposed and wait for Fatih's scope decisions. Start any of them only after this audit finds no unresolved earlier item.
- A request to start or continue a later task does not implicitly waive this rule. Only an explicit change to this milestone-order rule from Fatih changes the gate.

## Feature-driven delivery

- Organize implementation around small user-visible features, not technical layers. Schema, compiler, renderer, and CLI changes are supporting work inside a feature.
- Every feature must define an exact runnable command or inspectable artifact and its expected result before implementation begins.
- Use this sequence for each feature: model the feature, implement the real path, run manual acceptance, add focused automated coverage, then run integration checks.
- Write feature tests after the manual path works but before the feature is merged. Tests discovered while fixing a bug must include a regression case.
- Do not postpone all tests to the end of a milestone. Milestone hardening adds cross-feature E2E, failure-injection, and runtime evidence after the individual features are protected.

## Trunk-based development

- `main` is the single long-lived trunk and must remain buildable. Do not create `develop`, release, or milestone branches.
- Start each numbered task from the latest `origin/main` in one short-lived branch and, when isolation is useful, one task-owned worktree.
- Keep a branch limited to one independently reviewable task such as `M0.2`. Split unrelated work instead of extending the branch lifetime.
- Use focused commits and stage explicit paths. Never include unrelated user changes, generated output, secrets, or agent/tool identity in Git metadata.
- Before integration, run typecheck, build, the current suite, and the feature's newly added tests. Run the complete `pnpm verify` and `pnpm test:e2e` gates when the plan schedules them.
- Push the branch, open a pull request, and squash-merge it into `main` after the required checks pass. Delete the merged remote branch and its task-owned worktree.
- Sync from `main` before starting the next numbered task. Do not stack new task work on an unmerged predecessor.
- Commit directly to `main` only when the user explicitly requests it.
- Never stash, revert, overwrite, or discard unrelated user work to update `main`. Use an isolated worktree or leave the local checkout unsynced and report the blocker.

## Runtime and command rules

- Use the Node and pnpm versions pinned by `.node-version` and `packageManager`.
- Use `rtk` for shell commands when it is available.
- Keep the core package independent of Remotion. The dependency direction remains CLI to core/renderer and renderer to core.


<claude-mem-context>
# Memory Context

# claude-mem status

This project has no memory yet. The current session will seed it; subsequent sessions will receive auto-injected context for relevant past work.

Memory injection starts on your second session in a project.

`/learn-codebase` is available if the user wants to front-load the entire repo into memory in a single pass (~5 minutes on a typical repo, optional). Otherwise memory builds passively as work happens.

Live activity: http://localhost:37777
How it works: `/how-it-works`

This message disappears once the first observation lands.
</claude-mem-context>