import { parseWithAppError, reorderCourseNodes, workspaceReorderSchema } from '@/features/my-class';
import { apiSuccess, withAdmin } from '@/lib/apiUtils';
import { type NextRequest } from 'next/server';

export const POST = withAdmin(async (request: NextRequest, _user, context) => {
	const { id } = await context!.params;
	const body = parseWithAppError(workspaceReorderSchema, await request.json());
	return apiSuccess(await reorderCourseNodes(String(id), body));
});
