## What and why

<!-- One or two sentences: what changes for users or for maintainers, and why. -->

## Area

<!-- See docs/areas.md. Tick every area this PR touches. -->

- [ ] Boardgame
- [ ] Classroom
- [ ] Portfolio
- [ ] Tools
- [ ] Shared code (runs every end-to-end spec)

## Checklist

- [ ] Each commit is one kind of change (move, formatting, or behaviour)
- [ ] New folders or routes are in `scripts/areas/areas.mjs`, and `npm run areas:sync` was run
- [ ] New persistent data uses PostgreSQL with a Prisma migration (see docs/03-CODING_STANDARDS.md §11.1)
- [ ] No file under `OVERSIZED_FILE_CAPS` grew; any split file has a lower cap
- [ ] `npm run check` passes locally, or CI is green
- [ ] Docs updated if behaviour, structure, or deployment changed

## How it was tested

<!-- Commands run, screens checked, and anything not covered. -->
