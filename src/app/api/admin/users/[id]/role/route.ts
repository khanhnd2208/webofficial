import { NextRequest } from 'next/server';
import { withAdmin, apiSuccess, apiError } from '@/lib/apiUtils';
import { setUserRole } from '@/services/userManagementService';
import type { UserRole } from '@/types/user';

const VALID_ROLES: UserRole[] = ['student', 'admin'];

export const PATCH = withAdmin(async (req: NextRequest, user, context) => {
	const { id } = await context!.params;
	const body = (await req.json()) as { role?: string };
	const role = body.role as UserRole;

	if (!VALID_ROLES.includes(role)) {
		return apiError('Invalid role', 400);
	}

	// Prevent demoting the last admin (safety check)
	if (user.id === id && role !== 'admin') {
		return apiError('Không thể tự thay đổi role của chính mình', 400);
	}

	const ok = await setUserRole(id, role);
	if (!ok) return apiError('User not found', 404);
	return apiSuccess({ role });
});
