# Historical documents and workspace recovery

The active source of truth is [spec.md](../spec.md), [refine-spec.md](../refine-spec.md), and [plan.md](../plan.md). This directory preserves prior records; it is not a second active roadmap.

## Snapshot — 2026-10-13

Captured at baseline `e008490e983d52e89da4ba6f25426e6467a5b831`, before the MVP 2 rewrite:

- [Specification](2026-10-13/spec.md)
- [Decision history](2026-10-13/refine-spec.md)
- [Milestones and handoffs](2026-10-13/plan.md), including the then-uncommitted Batch F integration closure
- [Discovery](2026-10-13/discovery.md), now historical
- [Snapshot hashes](2026-10-13/snapshots.json)
- [Cleanup verification receipt](2026-10-13/cleanup-verification.json)

These files are byte-for-byte snapshots. Old relative links and commands describe their original repository context and may no longer resolve from this history directory. They are preserved rather than rewritten to imply current capability or task status. Follow the active documents for new work.

## Workspace archive

| Content | Original | Verified archive / recovery |
|---|---|---|
| Development projects, render/gate evidence and studies | Repository `work/` | `/Users/fatih/Code/Playground/NaraFrame-archive/2026-10-13/work/` |
| Mapping, hashes and verification receipt | New archive index | `/Users/fatih/Code/Playground/NaraFrame-archive/2026-10-13/index.json` |
| Original scratch copy after verification | Repository `work/` | `/Users/fatih/.Trash/naraframe-work-2026-10-13` |
| Remotion Webpack cache | `packages/renderer-remotion/node_modules/.cache/webpack` | `/Users/fatih/.Trash/naraframe-webpack-2026-10-13` |

The archive preserves 36,228 regular files (3,412,492,972 bytes), directories and symlink targets. Every file hash and target was compared before moving the original into Trash. Nothing was permanently deleted. Trash remains recoverable until emptied; moving cache there alone does not recover free disk space.

To inspect an old `work/production-trial/...` reference, replace `work/` with the verified archive root above. Copy a needed project to a new external production directory before making revisions. Do not overwrite the immutable archive or assume old cached builds are current approvals.

## Production directory policy

New production projects should live outside the repository, such as `../NaraFrame-projects/`. Local `work/` may be recreated as disposable development scratch. Neither the external archive nor that scratch directory is required by the runtime. Tests retain both Krakatau samples and their needed local media inside the repository.
