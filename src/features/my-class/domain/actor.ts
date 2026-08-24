export type MyClassActorType = 'user' | 'guest';

export type MyClassActor =
	| { type: 'user'; userId: string; guestId?: string | null; actorKey: string }
	| { type: 'guest'; guestId: string; actorKey: string };

export function userActorKey(userId: string): string {
	return `user:${userId}`;
}

export function guestActorKey(guestId: string): string {
	return `guest:${guestId}`;
}

export function parseActorKey(actorKey: string): { type: MyClassActorType; id: string } | null {
	if (actorKey.startsWith('user:')) return { type: 'user', id: actorKey.slice(5) };
	if (actorKey.startsWith('guest:')) return { type: 'guest', id: actorKey.slice(6) };
	return null;
}

export function actorFromIds(input: { userId?: string | null; guestId?: string | null }): MyClassActor | null {
	if (input.userId) {
		return { type: 'user', userId: input.userId, guestId: input.guestId ?? null, actorKey: userActorKey(input.userId) };
	}
	if (input.guestId) {
		return { type: 'guest', guestId: input.guestId, actorKey: guestActorKey(input.guestId) };
	}
	return null;
}
