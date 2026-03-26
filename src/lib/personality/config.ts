/* ════════════════════════════════════════════════════════════════════════
   Test Configuration

   Builds the client-facing test configuration DTO by composing
   data from questions and labels modules.
   ════════════════════════════════════════════════════════════════════════ */

import { BFI2S_QUESTIONS } from './questions/bfi2s';
import { SD3_QUESTIONS } from './questions/sd3';
import { LIKERT_MIN, LIKERT_MAX, LIKERT_LABELS } from './labels';

/**
 * Get the full test configuration for the client.
 * Questions are sorted by formOrder so they appear in Google Form order.
 */
export function getTestConfig() {
	const bfiSorted = [...BFI2S_QUESTIONS].sort((a, b) => a.formOrder - b.formOrder);
	const sd3Sorted = [...SD3_QUESTIONS].sort((a, b) => a.formOrder - b.formOrder);

	return {
		bfiQuestions: bfiSorted,
		sd3Questions: sd3Sorted,
		totalQuestions: BFI2S_QUESTIONS.length + SD3_QUESTIONS.length,
		likertScale: {
			min: LIKERT_MIN,
			max: LIKERT_MAX,
			labels: LIKERT_LABELS,
		},
	};
}
