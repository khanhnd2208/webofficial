import { afterEach, describe, expect, it, vi } from 'vitest';

import { assertProductionEnvironment } from './startupEnv';

const completeProductionEnvironment = {
	NODE_ENV: 'production',
	MONGODB_URI: 'mongodb://localhost:27017/app',
	DATABASE_URL: 'postgresql://localhost:5432/app',
	AUTH_SECRET: 'test-secret',
	GOOGLE_CLIENT_ID: 'google-client-id',
	GOOGLE_CLIENT_SECRET: 'google-client-secret',
	AUTH_URL: 'https://toiladuykhanh.com',
};

afterEach(() => {
	vi.unstubAllEnvs();
});

describe('assertProductionEnvironment', () => {
	it('does not require production secrets outside production', () => {
		vi.stubEnv('NODE_ENV', 'test');
		expect(() => assertProductionEnvironment()).not.toThrow();
	});

	it('requires datastore, auth, and Google OAuth configuration in production', () => {
		for (const [key, value] of Object.entries(completeProductionEnvironment)) {
			vi.stubEnv(key, value);
		}
		vi.stubEnv('GOOGLE_CLIENT_SECRET', '');

		expect(() => assertProductionEnvironment()).toThrow(
			'Missing required production environment variables: GOOGLE_CLIENT_SECRET',
		);
	});

	it('requires an HTTPS auth URL in production', () => {
		for (const [key, value] of Object.entries(completeProductionEnvironment)) {
			vi.stubEnv(key, value);
		}
		vi.stubEnv('AUTH_URL', 'http://example.test');

		expect(() => assertProductionEnvironment()).toThrow(
			'Production AUTH_URL or NEXTAUTH_URL must use https://',
		);
	});

	it('requires the canonical production origin for Google OAuth', () => {
		for (const [key, value] of Object.entries(completeProductionEnvironment)) {
			vi.stubEnv(key, value);
		}
		vi.stubEnv('AUTH_URL', 'https://example.test');

		expect(() => assertProductionEnvironment()).toThrow(
			'Production AUTH_URL must be https://toiladuykhanh.com',
		);
	});

	it('accepts a complete production environment', () => {
		for (const [key, value] of Object.entries(completeProductionEnvironment)) {
			vi.stubEnv(key, value);
		}

		expect(() => assertProductionEnvironment()).not.toThrow();
	});
});
