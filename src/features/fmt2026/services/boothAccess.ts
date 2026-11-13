import 'server-only';

import type { NextRequest } from 'next/server';

import { isAdmin } from '@/lib/apiAuth';

import { BOOTH_COOKIE, isBoothTokenValid } from './boothUnlock';
import { getPinState } from './drawService';

/** The booth laptop holds a PIN cookie; a signed-in admin can always draw too. */
export async function hasBoothAccess(request: NextRequest): Promise<boolean> {
	const { pinVersion } = await getPinState();
	if (isBoothTokenValid(request.cookies.get(BOOTH_COOKIE)?.value, pinVersion)) return true;
	return isAdmin(request);
}
