import { AppError } from '@/lib/appError';

/**
 * The group board is intentionally disabled by default. Keeping this check
 * server-side means the flag can be changed at runtime without exposing a
 * public environment variable to the browser.
 */
export function isTeachingGroupBoardEnabled(): boolean {
	return process.env.TEACHING_GROUP_BOARD_ENABLED === 'true';
}

export function assertTeachingGroupBoardEnabled(): void {
	if (!isTeachingGroupBoardEnabled()) {
		throw new AppError('Not found', 404, 'NOT_FOUND');
	}
}
