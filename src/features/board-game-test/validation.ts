import { z } from 'zod';
import { AppError } from '@/lib/appError';

const game = z.enum(['spy-fall', 'cheese-thief', 'ma-soi']);
export const createSchema = z.object({
	game, hostName: z.string().trim().min(1).max(24), locale: z.enum(['vi', 'en']).optional(),
	playerCount: z.number().int().min(4).max(20).optional(), seed: z.string().max(64).optional(),
	spyCount: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
	adminRole: z.enum(['', 'spy', 'civilian', 'thief', 'sleepyhead', 'scapegoat']).optional(),
	cheeseMode: z.enum(['classic', 'two-night']).optional(), scapegoat: z.boolean().optional(),
	startingSeat: z.enum(['host', 'player']).optional(),
});
const id = z.string().min(1).max(64);
const command = z.discriminatedUnion('kind', [
	z.object({ kind: z.literal('run'), running: z.boolean() }),
	z.object({ kind: z.literal('set-seat'), seatId: id }),
	z.object({ kind: z.literal('start'), locale: z.enum(['vi', 'en']).optional() }),
	z.object({ kind: z.literal('remember'), chosenHour: z.number().int().min(1).max(6).optional() }),
	...(['seen', 'viewed', 'lobby', 'start-vote', 'step', 'tick', 'next', 'skip-time', 'close', 'revote'] as const).map(kind => z.object({ kind: z.literal(kind) })),
	z.object({ kind: z.literal('roles'), roleCounts: z.array(z.object({ roleId: id, count: z.number().int().min(0).max(20) })).max(30) }),
	z.object({ kind: z.literal('settings'), settings: z.record(z.string(), z.unknown()) }),
	z.object({ kind: z.literal('secret'), picks: z.array(id).min(1).max(12) }),
	z.object({ kind: z.literal('reset'), sameSeed: z.boolean() }),
	z.object({ kind: z.literal('cheese'), present: z.boolean() }),
	z.object({ kind: z.literal('vote'), playerId: id, targetId: z.string().max(64) }),
	z.object({ kind: z.literal('kick'), playerId: id }),
	z.object({ kind: z.literal('rename'), name: z.string().trim().min(1).max(24) }),
]);
export const commandSchema = z.object({ command, requestId: z.string().uuid(), expectedVersion: z.number().int().nonnegative(), controlledSeatId: id });
export function parseInput<T>(schema: z.ZodType<T>, input: unknown): T {
	const result = schema.safeParse(input);
	if (!result.success) throw new AppError('Invalid test room input', 400, 'INVALID_TEST_INPUT');
	return result.data;
}
