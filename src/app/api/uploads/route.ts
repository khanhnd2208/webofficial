import { NextResponse, type NextRequest } from 'next/server';

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { isAdmin } from '@/lib/apiAuth';

export const runtime = 'nodejs';

function safeExt(contentType: string): string {
	const ct = contentType.toLowerCase();
	if (ct.includes('png')) return 'png';
	if (ct.includes('jpeg') || ct.includes('jpg')) return 'jpg';
	if (ct.includes('webp')) return 'webp';
	if (ct.includes('gif')) return 'gif';
	return 'bin';
}

export async function POST(request: NextRequest) {
	try {
		// Only admins can upload images (used by blog editor, course thumbnails, etc.)
		const admin = await isAdmin(request);
		if (!admin) {
			return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
		}

		const form = await request.formData();
		const file = form.get('file');
		if (!(file instanceof File)) {
			return NextResponse.json({ ok: false, error: 'Missing file' }, { status: 400 });
		}

		if (!file.type.startsWith('image/')) {
			return NextResponse.json({ ok: false, error: 'Only image uploads are allowed' }, { status: 400 });
		}

		const maxBytes = 5 * 1024 * 1024;
		if (file.size > maxBytes) {
			return NextResponse.json({ ok: false, error: 'Image too large (max 5MB)' }, { status: 400 });
		}

		const bytes = Buffer.from(await file.arrayBuffer());
		const ext = safeExt(file.type);
		const name = `${Date.now()}-${Math.random().toString(16).slice(2)}.${ext}`;

		const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
		await mkdir(uploadsDir, { recursive: true });
		await writeFile(path.join(uploadsDir, name), bytes);

		return NextResponse.json({ ok: true, data: { url: `/uploads/${name}` } });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return NextResponse.json({ ok: false, error: message }, { status: 400 });
	}
}
