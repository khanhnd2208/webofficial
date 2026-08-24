import {
	lessonNodeChangesSchema,
	nodePatchSchema,
	nodeStatusSchema,
	parseWithAppError,
	patchCourseNode,
	sectionNodeChangesSchema,
	updateCourseNodeStatus,
	unitNodeChangesSchema,
} from '@/features/my-class';
import { apiError, apiSuccess, withAdmin } from '@/lib/apiUtils';
import { type NextRequest } from 'next/server';

export const PATCH = withAdmin(async (request: NextRequest, _user, context) => {
	const { id, nodeType, nodeId } = await context!.params;
	const raw = parseWithAppError(nodePatchSchema, await request.json());
	const changes =
		nodeType === 'lesson'
			? parseWithAppError(lessonNodeChangesSchema, raw.changes)
			: nodeType === 'section'
				? parseWithAppError(sectionNodeChangesSchema, raw.changes)
				: nodeType === 'unit'
					? parseWithAppError(unitNodeChangesSchema, raw.changes)
					: parseWithAppError(lessonNodeChangesSchema, raw.changes);
	const body = { expectedUpdatedAt: raw.expectedUpdatedAt, changes };
	return apiSuccess(await patchCourseNode(String(id), String(nodeType), String(nodeId), body));
});

export const POST = withAdmin(async (request: NextRequest, _user, context) => {
	const { id, nodeType, nodeId } = await context!.params;
	if (nodeType !== 'lesson' && nodeType !== 'section') {
		return apiError('Node status không hợp lệ', 405);
	}
	const body = parseWithAppError(nodeStatusSchema, await request.json());
	return apiSuccess(await updateCourseNodeStatus(String(id), nodeType, String(nodeId), body));
});
