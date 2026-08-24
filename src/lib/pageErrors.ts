import { notFound } from 'next/navigation';

import { AppError } from './appError';

/** Only an explicit domain 404 may become a not-found page. */
export function rethrowUnlessNotFound(error: unknown): never {
	if (error instanceof AppError && error.status === 404) notFound();
	throw error;
}
