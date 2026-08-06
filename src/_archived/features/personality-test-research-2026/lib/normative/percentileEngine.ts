/* ════════════════════════════════════════════════════════════════════════
   Normative Data — Percentile Calculation Engine

   Math functions:
   - normalCDF: Standard normal CDF (Abramowitz & Stegun approximation)
   - calculateZScore: z = (x − μ) / σ
   - calculatePercentile: z → Φ(z) × 100

   Composite functions:
   - calculateDomainPercentile: single domain against a reference group
   - calculateAllPercentiles: all domains against default reference groups
   - getReferenceGroupOptions: dropdown selector data

   Lookup helpers:
   - getReferenceGroupsForDomain
   - getReferenceGroupById
   - getDefaultReferenceGroupIds
   - getLevelFromZScore
   ════════════════════════════════════════════════════════════════════════ */

import type { OceanDomain, PersonalityDomain } from '@/types/personalityTest';
import type { PercentileResult } from './types';
import { REFERENCE_GROUPS, OCEAN_DOMAINS } from './norms';
import type { ReferenceGroup } from './types';

// ─── Reference Group Lookups ───────────────────────────────────────────────────

/**
 * Get reference groups that have norms for a specific domain.
 */
export function getReferenceGroupsForDomain(domain: PersonalityDomain): ReferenceGroup[] {
	return REFERENCE_GROUPS.filter(g => g.domains.includes(domain));
}

/**
 * Get a reference group by ID.
 */
export function getReferenceGroupById(id: string): ReferenceGroup | undefined {
	return REFERENCE_GROUPS.find(g => g.id === id);
}

/**
 * Get the default reference group IDs for OCEAN and Dark Triad.
 * When gender is provided, uses gender-specific Study 1 norms for SD3.
 * @param gender - 'male' | 'female' | 'other' | undefined (falls back to pooled community)
 */
export function getDefaultReferenceGroupIds(gender?: 'male' | 'female' | 'other'): { ocean: string; darkTriad: string } {
	let darkTriad = 'sd3-community';
	if (gender === 'male')   darkTriad = 'sd3-study1-male';
	if (gender === 'female') darkTriad = 'sd3-study1-female';
	if (gender === 'other')  darkTriad = 'sd3-study1-other';
	return {
		ocean: 'bfi2-internet',
		darkTriad,
	};
}

/**
 * Map a z-score to a 5-tier level label.
 * - Z ≥  1.5 → 'very_high' (Rất cao)
 * - Z ≥  0.5 → 'high'      (Cao)
 * - Z ≥ -0.5 → 'moderate'  (Trung bình)
 * - Z ≥ -1.5 → 'low'       (Thấp)
 * - Z <  -1.5 → 'very_low' (Rất thấp)
 */
export function getLevelFromZScore(
	z: number
): 'very_low' | 'low' | 'moderate' | 'high' | 'very_high' {
	if (z >= 1.5)  return 'very_high';
	if (z >= 0.5)  return 'high';
	if (z >= -0.5) return 'moderate';
	if (z >= -1.5) return 'low';
	return 'very_low';
}

// ─── Standard Normal CDF (Φ) ───────────────────────────────────────────────────
// Uses the Abramowitz & Stegun approximation (error < 7.5×10⁻⁸)
// Reference: Handbook of Mathematical Functions, Formula 26.2.17

/**
 * Standard normal cumulative distribution function.
 * Returns P(Z ≤ z) for the standard normal distribution.
 */
export function normalCDF(z: number): number {
	// Clamp extreme z-values
	if (z < -8) return 0;
	if (z > 8) return 1;

	const a1 = 0.254829592;
	const a2 = -0.284496736;
	const a3 = 1.421413741;
	const a4 = -1.453152027;
	const a5 = 1.061405429;
	const p = 0.3275911;

	const sign = z < 0 ? -1 : 1;
	const x = Math.abs(z) / Math.sqrt(2);
	const t = 1.0 / (1.0 + p * x);
	const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

	return 0.5 * (1.0 + sign * y);
}

// ─── Percentile Calculation ────────────────────────────────────────────────────

/**
 * Calculate the z-score for a given score against a normative group.
 */
export function calculateZScore(score: number, mean: number, sd: number): number {
	if (sd <= 0) return 0;
	return (score - mean) / sd;
}

/**
 * Calculate percentile rank (0-100) for a score against a normative group.
 * Uses z-score → normal CDF method.
 */
