/**
 * Automated tests for the Normative Data & Percentile Calculation Engine.
 *
 * Tests cover:
 *   1. normalCDF — known z-value → probability mappings
 *   2. calculateZScore — basic z-score computation
 *   3. calculatePercentile — z-score → percentile with clamping
 *   4. calculateDomainPercentile — full domain-level calculation with reference groups
 *   5. calculateAllPercentiles — multi-domain batch calculation
 *   6. Reference group lookups — getDefaultReferenceGroupIds, getReferenceGroupById, etc.
 *   7. Edge cases — SD=0, extreme z-values, missing norms, invalid group IDs
 *   8. Data integrity — all reference groups have valid norms, domain coverage
 *
 * Run: npm test
 */

import { describe, it, expect } from 'vitest';
import {
	normalCDF,
	calculateZScore,
	calculatePercentile,
	calculateDomainPercentile,
	calculateAllPercentiles,
	getReferenceGroupById,
	getDefaultReferenceGroupIds,
	getReferenceGroupsForDomain,
	getReferenceGroupOptions,
	REFERENCE_GROUPS,
} from '../normativeData';

// ─── 1. normalCDF ───────────────────────────────────────────────────────────────

describe('normalCDF', () => {
	it('should return 0.5 for z = 0', () => {
		const result = normalCDF(0);
		expect(result).toBeCloseTo(0.5, 5);
	});

	it('should return ~0.8413 for z = 1 (one SD above mean)', () => {
		const result = normalCDF(1);
		expect(result).toBeCloseTo(0.8413, 3);
	});

	it('should return ~0.1587 for z = -1 (one SD below mean)', () => {
		const result = normalCDF(-1);
		expect(result).toBeCloseTo(0.1587, 3);
	});

	it('should return ~0.9772 for z = 2', () => {
		const result = normalCDF(2);
		expect(result).toBeCloseTo(0.9772, 3);
	});

	it('should return ~0.0228 for z = -2', () => {
		const result = normalCDF(-2);
		expect(result).toBeCloseTo(0.0228, 3);
	});

	it('should return ~0.975 for z = 1.96 (95% CI boundary)', () => {
		const result = normalCDF(1.96);
		expect(result).toBeCloseTo(0.975, 3);
	});

	it('should return ~0.025 for z = -1.96', () => {
		const result = normalCDF(-1.96);
		expect(result).toBeCloseTo(0.025, 3);
	});

	it('should return ~0.9987 for z = 3', () => {
		const result = normalCDF(3);
		expect(result).toBeCloseTo(0.9987, 3);
	});

	it('should clamp to 0 for extreme negative z', () => {
		expect(normalCDF(-10)).toBe(0);
		expect(normalCDF(-100)).toBe(0);
	});

	it('should clamp to 1 for extreme positive z', () => {
		expect(normalCDF(10)).toBe(1);
		expect(normalCDF(100)).toBe(1);
	});

	it('should be symmetric: Φ(z) + Φ(-z) ≈ 1', () => {
		for (const z of [0.5, 1.0, 1.5, 2.0, 2.5, 3.0]) {
			const sum = normalCDF(z) + normalCDF(-z);
			expect(sum).toBeCloseTo(1.0, 5);
		}
	});

	it('should be monotonically increasing', () => {
		let prev = 0;
		for (let z = -4; z <= 4; z += 0.5) {
			const current = normalCDF(z);
			expect(current).toBeGreaterThanOrEqual(prev);
			prev = current;
		}
	});
});

// ─── 2. calculateZScore ─────────────────────────────────────────────────────────

describe('calculateZScore', () => {
	it('should return 0 when score equals mean', () => {
		expect(calculateZScore(3.0, 3.0, 0.5)).toBe(0);
	});

	it('should return 1 when score is one SD above mean', () => {
		expect(calculateZScore(3.5, 3.0, 0.5)).toBe(1);
	});

	it('should return -1 when score is one SD below mean', () => {
		expect(calculateZScore(2.5, 3.0, 0.5)).toBe(-1);
	});

	it('should return 2 when score is two SDs above mean', () => {
		expect(calculateZScore(4.0, 3.0, 0.5)).toBe(2);
	});

	it('should return 0 when SD is 0 (edge case)', () => {
		expect(calculateZScore(3.5, 3.0, 0)).toBe(0);
	});

	it('should return 0 when SD is negative (edge case)', () => {
		expect(calculateZScore(3.5, 3.0, -1)).toBe(0);
	});

	it('should handle fractional results', () => {
		// Using BFI-2-S E norms: M=3.22, SD=0.80 (Soto & John 2017, Table 1)
		const z = calculateZScore(3.22, 3.22, 0.80);
		expect(z).toBeCloseTo(0, 5);
	});
});

