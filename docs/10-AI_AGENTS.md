# 10 — AI agents: quy tắc và cấu hình harness

Tài liệu này giải thích cách repo hướng dẫn AI agent (Claude Code, Codex, Cursor) làm việc an toàn, và vì sao cấu hình được chia như hiện tại để tốn ít token nhất. "Harness" ở đây là phần bao quanh model: file hướng dẫn, luật theo đường dẫn, skill, hook, và quyền.

## 1. Các tầng hướng dẫn

| Tầng | File | Ai đọc | Khi nào nạp vào ngữ cảnh | Kích thước |
| --- | --- | --- | --- | --- |
| Luật chung | `AGENTS.md` (Claude đọc qua `CLAUDE.md` = `@AGENTS.md`) | Claude, Codex, Cursor | Mọi phiên | ~6 KB, khoảng 1.500 token |
| Luật theo đường dẫn | `.cursor/rules/*.mdc`, symlink sang `.claude/rules/*.md` | Cursor (`globs`), Claude (`paths`) | Chỉ khi agent đọc file khớp đường dẫn | 1,3–2,5 KB mỗi file |
| Quy trình nhiều bước | `.claude/skills/<tên>/SKILL.md` | Claude | Mô tả (~300 byte) luôn có; nội dung chỉ nạp khi dùng | 3–3,5 KB mỗi skill |
| Thực thi cứng | `.claude/settings.json` (`permissions`, `hooks`) | Claude Code (client, không phải model) | Không tốn token; hook SessionStart in 1–2 dòng | 0 / ~40 token |
| Tài liệu chi tiết | `docs/*.md` | Mọi agent | Chỉ khi agent tự mở | Tùy file |

Luật theo đường dẫn hiện có: `my-class-ui`, `learn-content`, `prisma`, `vps-deploy`. Mỗi luật chỉ viết một lần trong `.cursor/rules/`. Frontmatter có cả `globs` (Cursor) và `paths` (Claude), hai danh sách phải giống nhau.

Skill hiện có: `ship-change` (từ tạo nhánh đến deploy) và `publish-lecture` (đưa bài giảng lên production).

## 2. Luật mềm và luật cứng

Chữ trong `AGENTS.md` là hướng dẫn: model thường làm theo nhưng không có gì bảo đảm. Những việc không được phép sai thì do client chặn:

| Việc | Cách chặn |
| --- | --- |
| Push lên `main`, `git push` không ghi nhánh, `gh pr merge` | `permissions.ask`: luôn hỏi người dùng, kể cả khi settings cá nhân cho phép `git *` (thứ tự áp dụng là deny → ask → allow) |
| Deploy tay, SSH vào VPS, Prisma migrate hoặc `db push` | `permissions.ask` |
| Force push | `permissions.deny` |
| Đọc mọi file `.env*` (trừ `.env.example`) | `permissions.deny` với `Read(./.env*)` và ngoại lệ `Read(!.env.example)` |
| Đọc file cồng kềnh (`package-lock.json` 526 KB, `.next/`, `coverage/`, báo cáo HTML 160 KB, PDF) | `permissions.deny` |
| Sửa nhầm việc dở của người khác trong thư mục chính | Hook SessionStart báo khi thư mục chính có file chưa commit |
| Code sai khu, file quá 800 dòng, sai format, bản đồ khu lệch | ESLint, Prettier, `areas:check` trong pre-commit và CI |

Codex và Cursor không đọc `.claude/settings.json`. Với các tool đó, hàng rào cứng là CI, hook pre-commit và branch protection trên GitHub (xem mục 5).

## 3. Đánh giá phương án tối ưu token

