'use client';

/* ════════════════════════════════════════════════════════════════════════
   Admin — Personality Test Scoring Verification Dashboard

   Comprehensive inspection tool for the professor to double-check:
   1. Every BFI-2-S item: formOrder, itemNumber, domain, reversed, text
   2. Every SD3 item: same structure
   3. Domain composition summary with reversed-item counts
   4. Live sample scoring calculator (enter raw values → see scored output)
   5. Official scoring key cross-reference

   This page imports the actual question arrays used in production scoring,
   ensuring what the admin sees IS what the scoring engine uses.
   ════════════════════════════════════════════════════════════════════════ */

import { useState, useMemo } from 'react';
import {
	BFI2S_QUESTIONS,
	SD3_QUESTIONS,
	getEffectiveScore,
	scorePersonalityTest,
} from '@/lib/personalityScoring';
import type { RawResponse } from '@/types/personalityTest';

// ─── Domain display helpers ──────────────────────────────────────────────────

const DOMAIN_LABELS: Record<string, { short: string; label: string; color: string }> = {
	extraversion:         { short: 'E', label: 'Extraversion',          color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' },
	agreeableness:        { short: 'A', label: 'Agreeableness',         color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
	conscientiousness:    { short: 'C', label: 'Conscientiousness',     color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
	negativeEmotionality: { short: 'N', label: 'Negative Emotionality', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
	openMindedness:       { short: 'O', label: 'Open-Mindedness',       color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' },
	machiavellianism:     { short: 'M', label: 'Machiavellianism',      color: 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300' },
	narcissism:           { short: 'N', label: 'Narcissism',            color: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300' },
	psychopathy:          { short: 'P', label: 'Psychopathy',           color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' },
};

// ─── Section Component ───────────────────────────────────────────────────────

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
	return (
		<section className="mb-10">
			<h2 className="text-xl font-bold text-foreground mb-1">{title}</h2>
			{subtitle && <p className="text-sm text-muted-foreground mb-4">{subtitle}</p>}
			{children}
		</section>
	);
}

// ─── BFI & SD3 Item Tables ──────────────────────────────────────────────────

function ItemTable({ questions, testLabel }: { questions: typeof BFI2S_QUESTIONS; testLabel: string }) {
	const sorted = useMemo(() => [...questions].sort((a, b) => a.formOrder - b.formOrder), [questions]);

	return (
		<div className="overflow-x-auto rounded-lg border border-border">
			<table className="w-full text-sm">
				<thead>
					<tr className="bg-muted/50 border-b border-border">
						<th className="px-3 py-2 text-left font-semibold w-16">Form #</th>
						<th className="px-3 py-2 text-left font-semibold w-20">Item #</th>
						<th className="px-3 py-2 text-left font-semibold w-28">Domain</th>
						<th className="px-3 py-2 text-center font-semibold w-12">R?</th>
						<th className="px-3 py-2 text-center font-semibold w-16">Attn?</th>
						<th className="px-3 py-2 text-left font-semibold">Text (EN)</th>
						<th className="px-3 py-2 text-left font-semibold">Text (VI)</th>
					</tr>
				</thead>
				<tbody>
					{sorted.map((q, i) => {
						const dl = DOMAIN_LABELS[q.domain];
						const isAttn = q.isAttentionCheck;
						return (
							<tr
								key={`${testLabel}-${q.formOrder}`}
								className={`border-b border-border/50 ${isAttn ? 'bg-yellow-50 dark:bg-yellow-900/20' : i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}
							>
								<td className="px-3 py-2 font-mono font-bold">{q.formOrder}</td>
								<td className="px-3 py-2 font-mono">
									{isAttn ? (
										<span className="text-yellow-600 dark:text-yellow-400 font-bold">ATTN ({q.itemNumber})</span>
									) : (
										<span>{q.itemNumber}{q.isReversed ? 'R' : ''}</span>
									)}
								</td>
								<td className="px-3 py-2">
									<span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${dl?.color ?? ''}`}>
										{dl?.short ?? '?'} — {dl?.label ?? q.domain}
									</span>
								</td>
								<td className="px-3 py-2 text-center">
									{q.isReversed ? (
										<span className="text-red-600 dark:text-red-400 font-bold">R</span>
									) : (
										<span className="text-muted-foreground">—</span>
									)}
								</td>
								<td className="px-3 py-2 text-center">
									{isAttn ? (
										<span className="text-yellow-600 dark:text-yellow-400 font-bold">✓ (exp={q.attentionCheckExpected})</span>
									) : ''}
								</td>
								<td className="px-3 py-2 text-foreground">{q.text}</td>
								<td className="px-3 py-2 text-muted-foreground">{q.textVi}</td>
							</tr>
						);
					})}
				</tbody>
			</table>
		</div>
	);
}

// ─── Domain Composition Summary ─────────────────────────────────────────────

function DomainSummary({ questions, testLabel }: { questions: typeof BFI2S_QUESTIONS; testLabel: string }) {
	const summary = useMemo(() => {
		const scored = questions.filter(q => !q.isAttentionCheck);
		const domains = [...new Set(scored.map(q => q.domain))];
		return domains.map(domain => {
			const items = scored.filter(q => q.domain === domain);
			const reversed = items.filter(q => q.isReversed);
			const nonReversed = items.filter(q => !q.isReversed);
			return {
				domain,
				dl: DOMAIN_LABELS[domain],
				total: items.length,
				reversed: reversed.map(q => q.itemNumber),
				nonReversed: nonReversed.map(q => q.itemNumber),
				formOrders: items.map(q => q.formOrder).sort((a, b) => a - b),
			};
		});
	}, [questions]);

	return (
		<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
			{summary.map(s => (
				<div key={s.domain} className={`rounded-lg border border-border p-4`}>
					<div className="flex items-center gap-2 mb-3">
						<span className={`inline-flex items-center px-2.5 py-1 rounded text-sm font-bold ${s.dl?.color ?? ''}`}>
							{s.dl?.short ?? '?'}
						</span>
						<span className="font-semibold text-foreground">{s.dl?.label ?? s.domain}</span>
						<span className="text-xs text-muted-foreground ml-auto">({s.total} items)</span>
					</div>
					<div className="space-y-1.5 text-sm">
						<div>
							<span className="text-muted-foreground">Reversed ({s.reversed.length}): </span>
							<span className="font-mono text-red-600 dark:text-red-400">
								{s.reversed.length > 0 ? s.reversed.sort((a, b) => a - b).join(', ') : 'None'}
							</span>
						</div>
						<div>
							<span className="text-muted-foreground">Non-reversed ({s.nonReversed.length}): </span>
							<span className="font-mono text-green-600 dark:text-green-400">
								{s.nonReversed.sort((a, b) => a - b).join(', ')}
							</span>
						</div>
						<div>
							<span className="text-muted-foreground">Form positions: </span>
							<span className="font-mono text-foreground">{s.formOrders.join(', ')}</span>
						</div>
						<div className="text-xs mt-2 pt-2 border-t border-border/50">
							<span className="text-muted-foreground">Formula: </span>
							<span className="font-mono text-foreground">
								( {s.nonReversed.sort((a, b) => a - b).map(n => `item${n}`).join(' + ')}
								{s.reversed.length > 0 && ` + ${s.reversed.sort((a, b) => a - b).map(n => `(6−item${n})`).join(' + ')}`}
								{' '}) / {s.total}
							</span>
						</div>
					</div>
				</div>
			))}
		</div>
	);
}

// ─── Scoring Key Cross-Reference ────────────────────────────────────────────

function OfficialScoringKey() {
	const bfiKey = [
		{ domain: 'E', label: 'Extraversion',          items: '1R, 6, 11, 16, 21R, 26R', reversed: 3, total: 6 },
		{ domain: 'A', label: 'Agreeableness',         items: '2, 7R, 12, 17R, 22, 27R', reversed: 3, total: 6 },
		{ domain: 'C', label: 'Conscientiousness',     items: '3R, 8R, 13, 18, 23, 28R', reversed: 3, total: 6 },
		{ domain: 'N', label: 'Negative Emotionality', items: '4, 9, 14R, 19R, 24R, 29', reversed: 3, total: 6 },
		{ domain: 'O', label: 'Open-Mindedness',       items: '5, 10R, 15, 20R, 25, 30R', reversed: 3, total: 6 },
	];

	const sd3Key = [
		{ domain: 'M', label: 'Machiavellianism', items: '1, 2, 3, 4, 5, 6, 7, 8, 9',        reversed: 0, total: 9 },
		{ domain: 'N', label: 'Narcissism',        items: '10, 11R, 12, 13, 14, 15R, 16, 17R, 18', reversed: 3, total: 9 },
		{ domain: 'P', label: 'Psychopathy',       items: '19, 20R, 21, 22, 23, 24, 25R, 26, 27',  reversed: 2, total: 9 },
	];

	return (
		<div className="space-y-6">
			<div>
				<h3 className="font-semibold text-foreground mb-2">BFI-2-S — Soto & John (2017)</h3>
				<div className="overflow-x-auto rounded-lg border border-border">
					<table className="w-full text-sm">
						<thead>
							<tr className="bg-muted/50 border-b border-border">
								<th className="px-3 py-2 text-left w-12">Domain</th>
								<th className="px-3 py-2 text-left">Label</th>
								<th className="px-3 py-2 text-left">Items (R = reversed)</th>
								<th className="px-3 py-2 text-center w-20"># Rev</th>
								<th className="px-3 py-2 text-center w-20">Total</th>
							</tr>
						</thead>
						<tbody>
							{bfiKey.map(r => (
								<tr key={r.domain} className="border-b border-border/50">
									<td className="px-3 py-2 font-bold">{r.domain}</td>
									<td className="px-3 py-2">{r.label}</td>
									<td className="px-3 py-2 font-mono">{r.items}</td>
									<td className="px-3 py-2 text-center text-red-600 dark:text-red-400 font-bold">{r.reversed}</td>
									<td className="px-3 py-2 text-center font-bold">{r.total}</td>
								</tr>
							))}
						</tbody>
						<tfoot>
							<tr className="bg-muted/30 font-bold">
								<td className="px-3 py-2" colSpan={3}>Total</td>
								<td className="px-3 py-2 text-center text-red-600 dark:text-red-400">15</td>
								<td className="px-3 py-2 text-center">30</td>
							</tr>
						</tfoot>
					</table>
				</div>
			</div>

			<div>
				<h3 className="font-semibold text-foreground mb-2">SD3 — Jones & Paulhus (2014)</h3>
				<div className="overflow-x-auto rounded-lg border border-border">
					<table className="w-full text-sm">
						<thead>
							<tr className="bg-muted/50 border-b border-border">
								<th className="px-3 py-2 text-left w-12">Domain</th>
								<th className="px-3 py-2 text-left">Label</th>
								<th className="px-3 py-2 text-left">Items (R = reversed)</th>
								<th className="px-3 py-2 text-center w-20"># Rev</th>
								<th className="px-3 py-2 text-center w-20">Total</th>
							</tr>
						</thead>
						<tbody>
							{sd3Key.map(r => (
								<tr key={r.domain} className="border-b border-border/50">
									<td className="px-3 py-2 font-bold">{r.domain}</td>
									<td className="px-3 py-2">{r.label}</td>
									<td className="px-3 py-2 font-mono">{r.items}</td>
									<td className="px-3 py-2 text-center text-red-600 dark:text-red-400 font-bold">{r.reversed}</td>
									<td className="px-3 py-2 text-center font-bold">{r.total}</td>
								</tr>
							))}
						</tbody>
						<tfoot>
							<tr className="bg-muted/30 font-bold">
								<td className="px-3 py-2" colSpan={3}>Total</td>
								<td className="px-3 py-2 text-center text-red-600 dark:text-red-400">5</td>
								<td className="px-3 py-2 text-center">27</td>
							</tr>
						</tfoot>
					</table>
				</div>
			</div>
		</div>
	);
}

// ─── Live Scoring Calculator ────────────────────────────────────────────────

function ScoringCalculator() {
	// Default: all 3s with correct attention checks
	const [bfiValues, setBfiValues] = useState<Record<number, number>>(() => {
		const init: Record<number, number> = {};
		for (const q of BFI2S_QUESTIONS) {
			init[q.formOrder] = q.isAttentionCheck ? q.attentionCheckExpected! : 3;
		}
		return init;
	});
	const [sd3Values, setSd3Values] = useState<Record<number, number>>(() => {
		const init: Record<number, number> = {};
		for (const q of SD3_QUESTIONS) {
			init[q.formOrder] = q.isAttentionCheck ? q.attentionCheckExpected! : 3;
		}
		return init;
	});

	const [showSteps, setShowSteps] = useState(false);

	// Build responses from current values
	const responses: RawResponse[] = useMemo(() => {
		const r: RawResponse[] = [];
		for (const q of BFI2S_QUESTIONS) {
			r.push({ testType: 'BFI2S', itemNumber: q.itemNumber, value: bfiValues[q.formOrder] ?? 3 });
		}
		for (const q of SD3_QUESTIONS) {
			r.push({ testType: 'SD3', itemNumber: q.itemNumber, value: sd3Values[q.formOrder] ?? 3 });
		}
		return r;
	}, [bfiValues, sd3Values]);

	const result = useMemo(() => scorePersonalityTest(responses), [responses]);

	// Step-by-step scoring details
	const bfiSteps = useMemo(() => {
		const domains = ['extraversion', 'agreeableness', 'conscientiousness', 'negativeEmotionality', 'openMindedness'] as const;
		return domains.map(domain => {
			const items = BFI2S_QUESTIONS.filter(q => q.domain === domain && !q.isAttentionCheck)
				.sort((a, b) => a.itemNumber - b.itemNumber);
			const details = items.map(q => {
				const raw = bfiValues[q.formOrder] ?? 3;
				const effective = getEffectiveScore(raw, q.isReversed);
				return { itemNumber: q.itemNumber, formOrder: q.formOrder, raw, effective, isReversed: q.isReversed };
			});
			const sum = details.reduce((s, d) => s + d.effective, 0);
			const avg = sum / details.length;
			return { domain, items: details, sum, avg, count: details.length };
		});
	}, [bfiValues]);

	const sd3Steps = useMemo(() => {
		const domains = ['machiavellianism', 'narcissism', 'psychopathy'] as const;
		return domains.map(domain => {
			const items = SD3_QUESTIONS.filter(q => q.domain === domain && !q.isAttentionCheck)
				.sort((a, b) => a.itemNumber - b.itemNumber);
			const details = items.map(q => {
				const raw = sd3Values[q.formOrder] ?? 3;
				const effective = getEffectiveScore(raw, q.isReversed);
				return { itemNumber: q.itemNumber, formOrder: q.formOrder, raw, effective, isReversed: q.isReversed };
			});
			const sum = details.reduce((s, d) => s + d.effective, 0);
			const avg = sum / details.length;
			return { domain, items: details, sum, avg, count: details.length };
		});
	}, [sd3Values]);

	const handlePreset = (preset: 'all1' | 'all3' | 'all5' | 'mixed') => {
		const bfi: Record<number, number> = {};
		const sd3: Record<number, number> = {};
		for (const q of BFI2S_QUESTIONS) {
			if (q.isAttentionCheck) { bfi[q.formOrder] = q.attentionCheckExpected!; continue; }
			switch (preset) {
				case 'all1': bfi[q.formOrder] = 1; break;
				case 'all3': bfi[q.formOrder] = 3; break;
				case 'all5': bfi[q.formOrder] = 5; break;
				case 'mixed': bfi[q.formOrder] = q.isReversed ? 1 : 5; break; // Max score
			}
		}
		for (const q of SD3_QUESTIONS) {
			if (q.isAttentionCheck) { sd3[q.formOrder] = q.attentionCheckExpected!; continue; }
			switch (preset) {
				case 'all1': sd3[q.formOrder] = 1; break;
				case 'all3': sd3[q.formOrder] = 3; break;
				case 'all5': sd3[q.formOrder] = 5; break;
				case 'mixed': sd3[q.formOrder] = q.isReversed ? 1 : 5; break;
			}
		}
		setBfiValues(bfi);
		setSd3Values(sd3);
	};

	return (
		<div className="space-y-6">
			{/* Preset buttons */}
			<div className="flex flex-wrap gap-2">
				<span className="text-sm text-muted-foreground self-center">Presets:</span>
				<button onClick={() => handlePreset('all1')} className="px-3 py-1.5 text-sm rounded-md border border-border bg-background hover:bg-muted transition-colors">All 1s</button>
				<button onClick={() => handlePreset('all3')} className="px-3 py-1.5 text-sm rounded-md border border-border bg-background hover:bg-muted transition-colors">All 3s</button>
				<button onClick={() => handlePreset('all5')} className="px-3 py-1.5 text-sm rounded-md border border-border bg-background hover:bg-muted transition-colors">All 5s</button>
				<button onClick={() => handlePreset('mixed')} className="px-3 py-1.5 text-sm rounded-md border border-border bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 transition-colors">Max scores (R=1, non-R=5)</button>
			</div>

			{/* BFI Input Grid */}
			<div>
				<h3 className="font-semibold text-foreground mb-2">BFI-2-S Responses (fo1–fo31)</h3>
				<div className="grid grid-cols-8 gap-1.5 text-xs">
					{[...BFI2S_QUESTIONS].sort((a, b) => a.formOrder - b.formOrder).map(q => {
						const dl = DOMAIN_LABELS[q.domain];
						return (
							<div key={`bfi-${q.formOrder}`} className={`rounded border p-1.5 ${q.isAttentionCheck ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700' : 'border-border'}`}>
								<div className="flex items-center justify-between mb-1">
									<span className="font-mono font-bold">fo{q.formOrder}</span>
									<span className={`px-1 rounded text-[10px] font-bold ${dl?.color ?? ''}`}>
										{q.isAttentionCheck ? 'ATT' : `${dl?.short}${q.isReversed ? 'R' : ''}`}
									</span>
								</div>
								{q.isAttentionCheck ? (
									<div className="text-center text-yellow-600 dark:text-yellow-400 font-bold text-xs">
										Fixed: {q.attentionCheckExpected}
									</div>
								) : (
									<select
										value={bfiValues[q.formOrder] ?? 3}
										onChange={e => setBfiValues(prev => ({ ...prev, [q.formOrder]: Number(e.target.value) }))}
										className="w-full text-center rounded border border-border bg-background text-xs py-0.5"
									>
										{[1,2,3,4,5].map(v => <option key={v} value={v}>{v}</option>)}
									</select>
								)}
							</div>
						);
					})}
				</div>
			</div>

			{/* SD3 Input Grid */}
			<div>
				<h3 className="font-semibold text-foreground mb-2">SD3 Responses (fo1–fo28)</h3>
				<div className="grid grid-cols-7 gap-1.5 text-xs">
					{[...SD3_QUESTIONS].sort((a, b) => a.formOrder - b.formOrder).map(q => {
						const dl = DOMAIN_LABELS[q.domain];
						return (
							<div key={`sd3-${q.formOrder}`} className={`rounded border p-1.5 ${q.isAttentionCheck ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700' : 'border-border'}`}>
								<div className="flex items-center justify-between mb-1">
									<span className="font-mono font-bold">fo{q.formOrder}</span>
									<span className={`px-1 rounded text-[10px] font-bold ${dl?.color ?? ''}`}>
										{q.isAttentionCheck ? 'ATT' : `${dl?.short}${q.isReversed ? 'R' : ''}`}
									</span>
								</div>
								{q.isAttentionCheck ? (
									<div className="text-center text-yellow-600 dark:text-yellow-400 font-bold text-xs">
										Fixed: {q.attentionCheckExpected}
									</div>
								) : (
									<select
										value={sd3Values[q.formOrder] ?? 3}
										onChange={e => setSd3Values(prev => ({ ...prev, [q.formOrder]: Number(e.target.value) }))}
										className="w-full text-center rounded border border-border bg-background text-xs py-0.5"
									>
										{[1,2,3,4,5].map(v => <option key={v} value={v}>{v}</option>)}
									</select>
								)}
							</div>
						);
					})}
				</div>
			</div>

			{/* Results */}
			<div className="rounded-lg border-2 border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-900/20 p-4">
				<h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
					📊 Scoring Result
					<span className={`text-xs px-2 py-0.5 rounded ${result.isValid ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'}`}>
						{result.isValid ? '✅ Valid' : `❌ Invalid: ${result.invalidReason}`}
					</span>
				</h3>

				{result.ocean && (
					<div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
						{(['extraversion', 'agreeableness', 'conscientiousness', 'negativeEmotionality', 'openMindedness'] as const).map(d => {
							const dl = DOMAIN_LABELS[d];
							const trait = result.ocean![d];
							return (
								<div key={d} className="rounded-md border border-border bg-background p-3">
									<div className="flex items-center gap-1.5 mb-1">
										<span className={`px-1.5 py-0.5 rounded text-xs font-bold ${dl.color}`}>{dl.short}</span>
										<span className="text-sm font-semibold">{dl.label}</span>
									</div>
									<div className="text-2xl font-bold text-foreground">{trait.score.toFixed(2)}</div>
									<div className={`text-xs font-medium ${trait.level === 'high' ? 'text-green-600' : trait.level === 'low' ? 'text-red-600' : 'text-amber-600'}`}>
										{trait.level.toUpperCase()}
									</div>
								</div>
							);
						})}
					</div>
				)}

				{result.darkTriad && (
					<div className="grid grid-cols-3 gap-3 mb-4">
						{(['machiavellianism', 'narcissism', 'psychopathy'] as const).map(d => {
							const dl = DOMAIN_LABELS[d];
							const trait = result.darkTriad![d];
							return (
								<div key={d} className="rounded-md border border-border bg-background p-3">
									<div className="flex items-center gap-1.5 mb-1">
										<span className={`px-1.5 py-0.5 rounded text-xs font-bold ${dl.color}`}>{dl.short}</span>
										<span className="text-sm font-semibold">{dl.label}</span>
									</div>
									<div className="text-2xl font-bold text-foreground">{trait.score.toFixed(2)}</div>
									<div className={`text-xs font-medium ${trait.level === 'high' ? 'text-red-600' : trait.level === 'low' ? 'text-green-600' : 'text-amber-600'}`}>
										{trait.level.toUpperCase()}
									</div>
								</div>
							);
						})}
					</div>
				)}

				{result.archetype && (
					<div className="rounded-md border border-border bg-background p-3">
						<span className="text-lg mr-2">{result.archetype.icon}</span>
						<span className="font-bold text-foreground">{result.archetype.name}</span>
						<span className="text-muted-foreground ml-2 text-sm">— {result.archetype.tagline}</span>
					</div>
				)}
			</div>

			{/* Step-by-step toggle */}
			<button
				onClick={() => setShowSteps(v => !v)}
				className="px-4 py-2 text-sm font-medium rounded-md border border-border bg-background hover:bg-muted transition-colors"
			>
				{showSteps ? '🔽 Hide' : '▶️ Show'} Step-by-Step Scoring Details
			</button>

			{showSteps && (
				<div className="space-y-4">
					<h3 className="font-bold text-foreground">🔍 Step-by-Step: BFI-2-S Scoring</h3>
					{bfiSteps.map(step => {
						const dl = DOMAIN_LABELS[step.domain];
						return (
							<div key={step.domain} className="rounded-lg border border-border p-3">
								<div className="flex items-center gap-2 mb-2">
									<span className={`px-2 py-0.5 rounded text-xs font-bold ${dl?.color ?? ''}`}>{dl?.short}</span>
									<span className="font-semibold">{dl?.label}</span>
									<span className="ml-auto font-mono text-lg font-bold">{step.avg.toFixed(2)}</span>
								</div>
								<div className="overflow-x-auto">
									<table className="w-full text-xs">
										<thead>
											<tr className="border-b border-border/50">
												<th className="px-2 py-1 text-left">Item#</th>
												<th className="px-2 py-1 text-left">fo#</th>
												<th className="px-2 py-1 text-center">Reversed?</th>
												<th className="px-2 py-1 text-center">Raw</th>
												<th className="px-2 py-1 text-center">Formula</th>
												<th className="px-2 py-1 text-center">Effective</th>
											</tr>
										</thead>
										<tbody>
											{step.items.map(item => (
												<tr key={item.itemNumber} className="border-b border-border/30">
													<td className="px-2 py-1 font-mono">{item.itemNumber}{item.isReversed ? 'R' : ''}</td>
													<td className="px-2 py-1 font-mono text-muted-foreground">fo{item.formOrder}</td>
													<td className="px-2 py-1 text-center">{item.isReversed ? <span className="text-red-600 font-bold">Yes</span> : '—'}</td>
													<td className="px-2 py-1 text-center font-mono">{item.raw}</td>
													<td className="px-2 py-1 text-center font-mono text-muted-foreground">
														{item.isReversed ? `6 − ${item.raw}` : `${item.raw}`}
													</td>
													<td className="px-2 py-1 text-center font-mono font-bold">{item.effective}</td>
												</tr>
											))}
											<tr className="bg-muted/30 font-bold">
												<td className="px-2 py-1" colSpan={4}></td>
												<td className="px-2 py-1 text-center text-xs font-mono">
													{step.items.map(i => i.effective).join(' + ')} = {step.sum}
												</td>
												<td className="px-2 py-1 text-center font-mono">{step.sum} / {step.count} = {step.avg.toFixed(2)}</td>
											</tr>
										</tbody>
									</table>
								</div>
							</div>
						);
					})}

					<h3 className="font-bold text-foreground mt-6">🔍 Step-by-Step: SD3 Scoring</h3>
					{sd3Steps.map(step => {
						const dl = DOMAIN_LABELS[step.domain];
						return (
							<div key={step.domain} className="rounded-lg border border-border p-3">
								<div className="flex items-center gap-2 mb-2">
									<span className={`px-2 py-0.5 rounded text-xs font-bold ${dl?.color ?? ''}`}>{dl?.short}</span>
									<span className="font-semibold">{dl?.label}</span>
									<span className="ml-auto font-mono text-lg font-bold">{step.avg.toFixed(2)}</span>
								</div>
								<div className="overflow-x-auto">
									<table className="w-full text-xs">
										<thead>
											<tr className="border-b border-border/50">
												<th className="px-2 py-1 text-left">Item#</th>
												<th className="px-2 py-1 text-left">fo#</th>
												<th className="px-2 py-1 text-center">Reversed?</th>
												<th className="px-2 py-1 text-center">Raw</th>
												<th className="px-2 py-1 text-center">Formula</th>
												<th className="px-2 py-1 text-center">Effective</th>
											</tr>
										</thead>
										<tbody>
											{step.items.map(item => (
												<tr key={item.itemNumber} className="border-b border-border/30">
													<td className="px-2 py-1 font-mono">{item.itemNumber}{item.isReversed ? 'R' : ''}</td>
													<td className="px-2 py-1 font-mono text-muted-foreground">fo{item.formOrder}</td>
													<td className="px-2 py-1 text-center">{item.isReversed ? <span className="text-red-600 font-bold">Yes</span> : '—'}</td>
													<td className="px-2 py-1 text-center font-mono">{item.raw}</td>
													<td className="px-2 py-1 text-center font-mono text-muted-foreground">
														{item.isReversed ? `6 − ${item.raw}` : `${item.raw}`}
													</td>
													<td className="px-2 py-1 text-center font-mono font-bold">{item.effective}</td>
												</tr>
											))}
											<tr className="bg-muted/30 font-bold">
												<td className="px-2 py-1" colSpan={4}></td>
												<td className="px-2 py-1 text-center text-xs font-mono">
													{step.items.map(i => i.effective).join(' + ')} = {step.sum}
												</td>
												<td className="px-2 py-1 text-center font-mono">{step.sum} / {step.count} = {step.avg.toFixed(2)}</td>
											</tr>
										</tbody>
									</table>
								</div>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function AdminVerifyPage() {
	const [activeTab, setActiveTab] = useState<'items' | 'scoring-key' | 'calculator'>('items');

	const bfiTotal = BFI2S_QUESTIONS.length;
	const bfiScored = BFI2S_QUESTIONS.filter(q => !q.isAttentionCheck).length;
	const sd3Total = SD3_QUESTIONS.length;
	const sd3Scored = SD3_QUESTIONS.filter(q => !q.isAttentionCheck).length;

	return (
		<div className="p-6 max-w-[1400px] mx-auto">
			{/* Header */}
			<div className="mb-8">
				<h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
					🔬 Scoring Verification Dashboard
				</h1>
				<p className="text-muted-foreground mt-1">
					Inspect every item, domain mapping, and scoring formula used in production.
					This page reads the actual <code className="text-xs bg-muted px-1 py-0.5 rounded">BFI2S_QUESTIONS</code> and <code className="text-xs bg-muted px-1 py-0.5 rounded">SD3_QUESTIONS</code> arrays from the scoring engine.
				</p>

				{/* Quick Stats */}
				<div className="flex flex-wrap gap-4 mt-4">
					<div className="flex items-center gap-2 text-sm bg-muted/50 rounded-md px-3 py-1.5">
						<span className="font-semibold">BFI-2-S:</span>
						<span>{bfiTotal} total ({bfiScored} scored + 1 attn check)</span>
					</div>
					<div className="flex items-center gap-2 text-sm bg-muted/50 rounded-md px-3 py-1.5">
						<span className="font-semibold">SD3:</span>
						<span>{sd3Total} total ({sd3Scored} scored + 1 attn check)</span>
					</div>
					<div className="flex items-center gap-2 text-sm bg-muted/50 rounded-md px-3 py-1.5">
						<span className="font-semibold">Grand Total:</span>
						<span>{bfiTotal + sd3Total} responses expected</span>
					</div>
				</div>
			</div>

			{/* Tab Navigation */}
			<div className="flex border-b border-border mb-6">
				{([
					{ key: 'items',       label: '📋 Item Mapping Tables' },
					{ key: 'scoring-key', label: '🔑 Official Scoring Key' },
					{ key: 'calculator',  label: '🧮 Live Scoring Calculator' },
				] as const).map(tab => (
					<button
						key={tab.key}
						onClick={() => setActiveTab(tab.key)}
						className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
							activeTab === tab.key
								? 'border-blue-500 text-blue-600 dark:text-blue-400'
								: 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
						}`}
					>
						{tab.label}
					</button>
				))}
			</div>

			{/* Tab Content */}
			{activeTab === 'items' && (
				<div className="space-y-10">
					<Section
						title="BFI-2-S Item Mapping (31 rows)"
						subtitle="formOrder matches Google Form column order. itemNumber = official BFI-2-S academic numbering. R = reversed-scored."
					>
						<ItemTable questions={BFI2S_QUESTIONS} testLabel="BFI2S" />
					</Section>

					<Section title="BFI-2-S Domain Composition">
						<DomainSummary questions={BFI2S_QUESTIONS} testLabel="BFI2S" />
					</Section>

					<Section
						title="SD3 Item Mapping (28 rows)"
						subtitle="formOrder matches Google Form column order. Items follow M-N-P interleaved pattern."
					>
						<ItemTable questions={SD3_QUESTIONS} testLabel="SD3" />
					</Section>

					<Section title="SD3 Domain Composition">
						<DomainSummary questions={SD3_QUESTIONS} testLabel="SD3" />
					</Section>
				</div>
			)}

			{activeTab === 'scoring-key' && (
				<Section
					title="Official Academic Scoring Keys"
					subtitle="Cross-reference with the published scoring keys from the original papers."
				>
					<OfficialScoringKey />
				</Section>
			)}

			{activeTab === 'calculator' && (
				<Section
					title="Live Scoring Calculator"
					subtitle="Enter raw Likert values (1-5) for each item. The scoring engine computes domain averages in real-time using the actual production code."
				>
					<ScoringCalculator />
				</Section>
			)}
		</div>
	);
}
