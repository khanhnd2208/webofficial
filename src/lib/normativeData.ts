/* ════════════════════════════════════════════════════════════════════════
   Normative Data & Percentile Calculation Engine
   
   Provides normative reference data for:
   - BFI-2-S (Big Five, Short Form): Soto & John (2017) — Internet sample N=3,071
   - SD3 (Short Dark Triad): Jones & Paulhus (2014) — MTurk samples
   
   Percentile Calculation Method:
   - Z-score = (individual_score - group_mean) / group_SD
   - Percentile = Φ(z) × 100  where Φ is the standard normal CDF
   - Assumes approximately normal distribution of trait scores
   
   Reference Groups:
   1. BFI-2-S: Internet Sample norms from Soto & John (2017), Table 1, N=3,071.
      ⚠️  NOTE: These are the SHORT-FORM (BFI-2-S, 6 items/domain) norms,
      NOT the full BFI-2 norms. The BFI-2-S has slightly larger SDs than the
      full BFI-2 (fewer items = less reliability = more score variance).
      Using the correct BFI-2-S norms prevents artificially extreme percentiles.
   2. SD3: Gender-specific norms from Jones & Paulhus (2014) Study 1 (N=489).
      PRIMARY norms: Male (N=259) and Female (N=230) from Study 1.
      'Other' gender uses average of male + female norms.
      Pooled community norms (Studies 1-3) also retained for reference.
   
   Level Assignment (5-tier z-score system):
   - Z ≥  1.5 → Rất cao  (Very High)
   - Z ≥  0.5 → Cao      (High)
   - Z ≥ -0.5 → Trung bình (Moderate)
   - Z ≥ -1.5 → Thấp     (Low)
   - Z <  -1.5 → Rất thấp (Very Low)
   
   ⚠️  ITEM COUNT NOTES:
   - BFI-2-S Open-Mindedness: 6 scored items (academic items 5R, 10, 15, 20R, 25, 30R).
     Form position 25 is an attention check with synthetic itemNumber 99 (excluded from scoring).
     Academic item 25 was RESTORED at formOrder 26. O norms match published BFI-2-S norms.
   - SD3 Narcissism: 9 scored items (N10-N18) as published.
     Form position 17 is an attention check with synthetic itemNumber 98 (excluded from scoring).
     Academic item N17R was RESTORED at formOrder 18.
   
   ════════════════════════════════════════════════════════════════════════ */

import type { OceanDomain, DarkTriadDomain, PersonalityDomain } from '@/types/personalityTest';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface NormativeStats {
	mean: number;
	sd: number;
	n: number;
}

export interface ReferenceGroup {
	/** Machine-readable key */
	id: string;
	/** Display name (English) */
	label: string;
	/** Display name (Vietnamese) */
	labelVi: string;
	/** Short description of the sample */
	description: string;
	/** Vietnamese description */
	descriptionVi: string;
	/** Academic source citation */
	source: string;
	/** Which domains this group has norms for */
	domains: PersonalityDomain[];
	/** Normative statistics per domain */
	norms: Partial<Record<PersonalityDomain, NormativeStats>>;
}

export interface PercentileResult {
	domain: PersonalityDomain;
	score: number;
	referenceGroupId: string;
	referenceGroupLabel: string;
	referenceGroupLabelVi: string;
	mean: number;
	sd: number;
	zScore: number;
	percentile: number;
	/** Interpretation label */
	interpretation: string;
	interpretationVi: string;
}

// ─── BFI-2-S Normative Data ────────────────────────────────────────────────────
// Source: Soto & John (2017). "Short and extra-short forms of the Big Five
// Inventory–2: The BFI-2-S and BFI-2-XS." Journal of Research in Personality,
// 68, 69-81. Table 1 — Internet Sample, N = 3,071 (all genders pooled).
// Scale: 1-5 (item means, 6 items per domain in BFI-2-S).
//
// ⚠️  IMPORTANT: These are the BFI-2-S SHORT FORM norms, NOT the full BFI-2 norms.
// The BFI-2-S has slightly larger SDs than the full 60-item BFI-2 because
// 6 items per domain is less reliable than 12 items per domain.
//
// Full BFI-2 norms for comparison (NOT used):
//   E: M=3.2165, SD=0.72822  ← SD too small (underestimates variance)
//   A: M=3.8175, SD=0.63391
//   C: M=3.8857, SD=0.72289
//   N: M=2.7155, SD=0.89516
//   O: M=3.6491, SD=0.68558
//
// BFI-2-S norms from Table 1 (CORRECT values used below):
//   E: M=3.22, SD=0.80
//   A: M=3.82, SD=0.72
//   C: M=3.89, SD=0.84
//   N: M=2.72, SD=0.97
//   O: M=3.65, SD=0.77

