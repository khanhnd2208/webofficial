import {
	attachKnowledgeSchema,
	attachKnowledgeUnit,
	createKnowledgeUnit,
	createKnowledgeUnitSchema,
	parseWithAppError,
} from '@/features/my-class';
import { apiSuccess, withAdmin } from '@/lib/apiUtils';
import { type NextRequest } from 'next/server';

export const POST = withAdmin(async (request: NextRequest, _user, context) => {
	const sectionId = String((await context!.params).sectionId);
	const body = (await request.json()) as Record<string, unknown>;
	if (body.create) {
		const input = parseWithAppError(createKnowledgeUnitSchema, body);
		return apiSuccess(await createKnowledgeUnit(input, { sectionId }), 201);
	}
	const { knowledgeUnitId } = parseWithAppError(attachKnowledgeSchema, body);
	return apiSuccess(await attachKnowledgeUnit(sectionId, knowledgeUnitId), 201);
});
