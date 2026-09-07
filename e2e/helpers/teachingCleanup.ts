import type { APIRequestContext } from '@playwright/test';

export async function cleanupTeachingClass(request: APIRequestContext, classId: string) {
	const deleted = await request.delete(`/api/admin/teaching/classes/${classId}`);
	if (deleted.ok() || deleted.status() === 404) return;
	await request.patch(`/api/admin/teaching/classes/${classId}`, {
		data: { status: 'ARCHIVED' },
	});
}
