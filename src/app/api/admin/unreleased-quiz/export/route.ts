import { NextResponse } from 'next/server';

import { localDay, responsesToCsv } from '@/features/unreleased-quiz/domain/report';
import { listResponses } from '@/features/unreleased-quiz/services/responseService';
import { withAdmin } from '@/lib/apiUtils';

export const GET = withAdmin(async () => {
	const rows = await listResponses();
	// A UTF-8 BOM so Excel opens the file with the right encoding.
	return new NextResponse(`﻿${responsesToCsv(rows)}`, {
		headers: {
			'content-type': 'text/csv; charset=utf-8',
			'content-disposition': `attachment; filename="unreleased-quiz-${localDay(new Date())}.csv"`,
			'cache-control': 'no-store',
		},
	});
});
