/* ════════════════════════════════════════════════════════════════════════
   Scoring Engine

   Core business logic for:
   1. Attention check validation
   2. Reverse scoring
   3. Domain-level trait averaging (BFI-2-S OCEAN + SD3 Dark Triad)

   Academic references:
   - BFI-2-S: Soto & John (2017) — 30-item short form
   - SD3: Jones & Paulhus (2014) — 27-item measure

   IMPORTANT: `itemNumber` = academic item numbering (used for scoring).
              `formOrder`   = order displayed in the Google Form survey (1-based).
   ════════════════════════════════════════════════════════════════════════ */

import type {
	QuestionConfig,
	RawResponse,
	ScoringResult,
	TraitScore,
	OceanScores,
	DarkTriadScores,
	OceanDomain,
	DarkTriadDomain,
	PersonalityDomain,
} from '@/types/personalityTest';

import { BFI2S_QUESTIONS } from './questions/bfi2s';
import { SD3_QUESTIONS } from './questions/sd3';
import {
	LIKERT_MIN,
	LIKERT_MAX,
	REVERSE_CONSTANT,
	LEVEL_LOW_THRESHOLD,
	LEVEL_HIGH_THRESHOLD,
	DOMAIN_LABELS,
} from './labels';
import { generateArchetype } from './archetypes';

// ─── Validation ────────────────────────────────────────────────────────────────

/**
 * Validates that a raw response value is within the Likert scale range.
 */
function isValidLikertValue(value: number): boolean {
	return Number.isInteger(value) && value >= LIKERT_MIN && value <= LIKERT_MAX;
}

/**
 * Step 1: Validate attention checks.
 * Returns { valid: true } or { valid: false, reason: string }.
 */
export function validateAttentionChecks(
	responses: RawResponse[]
): { valid: true } | { valid: false; reason: string } {
	const allQuestions = [...BFI2S_QUESTIONS, ...SD3_QUESTIONS];
	const attentionChecks = allQuestions.filter((q) => q.isAttentionCheck);

	for (const check of attentionChecks) {
		const response = responses.find(
			(r) => r.testType === check.testType && r.itemNumber === check.itemNumber
		);
		if (!response) {
			return {
				valid: false,
				reason: `Missing response for attention check: ${check.testType} item ${check.itemNumber}`,
			};
		}
		if (response.value !== check.attentionCheckExpected) {
			return {
				valid: false,
				reason: `Failed attention check: ${check.testType} item ${check.itemNumber} — expected ${check.attentionCheckExpected}, got ${response.value}`,
			};
		}
	}
	return { valid: true };
}

// ─── Scoring Functions ─────────────────────────────────────────────────────────

/**
 * Step 2: Apply reverse scoring where needed.
 * Returns the effective score for a given response.
 */
export function getEffectiveScore(
	rawValue: number,
	isReversed: boolean
): number {
	return isReversed ? REVERSE_CONSTANT - rawValue : rawValue;
}

/**
 * Step 3: Calculate the average score for a specific domain.
 */
function calculateDomainScore(
	domain: PersonalityDomain,
	questions: QuestionConfig[],
	responses: RawResponse[]
): number {
	const domainQuestions = questions.filter(
		(q) => q.domain === domain && !q.isAttentionCheck
	);

	if (domainQuestions.length === 0) return 0;

	let total = 0;
	let count = 0;

	for (const q of domainQuestions) {
		const response = responses.find(
			(r) => r.testType === q.testType && r.itemNumber === q.itemNumber
		);
		if (response && isValidLikertValue(response.value)) {
			total += getEffectiveScore(response.value, q.isReversed);
			count++;
		}
	}

	return count > 0 ? Math.round((total / count) * 100) / 100 : 0;
}

/**
 * Determine a preliminary level label for a raw score (1-5 scale).
 * This is a coarse 3-tier estimate used immediately after scoring,
 * before z-score calculation. The results dashboard overrides this
 * with the 5-tier z-score system once percentiles are computed.
 */
function getLevel(score: number): 'very_low' | 'low' | 'moderate' | 'high' | 'very_high' {
	if (score < LEVEL_LOW_THRESHOLD) return 'low';
	if (score > LEVEL_HIGH_THRESHOLD) return 'high';
	return 'moderate';
}

/**
 * Build a TraitScore object for a domain.
 */
function buildTraitScore(
	domain: PersonalityDomain,
	questions: QuestionConfig[],
	responses: RawResponse[]
): TraitScore {
	const score = calculateDomainScore(domain, questions, responses);
	return {
		domain,
		score,
		label: DOMAIN_LABELS[domain],
		percentile: null, // Calculated later via aggregation
		level: getLevel(score),
	};
}

// ─── Main Scoring ──────────────────────────────────────────────────────────────

/**
 * Main scoring function: validates, scores, and generates archetype.
 *
 * IMPORTANT: Always computes scores regardless of attention check results.
 * If attention checks fail, isValid=false but ocean/darkTriad/archetype are
 * still populated so users can see results for educational purposes.
 * All data is saved to DB regardless of validity.
 */
export function scorePersonalityTest(responses: RawResponse[]): ScoringResult {
	// ── Validation: count check ──
	// BFI: 30 real items + 1 attention check = 31 total
	// SD3: 27 real items + 1 attention check = 28 total → grand total 59
	const totalExpected = BFI2S_QUESTIONS.length + SD3_QUESTIONS.length;
	if (responses.length !== totalExpected) {
		return {
			isValid: false,
			invalidReason: `Expected ${totalExpected} responses, got ${responses.length}`,
			ocean: null,
			darkTriad: null,
			archetype: null,
		};
	}

	// Validate all values are valid Likert
	for (const r of responses) {
		if (!isValidLikertValue(r.value)) {
			return {
				isValid: false,
				invalidReason: `Invalid response value ${r.value} for ${r.testType} item ${r.itemNumber}`,
				ocean: null,
				darkTriad: null,
				archetype: null,
			};
		}
	}

	// ── Attention Checks — record result but don't block scoring ──
	const attentionResult = validateAttentionChecks(responses);

	// ── Calculate OCEAN Scores (always, regardless of attention check) ──
	const oceanDomains: OceanDomain[] = [
		'extraversion',
		'agreeableness',
		'conscientiousness',
		'negativeEmotionality',
		'openMindedness',
	];
	const oceanScores: OceanScores = {} as OceanScores;
	for (const domain of oceanDomains) {
		oceanScores[domain] = buildTraitScore(domain, BFI2S_QUESTIONS, responses);
	}

	// ── Calculate Dark Triad Scores (always, regardless of attention check) ──
	const darkDomains: DarkTriadDomain[] = [
		'machiavellianism',
		'narcissism',
		'psychopathy',
	];
	const darkTriadScores: DarkTriadScores = {} as DarkTriadScores;
	for (const domain of darkDomains) {
		darkTriadScores[domain] = buildTraitScore(domain, SD3_QUESTIONS, responses);
	}

	// ── Generate Archetype (always) ──
	const archetype = generateArchetype(oceanScores, darkTriadScores);

	return {
		isValid: attentionResult.valid,
		invalidReason: attentionResult.valid ? undefined : attentionResult.reason,
		ocean: oceanScores,
		darkTriad: darkTriadScores,
		archetype,
	};
}
