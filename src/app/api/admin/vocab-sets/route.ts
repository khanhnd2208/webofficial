/* ════════════════════════════════════════════════════════════════════════
   GET /api/admin/vocab-sets — admin's own sets (admin panel)
   ════════════════════════════════════════════════════════════════════════ */
import { withAdmin, apiSuccess } from '@/lib/apiUtils';
import { listAdminOwnedSets } from '@/services/vocabSetService';

export const GET = withAdmin(async (_req, user) => {
	const items = await listAdminOwnedSets(user.id);
	return apiSuccess({ items, total: items.length });
});
