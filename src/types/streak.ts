export interface StreakDTO {
	currentStreak: number;
	longestStreak: number;
	lastLoginDate: string;
	/** Recent login days (last 30) for heatmap / display */
	recentDays: string[];
}
