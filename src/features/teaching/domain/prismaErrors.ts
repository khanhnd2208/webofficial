import { Prisma } from '@prisma/client';

import { AppError } from '@/lib/appError';

export function isUniqueConflict(error: unknown): boolean {
	return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

export async function withUniqueConflict<T>(
	message: string,
	run: () => Promise<T>,
	code = 'CONFLICT',
): Promise<T> {
	try {
		return await run();
	} catch (error) {
		if (isUniqueConflict(error)) throw new AppError(message, 409, code);
		throw error;
	}
}

export function toNumber(value: Prisma.Decimal | number | string | null | undefined): number {
	if (value == null) return 0;
	return Number(value);
}

export function toIsoDate(value: Date | null | undefined): string | null {
	if (!value) return null;
	return value.toISOString().slice(0, 10);
}

export function toIso(value: Date | null | undefined): string | null {
	return value ? value.toISOString() : null;
}

export function parseIsoDate(value: string | null | undefined): Date | null {
	if (!value) return null;
	return new Date(`${value}T00:00:00.000Z`);
}