const BFI2_INTERNET_NORMS: Record<OceanDomain, NormativeStats> = {
	extraversion:         { mean: 3.22, sd: 0.80, n: 3071 },
	agreeableness:        { mean: 3.82, sd: 0.72, n: 3071 },
	conscientiousness:    { mean: 3.89, sd: 0.84, n: 3071 },
	negativeEmotionality: { mean: 2.72, sd: 0.97, n: 3071 },
	openMindedness:       { mean: 3.65, sd: 0.77, n: 3071 },
};

// BFI-2 Facet-level norms (15 facets, 4 items each in FULL BFI-2, NOT BFI-2-S)
// From the full BFI-2 Internet sample N=3,071 (Soto & John 2017, bfi2-descriptives)
// ⚠️  These facet norms are from the FULL BFI-2, not the BFI-2-S.
//     BFI-2-S does not include facet-level scoring (only domain-level).
//     Retained here for potential future reference only.
const BFI2_FACET_NORMS = {
	// Extraversion facets
	sociability:          { mean: 2.9871, sd: 0.98415, n: 3071 },
	assertiveness:        { mean: 3.2816, sd: 0.86328, n: 3071 },
	energyLevel:          { mean: 3.3808, sd: 0.84653, n: 3071 },
	// Agreeableness facets
	compassion:           { mean: 3.8908, sd: 0.77312, n: 3071 },
	respectfulness:       { mean: 4.1470, sd: 0.73868, n: 3071 },
	trust:                { mean: 3.4146, sd: 0.79197, n: 3071 },
	// Conscientiousness facets
	organization:         { mean: 3.8848, sd: 0.90974, n: 3071 },
	productiveness:       { mean: 3.8484, sd: 0.83871, n: 3071 },
	responsibility:       { mean: 3.9239, sd: 0.77297, n: 3071 },
	// Negative Emotionality facets
	anxiety:              { mean: 3.0516, sd: 0.98419, n: 3071 },
	depression:           { mean: 2.4773, sd: 1.00077, n: 3071 },
	emotionalVolatility:  { mean: 2.6175, sd: 0.99932, n: 3071 },
	// Open-Mindedness facets
	intellectualCuriosity: { mean: 3.6980, sd: 0.78033, n: 3071 },
	aestheticSensitivity:  { mean: 3.4931, sd: 0.89541, n: 3071 },
	creativeImagination:   { mean: 3.7562, sd: 0.80714, n: 3071 },
} as const;

// ─── SD3 Normative Data ────────────────────────────────────────────────────────
// Source: Jones & Paulhus (2014). "Introducing the Short Dark Triad (SD3)"
// Assessment, 21(1), 28-41. doi:10.1177/1073191113514105
//
// Scale: 1-5 (item means, after reversals)
// Data from Table 3 of the paper.
//
// ⚠️  NARCISSISM ITEM COUNT NOTE:
// The official SD3 Narcissism scale has 9 items (N10–N18), with N11 and N15
// reversed, and N17R ("I feel embarrassed if someone compliments me") also reversed.
// Our survey now correctly scores ALL 9 items:
// - Form position 17 uses synthetic itemNumber 98 as an attention check (excluded).
// - Academic item N17R (itemNumber 17, "I feel embarrassed...") is at formOrder 18.
// - Academic item N15R (itemNumber 15, "I am an average person") is at formOrder 24.
// Narcissism percentiles use the full published 9-item norms — no approximation needed.
//
// We provide multiple reference groups:
// 1. Pooled across all 3 studies (calculated weighted average)
// 2. Study 3 only (N=230, the validation study with full battery)
// 3. Gender-specific from Study 3

