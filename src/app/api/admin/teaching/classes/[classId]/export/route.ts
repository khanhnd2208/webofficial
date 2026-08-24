import { exportGradebookXlsx } from '@/features/teaching';
import { withAdmin } from '@/lib/apiUtils';
import { NextResponse } from 'next/server';

export const GET = withAdmin(async (_request, _user, context) => {
	const { filename, buffer } = await exportGradebookXlsx(String((await context!.params).classId));
	return new NextResponse(new Uint8Array(buffer), {
		headers: {
			'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			'Content-Disposition': `attachment; filename="${filename}"`,
		},
	});
});
