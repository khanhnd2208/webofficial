import { NextRequest } from 'next/server';
import { withAdmin, apiSuccess } from '@/lib/apiUtils';
import { getAdminUserList } from '@/services/userManagementService';
import type { UserRole } from '@/types/user';

export const dynamic = 'force-dynamic';

export const GET = withAdmin(async (req: NextRequest) => {
	const { searchParams } = req.nextUrl;
	const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
	const pageSize = Math.min(50, Math.max(5, parseInt(searchParams.get('pageSize') ?? '20', 10)));
	const search = searchParams.get('search') ?? '';
	const role = (searchParams.get('role') ?? 'all') as UserRole | 'all';
	const sortBy = (searchParams.get('sortBy') ?? 'createdAt') as 'createdAt' | 'name' | 'email';
	const sortDir = (searchParams.get('sortDir') ?? 'desc') as 'asc' | 'desc';

	const result = await getAdminUserList({ page, pageSize, search, role, sortBy, sortDir });
	return apiSuccess(result);
});
