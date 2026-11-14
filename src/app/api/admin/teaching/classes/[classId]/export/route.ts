import { exportGradebookXlsx, exportGradeSummaryXlsx } from '@/features/teaching';
import { withAdmin } from '@/lib/apiUtils';
import { NextResponse } from 'next/server';

export const GET = withAdmin(async (request, _user, context) => {
	const classId = String((await context!.params).classId);
	const { filename, buffer } =
		request.nextUrl.searchParams.get('mode') === 'summary'
			? await exportGradeSummaryXlsx(classId)
			: await exportGradebookXlsx(classId);
	return new NextResponse(new Uint8Array(buffer), {
		headers: {
			'Cache-Control': 'private, no-store',
			'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			'Content-Disposition': `attachment; filename="${filename}"`,
		},
	});
});
