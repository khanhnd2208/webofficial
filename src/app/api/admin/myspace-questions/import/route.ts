import { type NextRequest } from 'next/server';

import { myspaceTestsService } from '@/features/myspace-tests';
import { AppError } from '@/lib/appError';
import { withAdmin, apiSuccess } from '@/lib/apiUtils';

export const POST = withAdmin(async (request: NextRequest) => {
	const form = await request.formData();
	const file = form.get('file');
	if (!(file instanceof File)) {
		throw new AppError('Thiếu file CSV (field: file)', 400);
	}
	if (!/\.csv$/i.test(file.name) && file.type !== 'text/csv') {
		throw new AppError('Chỉ chấp nhận file .csv', 400);
	}

	const result = await myspaceTestsService.importQuestionsFromFile(file);
	return apiSuccess(
		{
			imported: result.imported,
			errors: result.errors,
			parsed: result.questions.length,
		},
		201,
	);
});
