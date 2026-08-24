export interface ScoredAnswer {
	questionId: string;
	knowledgeUnitIds: string[];
	earned: number;
	max: number;
	isCorrect: boolean;
}

export interface KuEvidenceRow {
	knowledgeUnitId: string;
	questionCount: number;
	correctCount: number;
	weight: number;
}

export function kuShare(knowledgeUnitCount: number): number {
	if (knowledgeUnitCount <= 0) return 0;
	return 1 / knowledgeUnitCount;
}

export function creditRatio(earned: number, max: number): number {
	if (max <= 0) return 0;
	return Math.min(1, Math.max(0, earned / max));
}

export function buildKuEvidence(answers: ScoredAnswer[]): KuEvidenceRow[] {
	const rows = new Map<string, KuEvidenceRow>();
	for (const answer of answers) {
		const share = kuShare(answer.knowledgeUnitIds.length);
		const credit = creditRatio(answer.earned, answer.max);
		for (const knowledgeUnitId of answer.knowledgeUnitIds) {
			const row = rows.get(knowledgeUnitId) ?? {
				knowledgeUnitId,
				questionCount: 0,
				correctCount: 0,
				weight: 0,
			};
			row.questionCount += share;
			row.weight += share;
			row.correctCount += share * credit;
			rows.set(knowledgeUnitId, row);
		}
	}
	return [...rows.values()];
}

export function weightedAccuracy(correctCount: number, questionCount: number): number {
	if (questionCount <= 0) return 0;
	return Math.round((correctCount / questionCount) * 100);
}

export function optionKeysOf(options: Array<{ key: string }>): Set<string> {
	return new Set(options.map((option) => option.key));
}
