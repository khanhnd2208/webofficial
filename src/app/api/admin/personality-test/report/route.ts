/* ════════════════════════════════════════════════════════════════════════
   GET /api/admin/personality-test/report

   Admin-only report endpoint for personality test data.

   Query params:
     limit   default 500, max 2000
     format  "json" (default) | "xlsx"

   Excel output — 4 sheets, matching the user's Google Form column order exactly:
   ┌─────────────────────────────────────────────────────────────────────┐
   │ Sheet 1 "1. Raw Responses"                                          │
   │   Demographics (same order as Google Form)                          │
   │   BFI-2-S Q1…Q30 (raw 1-5, form order = Google Form column order)  │
   │   SD3      Q1…Q27 (raw 1-5, form order = Google Form column order)  │
   ├─────────────────────────────────────────────────────────────────────┤
   │ Sheet 2 "2. Scored Data"                                            │
   │   Demographics | BFI scored items | OCEAN averages                  │
   │   SD3 scored items | Dark Triad averages | Archetype                │
   ├─────────────────────────────────────────────────────────────────────┤
   │ Sheet 3 "3. Scoring Key"                                            │
   │   Each item: form position, academic#, domain, reversed, text EN/VI │
   ├─────────────────────────────────────────────────────────────────────┤
   │ Sheet 4 "4. Tóm tắt"                                               │
   │   Aggregate mean & SD for all 8 traits (valid sessions only)        │
   └─────────────────────────────────────────────────────────────────────┘
   ════════════════════════════════════════════════════════════════════════ */

