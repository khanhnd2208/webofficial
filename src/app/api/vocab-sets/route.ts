import { type NextRequest } from 'next/server';
import { parse } from 'csv-parse/sync';

import { withAuth, apiSuccess, apiError } from '@/lib/apiUtils';
import { createVocabSet, listMyVocabSets } from '@/services/vocabSetService';

/** GET /api/vocab-sets — list user's own sets */
export const GET = withAuth(async (_request: NextRequest, user) => {
	const items = await listMyVocabSets(user.id);
	return apiSuccess({ items, total: items.length });
});

/** POST /api/vocab-sets — create a new set or clone */
export const POST = withAuth(async (request: NextRequest, user) => {
	const contentType = request.headers.get('content-type') ?? '';

	// Handle CSV upload
	if (contentType.includes('multipart/form-data')) {
		const formData = await request.formData();
		const file = formData.get('file') as File | null;
		const title = String(formData.get('title') ?? '').trim();
		const description = String(formData.get('description') ?? '').trim();
		const visibility = String(formData.get('visibility') ?? 'private') as 'public' | 'private';

		if (!file || !title) {
			return apiError('Title and file are required', 400);
		}

		const csvText = await file.text();
		const records = parse(csvText, {
			columns: true,
			skip_empty_lines: true,
			trim: true,
			relaxColumnCount: true,
			bom: true, // tự động bỏ UTF-8 BOM để tiếng Việt không bị lỗi font
		}) as Record<string, string>[];

		const terms = records
			.map((r) => ({
				word: (r.word ?? r.Word ?? r.term ?? r.Term ?? '').trim(),
				definition: (r.definition ?? r.Definition ?? r.meaning ?? r.Meaning ?? r.meaningVi ?? '').trim(),
				partOfSpeech: (r.partOfSpeech ?? r.pos ?? r.POS ?? r.part_of_speech ?? '').trim(),
				example: (r.example ?? r.Example ?? r.sentence ?? '').trim(),
			}))
			.filter((t) => t.word && t.definition);

		if (terms.length === 0) {
			return apiError('No valid terms found in CSV. Columns: word, definition (required)', 400);
		}

		const set = await createVocabSet({
			title,
			description,
			visibility: user.role === 'admin' ? visibility : 'private',
			terms,
			ownerId: user.id,
			ownerName: user.name,
		});
		return apiSuccess(set, 201);
	}

	// Handle JSON body
	const body = await request.json();

	const { title, description, visibility, terms } = body;
	if (!title?.trim()) return apiError('Title is required', 400);
	if (!Array.isArray(terms) || terms.length === 0) {
		return apiError('At least one term is required', 400);
	}

	const set = await createVocabSet({
		title: title.trim(),
		description: description ?? '',
		visibility: user.role === 'admin' ? (visibility ?? 'private') : 'private',
		terms: terms.map((t: Record<string, string>) => ({
			word: String(t.word ?? '').trim(),
			definition: String(t.definition ?? '').trim(),
			partOfSpeech: String(t.partOfSpeech ?? '').trim(),
			example: String(t.example ?? '').trim(),
		})),
		ownerId: user.id,
		ownerName: user.name,
	});
	return apiSuccess(set, 201);
});
