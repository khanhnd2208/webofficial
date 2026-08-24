const REQUIRED_PRODUCTION_ENV = [
	'MONGODB_URI',
	'DATABASE_URL',
	'AUTH_SECRET',
	'GOOGLE_CLIENT_ID',
	'GOOGLE_CLIENT_SECRET',
] as const;

/** Fail closed before serving traffic when a production secret or datastore URL is missing. */
export function assertProductionEnvironment(): void {
	if (process.env.NODE_ENV !== 'production') return;

	const missing = REQUIRED_PRODUCTION_ENV.filter((key) => !process.env[key]?.trim());
	if (missing.length > 0) {
		throw new Error(`Missing required production environment variables: ${missing.join(', ')}`);
	}

	const authUrl = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL;
	if (!authUrl || !/^https:\/\//i.test(authUrl)) {
		throw new Error('Production AUTH_URL or NEXTAUTH_URL must use https://');
	}
}
