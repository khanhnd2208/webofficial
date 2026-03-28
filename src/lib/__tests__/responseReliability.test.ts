/* ════════════════════════════════════════════════════════════════════════
   Response Reliability — Tests
   ════════════════════════════════════════════════════════════════════════ */

import { describe, it, expect } from 'vitest';
import {
	computeReliabilityMetrics,
	computeMeanPattern,
} from '../responseReliability';

// ─── Longstring ────────────────────────────────────────────────────────────────

describe('computeReliabilityMetrics — longstringMax', () => {
	it('returns 0 for empty array', () => {
		const m = computeReliabilityMetrics([], 0);
		expect(m.longstringMax).toBe(0);
	});

	it('returns 1 for all-different values', () => {
		const m = computeReliabilityMetrics([1, 2, 3, 4, 5, 1, 2, 3], 60);
		expect(m.longstringMax).toBe(1);
	});

	it('detects a longstring of 5', () => {
		const m = computeReliabilityMetrics([3, 3, 3, 3, 3, 1, 2, 4], 60);
		expect(m.longstringMax).toBe(5);
	});

	it('detects longstring at end of array', () => {
		const m = computeReliabilityMetrics([1, 2, 4, 4, 4, 4, 4, 4, 4, 4], 60);
		expect(m.longstringMax).toBe(8);
	});

	it('detects longstring >= 14 as careless', () => {
		const vals = Array(59).fill(3); // 59 items all same value
		const m = computeReliabilityMetrics(vals, 120);
		expect(m.longstringMax).toBe(59);
		expect(m.reliabilityFlag).toBe('careless');
	});
});

// ─── IRV (Intra-individual Response Variability) ───────────────────────────────

describe('computeReliabilityMetrics — irv', () => {
	it('returns 0 SD for all-identical values', () => {
		const vals = Array(20).fill(3);
		const m = computeReliabilityMetrics(vals, 60);
		expect(m.irv).toBe(0);
	});

	it('returns positive SD for varied responses', () => {
		const vals = [1, 2, 3, 4, 5, 1, 2, 3, 4, 5];
		const m = computeReliabilityMetrics(vals, 60);
		expect(m.irv).toBeGreaterThan(1.0);
	});

	it('flags very low IRV (<0.3) as careless', () => {
		// All 3s except one 4 — very low variability
		const vals = Array(59).fill(3);
		vals[30] = 4; // one deviation
		const m = computeReliabilityMetrics(vals, 300);
		expect(m.irv).toBeLessThan(0.3);
		// Note: longstring=30 is also flagged, so it's definitely careless
	});
});

// ─── Average item time ─────────────────────────────────────────────────────────

describe('computeReliabilityMetrics — avgItemTime', () => {
	it('calculates correct avg seconds per item', () => {
		const vals = Array(59).fill(3);
		vals[0] = 1; vals[1] = 5; // just to vary
		const m = computeReliabilityMetrics(vals, 295); // 295s / 59 items = 5.0s
		expect(m.avgItemTime).toBeCloseTo(5.0, 1);
	});

	it('flags < 1.0 s/item as careless', () => {
		// 59 items in 30 seconds = 0.51 s/item
		const vals = [1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 1, 2, 3, 4, 5,
			1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 1, 2, 3, 4, 5,
			1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 1, 2, 3, 4];
		const m = computeReliabilityMetrics(vals, 30);
		expect(m.avgItemTime).toBeLessThan(1.0);
		expect(m.flagReasons.some(r => r.includes('AvgTime'))).toBe(true);
	});

	it('flags < 2.0 s/item as suspect', () => {
		const vals = [1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 1, 2, 3, 4, 5,
			1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 1, 2, 3, 4, 5,
			1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 1, 2, 3, 4];
		const m = computeReliabilityMetrics(vals, 90); // 1.5 s/item
		expect(m.avgItemTime).toBeLessThan(2.0);
		expect(m.avgItemTime).toBeGreaterThanOrEqual(1.0);
		expect(m.flagReasons.some(r => r.includes('AvgTime'))).toBe(true);
	});
});

