import { getRoleById } from '@/features/werewolf/config/roles';
import { AppError } from '@/features/spy-fall/lib/appError';
import type { RoleCount } from '@/features/werewolf/types';

export function shuffle<T>(items: T[], random: () => number): T[] {
	const copy = [...items];
	for (let i = copy.length - 1; i > 0; i--) {
		const j = Math.floor(random() * (i + 1));
		[copy[i], copy[j]] = [copy[j]!, copy[i]!];
	}
	return copy;
}

export function buildRolePool(counts: RoleCount[]): string[] {
	const pool: string[] = [];
	for (const selection of counts) {
		for (let i = 0; i < selection.count; i++) pool.push(selection.roleId);
	}
	return pool;
}

export function validateRoleCounts(counts: RoleCount[], playerCount: number): void {
	let total = 0;
	for (const selection of counts) {
		if (!getRoleById(selection.roleId)?.isEnabled) {
			throw new AppError('INVALID_ROLE', 400);
		}
		if (!Number.isInteger(selection.count) || selection.count < 0) {
			throw new AppError('ROLE_COUNT_NEGATIVE', 400);
		}
		total += selection.count;
	}
	if (total !== playerCount) {
		throw new AppError('ROLE_COUNT_MISMATCH', 400, { total, playerCount });
	}
}

export function dealRoles(
	tokens: string[],
	roleCounts: RoleCount[],
	random: () => number = Math.random,
): Map<string, string> {
	const pool = shuffle(buildRolePool(roleCounts), random);
	if (pool.length !== tokens.length) {
		throw new AppError('ROLE_COUNT_MISMATCH', 400, {
			total: pool.length,
			playerCount: tokens.length,
		});
	}
	const assigned = new Map<string, string>();
	tokens.forEach((token, index) => {
		assigned.set(token, pool[index]!);
	});
	return assigned;
}
