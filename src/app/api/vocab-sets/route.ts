/* ════════════════════════════════════════════════════════════════════════
   GET  /api/vocab-sets  — user's active library
   POST /api/vocab-sets  — create new VocabSet (admin, JSON or CSV/XLSX)
   ════════════════════════════════════════════════════════════════════════ */
import { withAuth, withAdmin, apiSuccess, apiError } from '@/lib/apiUtils';
import { createVocabSet, getUserLibrary } from '@/services/vocabSetService';
import { parseVocabFile } from '@/lib/vocab/parseVocabFile';
import type { CreateWordInput } from '@/types/vocab';

export const GET = withAuth(async (_req, user) => {
	const items = await getUserLibrary(user.id);
	return apiSuccess({ items, total: items.length });
});

export const POST = withAdmin(async (request, user) => {
	const contentType = request.headers.get('content-type') ?? '';

	let title = '';
	let description = '';
	let words: CreateWordInput[] = [];

	if (contentType.includes('multipart/form-data')) {
		const formData = await request.formData();
		title = String(formData.get('title') ?? '').trim();
		description = String(formData.get('description') ?? '').trim();
		const file = formData.get('file') as File | null;
		if (!file) return apiError('File is required (CSV or XLSX)', 400);

		const { words: parsed, errors } = await parseVocabFile(file);

		if (errors.length > 0) {
			const details = errors
				.slice(0, 10)
				.map((e) => `Dòng ${e.row}: thiếu ${e.missing.join(', ')}`)
				.join(' | ');
			const suffix = errors.length > 10 ? ` … và ${errors.length - 10} dòng khác` : '';
			return apiError(
				`${errors.length} dòng thiếu trường bắt buộc (word/term, definition, ndk_explanation). ${details}${suffix}`,
				422,
			);
		}

		words = parsed;
	} else {
		const body = await request.json() as { title?: string; description?: string; words?: CreateWordInput[] };
		title = body.title?.trim() ?? '';
		description = body.description?.trim() ?? '';
		words = body.words ?? [];
	}

	if (!title) return apiError('title is required', 400);
	if (!words.length) return apiError('At least one word is required', 400);
	if (words.length > 2000) return apiError('Cannot exceed 2000 words per set', 400);

	const ownerName = user.name ?? user.email ?? 'Admin';
	const set = await createVocabSet(user.id, ownerName, { title, description, words });
	return apiSuccess({ set }, 201);
});
