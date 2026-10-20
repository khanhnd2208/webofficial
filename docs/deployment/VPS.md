# VPS production deployment

This document is the production runbook for `https://toiladuykhanh.com`.
The only supported deploy entry point is `scripts/deploy-vps.sh`; GitHub Actions
calls the same script. Do not build over the directory currently serving users.
Server access, security controls, and the change log live in the private
`khanhnd2208/vps-infra` repo (`docs/SECURITY.md`). The directory layout, disk
guards, and Nginx baseline live in `docs/SERVER-WEBOFFICIAL.md` there.

## Required production environment

Production needs these variables. Keep the values only on the server, and never
print them in deploy logs.

```dotenv
MONGODB_URI
DATABASE_URL
AUTH_SECRET
AUTH_URL
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
ADMIN_EMAIL
ADMIN_SECRET
TEACHING_GROUP_BOARD_ENABLED
PUBLIC_TESTS_ENABLED
PUBLIC_KNOWLEDGE_ENABLED
```

`NEXTAUTH_URL` is accepted as a compatibility URL alias. `NEXTAUTH_SECRET` may
remain for older tooling, but this application still requires `AUTH_SECRET`.

## Pre-deploy gates

All of these conditions are mandatory:

1. The intended revision is committed; the local worktree is completely clean.
2. CI succeeded for that exact commit on `main`.
3. Teaching, admin authentication, Active Recall, and the intended public locks
   passed their targeted smoke tests.
4. SSH, PM2, databases, free disk, Nginx, and both health endpoints are healthy.
5. `/opt/scripts/backup-databases.sh` exists and is executable. The canonical
   deploy runs it after a successful build and immediately before migrations,
   whenever `prisma migrate status` reports anything other than up to date.
6. Migrations were reviewed for backward compatibility. A destructive migration
   requires a maintenance window and an explicit database restore plan.

Read-only production check:

```bash
npm run deploy:vps -- --check
```

Preview the exact clean Git export and rsync file set without changing the VPS:

```bash
npm run deploy:vps -- --dry-run
```

The script refuses a dirty worktree. It uses `git archive`, so ignored local
files and uncommitted source cannot leak into production. This is intentional:
commit every reviewed Teaching, Active Recall, migration, seed, and feature-lock
file before deploying, including files that were previously untracked. The
release metadata records that exact commit SHA.

`EXPECT_PUBLIC_LEARNING_LOCKS` defaults to `true`. In that mode the deploy
requires both `PUBLIC_TESTS_ENABLED=false` and
`PUBLIC_KNOWLEDGE_ENABLED=false`, then proves the Test and Knowledge page/API
surfaces return 404. Set it to `false` only in a separately approved future
release that intentionally opens those public features.

## Canonical deployment sequence

Run from a clean, CI-approved `main` commit:

```bash
npm run deploy:vps
```

The script performs these steps in order:

1. Exports the exact Git commit to a temporary local directory.
2. Runs `scripts/deploy-prune-releases.sh` under the deploy lock: keeps
   `current` and the four newest other releases, deletes older ones, drops
   `.next/cache` from every release except `current`, and clears the npm cache
   above 4 GB. It stops the deploy when less than 8 GB stays free (see
   vps-infra `docs/SERVER-WEBOFFICIAL.md`, Disk space). Then it creates a unique
   `/var/www/webofficial/releases/<id>` directory.
3. Uses rsync with `--delete` only inside that new release. It excludes `.env*`,
   uploads, `backups/`, `theory/`, `.venv/`, `*.tsbuildinfo`, dependencies,
   build output, test output, and editor/temp files.
