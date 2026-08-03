# 📐 KẾ HOẠCH CHUẨN HÓA DỰ ÁN (Standardization Plan)

**Dự án:** HANOICAM — Teaching Platform  
**Ngày lập:** 2026-03-19  
**Dựa trên:** SYSTEM_ASSESSMENT.md  

---

## 1. CẤU TRÚC THƯ MỤC MỚI (Proposed Directory Structure)

```
src/
├── app/                          # Next.js App Router (KHÔNG THAY ĐỔI cấu trúc routes)
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx
│   ├── admin/
│   ├── api/
│   ├── blog/
│   ├── dashboard/
│   ├── feedback/
│   ├── login/
│   ├── profile/
│   └── vocabulary/
│
├── components/                   # 🔄 PHÂN NHÓM theo domain + shared
│   ├── ui/                       # Atomic/shared UI (buttons, modals, inputs)
│   │   └── ... 
│   ├── layout/                   # Layout components
│   │   ├── Navbar/
│   │   │   ├── Navbar.tsx
│   │   │   ├── NotificationDropdown.tsx
│   │   │   ├── UserMenu.tsx
│   │   │   └── MobileMenu.tsx
│   │   └── ScrollToTop.tsx
│   ├── blog/                     # Blog-specific components
│   │   ├── BilingualArticle.tsx
│   │   ├── BlogFilterBar.tsx
│   │   ├── BlogSearch.tsx
│   │   ├── CodeBlock.tsx
│   │   ├── CommentSection.tsx
│   │   ├── ReactionBar.tsx
│   │   ├── ShareBar.tsx
│   │   ├── TableOfContents.tsx
│   │   └── ViewTracker.tsx
│   ├── editor/                   # Editor-related components
│   │   ├── DualLanguageEditor.tsx
│   │   ├── TiptapEditor.tsx
│   │   ├── TagInput.tsx
│   │   ├── ThumbnailUpload.tsx
│   │   ├── ThumbnailPreview.tsx
│   │   └── ImageCropModal.tsx
│   ├── feedback/                 # Feedback-specific components
│   │   └── FeedbackMessages.tsx
│   ├── streak/                   # Streak-specific components
│   │   └── StreakFire.tsx
│   └── providers/                # Context providers
│       ├── Providers.tsx
│       ├── ThemeProvider.tsx
│       └── ThemeToggle.tsx
│
├── config/                       # 🆕 Centralized configuration
│   ├── constants.ts              # App-wide constants (limits, magic numbers)
│   ├── post.ts                   # (moved from constants/post.ts)
│   └── navigation.ts             # Nav links, menu items
│
├── lib/                          # External integrations (GIỮA NGUYÊN)
│   ├── auth.ts
│   ├── auth.config.ts
│   ├── dbConnect.ts
│   ├── mongodbClient.ts
│   ├── apiAuth.ts
│   └── apiUtils.ts               # 🆕 Shared API response/error utilities
│
├── models/                       # Mongoose models (GIỮA NGUYÊN)
│   ├── Comment.ts
│   ├── FeedbackMessage.ts
│   ├── LoginStreak.ts
│   ├── Notification.ts
│   ├── Post.ts
│   ├── User.ts
│   ├── UserProfile.ts
│   ├── VocabSet.ts
│   └── WordStats.ts
│
├── services/                     # Business logic (GIỮA NGUYÊN)
│   └── ...
│
├── types/                        # Type definitions (GIỮA NGUYÊN)
│   └── ...
│
└── utils/                        # Pure utility functions (GIỮA NGUYÊN + bổ sung)
    ├── index.ts
    ├── formatDate.ts
    ├── formatNumber.ts            # 🆕 Extracted from page.tsx
    └── slugify.ts
```

### Tại sao cấu trúc này tốt hơn?

1. **Components phân nhóm theo domain** — dễ tìm, dễ maintain khi dự án scale
2. **Navbar được tách nhỏ** — từ 280 dòng thành 4 modules có trách nhiệm rõ ràng
3. **`config/` tập trung** — constants, navigation links, magic numbers ở 1 nơi
4. **`lib/apiUtils.ts`** — DRY hóa error handling + auth check trong API routes
5. **Không phá vỡ** cấu trúc `app/`, `models/`, `services/`, `types/` — vì đã tốt

---

## 2. QUY CHUẨN CODE (Coding Standards)

### 2.1 Naming Convention

| Loại | Quy tắc | Ví dụ |
|------|---------|-------|
| **Files — Components** | PascalCase | `Navbar.tsx`, `BlogSearch.tsx` |
| **Files — Utilities** | camelCase | `formatDate.ts`, `slugify.ts` |
| **Files — Types** | camelCase | `post.ts`, `vocabSet.ts` |
| **Files — Models** | PascalCase | `Post.ts`, `VocabSet.ts` |
| **Files — Services** | camelCase + `Service` suffix | `postService.ts` |
| **Files — API routes** | `route.ts` (Next.js convention) | — |
| **Variables** | camelCase | `postList`, `currentUser` |
| **Constants** | UPPER_SNAKE_CASE | `MAX_TERMS_PER_SET`, `SESSION_MAX_AGE` |
| **Types/Interfaces** | PascalCase + DTO suffix cho DTOs | `PostDetailDTO`, `IPost` (Model) |
| **Functions** | camelCase, verb-first | `getPostBySlug()`, `createComment()` |

### 2.2 API Response Format (Thống nhất)

```typescript
// ✅ Chuẩn — MỌI API route phải trả format này
interface ApiSuccessResponse<T> {
  ok: true;
  data: T;
}

interface ApiErrorResponse {
  ok: false;
  error: string;
  code?: string;  // Optional machine-readable error code
}

type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
```

