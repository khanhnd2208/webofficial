# 01 — Business Context

> Duy Khánh — personal teaching, publishing and learning platform.
> HANOICAM is retained as the editorial identity for journal content.

## 1. Product vision

The product combines a public personal brand site with a private teaching
workspace. Public pages establish identity, projects, services, notes and a
contact path. Authenticated surfaces provide learning tools and account
features. The admin workspace manages content and teaching operations.

Core domains:

1. Editorial public site: homepage, about, projects, services, notes, policies
   and inquiries.
2. Vocabulary practice: flashcards, MCQ, fill-in-blank, matching and Guess Who.
3. Teaching domain: courses, modules, lessons, enrollment and progress.
4. My Space tests: curated subjects, MCQ question banks, published tests and
   learner sessions.
5. My Class: standalone Course → Lesson → Section → Knowledge Unit learning hub
   with reusable KUs, tests, cohorts and evidence-based analytics.
6. Private messages, profiles and login streaks.

## 2. Personas and access

### Admin / author

Authenticated through Auth.js/Google OAuth with the `admin` role stored in the
MongoDB user record. The admin uses `/admin` to manage posts, courses,
enrollments, vocabulary, inquiries, messages, My Space tests, My Class and users.

### Authenticated learner

Any authenticated user has the `student` role by default. Learners use
`/tai-khoan`, `/vocabulary`, `/hoc/khoa-hoc/*`, `/my-space/tests/*`,
`/my-space/my-class/*` and `/messages/*`. The current active role model is `student | admin`; legacy
`teacher` values are normalized to `student`.

### Public visitor

No login is needed for `/`, `/gioi-thieu`, `/du-an`, `/dich-vu`, `/ghi-chep`
and `/lien-he`. Visitors can browse public content and submit an inquiry.

## 3. Core flows

### Public publishing

```text
Admin writes in `/admin/posts/create`
  → TipTap content + metadata + optional thumbnail
  → save draft or publish
  → post service revalidates affected public paths
  → published content is exposed through the current notes/public adapter
```

### Authentication and authorization

```text
`/dang-nhap`
  → Auth.js Google OAuth
  → server callback reads role from MongoDB
  → role is copied into the JWT/session
  → `/admin` layout checks the server session
  → API routes independently use `withAuth` / `withAdmin`
```

There is no active `src/middleware.ts`; page protection is implemented in the
admin layout and API protection is implemented at the route boundary.

### Vocabulary

```text
Learner or admin creates/receives a vocabulary set
  → words are stored in PostgreSQL through Prisma
  → learner practices via a selected game mode
  → `/api/vocab-sets/[id]/score` stores personal best scores
```

### Courses and tests

Courses follow `Course → CourseModule → Lesson`. Enrollment and lesson
completion are separate relational records. My Space tests use
`Subject → SpaceTest → McqQuestion` plus `SpaceTestSession` for attempts and
engagement analytics.

### Contact and private communication

```text
Visitor submits `/lien-he`
  → `/api/inquiries` validates and rate-limits
  → inquiry is stored in MongoDB
  → optional Resend delivery notifies the configured inbox
  → admin triages it in `/admin/inquiries`
```

Private messages use `/messages/*` and `/m/[slug]`; the public view may require
an unlock/password flow.

## 4. Domain ownership

| Domain | Storage | Active code |
|---|---|---|
| Auth.js users, profiles, posts, inquiries, messages, streaks | MongoDB | `src/models`, `src/lib/dbConnect.ts`, `src/services` |
| Vocabulary sets, words, library, scores | PostgreSQL | `prisma/schema.prisma`, `vocabSetService`, `scoreService` |
| Courses, lessons, enrollment, progress | PostgreSQL | `src/features/courses`, `enrollments`, `progress` |
| My Space subjects, questions, tests, sessions, personal progress | PostgreSQL | `src/features/myspace-tests` |
| Public marketing/editorial composition | Source files + Mongo-backed notes | `src/content`, `src/features/portfolio`, `src/features/services` |

PostgreSQL `userId` fields are string references to MongoDB Auth.js user IDs;
the databases do not share foreign keys.

## 5. Product boundaries

- Public marketing navigation must not expose unfinished or internal tools.
- `/admin`, `/vocabulary`, `/messages`, `/tai-khoan` and learner routes use
  internal chrome rather than public marketing chrome.
- `src/_archived` and `docs/archive` describe retired products; they are not
  implementation guidance for new work.
- Use `src/config/routes.ts` and `src/config/navigation.ts` as URL/navigation
  sources of truth.
