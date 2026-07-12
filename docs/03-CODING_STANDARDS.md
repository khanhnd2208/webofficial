# 03 — Coding Standards

> The Developer Rulebook. Every pattern documented here exists in the current codebase.  
> When in doubt, **follow the pattern shown**, not what you think is "better."

---

## 1. API Route Wrappers — `src/lib/apiUtils.ts`

All API route handlers **must** use one of the three wrappers below. Raw `async function GET(...)` declarations are forbidden.

### 1.1 Wrapper Reference

| Wrapper | Auth Required | Admin Required | Use When |
|---------|:---:|:---:|---------|
| `withErrorHandling` | ❌ | ❌ | Public read endpoints (posts, categories, search) |
| `withAuth` | ✅ | ❌ | Any authenticated user (vocab, streak, profile, comments) |
| `withAdmin` | ✅ | ✅ | Admin-only mutations (post CRUD, user roles, uploads) |

### 1.2 Handler Signatures

```typescript
// Public route — no user context
export const GET = withErrorHandling(async (request: NextRequest, context) => {
  const { slug } = await context!.params;   // dynamic route params
  const data = await somePublicService(slug);
  return apiSuccess(data);
});

// Authenticated route — user injected automatically
export const GET = withAuth(async (_request: NextRequest, user) => {
  const items = await myService(user.id);   // user.id, user.email, user.name, user.role
  return apiSuccess({ items, total: items.length });
});

// Admin-only route — user.role === 'admin' guaranteed
export const POST = withAdmin(async (request: NextRequest, _user, context) => {
  const { id } = await context!.params;
  const body = (await request.json()) as Record<string, unknown>;
  const result = await adminService(id, body);
  return apiSuccess(result, 201);
});
```

### 1.3 The `ApiUser` Type (from `src/lib/apiAuth.ts`)

```typescript
interface ApiUser {
  id: string;      // MongoDB ObjectId as string
  email: string;
  name: string;
  role: string;    // 'student' | 'teacher' | 'admin'
  image?: string;
}
```

---

## 2. API Response Format

Every API response — success or error — **must** follow this exact shape. No exceptions.

### 2.1 Success

```typescript
// Always use apiSuccess() — never hand-write NextResponse.json()
return apiSuccess(data);           // 200 OK
return apiSuccess(data, 201);      // 201 Created
return apiSuccess(null);           // 200 with no payload (e.g. after delete)

// Wire format:
{ "ok": true, "data": <payload> }
```

### 2.2 Error

```typescript
// Always use apiError() — never hand-write NextResponse.json({ error: ... })
return apiError('Not found', 404);       // 404
return apiError('Invalid role', 400);    // 400
return apiError('Forbidden', 403);       // 403 (wrappers handle 401/403 automatically)

// Wire format:
{ "ok": false, "error": "<message>" }
```

### 2.3 Client-Side Consumption Pattern

```typescript
const res = await fetch('/api/vocab-sets');
const json = await res.json() as { ok: boolean; data?: VocabSetListItemDTO[]; error?: string };
if (!json.ok) {
  setError(json.error ?? 'Unknown error');
  return;
}
const items = json.data;
```

### 2.4 HTTP Status Code Conventions

| Status | When |
|--------|------|
| `200` | Successful GET / PATCH / DELETE |
| `201` | Successful POST (resource created) |
| `400` | Bad request, validation error |
| `401` | Missing or invalid session |
| `403` | Authenticated but insufficient role |
| `404` | Resource not found |

---

## 3. Error Handling

### 3.1 In API Routes — Never Write `try/catch`

The wrappers handle all errors. Any exception thrown inside a handler is caught and converted to `apiError(message, 400)`.

```typescript
// ✅ Correct
export const GET = withAuth(async (_req, user) => {
  const data = await serviceCall(user.id);   // if this throws, wrapper catches it
  return apiSuccess(data);
});

// ❌ Never do this
export async function GET(request: NextRequest) {
  try {
    const user = await getApiUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // ...
  } catch (error) {
    return NextResponse.json({ error: 'Unknown error' }, { status: 400 });
  }
}
```

