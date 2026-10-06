# Server security

The security record for the production VPS: what runs there, who can get in,
which controls are on, how to change them safely, and a log of every change.
Deploy steps live in [`VPS.md`](./VPS.md).

## Rules for people and AI agents

1. Read this file before changing anything on the VPS or in GitHub settings.
2. Before a change, copy the files you touch into
   `/root/hardening-backup-<YYYYMMDD>/` on the VPS.
3. Any SSH change follows [Change SSH safely](#change-ssh-safely): rollback
   timer first, test a new connection, then cancel the timer.
4. Apps and deploys run as `deploy`. Never start an app or run `pm2` as root:
   a second PM2 fights the real one over the ports.
5. After a change, add a line to the [Change log](#change-log) in the same pull
   request or the next one.
6. Never write a password, private key, token, or `.env` value in this file.
   Name where it lives instead. Passwords live in the owner's password manager.

## Everyday use

All apps are managed with the `vps` command from the private repo
[`khanhnd2208/vps-infra`](https://github.com/khanhnd2208/vps-infra) (checked
out at `~/Workspace/Active/vps`; `vps help` lists every command).

| I want to…                         | Run (on the Mac)                                                                 |
| ---------------------------------- | -------------------------------------------------------------------------------- |
| See if everything is healthy       | `vps status` (apps, releases, server, HTTPS)                                     |
| Check this site in depth           | `npm run deploy:vps -- --check` (from this repo)                                 |
| Read an app's recent errors        | `vps logs <app> 50 --err` (app: `webofficial`, `chijuly`, `learn-chinese`)       |
| Restart one app                    | `vps restart <app>`                                                              |
| Roll back Chijuly or Learn Chinese | `vps rollback <app>`                                                             |
| Deploy this site                   | Merge a pull request to `main`; GitHub deploys it                                |
| Deploy Chijuly                     | `vps deploy chijuly` (manual only)                                               |
| Deploy Learn Chinese               | Merge to `main` in the learn-chinese repo (deploys after Quality passes)         |
| Administer the server (root)       | `ssh webofficial-vps` (root, Mac key only)                                       |
| Run a backup now                   | `ssh webofficial-vps /opt/scripts/backup-databases.sh`                           |
| See the last backup                | `ssh webofficial-vps 'tail -5 /var/log/db-backup/cron.log'`                      |
| See who tried to break in          | `ssh webofficial-vps 'fail2ban-client status sshd'`                              |

The `vps-health` workflow checks the server every 3 hours; GitHub emails the
owner when it fails. That email is the signal to look.

## Inventory

| Item         | Value                                                           |
| ------------ | --------------------------------------------------------------- |
| Provider     | Contabo, Cloud VPS 10 SSD, region SIN, instance `vmi3082378`    |
| Address      | `217.217.253.161`, IPv6 `2407:3640:2308:2378::1`                |
| OS           | Ubuntu 24.04 LTS, timezone Asia/Ho_Chi_Minh                     |
| SSH alias    | `webofficial-vps` (root) in the owner's `~/.ssh/config`; use `deploy@webofficial-vps` for apps |
| Console      | Contabo panel → VPS → ⋮ → VNC Control (`103.164.54.79:63202`)   |
| Snapshots    | 1 slot on this plan; Contabo deletes a snapshot after 30 days   |
| Off-site DBs | Google Drive `VPS-Backups/databases` via rclone remote `gdrive` |

| App           | Domain                      | Port (localhost) | Directory                | PM2 name        | Runs as |
| ------------- | --------------------------- | ---------------- | ------------------------ | --------------- | ------- |
| This site     | `toiladuykhanh.com`, `www.` | 4000             | `/var/www/webofficial`   | `nextjs-app`    | deploy  |
| Chijuly ERP   | `chijuly.toiladuykhanh.com` | 3000             | `/var/www/chijuly`       | `chijuly`       | deploy  |
| Learn Chinese | `thh.toiladuykhanh.com`     | 3001             | `/var/www/learn-chinese` | `learn-chinese` | deploy  |

Every app runs from `<dir>/current`, a link to one of `<dir>/releases/`.
Chijuly and Learn Chinese deploy with `/opt/vps/bin/app-deploy` (root-owned,
installed from `vps-infra` with `vps install`); their PM2 configs live in
`/opt/vps/apps/<app>/`, their `.env` in `<dir>/shared/.env`, and a `pg_dump`
from before each deploy in `<dir>/shared/db-backups/`. The old in-place files
of all three apps sit in `<dir>/_legacy-20261006/` (mode 700) until 2026-10-20.

PM2 runs as `deploy` (`systemctl status pm2-deploy`, home `/home/deploy/.pm2`)
with `pm2-logrotate` (10 MB per file, 14 kept). Root's PM2 (`pm2-root`) is
disabled. `/var/www/<app>` belongs to `deploy`, except
`/var/www/webofficial/backups` (root) and `/var/www/chijuly/backups` (postgres).

Databases listen on localhost only and require a password.

| Engine     | Databases                                                      | App users                                                 |
| ---------- | -------------------------------------------------------------- | --------------------------------------------------------- |
| PostgreSQL | `khanhwebsite`, `chijuly_erp`, `learn_chinese`                 | `khanhwebsite`, `chijuly_user`, `learn_chinese_user`      |
| MongoDB    | `my_teaching_platform`, `learn_chinese_auth`, `teaching-platform` | `teaching_user`, `learn_chinese_user`; admin `mongoadmin` |

## Access

### SSH keys on the VPS

| User   | Key comment                       | Fingerprint (SHA256)                          | Private key lives in                    |
| ------ | --------------------------------- | --------------------------------------------- | --------------------------------------- |
| root   | `duykhanh@mac`                    | `7CxqWXIXUWvYglBQltKuJMWogSC9oK5/kqSqPOWnuGM` | Owner's Mac, `~/.ssh/id_ed25519`        |
| deploy | `duykhanh@mac`                    | `7CxqWXIXUWvYglBQltKuJMWogSC9oK5/kqSqPOWnuGM` | Owner's Mac                             |
| deploy | `ci-webofficial-deploy-2026-10`   | `GJJJkS2o8y3f7me2QRDALAi/iQkbdEbnlXCd84m3Sls` | GitHub `webofficial` env `production`   |
| deploy | `ci-learn-chinese-deploy-2026-10` | `amLqUjWtKT4geQxi5EP4JVK9v+z014DRISRY7XuH4fk` | GitHub `learn-chinese` env `production` |
| deploy | `ci-chijuly-deploy-2026-10`       | `4o48f1LJaj7eRh5tlaoe7zDvtd3TKAAv6iGqfGnSQwo` | GitHub `chijuly` env `production`       |

CI keys carry the `restrict` option: no forwarding, no terminal. Check the live
lists with
`ssh webofficial-vps 'ssh-keygen -lf /root/.ssh/authorized_keys; ssh-keygen -lf /home/deploy/.ssh/authorized_keys'`.

### What `deploy` may do as another user

`/etc/sudoers.d/deploy`, nothing else:

- run `/opt/scripts/backup-databases.sh` as root (the deploy backs up before migrating);
- run `/usr/bin/test` as `www-data` (Chijuly's `verify.sh` checks Nginx can read static files).

### Passwords and secrets

| Secret                    | Where it lives                                    | Used for                                         |
| ------------------------- | ------------------------------------------------- | ------------------------------------------------ |
| Linux `root` password     | Owner's password manager                          | VNC console login only (SSH refuses passwords)   |
| VNC password (8 chars)    | Owner's password manager                          | Contabo VNC                                      |
| Contabo account           | Owner's password manager                          | Panel, snapshots, VNC                            |
| App and database secrets  | `/var/www/<app>/.env*`, mode 600, owner `deploy`  | Apps at runtime; each release keeps a copy       |
| MongoDB admin password    | `/root/.config/db-backup/mongodump.yaml`, mode 600 | Backups and restores                            |
| Old `.env` backups        | `/root/env-archive/`                              | Reference only                                   |

### GitHub

- `khanhnd2208/webofficial`: only the owner. Environment `production` holds
  `VPS_SSH_KEY`, `VPS_HOST`, `VPS_USER=deploy`, `VPS_KNOWN_HOSTS`; only `main`
  may use it. No repository-level secrets. `main` requires a pull request and
  the five CI checks; force-push and deletion are blocked.
- `khanhnd2208/learn-chinese`: environment `production` (main only) holds
  `VPS_HOST`, `VPS_USER=deploy`, `VPS_SSH_KEY`, `VPS_KNOWN_HOSTS`.
- `khanhnd2208/chijuly`: environment `production` (main only) holds
  `VPS_HOST`, `VPS_SSH_KEY`, `VPS_KNOWN_HOSTS`; the deploy workflow only runs
  when started by hand.
- `khanhnd2208/vps-infra` (private): the `vps` command, `app-deploy`, PM2 and
  Nginx config. No secrets.

## Controls in place

| Control      | Setting                                                                                | Where                                         |
| ------------ | -------------------------------------------------------------------------------------- | --------------------------------------------- |
| SSH          | Keys only, `AllowUsers root deploy`, no forwarding, modern ciphers, `LogLevel VERBOSE` | `/etc/ssh/sshd_config.d/00-hardening.conf`    |
| Firewall     | UFW: deny incoming except 22, 80, 443                                                  | `ufw status verbose`                          |
| Brute force  | fail2ban `sshd` jail                                                                   | `fail2ban-client status sshd`                 |
| App users    | Apps and deploys run as `deploy`; root runs no app                                     | `systemctl status pm2-deploy`                 |
| Updates      | unattended-upgrades for security pockets; reboots at 04:30 when an update needs it     | `/etc/apt/apt.conf.d/52unattended-reboot`     |
| TLS          | Let's Encrypt via certbot timer                                                        | `certbot certificates`                        |
| Backups      | 02:00 daily and before each migration; 3 PostgreSQL + every MongoDB DB; 7 days local; copied to Google Drive | `/opt/scripts/backup-databases.sh`, root cron |
| Backup files | `/var/backups/db` 750 root:postgres, dump folders 700, files 600                       |                                               |
| Health       | `vps-health` workflow every 3 hours; GitHub emails the owner on failure                | `.github/workflows/vps-health.yml`            |

`sshd` takes the first value it reads, and `00-hardening.conf` loads first, so a
file that cloud-init writes later cannot turn password login back on.

## Change SSH safely

Run on the VPS from an open session. The timer restores the old config after
10 minutes unless you cancel it.

```bash
B=/root/hardening-backup-$(date +%Y%m%d); install -d -m 700 "$B"; cp -a /etc/ssh "$B/etc-ssh"
cat > /root/sshd-rollback.sh <<EOF
#!/bin/sh
rsync -a --delete $B/etc-ssh/ /etc/ssh/ && systemctl reload ssh
EOF
chmod 700 /root/sshd-rollback.sh
systemd-run --unit=sshd-rollback --on-active=10min /root/sshd-rollback.sh
# edit /etc/ssh/sshd_config.d/00-hardening.conf, then:
sshd -t && systemctl reload ssh
```

From the Mac, open a **new** connection (`ssh -o ControlPath=none webofficial-vps true`)
and run the `vps-health` workflow. Only when both work:

```bash
systemctl stop sshd-rollback.timer
```

## Runbooks

### Locked out of SSH

1. Contabo panel → VPS `vmi3082378` → ⋮ → VNC Control. Check that VNC is
   enabled; set a VNC password if you do not have it.
2. Connect with Finder → ⌘K → `vnc://103.164.54.79:63202` (or RealVNC Viewer).
3. Log in as `root` with the root password from the password manager.
4. Restore the last good SSH config from `/root/hardening-backup-*/etc-ssh`,
   run `sshd -t`, then `systemctl reload ssh`.
5. Last resort: restore the Contabo snapshot. It rolls back the whole disk,
   databases included, so take a fresh database backup first if you can.

### An app is down

```bash
vps status                               # status, restarts, memory, release
vps logs <app> 80 --err
vps rollback <app>                       # chijuly, learn-chinese: back to the previous release
vps restart <app>
```

If PM2 itself is gone (after a reboot, `pm2 ls` is empty), as root:
`systemctl restart pm2-deploy`. It resurrects the apps saved with `pm2 save`.

### Restore a database

Rehearsed on 2026-10-06: every table and collection matched. Always restore
into a scratch database first, compare, and only then decide about the real one.

PostgreSQL (as root; `psql` reads the dump from stdin because `postgres` cannot
read `/root`):

```bash
W=$(mktemp -d /root/restore.XXXX); cd "$W"
tar -xzf /var/backups/db/postgresql/khanhwebsite_<stamp>.tar.gz
sudo -u postgres createdb restore_check
sudo -u postgres psql -v ON_ERROR_STOP=1 -d restore_check < khanhwebsite_<stamp>.sql
# compare, then: sudo -u postgres dropdb restore_check; rm -rf "$W"
```

MongoDB (point `mongorestore` at the dump root, not at the database folder,
or it restores nothing and still reports success):

```bash
W=$(mktemp -d /root/restore.XXXX); cd "$W"
tar -xzf /var/backups/db/mongodb/my_teaching_platform_<stamp>.tar.gz
mongorestore --host=127.0.0.1 -u mongoadmin --config=/root/.config/db-backup/mongodump.yaml \
  --authenticationDatabase admin --nsInclude 'my_teaching_platform.*' \
  --nsFrom 'my_teaching_platform.*' --nsTo 'restore_check.*' mongodump_my_teaching_platform_<stamp>
# compare; mongoadmin cannot dropDatabase, so drop each restore_check collection; rm -rf "$W"
```

Older copies are on Google Drive under `VPS-Backups/databases`.

### Add or rotate an SSH key

1. Generate `ssh-keygen -t ed25519 -a 100 -C "<purpose>-<YYYY-MM>"`.
2. Append the public key to the target user's `authorized_keys`; prefix CI keys
   with `restrict `.
3. Test a new connection with the new key.
4. Store the private key where it belongs (GitHub environment secret or the Mac).
5. Remove the old key line, test again, and update the table above.

### Rotate an app secret

1. Back up every copy: `/var/www/webofficial/.env.local` and
   `/var/www/webofficial/releases/*/.env.local` (rollback targets keep their own).
2. Generate the value on the server (`openssl rand -hex 32`); never print it.
3. Change every copy, then reload as deploy with the command in
   [`VPS.md`](./VPS.md) (manual code rollback) and check `/api/health/ready`.
   `AUTH_SECRET` signs every user out once.

## Plan

### Phase 1: no root for apps and deploys (done 2026-10-06)

- [x] All three apps run under `deploy` (one PM2); `pm2-root` disabled.
- [x] CI logs in as `deploy@` with one restricted key per repository; root keeps only the Mac key.
- [x] `deploy` sudo limited to the backup script and the `www-data` file check.
- [x] Rotated `AUTH_SECRET` and the `teaching_user` MongoDB password.
- [x] `learn_chinese` PostgreSQL in the backup; Mongo password off the command line.
- [x] Old `.env` backups moved to `/root/env-archive`; restore drill passed.
- [x] Unattended reboot at 04:30 when an update needs it.

### Phase 2: finishing touches

- [ ] Nginx: `server_tokens off`, TLS 1.2+ everywhere, one HSTS policy, rate limit on sign-in.
- [x] Learn Chinese listens on `127.0.0.1` only (2026-10-06, with the move to `app-deploy`).
- [ ] fail2ban `recidive` jail.
- [ ] `vps-health` also checks SSH config drift, failed units, pending security updates, certificate expiry.
- [ ] Dependabot security updates.
- [ ] Turn VNC off when not in use (Contabo panel).

Out of scope on purpose: backup encryption (Google Drive is trusted), one Linux
user per app, auditd/AIDE/CrowdSec, Livepatch.

## Change log

| Date       | Change                                                                                                        | Rollback                                                      |
| ---------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| 2026-10-06 | Config backup in `/root/hardening-backup-20261006`                                                            | —                                                             |
| 2026-10-06 | New CI key in env `production` (main only); repo-level secrets deleted                                        | Add a key back to `authorized_keys`                           |
| 2026-10-06 | Removed keys `github-actions-deploy` and `github-actions-webofficial-2026-09` from root                       | `authorized_keys.before-key-removal` in the backup            |
| 2026-10-06 | Branch protection on `main`; collaborators removed (only the owner left)                                      | GitHub settings                                               |
| 2026-10-06 | `/var/backups/db` permissions tightened (was 777)                                                             | `backup-perms.txt` in the backup                              |
| 2026-10-06 | Root password reset by the owner; VNC login verified                                                          | —                                                             |
| 2026-10-06 | `00-hardening.conf` for sshd; weak DH moduli removed; cloud-init file no longer enables passwords             | `etc-ssh` in the backup                                       |
| 2026-10-06 | `apt upgrade` (MongoDB 8.0.32, Node 22.23.3), kernel 6.8.0-146, reboot                                        | Older kernels 136 and 142 remain in GRUB                      |
| 2026-10-06 | Phase 1 backup in `/root/hardening-backup-20261006-phase1`                                                    | —                                                             |
| 2026-10-06 | `deploy` sudo cut to the backup script and `www-data test`                                                    | `sudoers.d` in the phase 1 backup                             |
| 2026-10-06 | PM2 under `deploy` (`pm2-deploy`); apps moved one by one; `pm2-root` disabled; app dirs owned by `deploy`     | `pm2-root.json`, `dump.pm2`, `owners-*.txt` in the backup     |
| 2026-10-06 | CI for webofficial and learn-chinese logs in as `deploy@`; root CI keys removed; learn-chinese env main-only   | `root-authorized_keys.before` in the backup                   |
| 2026-10-06 | Rotated `AUTH_SECRET` and the `teaching_user` MongoDB password (all 7 env copies)                             | `env-before-rotation/` in the backup                          |
| 2026-10-06 | Backup script: `umask 077`, `learn_chinese`, Mongo password in a root-only file                               | `backup-databases.sh.before` in the backup                    |
| 2026-10-06 | Restore drill: `khanhwebsite` (72 tables) and `my_teaching_platform` (25 collections) matched                 | —                                                             |
| 2026-10-06 | Old `.env` backups moved to `/root/env-archive`; unattended reboot at 04:30                                   | Move back; delete `52unattended-reboot`                       |
| 2026-10-06 | chijuly: dead repo secrets `VPS_PASSWORD`, `VPS_HOST`, `VPS_USER` deleted; `deploy.sh` uses `deploy`          | —                                                             |
| 2026-10-06 | `/opt/vps` (root-owned) from `vps-infra`: `app-deploy` and per-app PM2/build config                           | Delete `/opt/vps`                                             |
| 2026-10-06 | Nginx `chijuly`, `thh`: static aliases read `<dir>/current/`                                                  | `hardening-backup-20261006/nginx/`                            |
| 2026-10-06 | Learn Chinese, then Chijuly moved to `releases/` + `current` + `shared/`; Learn Chinese binds 127.0.0.1       | `app-deploy` falls back to the in-place dir (`current -> .`)  |
| 2026-10-06 | New key `ci-chijuly-deploy-2026-10` (`restrict`) for deploy; chijuly env `production` limited to `main`       | `authorized_keys.deploy` in `hardening-backup-20261006-vps-infra` |
| 2026-10-06 | Old in-place app files moved to `/var/www/<app>/_legacy-20261006/` (~5.4 GB); delete from 2026-10-20          | `mv` the item back; list in `MANIFEST-before.txt`             |
