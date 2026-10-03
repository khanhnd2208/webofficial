# VPS production deployment

This document is the production runbook for `https://toiladuykhanh.com`.
The only supported deploy entry point is `scripts/deploy-vps.sh`; GitHub Actions
calls the same script. Do not build over the directory currently serving users.

## Production topology

- Ubuntu VPS, Nginx TLS termination, and PM2 process `nextjs-app`.
- Nginx proxies the application to `127.0.0.1:4000`.
- A staged candidate is tested temporarily on `127.0.0.1:4001`.
- MongoDB and PostgreSQL listen on localhost only.
- `/api/health/live` verifies the Next.js process.
- `/api/health/ready` verifies Next.js, MongoDB, and PostgreSQL together.
- Node.js must satisfy Next.js' installed engine requirement (`>=20.9.0`). Keep
  local CI and the VPS on the same pinned LTS major; do not rely on an
  unversioned system upgrade.

The release layout is:

```text
/var/www/webofficial/
├── .env.local                 # shared source of truth, mode 0600
├── current -> releases/<id>    # atomically replaced on promotion
├── releases/<id>/             # source + node_modules + .next
├── .build-cache/              # full node_modules reused when dependency inputs match
├── public/uploads/            # shared persistent uploads
├── public/music/uploads/      # shared persistent music uploads
├── backups/                   # operator data; never synced/deleted
└── theory/                    # operator data; never synced/deleted
```

Each release links the persistent directories above instead of copying them.
The first release-based deployment keeps the untouched legacy application root
as its rollback target. Later deployments point `current` at the prior release.

## Required production environment

Keep secrets only in `/var/www/webofficial/.env.local` and set mode `0600`.
At minimum, production requires:

```dotenv
MONGODB_URI=mongodb://...
DATABASE_URL=postgresql://...
AUTH_SECRET=...
AUTH_URL=https://toiladuykhanh.com
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
ADMIN_EMAIL=...
ADMIN_SECRET=...
TEACHING_GROUP_BOARD_ENABLED=false
PUBLIC_TESTS_ENABLED=false
PUBLIC_KNOWLEDGE_ENABLED=false
```

`NEXTAUTH_URL` is accepted as a compatibility URL alias. `NEXTAUTH_SECRET` may
remain for older tooling, but this application still requires `AUTH_SECRET`.
Never print environment values in deploy logs.

Validate presence without exposing values:

```bash
ssh webofficial-vps '
  cd /var/www/webofficial
  stat -c "%a %U:%G %n" .env.local
  for key in MONGODB_URI DATABASE_URL AUTH_SECRET AUTH_URL GOOGLE_CLIENT_ID GOOGLE_CLIENT_SECRET; do
    grep -q "^${key}=." .env.local || echo "missing: ${key}"
  done
'
```

## Pre-deploy gates

All of these conditions are mandatory:

1. The intended revision is committed; the local worktree is completely clean.
2. CI succeeded for that exact commit on `main`.
3. Teaching, admin authentication, Active Recall, and the intended public locks
   passed their targeted smoke tests.
4. SSH, PM2, databases, free disk, Nginx, and both health endpoints are healthy.
5. `/opt/scripts/backup-databases.sh` exists and is executable. The canonical
   deploy runs it after a successful build and immediately before migrations.
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
2. Creates a unique `/var/www/webofficial/releases/<id>` directory.
3. Uses rsync with `--delete` only inside that new release. It excludes `.env*`,
   uploads, `backups/`, `theory/`, `.venv/`, `*.tsbuildinfo`, dependencies,
   build output, test output, and editor/temp files.
4. Copies `.env.local` into the release with mode `0600`.
5. Installs dependencies, runs `prisma generate`, and `next build` before any
   migration. When `package-lock.json`, `package.json`, any `.npmrc`, local dependency
   sources under `scripts/vendor/`, and the Node and npm versions all match
   the stored build cache, it copies
   `/var/www/webofficial/.build-cache/node_modules` instead of running `npm ci`.
   It also copies `.next/cache` from the current release so the compiler can
   reuse work. The copy stays inside the new release; mutable upload paths are
   linked only after the build, which keeps Turbopack inside the release tree.
   The release ID is passed as `NEXT_DEPLOYMENT_ID` for Next.js version-skew
   protection and cache busting.
6. Runs the database backup command, then `prisma migrate deploy`, then prunes
   build-only development dependencies before starting the runtime. Active Recall
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
- `VPS_USER`: SSH user.
- `VPS_PORT`: actual SSH port; omit to use 22.
- `VPS_SSH_KEY`: private deploy key. Do not also pass an SSH password.
- `VPS_KNOWN_HOSTS`: pinned known-hosts line obtained through a trusted channel.

Generate the known-hosts material from a trusted administrator machine and
compare the fingerprint with the VPS console before saving it:

```bash
VPS_PORT=22 # confirmed production SSH port; change only after a console-verified move
ssh-keyscan -H -p "$VPS_PORT" 217.217.253.161 > /tmp/webofficial_known_hosts
ssh-keygen -lf /tmp/webofficial_known_hosts
gh secret set --env production VPS_KNOWN_HOSTS < /tmp/webofficial_known_hosts
```

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
ssh webofficial-vps
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

Do not delete old releases during the same change window. Prune only after a
verified backup and a stable observation period.

## Nginx and TLS baseline

Next.js redirects `www.toiladuykhanh.com` to `https://toiladuykhanh.com` with HTTP 308, preserving paths and queries so Google sessions use one host. This can move to a dedicated nginx redirect server later; keep TLS coverage for both hosts.

The active HTTPS server must include these proxy and security settings:

```nginx
server {
    listen 443 ssl;
    server_name toiladuykhanh.com www.toiladuykhanh.com;

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=()" always;

    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 120s;
        proxy_send_timeout 120s;
    }
}
```

Never hardcode `X-Forwarded-Port 80` in the TLS server. Validate configuration
before a graceful reload:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

Post-deploy verification:

```bash
curl -fsS https://toiladuykhanh.com/api/health/live
curl -fsS https://toiladuykhanh.com/api/health/ready
curl -fsS https://toiladuykhanh.com/api/auth/providers
pm2 status nextjs-app
```

Then complete the signed-in browser smoke test in a fresh private window:
Google login, admin authorization, Teaching interactions, Active Recall, and
the intentionally locked unfinished areas. Ask users with a tab open during a
release to refresh once before starting a new learning session.