### 2.3 Error Handling

```typescript
// ✅ Chuẩn — Sử dụng utility function thay vì lặp try/catch
// Trước (lặp lại 27 lần):
export async function GET(request: NextRequest) {
  try {
    const user = await getApiUser(request);
    if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    // ...
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}

// Sau (sử dụng wrapper):
export const GET = withAuth(async (request, user) => {
  // ... chỉ business logic, không cần try/catch
  return apiSuccess(data);
});
```

### 2.4 Mongoose Lean Type Pattern

```typescript
// ✅ Chuẩn — Sử dụng generic helper thay vì `as unknown as`
// Định nghĩa 1 lần trong lib:
type LeanDocument<T> = Omit<T, keyof Document> & { _id: Types.ObjectId };

// Sử dụng:
const doc = await Post.findById(id).lean<LeanDocument<IPost>>();
// Thay vì: (await Post.findById(id).lean()) as unknown as PostLean | null
```

### 2.5 Module Organization

- **1 file = 1 trách nhiệm chính** (Single Responsibility)
- **Component > 200 dòng** → xem xét tách nhỏ
- **Tất cả "magic numbers"** → extract sang `config/constants.ts`
- **Import order:** external libs → `@/lib` → `@/services` → `@/components` → relative

---

## 3. ROADMAP THỰC THI (Action Plan)

### Step 1: Tạo API Utilities — DRY hóa API Routes
**Phạm vi:** `src/lib/apiUtils.ts` (NEW)  
**Mục tiêu:** Tạo wrapper functions `withAuth()`, `withAdmin()`, `apiSuccess()`, `apiError()` để loại bỏ ~80 dòng code lặp khắp 27 API routes.  
**Breaking changes:** Không — chỉ thêm file mới, API routes sẽ được refactor dần.

### Step 2: Thống nhất API Response Format cho Admin Routes
**Phạm vi:** `src/app/api/admin/users/` (3 files)  
**Mục tiêu:** Đổi response format từ `{ error: '...' }` sang `{ ok: false, error: '...' }` để nhất quán.  
**Breaking changes:** Client admin UI cần check — nhưng minor vì admin chỉ có 1 user.

### Step 3: Extract Constants & Config
**Phạm vi:** Tạo `src/config/constants.ts`, `src/config/navigation.ts`; di chuyển `src/constants/post.ts` → `src/config/post.ts`  
**Mục tiêu:** Tập trung magic numbers, nav links, limits.  
**Breaking changes:** Cần update imports.

### Step 4: Extract Utils — formatNumber, timeAgo
**Phạm vi:** `src/utils/formatNumber.ts` (NEW), cập nhật `src/utils/index.ts`  
**Mục tiêu:** Loại bỏ duplicate formatDate/timeAgo/formatNumber từ `page.tsx` và `Navbar.tsx`.  
**Breaking changes:** Không.

### Step 5: Tách Navbar thành sub-components
**Phạm vi:** `src/components/layout/Navbar/` (NEW folder)  
**Mục tiêu:** Tách 280-line Navbar.tsx thành: Navbar.tsx, NotificationDropdown.tsx, UserMenu.tsx, MobileMenu.tsx  
**Breaking changes:** Cần update import trong `layout.tsx`.

### Step 6: Phân nhóm Components theo domain
**Phạm vi:** Di chuyển components vào sub-folders (`blog/`, `editor/`, `feedback/`, `streak/`, `providers/`, `layout/`, `ui/`)  
**Mục tiêu:** Tổ chức code rõ ràng hơn.  
**Breaking changes:** Cần update tất cả imports — dùng barrel exports để giảm tác động.

### Step 7: Fix Inconsistent Mongoose Model Registration
**Phạm vi:** Tất cả files trong `src/models/`  
**Mục tiêu:** Thống nhất dùng `??` (nullish coalescing) thay vì `||` (falsy check).  
**Breaking changes:** Không — behavioral equivalent trong trường hợp này.

### Step 8: Refactor API Routes dùng apiUtils wrappers
**Phạm vi:** Tất cả 27 API route files  
**Mục tiêu:** Áp dụng `withAuth()`, `withAdmin()` wrappers từ Step 1.  
**Breaking changes:** Không — chỉ internal refactor.

### Step 9: Fix Type Safety — Lean Document Types
**Phạm vi:** Tất cả services có `as unknown as`  
**Mục tiêu:** Tạo `src/types/mongoose.ts` với `LeanDocument<T>` generic, thay thế inline type assertions.  
**Breaking changes:** Không.

### Step 10: Thêm Input Validation với Zod (Optional, nếu có thời gian)
**Phạm vi:** Các API routes có mutation (POST, PATCH, PUT, DELETE)  
**Mục tiêu:** Validate request body tại API layer trước khi gọi services.  
**Breaking changes:** Không — chỉ thêm validation, reject invalid requests sớm hơn.

---

## 4. ƯU TIÊN THỰC THI

| Ưu tiên | Steps | Lý do |
|---------|-------|-------|
| 🔴 **Cao** | Step 1, 2, 8 | Giảm code lặp lớn nhất, cải thiện maintainability ngay |
| 🟡 **TB** | Step 3, 4, 7, 9 | Chuẩn hóa code quality, DRY |
| 🟢 **Thấp** | Step 5, 6, 10 | Cải thiện tổ chức, không ảnh hưởng runtime |

**Ước tính tổng thời gian:** 8-12 sessions  
**Rủi ro:** Thấp — tất cả steps đều backward-compatible, có thể rollback từng step.
