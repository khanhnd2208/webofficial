import { createAndAssignVocabSet, createMyClassVocabSetSchema, parseOptionalSortDir, parseWithAppError } from '@/features/my-class';
import { apiSuccess, withAdmin } from '@/lib/apiUtils';
import { listAdminVocabCatalog } from '@/services/vocabSetService';
import { type NextRequest } from 'next/server';

export const GET = withAdmin(async (request: NextRequest) => {
	const search = request.nextUrl.searchParams;
	const archived = search.get('archived');
	return apiSuccess(
		await listAdminVocabCatalog({
			q: search.get('q') ?? undefined,
			courseId: search.get('courseId') || undefined,
			archived: archived === 'true' ? true : archived === 'false' ? false : undefined,
			page: search.get('page') ? Number(search.get('page')) : undefined,
			pageSize: search.get('pageSize') ? Number(search.get('pageSize')) : undefined,
			sortBy: search.get('sortBy') ?? undefined,
			sortDir: parseOptionalSortDir(search.get('sortDir')),
		}),
	);
});

export const POST = withAdmin(async (request, user) => {
	const body = parseWithAppError(createMyClassVocabSetSchema, await request.json());
	const result = await createAndAssignVocabSet(
		{ id: user.id, name: user.name || user.email || 'Admin' },
		body,
	);
	return apiSuccess(result, 201);
});
