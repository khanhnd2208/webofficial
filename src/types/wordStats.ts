export interface PracticeResultDTO {
	word: string;
	correct: boolean;
	mode: 'flashcards' | 'mcq' | 'fill-blank' | 'matching';
}

export interface WordStatsDTO {
	word: string;
	correctCount: number;
	wrongCount: number;
	totalAttempts: number;
	accuracy: number; // 0-100
	lastPracticed: string;
}