4. Copies `.env.local` into the release with mode `0600`.
5. Uses the CI build when the deploy workflow found one (see
   [Prebuilt releases](#prebuilt-releases)): unpacks it, installs production
   dependencies, and skips the build below and the dependency swap in step 6.
   Otherwise, or when its baked-in public values differ from `.env.local`, it
   installs dependencies, runs `prisma generate`, and `next build` before any
   migration. When `package-lock.json`, `package.json`, any `.npmrc`, local dependency
   sources under `scripts/vendor/`, and the Node and npm versions all match
   the stored build cache, it copies
   `/var/www/webofficial/.build-cache/node_modules` instead of running `npm ci`.
   Each release builds with a fresh `.next/cache`: reusing another source tree's
   compiler cache can retain old CSS after styles move into imports. Mutable
   upload paths are linked only after the build, which keeps the compiler inside
   the release tree.
   The release ID is passed as `NEXT_DEPLOYMENT_ID` for Next.js version-skew
   protection and cache busting, and recorded in `.next/DEPLOYMENT_ID`. The
   candidate and the live process always start with the ID their build recorded.
   The deploy workflow passes `CI_TYPECHECKED_SHA` after it confirms CI
   succeeded for the commit. When it equals the deployed commit, the build sets
   `NEXT_SKIP_BUILD_TYPECHECK=1` and skips Next.js's own TypeScript pass, which
   CI's `npm run typecheck` already covered. Local deploys keep the pass.
6. Runs the database backup command when `prisma migrate status` reports
   pending or failed migrations (or cannot report), then `prisma migrate deploy`.
   A deploy with no pending migrations writes no data, so it skips the backup;
   the 02:00 cron backup still runs daily. The deploy then swaps
   in production-only dependencies before starting the runtime: a copy of
   `.build-cache/node_modules_prod` when the same dependency inputs match,
   otherwise `npm ci --omit=dev`, which refreshes that cache. Active Recall
   content is not reseeding during deploy; production decks stay as stored.
7. Starts the candidate on port 4001 and verifies readiness, liveness, Google
   Auth provider metadata, Active Recall availability, admin API protection,
   and the intended Test/Knowledge 404 locks.
8. Atomically replaces the `current` symlink, then uses the release's PM2
   ecosystem config to reload or start `nextjs-app` on port 4000. On the first
   cutover it detects the legacy npm command/cwd and deliberately replaces that
   managed process; it then asserts PM2 adopted the release-based executable
   and cwd rather than trusting `startOrReload` to change immutable metadata.
9. Repeats the health, Auth, Active Recall, admin-protection, and public-lock
   checks against the promoted HTTPS origin.
10. Runs `pm2 save --force` so reboot restores the same release and environment.

The candidate check reduces risk but a single PM2 fork is not a true
zero-downtime blue-green topology. Nginx continues serving the old process until
promotion; the final graceful reload can still have a short handover. Use two
permanent upstream ports and an Nginx upstream switch if strict zero downtime
becomes a requirement.

## GitHub Actions

The deploy workflow is manual, production-environment gated, restricted to
`main`, and requires a successful CI run for the exact SHA. Configure these
production secrets:

- `VPS_HOST`: hostname or IP only.
- `VPS_USER`: `deploy`. The deploy script refuses root: PM2 and every app file
  belong to the `deploy` user, and `deploy` may `sudo` only the backup script.
- `VPS_PORT`: actual SSH port; omit to use 22.
- `VPS_SSH_KEY`: private deploy key. Do not also pass an SSH password.
- `VPS_KNOWN_HOSTS`: pinned known-hosts line obtained through a trusted channel.

Generate the known-hosts material from a trusted administrator machine and
compare the fingerprint with the VPS console before saving it:

```bash
# The production address is in vps-infra `docs/SECURITY.md`. Compare the
# fingerprint with the VPS console before saving the secret.
ssh-keyscan -H -p "${VPS_PORT:-22}" "$VPS_HOST" > /tmp/webofficial_known_hosts
ssh-keygen -lf /tmp/webofficial_known_hosts
gh secret set --env production VPS_KNOWN_HOSTS < /tmp/webofficial_known_hosts
```

### Prebuilt releases

CI's `Build and end-to-end tests` job uploads `.next` as `next-build-<source
tree>` and records three files in it: `SOURCE_TREE`, `DEPLOYMENT_ID`, and
`BUILD_ENV` (the `NEXT_PUBLIC_*` values and public learning locks Next.js
inlined). When that job's Playwright run fails, it also keeps `test-results/`
for seven days so the hanging step can be read from the retry trace. The deploy workflow downloads the artifact for the deployed commit's
tree from a CI run in this repository that fully succeeded, end-to-end tests
included; a pull request run qualifies when its test merge had exactly the same
files. The VPS then skips `next build`, about six minutes.

The same match shortens CI on `main`. Its first job, `Find an identical tested
tree`, looks for a successful run with that tree's artifact; when the merged pull
request's last run qualifies and the previous `main` commit is green, every
other CI job is skipped, the run succeeds in under a minute, and the deploy
starts. Otherwise `main` runs every check as before.

Next.js bakes public values into the build, so CI reads them from repository
variables that must mirror the VPS `.env.local`: `NEXT_PUBLIC_UMAMI_SCRIPT_URL`,
`NEXT_PUBLIC_UMAMI_WEBSITE_ID`, and, only if `.env.local` sets them,
`NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_URL` (Settings → Secrets and variables
→ Actions → Variables). The deploy compares every `NEXT_PUBLIC_*` key on either
side plus `PUBLIC_TESTS_ENABLED` and `PUBLIC_KNOWLEDGE_ENABLED`. Any difference
prints the differing key names and falls back to building on the VPS, so a
missing variable costs time, never correctness. A new `NEXT_PUBLIC_*` key needs
the variable and an entry in the build step of `.github/workflows/ci.yml`.

The VPS application directory deliberately has no `.git`; the workflow checks
out source on the runner and calls the canonical rsync deploy. Do not reintroduce
`git fetch` or `git reset --hard` inside the live directory.

## Rollback behavior

If promotion, PM2 reload, or final health checks fail after the symlink swap,
the script atomically restores the previous `current` target and reloads it.
That restores source, `node_modules`, and `.next` together. Candidate processes
are removed and the pre-migration database backup is retained.

Automatic rollback is allowed only if the currently running release first
passes the same Active Recall, admin-protection, and public-lock smoke. This
matters during the first release-based rollout because today's legacy build may
still expose unfinished Test/Knowledge routes. If that previous build is not a
safe rollback target, a failed promotion stops and saves the PM2 process state
instead of reopening those routes; the site then fails closed until an operator
repairs or completes the release.

Database migrations are not automatically reversed. Automatic DB restore could
discard legitimate writes made after the backup. For additive/backward-compatible
migrations, the previous code release should remain compatible. For a destructive
migration, stop writes and use the reviewed restore procedure for the fresh
PostgreSQL and MongoDB archives under `/var/backups/db/`.

Manual code rollback, when the database remains compatible:

```bash
ssh deploy@webofficial-vps
cd /var/www/webofficial
readlink current
ls -1 releases
ln -s "releases/<previous-id>" .current-manual
mv -Tf .current-manual current
PM2_APP_NAME=nextjs-app \
PM2_LIVE_PORT=4000 \
WEBOFFICIAL_DEPLOY_ROOT=/var/www/webofficial \
  pm2 startOrReload current/ecosystem.config.js --only nextjs-app --update-env
curl --fail --max-time 10 http://127.0.0.1:4000/api/health/ready
pm2 save --force
```

Rollback targets are `current` and the four newest other releases; the deploy
prunes anything older. Rolled-back releases have no `.next/cache`, which only
slows the next build.
