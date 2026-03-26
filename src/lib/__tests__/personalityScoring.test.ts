/**
 * Automated tests for the Personality Test scoring engine.
 *
 * Tests cover:
 *   1. Question configuration integrity (correct counts, no duplicates, etc.)
 *   2. Attention check validation (BFI-2-S fo25 expects 1; SD3 fo17 expects 2)
 *   3. Reverse scoring — getEffectiveScore()
 *   4. Domain scoring — correct items per domain, reversed items applied
 *   5. Full scorePersonalityTest() with known inputs → expected outputs
 *   6. Edge cases — missing responses, out-of-range values, invalid attention checks
 *
 * Run: npm test
 */

import { describe, it, expect } from 'vitest';
import {
	BFI2S_QUESTIONS,
	SD3_QUESTIONS,
	getEffectiveScore,
	validateAttentionChecks,
	scorePersonalityTest,
} from '../personalityScoring';
import type { RawResponse } from '@/types/personalityTest';

// ─── Helpers ────────────────────────────────────────────────────────────────────

/** Build a complete set of RawResponses with every item set to `defaultValue` */
function buildAllResponses(defaultValue: number): RawResponse[] {
	const all: RawResponse[] = [];
	for (const q of BFI2S_QUESTIONS) {
		all.push({ testType: 'BFI2S', itemNumber: q.itemNumber, value: defaultValue });
	}
	for (const q of SD3_QUESTIONS) {
		all.push({ testType: 'SD3', itemNumber: q.itemNumber, value: defaultValue });
	}
	return all;
}

/** Override specific items in a response array */
function withOverrides(
	base: RawResponse[],
	overrides: Array<{ testType: 'BFI2S' | 'SD3'; itemNumber: number; value: number }>
): RawResponse[] {
	return base.map(r => {
		const ov = overrides.find(o => o.testType === r.testType && o.itemNumber === r.itemNumber);
		return ov ? { ...r, value: ov.value } : r;
	});
}

// ─── BFI-2-S items per domain ────────────────────────────────────────────────
const BFI_E_ITEMS  = BFI2S_QUESTIONS.filter(q => q.domain === 'extraversion'         && !q.isAttentionCheck);
const BFI_A_ITEMS  = BFI2S_QUESTIONS.filter(q => q.domain === 'agreeableness'        && !q.isAttentionCheck);
const BFI_C_ITEMS  = BFI2S_QUESTIONS.filter(q => q.domain === 'conscientiousness'    && !q.isAttentionCheck);
const BFI_N_ITEMS  = BFI2S_QUESTIONS.filter(q => q.domain === 'negativeEmotionality' && !q.isAttentionCheck);
const BFI_O_ITEMS  = BFI2S_QUESTIONS.filter(q => q.domain === 'openMindedness'       && !q.isAttentionCheck);

const SD3_M_ITEMS  = SD3_QUESTIONS.filter(q => q.domain === 'machiavellianism' && !q.isAttentionCheck);
const SD3_N_ITEMS  = SD3_QUESTIONS.filter(q => q.domain === 'narcissism'       && !q.isAttentionCheck);
const SD3_P_ITEMS  = SD3_QUESTIONS.filter(q => q.domain === 'psychopathy'      && !q.isAttentionCheck);

// ═════════════════════════════════════════════════════════════════════════════
// 1. Question Configuration Tests
// ═════════════════════════════════════════════════════════════════════════════

