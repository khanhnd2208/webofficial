/**
 * Rolling Google session: each browser session fetch renews the JWT and cookie for a year.
 * Existing, unexpired tokens can renew too; an old signedInAt field is ignored.
 * Edge-safe: no Node-only APIs.
 */
export const SESSION_MAX_AGE_SECONDS = 365 * 24 * 60 * 60;
