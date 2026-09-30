import {
	addRelatedKnowledgeUnit,
	parseWithAppError,
	relatedKnowledgeSchema,
	removeRelatedKnowledgeUnit,
} from '@/features/my-class';
import { apiSuccess, withAdmin } from '@/lib/apiUtils';
import { type NextRequest } from 'next/server';

export const POST = withAdmin(async (request: NextRequest, _user, context) =>
	apiSuccess(
		await addRelatedKnowledgeUnit(
			String((await context!.params).id),
			parseWithAppError(relatedKnowledgeSchema, await request.json()).toId,
		),
		201,
	),
);

export const DELETE = withAdmin(async (request: NextRequest, _user, context) => {
	const toId = new URL(request.url).searchParams.get('toId') ?? '';
	return apiSuccess(await removeRelatedKnowledgeUnit(String((await context!.params).id), toId));
});
