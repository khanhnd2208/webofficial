import { BFI2S_QUESTIONS } from '@/lib/personality/questions/bfi2s';
import { SD3_QUESTIONS } from '@/lib/personality/questions/sd3';
import type { RawResponse } from '@/types/personalityTest';

/** Build a complete valid response set (all 3s, attention checks correct). */
export function buildValidResponses(overrides: Partial<Record<string, number>> = {}): RawResponse[] {
	const responses: RawResponse[] = [];

	for (const q of BFI2S_QUESTIONS) {
		const key = `${q.testType}-${q.itemNumber}`;
		const value =
			overrides[key] ??
			(q.isAttentionCheck ? (q.attentionCheckExpected ?? 3) : 3);
		responses.push({ testType: q.testType, itemNumber: q.itemNumber, value });
	}

	for (const q of SD3_QUESTIONS) {
		const key = `${q.testType}-${q.itemNumber}`;
		const value =
			overrides[key] ??
			(q.isAttentionCheck ? (q.attentionCheckExpected ?? 3) : 3);
		responses.push({ testType: q.testType, itemNumber: q.itemNumber, value });
	}

	return responses;
}

export function buildAllOnesResponses(): RawResponse[] {
	return buildValidResponses(
		Object.fromEntries(
			[...BFI2S_QUESTIONS, ...SD3_QUESTIONS]
				.filter((q) => !q.isAttentionCheck)
				.map((q) => [`${q.testType}-${q.itemNumber}`, 1]),
		),
	);
}
