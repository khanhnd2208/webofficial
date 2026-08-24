import { bankFilterFromSearch, createQuestion, listAdminQuestions, parseWithAppError, questionBodySchema } from '@/features/my-class';
import { apiSuccess, withAdmin } from '@/lib/apiUtils';
import { type NextRequest } from 'next/server';

export const GET = withAdmin(async (request: NextRequest) =>
	apiSuccess(await listAdminQuestions(bankFilterFromSearch(request.nextUrl.searchParams))),
);

export const POST = withAdmin(async (request: NextRequest) =>
	apiSuccess(await createQuestion(parseWithAppError(questionBodySchema, await request.json())), 201),
);
