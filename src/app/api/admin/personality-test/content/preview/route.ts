/* ════════════════════════════════════════════════════════════════════════
   GET /api/admin/personality-test/content/preview
   
   Returns all insight content as structured JSON for the admin UI.
   Admin-only.
   ════════════════════════════════════════════════════════════════════════ */

import { NextResponse } from 'next/server';
import { withAdmin } from '@/lib/apiUtils';
import { getTraitInsight } from '@/components/personality-test/insights';
import type { TraitInsightContent } from '@/components/personality-test/insights';

const DOMAINS = [
	{ key: 'extraversion' },
	{ key: 'agreeableness' },
	{ key: 'conscientiousness' },
	{ key: 'negativeEmotionality' },
	{ key: 'openMindedness' },
	{ key: 'machiavellianism' },
	{ key: 'narcissism' },
	{ key: 'psychopathy' },
] as const;

const FIELDS: { key: keyof TraitInsightContent; label: string }[] = [
	{ key: 'icon',       label: 'Icon (emoji)' },
	{ key: 'what',       label: 'What it measures' },
	{ key: 'very_high',  label: '🔴 Very High' },
	{ key: 'high',       label: '🟡 High' },
	{ key: 'moderate',   label: '🔵 Moderate' },
	{ key: 'low',        label: '🩶 Low' },
	{ key: 'very_low',   label: '⬜ Very Low' },
	{ key: 'career',     label: '💼 Career guidance' },
	{ key: 'tip',        label: '💡 Action tip' },
	{ key: 'academic',   label: '📚 Academic citations' },
	{ key: 'derailment', label: '⚠️ Derailment scenario' },
	{ key: 'obLesson',   label: '🏢 OB Lesson' },
];

export const GET = withAdmin(async () => {
	const data: Record<string, { field: string; fieldLabel: string; en: string; vi: string }[]> = {};

	for (const domain of DOMAINS) {
		const en = getTraitInsight(domain.key, 'en');
		const vi = getTraitInsight(domain.key, 'vi');

		data[domain.key] = FIELDS.map(f => ({
			field: f.key,
			fieldLabel: f.label,
			en: ((en[f.key] ?? '') as string).trim(),
			vi: ((vi[f.key] ?? '') as string).trim(),
		}));
	}

	return NextResponse.json({ ok: true, data });
});
