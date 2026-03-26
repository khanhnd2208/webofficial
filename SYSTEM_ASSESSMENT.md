# 📋 BÁO CÁO ĐÁNH GIÁ HỆ THỐNG (System Assessment Report)

**Dự án:** HANOICAM — Teaching Platform  
**Ngày đánh giá:** 2026-03-19  
**Đánh giá bởi:** Principal System Architect  
**Tech Stack:** Next.js 16 (App Router) + TypeScript + MongoDB/Mongoose + NextAuth v5 + TailwindCSS v4 + TipTap Editor  

---

## 1. PHÂN TÍCH KIẾN TRÚC HIỆN TẠI

### 1.1 Design Patterns đang dùng

| Pattern | Vị trí | Đánh giá |
|---------|--------|----------|
| **Service Layer Pattern** | `src/services/` | ✅ Tốt — tách biệt business logic khỏi API routes |
| **DTO Pattern** | `src/types/` chứa DTOs, services map Model→DTO | ✅ Tốt — không leak Mongoose documents ra client |
| **Repository Pattern** (ngầm) | Services trực tiếp query Mongoose | ⚠️ Trung bình — services đóng vai trò vừa repository vừa service |
| **Singleton Pattern** | `dbConnect.ts`, `mongodbClient.ts` dùng global cache | ✅ Tốt — chuẩn Next.js |
| **Strategy Pattern** (Auth) | `auth.config.ts` (Edge) + `auth.ts` (Node) | ✅ Tốt — tuân thủ Auth.js v5 edge-compatibility guide |
| **Middleware Guard** | `middleware.ts` bảo vệ `/admin` | ✅ Tốt — role-based access control |

### 1.2 Luồng dữ liệu (Data Flow)

```
Client Component → fetch('/api/...') → API Route Handler → Service Layer → Mongoose Model → MongoDB
                                              ↓
Server Component → import service trực tiếp → Service Layer → Mongoose Model → MongoDB
```

**Nhận xét:**
- Luồng dữ liệu rõ ràng, tách biệt server/client boundary.
- Server components (như `DashboardPage`, `Home`) gọi thẳng services — hiệu năng tốt, ít overhead.
- Client components gọi qua API routes — đúng pattern.
- Sử dụng `unstable_cache` cho public post queries — tốt cho performance.

### 1.3 Cách tổ chức Folder hiện tại

```
src/
├── app/          # Pages + API routes (App Router)
├── components/   # TẤT CẢ components gộp chung (flat)
├── constants/    # Chỉ có 1 file (post.ts)
├── lib/          # Auth, DB connection
├── models/       # Mongoose schemas + interfaces
├── services/     # Business logic layer
├── types/        # DTO type definitions
└── utils/        # Utility functions
```

**Điểm mạnh:**
- Tách biệt rõ ràng: models / services / types / API routes
- Consistent naming convention cho files (camelCase)

**Điểm yếu:**
- `components/` chứa 20+ files phẳng, không phân nhóm — khó tìm khi dự án lớn hơn
- Không có folder `hooks/` cho custom hooks
- Thiếu `config/` hoặc `env/` để quản lý environment variables
- Không có `middleware/` riêng cho API middleware (rate-limiting, validation)
- `constants/` chỉ có 1 file, nên nhập vào nơi hợp lý hơn

---

## 2. CODE SMELLS & VI PHẠM NGUYÊN TẮC

### 2.1 🔴 Nghiêm trọng (Critical)

#### CS-01: Lặp lặp Error Handling Pattern trong API Routes (Vi phạm DRY)
**Vị trí:** Hầu như tất cả 27 API route files  
**Vấn đề:** Mỗi route handler đều lặp lại pattern:
```typescript
try {
  const user = await getApiUser(request);
  if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  // ... logic ...
} catch (error) {
  const message = error instanceof Error ? error.message : 'Unknown error';
  return NextResponse.json({ ok: false, error: message }, { status: 400 });
}
```
→ **~80+ dòng code lặp lại** chỉ riêng auth check + error handling.

