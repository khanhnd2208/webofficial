<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

<!-- Maintainers: this file loads into every agent session (Claude via CLAUDE.md, Codex, Cursor). Keep it under ~150 lines and move detail into docs/, .cursor/rules/ (path-scoped), or .claude/skills/. Rationale: docs/10-AI_AGENTS.md. -->

# Agent rules

toiladuykhanh.com: personal site plus teaching platform. One Next.js 16 app, MongoDB (Mongoose) and PostgreSQL (Prisma 7), one VPS. Docs index: `README.md`.

## Hard rules

1. `main` is production: a push to `main` deploys automatically once CI passes. Do not push to `main`, merge a pull request, or deploy unless the user asked for that step in this conversation.
2. Never force-push, `git reset --hard`, `git clean -f`, rebase pushed commits, or skip hooks with `--no-verify`.
3. Never commit or print secrets: `.env*` (except `.env.example`), passwords, tokens, keys, database dumps. Read variable names from `.env.example`.
4. Production data changes only through the running app (Studio pages or admin APIs with an admin session). Never write to the production database directly or over SSH. Seed scripts skip existing rows, so they do not update production.
5. Ask the user first before: a Prisma migration, deleting data or tracked files outside your task, adding a dependency or a major upgrade, force-updating anything shared, or posting anything outside the repo.

## Workspace

- The main checkout may hold someone else's uncommitted work. Do not edit, stash, format, or commit it.
- Do each task in its own worktree and branch from `origin/main`:
  `git fetch origin && git worktree add -b <prefix>/<topic> ../wt-<topic> origin/main && cd ../wt-<topic> && npm ci`
- Branch prefix by tool: `claude/`, `codex/`, `cursor/`, or `agent/`, then a short kebab-case topic.
- Remove the worktree after the branch merges: `git worktree remove ../wt-<topic>`.

## Where code goes

- Four areas plus shared code. `scripts/areas/areas.mjs` is the map and `docs/areas.md` explains it; ESLint rejects imports across areas.
- A new folder or route goes into `areas.mjs`; then run `npm run areas:sync`.
- Placement table and conventions: `docs/03-CODING_STANDARDS.md` §11. New persistent data goes to PostgreSQL with a Prisma migration.
- Source files stay under 800 lines (ESLint `max-lines`). Files above that are capped in `eslint.config.mjs`: split them, never raise a cap.
- API routes use the wrappers in `src/lib/apiUtils.ts`. Board-game room APIs use `src/features/board-game-shared/lib/apiUtils.ts` and throw `GameError`.

## Commits

- Conventional Commits: `type(scope): summary` (`feat`, `fix`, `refactor`, `perf`, `style`, `docs`, `test`, `chore`, `ci`, `build`). The body says why.
- One kind of change per commit: move or rename, formatting, or behaviour. Before moving files, format them in a separate `style:` commit so the move diff shows only paths.
- End the message with the co-author trailer your tool requires.
- The pre-commit hook runs lint-staged and a typecheck. If it fails on files you did not touch, stop and tell the user.

## Before pushing

```bash
npm run typecheck && npm run lint -- --max-warnings=0 && npm run format:check \
  && npm run areas:check && npm run test:unit && npm run test:component
```

- Also run `npm run test:integration` when you change services, repositories, models, or API routes (it uses the local PostgreSQL from `.env.test`).
- Also run `npm run build` when you change routes, config, dependencies, or imports across many files.
- Report which checks you ran and which you skipped.

## Shipping

1. Push your branch and open a pull request to `main`; fill in `.github/pull_request_template.md`.
2. CI runs static checks, unit/integration, component, build, and end-to-end specs for the areas you touched. Fix failures on the branch.
3. Merge only when the user says so, with a merge commit. Squash or rebase merges break `.git-blame-ignore-revs`.
4. The merge deploys. Follow it with `gh run list --workflow deploy.yml`. Never start a local deploy while one is running. Runbook: `docs/deployment/VPS.md`.

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
