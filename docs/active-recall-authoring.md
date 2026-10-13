# Active Recall authoring

The course workspace is the entry point: open a deck or choose **Tạo bộ thẻ**.
A new deck defaults to a draft. Bulk input is available immediately, including
before the first save.

## Bulk input

1. Paste Q:/A: text (optional QVI:/AVI: translations), CSV, or spreadsheet TSV;
   alternatively choose a UTF-8 CSV/TXT/TSV file under 2 MB.
2. **Kiểm tra dữ liệu** parses locally against the current editor content, including
   unsaved edits. Review questions, answers, translations, errors and actions.
   Preview pages contain 10 rows. Invalid rows, orphan answers, empty input and
   more than 1,000 resulting cards prevent applying the input.
3. **Đưa vào bộ** stages changes in the editor. Append retains existing order and
   updates owned card IDs; new cards go at the end. Replacement requires a
   confirmation and uses input row order. CSV IDs from another deck are rejected;
   remove the ID column when copying exported cards into a new deck.
4. Review the staged cards, then save. Applying an import makes no API write.
   Metadata, edited cards and imported cards are saved together using the existing
   optimistic concurrency check. The paste is cleared only after staging.

Exact duplicates are compared across all four normalized HTML faces, including
translations and formatting, both within the input and against the draft.
Different translations are retained. Owned IDs explicitly request updates.
**Hoàn tác nhập** restores the pre-import cards and source text until another card edit or a save;
replacement preserves owned IDs so existing card tracking remains attached.

The card editor renders 20 cards per page. Switching pages retains edits and
saving writes the complete deck. Validation jumps to the first incomplete card's
page. Save locks text editing and prevents overlapping writes. Errors retain the
editor contents. Pasted input that has not been applied prevents saving rather
than silently omitting it.

## Visibility and lifecycle

- Creation saves a draft, even when populated through bulk import.
- Choose **Công khai**, then **Lưu và công khai**, when the content is ready.
  A published deck's edits become visible on save. A class must also enable that
  deck in its recall workspace to display it to its students.
- **Lưu trữ** confirms the action and saves current edits together with the
  archived status. Invalid/pending input blocks this write. Archiving hides the
  deck from students and retains its contents. Choose draft and save to restore.
- The shared leave guard protects navigation links, browser Back and tab close
  when edits or unapplied input remain. It offers staying, discarding, or saving
  before leaving. Saving cannot silently discard unapplied input.

The existing admin import API remains available to scripts and other consumers;
its server-side import behavior is unchanged. CSV/TSV parsing is shared, including
quoted headers and quoted multiline spreadsheet cells.

## Verification

Regression coverage is in `ActiveRecallEditor.test.tsx`,
`RecallRichTextEditor.test.tsx`, `importDraft.unit.test.ts`, and
`parser.unit.test.ts`. Browser visual checks use the real editor with sample data
and the teaching theme, without creating or changing production decks.
