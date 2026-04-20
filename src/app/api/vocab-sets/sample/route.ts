/* ════════════════════════════════════════════════════════════════════════
   GET /api/vocab-sets/sample
   Returns a sample .xlsx file that admins can use as an upload template.
   No authentication required — the file contains no sensitive data.
   ════════════════════════════════════════════════════════════════════════ */
import { buildSampleWorkbook } from '@/lib/vocab/parseVocabFile';

export function GET() {
	const buffer = buildSampleWorkbook();

	const blob = new Blob([buffer], {
		type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
	});

	return new Response(blob, {
		status: 200,
		headers: {
			'Content-Disposition': 'attachment; filename="sample-vocab.xlsx"',
			'Cache-Control': 'public, max-age=86400',
		},
	});
}