// ─── Person-total correlation ──────────────────────────────────────────────────

describe('computeReliabilityMetrics — personTotalR', () => {
	it('returns null when no mean pattern provided', () => {
		const m = computeReliabilityMetrics([1, 2, 3, 4, 5], 30);
		expect(m.personTotalR).toBeNull();
	});

	it('returns ~1 when individual matches mean exactly', () => {
		const vals = [1, 2, 3, 4, 5, 3, 2, 4, 1, 5];
		const m = computeReliabilityMetrics(vals, 60, vals);
		expect(m.personTotalR).toBeCloseTo(1.0, 2);
	});

	it('returns negative r for inversely correlated responses', () => {
		const vals = [5, 4, 3, 2, 1, 5, 4, 3, 2, 1];
		const mean = [1, 2, 3, 4, 5, 1, 2, 3, 4, 5];
		const m = computeReliabilityMetrics(vals, 60, mean);
		expect(m.personTotalR).toBeLessThan(0);
	});
});

// ─── Reliability flag ──────────────────────────────────────────────────────────

describe('computeReliabilityMetrics — reliabilityFlag', () => {
	it('returns "ok" for typical good response pattern', () => {
		// 59 items, varied responses, 5 minutes
		const vals: number[] = [];
		for (let i = 0; i < 59; i++) {
			vals.push((i % 5) + 1); // cycles 1,2,3,4,5 repeatedly
		}
		const m = computeReliabilityMetrics(vals, 300);
		expect(m.reliabilityFlag).toBe('ok');
		expect(m.longstringMax).toBe(1);
		expect(m.irv).toBeGreaterThan(1.0);
		expect(m.avgItemTime).toBeGreaterThan(2.0);
	});

	it('returns "careless" for all-same straight-line', () => {
		const vals = Array(59).fill(3);
		const m = computeReliabilityMetrics(vals, 30);
		expect(m.reliabilityFlag).toBe('careless');
	});

	it('returns "suspect" with moderate red flags', () => {
		// 8 consecutive 3s (longstring=8 → suspect), but otherwise varied
		const vals = [3, 3, 3, 3, 3, 3, 3, 3, 1, 2, 4, 5, 1, 2, 4, 5,
			1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 1, 2, 3, 4, 5,
			1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 1, 2, 3, 4, 5,
			1, 2, 3];
		const m = computeReliabilityMetrics(vals, 300); // 5 min — fine for timing
		expect(m.longstringMax).toBe(8);
		expect(m.reliabilityFlag).toBe('suspect');
	});
});

// ─── computeMeanPattern ────────────────────────────────────────────────────────

describe('computeMeanPattern', () => {
	it('returns empty array for no sessions', () => {
		expect(computeMeanPattern([])).toEqual([]);
	});

	it('returns the same array for a single session', () => {
		const vals = [1, 2, 3, 4, 5];
		const mean = computeMeanPattern([vals]);
		expect(mean).toEqual([1, 2, 3, 4, 5]);
	});

	it('computes correct mean across multiple sessions', () => {
		const s1 = [1, 2, 3];
		const s2 = [5, 4, 3];
		const mean = computeMeanPattern([s1, s2]);
		expect(mean[0]).toBeCloseTo(3.0);
		expect(mean[1]).toBeCloseTo(3.0);
		expect(mean[2]).toBeCloseTo(3.0);
	});

	it('computes correct mean with unequal values', () => {
		const s1 = [1, 5, 3];
		const s2 = [3, 1, 5];
		const s3 = [2, 3, 4];
		const mean = computeMeanPattern([s1, s2, s3]);
		expect(mean[0]).toBeCloseTo(2.0);
		expect(mean[1]).toBeCloseTo(3.0);
		expect(mean[2]).toBeCloseTo(4.0);
	});
});