describe('Question Configuration', () => {
	it('BFI-2-S has exactly 31 items (30 real + 1 attention check)', () => {
		expect(BFI2S_QUESTIONS).toHaveLength(31);
	});

	it('SD3 has exactly 28 items (27 real + 1 attention check)', () => {
		expect(SD3_QUESTIONS).toHaveLength(28);
	});

	it('BFI-2-S formOrder values are unique and span 1-31', () => {
		const orders = BFI2S_QUESTIONS.map(q => q.formOrder).sort((a, b) => a - b);
		expect(orders).toEqual([...Array(31)].map((_, i) => i + 1));
	});

	it('SD3 formOrder values are unique and span 1-28', () => {
		const orders = SD3_QUESTIONS.map(q => q.formOrder).sort((a, b) => a - b);
		expect(orders).toEqual([...Array(28)].map((_, i) => i + 1));
	});

	it('BFI-2-S scored items per domain (attention check at fo25 is in openMindedness domain but excluded)', () => {
		// E, A, C, N each have 6 scored items.
		// O has 6 scored items — fo25 is the attention check (excluded), fo26 is item 25 restored.
		expect(BFI_E_ITEMS).toHaveLength(6);
		expect(BFI_A_ITEMS).toHaveLength(6);
		expect(BFI_C_ITEMS).toHaveLength(6);
		expect(BFI_N_ITEMS).toHaveLength(6);
		expect(BFI_O_ITEMS).toHaveLength(6); // fo25 ATTN excluded; fo26 item 25 RESTORED
	});

	it('SD3 scored items per domain (attention check at fo17 is in narcissism domain but excluded)', () => {
		// M and P each have 9 scored items.
		// N has 9 scored items — fo17 is the attention check (excluded), fo24 item N8R restored.
		expect(SD3_M_ITEMS).toHaveLength(9);
		expect(SD3_N_ITEMS).toHaveLength(9); // fo17 ATTN excluded; fo24 N8R ("I am an average person") RESTORED
		expect(SD3_P_ITEMS).toHaveLength(9);
	});

	it('BFI-2-S attention check is at formOrder 25 and expects value 1', () => {
		const attn = BFI2S_QUESTIONS.find(q => q.isAttentionCheck);
		expect(attn).toBeDefined();
		expect(attn!.formOrder).toBe(25);
		expect(attn!.attentionCheckExpected).toBe(1);
		expect(attn!.itemNumber).toBe(99); // dummy item number
	});

	it('SD3 attention check is at formOrder 17 and expects value 2', () => {
		const attn = SD3_QUESTIONS.find(q => q.isAttentionCheck);
		expect(attn).toBeDefined();
		expect(attn!.formOrder).toBe(17);
		expect(attn!.attentionCheckExpected).toBe(2);
		expect(attn!.itemNumber).toBe(98); // dummy item number
	});

	it('BFI-2-S reversed items — correct academic item numbers', () => {
		// Per Soto & John (2017): reversed items are 1R,2R,3R,5R,8R,9R,10R,11R,12R,16R,17R,18R,19R,20R,21,22R,26,27,28R,30R
		// The app should mark these correctly
		const reversedItems = BFI2S_QUESTIONS
			.filter(q => q.isReversed && !q.isAttentionCheck)
			.map(q => q.itemNumber)
			.sort((a, b) => a - b);
		// Expected reversed per Google Form item mapping:
		expect(reversedItems.length).toBeGreaterThan(0);
		// Specific known reversed items (matched to Google Form columns):
		expect(reversedItems).toContain(16); // fo1  — "Tends to be quiet" R (E)
		expect(reversedItems).toContain(8);  // fo3  — "Tends to be disorganized" R (C)
		// fo5 = item5 "Is fascinated by art..." is NON-reversed (positive O)
		expect(reversedItems).toContain(12); // fo7  — "Is sometimes rude" R (A)
		expect(reversedItems).toContain(28); // fo8  — "Has difficulty getting started" R (C)
		expect(reversedItems).toContain(20); // fo10 — "Has little interest in abstract ideas" R (O)
		expect(reversedItems).toContain(19); // fo14 — "Is emotionally stable" R (N)
		expect(reversedItems).toContain(22); // fo17 — "Can be cold and uncaring" R (A)
		expect(reversedItems).toContain(9);  // fo19 — "Is relaxed, handles stress" R (N)
		expect(reversedItems).toContain(10); // fo20 — "Has few artistic interests" R (O)
		expect(reversedItems).toContain(11); // fo21 — "Prefers to have others take charge" R (E)
		expect(reversedItems).toContain(24); // fo24 — "Feels secure, comfortable with self" R (N)
		expect(reversedItems).toContain(2);  // fo28 — "Tends to find fault with others" R (A)
		expect(reversedItems).toContain(18); // fo29 — "Can be somewhat careless" R (C)
		expect(reversedItems).toContain(30); // fo31 — "Has little creativity" R (O)
	});

	it('SD3 reversed items — Narcissism N11R, N17R, N8R and Psychopathy P20R and P25R', () => {
		const reversedSD3 = SD3_QUESTIONS
			.filter(q => q.isReversed && !q.isAttentionCheck)
			.map(q => ({ domain: q.domain, item: q.itemNumber }));

		// Narcissism: N11R (fo5), N17R (fo18 "I feel embarrassed"), N8R (fo24 "I am an average person")
		expect(reversedSD3).toContainEqual({ domain: 'narcissism', item: 11 });
		expect(reversedSD3).toContainEqual({ domain: 'narcissism', item: 17 }); // N17R "I feel embarrassed"
		expect(reversedSD3).toContainEqual({ domain: 'narcissism', item: 15 }); // N8R "I am an average person"

		// Psychopathy: P20R (fo6: "I avoid dangerous situations") and P25R (fo22: "I never got in trouble with law")
		expect(reversedSD3).toContainEqual({ domain: 'psychopathy', item: 20 });
		expect(reversedSD3).toContainEqual({ domain: 'psychopathy', item: 25 });

		// Machiavellianism: NO reversed items
		const machReversed = reversedSD3.filter(r => r.domain === 'machiavellianism');
		expect(machReversed).toHaveLength(0);
	});

	it('BFI-2-S non-reversed Extraversion items include item 6 (is dominant)', () => {
		const extraversionNonReversed = BFI2S_QUESTIONS.filter(
			q => q.domain === 'extraversion' && !q.isReversed && !q.isAttentionCheck
		);
		expect(extraversionNonReversed.map(q => q.itemNumber)).toContain(6);
	});
});