### 3.2 In Services — Throw Errors Freely

Services are pure business logic. They throw standard `Error` instances. The wrapper in the calling API route catches them.

```typescript
// ✅ Correct — throw, let the wrapper format the response
export async function setUserRole(id: string, role: UserRole): Promise<boolean> {
  await dbConnect();
  if (!mongoose.isValidObjectId(id)) throw new Error('Invalid user ID');
  const result = await User.updateOne({ _id: id }, { $set: { role } });
  return result.modifiedCount > 0;
}
```

### 3.3 Intentional Early Returns in Route Handlers

Use `apiError()` for expected business-rule rejections (not exceptions):

```typescript
export const PATCH = withAdmin(async (req, user, context) => {
  const { id } = await context!.params;
  const body = await req.json() as { role?: string };
  const role = body.role as UserRole;

  if (!VALID_ROLES.includes(role)) {
    return apiError('Invalid role', 400);    // ← business rule rejection
  }

  if (user.id === id && role !== 'admin') {
    return apiError('Không thể tự thay đổi role của chính mình', 400);
  }

  const ok = await setUserRole(id, role);
  if (!ok) return apiError('User not found', 404);
  return apiSuccess({ role });
});
```

---

## 4. Type Safety Rules

### 4.1 Mongoose Lean Document Types — `src/types/mongoose.ts`

When calling `.lean()` on a Mongoose query, cast using the project-provided utility types instead of `as unknown as`:

```typescript
import type { LeanDoc } from '@/types/mongoose';
import type { IPost } from '@/models/Post';

// ✅ Correct
const post = await Post.findById(id).lean() as LeanDoc<IPost> | null;
// post._id → string
// post.createdAt → string | undefined

// ❌ Avoid (legacy pattern — still exists in some services, do not propagate)
const post = await Post.findById(id).lean() as unknown as PostLean | null;
```

The `LeanDoc<T>` type:
- Replaces `_id` with `string`
- Makes `createdAt` and `updatedAt` optional strings (serialized)
- Preserves all other fields from the model interface `T`

The `WithId<T>` type is used when a service maps `_id → id`:
```typescript
type WithId<T> = Omit<T, '_id'> & { id: string };
```

### 4.2 Mongoose Model Registration — Nullish Coalescing

All model files **must** use `??` (nullish coalescing) for the hot-reload registration guard — **not** `||` (logical OR).

```typescript
// ✅ Correct — ?? only falls through if the left side is null or undefined
const Post =
  (mongoose.models.Post as Model<IPost>) ??
  mongoose.model<IPost>('Post', PostSchema);

// ❌ Wrong — || falls through on any falsy value (0, '', false) — semantically incorrect
const Post = mongoose.models.Post || mongoose.model<IPost>('Post', PostSchema);
```

### 4.3 DTO Pattern — Never Leak Mongoose Documents

Services **must** map Mongoose documents to plain DTO objects before returning them. No `Document`, `HydratedDocument`, or `_id` as `ObjectId` should cross the service boundary.

```typescript
// ✅ Correct — service returns plain DTO
function toDTO(doc: LeanDoc): VocabSetDTO {
  return {
    id: String(doc._id),          // ObjectId → string
    title: doc.title,
    createdAt: new Date(doc.createdAt).toISOString(),  // Date → ISO string
    // ...
  };
}

export async function getVocabSetById(id: string): Promise<VocabSetDTO | null> {
  const doc = await VocabSet.findById(id).lean() as LeanDoc | null;
  if (!doc) return null;
  return toDTO(doc);   // ← plain object, safe to serialize
}
```

### 4.4 Request Body Typing

Never use `any` for request bodies. Use `unknown` and narrow:

