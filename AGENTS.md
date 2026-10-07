<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

<!-- Maintainers: this file loads into every agent session (Claude via CLAUDE.md, Codex, Cursor). Keep it under ~150 lines and move detail into docs/, .cursor/rules/ (path-scoped), or .claude/skills/. Rationale: docs/10-AI_AGENTS.md. -->

# Agent rules

toiladuykhanh.com: personal site plus teaching platform. One Next.js 16 app, MongoDB (Mongoose) and PostgreSQL (Prisma 7), one VPS. Docs index: `README.md`.

## Hard rules

1. `main` is production: a push to `main` deploys automatically once CI passes. Finishing a task means shipping it: push the branch, open a pull request, merge it when CI is green, and watch the deploy (see Shipping). No extra go-ahead is needed. Never push straight to `main` or merge a pull request whose CI is red or still running. If the user says to hold, stop before pushing.
2. Never force-push, `git reset --hard`, `git clean -f`, rebase pushed commits, or skip hooks with `--no-verify`.
3. Never commit or print secrets: `.env*` (except `.env.example`), passwords, tokens, keys, database dumps. Read variable names from `.env.example`.
4. Production data changes only through the running app (Studio pages or admin APIs with an admin session). Never write to the production database directly or over SSH. Seed scripts skip existing rows, so they do not update production.
5. Ask the user first before: a Prisma migration, deleting data or tracked files outside your task, adding a dependency or a major upgrade, force-updating anything shared, or posting anything outside the repo.
6. Server and GitHub-settings changes (SSH, firewall, users, keys, Nginx, packages, secrets, branch rules) follow `docs/deployment/SECURITY.md`: back up first, keep a rollback, ask the user before anything that can lock them out or take sites down, and add a change-log line.

## Workspace

- The main checkout may hold someone else's uncommitted work. Do not edit, stash, format, or commit it.
- Do each task in its own worktree and branch from `origin/main`:
  `git fetch origin && git worktree add -b <prefix>/<topic> ../wt-<topic> origin/main && cd ../wt-<topic> && npm ci`
- Branch prefix by tool: `claude/`, `codex/`, `cursor/`, or `agent/`, then a short kebab-case topic.
- Remove the worktree after the branch merges: `git worktree remove ../wt-<topic>`.

## Working with the user

The user directs agents in plain language and does not read diffs. A short request like "do X" still means the full workflow below.

- One task per branch and pull request. If a request mixes unrelated changes, say so and propose splitting them before you start.
- Stay inside the task. Mention anything else you notice instead of fixing it.
- When the work is done, stop before pushing and report: one line per commit, anything changed outside the requested task, the checks you ran or skipped, and a screenshot for any visible change.
- Push, open the pull request, and merge only when the user asks for that step.

## Where code goes

- Four areas plus shared code. `scripts/areas/areas.mjs` is the map and `docs/areas.md` explains it; ESLint rejects imports across areas.
- A new folder or route goes into `areas.mjs`; then run `npm run areas:sync`.
- Placement table and conventions: `docs/03-CODING_STANDARDS.md` §11. New persistent data goes to PostgreSQL with a Prisma migration.
- Source files stay under 800 lines (ESLint `max-lines`). Files above that are capped in `eslint.config.mjs`: split them, never raise a cap.
- API routes use the wrappers in `src/lib/apiUtils.ts`.

## Commits

- Conventional Commits: `type(scope): summary` (`feat`, `fix`, `refactor`, `perf`, `style`, `docs`, `test`, `chore`, `ci`, `build`). The body says why.
- One kind of change per commit: move or rename, formatting, or behaviour. Before moving files, format them in a separate `style:` commit so the move diff shows only paths.
- End the message with the co-author trailer your tool requires.
- The pre-commit hook runs lint-staged and a typecheck. If it fails on files you did not touch, stop and tell the user.

## Before pushing

Run these once your commits are done; CI repeats them on the pull request.

```bash
npm run typecheck && npm run lint -- --max-warnings=0 && npm run format:check \
  && npm run areas:check && npm run test:unit && npm run test:component
```

- Also run `npm run test:integration` when you change services, repositories, models, or API routes (it uses the local PostgreSQL from `.env.test`).
- Also run `npm run build` when you change routes, config, dependencies, or imports across many files.
- Report which checks you ran and which you skipped.

## Shipping

Do these steps yourself, without asking, as soon as the task is done (`ship-change` skill has the commands):

1. Push your branch and open a pull request to `main`; fill in `.github/pull_request_template.md`.
2. Wait for CI: `gh pr checks <number> --watch`. CI runs static checks, unit/integration, component, build, and end-to-end specs for the areas you touched. Fix failures on the branch and wait again.
3. When every check is green, merge with a merge commit: `gh pr merge <number> --merge`. Squash or rebase merges break `.git-blame-ignore-revs`. `main` requires the five CI checks, so `gh pr merge <number> --auto --merge` also waits for green.
4. The merge deploys. Watch it with `gh run watch` on the latest `deploy.yml` run and report the result. Never start a local deploy while one is running. Runbook: `docs/deployment/VPS.md`.
5. Remove the worktree and the local branch.

Stop and ask instead of merging when: the change adds a Prisma migration, CI fails for a reason outside your task, the pull request also carries someone else's commits, or a deploy is already running for another branch.

## Uploads and assets

- Images in `public/`: WebP, AVIF, or JPEG, sized for display, at most 300 KB each. A social image is 1200×630 and under 150 KB. Delete assets nothing references.
- Never commit `public/uploads/` or `public/music/uploads/`. They are runtime uploads that persist on the VPS.
- Audio, video, PDFs, and other files over 1 MB: ask before committing.
- Lectures in `content/learn/**`: follow `.cursor/rules/learn-content.mdc`. Publishing to production uses Learn Studio or the admin API, never a seed script.

## Context and token use

- Do not open generated or bulky files: `.next/`, `coverage/`, `test-results/`, `playwright-report/`, `outputs/`, `package-lock.json`, `*.tsbuildinfo`, binaries in `public/`, `docs/ui-ux-expert-review.html`, `docs/references/*.pdf`. Inside `node_modules/`, read only the Next.js docs named above or a specific package file you need.
- Search before reading (`rg -n <pattern> src/<dir>`), then read only the lines you need from large files.
- Detailed guides load on demand; do not copy them here: `docs/03-CODING_STANDARDS.md`, `docs/areas.md`, `docs/02-ARCHITECTURE.md`, `docs/09-DESIGN_SYSTEM.md`, `docs/deployment/VPS.md`.
- Retired code lives in git history (`docs/archive/src-archived.md`). Do not restore it unless asked.
