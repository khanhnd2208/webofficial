---
name: ship-change
description: Take a code change in this repo from start to production safely - own worktree and branch, one-kind-per-commit history, local checks, pull request, CI, merge when green, deploy watch. Use when starting a task, committing, pushing, opening a PR, merging, or deploying.
---

# Ship a change

`main` deploys to production when CI passes. When the task is done, run steps
3-7 straight through without asking: the user wants "code done → live" with no
extra confirmations. Stop and ask only in the cases listed under step 6.

## 1. Start clean

```bash
git -C <repo> status --short          # someone else's work? leave it alone
git fetch origin
git worktree add -b <prefix>/<topic> ../wt-<topic> origin/main
cd ../wt-<topic> && npm ci
```

Prefix by tool: `claude/`, `codex/`, `cursor/`, `agent/`. Never edit, stash,
format, or commit files you did not create in the main checkout.

## 2. Make the change

- Place code with `docs/03-CODING_STANDARDS.md` §11 and `docs/areas.md`.
- New folder or route: add it to `scripts/areas/areas.mjs`, then
  `npm run areas:sync`.
- Moving files: first commit `npx prettier --write <old paths>` as
  `style(<scope>): ...`, then the move, so the move diff shows only paths.
- A file in `OVERSIZED_FILE_CAPS` (eslint.config.mjs) that you shrink gets a
  lower cap in the same commit.

## 3. Commit

- Conventional Commits, one kind of change per commit (move, formatting,
  behaviour). The body says why.
- Stage files by name (`git add <paths>`), not `git add -A`, unless the
  worktree holds only your task.
- The hook runs lint-staged and a typecheck. If it fails, fix the cause;
  never use `--no-verify`.

## 4. Check

```bash
npm run typecheck && npm run lint -- --max-warnings=0 && npm run format:check \
  && npm run areas:check && npm run test:unit && npm run test:component
```

Add `npm run test:integration` for services, repositories, models, or API
routes, and `npm run build` for routes, config, dependencies, or wide import
changes. Report what ran, what passed, and what you skipped.

## 5. Pull request

```bash
git push -u origin <branch>
gh pr create --base main --fill   # then edit the body to follow .github/pull_request_template.md
```

No confirmation needed, unless the user said to hold. Wait for CI and fix
failures with new commits on the branch:

```bash
gh pr checks <number> --watch
```

## 6. Merge and deploy (when every check is green)

```bash
gh pr merge <number> --merge      # merge commit: keeps .git-blame-ignore-revs valid
gh run list --workflow ci.yml --branch main --limit 1
gh run list --workflow deploy.yml --limit 1
gh run watch <run-id>
```

Never `--auto`: `main` has no required checks, so it merges before CI ends.
Do not start `npm run deploy:vps` while the workflow runs. If the deploy fails,
read `docs/deployment/VPS.md` and ask before any manual step.

Stop and ask instead of merging when:

- the change adds a Prisma migration;
- CI fails for a reason outside your task;
- the PR also carries someone else's commits;
- a deploy for another branch is still running (wait for it, or ask).

## 7. Clean up

```bash
git worktree remove ../wt-<topic>
git branch -d <branch>
```

## Bringing an old branch up to date

Branches started before the repo-wide Prettier commit (`6ff320b`) conflict on
formatting. Format first, then merge, so identical formatting on both sides
merges cleanly and only real edits can conflict:

```bash
git diff --name-only --diff-filter=AM $(git merge-base HEAD origin/main) -- '*.ts' '*.tsx' '*.css' \
  | xargs npx prettier --write
git commit -am "style: apply prettier before merging main"
git merge origin/main
```

Resolve any remaining conflict by hand: `main` also moved and renamed files
(see `git log origin/main --stat`), so never take one side wholesale.