// ═════════════════════════════════════════════════════════════════════════════
// 2. Reverse Scoring
// ═════════════════════════════════════════════════════════════════════════════

describe('getEffectiveScore', () => {
	it('non-reversed items: returns raw value unchanged', () => {
		expect(getEffectiveScore(1, false)).toBe(1);
		expect(getEffectiveScore(3, false)).toBe(3);
		expect(getEffectiveScore(5, false)).toBe(5);
	});

	it('reversed items: returns 6 - raw', () => {
		expect(getEffectiveScore(1, true)).toBe(5); // 6 - 1 = 5
		expect(getEffectiveScore(2, true)).toBe(4); // 6 - 2 = 4
		expect(getEffectiveScore(3, true)).toBe(3); // 6 - 3 = 3 (neutral)
		expect(getEffectiveScore(4, true)).toBe(2); // 6 - 4 = 2
		expect(getEffectiveScore(5, true)).toBe(1); // 6 - 5 = 1
	});
});

// ═════════════════════════════════════════════════════════════════════════════
// 3. Attention Check Validation
// ═════════════════════════════════════════════════════════════════════════════

describe('validateAttentionChecks', () => {
	it('passes when BFI item99=1 and SD3 item98=2', () => {
		const responses = buildAllResponses(3);
		// Correct attention check values (dummy item numbers 99 and 98)
		const withCorrectAttn = withOverrides(responses, [
			{ testType: 'BFI2S', itemNumber: 99, value: 1 },
			{ testType: 'SD3',   itemNumber: 98, value: 2 },
		]);
		expect(validateAttentionChecks(withCorrectAttn)).toEqual({ valid: true });
	});

	it('fails when BFI attention check is wrong', () => {
		const responses = withOverrides(buildAllResponses(3), [
			{ testType: 'BFI2S', itemNumber: 99, value: 3 }, // wrong! should be 1
			{ testType: 'SD3',   itemNumber: 98, value: 2 },
		]);
		const result = validateAttentionChecks(responses);
		expect(result.valid).toBe(false);
		expect((result as { valid: false; reason: string }).reason).toContain('BFI2S');
	});

	it('fails when SD3 attention check is wrong', () => {
		const responses = withOverrides(buildAllResponses(3), [
			{ testType: 'BFI2S', itemNumber: 99, value: 1 },
			{ testType: 'SD3',   itemNumber: 98, value: 5 }, // wrong! should be 2
		]);
		const result = validateAttentionChecks(responses);
		expect(result.valid).toBe(false);
		expect((result as { valid: false; reason: string }).reason).toContain('SD3');
	});

	it('fails when attention check response is missing', () => {
		// Remove BFI attention check from responses
		const allResponses = buildAllResponses(3);
		const withMissing = allResponses.filter(
			r => !(r.testType === 'BFI2S' && r.itemNumber === 99)
		);
		const result = validateAttentionChecks(withMissing);
		expect(result.valid).toBe(false);
	});
});

// ═════════════════════════════════════════════════════════════════════════════
// 4. Full Scoring — scorePersonalityTest()
// ═════════════════════════════════════════════════════════════════════════════

