/* ════════════════════════════════════════════════════════════════════════
   GET /api/admin/personality-test/report

   Returns all personality test sessions (with joined results) for the
   admin report dashboard. Admin-only.

   Query params:
   - limit  (default 500, max 2000)
   - format (default "json", or "xlsx" to stream an Excel file)

   Excel file structure (4 sheets):
   1. "Raw Responses"  — demographics + every individual item answer (raw value)
   2. "Scored Data"    — demographics + reversed/scored values + domain averages
                         All scoring formulas are transparent & auditable
   3. "Scoring Key"    — lists all items, their domain, and whether reversed
   4. "Tóm tắt"        — aggregate statistics across all valid sessions
   ════════════════════════════════════════════════════════════════════════ */

import { type NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

import { withAdmin, apiSuccess } from '@/lib/apiUtils';
import { findAllSessionsForReport, findResponsesForSessions } from '@/models/PersonalityTest';
import { BFI2S_QUESTIONS, SD3_QUESTIONS, getEffectiveScore } from '@/lib/personalityScoring';

// ─── Question metadata sorted by formOrder ────────────────────────────────────
// BFI-2-S: 30 items (formOrder 1-30, includes attention check at fo25)
// SD3:     27 items (formOrder 1-27, includes attention check at fo17)

const BFI_SORTED = [...BFI2S_QUESTIONS].sort((a, b) => a.formOrder - b.formOrder);
const SD3_SORTED = [...SD3_QUESTIONS].sort((a, b) => a.formOrder - b.formOrder);

/**
 * Build column label for each question as it appears in the form.
 * Format: "BFI_fo{N} [R] — {text}" so admin can see both position and content.
 * Attention check items labeled clearly.
 */
function bfiLabel(q: typeof BFI2S_QUESTIONS[0]): string {
	if (q.isAttentionCheck) return `BFI_fo${q.formOrder}_ATTN — ${q.text}`;
	return `BFI_fo${q.formOrder}${q.isReversed ? '[R]' : '   '} (Item${q.itemNumber}) — ${q.text.replace('I am someone who ', '')}`;
}

function sd3Label(q: typeof SD3_QUESTIONS[0]): string {
	if (q.isAttentionCheck) return `SD3_fo${q.formOrder}_ATTN — ${q.text}`;
	return `SD3_fo${q.formOrder}${q.isReversed ? '[R]' : '   '} (${q.domain.substring(0,4).toUpperCase()}-Item${q.itemNumber}) — ${q.text}`;
}


// ─── Demographic columns (same for both sheets) ───────────────────────────────

const DEMO_COLS = [
	{ key: 'no',                      label: 'No.' },
	{ key: 'created_at',              label: 'Dấu thời gian' },
	{ key: 'full_name',               label: 'Họ và Tên/Full Name' },
	{ key: 'university',              label: 'Trường' },
	{ key: 'student_year',            label: 'Năm học' },
	{ key: 'cumulative_gpa',          label: 'GPA Tích lũy' },
	{ key: 'self_rated_intelligence', label: 'Tự đánh giá IQ (1-10)' },
	{ key: 'status',                  label: 'Trạng thái' },
	{ key: 'duration_seconds',        label: 'Thời gian làm (giây)' },
	{ key: 'is_valid',                label: 'Hợp lệ?' },
	{ key: 'user_name',               label: 'Tài khoản' },
	{ key: 'id',                      label: 'Session ID' },
] as const;

type ReportRowRaw = Awaited<ReturnType<typeof findAllSessionsForReport>>[number];

function formatDemoCell(r: ReportRowRaw, key: string, idx: number): unknown {
	switch (key) {
		case 'no': return idx + 1;
		case 'created_at': return r.created_at ? new Date(r.created_at).toLocaleString('vi-VN') : '';
		case 'is_valid': return r.is_valid === true ? 'Có' : r.is_valid === false ? 'Không' : '';
		case 'status': {
			const map: Record<string, string> = {
				completed: 'Hoàn thành', invalid: 'Không hợp lệ', in_progress: 'Đang làm',
			};
			return map[r.status] ?? r.status;
		}
		default: return (r as unknown as Record<string, unknown>)[key] ?? '';
	}
}

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

	// ── Fetch raw responses for all sessions ──
	const sessionIds = rows.map(r => r.id);
	const responseMap = await findResponsesForSessions(sessionIds);

	// ─────────────────────────────────────────────────────────────────────────
	// SHEET 1: Raw Responses
	// Columns: demographics | BFI formOrder 1-30 (raw) | SD3 formOrder 1-27 (raw)
	// ─────────────────────────────────────────────────────────────────────────
	const rawSheet = rows.map((r, idx) => {
		const row: Record<string, unknown> = {};
		const resp = responseMap.get(r.id) ?? new Map<string, number>();

		// Demographics
		for (const col of DEMO_COLS) row[col.label] = formatDemoCell(r, col.key, idx);

		// BFI-2-S raw responses (formOrder 1-30)
		for (const q of BFI_SORTED) {
			row[bfiLabel(q)] = resp.get(`BFI2S_fo${q.formOrder}`) ?? '';
		}

		// SD3 raw responses (formOrder 1-27)
		for (const q of SD3_SORTED) {
			row[sd3Label(q)] = resp.get(`SD3_fo${q.formOrder}`) ?? '';
		}

		return row;
	});

	// ─────────────────────────────────────────────────────────────────────────
	// SHEET 2: Scored Data
	// Columns: demographics | BFI scored (reversed applied) | domain averages
	//          | SD3 scored | domain averages
	// ─────────────────────────────────────────────────────────────────────────
	const scoredSheet = rows.map((r, idx) => {
		const row: Record<string, unknown> = {};
		const resp = responseMap.get(r.id) ?? new Map<string, number>();

		// Demographics
		for (const col of DEMO_COLS) row[col.label] = formatDemoCell(r, col.key, idx);

		// BFI-2-S scored (after reverse scoring, skip attention check)
		for (const q of BFI_SORTED) {
			if (q.isAttentionCheck) continue;
			const raw = resp.get(`BFI2S_fo${q.formOrder}`);
			if (raw !== undefined) {
				const scored = getEffectiveScore(raw, q.isReversed);
				const label = `[Scored] BFI Item${q.itemNumber}${q.isReversed ? 'R' : ''} (fo${q.formOrder})`;
				row[label] = scored;
			}
		}

		// BFI domain averages
		const bfiDomains = [
			{ key: 'extraversion',         label: 'E - Extraversion (avg)' },
			{ key: 'agreeableness',        label: 'A - Agreeableness (avg)' },
			{ key: 'conscientiousness',    label: 'C - Conscientiousness (avg)' },
			{ key: 'negativeEmotionality', label: 'N - Negative Emotionality (avg)' },
			{ key: 'openMindedness',       label: 'O - Open-Mindedness (avg)' },
		];
		row[''] = ''; // spacer
		for (const d of bfiDomains) {
			const dbKey = d.key.replace(/([A-Z])/g, '_$1').toLowerCase() as keyof ReportRowRaw;
			row[d.label] = r[dbKey] !== null && r[dbKey] !== undefined ? Number((r[dbKey] as number).toFixed(3)) : '';
		}

		// SD3 scored (after reverse scoring, skip attention check)
		row[' '] = ''; // spacer
		for (const q of SD3_SORTED) {
			if (q.isAttentionCheck) continue;
			const raw = resp.get(`SD3_fo${q.formOrder}`);
			if (raw !== undefined) {
				const scored = getEffectiveScore(raw, q.isReversed);
				const label = `[Scored] SD3 Item${q.itemNumber}${q.isReversed ? 'R' : ''} (fo${q.formOrder})`;
				row[label] = scored;
			}
		}

		// SD3 domain averages
		const sd3Domains = [
			{ key: 'machiavellianism', label: 'M - Machiavellianism (avg)' },
			{ key: 'narcissism',       label: 'Narc - Narcissism (avg)' },
			{ key: 'psychopathy',      label: 'P - Psychopathy (avg)' },
		];
		row['  '] = ''; // spacer
		for (const d of sd3Domains) {
			const dbKey = d.key as keyof ReportRowRaw;
			row[d.label] = r[dbKey] !== null && r[dbKey] !== undefined ? Number((r[dbKey] as number).toFixed(3)) : '';
		}

		// Archetype
		row['Archetype'] = r.archetype_name ?? '';

		return row;
	});

	// ─────────────────────────────────────────────────────────────────────────
	// SHEET 3: Scoring Key
	// ─────────────────────────────────────────────────────────────────────────
	const keySheet: Record<string, unknown>[] = [
		// Header note
		{
			'Test': '═══ BFI-2-S SCORING KEY ═══',
			'Form Position': 'Source: Soto & John (2017). BFI-2-S.',
			'Academic Item#': '',
			'Domain': '',
			'Reversed?': '',
			'Question Text (EN)': 'Scoring: AVERAGE of 6 items per domain (after reverse scoring). Reverse = 6 - raw_value.',
			'Question Text (VI)': '',
			'Domain Items': '',
		},
		...BFI_SORTED.map(q => ({
			'Test': 'BFI-2-S',
			'Form Position': q.formOrder,
			'Academic Item#': q.isAttentionCheck ? 'ATTN' : q.itemNumber,
			'Domain': q.isAttentionCheck ? 'Attention Check' : q.domain,
			'Reversed?': q.isReversed ? 'YES (6 - raw)' : 'No',
			'Question Text (EN)': q.text,
			'Question Text (VI)': q.textVi,
			'Domain Items': q.isAttentionCheck ? '' : getDomainItemsSummary('BFI2S', q.domain),
		})),
		// Spacer
		{ 'Test': '', 'Form Position': '', 'Academic Item#': '', 'Domain': '', 'Reversed?': '', 'Question Text (EN)': '', 'Question Text (VI)': '', 'Domain Items': '' },
		// SD3 header
		{
			'Test': '═══ SD3 SCORING KEY ═══',
			'Form Position': 'Source: Jones & Paulhus (2014). Short Dark Triad.',
			'Academic Item#': '',
			'Domain': '',
			'Reversed?': '',
			'Question Text (EN)': 'Scoring: AVERAGE of 9 items per domain (after reverse scoring). Reverse = 6 - raw_value.',
			'Question Text (VI)': '',
			'Domain Items': '',
		},
		...SD3_SORTED.map(q => ({
			'Test': 'SD3',
			'Form Position': q.formOrder,
			'Academic Item#': q.isAttentionCheck ? 'ATTN' : q.itemNumber,
			'Domain': q.isAttentionCheck ? 'Attention Check' : q.domain,
			'Reversed?': q.isReversed ? 'YES (6 - raw)' : 'No',
			'Question Text (EN)': q.text,
			'Question Text (VI)': q.textVi,
			'Domain Items': q.isAttentionCheck ? '' : getDomainItemsSummary('SD3', q.domain),
		})),
	];

	// ─────────────────────────────────────────────────────────────────────────
	// SHEET 4: Summary Statistics
	// ─────────────────────────────────────────────────────────────────────────
	const validRows = rows.filter(r => r.is_valid);
	const avg = (key: keyof ReportRowRaw) => {
		const vals = validRows.map(r => Number(r[key])).filter(v => !isNaN(v) && v > 0);
		return vals.length ? Number((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(3)) : null;
	};
	const stdDev = (key: keyof ReportRowRaw) => {
		const vals = validRows.map(r => Number(r[key])).filter(v => !isNaN(v) && v > 0);
		if (vals.length < 2) return null;
		const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
		const variance = vals.reduce((s, v) => s + (v - mean) ** 2, 0) / (vals.length - 1);
		return Number(Math.sqrt(variance).toFixed(3));
	};

	const summarySheet = [
		{ 'Thống kê': '═══ TỔNG QUAN ═══',          'Giá trị': '',    'Ghi chú': '' },
		{ 'Thống kê': 'Tổng số bài làm',              'Giá trị': rows.length, 'Ghi chú': '' },
		{ 'Thống kê': 'Bài hợp lệ',                   'Giá trị': validRows.length, 'Ghi chú': 'Passed attention checks' },
		{ 'Thống kê': 'Bài không hợp lệ',             'Giá trị': rows.length - validRows.length, 'Ghi chú': 'Failed attention check or incomplete' },
		{ 'Thống kê': '', 'Giá trị': '', 'Ghi chú': '' },
		{ 'Thống kê': '═══ BFI-2-S: OCEAN (1-5 scale) ═══', 'Giá trị': '', 'Ghi chú': 'Mean (SD) — valid sessions only' },
		{ 'Thống kê': 'E - Extraversion',             'Giá trị': avg('extraversion'),           'Ghi chú': `SD = ${stdDev('extraversion') ?? 'N/A'}` },
		{ 'Thống kê': 'A - Agreeableness',            'Giá trị': avg('agreeableness'),          'Ghi chú': `SD = ${stdDev('agreeableness') ?? 'N/A'}` },
		{ 'Thống kê': 'C - Conscientiousness',        'Giá trị': avg('conscientiousness'),      'Ghi chú': `SD = ${stdDev('conscientiousness') ?? 'N/A'}` },
		{ 'Thống kê': 'N - Negative Emotionality',    'Giá trị': avg('negative_emotionality'),  'Ghi chú': `SD = ${stdDev('negative_emotionality') ?? 'N/A'}` },
		{ 'Thống kê': 'O - Open-Mindedness',          'Giá trị': avg('open_mindedness'),        'Ghi chú': `SD = ${stdDev('open_mindedness') ?? 'N/A'}` },
		{ 'Thống kê': '', 'Giá trị': '', 'Ghi chú': '' },
		{ 'Thống kê': '═══ SD3: DARK TRIAD (1-5 scale) ═══', 'Giá trị': '', 'Ghi chú': 'Mean (SD) — valid sessions only' },
		{ 'Thống kê': 'M - Machiavellianism',         'Giá trị': avg('machiavellianism'),       'Ghi chú': `SD = ${stdDev('machiavellianism') ?? 'N/A'}` },
		{ 'Thống kê': 'Narc - Narcissism',            'Giá trị': avg('narcissism'),             'Ghi chú': `SD = ${stdDev('narcissism') ?? 'N/A'}` },
		{ 'Thống kê': 'P - Psychopathy',              'Giá trị': avg('psychopathy'),            'Ghi chú': `SD = ${stdDev('psychopathy') ?? 'N/A'}` },
		{ 'Thống kê': '', 'Giá trị': '', 'Ghi chú': '' },
		{ 'Thống kê': '═══ SCORING FORMULA (for reference) ═══', 'Giá trị': '', 'Ghi chú': '' },
		{ 'Thống kê': 'Reverse scoring',              'Giá trị': '6 - raw_value', 'Ghi chú': 'Applied to items marked R in Scoring Key sheet' },
		{ 'Thống kê': 'Domain score',                 'Giá trị': 'AVERAGE(scored items)', 'Ghi chú': '6 items for BFI-2-S domains, 9 for SD3 domains' },
		{ 'Thống kê': 'Likert scale',                 'Giá trị': '1-5', 'Ghi chú': '1=Disagree strongly, 3=Neutral, 5=Agree strongly' },
		{ 'Thống kê': 'BFI-2-S: Extraversion',       'Giá trị': 'Items 1R, 6, 11, 16, 21R, 26R', 'Ghi chú': 'Academic numbering — see Scoring Key sheet' },
		{ 'Thống kê': 'BFI-2-S: Agreeableness',      'Giá trị': 'Items 2R, 7, 12R, 17R, 22, 27R', 'Ghi chú': '' },
		{ 'Thống kê': 'BFI-2-S: Conscientiousness',  'Giá trị': 'Items 3R, 8, 13, 18R, 23, 28R', 'Ghi chú': '' },
		{ 'Thống kê': 'BFI-2-S: Neg. Emotionality',  'Giá trị': 'Items 4, 9, 14, 19R, 24, 29', 'Ghi chú': '' },
		{ 'Thống kê': 'BFI-2-S: Open-Mindedness',    'Giá trị': 'Items 5, 10R, 15, 20R, 25, 30R', 'Ghi chú': '' },
		{ 'Thống kê': 'SD3: Machiavellianism',        'Giá trị': 'Items M1-M9 (none reversed)', 'Ghi chú': 'All 9 Mach items are non-reversed' },
		{ 'Thống kê': 'SD3: Narcissism',              'Giá trị': 'Items N10-N18 (N11R, N15R, N16R reversed)', 'Ghi chú': 'Items 2,6,8 of Narc are reversed (form positions 5,17attn,23)' },
		{ 'Thống kê': 'SD3: Psychopathy',             'Giá trị': 'Items P19-P27 (P20R, P25R reversed)', 'Ghi chú': 'Items 2,7 of Psychopathy are reversed (form positions 6,21)' },
	];

	// ── Build workbook ──
	const wb = XLSX.utils.book_new();

	const ws1 = XLSX.utils.json_to_sheet(rawSheet);
	styleSheet(ws1, rawSheet);
	XLSX.utils.book_append_sheet(wb, ws1, '1. Raw Responses');

	const ws2 = XLSX.utils.json_to_sheet(scoredSheet);
	styleSheet(ws2, scoredSheet);
	XLSX.utils.book_append_sheet(wb, ws2, '2. Scored Data');

	const ws3 = XLSX.utils.json_to_sheet(keySheet);
	ws3['!cols'] = [
		{ wch: 8 }, { wch: 14 }, { wch: 14 }, { wch: 22 }, { wch: 16 },
		{ wch: 60 }, { wch: 55 }, { wch: 30 },
	];
	XLSX.utils.book_append_sheet(wb, ws3, '3. Scoring Key');

	const ws4 = XLSX.utils.json_to_sheet(summarySheet);
	ws4['!cols'] = [{ wch: 36 }, { wch: 32 }, { wch: 45 }];
	XLSX.utils.book_append_sheet(wb, ws4, '4. Tóm tắt');

	const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
	const dateStr = new Date().toISOString().split('T')[0];

	return new NextResponse(buf, {
		status: 200,
		headers: {
			'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			'Content-Disposition': `attachment; filename="personality-report-${dateStr}.xlsx"`,
			'Cache-Control': 'no-store',
		},
	});
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** Auto-width columns based on content */
function styleSheet(ws: XLSX.WorkSheet, data: Record<string, unknown>[]) {
	if (data.length === 0) return;
	const keys = Object.keys(data[0]);
	ws['!cols'] = keys.map(k => ({
		wch: Math.max(
			k.length,
			...data.slice(0, 30).map(row => String(row[k] ?? '').length)
		) + 2,
	}));
}

/** Summarize which items belong to a domain (for Scoring Key sheet) */
function getDomainItemsSummary(testType: string, domain: string): string {
	const qs = (testType === 'BFI2S' ? BFI2S_QUESTIONS : SD3_QUESTIONS)
		.filter(q => q.domain === domain && !q.isAttentionCheck)
		.sort((a, b) => a.itemNumber - b.itemNumber);
	return qs.map(q => `Item${q.itemNumber}${q.isReversed ? 'R' : ''}`).join(', ');
}

export const GET = withAdmin(handleGet);
