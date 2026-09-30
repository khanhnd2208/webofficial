/**
 * Shared post constants — safe to import from both client & server components.
 * Keep this file free of any server-only dependencies (mongoose, etc.)
 */

export const POST_CATEGORIES = [
	'Uncategorized',
	'Tech & Programming',
	'English Learning',
	'Tutorial',
	'Life & Thoughts',
	'Review',
	'Tips & Tricks',
] as const;

export type PostCategory = (typeof POST_CATEGORIES)[number];
