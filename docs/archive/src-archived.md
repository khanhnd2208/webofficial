# Retired source code (`src/_archived`)

Until 2026-09-30 the repo kept retired UI and product experiments under
`src/_archived/` (355 files, about 47 MB, mostly K'sTrip card art). Nothing in
the live app imported it; TypeScript, Vitest, and ESLint excluded it.

It was removed from `main` to keep the working tree and code search focused on
the live app. The files stay in git history.

## Restoring

Commit `4e3e2ff` on `main` is the last commit that has the folder.

```bash
# Browse it without touching your branch
git show 4e3e2ff:src/_archived/README.md
git ls-tree -r --name-only 4e3e2ff -- src/_archived

# Bring one part back into the working tree
git checkout 4e3e2ff -- src/_archived/features/personality-test-research-2026
```

After restoring, re-add the exclusions it needs (`tsconfig.json`,
`vitest.config.ts`, `eslint.config.mjs`) or move the code into the live tree
deliberately: routes, imports, navigation, and an area in
`scripts/areas/areas.mjs`.

## What was there

```
src/_archived/
  homepage/          # Pre-portfolio homepage iterations
    v1/
    v2/
    v3/
  marketing/         # Retired marketing surfaces
    content/         # Static content (blog, podcast, lab, services, cases…)
    ui/              # Shared widgets (motion, marketing, public-content…)
    routes-v1/       # Page implementations for retired public routes
  features/          # Self-contained product modules
    personality-test-research-2026/
    kstrip-2026/     # K'sTrip party-game hub (spy, night-market, mafia)
```

| Group | What it preserves |
|-------|-------------------|
| `homepage/v1`–`v3` | Editorial homepage sections before the portfolio redesign |
| `marketing/content` | Blog, podcast, lab, services, cases, pricing, audiences |
| `marketing/ui` | Shared marketing / learner / public-content widgets |
| `marketing/routes-v1` | `/bai-viet`, `/phat-trien-ban-than`, `/goc-cua-khanh`, `/dong-hanh`, `/case-study`, `/giang-day`, `/hoc` hubs, `/archive` |
| `features/personality-test-research-2026` | Full personality-test research feature (UI, API, scoring, docs) |
| `features/kstrip-2026` | K'sTrip / MyTrip boardgame hub (standalone Next app) |