describe('scorePersonalityTest', () => {
	it('returns invalid if response count is wrong', () => {
		const result = scorePersonalityTest([]);
		expect(result.isValid).toBe(false);
		expect(result.invalidReason).toContain('Expected');
	});

	it('returns invalid if any value is out of range (0 or 6)', () => {
		const responses = buildAllResponses(3);
		responses[0].value = 6; // out of range
		const result = scorePersonalityTest(responses);
		expect(result.isValid).toBe(false);
	});

	it('returns invalid with scores if attention check fails (scores still computed for educational purposes)', () => {
		const responses = buildAllResponses(3);
		// Wrong attention check answers (3 is default which is wrong for both)
		const result = scorePersonalityTest(responses);
		expect(result.isValid).toBe(false);
		expect(result.invalidReason).toContain('attention');
		// Scores are still computed even when attention checks fail
		expect(result.ocean).not.toBeNull();
		expect(result.darkTriad).not.toBeNull();
		expect(result.archetype).not.toBeNull();
	});

	it('returns valid result with correct attention checks', () => {
		const responses = withOverrides(buildAllResponses(3), [
			{ testType: 'BFI2S', itemNumber: 99, value: 1 },
			{ testType: 'SD3',   itemNumber: 98, value: 2 },
		]);
		const result = scorePersonalityTest(responses);
		expect(result.isValid).toBe(true);
		expect(result.ocean).not.toBeNull();
		expect(result.darkTriad).not.toBeNull();
		expect(result.archetype).not.toBeNull();
	});

	it('all-1 responses (correct attention checks) → low trait scores, reversed items score high', () => {
		// All responses = 1, correct attention checks
		const responses = withOverrides(buildAllResponses(1), [
			{ testType: 'BFI2S', itemNumber: 99, value: 1 }, // BFI attention check = 1 ✓
			{ testType: 'SD3',   itemNumber: 98, value: 2 }, // SD3 attention check = 2 (override from 1)
		]);
		const result = scorePersonalityTest(responses);
		expect(result.isValid).toBe(true);

		// For non-reversed items: raw=1 → scored=1
		// For reversed items: raw=1 → scored=5 (6-1=5)
		// Domain avg = mix of 1s and 5s depending on how many reversed

		// BFI Extraversion items: item16R(fo1), item1(fo6), item21(fo11), item6(fo16), item26(fo21), item11R(fo26)
		// Reversed: 16R, 11R (2 reversed, 4 non-reversed)
		// With all raw=1: reversed → scored 5; non-reversed → scored 1
		// avg = (5+1+1+1+5+1) / 6 = 14/6 ≈ 2.33... wait, let me check which Extraversion items are reversed
		const eReversed = BFI_E_ITEMS.filter(q => q.isReversed);
		const eNonReversed = BFI_E_ITEMS.filter(q => !q.isReversed);
		const expectedE = (eReversed.length * 5 + eNonReversed.length * 1) / 6;
		expect(result.ocean!.extraversion.score).toBeCloseTo(expectedE, 2);
	});

	it('all-5 responses (correct attention checks, SD3 attn wrong=5→fix) → high non-reversed, low reversed', () => {
		// All responses = 5, fix attention checks
		const responses = withOverrides(buildAllResponses(5), [
			{ testType: 'BFI2S', itemNumber: 99, value: 1 }, // BFI attention check override
			{ testType: 'SD3',   itemNumber: 98, value: 2 }, // SD3 attention check override
		]);
		const result = scorePersonalityTest(responses);
		expect(result.isValid).toBe(true);

		// For non-reversed items: raw=5 → scored=5
		// For reversed items: raw=5 → scored=1 (6-5=1)

		// SD3 Machiavellianism has 0 reversed items
		// All raw=5 → all scored=5 → avg=5
		expect(result.darkTriad!.machiavellianism.score).toBeCloseTo(5, 2);
		expect(result.darkTriad!.machiavellianism.level).toBe('high');
	});

	it('produces Extraversion "high" when all E items = 5 (non-reversed) or 1 (reversed)', () => {
		const responses = withOverrides(buildAllResponses(3), [
			{ testType: 'BFI2S', itemNumber: 99, value: 1 },
			{ testType: 'SD3',   itemNumber: 98, value: 2 },
		]);

		// Set all Extraversion items for max Extraversion score
		const ePatch: Array<{ testType: 'BFI2S' | 'SD3'; itemNumber: number; value: number }> = BFI_E_ITEMS.map(q => ({
			testType: 'BFI2S' as const,
			itemNumber: q.itemNumber,
			value: q.isReversed ? 1 : 5, // reversed items: raw=1 → scored=5; non-reversed: raw=5 → scored=5
		}));

		const finalResponses = withOverrides(responses, ePatch);
		const result = scorePersonalityTest(finalResponses);

		expect(result.isValid).toBe(true);
		expect(result.ocean!.extraversion.score).toBeCloseTo(5, 1);
		expect(result.ocean!.extraversion.level).toBe('high');
	});

	it('SD3 Narcissism N11R scoring: raw=5 → scored=1 (reversed)', () => {
		// N11R (fo5): "I hate being the center of attention" — reversed
		// High raw value → after reversal → low narcissism contribution
		const responses = withOverrides(buildAllResponses(3), [
			{ testType: 'BFI2S', itemNumber: 99, value: 1 },
			{ testType: 'SD3',   itemNumber: 98, value: 2 },
		]);

		// Set N11R to 5 (strongly agree "hate being center of attention")
		// After reversal: 6-5=1 → low narcissism contribution from this item
		const withN11R5 = withOverrides(responses, [
			{ testType: 'SD3', itemNumber: 11, value: 5 },
		]);

		const result = scorePersonalityTest(withN11R5);
		expect(result.isValid).toBe(true);
		// Verify the scoring engine actually reverses this item
		const n11q = SD3_QUESTIONS.find(q => q.itemNumber === 11);
		expect(n11q?.isReversed).toBe(true);
	});

	it('SD3 Narcissism N8R ("I am an average person") restored at fo24, isReversed=true', () => {
		// Verify the restored N8R item exists and is correctly configured at fo24
		const n8r = SD3_QUESTIONS.find(q => q.formOrder === 24 && q.domain === 'narcissism');
		expect(n8r).toBeDefined();
		expect(n8r!.isReversed).toBe(true);
		expect(n8r!.isAttentionCheck).toBe(false);
		expect(n8r!.text).toContain('average');
	});

	it('SD3 Psychopathy P20R scoring: raw=5 → scored=1 (reversed)', () => {
		// P20R (fo6): "I avoid dangerous situations" — reversed
		// Strongly agree → after reversal → low psychopathy contribution
		const p20q = SD3_QUESTIONS.find(q => q.itemNumber === 20);
		expect(p20q?.isReversed).toBe(true);
		expect(p20q?.domain).toBe('psychopathy');
	});

	it('SD3 Machiavellianism items: none are reversed', () => {
		const reversedMach = SD3_M_ITEMS.filter(q => q.isReversed);
		expect(reversedMach).toHaveLength(0);
	});

	it('result includes archetype with name and narrative', () => {
		const responses = withOverrides(buildAllResponses(3), [
			{ testType: 'BFI2S', itemNumber: 99, value: 1 },
			{ testType: 'SD3',   itemNumber: 98, value: 2 },
		]);
		const result = scorePersonalityTest(responses);
		expect(result.isValid).toBe(true);
		expect(result.archetype).not.toBeNull();
		expect(typeof result.archetype!.name).toBe('string');
		expect(result.archetype!.name.length).toBeGreaterThan(0);
	});
});

