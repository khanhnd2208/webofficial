import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getAdminUserList } from '@/services/userManagementService';
import type { UserRole } from '@/types/user';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
	const session = await auth();
	if (session?.user?.role !== 'admin') {
		return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
	}

	const { searchParams } = req.nextUrl;
	const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
	const pageSize = Math.min(50, Math.max(5, parseInt(searchParams.get('pageSize') ?? '20', 10)));
	const search = searchParams.get('search') ?? '';
	const role = (searchParams.get('role') ?? 'all') as UserRole | 'all';
	const sortBy = (searchParams.get('sortBy') ?? 'createdAt') as 'createdAt' | 'name' | 'email';
	const sortDir = (searchParams.get('sortDir') ?? 'desc') as 'asc' | 'desc';

	const result = await getAdminUserList({ page, pageSize, search, role, sortBy, sortDir });
	return NextResponse.json(result);
}