// Study 1: N=489 (MTurk community adults)
const SD3_STUDY1 = {
	male:   { n: 259, mach: { m: 3.40, sd: 0.55 }, narc: { m: 2.92, sd: 0.45 }, psych: { m: 2.26, sd: 0.61 } },
	female: { n: 230, mach: { m: 3.27, sd: 0.56 }, narc: { m: 2.78, sd: 0.48 }, psych: { m: 1.96, sd: 0.57 } },
};

// Study 2: N=279 (MTurk community adults)
const SD3_STUDY2 = {
	male:   { n: 151, mach: { m: 3.19, sd: 0.57 }, narc: { m: 2.96, sd: 0.54 }, psych: { m: 2.38, sd: 0.63 } },
	female: { n: 128, mach: { m: 3.03, sd: 0.53 }, narc: { m: 2.77, sd: 0.59 }, psych: { m: 2.00, sd: 0.54 } },
};

// Study 3: N=230 (MTurk, validation study)
const SD3_STUDY3 = {
	male:   { n: 97,  mach: { m: 3.12, sd: 0.67 }, narc: { m: 2.83, sd: 0.57 }, psych: { m: 2.41, sd: 0.63 } },
	female: { n: 133, mach: { m: 2.91, sd: 0.53 }, narc: { m: 2.64, sd: 0.56 }, psych: { m: 2.04, sd: 0.57 } },
};

/**
 * Calculate pooled weighted mean and SD from multiple study groups.
 * Uses the standard formula for combining means and variances from independent samples.
 */
function pooledStats(...groups: Array<{ n: number; m: number; sd: number }>): NormativeStats {
	const totalN = groups.reduce((sum, g) => sum + g.n, 0);
	const pooledMean = groups.reduce((sum, g) => sum + g.n * g.m, 0) / totalN;
	// Pooled variance = weighted average of (variance + squared deviation from pooled mean)
	const pooledVar = groups.reduce((sum, g) => {
		return sum + g.n * (g.sd * g.sd + (g.m - pooledMean) ** 2);
	}, 0) / totalN;
	return { mean: Math.round(pooledMean * 10000) / 10000, sd: Math.round(Math.sqrt(pooledVar) * 10000) / 10000, n: totalN };
}

// Pre-calculate pooled norms (all 3 studies, all genders)
const SD3_POOLED_ALL: Record<DarkTriadDomain, NormativeStats> = {
	machiavellianism: pooledStats(
		{ n: SD3_STUDY1.male.n, m: SD3_STUDY1.male.mach.m, sd: SD3_STUDY1.male.mach.sd },
		{ n: SD3_STUDY1.female.n, m: SD3_STUDY1.female.mach.m, sd: SD3_STUDY1.female.mach.sd },
		{ n: SD3_STUDY2.male.n, m: SD3_STUDY2.male.mach.m, sd: SD3_STUDY2.male.mach.sd },
		{ n: SD3_STUDY2.female.n, m: SD3_STUDY2.female.mach.m, sd: SD3_STUDY2.female.mach.sd },
		{ n: SD3_STUDY3.male.n, m: SD3_STUDY3.male.mach.m, sd: SD3_STUDY3.male.mach.sd },
		{ n: SD3_STUDY3.female.n, m: SD3_STUDY3.female.mach.m, sd: SD3_STUDY3.female.mach.sd },
	),
	narcissism: pooledStats(
		{ n: SD3_STUDY1.male.n, m: SD3_STUDY1.male.narc.m, sd: SD3_STUDY1.male.narc.sd },
		{ n: SD3_STUDY1.female.n, m: SD3_STUDY1.female.narc.m, sd: SD3_STUDY1.female.narc.sd },
		{ n: SD3_STUDY2.male.n, m: SD3_STUDY2.male.narc.m, sd: SD3_STUDY2.male.narc.sd },
		{ n: SD3_STUDY2.female.n, m: SD3_STUDY2.female.narc.m, sd: SD3_STUDY2.female.narc.sd },
		{ n: SD3_STUDY3.male.n, m: SD3_STUDY3.male.narc.m, sd: SD3_STUDY3.male.narc.sd },
		{ n: SD3_STUDY3.female.n, m: SD3_STUDY3.female.narc.m, sd: SD3_STUDY3.female.narc.sd },
	),
	psychopathy: pooledStats(
		{ n: SD3_STUDY1.male.n, m: SD3_STUDY1.male.psych.m, sd: SD3_STUDY1.male.psych.sd },
		{ n: SD3_STUDY1.female.n, m: SD3_STUDY1.female.psych.m, sd: SD3_STUDY1.female.psych.sd },
		{ n: SD3_STUDY2.male.n, m: SD3_STUDY2.male.psych.m, sd: SD3_STUDY2.male.psych.sd },
		{ n: SD3_STUDY2.female.n, m: SD3_STUDY2.female.psych.m, sd: SD3_STUDY2.female.psych.sd },
		{ n: SD3_STUDY3.male.n, m: SD3_STUDY3.male.psych.m, sd: SD3_STUDY3.male.psych.sd },
		{ n: SD3_STUDY3.female.n, m: SD3_STUDY3.female.psych.m, sd: SD3_STUDY3.female.psych.sd },
	),
};

