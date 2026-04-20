/* ════════════════════════════════════════════════════════════════════════
   GET  /api/vocab-sets  — user's active library
   POST /api/vocab-sets  — create new VocabSet (admin, JSON or CSV)
   ════════════════════════════════════════════════════════════════════════ */
import { parse } from 'csv-parse/sync';
import { withAuth, withAdmin, apiSuccess, apiError } from '@/lib/apiUtils';
import { createVocabSet, getUserLibrary } from '@/services/vocabSetService';
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
		if (!file) return apiError('CSV file is required', 400);
		const text = await file.text();
		const rows = parse(text, { columns: true, skip_empty_lines: true, trim: true }) as Record<string, string>[];
		words = rows.map((r) => {
			const parseHints = (val: string | undefined): string[] =>
				val ? val.split('||').map((s) => s.trim()).filter(Boolean) : [];
			return {
				term: r.word ?? r.term ?? '',
				definition: r.definition ?? '',
				partOfSpeech: r.partOfSpeech ?? r.part_of_speech ?? '',
				example: r.example ?? '',
				ndkExplanation: r.ndk_explanation ?? null,
				hintsHard: parseHints(r.hints_hard),
				hintsMedium: parseHints(r.hints_medium),
				hintsEasy: parseHints(r.hints_easy),
			};
		}).filter((w) => w.term && w.definition);
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
