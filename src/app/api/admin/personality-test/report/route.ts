/* ════════════════════════════════════════════════════════════════════════
   GET /api/admin/personality-test/report
   
   Returns all personality test sessions (with joined results) for the
   admin report dashboard. Admin-only.
   
   Query params:
   - limit  (default 500, max 2000)
   - format (default "json", or "xlsx" to stream an Excel file)
   ════════════════════════════════════════════════════════════════════════ */

import { type NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

import { withAdmin, apiSuccess, apiError } from '@/lib/apiUtils';
import { findAllSessionsForReport } from '@/models/PersonalityTest';

// ─── Column definitions for Excel export ───────────────────────────────────────

const EXCEL_COLUMNS = [
	{ key: 'no',                     label: 'No.' },
	{ key: 'created_at',             label: 'Timestamp' },
	{ key: 'full_name',              label: 'Họ và Tên' },
	{ key: 'university',             label: 'Trường Đại học' },
	{ key: 'student_year',           label: 'Năm học' },
	{ key: 'cumulative_gpa',         label: 'GPA Tích lũy' },
	{ key: 'self_rated_intelligence',label: 'Tự đánh giá IQ (1-10)' },
	{ key: 'status',                 label: 'Trạng thái' },
	{ key: 'duration_seconds',       label: 'Thời gian (giây)' },
	{ key: 'is_valid',               label: 'Hợp lệ?' },
	// OCEAN
	{ key: 'extraversion',           label: 'Hướng ngoại (E)' },
	{ key: 'agreeableness',          label: 'Dễ chịu (A)' },
	{ key: 'conscientiousness',      label: 'Tận tâm (C)' },
	{ key: 'negative_emotionality',  label: 'Cảm xúc tiêu cực (N)' },
	{ key: 'open_mindedness',        label: 'Cởi mở (O)' },
	// Dark Triad
	{ key: 'machiavellianism',       label: 'Mưu lược (M)' },
	{ key: 'narcissism',             label: 'Tự ái (N)' },
	{ key: 'psychopathy',            label: 'Phản xã hội (P)' },
	// Percentiles
	{ key: 'extraversion_pct',       label: '%ile Hướng ngoại' },
	{ key: 'agreeableness_pct',      label: '%ile Dễ chịu' },
	{ key: 'conscientiousness_pct',  label: '%ile Tận tâm' },
	{ key: 'negative_emotionality_pct', label: '%ile Cảm xúc tiêu cực' },
	{ key: 'open_mindedness_pct',    label: '%ile Cởi mở' },
	{ key: 'machiavellianism_pct',   label: '%ile Mưu lược' },
	{ key: 'narcissism_pct',         label: '%ile Tự ái' },
	{ key: 'psychopathy_pct',        label: '%ile Phản xã hội' },
	// Archetype
	{ key: 'archetype_name',         label: 'Archetype' },
	{ key: 'user_name',              label: 'Tài khoản' },
	{ key: 'id',                     label: 'Session ID' },
];

// ─── Handler ───────────────────────────────────────────────────────────────────

async function handleGet(req: NextRequest) {
	const { searchParams } = new URL(req.url);
	const limit = Math.min(Number(searchParams.get('limit') ?? 500), 2000);
	const format = searchParams.get('format') ?? 'json';

	const rows = await findAllSessionsForReport(limit);

	// ── JSON response ──
	if (format !== 'xlsx') {
		return apiSuccess({ rows, total: rows.length });
	}

	// ── Excel export ──
	const data = rows.map((r, idx) => {
		const row: Record<string, unknown> = { no: idx + 1 };
		for (const col of EXCEL_COLUMNS) {
			if (col.key === 'no') continue;
			const val = (r as unknown as Record<string, unknown>)[col.key];

			if (col.key === 'created_at' || col.key === 'completed_at') {
				row[col.label] = val ? new Date(val as string).toLocaleString('vi-VN') : '';
			} else if (col.key === 'is_valid') {
				row[col.label] = val === true ? 'Có' : val === false ? 'Không' : '';
			} else if (col.key === 'status') {
				const map: Record<string, string> = {
					completed: 'Hoàn thành',
					invalid: 'Không hợp lệ',
					in_progress: 'Đang làm',
				};
				row[col.label] = map[val as string] ?? (val as string);
			} else if (typeof val === 'number') {
				row[col.label] = Number(val.toFixed(3));
			} else {
				row[col.label] = val ?? '';
			}
		}
		return row;
	});

	const wb = XLSX.utils.book_new();
	const ws = XLSX.utils.json_to_sheet(data);

	// Auto column widths
	const colWidths = EXCEL_COLUMNS.map((col) => ({
		wch: Math.max(col.label.length + 2, 12),
	}));
	ws['!cols'] = colWidths;

	XLSX.utils.book_append_sheet(wb, ws, 'Personality Test Results');

	// Summary sheet
	const validRows = rows.filter((r) => r.is_valid);
	const avg = (key: keyof typeof rows[0]) => {
		const vals = validRows.map((r) => Number(r[key])).filter((v) => !isNaN(v) && v > 0);
		return vals.length ? +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(3) : null;
	};

	const summaryData = [
		{ 'Thống kê': 'Tổng số bài làm',    'Giá trị': rows.length },
		{ 'Thống kê': 'Bài hợp lệ',          'Giá trị': validRows.length },
		{ 'Thống kê': 'Bài không hợp lệ',    'Giá trị': rows.length - validRows.length },
		{ 'Thống kê': '---',                  'Giá trị': '---' },
		{ 'Thống kê': 'TB Hướng ngoại',      'Giá trị': avg('extraversion') },
		{ 'Thống kê': 'TB Dễ chịu',          'Giá trị': avg('agreeableness') },
		{ 'Thống kê': 'TB Tận tâm',          'Giá trị': avg('conscientiousness') },
		{ 'Thống kê': 'TB Cảm xúc tiêu cực', 'Giá trị': avg('negative_emotionality') },
		{ 'Thống kê': 'TB Cởi mở',           'Giá trị': avg('open_mindedness') },
		{ 'Thống kê': '---',                  'Giá trị': '---' },
		{ 'Thống kê': 'TB Mưu lược',         'Giá trị': avg('machiavellianism') },
		{ 'Thống kê': 'TB Tự ái',            'Giá trị': avg('narcissism') },
		{ 'Thống kê': 'TB Phản xã hội',      'Giá trị': avg('psychopathy') },
	];

	const ws2 = XLSX.utils.json_to_sheet(summaryData);
	ws2['!cols'] = [{ wch: 28 }, { wch: 14 }];
	XLSX.utils.book_append_sheet(wb, ws2, 'Tóm tắt');

	const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
	const dateStr = new Date().toISOString().split('T')[0];

	return new NextResponse(buf, {
		status: 200,
		headers: {
			'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			'Content-Disposition': `attachment; filename="personality-test-report-${dateStr}.xlsx"`,
			'Cache-Control': 'no-store',
		},
	});
}

export const GET = withAdmin(handleGet);
