import { NextResponse, type NextRequest } from 'next/server';

import { getApiUser, isAdmin } from '@/lib/apiAuth';
import { listAdminOwnedSets } from '@/services/vocabSetService';

/**
 * GET /api/admin/vocab-sets
 * Returns all vocab sets owned by the currently logged-in admin,
 * including both public and private sets.
 */
export async function GET(request: NextRequest) {
	try {
		if (!(await isAdmin(request))) {
			return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
		}
		const user = await getApiUser(request);
		if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

		const items = await listAdminOwnedSets(user.id);
		return NextResponse.json({ ok: true, data: { items, total: items.length } });
	} catch (error) {
		return NextResponse.json(
			{ ok: false, error: error instanceof Error ? error.message : 'Unknown error' },
			{ status: 400 }
		);
	}
}