#### CS-02: Inconsistent Auth Check giữa các admin routes
**Vị trí:** `api/admin/users/route.ts` dùng `auth()` trực tiếp, trong khi `api/admin/posts/route.ts` dùng `isAdmin()` từ `apiAuth.ts`.  
→ Hai cách kiểm tra admin khác nhau cho cùng một mục đích.

#### CS-03: Type Assertions quá mức (as unknown as)
**Vị trí:** Hầu hết services — `commentService.ts`, `postService.ts`, `vocabSetService.ts`  
**Vấn đề:** Pattern `as unknown as PostLean` xuất hiện ~40+ lần. Mongoose `.lean()` không trả về đúng type, dẫn đến chuỗi type casting nguy hiểm mất type safety.

### 2.2 🟡 Trung bình (Warning)

#### CS-04: Inline Lean Types lặp lại trong mỗi service
**Vấn đề:** Mỗi service tự định nghĩa `CommentLean`, `PostLean`, `FeedbackLean` — là bản copy sơ sài của Model interface. Vi phạm DRY.

#### CS-05: Inconsistent API Response Format
- Admin users routes trả về `{ error: 'Forbidden' }` (không có `ok: false`)
- Mọi route khác trả về `{ ok: false, error: '...' }`
→ Client phải xử lý 2 format khác nhau.

#### CS-06: `formatDate` và `timeAgo` trùng lặp
- `utils/formatDate.ts` có `formatDistanceToNow()`
- `components/Navbar.tsx` tự implement `timeAgo()`
- `app/page.tsx` tự implement `formatDate()` và `formatNumber()`
→ 3 nơi khác nhau implement cùng một logic.

#### CS-07: Hardcoded Admin Emails
**Vị trí:** `auth.ts` dòng 24-27  
```typescript
const ADMIN_EMAILS = ['khanhnd2208@gmail.com', process.env.ADMIN_EMAIL]
```
→ Nên đưa vào config/env hoàn toàn, không hardcode.

#### CS-08: Mongoose Model Registration Pattern không nhất quán
- Một số dùng: `(mongoose.models.X as Model<IX>) || mongoose.model<IX>('X', Schema)`
- Một số dùng: `mongoose.models.X ?? mongoose.model<IX>('X', Schema)`
→ `??` và `||` có semantic khác nhau (falsy vs nullish).

### 2.3 🟢 Nhẹ (Info)

#### CS-09: Magic Numbers
- `limit(200)`, `limit(500)`, `maxlength: 2000`, `slice(-90)` — nên extract thành constants.

#### CS-10: Navbar component quá lớn (~280 dòng)
- Chứa notification dropdown, user menu, mobile menu, auth logic — nên tách nhỏ.

#### CS-11: Missing Input Validation
- Nhiều API routes tin tưởng `request.json()` mà không validate schema (Zod/Yup).
- `api/vocab-stats/route.ts`: `const results = body.results` — không validate structure.

---

## 3. ĐÁNH GIÁ BẢO MẬT

### ✅ Điểm mạnh
- Auth.js v5 JWT-based sessions — edge-compatible, secure
- Admin routes protected ở cả middleware (edge) và API level (server)
- Cookie settings: `httpOnly`, `sameSite: 'lax'`, `secure` (production)
- File upload chỉ cho admin, giới hạn 5MB, validate MIME type
- RBAC: student/teacher/admin roles