// ─── 3. calculatePercentile ─────────────────────────────────────────────────────

describe('calculatePercentile', () => {
	it('should return 50 when score equals mean', () => {
		expect(calculatePercentile(3.0, 3.0, 0.5)).toBe(50);
	});

	it('should return ~84 when score is 1 SD above mean', () => {
		const pct = calculatePercentile(3.5, 3.0, 0.5);
		expect(pct).toBe(84); // normalCDF(1) ≈ 0.8413 → 84
	});

	it('should return ~16 when score is 1 SD below mean', () => {
		const pct = calculatePercentile(2.5, 3.0, 0.5);
		expect(pct).toBe(16); // normalCDF(-1) ≈ 0.1587 → 16
	});

	it('should return ~98 when score is 2 SDs above mean', () => {
		const pct = calculatePercentile(4.0, 3.0, 0.5);
		expect(pct).toBe(98); // normalCDF(2) ≈ 0.9772 → 98
	});

	it('should clamp to minimum 1 for extreme low scores', () => {
		const pct = calculatePercentile(0.5, 3.0, 0.5);
		expect(pct).toBe(1);
	});

	it('should clamp to maximum 99 for extreme high scores', () => {
		const pct = calculatePercentile(6.0, 3.0, 0.5);
		expect(pct).toBe(99);
	});

	it('should return 50 when SD is 0 (edge case: score = mean implicitly)', () => {
		const pct = calculatePercentile(3.5, 3.0, 0);
		expect(pct).toBe(50); // z=0 when SD=0 → normalCDF(0)=0.5 → 50
	});

	it('should return integer percentile values', () => {
		for (let score = 1; score <= 5; score += 0.25) {
			const pct = calculatePercentile(score, 3.0, 0.8);
			expect(Number.isInteger(pct)).toBe(true);
		}
	});

	it('should always return values between 1 and 99', () => {
		for (let score = 0.5; score <= 5.5; score += 0.1) {
			const pct = calculatePercentile(score, 3.0, 0.7);
			expect(pct).toBeGreaterThanOrEqual(1);
			expect(pct).toBeLessThanOrEqual(99);
		}
	});
});

// ─── 4. calculateDomainPercentile ───────────────────────────────────────────────

