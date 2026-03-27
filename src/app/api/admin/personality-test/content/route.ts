/* ════════════════════════════════════════════════════════════════════════
   GET  /api/admin/personality-test/content
     → Downloads all insight content as an Excel workbook.
       One sheet per domain, each row = one field × 2 columns (EN | VI).

   POST /api/admin/personality-test/content
     → Accepts an Excel upload (multipart/form-data, field name "file").
       Reads the same workbook format and writes updated content back to
       the individual insight TS files on disk.
       Returns a JSON manifest of every field that was changed.

   Security: admin-only (withAdmin wrapper).
   ════════════════════════════════════════════════════════════════════════ */

import path from 'path';
import fs from 'fs';
import { type NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

import { withAdmin, apiError } from '@/lib/apiUtils';
import { getTraitInsight } from '@/components/personality-test/insights';
import type { TraitInsightContent } from '@/components/personality-test/insights';

// ─── Domain metadata ───────────────────────────────────────────────────────────

const DOMAINS = [
	{ key: 'extraversion',          label: 'Extraversion',           file: 'extraversion' },
	{ key: 'agreeableness',         label: 'Agreeableness',          file: 'agreeableness' },
	{ key: 'conscientiousness',     label: 'Conscientiousness',      file: 'conscientiousness' },
	{ key: 'negativeEmotionality',  label: 'Negative Emotionality',  file: 'negativeEmotionality' },
	{ key: 'openMindedness',        label: 'Open-Mindedness',        file: 'openMindedness' },
	{ key: 'machiavellianism',      label: 'Machiavellianism',       file: 'machiavellianism' },
	{ key: 'narcissism',            label: 'Narcissism',             file: 'narcissism' },
	{ key: 'psychopathy',           label: 'Psychopathy',            file: 'psychopathy' },
] as const;

type DomainKey = typeof DOMAINS[number]['key'];

/** Ordered list of fields in every sheet row */
const FIELDS: { key: keyof TraitInsightContent; label: string; darkOnly?: boolean }[] = [
	{ key: 'icon',       label: 'Icon (emoji)' },
	{ key: 'what',       label: 'What it measures' },
	{ key: 'very_high',  label: 'Very High interpretation' },
	{ key: 'high',       label: 'High interpretation' },
	{ key: 'moderate',   label: 'Moderate interpretation' },
	{ key: 'low',        label: 'Low interpretation' },
	{ key: 'very_low',   label: 'Very Low interpretation' },
	{ key: 'career',     label: 'Career guidance' },
	{ key: 'tip',        label: 'Action tip for student' },
	{ key: 'academic',   label: 'Academic citations' },
	{ key: 'derailment', label: 'Derailment scenario (Dark Triad)', darkOnly: true },
	{ key: 'obLesson',   label: 'OB lesson (Dark Triad)',           darkOnly: true },
];

const DARK_TRIAD_KEYS: DomainKey[] = ['machiavellianism', 'narcissism', 'psychopathy'];

// ─── GET ──────────────────────────────────────────────────────────────────────

export const GET = withAdmin(async () => {
	const wb = XLSX.utils.book_new();

	// Sheet: Index / Legend
	const legendRows = [
		['Personality Test — Result Content Workbook'],
		[''],
		['Purpose', 'Edit the EN and VI columns in each domain sheet, then import this file back.'],
		['Rules', ''],
		['', '• Do NOT rename sheet tabs or column headers.'],
		['', '• Keep the Field column unchanged (it is the stable key).'],
		['', '• You may add line breaks inside a cell — they will be preserved.'],
		['', '• Dark Triad sheets include Derailment and OB Lesson rows; OCEAN sheets do not.'],
		['', '• Leave a cell blank to clear that field (icon and what are required).'],
		[''],
		['Domain', 'Sheet tab', 'Category'],
		...DOMAINS.map(d => [
			d.label,
			d.label,
			DARK_TRIAD_KEYS.includes(d.key) ? 'Dark Triad (SD3)' : 'Big Five (BFI-2-S)',
		]),
	];
	const legendWs = XLSX.utils.aoa_to_sheet(legendRows);
	legendWs['!cols'] = [{ wch: 28 }, { wch: 80 }, { wch: 22 }];
	XLSX.utils.book_append_sheet(wb, legendWs, '📋 Instructions');

	// One sheet per domain
	for (const domain of DOMAINS) {
		const isDark = DARK_TRIAD_KEYS.includes(domain.key);
		const enInsight = getTraitInsight(domain.key, 'en');
		const viInsight = getTraitInsight(domain.key, 'vi');

		const header = ['Field', 'Field Label', 'English (EN)', 'Vietnamese (VI)'];
		const rows: string[][] = [header];

		for (const field of FIELDS) {
			if (field.darkOnly && !isDark) continue;
			const enVal = (enInsight[field.key] ?? '') as string;
			const viVal = (viInsight[field.key] ?? '') as string;
			rows.push([field.key, field.label, enVal.trim(), viVal.trim()]);
		}

		const ws = XLSX.utils.aoa_to_sheet(rows);

		// Column widths
		ws['!cols'] = [{ wch: 18 }, { wch: 34 }, { wch: 68 }, { wch: 68 }];

		// Row heights — taller for long text rows
		ws['!rows'] = rows.map((_, i) => ({ hpt: i === 0 ? 18 : 80 }));

		// Style the header row bold (SheetJS CE doesn't support full styling but
		// we can make cell values obvious)
		XLSX.utils.book_append_sheet(wb, ws, domain.label);
	}

	const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

	const now = new Date().toISOString().slice(0, 10);
	return new NextResponse(buffer, {
		status: 200,
		headers: {
			'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			'Content-Disposition': `attachment; filename="personality-content-${now}.xlsx"`,
		},
	});
});

// ─── POST ─────────────────────────────────────────────────────────────────────

export const POST = withAdmin(async (request: NextRequest) => {
	const contentType = request.headers.get('content-type') ?? '';
	if (!contentType.includes('multipart/form-data')) {
		return apiError('Expected multipart/form-data with a "file" field.', 400);
	}

	const formData = await request.formData();
	const file = formData.get('file');
	if (!(file instanceof File)) {
		return apiError('No file uploaded. Send the Excel file in the "file" field.', 400);
	}

	const arrayBuffer = await file.arrayBuffer();
	const wb = XLSX.read(arrayBuffer, { type: 'array' });

	const insightsDir = path.join(process.cwd(), 'src', 'components', 'personality-test', 'insights');

	const changeLog: Record<string, { field: string; lang: 'en' | 'vi'; old: string; new: string }[]> = {};
	const errors: string[] = [];

	for (const domain of DOMAINS) {
		const sheetName = wb.SheetNames.find(
			s => s.toLowerCase() === domain.label.toLowerCase() || s.toLowerCase() === domain.key.toLowerCase(),
		);
		if (!sheetName) {
			errors.push(`Sheet for "${domain.label}" not found — skipped.`);
			continue;
		}

		const ws = wb.Sheets[sheetName];
		const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: '' });

		// Parse uploaded content
		const uploaded: Partial<Record<keyof TraitInsightContent, { en: string; vi: string }>> = {};
		for (const row of rows) {
			const fieldKey = (row['Field'] ?? '').trim() as keyof TraitInsightContent;
			if (!fieldKey) continue;
			uploaded[fieldKey] = {
				en: (row['English (EN)'] ?? '').trim(),
				vi: (row['Vietnamese (VI)'] ?? '').trim(),
			};
		}

		// Compare with current content
		const currentEN = getTraitInsight(domain.key, 'en');
		const currentVI = getTraitInsight(domain.key, 'vi');
		const changes: typeof changeLog[string] = [];

		for (const field of FIELDS) {
			const up = uploaded[field.key];
			if (!up) continue;
			const curEN = ((currentEN[field.key] ?? '') as string).trim();
			const curVI = ((currentVI[field.key] ?? '') as string).trim();
			if (up.en !== curEN) changes.push({ field: field.key, lang: 'en', old: curEN.slice(0, 120), new: up.en.slice(0, 120) });
			if (up.vi !== curVI) changes.push({ field: field.key, lang: 'vi', old: curVI.slice(0, 120), new: up.vi.slice(0, 120) });
		}

		if (changes.length > 0) {
			changeLog[domain.key] = changes;
			// Write the updated TS file
			try {
				const tsContent = buildTsFile(domain.key, domain.file, uploaded, DARK_TRIAD_KEYS.includes(domain.key));
				const filePath = path.join(insightsDir, `${domain.file}.ts`);
				fs.writeFileSync(filePath, tsContent, 'utf8');
			} catch (err) {
				errors.push(`Failed to write ${domain.file}.ts: ${err instanceof Error ? err.message : String(err)}`);
			}
		}
	}

	return NextResponse.json({
		ok: true,
		data: {
			domainsUpdated: Object.keys(changeLog).length,
			changeLog,
			errors,
			message: Object.keys(changeLog).length === 0
				? 'No changes detected — files are unchanged.'
				: `Updated ${Object.keys(changeLog).length} domain(s). Restart the dev server to see changes, or redeploy in production.`,
		},
	});
});