export function calculatePercentile(score: number, mean: number, sd: number): number {
	const z = calculateZScore(score, mean, sd);
	const percentile = normalCDF(z) * 100;
	// Round to nearest integer, clamp 1-99
	return Math.max(1, Math.min(99, Math.round(percentile)));
}

/**
 * Get a human-readable interpretation label from a z-score (5-tier system).
 * Matches the TraitScore.level 5-tier system.
 */
function getPercentileInterpretation(z: number): { en: string; vi: string } {
	if (z >= 1.5)  return { en: 'Very High', vi: 'Rất cao' };
	if (z >= 0.5)  return { en: 'High',      vi: 'Cao' };
	if (z >= -0.5) return { en: 'Moderate',  vi: 'Trung bình' };
	if (z >= -1.5) return { en: 'Low',       vi: 'Thấp' };
	return               { en: 'Very Low',  vi: 'Rất thấp' };
}

/**
 * Calculate percentile for a single domain against a specific reference group.
 */
export function calculateDomainPercentile(
	domain: PersonalityDomain,
	score: number,
	referenceGroupId: string
): PercentileResult | null {
	const group = getReferenceGroupById(referenceGroupId);
	if (!group) return null;
	return calculateDomainPercentileFromGroup(domain, score, group);
}

/**
 * Calculate percentile for a single domain against a provided ReferenceGroup object.
 * This supports both static (published) and dynamic (local DB) reference groups.
 */
export function calculateDomainPercentileFromGroup(
	domain: PersonalityDomain,
	score: number,
	group: ReferenceGroup
): PercentileResult | null {
	const norms = group.norms[domain];
	if (!norms) return null;

	const z = calculateZScore(score, norms.mean, norms.sd);
	const percentile = calculatePercentile(score, norms.mean, norms.sd);
	const interp = getPercentileInterpretation(z);

	return {
		domain,
		score,
		referenceGroupId: group.id,
		referenceGroupLabel: group.label,
		referenceGroupLabelVi: group.labelVi,
		mean: norms.mean,
		sd: norms.sd,
		zScore: Math.round(z * 100) / 100,
		percentile,
		interpretation: interp.en,
		interpretationVi: interp.vi,
	};
}

/**
 * Calculate percentiles for ALL domains against default reference groups.
 * Returns a map of domain → PercentileResult.
 *
 * Supports both static (published) and dynamic (local DB) reference groups.
 * Pass dynamicGroups to inject ReferenceGroup objects that aren't in the
 * static REFERENCE_GROUPS array (e.g. local norms built from DB).
 *
 * @param gender - When provided, selects gender-specific Study 1 norms for SD3 traits.
 * @param dynamicGroups - Optional map of groupId → ReferenceGroup for local/dynamic groups.
 */
export function calculateAllPercentiles(
	scores: Partial<Record<PersonalityDomain, number>>,
	oceanGroupId?: string,
	darkTriadGroupId?: string,
	gender?: 'male' | 'female' | 'other',
	dynamicGroups?: Record<string, ReferenceGroup>
): Record<string, PercentileResult> {
	const defaults = getDefaultReferenceGroupIds(gender);
	const oceanRef = oceanGroupId || defaults.ocean;
	const darkRef = darkTriadGroupId || defaults.darkTriad;

	const results: Record<string, PercentileResult> = {};

	for (const [domain, score] of Object.entries(scores)) {
		if (score == null) continue;
		const isOcean = OCEAN_DOMAINS.includes(domain as OceanDomain);
		const groupId = isOcean ? oceanRef : darkRef;

		// Check dynamic groups first, then fall back to static lookup
		const dynGroup = dynamicGroups?.[groupId];
		const result = dynGroup
			? calculateDomainPercentileFromGroup(domain as PersonalityDomain, score, dynGroup)
			: calculateDomainPercentile(domain as PersonalityDomain, score, groupId);

		if (result) {
			results[domain] = result;
		}
	}

	return results;
}

// ─── UI Helpers ────────────────────────────────────────────────────────────────

/**
 * Get all available reference groups formatted for a dropdown selector.
 */
export function getReferenceGroupOptions(): Array<{
	id: string;
	label: string;
	labelVi: string;
	type: 'ocean' | 'darkTriad';
	n: number;
}> {
	return REFERENCE_GROUPS.map(g => ({
		id: g.id,
		label: g.label,
		labelVi: g.labelVi,
		type: g.domains.includes('extraversion' as OceanDomain) ? 'ocean' as const : 'darkTriad' as const,
		n: Object.values(g.norms)[0]?.n ?? 0,
	}));
}
