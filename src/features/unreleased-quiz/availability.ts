import { AppError } from '@/lib/appError';

/** Flip this flag to reopen the UNRELEASED quiz and gift for a future event. */
export const UNRELEASED_IS_CLOSED = true;

export const UNRELEASED_CLOSED_MESSAGE = 'Hẹn gặp mọi người ở event lần sau nhé!';

export function assertUnreleasedOpen() {
	if (UNRELEASED_IS_CLOSED) throw new AppError(UNRELEASED_CLOSED_MESSAGE, 410);
}
