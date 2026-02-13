import { getToken } from 'next-auth/jwt';
import { NextResponse, type NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { parse } from 'csv-parse/sync';

import {
	clearLessonVocabulary,
	deleteLessonVocabularyItem,
	listLessonVocabulary,
	upsertLessonVocabularyItem,
	upsertLessonVocabularyItems,
} from '@/services/lessonVocabularyService';

async function isAdmin(request: NextRequest): Promise<boolean> {
	const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
	return Boolean(token && (token as { role?: unknown }).role === 'admin');
}

function normalizeHeaderKey(value: string): string {
	return String(value ?? '')
		.trim()
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/\s+/g, '')
		.replace(/[^a-z0-9_]/g, '');
}

function pick(row: Record<string, unknown>, keys: string[]): string {
	for (const k of keys) {
		if (k in row) return String((row as Record<string, unknown>)[k] ?? '');
	}
	return '';
}

function hasAnyHeader(headers: string[], keys: string[]): boolean {
	return keys.some((k) => headers.includes(k));
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		if (!(await isAdmin(request))) {
			return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
		}
		const { id } = await params;
		const items = await listLessonVocabulary(id);
		return NextResponse.json({ ok: true, data: items });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return NextResponse.json({ ok: false, error: message }, { status: 400 });
	}
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		if (!(await isAdmin(request))) {
			return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
		}
		const { id: lessonId } = await params;

		const form = await request.formData();
		const mode = form.get('mode');
		const replace = typeof mode === 'string' && mode === 'replace';
		const file = form.get('file');
		if (!(file instanceof File)) {
			return NextResponse.json({ ok: false, error: 'Missing file' }, { status: 400 });
		}

		const text = await file.text();
		const rawRecords = parse(text, {
			columns: (headers: string[]) => headers.map(normalizeHeaderKey),
			skip_empty_lines: true,
			bom: true,
			trim: true,
		}) as Array<Record<string, unknown>>;

		if (rawRecords.length === 0) {
			return NextResponse.json(
				{ ok: false, error: 'CSV rỗng hoặc không có dòng dữ liệu' },
				{ status: 400 },
			);
		}

		const headerKeys = Object.keys(rawRecords[0] ?? {});
		const wordKeys = ['word', 'tu', 'tuvung', 'vocabulary', 'term'];
		const meaningViKeys = ['meaningvi', 'nghiaviet', 'vietnamese', 'vi'];
		const meaningEnKeys = ['meaningen', 'nghiaanh', 'englishmeaning', 'en'];
		const missingHeaders: string[] = [];
		if (!hasAnyHeader(headerKeys, wordKeys)) missingHeaders.push('word');
		if (!hasAnyHeader(headerKeys, meaningViKeys)) missingHeaders.push('meaningVi');
		if (!hasAnyHeader(headerKeys, meaningEnKeys)) missingHeaders.push('meaningEn');
		if (missingHeaders.length > 0) {
			return NextResponse.json(
				{
					ok: false,
					error: `Thiếu cột bắt buộc: ${missingHeaders.join(', ')}`,
					details: [
						'Header gợi ý: word, partOfSpeech, meaningVi, meaningEn',
						'Có thể dùng alias: tu/tuvung/term; vi/nghiaviet; en/nghiaanh',
					],
				},
				{ status: 400 },
			);
		}

		let invalidRows = 0;
		const invalidSamples: string[] = [];
		const items = rawRecords
			.map((r, idx) => {
				const word = pick(r, wordKeys).trim();
				const partOfSpeech = pick(r, ['partofspeech', 'pos', 'loaitu', 'type']).trim();
				const meaningVi = pick(r, meaningViKeys).trim();
				const meaningEn = pick(r, meaningEnKeys).trim();
				const missing: string[] = [];
				if (!word) missing.push('word');
				if (!meaningVi) missing.push('meaningVi');
				if (!meaningEn) missing.push('meaningEn');
				if (missing.length > 0) {
					invalidRows += 1;
					if (invalidSamples.length < 10) {
						// +2 to account for 1-based line numbers and the header row
						invalidSamples.push(`Row ${idx + 2}: thiếu ${missing.join(', ')}`);
					}
					return null;
				}
				return { word, partOfSpeech, meaningVi, meaningEn };
			})
			.filter((x): x is { word: string; partOfSpeech: string; meaningVi: string; meaningEn: string } => x !== null);

		if (items.length === 0) {
			return NextResponse.json(
				{
					ok: false,
					error: 'Không có dòng hợp lệ để import',
					details: invalidSamples,
				},
				{ status: 400 },
			);
		}

		if (replace) {
			await clearLessonVocabulary(lessonId);
		}
		const result = await upsertLessonVocabularyItems({ lessonId, items });
		revalidatePath('/admin/learning');
		return NextResponse.json(
			{
				ok: true,
				data: {
					...result,
					records: rawRecords.length,
					invalidRows,
					invalidSamples,
				},
			},
			{ status: 201 },
		);
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return NextResponse.json({ ok: false, error: message }, { status: 400 });
	}
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		if (!(await isAdmin(request))) {
			return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
		}
		const { id: lessonId } = await params;
		const body = (await request.json()) as unknown;
		if (!body || typeof body !== 'object') {
			return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
		}
		const { word, partOfSpeech, meaningVi, meaningEn } = body as {
			word?: unknown;
			partOfSpeech?: unknown;
			meaningVi?: unknown;
			meaningEn?: unknown;
		};
		const result = await upsertLessonVocabularyItem({
			lessonId,
			item: {
				word: String(word ?? ''),
				partOfSpeech: typeof partOfSpeech === 'string' ? partOfSpeech : String(partOfSpeech ?? ''),
				meaningVi: String(meaningVi ?? ''),
				meaningEn: String(meaningEn ?? ''),
			},
		});
		revalidatePath('/admin/learning');
		return NextResponse.json({ ok: true, data: result });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return NextResponse.json({ ok: false, error: message }, { status: 400 });
	}
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		if (!(await isAdmin(request))) {
			return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
		}
		const { id: lessonId } = await params;
		const { searchParams } = new URL(request.url);
		const word = searchParams.get('word');
		if (word && word.trim()) {
			const result = await deleteLessonVocabularyItem({ lessonId, word: word.trim() });
			revalidatePath('/admin/learning');
			return NextResponse.json({ ok: true, data: result });
		}
		const result = await clearLessonVocabulary(lessonId);
		revalidatePath('/admin/learning');
		return NextResponse.json({ ok: true, data: result });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return NextResponse.json({ ok: false, error: message }, { status: 400 });
	}
}