```typescript
// ✅ Correct
const body = (await request.json()) as unknown;
if (typeof body !== 'object' || body === null) return apiError('Invalid body', 400);
const { subject, content } = body as { subject?: unknown; content?: unknown };
if (typeof subject !== 'string' || !subject.trim()) return apiError('Subject required', 400);

// For simple admin mutations where schema is well-known:
const body = (await request.json()) as Record<string, unknown>;
```

---

## 5. Centralized Configuration

**Never hardcode magic numbers in component or route files.**

### 5.1 `src/config/constants.ts` — Numbers and Limits

```typescript
import {
  MAX_TERMS_PER_SET,         // 2000
  MAX_COMMENT_LENGTH,        // 2000
  MAX_FEEDBACK_REPLIES,      // 200
  MAX_UPLOAD_SIZE_BYTES,     // 5 * 1024 * 1024 (5MB)
  NOTIFICATION_POLL_INTERVAL_MS,  // 30_000
  PUBLIC_CACHE_REVALIDATE_SECONDS, // 60
  SESSION_MAX_AGE_SECONDS,   // 30 * 24 * 60 * 60
  DEFAULT_PAGE_SIZE,         // 20
  MAX_PAGE_SIZE,             // 50
} from '@/config/constants';
```

### 5.2 `src/config/navigation.ts` — Nav Links

```typescript
import { NAV_LINKS, USER_MENU_LINKS } from '@/config/navigation';
// NAV_LINKS: [{ href: '/blog', label: 'Hanoicam Story' }, ...]
// USER_MENU_LINKS: [{ href: '/dashboard', label: 'Dashboard' }, ...]
```

### 5.3 `src/constants/post.ts` — Post Categories (client-safe)

```typescript
import { POST_CATEGORIES, type PostCategory } from '@/constants/post';
// Safe to use in Client Components — no server-side deps
```

---

## 6. Utility Functions — `src/utils/`

Import from the barrel export when using multiple utils:

```typescript
import { formatDate, formatDateShort, timeAgo, formatNumber } from '@/utils';

// Or import directly for tree-shaking clarity:
import { formatDateShort } from '@/utils/formatDate';
import { formatNumber }    from '@/utils/formatNumber';
import { slugify }         from '@/utils/slugify';
```

### 6.1 Date Utilities (`formatDate.ts`)

| Export | Input | Output Example |
|--------|-------|----------------|
| `formatDate(date)` | Date/string/number | `"19/03/2026"` |
| `formatDateTime(date)` | Date/string/number | `"19/03/2026 14:30"` |
| `formatDistanceToNow(date)` | Date/string/number | `"5 phút trước"` |
| `timeAgo` | (alias of above) | `"2 giờ trước"` |
| `formatDateShort(dateStr)` | ISO string | `"19 thg 3, 2026"` (vi-VN locale) |

### 6.2 Number Utilities (`formatNumber.ts`)

```typescript
formatNumber(950)       // "950"
formatNumber(1200)      // "1.2k"
formatNumber(2_500_000) // "2.5M"
```

---

## 7. Naming Conventions

| Category | Convention | Example |
|----------|-----------|---------|
| Component files | PascalCase | `Navbar.tsx`, `BlogSearch.tsx` |
| Utility files | camelCase | `formatDate.ts`, `slugify.ts` |
| Service files | camelCase + `Service` suffix | `postService.ts` |
| Type files | camelCase | `post.ts`, `vocabSet.ts` |
| Model files | PascalCase | `Post.ts`, `VocabSet.ts` |
| Config files | camelCase | `constants.ts`, `navigation.ts` |
| Constants | `UPPER_SNAKE_CASE` | `MAX_TERMS_PER_SET`, `NOTIFICATION_POLL_INTERVAL_MS` |
| Interfaces (Models) | `I` prefix | `IPost`, `IComment`, `IVocabSet` |
| DTOs (Types) | `DTO` suffix | `PostDetailDTO`, `VocabSetDTO`, `UserDTO` |
| Functions | camelCase, verb-first | `getPostBySlug()`, `createComment()`, `recordLogin()` |
| React components | PascalCase | `function Navbar()`, `function StreakFire()` |
| API route exports | `const` + HTTP method | `export const GET = withAuth(...)` |