import { type NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

import { withAdmin, apiSuccess } from '@/lib/apiUtils';
import { findAllSessionsForReport, findResponsesForSessions } from '@/models/PersonalityTest';
import { BFI2S_QUESTIONS, SD3_QUESTIONS, getEffectiveScore } from '@/lib/personalityScoring';
import {
	calculateAllPercentiles,
	getDefaultReferenceGroupIds,
	REFERENCE_GROUPS,
	type PercentileResult,
} from '@/lib/normativeData';
import type { PersonalityDomain } from '@/types/personalityTest';

// ─── Question arrays sorted by formOrder (= Google Form column order) ─────────

const BFI_SORTED = [...BFI2S_QUESTIONS].sort((a, b) => a.formOrder - b.formOrder);
const SD3_SORTED = [...SD3_QUESTIONS].sort((a, b) => a.formOrder - b.formOrder);

// ─── Types ────────────────────────────────────────────────────────────────────

type ReportRowRaw = Awaited<ReturnType<typeof findAllSessionsForReport>>[number];

// ─── Google Form column header generators ─────────────────────────────────────
// Headers match the exact Google Form column format:
//   BFI: "{formOrder}. {short text}"     e.g.  "1. Tends to be quiet."
//   SD3: "{formOrder}. {text}"           e.g.  "1. It's not wise to tell your secrets."

function bfiGFHeader(q: typeof BFI2S_QUESTIONS[0]): string {
	if (q.isAttentionCheck) {
		return `${q.formOrder}. [ATTENTION CHECK] ${q.textVi}`;
	}
	const shortText = q.text.replace(/^I am someone who /i, '').replace(/^\./,'');
	// Capitalize first letter
	const capitalized = shortText.charAt(0).toUpperCase() + shortText.slice(1);
	return `${q.formOrder}. ${capitalized}`;
}

function sd3GFHeader(q: typeof SD3_QUESTIONS[0]): string {
	if (q.isAttentionCheck) {
		return `${q.formOrder}. [ATTENTION CHECK] ${q.textVi}`;
	}
	return `${q.formOrder}. ${q.text}`;
}

// ─── Demographic column definitions ───────────────────────────────────────────
// FORM_DEMO_COLS: columns that appear in the Google Form (Sheet 1 — exact headers)
// META_COLS: admin metadata appended to other sheets

const FORM_DEMO_COLS = [
	{ key: 'created_at',              label: 'Dấu thời gian' },
	{ key: 'full_name',               label: 'Họ và Tên/Full Name' },
	{ key: 'gender',                  label: 'Giới tính' },
	{ key: 'university',              label: 'Trường' },
	{ key: 'student_year',            label: 'Bạn là sinh viên năm mấy của Trường?' },
	{ key: 'cumulative_gpa',          label: 'GPA tích luỹ đến thời điểm hiện tại của bạn' },
	{ key: 'self_rated_intelligence', label: '"How would you rate your level of general intelligence compared to that of the average student?\n\nCircle a number on the following scale: "' },
] as const;

// All columns including admin metadata (for Sheet 2 and beyond)
const DEMO_COLS = [
	...FORM_DEMO_COLS,
	{ key: 'no',              label: 'No.' },
	{ key: 'status',          label: 'Trạng thái' },
	{ key: 'duration_seconds', label: 'Thời gian làm (giây)' },
	{ key: 'is_valid',        label: 'Hợp lệ?' },
	{ key: 'user_name',       label: 'Tài khoản' },
	{ key: 'id',              label: 'Session ID' },
] as const;

function formatDemoCell(r: ReportRowRaw, key: string, idx: number): unknown {
	switch (key) {
		case 'no':         return idx + 1;
		case 'created_at': return r.created_at ? new Date(r.created_at).toLocaleString('vi-VN') : '';
		case 'is_valid':   return r.is_valid === true ? 'Có' : r.is_valid === false ? 'Không' : '';
		case 'gender': {
			const gMap: Record<string, string> = { male: 'Nam', female: 'Nữ', other: 'Khác' };
			return gMap[r.gender ?? ''] ?? (r.gender ?? '');
		}
		case 'status': {
			const map: Record<string, string> = {
				completed: 'Hoàn thành', invalid: 'Không hợp lệ', in_progress: 'Đang làm',
			};
			return map[r.status] ?? r.status;
		}
		default: return (r as unknown as Record<string, unknown>)[key] ?? '';
	}
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Map DB snake_case domain keys to camelCase PersonalityDomain keys */
const DB_TO_DOMAIN: Record<string, PersonalityDomain> = {
	extraversion:          'extraversion',
	agreeableness:         'agreeableness',
	conscientiousness:     'conscientiousness',
	negative_emotionality: 'negativeEmotionality',
	open_mindedness:       'openMindedness',
	machiavellianism:      'machiavellianism',
	narcissism:            'narcissism',
	psychopathy:           'psychopathy',
};

/** Calculate normative percentiles for a report row, using gender-specific SD3 Study 1 norms */
function getRowPercentiles(r: ReportRowRaw): Record<string, PercentileResult> {
	const gender = (r.gender as 'male' | 'female' | 'other' | null) ?? undefined;
	const defaults = getDefaultReferenceGroupIds(gender);
	const scores: Partial<Record<PersonalityDomain, number>> = {};
	for (const [dbKey, domain] of Object.entries(DB_TO_DOMAIN)) {
		const val = r[dbKey as keyof ReportRowRaw];
		if (val != null && !isNaN(Number(val)) && Number(val) > 0) {
			scores[domain] = Number(val);
		}
	}
	return calculateAllPercentiles(scores, defaults.ocean, defaults.darkTriad, gender);
}

function autoFitColumns(ws: XLSX.WorkSheet, data: Record<string, unknown>[]): void {
	if (data.length === 0) return;
	const keys = Object.keys(data[0]);
	ws['!cols'] = keys.map(k => ({
wch: Math.min(80, Math.max(k.length + 2, ...data.slice(0, 50).map(row => String(row[k] ?? '').length + 1))),
	}));
}

function getDomainItemsSummary(testType: 'BFI2S' | 'SD3', domain: string): string {
	const qs = (testType === 'BFI2S' ? BFI2S_QUESTIONS : SD3_QUESTIONS)
		.filter(q => q.domain === domain && !q.isAttentionCheck)
		.sort((a, b) => a.itemNumber - b.itemNumber);
	return qs.map(q => `Item${q.itemNumber}${q.isReversed ? 'R' : ''}`).join(', ');
}

function computeStats(validRows: ReportRowRaw[]) {
	const avg = (key: keyof ReportRowRaw) => {
		const vals = validRows.map(r => Number(r[key])).filter(v => !isNaN(v) && v > 0);
		return vals.length ? Number((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(3)) : null;
	};
	const sd = (key: keyof ReportRowRaw) => {
		const vals = validRows.map(r => Number(r[key])).filter(v => !isNaN(v) && v > 0);
		if (vals.length < 2) return null;
		const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
		const variance = vals.reduce((s, v) => s + (v - mean) ** 2, 0) / (vals.length - 1);
		return Number(Math.sqrt(variance).toFixed(3));
	};
	return { avg, sd };
}

// ─── Route handler ────────────────────────────────────────────────────────────

async function handleGet(req: NextRequest) {
	const { searchParams } = new URL(req.url);
	const limit  = Math.min(Number(searchParams.get('limit')  ?? 500), 2000);
	const format = searchParams.get('format') ?? 'json';

	const rows = await findAllSessionsForReport(limit);

	if (format !== 'xlsx') {
		return apiSuccess({ rows, total: rows.length });
	}

	// Excel export
	const sessionIds = rows.map(r => r.id);
	let responseMap: Map<string, Map<string, number>>;
	try {
		responseMap = await findResponsesForSessions(sessionIds);
	} catch (err) {
		console.error('[REPORT] findResponsesForSessions failed:', err);
		throw err;
	}

	// ═══════════════════════════════════════════════════════════════════
	// SHEET 1: Raw Responses — demographics + BFI Q1-Q30 + SD3 Q1-Q27
	// Column headers exactly match Google Form column names.
	// Attention checks appear in their natural form-order position.
	// ═══════════════════════════════════════════════════════════════════
	const rawSheet = rows.map((r, idx) => {
		const row: Record<string, unknown> = {};
		const resp = responseMap.get(r.id) ?? new Map<string, number>();
		// Demographics: only Google Form columns (no admin metadata) in exact form order
		for (const col of FORM_DEMO_COLS) row[col.label] = formatDemoCell(r, col.key, idx);
		// BFI: all items in formOrder (attention check stays at its natural fo25 position)
		for (const q of BFI_SORTED) {
			row[bfiGFHeader(q)] = resp.get(`BFI2S_fo${q.formOrder}`) ?? '';
		}
		// SD3: all items in formOrder (attention check stays at its natural fo17 position)
		for (const q of SD3_SORTED) {
			row[sd3GFHeader(q)] = resp.get(`SD3_fo${q.formOrder}`) ?? '';
		}
		return row;
	});

	// ═══════════════════════════════════════════════════════════════════
	// SHEET 2: Scored Data — reverse-scored items + domain averages
	// ═══════════════════════════════════════════════════════════════════
	const scoredSheet = rows.map((r, idx) => {
		const row: Record<string, unknown> = {};
		const resp = responseMap.get(r.id) ?? new Map<string, number>();

		for (const col of DEMO_COLS) row[col.label] = formatDemoCell(r, col.key, idx);

		// BFI scored items
		for (const q of BFI_SORTED) {
			if (q.isAttentionCheck) continue;
			const raw = resp.get(`BFI2S_fo${q.formOrder}`);
			const scored = raw !== undefined ? getEffectiveScore(raw, q.isReversed) : '';
			const label = `BFI Item${String(q.itemNumber).padStart(2,'0')}${q.isReversed ? 'R' : ' '} [fo${q.formOrder}]${q.isReversed ? ` (6-${raw ?? '?'})` : ''}`;
			row[label] = scored;
		}

		// BFI domain averages
		row['── BFI OCEAN ──'] = '';
		for (const d of [
{ dbKey: 'extraversion'          as keyof ReportRowRaw, label: 'E Extraversion', domain: 'extraversion' },
{ dbKey: 'agreeableness'         as keyof ReportRowRaw, label: 'A Agreeableness', domain: 'agreeableness' },
{ dbKey: 'conscientiousness'     as keyof ReportRowRaw, label: 'C Conscientiousness', domain: 'conscientiousness' },
{ dbKey: 'negative_emotionality' as keyof ReportRowRaw, label: 'N Negative Emotionality', domain: 'negativeEmotionality' },
{ dbKey: 'open_mindedness'       as keyof ReportRowRaw, label: 'O Open-Mindedness', domain: 'openMindedness' },
]) {
			const v = r[d.dbKey];
			row[d.label] = (v !== null && v !== undefined) ? Number(Number(v).toFixed(3)) : '';
		}

		// BFI normative percentiles
		const pctData = getRowPercentiles(r);
		row['── BFI PERCENTILES ──'] = '';
		for (const d of [
{ domain: 'extraversion',         label: 'E Pct' },
{ domain: 'agreeableness',        label: 'A Pct' },
{ domain: 'conscientiousness',    label: 'C Pct' },
{ domain: 'negativeEmotionality', label: 'N Pct' },
{ domain: 'openMindedness',       label: 'O Pct' },
]) {
			const p = pctData[d.domain];
			row[`${d.label} (Percentile)`] = p ? p.percentile : '';
			row[`${d.label} (z-score)`] = p ? p.zScore : '';
			row[`${d.label} (Mức)`] = p ? p.interpretationVi : '';
		}

		// SD3 scored items
		row['── SD3 ITEMS ──'] = '';
		for (const q of SD3_SORTED) {
			if (q.isAttentionCheck) continue;
			const raw = resp.get(`SD3_fo${q.formOrder}`);
			const scored = raw !== undefined ? getEffectiveScore(raw, q.isReversed) : '';
			const domain = q.domain.charAt(0).toUpperCase();
			const label = `SD3 ${domain}Item${String(q.itemNumber).padStart(2,'0')}${q.isReversed ? 'R' : ' '} [fo${q.formOrder}]${q.isReversed ? ` (6-${raw ?? '?'})` : ''}`;
			row[label] = scored;
		}

		// SD3 domain averages
		row['── SD3 DARK TRIAD ──'] = '';
		for (const d of [
{ dbKey: 'machiavellianism' as keyof ReportRowRaw, label: 'M Machiavellianism' },
{ dbKey: 'narcissism'       as keyof ReportRowRaw, label: 'N Narcissism' },
{ dbKey: 'psychopathy'      as keyof ReportRowRaw, label: 'P Psychopathy' },
]) {
			const v = r[d.dbKey];
			row[d.label] = (v !== null && v !== undefined) ? Number(Number(v).toFixed(3)) : '';
		}

		// SD3 normative percentiles
		row['── SD3 PERCENTILES ──'] = '';
		for (const d of [
{ domain: 'machiavellianism', label: 'M Pct' },
{ domain: 'narcissism',       label: 'Narc Pct' },
{ domain: 'psychopathy',      label: 'P Pct' },
]) {
			const p = pctData[d.domain];
			row[`${d.label} (Percentile)`] = p ? p.percentile : '';
			row[`${d.label} (z-score)`] = p ? p.zScore : '';
			row[`${d.label} (Mức)`] = p ? p.interpretationVi : '';
		}

		row['Archetype'] = r.archetype_name ?? '';
		return row;
	});

	// ═══════════════════════════════════════════════════════════════════
	// SHEET 3: Scoring Key
	// ═══════════════════════════════════════════════════════════════════
	const keySheet: Record<string, unknown>[] = [];

	keySheet.push({ 'Test': '═══ BFI-2-S ═══', 'Form Position': 'Source: Soto & John (2017)', 'Academic Item#': 'avg of 6 items/domain; reverse = 6 − raw', 'Domain': '', 'Reversed?': '', 'Question Text (EN)': '', 'Question Text (VI)': '', 'Domain Items': '' });
	for (const q of BFI_SORTED) {
		keySheet.push({
'Test': 'BFI-2-S',
'Form Position': q.formOrder,
'Academic Item#': q.isAttentionCheck ? 'ATTN' : q.itemNumber,
'Domain': q.isAttentionCheck ? 'Attention Check' : q.domain,
'Reversed?': q.isReversed ? 'YES (6 − raw)' : 'No',
'Question Text (EN)': q.text,
'Question Text (VI)': q.textVi,
'Domain Items': q.isAttentionCheck ? '' : getDomainItemsSummary('BFI2S', q.domain),
});
	}

	keySheet.push({ 'Test': '', 'Form Position': '', 'Academic Item#': '', 'Domain': '', 'Reversed?': '', 'Question Text (EN)': '', 'Question Text (VI)': '', 'Domain Items': '' });

	keySheet.push({ 'Test': '═══ SD3 ═══', 'Form Position': 'Source: Jones & Paulhus (2014)', 'Academic Item#': 'avg of 9 items/domain; reverse = 6 − raw', 'Domain': '', 'Reversed?': '', 'Question Text (EN)': '', 'Question Text (VI)': '', 'Domain Items': '' });
	for (const q of SD3_SORTED) {
		keySheet.push({
'Test': 'SD3',
'Form Position': q.formOrder,
'Academic Item#': q.isAttentionCheck ? 'ATTN' : q.itemNumber,
'Domain': q.isAttentionCheck ? 'Attention Check' : q.domain,
'Reversed?': q.isReversed ? 'YES (6 − raw)' : 'No',
'Question Text (EN)': q.text,
'Question Text (VI)': q.textVi,
'Domain Items': q.isAttentionCheck ? '' : getDomainItemsSummary('SD3', q.domain),
});
	}

	// ═══════════════════════════════════════════════════════════════════
	// SHEET 4: Summary Statistics
	// ═══════════════════════════════════════════════════════════════════
	const validRows = rows.filter(r => r.is_valid === true);
	const { avg, sd } = computeStats(validRows);

	const summarySheet: Record<string, unknown>[] = [
		{ 'Thống kê': '═══ TỔNG QUAN ═══', 'Giá trị': '', 'Ghi chú': '' },
		{ 'Thống kê': 'Tổng số bài làm',    'Giá trị': rows.length,      'Ghi chú': '' },
		{ 'Thống kê': 'Bài hợp lệ',         'Giá trị': validRows.length, 'Ghi chú': 'Passed both attention checks' },
		{ 'Thống kê': 'Bài không hợp lệ',   'Giá trị': rows.length - validRows.length, 'Ghi chú': 'Failed attention check or incomplete' },
		{ 'Thống kê': '', 'Giá trị': '', 'Ghi chú': '' },

		{ 'Thống kê': '═══ BFI-2-S — OCEAN (scale 1–5) ═══', 'Giá trị': 'Mean', 'Ghi chú': 'SD (valid sessions only)' },
		{ 'Thống kê': 'E — Extraversion',          'Giá trị': avg('extraversion'),           'Ghi chú': sd('extraversion')           ?? 'N/A' },
		{ 'Thống kê': 'A — Agreeableness',         'Giá trị': avg('agreeableness'),          'Ghi chú': sd('agreeableness')          ?? 'N/A' },
		{ 'Thống kê': 'C — Conscientiousness',     'Giá trị': avg('conscientiousness'),      'Ghi chú': sd('conscientiousness')      ?? 'N/A' },
		{ 'Thống kê': 'N — Negative Emotionality', 'Giá trị': avg('negative_emotionality'),  'Ghi chú': sd('negative_emotionality')  ?? 'N/A' },
		{ 'Thống kê': 'O — Open-Mindedness',       'Giá trị': avg('open_mindedness'),        'Ghi chú': sd('open_mindedness')        ?? 'N/A' },
		{ 'Thống kê': '', 'Giá trị': '', 'Ghi chú': '' },

		{ 'Thống kê': '═══ SD3 — Dark Triad (scale 1–5) ═══', 'Giá trị': 'Mean', 'Ghi chú': 'SD (valid sessions only)' },
		{ 'Thống kê': 'M — Machiavellianism',      'Giá trị': avg('machiavellianism'),       'Ghi chú': sd('machiavellianism')       ?? 'N/A' },
		{ 'Thống kê': 'Narc — Narcissism',         'Giá trị': avg('narcissism'),             'Ghi chú': sd('narcissism')             ?? 'N/A' },
		{ 'Thống kê': 'P — Psychopathy',           'Giá trị': avg('psychopathy'),            'Ghi chú': sd('psychopathy')            ?? 'N/A' },
		{ 'Thống kê': '', 'Giá trị': '', 'Ghi chú': '' },

		{ 'Thống kê': '═══ SO SÁNH NORMATIVE (Nhóm tham chiếu) ═══', 'Giá trị': '', 'Ghi chú': '' },
		...(() => {
			const defaults = getDefaultReferenceGroupIds();
			const oceanGroup = REFERENCE_GROUPS.find(g => g.id === defaults.ocean);
			const darkGroup = REFERENCE_GROUPS.find(g => g.id === defaults.darkTriad);
			const rows: Record<string, unknown>[] = [];

			if (oceanGroup) {
				rows.push({ 'Thống kê': `BFI-2 nhóm tham chiếu`, 'Giá trị': oceanGroup.label, 'Ghi chú': oceanGroup.source });
				for (const [domain, label] of [
					['extraversion', 'E — Extraversion'],
					['agreeableness', 'A — Agreeableness'],
					['conscientiousness', 'C — Conscientiousness'],
					['negativeEmotionality', 'N — Negative Emotionality'],
					['openMindedness', 'O — Open-Mindedness'],
				] as const) {
					const n = oceanGroup.norms[domain];
					if (n) {
						rows.push({
							'Thống kê': `  ${label} (norm)`,
							'Giá trị': `M=${n.mean.toFixed(4)}, SD=${n.sd.toFixed(4)}`,
							'Ghi chú': `N=${n.n}`,
						});
					}
				}
			}

			rows.push({ 'Thống kê': '', 'Giá trị': '', 'Ghi chú': '' });

			if (darkGroup) {
				rows.push({ 'Thống kê': `SD3 nhóm tham chiếu`, 'Giá trị': darkGroup.label, 'Ghi chú': darkGroup.source });
				for (const [domain, label] of [
					['machiavellianism', 'M — Machiavellianism'],
					['narcissism', 'Narc — Narcissism'],
					['psychopathy', 'P — Psychopathy'],
				] as const) {
					const n = darkGroup.norms[domain];
					if (n) {
						rows.push({
							'Thống kê': `  ${label} (norm)`,
							'Giá trị': `M=${n.mean.toFixed(4)}, SD=${n.sd.toFixed(4)}`,
							'Ghi chú': `N=${n.n}`,
						});
					}
				}
			}

			rows.push({ 'Thống kê': '', 'Giá trị': '', 'Ghi chú': '' });
			rows.push({
				'Thống kê': 'Phương pháp percentile',
				'Giá trị': 'Z-score → Φ(z) → Percentile',
				'Ghi chú': 'Φ = Standard Normal CDF (Abramowitz & Stegun approx.)',
			});
			rows.push({
				'Thống kê': 'Giải thích mức (5-tier)',
				'Giá trị': 'z≥1.5 Rất cao | z≥0.5 Cao | z≥-0.5 Trung bình | z≥-1.5 Thấp | z<-1.5 Rất thấp',
				'Ghi chú': 'Dựa trên z-score, không phải percentile trực tiếp',
			});

			return rows;
		})(),
		{ 'Thống kê': '', 'Giá trị': '', 'Ghi chú': '' },

		{ 'Thống kê': '═══ SCORING FORMULAS ═══', 'Giá trị': '', 'Ghi chú': '' },
		{ 'Thống kê': 'Likert scale',        'Giá trị': '1–5', 'Ghi chú': '1=Strongly Disagree … 5=Strongly Agree' },
		{ 'Thống kê': 'Reverse scoring',     'Giá trị': 'scored = 6 − raw', 'Ghi chú': 'Applied to items marked R in Scoring Key sheet' },
		{ 'Thống kê': 'Domain score',        'Giá trị': 'AVERAGE(scored items)', 'Ghi chú': '6 items per BFI-2-S domain, 9 per SD3 domain' },
		{ 'Thống kê': '', 'Giá trị': '', 'Ghi chú': '' },

		{ 'Thống kê': '═══ BFI-2-S COMPOSITION ═══', 'Giá trị': '', 'Ghi chú': 'Academic item numbers' },
		{ 'Thống kê': 'E Extraversion',         'Giá trị': getDomainItemsSummary('BFI2S', 'extraversion'),         'Ghi chú': '' },
		{ 'Thống kê': 'A Agreeableness',        'Giá trị': getDomainItemsSummary('BFI2S', 'agreeableness'),        'Ghi chú': '' },
		{ 'Thống kê': 'C Conscientiousness',    'Giá trị': getDomainItemsSummary('BFI2S', 'conscientiousness'),    'Ghi chú': '' },
		{ 'Thống kê': 'N NegativeEmotionality', 'Giá trị': getDomainItemsSummary('BFI2S', 'negativeEmotionality'), 'Ghi chú': '' },
		{ 'Thống kê': 'O Open-Mindedness',      'Giá trị': getDomainItemsSummary('BFI2S', 'openMindedness'),       'Ghi chú': '' },
		{ 'Thống kê': '', 'Giá trị': '', 'Ghi chú': '' },

		{ 'Thống kê': '═══ SD3 COMPOSITION ═══', 'Giá trị': '', 'Ghi chú': 'Academic item numbers' },
		{ 'Thống kê': 'M Machiavellianism', 'Giá trị': getDomainItemsSummary('SD3', 'machiavellianism'), 'Ghi chú': 'All 9 non-reversed' },
		{ 'Thống kê': 'N Narcissism',       'Giá trị': getDomainItemsSummary('SD3', 'narcissism'),       'Ghi chú': 'N11R, N15R reversed' },
		{ 'Thống kê': 'P Psychopathy',      'Giá trị': getDomainItemsSummary('SD3', 'psychopathy'),      'Ghi chú': 'P20R, P25R reversed' },
	];

	// ─── Build workbook ──────────────────────────────────────────────────────
	const wb = XLSX.utils.book_new();

	const ws1 = XLSX.utils.json_to_sheet(rawSheet);
	autoFitColumns(ws1, rawSheet);
	XLSX.utils.book_append_sheet(wb, ws1, '1. Raw Responses');

	const ws2 = XLSX.utils.json_to_sheet(scoredSheet);
	autoFitColumns(ws2, scoredSheet);
	XLSX.utils.book_append_sheet(wb, ws2, '2. Scored Data');

	const ws3 = XLSX.utils.json_to_sheet(keySheet);
	ws3['!cols'] = [{ wch: 8 }, { wch: 14 }, { wch: 16 }, { wch: 24 }, { wch: 16 }, { wch: 65 }, { wch: 60 }, { wch: 35 }];
	XLSX.utils.book_append_sheet(wb, ws3, '3. Scoring Key');

	const ws4 = XLSX.utils.json_to_sheet(summarySheet);
	ws4['!cols'] = [{ wch: 42 }, { wch: 50 }, { wch: 55 }];
	XLSX.utils.book_append_sheet(wb, ws4, '4. Tóm tắt');

	// xlsx write returns a Buffer; convert to ArrayBuffer for the standard Response body
	const rawBuf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
	const arrayBuffer: ArrayBuffer = rawBuf.buffer.slice(
		rawBuf.byteOffset,
		rawBuf.byteOffset + rawBuf.byteLength
	) as ArrayBuffer;
	const dateStr = new Date().toISOString().split('T')[0];

	return new NextResponse(arrayBuffer as unknown as BodyInit, {
status: 200,
headers: {
'Content-Type':        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
'Content-Disposition': `attachment; filename="personality-report-${dateStr}.xlsx"`,
'Cache-Control':       'no-store',
},
});
}

export const GET = withAdmin(handleGet);