// SD3 Study 3 pooled (both genders)
const SD3_STUDY3_POOLED: Record<DarkTriadDomain, NormativeStats> = {
	machiavellianism: pooledStats(
		{ n: SD3_STUDY3.male.n, m: SD3_STUDY3.male.mach.m, sd: SD3_STUDY3.male.mach.sd },
		{ n: SD3_STUDY3.female.n, m: SD3_STUDY3.female.mach.m, sd: SD3_STUDY3.female.mach.sd },
	),
	narcissism: pooledStats(
		{ n: SD3_STUDY3.male.n, m: SD3_STUDY3.male.narc.m, sd: SD3_STUDY3.male.narc.sd },
		{ n: SD3_STUDY3.female.n, m: SD3_STUDY3.female.narc.m, sd: SD3_STUDY3.female.narc.sd },
	),
	psychopathy: pooledStats(
		{ n: SD3_STUDY3.male.n, m: SD3_STUDY3.male.psych.m, sd: SD3_STUDY3.male.psych.sd },
		{ n: SD3_STUDY3.female.n, m: SD3_STUDY3.female.psych.m, sd: SD3_STUDY3.female.psych.sd },
	),
};

// SD3 Study 3 — Male only
const SD3_STUDY3_MALE: Record<DarkTriadDomain, NormativeStats> = {
	machiavellianism: { mean: SD3_STUDY3.male.mach.m, sd: SD3_STUDY3.male.mach.sd, n: SD3_STUDY3.male.n },
	narcissism:       { mean: SD3_STUDY3.male.narc.m, sd: SD3_STUDY3.male.narc.sd, n: SD3_STUDY3.male.n },
	psychopathy:      { mean: SD3_STUDY3.male.psych.m, sd: SD3_STUDY3.male.psych.sd, n: SD3_STUDY3.male.n },
};

// SD3 Study 3 — Female only
const SD3_STUDY3_FEMALE: Record<DarkTriadDomain, NormativeStats> = {
	machiavellianism: { mean: SD3_STUDY3.female.mach.m, sd: SD3_STUDY3.female.mach.sd, n: SD3_STUDY3.female.n },
	narcissism:       { mean: SD3_STUDY3.female.narc.m, sd: SD3_STUDY3.female.narc.sd, n: SD3_STUDY3.female.n },
	psychopathy:      { mean: SD3_STUDY3.female.psych.m, sd: SD3_STUDY3.female.psych.sd, n: SD3_STUDY3.female.n },
};

// SD3 Study 1 — Male only (PRIMARY male norms, N=259)
const SD3_STUDY1_MALE: Record<DarkTriadDomain, NormativeStats> = {
	machiavellianism: { mean: SD3_STUDY1.male.mach.m, sd: SD3_STUDY1.male.mach.sd, n: SD3_STUDY1.male.n },
	narcissism:       { mean: SD3_STUDY1.male.narc.m, sd: SD3_STUDY1.male.narc.sd, n: SD3_STUDY1.male.n },
	psychopathy:      { mean: SD3_STUDY1.male.psych.m, sd: SD3_STUDY1.male.psych.sd, n: SD3_STUDY1.male.n },
};

