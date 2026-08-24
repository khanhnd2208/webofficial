import { Prisma } from '@prisma/client';

import { AppError } from '@/lib/appError';

export function isUniqueConflict(error: unknown): boolean {
	return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

export function throwUniqueConflict(error: unknown, message: string): never {
	if (isUniqueConflict(error)) {
		throw new AppError(message, 409, 'CONFLICT');
	}
	throw error;
}

export async function withUniqueConflict<T>(message: string, run: () => Promise<T>): Promise<T> {
	try {
		return await run();
	} catch (error) {
		throwUniqueConflict(error, message);
	}
}