describe('calculateDomainPercentile', () => {
	it('should return correct result for extraversion with BFI-2-S Internet norms', () => {
		// BFI-2-S E: M=3.22, SD=0.80 (Soto & John 2017, Table 1)
		const result = calculateDomainPercentile('extraversion', 3.22, 'bfi2-internet');
		expect(result).not.toBeNull();
		expect(result!.domain).toBe('extraversion');
		expect(result!.percentile).toBe(50);
		expect(result!.zScore).toBeCloseTo(0, 1);
		expect(result!.referenceGroupId).toBe('bfi2-internet');
	});

	it('should return correct result for high extraversion', () => {
		// Score 4.5 with M=3.2165, SD=0.72822 → z ≈ 1.76
		const result = calculateDomainPercentile('extraversion', 4.5, 'bfi2-internet');
		expect(result).not.toBeNull();
		expect(result!.percentile).toBeGreaterThan(90);
		expect(result!.interpretation).toBe('Very High');
		expect(result!.interpretationVi).toBe('Rất cao');
	});

	it('should return correct result for low agreeableness', () => {
		// BFI-2-S A: M=3.82, SD=0.72 (Soto & John 2017, Table 1)
		// Score 2.0 → z ≈ -2.53 → pct=1 (Very Low)
		const result = calculateDomainPercentile('agreeableness', 2.0, 'bfi2-internet');
		expect(result).not.toBeNull();
		expect(result!.percentile).toBeLessThan(5);
		expect(result!.interpretation).toBe('Very Low');
	});

	it('should work with SD3 community group for machiavellianism', () => {
		const result = calculateDomainPercentile('machiavellianism', 3.0, 'sd3-community');
		expect(result).not.toBeNull();
		expect(result!.domain).toBe('machiavellianism');
		expect(result!.referenceGroupId).toBe('sd3-community');
		expect(result!.percentile).toBeGreaterThanOrEqual(1);
		expect(result!.percentile).toBeLessThanOrEqual(99);
	});

	it('should work with SD3 male-specific norms', () => {
		const result = calculateDomainPercentile('narcissism', 3.0, 'sd3-male');
		expect(result).not.toBeNull();
		expect(result!.referenceGroupId).toBe('sd3-male');
	});

	it('should work with SD3 female-specific norms', () => {
		const result = calculateDomainPercentile('psychopathy', 2.0, 'sd3-female');
		expect(result).not.toBeNull();
		expect(result!.referenceGroupId).toBe('sd3-female');
	});

	it('should return null for invalid reference group ID', () => {
		const result = calculateDomainPercentile('extraversion', 3.0, 'nonexistent-group');
		expect(result).toBeNull();
	});

	it('should return null for OCEAN domain against SD3-only group', () => {
		const result = calculateDomainPercentile('extraversion', 3.0, 'sd3-community');
		expect(result).toBeNull();
	});

	it('should return null for Dark Triad domain against BFI-2-only group', () => {
		const result = calculateDomainPercentile('machiavellianism', 3.0, 'bfi2-internet');
		expect(result).toBeNull();
	});

	it('should include mean and SD from the reference group in the result', () => {
		// BFI-2-S C: M=3.89, SD=0.84 (Soto & John 2017, Table 1)
		const result = calculateDomainPercentile('conscientiousness', 4.0, 'bfi2-internet');
		expect(result).not.toBeNull();
		expect(result!.mean).toBeCloseTo(3.89, 2);
		expect(result!.sd).toBeCloseTo(0.84, 2);
	});

	it('should populate interpretation labels for all percentile bands', () => {
		// BFI-2-S E: M=3.22, SD=0.80 (Soto & John 2017, Table 1)
		// 5-tier z-score system: z≥1.5=Very High, z≥0.5=High, z≥-0.5=Moderate, z≥-1.5=Low, else Very Low
		const testCases = [
			{ score: 1.5,  expectedEn: 'Very Low' },   // z=-2.15 → very_low
			{ score: 2.5,  expectedEn: 'Low' },        // z=-0.90 → low
			{ score: 3.2,  expectedEn: 'Moderate' },   // z=-0.03 → moderate
			{ score: 3.65, expectedEn: 'High' },       // z=+0.54 → high
			{ score: 4.8,  expectedEn: 'Very High' },  // z=+1.97 → very_high
		];
		for (const tc of testCases) {
			const result = calculateDomainPercentile('extraversion', tc.score, 'bfi2-internet');
			expect(result).not.toBeNull();
			expect(result!.interpretation).toBe(tc.expectedEn);
		}
	});
});

// ─── 5. calculateAllPercentiles ─────────────────────────────────────────────────

