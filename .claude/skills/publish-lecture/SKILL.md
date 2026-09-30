---
name: publish-lecture
description: Upload a new or edited Learn lecture (content/learn/<course>/bai-N.md and bai-N-them.md) to production at toiladuykhanh.com through Learn Studio or the admin API. Use when the user wants to upload, publish, update, or sync lecture, quiz, or discussion content.
---

# Publish a lecture to production

Read `.cursor/rules/learn-content.mdc` first; it holds the writing and fidelity
rules this procedure relies on.

## 1. Prepare locally

1. Edit `content/learn/<course>/bai-N.md` (lecture) and `bai-N-them.md` (quiz,
   guide, "Câu hỏi phản biện").
2. If the lecture wording changed, regenerate `bai-N.original.txt` and confirm
   fidelity:
   ```bash
   npx tsx scripts/seed-<course>-course.ts --dry-run   # matchPercent must be 100
   ```
3. Images: put them in `public/learn/<course>/` as WebP under 300 KB. They reach
   production only through a normal pull request and deploy
   (`.claude/skills/ship-change`). Until that deploy is live, leave image lines
   out of the text you publish.
4. Commit the source files on a branch so the repo matches what you publish.

## 2. Compare with production

Production can differ from the files: authors also edit in Studio.

- Open `https://toiladuykhanh.com/my-space/courses/<course>/studio` in the
  browser where the user is already signed in as admin. Never ask for, type, or
  store a password or session token.
- Read the live lesson and sections. List the differences for the user:
  sections to add, sections to change, live edits the files do not have.

## 3. Publish (after the user confirms the list)

- In Studio, paste the changed section content, or call the admin API from that
  signed-in browser session:
  - change a section: `PATCH /api/admin/learn/sections/[id]`
  - add a section: `POST /api/admin/learn/lessons/[id]/sections`
  - add a lesson: `POST /api/admin/learn/courses/[id]/lessons`
  - reorder: `PUT /api/admin/learn/courses/[id]/outline`
- Patch live text where production has its own edits; do not overwrite them.
- Replacing or deleting sections of a published course can delete learner
  progress. Ask again before any replace or delete.
- Before changing a live section, save a restore point:
  `POST /api/admin/learn/sections/[id]/revisions` (a manual revision). Autosave
  snapshots are taken at most once every 10 minutes and only the last 50 are
  kept, so do not rely on them. To undo, list
  `GET /api/admin/learn/sections/[id]/revisions` and restore with
  `POST /api/admin/learn/sections/[id]/revisions/[revisionId]`.

## 4. Verify

- Open the public lesson page and check the changed sections render, including
  headings, lists, and quiz or discussion blocks.
- Tell the user what changed on production, what you left untouched, and any
  follow-up (for example images waiting for a deploy).

Seed scripts never update an existing course. Do not run them against
production to publish edits.
