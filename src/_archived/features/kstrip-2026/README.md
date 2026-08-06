# K'sTrip (archived 2026)

Status: **archived** — preserved under the main site tree, excluded from the
live Next.js build (`src/_archived`).

Hub du lịch & giải trí: party games (Amazing Boardgames). Formerly the
standalone `mytrip/` / `boardgame-together` app.

## Games

| Game | Route (inside this app) | Notes |
|------|-------------------------|--------|
| AI Là Gián Điệp | `/games/spy` | Multiplayer social deduction (MongoDB rooms) |
| Cổng Chợ Đêm | `/games/night-market` | Bluff / bargaining + bots |
| Ma Sói | `/games/mafia` | Host-driven card distribution UI + assets |

Historical marketing home for boardgames on the official site was
`/goc-cua-khanh/boardgame` (also archived; hub redirects to `/du-an`).

## Layout

```
kstrip-2026/
  package.json           # npm scripts → boardgame-together
  boardgame-together/    # Standalone Next.js 16 app
    src/app/games/       # spy · night-market · mafia
    src/app/api/         # spy + night-market room APIs
    src/components/      # kstrip hub, spy, mafia, night-market UI
    public/mafia/        # Role card images (00–17.png)
    docs/                # Design / UX notes
```

The old root folder `mytrip/ma soi/` was a duplicate of `public/mafia/` and was
not retained.

## Run locally (restore / play, not production)

```bash
cd src/_archived/features/kstrip-2026
npm run install:app
cp boardgame-together/.env.example boardgame-together/.env.local
# Set MONGODB_URI in .env.local
npm run dev   # http://localhost:3001
```

Do not wire this app into the main site’s `src/app` or root `package.json`
until product intentionally reactivates it.

## Reactivation checklist

- Consent / privacy for multiplayer rooms and any analytics
- MongoDB connection and room TTL / cleanup policy
- Host pin / room security review
- Decide public URL (subdomain vs path under toiladuykhanh)
- Remove or update permanent redirects if remounting under `/goc-cua-khanh`
