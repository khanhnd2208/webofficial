import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getAdminUserDetail } from '@/services/userManagementService';

export const dynamic = 'force-dynamic';

export async function GET(
	_req: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	const session = await auth();
	if (session?.user?.role !== 'admin') {
		return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
	}

	const { id } = await params;
	const detail = await getAdminUserDetail(id);
	if (!detail) return NextResponse.json({ error: 'User not found' }, { status: 404 });
	return NextResponse.json(detail);
}
