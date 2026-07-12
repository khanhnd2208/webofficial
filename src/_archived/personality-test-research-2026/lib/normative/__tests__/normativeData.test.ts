import { describe, it, expect } from 'vitest';

import {
	normalCDF,
	calculateZScore,
	calculatePercentile,
	getLevelFromZScore,
	getReferenceGroupById,
	getReferenceGroupsForDomain,
	getDefaultReferenceGroupIds,
	calculateDomainPercentile,
} from '@/lib/normative/percentileEngine';
import { REFERENCE_GROUPS } from '@/lib/normative/norms';

describe('normalCDF', () => {
	it('returns ~0.5 at z=0', () => {
		expect(normalCDF(0)).toBeCloseTo(0.5, 2);
	});

	it('returns ~0.84 at z=1', () => {
		expect(normalCDF(1)).toBeCloseTo(0.8413, 2);
	});

	it('returns ~0.16 at z=-1', () => {
		expect(normalCDF(-1)).toBeCloseTo(0.1587, 2);
	});

	it('is symmetric around 0.5', () => {
		expect(normalCDF(1.5) + normalCDF(-1.5)).toBeCloseTo(1, 4);
	});
});

describe('calculateZScore', () => {
	it('returns 0 when score equals mean', () => {
		expect(calculateZScore(3, 3, 1)).toBe(0);
	});

	it('returns positive z above mean', () => {
		expect(calculateZScore(4, 3, 0.5)).toBe(2);
	});

	it('returns negative z below mean', () => {
		expect(calculateZScore(2, 3, 0.5)).toBe(-2);
	});
});

describe('calculatePercentile', () => {
	it('returns 50th percentile at mean', () => {
		expect(calculatePercentile(3, 3, 1)).toBeCloseTo(50, 0);
	});

	it('returns high percentile for high scores', () => {
		expect(calculatePercentile(5, 3, 0.5)).toBeGreaterThan(95);
	});

	it('returns low percentile for low scores', () => {
		expect(calculatePercentile(1, 3, 0.5)).toBeLessThan(5);
	});
});

describe('getLevelFromZScore', () => {
	it('maps z-scores to 5 tiers', () => {
		expect(getLevelFromZScore(2)).toBe('very_high');
		expect(getLevelFromZScore(1)).toBe('high');
		expect(getLevelFromZScore(0)).toBe('moderate');
		expect(getLevelFromZScore(-1)).toBe('low');
		expect(getLevelFromZScore(-2)).toBe('very_low');
	});

	it('handles boundary values', () => {
		expect(getLevelFromZScore(1.5)).toBe('very_high');
		expect(getLevelFromZScore(0.5)).toBe('high');
		expect(getLevelFromZScore(-0.5)).toBe('moderate');
		expect(getLevelFromZScore(-1.5)).toBe('low');
	});
});

describe('reference group lookups', () => {
	it('has reference groups defined', () => {
		expect(REFERENCE_GROUPS.length).toBeGreaterThan(0);
	});

	it('getReferenceGroupById finds known group', () => {
		const group = getReferenceGroupById('bfi2-internet');
		expect(group?.label).toBeTruthy();
	});

	it('getReferenceGroupsForDomain returns ocean groups', () => {
		const groups = getReferenceGroupsForDomain('extraversion');
		expect(groups.length).toBeGreaterThan(0);
		expect(groups.every((g) => g.domains.includes('extraversion'))).toBe(true);
	});

	it('getDefaultReferenceGroupIds respects gender', () => {
		expect(getDefaultReferenceGroupIds('male').darkTriad).toBe('sd3-study1-male');
		expect(getDefaultReferenceGroupIds('female').darkTriad).toBe('sd3-study1-female');
		expect(getDefaultReferenceGroupIds().ocean).toBe('bfi2-internet');
	});
});

describe('calculateDomainPercentile', () => {
	it('computes percentile for extraversion against internet norms', () => {
		const result = calculateDomainPercentile('extraversion', 3.5, 'bfi2-internet');
		expect(result).not.toBeNull();
		expect(result!.percentile).toBeGreaterThan(0);
		expect(result!.percentile).toBeLessThanOrEqual(100);
		expect(result!.zScore).toBeTypeOf('number');
		expect(result!.interpretation).toBeTruthy();
	});

	it('returns higher percentile for above-average scores', () => {
		const low = calculateDomainPercentile('agreeableness', 2.5, 'bfi2-internet');
		const high = calculateDomainPercentile('agreeableness', 4.5, 'bfi2-internet');
		expect(low).not.toBeNull();
		expect(high).not.toBeNull();
		expect(high!.percentile).toBeGreaterThan(low!.percentile);
	});
});

describe('edge cases', () => {
	it('handles extreme z-scores without NaN', () => {
		expect(calculatePercentile(1, 4, 0.3)).toBeGreaterThan(0);
		expect(calculatePercentile(5, 2, 0.3)).toBeLessThan(100);
	});

	it('all ocean domains have at least one reference group', () => {
		for (const domain of [
			'extraversion',
			'agreeableness',
			'conscientiousness',
			'negativeEmotionality',
			'openMindedness',
		] as const) {
			expect(getReferenceGroupsForDomain(domain).length).toBeGreaterThan(0);
		}
	});

	it('all dark triad domains have reference groups', () => {
		for (const domain of ['machiavellianism', 'narcissism', 'psychopathy'] as const) {
			expect(getReferenceGroupsForDomain(domain).length).toBeGreaterThan(0);
		}
	});
});