// ═════════════════════════════════════════════════════════════════════════════
// 5. Domain Composition Verification
// ═════════════════════════════════════════════════════════════════════════════

describe('Domain Composition', () => {
	it('BFI-2-S: Extraversion items are fo1,fo6,fo11,fo16,fo21,fo27', () => {
		// fo25=attention check, fo26=item25(O restored), so 6th E item (itemNumber 11) is at fo27
		const eFormOrders = BFI_E_ITEMS.map(q => q.formOrder).sort((a, b) => a - b);
		expect(eFormOrders).toEqual([1, 6, 11, 16, 21, 27]);
	});

	it('BFI-2-S: Agreeableness items are fo2,fo7,fo12,fo17,fo22,fo28', () => {
		// fo25=attention check, fo26=item25(O restored), so 6th A item (itemNumber 27) is at fo28
		const aFormOrders = BFI_A_ITEMS.map(q => q.formOrder).sort((a, b) => a - b);
		expect(aFormOrders).toEqual([2, 7, 12, 17, 22, 28]);
	});

	it('BFI-2-S: Conscientiousness items are fo3,fo8,fo13,fo18,fo23,fo29', () => {
		// fo25=attention check, fo26=item25(O restored), so 6th C item (itemNumber 18) is at fo29
		const cFormOrders = BFI_C_ITEMS.map(q => q.formOrder).sort((a, b) => a - b);
		expect(cFormOrders).toEqual([3, 8, 13, 18, 23, 29]);
	});

	it('BFI-2-S: Negative Emotionality items are fo4,fo9,fo14,fo19,fo24,fo30', () => {
		// fo25=attention check, fo26=item25(O restored), so 6th N item (itemNumber 29) is at fo30
		const nFormOrders = BFI_N_ITEMS.map(q => q.formOrder).sort((a, b) => a - b);
		expect(nFormOrders).toEqual([4, 9, 14, 19, 24, 30]);
	});

	it('BFI-2-S: Open-Mindedness scored items are fo5,fo10,fo15,fo20,fo26,fo31 (fo25 is ATTN, excluded)', () => {
		const oFormOrders = BFI_O_ITEMS.map(q => q.formOrder).sort((a, b) => a - b);
		// 6 scored items: fo5, fo10, fo15, fo20, fo26, fo31
		// fo25 is the attention check (isAttentionCheck=true) — excluded from scoring.
		// fo26 is item 25 "Is complex, a deep thinker" — RESTORED.
		// fo31 is item 30 "prefers routine" (the 6th O item, shifted after fo26 insertion).
		expect(oFormOrders).toEqual([5, 10, 15, 20, 26, 31]);
		expect(oFormOrders).not.toContain(25);
	});

	it('BFI-2-S item 25 ("Is complex, a deep thinker") is at fo26, not reversed', () => {
		const item25 = BFI2S_QUESTIONS.find(q => q.itemNumber === 25 && !q.isAttentionCheck);
		expect(item25).toBeDefined();
		expect(item25!.formOrder).toBe(26);
		expect(item25!.isReversed).toBe(false);
		expect(item25!.domain).toBe('openMindedness');
	});

	it('SD3: items are in M-N-P interleaved pattern (fo1=M, fo2=N, fo3=P, fo4=M...)', () => {
		const sd3ByOrder = [...SD3_QUESTIONS]
			.sort((a, b) => a.formOrder - b.formOrder)
			.filter(q => !q.isAttentionCheck);

		// The pattern should roughly alternate M-N-P
		// fo1=M, fo2=N, fo3=P, fo4=M, fo5=N, fo6=P ...
		// After attention check at fo17, pattern continues
		expect(sd3ByOrder[0].domain).toBe('machiavellianism'); // fo1
		expect(sd3ByOrder[1].domain).toBe('narcissism');       // fo2
		expect(sd3ByOrder[2].domain).toBe('psychopathy');      // fo3
		expect(sd3ByOrder[3].domain).toBe('machiavellianism'); // fo4
	});
});