### ⚠️ Rủi ro cần cải thiện
| Rủi ro | Mức độ | Mô tả |
|--------|--------|-------|
| **Thiếu Rate Limiting** | 🔴 Cao | Không có rate limiting cho API endpoints. Dễ bị spam reactions, comments, feedback |
| **Thiếu CSRF cho mutations** | 🟡 TB | NextAuth cookie-based session dùng sameSite lax nhưng thiếu CSRF token cho custom API |
| **Upload lưu local filesystem** | 🟡 TB | `public/uploads/` — không scale trên nhiều instances. Nên dùng S3/Cloudinary |
| **No Input Sanitization** | 🟡 TB | Comment content, feedback — dùng `trim()` nhưng không sanitize HTML/XSS |
| **Thiếu API Validation** | 🟡 TB | Không dùng Zod/Yup — type check runtime yếu |
| **Hardcoded admin email** | 🟢 Nhẹ | Nên dùng env variable thuần túy |

---

## 4. ĐÁNH GIÁ HIỆU NĂNG

### ✅ Tốt
- `unstable_cache` cho read-heavy public queries (posts, tags, categories) — revalidate 60s
- Mongoose connection pooling (`maxPoolSize: 10`)
- Bulk operations: `WordStats.bulkWrite()` cho practice results
- Compound indexes tốt: `{ isPublished: 1, createdAt: -1 }`, text indexes cho search
- Promise.all cho parallel queries (adminDashboardService, DashboardPage)
- TTL index trên notifications (90 days auto-delete)

### ⚠️ Cần cải thiện
| Vấn đề | Mức độ | Mô tả |
|--------|--------|-------|
| **Homepage load 100 posts** | 🔴 Cao | `getAllPosts(1, 100)` — load tất cả posts cho homepage, thiếu pagination UI |
| **N+1 trong comment tree** | 🟡 TB | `getCommentsByPostId` load toàn bộ comments, build tree in-memory |
| **No Image Optimization** | 🟡 TB | Thumbnails không qua optimization pipeline, `<img>` thay vì `<Image>` component |
| **Thiếu ISR/SSG** | 🟡 TB | Blog pages có thể static generate, hiện đang dùng SSR + cache |
| **VocabSet terms embedded** | 🟢 Nhẹ | 2000 terms max embedded trong 1 document — đủ nhưng cần monitor |

---

## 5. ĐÁNH GIÁ KHẢ NĂNG MỞ RỘNG (Scalability)

### ✅ Scalable
- Stateless JWT sessions — horizontal scaling OK
- Service layer tách biệt — dễ test, dễ thay implementation
- Clear DTO boundaries — API contract ổn định

### ⚠️ Bottlenecks
| Vấn đề | Mức độ | Mô tả |
|--------|--------|-------|
| **Dual DB client** | 🟡 TB | `dbConnect.ts` (Mongoose) + `mongodbClient.ts` (native MongoClient) — 2 connection pools |
| **Thiếu API versioning** | 🟡 TB | `/api/posts` → nếu đổi contract, client cũ sẽ break |
| **No caching layer** | 🟡 TB | Chỉ dùng `unstable_cache` (memory) — không có Redis/external cache |
| **File upload không scalable** | 🟡 TB | Local filesystem — multi-instance deployment sẽ mất files |

---

## 6. KẾT LUẬN TỔNG QUAN

| Khía cạnh | Điểm (1-10) | Nhận xét |
|-----------|-------------|----------|
| **Kiến trúc** | 7/10 | Service layer pattern tốt, nhưng cần tách rõ hơn (validation, error handling) |
| **Code Quality** | 6/10 | Nhiều code lặp lại, type casting quá mức, thiếu validation |
| **Bảo mật** | 6/10 | Auth tốt, nhưng thiếu rate limiting và input sanitization |
| **Hiệu năng** | 7/10 | Caching + indexing tốt, nhưng homepage load quá nặng |
| **Mở rộng** | 6/10 | Tách biệt layers tốt, nhưng có bottleneck ở DB connection và file storage |
| **Maintainability** | 6/10 | Flat component structure, thiếu testing, thiếu documentation |

**Điểm trung bình: 6.3/10** — Codebase hiện tại có kiến trúc nền tảng tốt nhưng cần refactor để chuẩn hóa, giảm code lặp, và tăng cường bảo mật.
