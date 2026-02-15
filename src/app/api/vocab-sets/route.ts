import { NextResponse, type NextRequest } from 'next/server';
import { parse } from 'csv-parse/sync';

import { getApiUser } from '@/lib/apiAuth';
import { createVocabSet, listMyVocabSets } from '@/services/vocabSetService';

/** GET /api/vocab-sets — list user's own sets */
export async function GET(request: NextRequest) {
	try {
		const user = await getApiUser(request);
		if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
		const items = await listMyVocabSets(user.id);
		return NextResponse.json({ ok: true, data: { items, total: items.length } });
	} catch (error) {
		return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 400 });
	}
}

/** POST /api/vocab-sets — create a new set or clone */
export async function POST(request: NextRequest) {
	try {
		const user = await getApiUser(request);
		if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

		const contentType = request.headers.get('content-type') ?? '';

		// Handle CSV upload
		if (contentType.includes('multipart/form-data')) {
			const formData = await request.formData();
			const file = formData.get('file') as File | null;
			const title = String(formData.get('title') ?? '').trim();
			const description = String(formData.get('description') ?? '').trim();
			const visibility = String(formData.get('visibility') ?? 'private') as 'public' | 'private';

			if (!file || !title) {
				return NextResponse.json({ ok: false, error: 'Title and file are required' }, { status: 400 });
			}

			const csvText = await file.text();
			const records = parse(csvText, {
				columns: true,
				skip_empty_lines: true,
				trim: true,
				relaxColumnCount: true,
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
				return NextResponse.json({ ok: false, error: 'No valid terms found in CSV. Columns: word, definition (required)' }, { status: 400 });
			}

			const set = await createVocabSet({
				title,
				description,
				visibility: user.role === 'admin' ? visibility : 'private',
				terms,
				ownerId: user.id,
				ownerName: user.name,
			});
			return NextResponse.json({ ok: true, data: set }, { status: 201 });
		}

		// Handle JSON body
		const body = await request.json();

		// Create from JSON
		const { title, description, terms } = body;
		if (!title?.trim()) return NextResponse.json({ ok: false, error: 'Title is required' }, { status: 400 });
		if (!Array.isArray(terms) || terms.length === 0) {
			return NextResponse.json({ ok: false, error: 'At least one term is required' }, { status: 400 });
		}

		const set = await createVocabSet({
			title: title.trim(),
			description: description ?? '',
			visibility: 'private',
			terms: terms.map((t: Record<string, string>) => ({
				word: String(t.word ?? '').trim(),
				definition: String(t.definition ?? '').trim(),
				partOfSpeech: String(t.partOfSpeech ?? '').trim(),
				example: String(t.example ?? '').trim(),
			})),
			ownerId: user.id,
			ownerName: user.name,
		});
		return NextResponse.json({ ok: true, data: set }, { status: 201 });
	} catch (error) {
		return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 400 });
	}
}
