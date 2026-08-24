import {
	importVocabSetForScope,
	parseWithAppError,
	previewVocabCsvImport,
	vocabCsvImportSchema,
} from '@/features/my-class';
import { VOCAB_CSV_TEMPLATE } from '@/lib/vocab/parseVocabCsv';
import { apiSuccess, withAdmin } from '@/lib/apiUtils';
import { type NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export const GET = withAdmin(async (request: NextRequest) => {
	const template = request.nextUrl.searchParams.get('template');
	if (template) {
		return new NextResponse(VOCAB_CSV_TEMPLATE, {
			headers: {
				'Content-Type': 'text/csv; charset=utf-8',
				'Content-Disposition': 'attachment; filename="lesson-vocab.csv"',
			},
		});
	}
	return apiSuccess({ template: 'lesson-vocab.csv' });
});

export const POST = withAdmin(async (request: NextRequest, user, context) => {
	const courseId = String((await context!.params).id);
	const parsed = parseWithAppError(vocabCsvImportSchema, await request.json());
	if (parsed.mode === 'commit') {
		return apiSuccess(
			await importVocabSetForScope(
				courseId,
				{ id: user.id, name: user.name || user.email },
				parsed,
			),
			201,
		);
	}
	return apiSuccess(previewVocabCsvImport(parsed.csv));
});
