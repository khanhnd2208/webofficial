export type PublicLearningFeature = 'tests' | 'knowledge';

type FeatureEnvironment = {
	NODE_ENV?: string;
	PUBLIC_TESTS_ENABLED?: string;
	PUBLIC_KNOWLEDGE_ENABLED?: string;
};

/**
 * Public learning experiments are open by default for local development and
 * tests, but fail closed in production until they are explicitly enabled.
 * These are server-only flags; never expose them through NEXT_PUBLIC_*.
 */
export function isPublicLearningFeatureEnabled(
	feature: PublicLearningFeature,
	environment: FeatureEnvironment = process.env,
): boolean {
	const configured =
		feature === 'tests' ? environment.PUBLIC_TESTS_ENABLED : environment.PUBLIC_KNOWLEDGE_ENABLED;
	const normalized = configured?.trim().toLowerCase();

	if (normalized === 'true') return true;
	if (normalized === 'false') return false;
	return environment.NODE_ENV !== 'production';
}

function matchesPathPrefix(pathname: string, prefix: string): boolean {
	return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/** Resolve a disabled public feature for both its page and direct API surface. */
export function getLockedPublicLearningFeature(
	pathname: string,
	environment: FeatureEnvironment = process.env,
): PublicLearningFeature | null {
	if (
		(matchesPathPrefix(pathname, '/my-space/tests') ||
			matchesPathPrefix(pathname, '/api/myspace-tests')) &&
		!isPublicLearningFeatureEnabled('tests', environment)
	) {
		return 'tests';
	}

	if (
		(matchesPathPrefix(pathname, '/my-space/my-class') ||
			matchesPathPrefix(pathname, '/api/my-class')) &&
		!isPublicLearningFeatureEnabled('knowledge', environment)
	) {
		return 'knowledge';
	}

	return null;
}
