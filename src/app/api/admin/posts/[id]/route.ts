import { revalidatePath } from 'next/cache';
import { type NextRequest } from 'next/server';

import { withAdmin, apiSuccess, apiError } from '@/lib/apiUtils';
import { deletePostById, getAdminPostById, updatePostById } from '@/services/postService';

export const GET = withAdmin(async (_request: NextRequest, _user, context) => {
	const { id } = await context!.params;
	const post = await getAdminPostById(id);
	if (!post) return apiError('Not found', 404);
	return apiSuccess(post);
});

export const PATCH = withAdmin(async (request: NextRequest, _user, context) => {
	const { id } = await context!.params;
	const body = (await request.json()) as Record<string, unknown>;

	const updated = await updatePostById(id, body);

	revalidatePath('/', 'layout');
	return apiSuccess(updated);
});

export const DELETE = withAdmin(async (_request: NextRequest, _user, context) => {
	const { id } = await context!.params;
	await deletePostById(id);

	revalidatePath('/', 'layout');
	return apiSuccess({ id });
});
