import { readFile } from 'node:fs/promises';

import { type NextRequest, NextResponse } from 'next/server';

import { hasFeedback } from '@/features/unreleased-gift/services/feedbackService';
import { GIFT_PDF_PATH, giftPdfIsReady } from '@/features/unreleased-gift/services/giftFile';
import { AppError, withErrorHandling } from '@/lib/apiUtils';

export const GET = withErrorHandling(async (request: NextRequest) => {
	const responseId = request.nextUrl.searchParams.get('response');
	if (!responseId || !/^[0-9a-f-]{36}$/i.test(responseId) || !(await hasFeedback(responseId))) {
		throw new AppError('Bạn cần hoàn thành đánh giá để nhận tài liệu.', 403);
	}
	if (!giftPdfIsReady()) throw new AppError('Tài liệu chưa sẵn sàng.', 404);

	const pdf = await readFile(GIFT_PDF_PATH);
	return new NextResponse(new Uint8Array(pdf), {
		headers: {
			'content-type': 'application/pdf',
			'content-disposition': 'attachment; filename="unreleased-workshop.pdf"',
			'cache-control': 'private, no-store',
		},
	});
});
