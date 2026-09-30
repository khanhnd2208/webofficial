import {
	rosterCsvTemplateBody,
	ROSTER_CSV_FILENAME,
} from '@/features/teaching/imports/rosterCsvTemplate';
import { withAdmin } from '@/lib/apiUtils';
import { NextResponse } from 'next/server';

export const GET = withAdmin(async () => {
	const body = rosterCsvTemplateBody();
	return new NextResponse(body, {
		headers: {
			'Content-Type': 'text/csv; charset=utf-8',
			'Content-Disposition': `attachment; filename="${ROSTER_CSV_FILENAME}"`,
			'Cache-Control': 'no-store',
		},
	});
});
