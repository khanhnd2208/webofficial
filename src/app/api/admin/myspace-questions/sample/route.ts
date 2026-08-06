import { NextResponse } from 'next/server';

import { SAMPLE_MCQ_CSV } from '@/features/myspace-tests';
import { withAdmin } from '@/lib/apiUtils';

export const GET = withAdmin(async () => {
	return new NextResponse(SAMPLE_MCQ_CSV, {
		status: 200,
		headers: {
			'Content-Type': 'text/csv; charset=utf-8',
			'Content-Disposition': 'attachment; filename="sample-myspace-test.csv"',
		},
	});
});
