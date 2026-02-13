This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

> **PROJECT VISION & REQUIREMENTS**
>
> Before contributing, please read the **[Project Brief (Mô tả dự án)](./PROJECT_BRIEF.md)** to understand the Product Owner's vision, user personas, and core business logic.

---

## Run (Local)

First, install deps and run the development server (note: the parent folder name contains a trailing space, so keep the quotes):

```bash
cd "/Users/duykhanh/Documents/Website /my-teaching-platform"
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Environment Variables

Create a local `.env.local` (see `.env.example`):

- `MONGODB_URI` (required for DB features)
- `NEXTAUTH_URL`, `NEXTAUTH_SECRET` (Auth.js / NextAuth)
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (Google OAuth)
- `ADMIN_EMAIL` (the Google email that should be granted `admin` role)

Generate a secret with:

```bash
openssl rand -base64 32
```

## MVP (Phase 1) – Test Checklist

### 1) Public navigation

- Home: `http://localhost:3000/`
- Blog list: `http://localhost:3000/blog`
- Blog detail: `http://localhost:3000/blog/<slug>`

### 2) Admin navigation (Writer Studio + Manage Posts)

1) Go to `http://localhost:3000/login` and sign in with Google.
2) Use the email configured in `ADMIN_EMAIL` to gain admin access.

- Admin posts list: `http://localhost:3000/admin/posts`
	- Buttons: **Trang chủ**, **Blog**, **+ Tạo bài**
	- Actions per post: **Sửa**, **Xem** (only when published), **Xoá**
- Create post: `http://localhost:3000/admin/posts/create`
	- Fill: Title, (auto) Slug, Summary, Tags, Thumbnail URL (optional), Publish checkbox, Content (Markdown)
	- Click **Lưu** → shows a link to the created `/blog/<slug>`
- Edit post: `http://localhost:3000/admin/posts/<id>/edit`
	- Change fields + click **Lưu thay đổi**
	- Toggle **Publish** to show/hide in public blog

### 3) Verify Phase 1 features

- Draft vs Published
	- If **Draft**: should NOT appear on `/blog` and `/` latest posts.
	- If **Published**: should appear on `/blog`, `/`, and can open `/blog/<slug>`.
- Markdown rendering
	- Supports tables/task-lists via GFM.
		- Code blocks have a **Copy** button.
- Related posts
	- On `/blog/<slug>`, a **Bài viết liên quan** section shows posts sharing tags (when available).

## API (for testing)

Public:

- `GET /api/posts?page=1&limit=9&tag=...`
- `GET /api/posts/<slug>`
- `POST /api/posts` (admin only)

Admin (admin only):

- `GET /api/admin/posts?page=1&limit=20&published=all|true|false`
- `GET /api/admin/posts/<id>`
- `PATCH /api/admin/posts/<id>`
- `DELETE /api/admin/posts/<id>`

## Folder Structure

This project follows a **Layered Architecture** adapted for Next.js App Router to ensure scalability and maintainability.

```txt
src/
├── app/ # Presentation Layer (App Router)
│   ├── api/ # API Routes (Controller Layer)
│   ├── login/ # Login page
│   ├── layout.tsx # Root layout
│   └── page.tsx          # Home page
├── components/           # Reusable UI Components
├── lib/                  # Infrastructure & Configuration (e.g. MongoDB connection)
├── models/               # Data Access Layer (Mongoose Schemas)
│   ├── User.ts
│   └── Grade.ts
├── services/             # Business Logic Layer (Decoupled from API)
├── types/                # TypeScript Definitions
├── utils/                # Shared Utilities (Pure functions)
└── middleware.ts         # Edge Middleware (Auth guards)
```

## Middleware (Route Guard)

`src/middleware.ts` protects `/dashboard/*` and `/admin/*` routes:

- Not logged in: redirect to `/login?from=...`
- Logged in but not admin and visiting `/admin/*`: redirect to `/dashboard`
- (Optional) Logged in but visiting `/login`: redirect to `/dashboard`

## MongoDB (Mongoose)

- Connection helper: `src/lib/dbConnect.ts`
- Models: `src/models/User.ts`, `src/models/Grade.ts`

## Example API

Route handler: `src/app/api/grades/route.ts`

- `GET /api/grades?studentId=<mongodbObjectId>`
- `POST /api/grades`

Example:

```bash
curl -X POST http://localhost:3000/api/grades \
	-H 'Content-Type: application/json' \
	-d '{"studentId":"<mongodbObjectId>","course":"Math","score":95,"note":"Midterm"}'
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
