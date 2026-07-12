/* ════════════════════════════════════════════════════════════════════════
   Normative Data — Types

   Type definitions for normative statistics, reference groups,
   and percentile results.
   ════════════════════════════════════════════════════════════════════════ */

import type { PersonalityDomain } from '@/types/personalityTest';

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
