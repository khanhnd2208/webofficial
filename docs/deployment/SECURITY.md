# Server security

The server security record (inventory, access, controls, runbooks, and the
change log) lives in the private repository
[`khanhnd2208/vps-infra`](https://github.com/khanhnd2208/vps-infra), file
`docs/SECURITY.md`.

## Rules for people and AI agents

1. Read that record before changing anything on the VPS or in GitHub settings.
2. Before a change, back up the files you touch and keep a rollback.
3. Any SSH change starts a rollback timer, tests a new connection, then cancels
   the timer.
4. Do not start an app or run the process manager as root.
5. After a change, add a line to the change log in vps-infra `docs/SECURITY.md`.
6. Never write a password, private key, token, or environment value in this
   repository.

## GitHub

`main` needs a pull request and the two CI checks, `Static checks and tests`
and `Build and end-to-end tests`. The `production` environment accepts only
`main`.
