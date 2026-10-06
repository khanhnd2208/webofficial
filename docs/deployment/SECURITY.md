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
4. After a change, add a line to the [Change log](#change-log) in the same pull
   request or the next one.
5. Never write a password, private key, token, or `.env` value in this file.
   Name where it lives instead. Passwords live in the owner's password manager.

## Inventory

| Item         | Value                                                         |
| ------------ | ------------------------------------------------------------- |
| Provider     | Contabo, Cloud VPS 10 SSD, region SIN, instance `vmi3082378`  |
| Address      | `217.217.253.161`, IPv6 `2407:3640:2308:2378::1`              |
| OS           | Ubuntu 24.04 LTS                                              |
| SSH alias    | `webofficial-vps` in the owner's `~/.ssh/config`              |
| Console      | Contabo panel → VPS → ⋮ → VNC Control (`103.164.54.79:63202`) |
| Snapshots    | 1 slot on this plan; Contabo deletes a snapshot after 30 days |
| Off-site DBs | Google Drive `VPS-Backups/databases` via rclone remote `gdrive` |

| App           | Domain                      | Port (localhost) | Directory                  | PM2 name        | Runs as |
| ------------- | --------------------------- | ---------------- | -------------------------- | --------------- | ------- |
| This site     | `toiladuykhanh.com`, `www.` | 4000             | `/var/www/webofficial`     | `nextjs-app`    | root    |
| Chijuly ERP   | `chijuly.toiladuykhanh.com` | 3000             | `/var/www/chijuly`         | `chijuly`       | root    |
| Learn Chinese | `thh.toiladuykhanh.com`     | 3001 (all IPs)   | `/var/www/learn-chinese`   | `learn-chinese` | root    |

Databases listen on localhost only and require a password.

| Engine     | Databases                                          | App users                                             |
| ---------- | -------------------------------------------------- | ----------------------------------------------------- |
| PostgreSQL | `khanhwebsite`, `chijuly_erp`, `learn_chinese`     | `khanhwebsite`, `chijuly_user`, `learn_chinese_user`  |
| MongoDB    | `my_teaching_platform`, `learn_chinese_auth`, more | `teaching_user`, `learn_chinese_user`; admin `mongoadmin` |

## Access

### SSH keys on the VPS

| User | Key comment                          | Fingerprint (SHA256)                          | Private key lives in                          |
| ---- | ------------------------------------ | --------------------------------------------- | --------------------------------------------- |
| root | `duykhanh@mac`                       | `7CxqWXIXUWvYglBQltKuJMWogSC9oK5/kqSqPOWnuGM` | Owner's Mac, `~/.ssh/id_ed25519`              |
| root | `github-actions-webofficial-2026-10` | `PXCEtQca2piiSb0gv9mkv3givWhd240r4U75TN9sm0E` | GitHub `webofficial` env `production` only    |
| root | `github-actions-learn-chinese`       | `wrof+vJioVdv1NqfTMxJimL8+2YtYQw9r8Ahu80fMsM` | GitHub `learn-chinese` secrets                |
| deploy | `duykhanh@mac`                     | `7CxqWXIXUWvYglBQltKuJMWogSC9oK5/kqSqPOWnuGM` | Owner's Mac                                   |

Check the live list with
`ssh webofficial-vps 'ssh-keygen -lf /root/.ssh/authorized_keys'`.

### Passwords

| Secret                   | Where it lives                       | Used for                          |
| ------------------------ | ------------------------------------ | --------------------------------- |
| Linux `root` password    | Owner's password manager             | VNC console login only (SSH refuses passwords) |
| VNC password (8 chars)   | Owner's password manager             | Contabo VNC                       |
| Contabo account          | Owner's password manager             | Panel, snapshots, VNC             |
| App and database secrets | `/var/www/<app>/.env*`, mode 600     | Apps at runtime                   |
| MongoDB admin password   | `/opt/scripts/backup-databases.sh`   | Nightly backup                    |

### GitHub (`khanhnd2208/webofficial`)

- Only `khanhnd2208` (admin) has access. No deploy keys.
- Environment `production` holds `VPS_SSH_KEY`, `VPS_HOST`, `VPS_USER`,
  `VPS_KNOWN_HOSTS`. Only branch `main` may use it. No repository-level secrets.
- `main` requires a pull request and the five CI checks; force-push and deletion
  are blocked. The admin can bypass in an emergency.

## Controls in place

| Control           | Setting                                                                                   | Where                                        |
| ----------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------- |
| SSH               | Keys only, `AllowUsers root deploy`, no forwarding, modern ciphers, `LogLevel VERBOSE`    | `/etc/ssh/sshd_config.d/00-hardening.conf`   |
| Firewall          | UFW: deny incoming except 22, 80, 443                                                     | `ufw status verbose`                         |
| Brute force       | fail2ban `sshd` jail                                                                      | `fail2ban-client status sshd`                |
| Updates           | unattended-upgrades for security pockets                                                  | `/etc/apt/apt.conf.d/50unattended-upgrades`  |
| TLS               | Let's Encrypt via certbot timer                                                           | `certbot certificates`                       |
| Backups           | 02:00 daily, PostgreSQL + every MongoDB DB, 7 days local, copied to Google Drive          | `/opt/scripts/backup-databases.sh`, root cron |
| Backup files      | `/var/backups/db` 750 root:postgres, dump folders 700                                     |                                              |
| Health            | `vps-health` workflow every 3 hours; GitHub emails the owner on failure                   | `.github/workflows/vps-health.yml`           |

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

### Restore a database

Not yet rehearsed; phase 1 runs the first drill and updates this section.
Restore into a scratch database first and compare before touching the real one.

```bash
cd /tmp && tar -xzf /var/backups/db/postgresql/khanhwebsite_<stamp>.tar.gz
sudo -u postgres createdb restore_check
sudo -u postgres psql -d restore_check -f /tmp/khanhwebsite_<stamp>.sql
```

```bash
cd /tmp && tar -xzf /var/backups/db/mongodb/my_teaching_platform_<stamp>.tar.gz
mongorestore --uri '<admin URI>' --nsFrom 'my_teaching_platform.*' \
  --nsTo 'restore_check.*' /tmp/mongodump_my_teaching_platform_<stamp>
```

### Add or rotate an SSH key

1. Generate `ssh-keygen -t ed25519 -a 100 -C "<purpose>-<YYYY-MM>"`.
2. Append the public key to the target user's `authorized_keys`.
3. Test a new connection with the new key.
4. Store the private key where it belongs (GitHub environment secret or the Mac).
5. Remove the old key line, test again, and update the table above.

## Plan

### Phase 1: no root for apps and deploys

- [ ] Run all three apps under the existing `deploy` user (one PM2 for all).
- [ ] CI logs in as `deploy@` with one key per repository; remove CI keys from root.
- [ ] Limit `deploy` sudo to the backup script; drop `sudo pm2` and `sudo nginx`.
- [ ] Rotate `AUTH_SECRET` (signs every user out once) and the MongoDB app password.
- [ ] Back up `learn_chinese` (PostgreSQL); keep the Mongo password off the command line.
- [ ] Move old `.env` backups into `/root`; run one restore drill.
- [ ] Unattended kernel reboot at 04:30 when a patch needs it.

### Phase 2: finishing touches

- [ ] Nginx: `server_tokens off`, TLS 1.2+ everywhere, one HSTS policy, rate limit on sign-in.
- [ ] Learn Chinese listens on `127.0.0.1` only.
- [ ] fail2ban `recidive` jail.
- [ ] `vps-health` also checks SSH config drift, failed units, pending security updates, certificate expiry.
- [ ] Dependabot security updates.

Out of scope on purpose: backup encryption (Google Drive is trusted), one Linux
user per app, auditd/AIDE/CrowdSec, Livepatch.

## Change log

| Date       | Change                                                                                                       | Rollback                                              |
| ---------- | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------- |
| 2026-10-06 | Config backup in `/root/hardening-backup-20261006`                                                           | —                                                     |
| 2026-10-06 | New CI key `github-actions-webofficial-2026-10` in env `production` (main only); repo-level secrets deleted  | Add a key back to `authorized_keys`                   |
| 2026-10-06 | Removed keys `github-actions-deploy` and `github-actions-webofficial-2026-09` from root                      | `authorized_keys.before-key-removal` in the backup    |
| 2026-10-06 | Branch protection on `main`; collaborators removed (only the owner left)                                     | GitHub settings                                       |
| 2026-10-06 | `/var/backups/db` permissions tightened (was 777)                                                            | `backup-perms.txt` in the backup                      |
| 2026-10-06 | Root password reset by the owner; VNC login verified                                                         | —                                                     |
| 2026-10-06 | `00-hardening.conf` for sshd; weak DH moduli removed; cloud-init file no longer enables passwords            | `etc-ssh` in the backup                               |
| 2026-10-06 | `apt upgrade` (MongoDB 8.0.32, Node 22.23.3), kernel 6.8.0-146, reboot                                       | Older kernels 136 and 142 remain in GRUB              |