describe('calculateAllPercentiles', () => {
	it('should calculate percentiles for all 8 domains with default groups', () => {
		const scores = {
			extraversion: 3.5,
			agreeableness: 4.0,
			conscientiousness: 3.8,
			negativeEmotionality: 2.5,
			openMindedness: 3.7,
			machiavellianism: 2.8,
			narcissism: 3.0,
			psychopathy: 2.2,
		} as const;

		const results = calculateAllPercentiles(scores);
		expect(Object.keys(results)).toHaveLength(8);

		// OCEAN should use bfi2-internet
		expect(results['extraversion']?.referenceGroupId).toBe('bfi2-internet');
		expect(results['agreeableness']?.referenceGroupId).toBe('bfi2-internet');
		expect(results['conscientiousness']?.referenceGroupId).toBe('bfi2-internet');
		expect(results['negativeEmotionality']?.referenceGroupId).toBe('bfi2-internet');
		expect(results['openMindedness']?.referenceGroupId).toBe('bfi2-internet');

		// Dark Triad should use sd3-community
		expect(results['machiavellianism']?.referenceGroupId).toBe('sd3-community');
		expect(results['narcissism']?.referenceGroupId).toBe('sd3-community');
		expect(results['psychopathy']?.referenceGroupId).toBe('sd3-community');
	});

	it('should use custom reference groups when provided', () => {
		const scores = {
			machiavellianism: 3.0,
			narcissism: 3.0,
			psychopathy: 2.5,
		};

		const results = calculateAllPercentiles(scores, undefined, 'sd3-male');
		expect(results['machiavellianism']?.referenceGroupId).toBe('sd3-male');
		expect(results['narcissism']?.referenceGroupId).toBe('sd3-male');
		expect(results['psychopathy']?.referenceGroupId).toBe('sd3-male');
	});

	it('should skip domains with null/undefined scores', () => {
		const scores = {
			extraversion: 3.5,
			agreeableness: undefined as unknown as number,
		};

		const results = calculateAllPercentiles(scores);
		expect(results['extraversion']).toBeDefined();
		expect(results['agreeableness']).toBeUndefined();
	});

	it('should return empty object for empty scores', () => {
		const results = calculateAllPercentiles({});
		expect(Object.keys(results)).toHaveLength(0);
	});

	it('should produce consistent results for the same inputs', () => {
		const scores = { extraversion: 3.5, machiavellianism: 3.0 };
		const results1 = calculateAllPercentiles(scores);
		const results2 = calculateAllPercentiles(scores);
		expect(results1['extraversion']?.percentile).toBe(results2['extraversion']?.percentile);
		expect(results1['machiavellianism']?.percentile).toBe(results2['machiavellianism']?.percentile);
	});
});

// ─── 6. Reference Group Lookups ─────────────────────────────────────────────────

describe('Reference Group Lookups', () => {
	describe('getDefaultReferenceGroupIds', () => {
		it('should return correct default IDs', () => {
			const defaults = getDefaultReferenceGroupIds();
			expect(defaults.ocean).toBe('bfi2-internet');
			expect(defaults.darkTriad).toBe('sd3-community');
		});
	});

	describe('getReferenceGroupById', () => {
		it('should find bfi2-internet group', () => {
			const group = getReferenceGroupById('bfi2-internet');
			expect(group).toBeDefined();
			expect(group!.label).toContain('BFI-2-S'); // short form
			expect(group!.domains).toContain('extraversion');
		});

		it('should find sd3-community group', () => {
			const group = getReferenceGroupById('sd3-community');
			expect(group).toBeDefined();
			expect(group!.domains).toContain('machiavellianism');
		});

		it('should return undefined for nonexistent group', () => {
			expect(getReferenceGroupById('fake-group')).toBeUndefined();
		});
	});

	describe('getReferenceGroupsForDomain', () => {
		it('should return BFI-2 group for OCEAN domains', () => {
			const groups = getReferenceGroupsForDomain('extraversion');
			expect(groups.length).toBeGreaterThanOrEqual(1);
			expect(groups.some(g => g.id === 'bfi2-internet')).toBe(true);
		});

		it('should return multiple SD3 groups for Dark Triad domains', () => {
			const groups = getReferenceGroupsForDomain('machiavellianism');
			expect(groups.length).toBeGreaterThanOrEqual(4); // community, study3, male, female
			expect(groups.some(g => g.id === 'sd3-community')).toBe(true);
			expect(groups.some(g => g.id === 'sd3-male')).toBe(true);
			expect(groups.some(g => g.id === 'sd3-female')).toBe(true);
		});

		it('should not return SD3 groups for OCEAN domains', () => {
			const groups = getReferenceGroupsForDomain('conscientiousness');
			expect(groups.every(g => !g.id.startsWith('sd3'))).toBe(true);
		});
	});

	describe('getReferenceGroupOptions', () => {
		it('should return options for all reference groups', () => {
			const options = getReferenceGroupOptions();
			expect(options.length).toBe(REFERENCE_GROUPS.length);
		});

		it('should categorize groups as ocean or darkTriad', () => {
			const options = getReferenceGroupOptions();
			const oceanOptions = options.filter(o => o.type === 'ocean');
			const darkOptions = options.filter(o => o.type === 'darkTriad');
			expect(oceanOptions.length).toBeGreaterThanOrEqual(1);
			expect(darkOptions.length).toBeGreaterThanOrEqual(1);
		});

		it('should include sample size (n) for each option', () => {
			const options = getReferenceGroupOptions();
			for (const opt of options) {
				expect(opt.n).toBeGreaterThan(0);
			}
		});
	});
});