// SD3 Study 1 — Female only (PRIMARY female norms, N=230)
const SD3_STUDY1_FEMALE: Record<DarkTriadDomain, NormativeStats> = {
	machiavellianism: { mean: SD3_STUDY1.female.mach.m, sd: SD3_STUDY1.female.mach.sd, n: SD3_STUDY1.female.n },
	narcissism:       { mean: SD3_STUDY1.female.narc.m, sd: SD3_STUDY1.female.narc.sd, n: SD3_STUDY1.female.n },
	psychopathy:      { mean: SD3_STUDY1.female.psych.m, sd: SD3_STUDY1.female.psych.sd, n: SD3_STUDY1.female.n },
};

// SD3 Study 1 — "Other" gender: average of male + female norms
const SD3_STUDY1_OTHER: Record<DarkTriadDomain, NormativeStats> = {
	machiavellianism: {
		mean: (SD3_STUDY1.male.mach.m + SD3_STUDY1.female.mach.m) / 2,
		sd:   (SD3_STUDY1.male.mach.sd + SD3_STUDY1.female.mach.sd) / 2,
		n:    SD3_STUDY1.male.n + SD3_STUDY1.female.n,
	},
	narcissism: {
		mean: (SD3_STUDY1.male.narc.m + SD3_STUDY1.female.narc.m) / 2,
		sd:   (SD3_STUDY1.male.narc.sd + SD3_STUDY1.female.narc.sd) / 2,
		n:    SD3_STUDY1.male.n + SD3_STUDY1.female.n,
	},
	psychopathy: {
		mean: (SD3_STUDY1.male.psych.m + SD3_STUDY1.female.psych.m) / 2,
		sd:   (SD3_STUDY1.male.psych.sd + SD3_STUDY1.female.psych.sd) / 2,
		n:    SD3_STUDY1.male.n + SD3_STUDY1.female.n,
	},
};

// ─── Reference Groups ──────────────────────────────────────────────────────────

const OCEAN_DOMAINS: OceanDomain[] = [
	'extraversion', 'agreeableness', 'conscientiousness',
	'negativeEmotionality', 'openMindedness',
];

const DARK_TRIAD_DOMAINS: DarkTriadDomain[] = [
	'machiavellianism', 'narcissism', 'psychopathy',
];

