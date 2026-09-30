import {
	createKnowledgeUnit,
	createKnowledgeUnitSchema,
	listAdminKnowledgeTable,
	parseOptionalSortDir,
	parseWithAppError,
} from '@/features/my-class';
import { apiSuccess, withAdmin } from '@/lib/apiUtils';
import { type NextRequest } from 'next/server';

export const GET = withAdmin(async (request: NextRequest) => {
	const search = Object.fromEntries(request.nextUrl.searchParams.entries());
	return apiSuccess(
		await listAdminKnowledgeTable({
			q: search.q,
			status:
				search.status === 'DRAFT' || search.status === 'PUBLISHED' || search.status === 'ARCHIVED'
					? search.status
					: undefined,
			courseId: search.courseId || undefined,
			page: search.page ? Number(search.page) : undefined,
			pageSize: search.pageSize ? Number(search.pageSize) : undefined,
			sortBy: search.sortBy,
			sortDir: parseOptionalSortDir(search.sortDir),
		}),
	);
});

export const POST = withAdmin(async (request: NextRequest) =>
	apiSuccess(
		await createKnowledgeUnit(parseWithAppError(createKnowledgeUnitSchema, await request.json())),
		201,
	),
);
