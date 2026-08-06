# Public UI & feature archive

Retired public UI and standalone product experiments live here so they can be
reviewed or restored without shipping in the live marketing site.

TypeScript, Vitest, and Next.js exclude this tree (`tsconfig.json`,
`vitest.config.ts`). Nothing under `_archived` is imported by the live app.

## Layout

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

## Scope boundary

Archiving here means **source preservation**, not live routes.

- Live marketing redirects for retired hubs live in `src/config/routes.ts`
  (`PUBLIC_REDIRECTS`).
- Admin pages, main-site APIs, auth, courses, vocabulary, and messages stay in
  the active tree when still operational.
- Feature archives (personality test, K'sTrip) keep their own app/API/layout
  snapshots; they are not mounted under `src/app`.

## Restoring

1. Copy the archived implementation back to its original active path (or mount
   a feature under `src/app` / a workspace package).
2. Restore imports, route constants, and navigation entries deliberately.
3. For `features/kstrip-2026`, see that folder’s README — it is a nested
   Next.js app (historically port `3001`), not a route slice of the main site.
