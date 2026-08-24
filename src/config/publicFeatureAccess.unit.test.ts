import { describe, expect, it } from 'vitest';

import {
	getLockedPublicLearningFeature,
	isPublicLearningFeatureEnabled,
} from './publicFeatureAccess';

describe('public learning feature access', () => {
	it('fails closed for unfinished production features when flags are absent', () => {
		const environment = { NODE_ENV: 'production' };

		expect(isPublicLearningFeatureEnabled('tests', environment)).toBe(false);
		expect(isPublicLearningFeatureEnabled('knowledge', environment)).toBe(false);
	});

	it('keeps local development and tests available without production flags', () => {
		expect(isPublicLearningFeatureEnabled('tests', { NODE_ENV: 'development' })).toBe(true);
		expect(isPublicLearningFeatureEnabled('knowledge', { NODE_ENV: 'test' })).toBe(true);
	});

	it('only enables a production feature with the exact true value', () => {
		expect(
			isPublicLearningFeatureEnabled('tests', {
				NODE_ENV: 'production',
				PUBLIC_TESTS_ENABLED: ' true ',
			}),
		).toBe(true);
		expect(
			isPublicLearningFeatureEnabled('knowledge', {
				NODE_ENV: 'production',
				PUBLIC_KNOWLEDGE_ENABLED: '1',
			}),
		).toBe(false);
	});

	it('locks exact page and API prefixes without matching lookalike paths', () => {
		const environment = { NODE_ENV: 'production' };

		expect(getLockedPublicLearningFeature('/my-space/tests/example/play', environment)).toBe(
			'tests',
		);
		expect(getLockedPublicLearningFeature('/api/myspace-tests/example', environment)).toBe('tests');
		expect(getLockedPublicLearningFeature('/my-space/my-class/course', environment)).toBe(
			'knowledge',
		);
		expect(getLockedPublicLearningFeature('/api/my-class/courses', environment)).toBe('knowledge');
		expect(getLockedPublicLearningFeature('/api/my-classic', environment)).toBeNull();
		expect(getLockedPublicLearningFeature('/admin/my-class', environment)).toBeNull();
	});
});
