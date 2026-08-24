export interface PerformanceKuRow {
	knowledgeUnitId: string;
	slug: string;
	title: string;
	attempts: number;
	evidence: number;
	correct: number;
	accuracy: number | null;
}

export interface PerformanceStudentRow {
	userId: string;
	email: string;
	name: string;
	attempts: number;
	evidence: number;
	accuracy: number;
	lastActivityAt: string | null;
}

export interface PerformanceAttemptRow {
	id: string;
	testTitle: string;
	score: number;
	total: number;
	earnedPoints?: number;
	totalPoints?: number;
	submittedAt: string;
	knowledgeUnits: PerformanceKuRow[];
}
