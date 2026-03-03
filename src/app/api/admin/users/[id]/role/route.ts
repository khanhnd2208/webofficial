import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { setUserRole } from '@/services/userManagementService';
import type { UserRole } from '@/types/user';

const VALID_ROLES: UserRole[] = ['student', 'teacher', 'admin'];

export async function PATCH(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	const session = await auth();
	if (session?.user?.role !== 'admin') {
		return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
	}

	const { id } = await params;
	const body = await req.json() as { role?: string };
	const role = body.role as UserRole;

	if (!VALID_ROLES.includes(role)) {
		return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
	}

	// Prevent demoting the last admin (safety check)
	if (session.user.id === id && role !== 'admin') {
		return NextResponse.json({ error: 'Không thể tự thay đổi role của chính mình' }, { status: 400 });
	}

	const ok = await setUserRole(id, role);
	if (!ok) return NextResponse.json({ error: 'User not found' }, { status: 404 });
	return NextResponse.json({ success: true, role });
}
