import { createHmac } from 'node:crypto';

import { resolveMyClassActor } from '@/features/my-class/services/resolveActor';
import { guestActorKey } from '@/features/my-class/domain/actor';
import { apiSuccess, withErrorHandling } from '@/lib/apiUtils';
import { type NextRequest } from 'next/server';

function scopeFor(actorKey: string) {
	const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? 'my-class-local-secret';
	return createHmac('sha256', secret).update(actorKey).digest('hex').slice(0, 32);
}

export const POST = withErrorHandling(async (request: NextRequest) => {
	const actor = await resolveMyClassActor(request, { ensureGuest: true });
	return apiSuccess({
		actorType: actor.type,
		storageScope: scopeFor(actor.actorKey),
		claimableGuestStorageScope:
			actor.type === 'user' && actor.guestId ? scopeFor(guestActorKey(actor.guestId)) : undefined,
		// The client only receives opaque scopes; actor ids never leave the server.
	});
});
