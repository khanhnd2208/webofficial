import { NextRequest } from 'next/server';
import { withAdmin, apiSuccess, apiError } from '@/lib/apiUtils';
import { getAdminUserDetail } from '@/services/userManagementService';

export const dynamic = 'force-dynamic';

export const GET = withAdmin(async (
	_req: NextRequest,
	_user,
	context,
) => {
	const { id } = await context!.params;
	const detail = await getAdminUserDetail(id);
	if (!detail) return apiError('User not found', 404);
	return apiSuccess(detail);
});
