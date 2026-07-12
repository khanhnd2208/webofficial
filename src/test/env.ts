/**
 * Test environment defaults.
 * Override via .env.test, .env.local, or CI env vars.
 */
export const TEST_DATABASE_URL =
	process.env.TEST_DATABASE_URL ??
	process.env.DATABASE_URL ??
	'postgresql://postgres:postgres@127.0.0.1:5432/teaching_platform_vocab';

export const TEST_MONGODB_URI =
	process.env.TEST_MONGODB_URI ?? 'mongodb://127.0.0.1:27017/teaching_platform_test';
