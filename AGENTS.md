# NaraFrame Project Instructions

## Source of truth

- Read `docs/spec.md`, `docs/refine-spec.md`, and `docs/plan.md` before changing product behavior or milestone scope.
- Execute numbered tasks in `docs/plan.md` in order. Update its checklist and evidence only after the stated checks pass.
- Keep implementation details inside the existing project documents. Do not create parallel plans unless the user asks for one.

## Trunk-based development

- `main` is the single long-lived trunk and must remain buildable. Do not create `develop`, release, or milestone branches.
- Start each numbered task from the latest `origin/main` in one short-lived branch and, when isolation is useful, one task-owned worktree.
- Keep a branch limited to one independently reviewable task such as `M0.2`. Split unrelated work instead of extending the branch lifetime.
- Use focused commits and stage explicit paths. Never include unrelated user changes, generated output, secrets, or agent/tool identity in Git metadata.
- Run the task's focused tests while implementing. Before integration, run `pnpm verify`; also run `pnpm test:e2e` when the task or milestone gate requires it.
- Push the branch, open a pull request, and squash-merge it into `main` after the required checks pass. Delete the merged remote branch and its task-owned worktree.
- Sync from `main` before starting the next numbered task. Do not stack new task work on an unmerged predecessor.
- Commit directly to `main` only when the user explicitly requests it.
- Never stash, revert, overwrite, or discard unrelated user work to update `main`. Use an isolated worktree or leave the local checkout unsynced and report the blocker.

## Runtime and command rules

- Use the Node and pnpm versions pinned by `.node-version` and `packageManager`.
- Use `rtk` for shell commands when it is available.
- Keep the core package independent of Remotion. The dependency direction remains CLI to core/renderer and renderer to core.
