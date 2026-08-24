import 'server-only';

import type { NextRequest } from 'next/server';

import { getApiUser } from '@/lib/apiAuth';
import { AppError } from '@/lib/appError';
import { ensureGuestId, readGuestId } from '@/features/myspace-tests/guestIdentity';

import { guestActorKey, userActorKey, type MyClassActor } from '../domain/actor';

export async function resolveMyClassActor(
	request: NextRequest,
	options?: { ensureGuest?: boolean },
): Promise<MyClassActor> {
	const user = await getApiUser(request);
	if (user?.id) {
		return {
			type: 'user',
			userId: user.id,
			guestId: await readGuestId(),
			actorKey: userActorKey(user.id),
		};
	}
	const guestId = options?.ensureGuest ? await ensureGuestId() : await readGuestId();
	if (!guestId) {
		throw new AppError('Không xác định được người học', 401);
	}
	return { type: 'guest', guestId, actorKey: guestActorKey(guestId) };
}

export async function resolveMyClassActorOptional(request: NextRequest): Promise<MyClassActor | null> {
	const user = await getApiUser(request);
	if (user?.id) {
		return {
			type: 'user',
			userId: user.id,
			guestId: await readGuestId(),
			actorKey: userActorKey(user.id),
		};
	}
	const guestId = await readGuestId();
	if (!guestId) return null;
	return { type: 'guest', guestId, actorKey: guestActorKey(guestId) };
}
