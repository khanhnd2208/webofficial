import { AppError } from '@/lib/appError';
import type { NextRequest } from 'next/server';

import type { RosterImportSource } from '../services/importService';

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

function isXlsx(buffer: Buffer, filename: string) {
	return (
		filename.toLowerCase().endsWith('.xlsx') ||
		(buffer.length >= 2 && buffer[0] === 0x50 && buffer[1] === 0x4b)
	);
}

export async function readRosterImportSource(request: NextRequest): Promise<RosterImportSource> {
	const contentType = request.headers.get('content-type') ?? '';
	if (contentType.includes('multipart/form-data')) {
		const form = await request.formData();
		const file = form.get('file');
		if (!(file instanceof File) || file.size === 0 || file.size > MAX_UPLOAD_BYTES) {
			throw new AppError('Hãy tải file CSV hoặc Excel danh sách sinh viên.', 422, 'VALIDATION');
		}
		const buffer = Buffer.from(await file.arrayBuffer());
		const filename = file.name || 'upload';
		if (filename.toLowerCase().endsWith('.csv') || contentType.includes('csv')) {
			return { kind: 'csv', text: buffer.toString('utf8') };
		}
		if (!isXlsx(buffer, filename)) {
			throw new AppError('File .xlsx hoặc .csv không hợp lệ.', 422, 'VALIDATION');
		}
		return { kind: 'xlsx', buffer };
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		throw new AppError('Invalid JSON body', 400, 'VALIDATION');
	}
	if (!body || typeof body !== 'object') {
		throw new AppError('Invalid JSON body', 400, 'VALIDATION');
	}
	const payload = body as {
		source?: string;
		text?: string;
		students?: Array<Record<string, unknown>>;
	};
	if (payload.source === 'manual' || Array.isArray(payload.students)) {
		return { kind: 'manual', students: payload.students ?? [] };
	}
	if (typeof payload.text !== 'string' || !payload.text.trim()) {
		throw new AppError('Hãy dán dữ liệu hoặc tải file danh sách sinh viên.', 422, 'VALIDATION');
	}
	return { kind: payload.source === 'csv' ? 'csv' : 'paste', text: payload.text };
}
