# Public UI archive

This directory preserves retired public-facing UI so it can be reviewed or
restored without keeping obsolete routes in the live marketing website.

## Archive groups

- `home-v1/`: first editorial homepage sections.
- `home-v2/`: second homepage iteration and its test.
- `home-v3/`: the final pre-portfolio homepage iteration and its content.
- `legacy-content/`: retired static content for blog, podcast, lab, services, and cases.
- `legacy-ui/`: retired shared UI, motion, marketing, learner, and public-content widgets.
- `routes-v1/`: retired public marketing, blog, podcast, lab, and archive routes.
- `personality-test-research-2026/`: the canonical archived personality-test feature, including research notes and tests.

An older `personality-test/` copy was removed after a checksum audit proved all
66 of its files were duplicated in `personality-test-research-2026/`. The
removed copy remains recoverable from macOS Trash and Git history.

## Scope boundary

Only public UI is archived for the 2026 portfolio redesign. Admin pages, API
routes, persistence models, database integrations, and existing data remain in
place. Authentication and learner utilities may remain available as internal
or no-index surfaces, but they are not part of the public navigation.

## Restoring a file

Copy the archived implementation back to its original location, then restore
its imports and route/navigation entry. Archived files are intentionally not
imported by the live application.