// ─── TS file builder ──────────────────────────────────────────────────────────

function esc(s: string): string {
	// Escape backticks and ${} in template literal strings
	return s.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
}

function buildTsFile(
	domainKey: string,
	domainFile: string,
	fields: Partial<Record<keyof TraitInsightContent, { en: string; vi: string }>>,
	isDark: boolean,
): string {
	// Derive export names from domainKey
	// e.g. machiavellianism → machiavellianism_EN / machiavellianism_VI  (existing naming)
	//      extraversion      → extraversionEN / extraversionVI
	const isDarkKey = isDark;
	const enName = isDarkKey && domainKey === 'machiavellianism'
		? 'machiavellianism_EN'
		: isDarkKey && domainKey === 'psychopathy'
			? 'psychopathyEN'
			: isDarkKey && domainKey === 'narcissism'
				? 'narcissismEN'
				: `${domainKey}EN`;
	const viName = isDarkKey && domainKey === 'machiavellianism'
		? 'machiavellianism_VI'
		: isDarkKey && domainKey === 'psychopathy'
			? 'psychopathyVI'
			: isDarkKey && domainKey === 'narcissism'
				? 'narcissismVI'
				: `${domainKey}VI`;

	const renderObj = (lang: 'en' | 'vi', exportName: string): string => {
		const lines: string[] = [
			`export const ${exportName}: TraitInsightContent = {`,
		];
		for (const field of FIELDS) {
			if (field.darkOnly && !isDark) continue;
			const val = fields[field.key]?.[lang] ?? '';
			if (!val && field.darkOnly) {
				lines.push(`\t${field.key}: undefined,`);
				continue;
			}
			lines.push(`\t${field.key}: \`${esc(val)}\`,`);
		}
		lines.push('};');
		return lines.join('\n');
	};

	return [
		`import type { TraitInsightContent } from "./_types";`,
		``,
		`/* Auto-generated by /api/admin/personality-test/content import */`,
		`/* Edit via Admin → Personality Content, or directly edit this file.  */`,
		``,
		renderObj('en', enName),
		``,
		renderObj('vi', viName),
		``,
	].join('\n');
}
