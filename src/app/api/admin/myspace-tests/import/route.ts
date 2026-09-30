import { type NextRequest } from 'next/server';
import { z } from 'zod';

import { importTestMetaSchema, myspaceTestsService } from '@/features/myspace-tests';
import { AppError } from '@/lib/appError';
import { withAdmin, apiSuccess } from '@/lib/apiUtils';
import { parseSchema } from '@/lib/validation/parse';

const smartImportBodySchema = z.object({
	text: z.string().min(1, 'Thiếu nội dung CSV'),
	meta: importTestMetaSchema,
});

const previewTextBodySchema = z.object({
	text: z.string().min(1, 'Thiếu nội dung CSV'),
	allowMissingMeta: z.boolean().optional(),
});

export const POST = withAdmin(async (request: NextRequest) => {
	const contentType = request.headers.get('content-type') ?? '';
	const dryRun =
		request.nextUrl.searchParams.get('dryRun') === '1' ||
		request.nextUrl.searchParams.get('dryRun') === 'true';

	// JSON body — smart import (text + meta) or text preview
	if (contentType.includes('application/json')) {
		const body: unknown = await request.json();

		if (dryRun) {
			const input = parseSchema(previewTextBodySchema, body);
			const preview = await myspaceTestsService.previewTestBundleFromText(input.text, {
				allowMissingMeta: input.allowMissingMeta ?? true,
			});
			return apiSuccess(preview);
		}

		const input = parseSchema(smartImportBodySchema, body);
		const result = await myspaceTestsService.importTestBundleWithMeta({
			text: input.text,
			meta: input.meta,
		});
		return apiSuccess(
			{
				test: result.test,
				imported: result.imported,
				preview: result.preview,
			},
			201,
		);
	}

	// FormData — classic file CSV bundle
	const form = await request.formData();
	const file = form.get('file');
	if (!(file instanceof File)) {
		throw new AppError('Thiếu file CSV (field: file) hoặc JSON { text, meta }', 400);
	}
	if (
		!/\.csv$/i.test(file.name) &&
		file.type !== 'text/csv' &&
		file.type !== 'application/vnd.ms-excel'
	) {
		throw new AppError('Chỉ chấp nhận file .csv', 400);
	}

	const formDryRun = dryRun || form.get('dryRun') === '1' || form.get('dryRun') === 'true';

	if (formDryRun) {
		const preview = await myspaceTestsService.previewTestBundleFromFile(file);
		return apiSuccess(preview);
	}

	const result = await myspaceTestsService.importTestBundleFromFile(file);
	return apiSuccess(
		{
			test: result.test,
			imported: result.imported,
			preview: result.preview,
		},
		201,
	);
});
