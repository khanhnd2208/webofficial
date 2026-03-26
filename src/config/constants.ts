/**
 * Centralized application constants.
 *
 * Extract all "magic numbers" and configuration values here
 * so they are easy to find, tune, and reference across the codebase.
 */

// ─── Pagination & Limits ───────────────────────────────────────────────────────

/** Maximum number of terms allowed in a single vocabulary set */
export const MAX_TERMS_PER_SET = 2000;

/** Maximum number of practice history entries per word */
export const MAX_PRACTICE_HISTORY_PER_WORD = 500;

/** Maximum number of login days stored in streak record */
export const MAX_LOGIN_DAYS = 90;

/** Maximum number of replies in a feedback thread */
export const MAX_FEEDBACK_REPLIES = 200;

/** Maximum number of liked-by entries per comment */
export const MAX_COMMENT_LIKES = 10_000;

/** Default page sizes */
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 50;
export const DEFAULT_PUBLIC_PAGE_SIZE = 9;

/** Query limits for list endpoints */
export const MAX_LIST_LIMIT = 500;
export const NOTIFICATION_LIMIT = 50;
export const SEARCH_RESULT_LIMIT = 10;
export const ALL_TERMS_LIMIT = 2000;

// ─── Content Limits ────────────────────────────────────────────────────────────

export const MAX_COMMENT_LENGTH = 2000;
export const MAX_FEEDBACK_SUBJECT_LENGTH = 200;
export const MAX_FEEDBACK_CONTENT_LENGTH = 5000;
export const MAX_TAG_COUNT = 20;
export const MAX_PROFILE_NAME_LENGTH = 120;
export const MAX_PROFILE_BIO_LENGTH = 600;
export const MAX_PROFILE_FIELD_LENGTH = 120;

// ─── Upload ────────────────────────────────────────────────────────────────────

export const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

// ─── Auth / Session ────────────────────────────────────────────────────────────

/** Session max age in seconds (30 days) */
export const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

// ─── Notification ──────────────────────────────────────────────────────────────

/** Auto-delete notifications older than this (in seconds) */
export const NOTIFICATION_TTL_SECONDS = 90 * 24 * 60 * 60;

/** Polling interval for notifications in the navbar (ms) */
export const NOTIFICATION_POLL_INTERVAL_MS = 30_000;

// ─── Cache ─────────────────────────────────────────────────────────────────────

/** Revalidation interval for cached public queries (seconds) */
export const PUBLIC_CACHE_REVALIDATE_SECONDS = 60;
