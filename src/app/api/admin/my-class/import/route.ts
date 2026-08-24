import {
	commitCurriculumImport,
	commitQuestionsImport,
	curriculumImportSchema,
	parseWithAppError,
	previewCurriculumImport,
	previewQuestionsImport,
	QUESTION_CSV_TEMPLATE,
	CURRICULUM_JSON_TEMPLATE,
	normalizeCurriculumPayload,
} from '@/features/my-class';
import { apiSuccess, withAdmin } from '@/lib/apiUtils';
import { type NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export const GET = withAdmin(async (request: NextRequest) => {
	const template = new URL(request.url).searchParams.get('template');
	if (template === 'curriculum') {
		return new NextResponse(CURRICULUM_JSON_TEMPLATE, { headers: { 'Content-Type': 'application/json; charset=utf-8', 'Content-Disposition': 'attachment; filename="my-class-curriculum.json"' } });
	}
	if (template === 'questions') {
		return new NextResponse(QUESTION_CSV_TEMPLATE, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="my-class-questions.csv"' } });
	}
	return apiSuccess({ templates: ['curriculum', 'questions'] });
});

export const POST = withAdmin(async (request: NextRequest) => {
	const body = (await request.json()) as Record<string, unknown>;
	const kind = body.kind === 'questions' ? 'questions' : 'curriculum';
	const mode = body.mode === 'commit' ? 'commit' : 'preview';
	if (kind === 'questions') {
		const csv = String(body.csv ?? '');
		if (mode === 'commit') return apiSuccess(await commitQuestionsImport(csv), 201);
		return apiSuccess(await previewQuestionsImport(csv));
	}
	delete body.mode;
	delete body.kind;
	const parsed = parseWithAppError(curriculumImportSchema, normalizeCurriculumPayload(body));
	if (mode === 'commit') return apiSuccess(await commitCurriculumImport(parsed), 201);
	return apiSuccess(await previewCurriculumImport(parsed));
});
