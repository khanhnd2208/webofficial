/* ════════════════════════════════════════════════════════════════════════
   Shared type for all trait insight content files.
   Each domain file (extraversion.ts, agreeableness.ts …) exports one
   object conforming to this interface in BOTH languages.
   ════════════════════════════════════════════════════════════════════════ */

export interface TraitInsightContent {
	/** Emoji icon shown in the card header */
	icon: string;

	/** 2–3 sentence explanation of what this trait actually measures */
	what: string;

	/** Interpretation when the user scores Very High (Z ≥ +1.5) */
	very_high: string;

	/** Interpretation when the user scores High (+0.5 ≤ Z < +1.5) */
	high: string;

	/** Interpretation when the user scores Moderate (-0.5 ≤ Z < +0.5) */
	moderate: string;

	/** Interpretation when the user scores Low (-1.5 ≤ Z < -0.5) */
	low: string;

	/** Interpretation when the user scores Very Low (Z < -1.5) */
	very_low: string;

	/** Career fit guidance — written in full sentences, NOT "X → Y" lists */
	career: string;

	/** Concrete, actionable student tip */
	tip: string;

	/** Key academic citations and what they mean for the student */
	academic: string;

	/** (Dark Triad only) Specific derailment scenario with real-world detail */
	derailment?: string;

	/** OB / organisational behaviour lesson tied to this trait */
	obLesson?: string;
}
