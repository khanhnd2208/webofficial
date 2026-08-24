const ANALYTICS_ORIGIN = 'https://analytics.toiladuykhanh.com';
const GOOGLE_FONTS_STYLES_ORIGIN = 'https://fonts.googleapis.com';
const GOOGLE_FONTS_FILES_ORIGIN = 'https://fonts.gstatic.com';

export function buildContentSecurityPolicy(environment: string | undefined): string {
	const scriptSources = ["'self'", "'unsafe-inline'"];
	if (environment === 'development') scriptSources.push("'unsafe-eval'");
	scriptSources.push(ANALYTICS_ORIGIN);

	return (
		[
			"default-src 'self'",
			"base-uri 'self'",
			"object-src 'none'",
			"frame-ancestors 'self'",
			"form-action 'self'",
			"img-src 'self' data: blob: https://*.googleusercontent.com https://toiladuykhanh.com https://www.toiladuykhanh.com",
			"media-src 'self' blob:",
			`font-src 'self' data: ${GOOGLE_FONTS_FILES_ORIGIN}`,
			`connect-src 'self' ${ANALYTICS_ORIGIN}`,
			`script-src ${scriptSources.join(' ')}`,
			`style-src 'self' 'unsafe-inline' ${GOOGLE_FONTS_STYLES_ORIGIN}`,
		].join('; ') + ';'
	);
}
