/**
 * Display helpers shared by learner Client Components. Keep this file free of zod and
 * other schema imports: anything imported here ships in the reader's browser bundle.
 */
export function formatMinutes(minutes: number): string {
	if (minutes < 60) return `${minutes} phút`;
	const hours = Math.floor(minutes / 60);
	const rest = minutes % 60;
	return rest ? `${hours} giờ ${rest} phút` : `${hours} giờ`;
}