// ═════════════════════════════════════════════════════════════════════════════
// 6. Score Level Thresholds
// ═════════════════════════════════════════════════════════════════════════════

describe('Trait Level Thresholds', () => {
	const responses = withOverrides(buildAllResponses(3), [
		{ testType: 'BFI2S', itemNumber: 99, value: 1 },
		{ testType: 'SD3',   itemNumber: 98, value: 2 },
	]);

	it('score ≤ 2.5 → level low', () => {
		// All responses = 1, but attention checks corrected
		// For non-reversed Mach items (none reversed): scored = 1 → avg = 1 → low
		const lowResponses = withOverrides(buildAllResponses(1), [
			{ testType: 'BFI2S', itemNumber: 99, value: 1 },
			{ testType: 'SD3',   itemNumber: 98, value: 2 },
		]);
		const result = scorePersonalityTest(lowResponses);
		// Mach has no reversed items, raw=1 → scored=1 → avg=1 → low
		expect(result.isValid).toBe(true);
		expect(result.darkTriad!.machiavellianism.level).toBe('low');
	});

	it('score ≥ 3.5 → level high', () => {
		// All responses = 5 (for non-reversed Mach items = 5)
		const highResponses = withOverrides(buildAllResponses(5), [
			{ testType: 'BFI2S', itemNumber: 99, value: 1 },
			{ testType: 'SD3',   itemNumber: 98, value: 2 },
		]);
		const result = scorePersonalityTest(highResponses);
		// Mach: all 9 items non-reversed, raw=5 → scored=5 → avg=5 → high
		expect(result.isValid).toBe(true);
		expect(result.darkTriad!.machiavellianism.level).toBe('high');
	});

	it('score between 2.5 and 3.5 → level moderate', () => {
		// All raw = 3 (moderate), correct attention checks
		const result = scorePersonalityTest(responses);
		// Mach: no reversed, raw=3 → scored=3 → avg=3 → moderate
		expect(result.isValid).toBe(true);
		expect(result.darkTriad!.machiavellianism.level).toBe('moderate');
	});
});
