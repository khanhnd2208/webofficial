import type { NextRequest } from 'next/server';

import { getApiUser } from '@/lib/apiAuth';

import { ensureGuestId, readGuestId } from './guestIdentity';
import type { ProgressActor } from './types';

/**
 * Resolve ownership for play APIs.
 * Signed-in users own sessions via Auth.js user id; guests via first-party cookie.
 */
export async function resolvePlayActor(
	request: NextRequest,
	options?: { ensureGuest?: boolean },
): Promise<ProgressActor> {
	const user = await getApiUser(request);
	if (user?.id) {
		return { userId: user.id, guestId: await readGuestId() };
	}
	if (options?.ensureGuest) {
		return { guestId: await ensureGuestId() };
	}
	return { guestId: await readGuestId() };
}