// ─── 7. Data Integrity ──────────────────────────────────────────────────────────

describe('Data Integrity', () => {
	it('all reference groups should have unique IDs', () => {
		const ids = REFERENCE_GROUPS.map(g => g.id);
		expect(new Set(ids).size).toBe(ids.length);
	});

	it('all reference groups should have non-empty labels', () => {
		for (const group of REFERENCE_GROUPS) {
			expect(group.label.length).toBeGreaterThan(0);
			expect(group.labelVi.length).toBeGreaterThan(0);
			expect(group.description.length).toBeGreaterThan(0);
			expect(group.descriptionVi.length).toBeGreaterThan(0);
			expect(group.source.length).toBeGreaterThan(0);
		}
	});

	it('all reference groups should have norms for their declared domains', () => {
		for (const group of REFERENCE_GROUPS) {
			for (const domain of group.domains) {
				const norm = group.norms[domain];
				expect(norm).toBeDefined();
				expect(norm!.mean).toBeGreaterThan(0);
				expect(norm!.sd).toBeGreaterThan(0);
				expect(norm!.n).toBeGreaterThan(0);
			}
		}
	});

	it('BFI-2-S norms should have reasonable values (scale 1-5)', () => {
		const group = getReferenceGroupById('bfi2-internet')!;
		for (const domain of group.domains) {
			const norm = group.norms[domain]!;
			expect(norm.mean).toBeGreaterThanOrEqual(1);
			expect(norm.mean).toBeLessThanOrEqual(5);
			expect(norm.sd).toBeGreaterThan(0);
			expect(norm.sd).toBeLessThan(2); // SD should be reasonable for 1-5 scale
		}
	});

	it('SD3 norms should have reasonable values (scale 1-5)', () => {
		for (const groupId of ['sd3-community', 'sd3-study3', 'sd3-male', 'sd3-female']) {
			const group = getReferenceGroupById(groupId)!;
			for (const domain of group.domains) {
				const norm = group.norms[domain]!;
				expect(norm.mean).toBeGreaterThanOrEqual(1);
				expect(norm.mean).toBeLessThanOrEqual(5);
				expect(norm.sd).toBeGreaterThan(0);
				expect(norm.sd).toBeLessThan(2);
			}
		}
	});

	it('SD3 community group should have N ≈ 998 (pooled from 3 studies)', () => {
		const group = getReferenceGroupById('sd3-community')!;
		const n = group.norms['machiavellianism']!.n;
		expect(n).toBe(998); // 489 + 279 + 230
	});

	it('BFI-2 Internet sample should have N = 3071', () => {
		const group = getReferenceGroupById('bfi2-internet')!;
		const n = group.norms['extraversion']!.n;
		expect(n).toBe(3071);
	});

	it('SD3 Study 3 male + female N should equal Study 3 pooled N', () => {
		const pooled = getReferenceGroupById('sd3-study3')!;
		const male = getReferenceGroupById('sd3-male')!;
		const female = getReferenceGroupById('sd3-female')!;
		const pooledN = pooled.norms['machiavellianism']!.n;
		const maleN = male.norms['machiavellianism']!.n;
		const femaleN = female.norms['machiavellianism']!.n;
		expect(maleN + femaleN).toBe(pooledN);
	});
});

// ─── 8. Known-Value Integration Tests ───────────────────────────────────────────

