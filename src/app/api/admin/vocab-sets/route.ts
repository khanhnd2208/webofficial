import { type NextRequest } from 'next/server';

import { withAdmin, apiSuccess } from '@/lib/apiUtils';
import { listAdminOwnedSets } from '@/services/vocabSetService';

/**
 * GET /api/admin/vocab-sets
 * Returns all vocab sets owned by the currently logged-in admin,
 * including both public and private sets.
 */
export const GET = withAdmin(async (_request: NextRequest, user) => {
	const items = await listAdminOwnedSets(user.id);
	return apiSuccess({ items, total: items.length });
});
