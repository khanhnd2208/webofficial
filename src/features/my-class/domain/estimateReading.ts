/** Estimate reading time from HTML. Vietnamese ~200 wpm. */
export function estimateReadingMinutes(
	html: string | null | undefined,
	wordsPerMinute = 200,
): number {
	if (!html) return 1;
	const text = html
		.replace(/<script[\s\S]*?<\/script>/gi, ' ')
		.replace(/<style[\s\S]*?<\/style>/gi, ' ')
		.replace(/<[^>]+>/g, ' ')
		.replace(/&nbsp;/gi, ' ')
		.replace(/\s+/g, ' ')
		.trim();
	if (!text) return 1;
	const words = text.split(' ').filter(Boolean).length;
	return Math.max(1, Math.ceil(words / wordsPerMinute));
}

export function formatDuration(minutes: number): string {
	if (minutes < 60) return `~${minutes} phút`;
	const hours = Math.floor(minutes / 60);
	const rest = minutes % 60;
	if (!rest) return `~${hours} giờ`;
	return `~${hours} giờ ${rest} phút`;
}

export function formatDurationShort(minutes: number): string {
	if (minutes < 60) return `${minutes} phút`;
	const hours = Math.floor(minutes / 60);
	const rest = minutes % 60;
	return rest ? `${hours}g ${rest}p` : `${hours} giờ`;
}
