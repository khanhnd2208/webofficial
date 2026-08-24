import { bankBulkSchema, bankFilterFromSearch, bulkBankAction, listAdminQuestionTable, parseOptionalSortDir, parseWithAppError } from '@/features/my-class';
import { apiSuccess, withAdmin } from '@/lib/apiUtils';
import { type NextRequest } from 'next/server';

export const GET = withAdmin(async (request: NextRequest) => {
	const search = request.nextUrl.searchParams;
	const filter = bankFilterFromSearch(search);
	return apiSuccess(
		await listAdminQuestionTable({
			...filter,
			page: search.get('page') ? Number(search.get('page')) : undefined,
			pageSize: search.get('pageSize') ? Number(search.get('pageSize')) : undefined,
			sortBy: search.get('sortBy') ?? filter.sort,
			sortDir: parseOptionalSortDir(search.get('sortDir')),
		}),
	);
});

export const POST = withAdmin(async (request: NextRequest) =>
	apiSuccess(await bulkBankAction(parseWithAppError(bankBulkSchema, await request.json()))),
);
