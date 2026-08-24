import {
	commitTestQuestionsImport,
	parseWithAppError,
	previewTestQuestionsImport,
	TEST_QUESTION_CSV_TEMPLATE,
	testCsvImportSchema,
} from '@/features/my-class';
import { apiSuccess, withAdmin } from '@/lib/apiUtils';
import { type NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export const GET = withAdmin(async (request: NextRequest) => {
	const template = new URL(request.url).searchParams.get('template');
	if (template) {
		return new NextResponse(TEST_QUESTION_CSV_TEMPLATE, {
			headers: {
				'Content-Type': 'text/csv; charset=utf-8',
				'Content-Disposition': 'attachment; filename="progress-test-questions.csv"',
			},
		});
	}
	return apiSuccess({ template: 'progress-test-questions.csv' });
});

export const POST = withAdmin(async (request: NextRequest, _user, context) => {
	const testId = String((await context!.params).id);
	const parsed = parseWithAppError(testCsvImportSchema, await request.json());
	if (parsed.mode === 'commit') {
		return apiSuccess(await commitTestQuestionsImport(testId, parsed.csv, parsed.strategy), 201);
	}
	return apiSuccess(await previewTestQuestionsImport(testId, parsed.csv));
});
