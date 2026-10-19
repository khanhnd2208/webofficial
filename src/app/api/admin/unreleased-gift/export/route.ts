import { NextResponse } from 'next/server';

import { feedbackToCsv } from '@/features/unreleased-gift/domain/report';
import { listFeedback } from '@/features/unreleased-gift/services/feedbackService';
import { withAdmin } from '@/lib/apiUtils';

export const GET = withAdmin(async () => {
	const rows = await listFeedback();
	return new NextResponse(`﻿${feedbackToCsv(rows)}`, {
		headers: {
			'content-type': 'text/csv; charset=utf-8',
			'content-disposition': 'attachment; filename="unreleased-gift-feedback.csv"',
			'cache-control': 'no-store',
		},
	});
});
