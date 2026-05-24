/* ════════════════════════════════════════════════════════════════════════
   Normative Data — Reference Norms

   Published normative statistics for:
   - BFI-2-S: Soto & John (2017) — Internet sample N=3,071
   - SD3: Jones & Paulhus (2014) — MTurk samples (Studies 1-3)

   Also defines the REFERENCE_GROUPS array used by the percentile engine
   and UI selectors.

   See normativeData module docs for detailed academic references.
   ════════════════════════════════════════════════════════════════════════ */

import type { OceanDomain, DarkTriadDomain } from '@/types/personalityTest';
import type { NormativeStats, ReferenceGroup } from './types';

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
export const BFI2_FACET_NORMS = {
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

// ─── Domain Lists ──────────────────────────────────────────────────────────────

export const OCEAN_DOMAINS: OceanDomain[] = [
	'extraversion', 'agreeableness', 'conscientiousness',
	'negativeEmotionality', 'openMindedness',
];

export const DARK_TRIAD_DOMAINS: DarkTriadDomain[] = [
	'machiavellianism', 'narcissism', 'psychopathy',
];

// ─── Local Norms Constants ─────────────────────────────────────────────────────

export const LOCAL_OCEAN_GROUP_ID = 'local-ocean';
export const LOCAL_DARKTRIAD_GROUP_ID = 'local-darktriad';

/**
 * Build a dynamic ReferenceGroup from local DB statistics.
 * Called at runtime when the user selects the "local norms" option.
 */
export function buildLocalReferenceGroup(
	type: 'ocean' | 'darkTriad',
	stats: Record<string, NormativeStats>,
): ReferenceGroup {
	const isOcean = type === 'ocean';
	const domains = isOcean ? [...OCEAN_DOMAINS] : [...DARK_TRIAD_DOMAINS];
	const norms: Partial<Record<string, NormativeStats>> = {};
	for (const d of domains) {
		if (stats[d]) norms[d] = stats[d];
	}
	const n = Object.values(norms)[0]?.n ?? 0;

	return {
		id: isOcean ? LOCAL_OCEAN_GROUP_ID : LOCAL_DARKTRIAD_GROUP_ID,
		label: isOcean
			? `Local Student Norms (BFI-2-S, n=${n})`
			: `Local Student Norms (SD3, n=${n})`,
		labelVi: isOcean
			? `Chuẩn sinh viên tại đây (BFI-2-S, n=${n})`
			: `Chuẩn sinh viên tại đây (SD3, n=${n})`,
		description: isOcean
			? `Your university students who completed this platform's BFI-2-S. N=${n}. Updated live.`
			: `Your university students who completed this platform's SD3. N=${n}. Updated live.`,
		descriptionVi: isOcean
			? `Sinh viên tại trường bạn đã hoàn thành BFI-2-S trên nền tảng này. N=${n}. Cập nhật trực tiếp.`
			: `Sinh viên tại trường bạn đã hoàn thành SD3 trên nền tảng này. N=${n}. Cập nhật trực tiếp.`,
		source: 'Local database — live aggregate from valid sessions on this platform.',
		domains: domains as import('@/types/personalityTest').PersonalityDomain[],
		norms: norms as Partial<Record<import('@/types/personalityTest').PersonalityDomain, NormativeStats>>,
	};
}

// ─── Reference Groups ──────────────────────────────────────────────────────────

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
