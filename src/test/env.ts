/**
 * Test environment defaults.
 * Integration tests must point at an explicitly isolated database.
 * Never fall back to the application's DATABASE_URL: a missing test URL
 * should fail closed instead of risking writes to a developer/production DB.
 */
const testDatabaseUrl = process.env.TEST_DATABASE_URL?.trim();
if (!testDatabaseUrl) {
	throw new Error(
		'TEST_DATABASE_URL is required for integration tests. Refusing to use DATABASE_URL.',
	);
}

export const TEST_DATABASE_URL = testDatabaseUrl;

export const TEST_MONGODB_URI =
	process.env.TEST_MONGODB_URI ?? 'mongodb://127.0.0.1:27017/teaching_platform_test';