---

## 8. Import Order Convention

Maintain this import order within every file:

```typescript
// 1. Node built-ins (if any)
import path from 'node:path';

// 2. External packages
import { NextResponse, type NextRequest } from 'next/server';
import mongoose from 'mongoose';

// 3. Internal — lib (infrastructure)
import { withAuth, apiSuccess, apiError } from '@/lib/apiUtils';
import dbConnect from '@/lib/dbConnect';

// 4. Internal — models
import Post from '@/models/Post';

// 5. Internal — services
import { getPostBySlug } from '@/services/postService';

// 6. Internal — types / config / utils
import type { PostDetailDTO } from '@/types/post';
import { formatDateShort } from '@/utils/formatDate';
```

---

## 9. Component Rules

- **Server Components** are the default. Add `'use client'` only when the component needs browser APIs, event listeners, or React hooks (`useState`, `useEffect`, etc.).
- **File size guideline:** Any component exceeding ~200 lines should be considered for extraction into sub-components.
- **Props typing:** Always define a named `interface Props` (or inline type) for component props — never use implicit `any` or untyped objects.
- **No business logic in components:** Fetch data in Server Components via services, or in Client Components via `fetch('/api/...')`. No direct Mongoose queries from component files.

---

## 10. Testing Standards

### 10.1 Test Projects (Vitest)

| Project | Environment | File pattern | Purpose |
|---------|-------------|--------------|---------|
| `unit` | `node` | `*.unit.test.ts`, `src/lib/__tests__/**` | Pure logic, scoring, utils |
| `integration` | `node` + MongoDB Memory Server + Postgres | `*.integration.test.ts`, `src/services/__tests__/**` | Services, API route contracts |
| `component` | `jsdom` | `*.test.tsx` | React hooks and UI |

Run commands:

```bash
npm run test:unit          # fast — no database
npm run test:integration   # requires DATABASE_URL in .env.local
npm run test:component     # jsdom + Testing Library
npm run test:all           # all projects
npm run test:coverage      # with v8 coverage report
npm run test:e2e           # Playwright smoke tests (requires running app in CI)
npm run test:db:setup      # create + migrate local test Postgres DB
npm run check              # typecheck + lint + test:all + build
```

### 10.2 Harness (`src/test/`)

| Path | Role |
|------|------|
| `src/test/setup.ts` | Global Vitest setup |
| `src/test/setup.integration.ts` | MongoDB Memory Server + env loading |
| `src/test/setup.component.ts` | jsdom + `@testing-library/jest-dom` |
| `src/test/helpers/db.mongo.ts` | In-memory MongoDB lifecycle |
| `src/test/helpers/db.postgres.ts` | Prisma test client + cleanup |
| `src/test/helpers/apiRoute.ts` | Invoke App Router handlers in tests |
| `src/test/factories/user.ts` | `ApiUser` / session fixtures |
| `src/test/fixtures/` | CSV, personality response builders |

### 10.3 Conventions

- Co-locate unit tests: `scoreCalculator.unit.test.ts` next to `scoreCalculator.ts`.
- Service integration tests: `src/services/__tests__/<name>.integration.test.ts`.
- API contract tests: `src/app/api/<route>/__tests__/route.integration.test.ts`.
- Throw `AppError` from `@/lib/appError` in services — **not** from `@/lib/apiUtils` (avoids pulling auth into service imports).
- Integration tests must clean up data in `beforeEach` using harness helpers.
- CI runs on every push/PR via `.github/workflows/ci.yml`. Deploy waits for CI success.
