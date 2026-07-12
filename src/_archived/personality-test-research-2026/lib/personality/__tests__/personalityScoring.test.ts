import { describe, it, expect } from 'vitest';

import {
	validateAttentionChecks,
	getEffectiveScore,
	scorePersonalityTest,
} from '@/lib/personality/scoringEngine';
import { REVERSE_CONSTANT } from '@/lib/personality/labels';
import { BFI2S_QUESTIONS } from '@/lib/personality/questions/bfi2s';
import { SD3_QUESTIONS } from '@/lib/personality/questions/sd3';
import {
	buildValidResponses,
	buildAllOnesResponses,
} from '@/test/fixtures/personalityResponses';

describe('getEffectiveScore', () => {
	it('returns raw value when not reversed', () => {
		expect(getEffectiveScore(4, false)).toBe(4);
	});

	it('applies reverse scoring', () => {
		expect(getEffectiveScore(1, true)).toBe(REVERSE_CONSTANT - 1);
		expect(getEffectiveScore(5, true)).toBe(1);
	});
});

describe('validateAttentionChecks', () => {
	it('passes when all attention checks are correct', () => {
		const responses = buildValidResponses();
		expect(validateAttentionChecks(responses)).toEqual({ valid: true });
	});

	it('fails when BFI attention check is wrong', () => {
		const responses = buildValidResponses({ 'BFI2S-99': 5 });
		const result = validateAttentionChecks(responses);
		expect(result.valid).toBe(false);
		if (!result.valid) {
			expect(result.reason).toContain('BFI2S item 99');
		}
	});

	it('fails when SD3 attention check is wrong', () => {
		const responses = buildValidResponses({ 'SD3-98': 5 });
		const result = validateAttentionChecks(responses);
		expect(result.valid).toBe(false);
		if (!result.valid) {
			expect(result.reason).toContain('SD3 item 98');
		}
	});

	it('fails when attention check response is missing', () => {
		const responses = buildValidResponses().filter(
			(r) => !(r.testType === 'BFI2S' && r.itemNumber === 99),
		);
		const result = validateAttentionChecks(responses);
		expect(result.valid).toBe(false);
	});
});

describe('scorePersonalityTest', () => {
	it('rejects wrong response count', () => {
		const result = scorePersonalityTest([]);
		expect(result.isValid).toBe(false);
		expect(result.invalidReason).toContain('Expected');
	});

	it('rejects invalid Likert values', () => {
		const responses = buildValidResponses({ 'BFI2S-1': 6 });
		const result = scorePersonalityTest(responses);
		expect(result.isValid).toBe(false);
		expect(result.invalidReason).toContain('Invalid response value');
	});

	it('scores valid responses with all neutral answers', () => {
		const result = scorePersonalityTest(buildValidResponses());
		expect(result.isValid).toBe(true);
		expect(result.ocean).not.toBeNull();
		expect(result.darkTriad).not.toBeNull();
		expect(result.archetype).not.toBeNull();
		for (const domain of [
			'extraversion',
			'agreeableness',
			'conscientiousness',
			'negativeEmotionality',
			'openMindedness',
		] as const) {
			expect(result.ocean![domain].score).toBe(3);
		}
	});

	it('still computes scores when attention check fails', () => {
		const responses = buildValidResponses({ 'BFI2S-99': 5 });
		const result = scorePersonalityTest(responses);
		expect(result.isValid).toBe(false);
		expect(result.ocean).not.toBeNull();
		expect(result.darkTriad).not.toBeNull();
	});

	it('applies reverse scoring for reversed items', () => {
		const responses = buildValidResponses({ 'BFI2S-1': 1 });
		const result = scorePersonalityTest(responses);
		expect(result.ocean!.extraversion.score).toBeGreaterThan(3);
	});

	it('generates archetype from scores', () => {
		const result = scorePersonalityTest(buildAllOnesResponses());
		expect(result.archetype?.name).toBeTruthy();
		expect(result.archetype?.tagline).toBeTruthy();
	});

	it('has expected question counts', () => {
		expect(BFI2S_QUESTIONS.length).toBe(31);
		expect(SD3_QUESTIONS.length).toBe(28);
		expect(BFI2S_QUESTIONS.length + SD3_QUESTIONS.length).toBe(59);
	});
});