export const REFERENCE_GROUPS: ReferenceGroup[] = [
	// ── BFI-2-S Groups ──
	{
		id: 'bfi2-internet',
		label: 'BFI-2-S Internet Sample',
		labelVi: 'Mẫu Internet BFI-2-S',
		description: 'General internet population, N=3,071. Mixed ages and genders. BFI-2-S short form norms.',
		descriptionVi: 'Dân số Internet chung, N=3.071. Đa dạng độ tuổi và giới tính. Chuẩn mực BFI-2-S dạng ngắn.',
		source: 'Soto & John (2017). BFI-2-S norms, Table 1, Internet Sample.',
		domains: [...OCEAN_DOMAINS],
		norms: { ...BFI2_INTERNET_NORMS },
	},

	// ── SD3 Groups ──
	{
		id: 'sd3-community',
		label: 'SD3 Community Adults (Pooled)',
		labelVi: 'Người trưởng thành (tổng hợp)',
		description: 'Community adults from 3 studies, total N=998. Amazon MTurk, US/Canada.',
		descriptionVi: 'Người trưởng thành từ 3 nghiên cứu, tổng N=998. Amazon MTurk, Mỹ/Canada.',
		source: 'Jones & Paulhus (2014). Introducing the Short Dark Triad. Assessment, 21(1), 28-41.',
		domains: [...DARK_TRIAD_DOMAINS],
		norms: { ...SD3_POOLED_ALL },
	},
	{
		id: 'sd3-study3',
		label: 'SD3 Validation Study (N=230)',
		labelVi: 'Nghiên cứu kiểm chứng SD3 (N=230)',
		description: 'Concurrent validation study with full Dark Triad battery. N=230 MTurk adults.',
		descriptionVi: 'Nghiên cứu kiểm chứng song song với bộ Dark Triad đầy đủ. N=230.',
		source: 'Jones & Paulhus (2014), Study 3.',
		domains: [...DARK_TRIAD_DOMAINS],
		norms: { ...SD3_STUDY3_POOLED },
	},
	{
		id: 'sd3-male',
		label: 'SD3 Male Adults',
		labelVi: 'Nam giới trưởng thành',
		description: 'Male participants from validation study. N=97.',
		descriptionVi: 'Nam giới từ nghiên cứu kiểm chứng. N=97.',
		source: 'Jones & Paulhus (2014), Study 3 — Males.',
		domains: [...DARK_TRIAD_DOMAINS],
		norms: { ...SD3_STUDY3_MALE },
	},
	{
		id: 'sd3-female',
		label: 'SD3 Female Adults',
		labelVi: 'Nữ giới trưởng thành',
		description: 'Female participants from validation study. N=133.',
		descriptionVi: 'Nữ giới từ nghiên cứu kiểm chứng. N=133.',
		source: 'Jones & Paulhus (2014), Study 3 — Females.',
		domains: [...DARK_TRIAD_DOMAINS],
		norms: { ...SD3_STUDY3_FEMALE },
	},
	// ── SD3 Study 1 Gender-Specific Groups (PRIMARY norms for gender-aware scoring) ──
	{
		id: 'sd3-study1-male',
		label: 'SD3 Study 1 — Male (Primary Norms)',
		labelVi: 'Nam giới — Nghiên cứu 1 (chuẩn mực chính)',
		description: 'Male community adults from Study 1 (N=259). Jones & Paulhus 2014. PRIMARY norms for male respondents.',
		descriptionVi: 'Nam giới trưởng thành từ Nghiên cứu 1 (N=259). Chuẩn mực chính cho người trả lời là nam.',
		source: 'Jones & Paulhus (2014), Study 1 — Males, N=259.',
		domains: [...DARK_TRIAD_DOMAINS],
		norms: { ...SD3_STUDY1_MALE },
	},
	{
		id: 'sd3-study1-female',
		label: 'SD3 Study 1 — Female (Primary Norms)',
		labelVi: 'Nữ giới — Nghiên cứu 1 (chuẩn mực chính)',
		description: 'Female community adults from Study 1 (N=230). Jones & Paulhus 2014. PRIMARY norms for female respondents.',
		descriptionVi: 'Nữ giới trưởng thành từ Nghiên cứu 1 (N=230). Chuẩn mực chính cho người trả lời là nữ.',
		source: 'Jones & Paulhus (2014), Study 1 — Females, N=230.',
		domains: [...DARK_TRIAD_DOMAINS],
		norms: { ...SD3_STUDY1_FEMALE },
	},
	{
		id: 'sd3-study1-other',
		label: 'SD3 Study 1 — Other Gender (Averaged Norms)',
		labelVi: 'Giới tính khác — Nghiên cứu 1 (chuẩn mực trung bình)',
		description: 'Average of male and female Study 1 norms. Used for respondents identifying as "other" gender.',
		descriptionVi: 'Trung bình chuẩn mực nam và nữ từ Nghiên cứu 1. Dùng cho người chọn giới tính "Khác".',
		source: 'Jones & Paulhus (2014), Study 1 — averaged across genders.',
		domains: [...DARK_TRIAD_DOMAINS],
		norms: { ...SD3_STUDY1_OTHER },
	},
];

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
 * @param gender - When provided, selects gender-specific Study 1 norms for SD3 traits.
 */
export function calculateAllPercentiles(
	scores: Partial<Record<PersonalityDomain, number>>,
	oceanGroupId?: string,
	darkTriadGroupId?: string,
	gender?: 'male' | 'female' | 'other'
): Record<string, PercentileResult> {
	const defaults = getDefaultReferenceGroupIds(gender);
	const oceanRef = oceanGroupId || defaults.ocean;
	const darkRef = darkTriadGroupId || defaults.darkTriad;

	const results: Record<string, PercentileResult> = {};

	for (const [domain, score] of Object.entries(scores)) {
		if (score == null) continue;
		const isOcean = OCEAN_DOMAINS.includes(domain as OceanDomain);
		const groupId = isOcean ? oceanRef : darkRef;
		const result = calculateDomainPercentile(domain as PersonalityDomain, score, groupId);
		if (result) {
			results[domain] = result;
		}
	}

	return results;
}

// ─── Exports for UI ────────────────────────────────────────────────────────────

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

/** Re-export the facet norms for potential future use */
export { BFI2_FACET_NORMS };