describe('Known-Value Integration Tests', () => {
	it('should calculate correct percentile for BFI-2-S E at exact mean', () => {
		// BFI-2-S E: M=3.22, SD=0.80 (Soto & John 2017, Table 1) → score=3.22 → z=0 → P50
		const result = calculateDomainPercentile('extraversion', 3.22, 'bfi2-internet');
		expect(result!.percentile).toBe(50);
	});

	it('should calculate correct percentile for BFI-2-S N at 1 SD above mean', () => {
		// BFI-2-S N: M=2.72, SD=0.97 (Soto & John 2017, Table 1) → score=3.69 → z=1 → P84
		const result = calculateDomainPercentile('negativeEmotionality', 2.72 + 0.97, 'bfi2-internet');
		expect(result!.percentile).toBe(84);
	});

	it('gender-specific SD3 norms should differ from pooled norms', () => {
		const score = 3.0;
		const community = calculateDomainPercentile('machiavellianism', score, 'sd3-community');
		const male = calculateDomainPercentile('machiavellianism', score, 'sd3-male');
		const female = calculateDomainPercentile('machiavellianism', score, 'sd3-female');

		// All should return results
		expect(community).not.toBeNull();
		expect(male).not.toBeNull();
		expect(female).not.toBeNull();

		// Gender-specific means must differ (Study 3: male M=3.12, female M=2.91)
		expect(male!.mean).toBeCloseTo(3.12, 2);
		expect(female!.mean).toBeCloseTo(2.91, 2);
		expect(community!.mean).not.toBe(male!.mean);
	});

	// ── SD3 pooled norms (computed from Jones & Paulhus 2014 Table 3 data) ──
	it('SD3 community pooled Machiavellianism should match weighted calculation', () => {
		// Pooled from 6 groups (Study 1-3, M+F) using weighted mean/variance formula
		// Study data: S1M(259,3.40,0.55) S1F(230,3.27,0.56) S2M(151,3.19,0.57)
		//             S2F(128,3.03,0.53) S3M(97,3.12,0.67)  S3F(133,2.91,0.53)
		// Expected pooled: M≈3.1983, SD≈0.5866, N=998
		const result = calculateDomainPercentile('machiavellianism', 3.1983, 'sd3-community');
		expect(result).not.toBeNull();
		expect(result!.percentile).toBe(50); // at pooled mean → 50th
		expect(result!.mean).toBeCloseTo(3.1983, 2);
		expect(result!.sd).toBeCloseTo(0.5866, 2);
	});

	it('SD3 community pooled Narcissism should match weighted calculation', () => {
		// Expected pooled: M≈2.8285, SD≈0.5275, N=998
		const result = calculateDomainPercentile('narcissism', 2.8285, 'sd3-community');
		expect(result).not.toBeNull();
		expect(result!.percentile).toBe(50);
		expect(result!.mean).toBeCloseTo(2.8285, 2);
		expect(result!.sd).toBeCloseTo(0.5275, 2);
	});

	it('SD3 community pooled Psychopathy should match weighted calculation', () => {
		// Expected pooled: M≈2.1609, SD≈0.6174, N=998
		const result = calculateDomainPercentile('psychopathy', 2.1609, 'sd3-community');
		expect(result).not.toBeNull();
		expect(result!.percentile).toBe(50);
		expect(result!.mean).toBeCloseTo(2.1609, 2);
		expect(result!.sd).toBeCloseTo(0.6174, 2);
	});

	// ── BFI-2-S norms from Soto & John (2017) Table 1 ──
	it('BFI-2-S norms should match Soto & John 2017 Table 1 values exactly', () => {
		// Internet sample N=3,071 — short form (6 items/domain) norms
		const expected: Record<string, { mean: number; sd: number }> = {
			extraversion:         { mean: 3.22, sd: 0.80 },
			agreeableness:        { mean: 3.82, sd: 0.72 },
			conscientiousness:    { mean: 3.89, sd: 0.84 },
			negativeEmotionality: { mean: 2.72, sd: 0.97 },
			openMindedness:       { mean: 3.65, sd: 0.77 },
		};
		const group = getReferenceGroupById('bfi2-internet')!;
		for (const [domain, { mean, sd }] of Object.entries(expected)) {
			const norm = group.norms[domain as keyof typeof group.norms]!;
			expect(norm.mean).toBeCloseTo(mean, 2);
			expect(norm.sd).toBeCloseTo(sd, 2);
			expect(norm.n).toBe(3071);
		}
	});

	it('score at BFI-2-S mean+1SD should always give 84th percentile', () => {
		// This validates both the CDF and the norm values together
		const domainNorms: Record<string, [number, number]> = {
			extraversion: [3.22, 0.80],
			agreeableness: [3.82, 0.72],
			conscientiousness: [3.89, 0.84],
			negativeEmotionality: [2.72, 0.97],
			openMindedness: [3.65, 0.77],
		};
		for (const [domain, [mean, sd]] of Object.entries(domainNorms)) {
			const result = calculateDomainPercentile(
				domain as Parameters<typeof calculateDomainPercentile>[0],
				mean + sd,
				'bfi2-internet'
			);
			expect(result).not.toBeNull();
			expect(result!.percentile).toBe(84); // Φ(1) = 84.13% → rounds to 84
		}
	});
});