| Phương án | Tác dụng | Chi phí hoặc rủi ro | Quyết định |
| --- | --- | --- | --- |
| Giữ `AGENTS.md` ngắn (dưới ~150 dòng), chỉ trỏ tới docs | Tiết kiệm ở mọi phiên; model tuân thủ tốt hơn khi file ngắn | Phải giữ kỷ luật khi thêm luật | **Áp dụng** |
| Luật theo đường dẫn thay vì nhét vào `AGENTS.md` | Luật My Class, Prisma, deploy chỉ tốn token khi đụng tới file liên quan | Hai danh sách `globs`/`paths` phải khớp | **Áp dụng** |
| Skill cho quy trình dài | Quy trình ship và đăng bài giảng không chiếm ngữ cảnh khi không dùng | Chỉ Claude dùng được skill | **Áp dụng** |
| `permissions.deny` cho file cồng kềnh | Chặn những lần đọc tốn hàng trăm nghìn token (lockfile khoảng 150k token) | Muốn xem phiên bản package thì dùng `npm ls` | **Áp dụng** |
| Hook SessionStart báo trạng thái workspace | ~40 token; tránh lỗi đắt nhất là sửa đè việc dở của người khác | Chạy `git status` mỗi phiên (nhanh) | **Áp dụng** |
| Xóa `src/_archived`, giới hạn 800 dòng mỗi file | Tìm kiếm ít kết quả rác hơn; đọc một file tốn ít token hơn (`src/` từ 53,6 MB xuống 6,5 MB) | File lớn cũ phải tách dần | **Đã áp dụng** |
| `@import` docs vào `CLAUDE.md` | Model luôn thấy docs | File import nạp ở mọi phiên, tốn hàng chục nghìn token | **Không dùng** |
| `CLAUDE.md` riêng trong từng thư mục con | Nạp khi làm việc trong thư mục đó | Trùng với luật theo đường dẫn; Codex và Cursor dùng cơ chế khác | **Chưa cần** |
| Giảm `BASH_MAX_OUTPUT_LENGTH` | Output lệnh ngắn hơn | Mất log lỗi build/test cần để sửa lỗi | **Không dùng**; thay vào đó lọc output bằng `\| tail`, `\| grep` |
| Subagent (Explore) cho tìm kiếm rộng | Kết quả tìm kiếm không đổ vào ngữ cảnh chính | Mỗi subagent bắt đầu lại từ đầu, tốn hơn với việc nhỏ | **Chỉ khi quét rộng nhiều thư mục** |
| Một phiên một việc, `/clear` giữa các việc | Ngữ cảnh không phình vì việc cũ | Không | **Khuyến nghị** |
| Tắt MCP server không dùng cho dự án | Bớt tool | Tool đã được nạp trễ (deferred), lợi ích nhỏ | **Chưa cần** |

## 4. Bảo trì

- Thêm luật mới: nếu áp cho mọi việc thì đưa vào `AGENTS.md` (giữ ngắn); nếu chỉ áp cho một phần code thì tạo `.cursor/rules/<tên>.mdc` với `globs` + `paths`, rồi `ln -s ../../.cursor/rules/<tên>.mdc .claude/rules/<tên>.md`; nếu là quy trình nhiều bước thì viết skill.
- Ghi chú cho người bảo trì trong `CLAUDE.md` hoặc `AGENTS.md` bằng comment HTML `<!-- ... -->`. Claude Code bỏ comment trước khi nạp nên không tốn token.
- Kiểm tra định kỳ trong Claude Code: `/context` (file nào đang nạp), `/doctor prompt-audit` (luật mâu thuẫn hoặc lỗi thời).
- Quyền cá nhân để trong `.claude/settings.local.json` (không commit). Quyền dùng chung để trong `.claude/settings.json`.

## 5. Đề xuất cho người quản trị repo

- **Branch protection cho `main` trên GitHub:** yêu cầu pull request và CI xanh, cấm force push. Đây là hàng rào cứng duy nhất áp cho mọi tool, kể cả Codex và Cursor. Việc này cần quyền admin repo nên chưa bật.
- Chạy `git config blame.ignoreRevsFile .git-blame-ignore-revs` một lần trên mỗi máy.

## 6. Nhánh tạo trước commit format toàn repo

Nhánh bắt đầu trước commit `6ff320b` sẽ xung đột định dạng khi merge. Dùng:

```bash
bash scripts/port-branch-past-format.sh origin/main
```

Script format các file của nhánh ở cả hai phía, lấy phần thay đổi thật, rồi áp lên một nhánh mới `<tên>-ported`. Khi chạy thử với phần sửa trang Giới thiệu/Dịch vụ đang dở (21 file), mọi file áp sạch và qua typecheck, lint, format.
