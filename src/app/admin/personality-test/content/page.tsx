'use client';

/* ════════════════════════════════════════════════════════════════════════
   Admin — Personality Test Content Manager
   /admin/personality-test/content

   Lets admin:
   1. Browse all result content (8 domains × 11 fields) in a rich preview
   2. Export the full workbook to Excel
   3. Import an edited workbook to update content on disk
   ════════════════════════════════════════════════════════════════════════ */

import { useState, useRef, useCallback, useEffect } from 'react';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface InsightField {
	key: string;
	label: string;
	darkOnly?: boolean;
}

interface DomainMeta {
	key: string;
	label: string;
	emoji: string;
	category: 'ocean' | 'dark';
	color: string;
}

interface ContentRow {
	field: string;
	fieldLabel: string;
	en: string;
	vi: string;
}

interface ContentData {
	[domainKey: string]: ContentRow[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DOMAINS: DomainMeta[] = [
	{ key: 'extraversion',         label: 'Extraversion',          emoji: '🗣️',  category: 'ocean', color: 'sky' },
	{ key: 'agreeableness',        label: 'Agreeableness',         emoji: '🤝',  category: 'ocean', color: 'emerald' },
	{ key: 'conscientiousness',    label: 'Conscientiousness',     emoji: '📋',  category: 'ocean', color: 'violet' },
	{ key: 'negativeEmotionality', label: 'Negative Emotionality', emoji: '🌊',  category: 'ocean', color: 'amber' },
	{ key: 'openMindedness',       label: 'Open-Mindedness',       emoji: '🔭',  category: 'ocean', color: 'rose' },
	{ key: 'machiavellianism',     label: 'Machiavellianism',      emoji: '♟️',  category: 'dark',  color: 'zinc' },
	{ key: 'narcissism',           label: 'Narcissism',            emoji: '👑',  category: 'dark',  color: 'zinc' },
	{ key: 'psychopathy',          label: 'Psychopathy',           emoji: '⚡',  category: 'dark',  color: 'zinc' },
];

const FIELDS: InsightField[] = [
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
	{ key: 'derailment', label: '⚠️ Derailment scenario', darkOnly: true },
	{ key: 'obLesson',   label: '🏢 OB Lesson',           darkOnly: true },
];

// ─── Import result types ───────────────────────────────────────────────────────

interface ImportChange {
	field: string;
	lang: 'en' | 'vi';
	old: string;
	new: string;
}

interface ImportResult {
	domainsUpdated: number;
	changeLog: Record<string, ImportChange[]>;
	errors: string[];
	message: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function fetchContent(): Promise<ContentData> {
	// We derive preview content from the GET export and parse the blob
	// Actually we call a simpler JSON endpoint we expose below
	const res = await fetch('/api/admin/personality-test/content/preview');
	if (!res.ok) throw new Error(await res.text());
	const json = await res.json();
	return json.data as ContentData;
}

const OCEAN = DOMAINS.filter(d => d.category === 'ocean');
const DARK  = DOMAINS.filter(d => d.category === 'dark');

// ─── Sub-components ───────────────────────────────────────────────────────────

function FieldRow({ row, darkOnly, isDark, lang }: {
	row: ContentRow;
	darkOnly?: boolean;
	isDark: boolean;
	lang: 'en' | 'vi';
}) {
	const [expanded, setExpanded] = useState(false);
	if (darkOnly && !isDark) return null;

	const text = lang === 'en' ? row.en : row.vi;
	const isLong = text.length > 200;
	const displayed = !isLong || expanded ? text : text.slice(0, 200) + '…';

	return (
		<tr className="border-b border-border last:border-0 hover:bg-surface-hover/40 transition-colors">
			<td className="px-4 py-3 align-top w-44 shrink-0">
				<span className="font-mono text-[11px] text-muted bg-surface-hover px-1.5 py-0.5 rounded">
					{row.field}
				</span>
			</td>
			<td className="px-4 py-3 align-top text-xs text-muted w-44 shrink-0">
				{row.fieldLabel}
			</td>
			<td className="px-4 py-3 align-top">
				{row.field === 'icon' ? (
					<span className="text-2xl">{text}</span>
				) : (
					<div>
						<p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{displayed}</p>
						{isLong && (
							<button
								onClick={() => setExpanded(v => !v)}
								className="mt-1 text-[11px] text-accent hover:underline"
							>
								{expanded ? 'Thu gọn ↑' : 'Xem đầy đủ ↓'}
							</button>
						)}
					</div>
				)}
			</td>
		</tr>
	);
}

function DomainCard({
	domain,
	rows,
	lang,
}: {
	domain: DomainMeta;
	rows: ContentRow[];
	lang: 'en' | 'vi';
}) {
	const [open, setOpen] = useState(false);
	const isDark = domain.category === 'dark';

	const colorMap: Record<string, string> = {
		sky:     'border-sky-300 dark:border-sky-700',
		emerald: 'border-emerald-300 dark:border-emerald-700',
		violet:  'border-violet-300 dark:border-violet-700',
		amber:   'border-amber-300 dark:border-amber-700',
		rose:    'border-rose-300 dark:border-rose-700',
		zinc:    'border-zinc-400 dark:border-zinc-600',
	};
	const badgeMap: Record<string, string> = {
		sky:     'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
		emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
		violet:  'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
		amber:   'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
		rose:    'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
		zinc:    'bg-zinc-200 text-zinc-700 dark:bg-zinc-700/60 dark:text-zinc-300',
	};

	return (
		<div className={`rounded-xl border-l-4 ${colorMap[domain.color]} bg-surface shadow-sm overflow-hidden`}>
			{/* Header row — always visible */}
			<button
				onClick={() => setOpen(v => !v)}
				className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-surface-hover/50 transition-colors"
			>
				<span className="text-xl shrink-0">{domain.emoji}</span>
				<span className="font-semibold text-foreground flex-1">{domain.label}</span>
				<span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${badgeMap[domain.color]}`}>
					{isDark ? 'Dark Triad' : 'Big Five'}
				</span>
				<span className="text-xs text-muted ml-2">
					{rows.length} fields
				</span>
				<svg
					viewBox="0 0 16 16"
					fill="none"
					className={`h-4 w-4 text-muted transition-transform ${open ? 'rotate-180' : ''}`}
				>
					<path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
				</svg>
			</button>

			{/* Expandable table */}
			{open && (
				<div className="overflow-x-auto border-t border-border">
					<table className="w-full min-w-[720px]">
						<thead>
							<tr className="bg-surface-hover/60 text-left">
								<th className="px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-muted w-44">Field key</th>
								<th className="px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-muted w-44">Label</th>
								<th className="px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-muted">
									Content ({lang === 'en' ? 'English' : 'Tiếng Việt'})
								</th>
							</tr>
						</thead>
						<tbody>
							{FIELDS.map(f => {
								const row = rows.find(r => r.field === f.key);
								if (!row) return null;
								return (
									<FieldRow
										key={f.key}
										row={row}
										darkOnly={f.darkOnly}
										isDark={isDark}
										lang={lang}
									/>
								);
							})}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
}

// ─── Import result modal ───────────────────────────────────────────────────────

function ImportResultModal({ result, onClose }: { result: ImportResult; onClose: () => void }) {
	const totalChanges = Object.values(result.changeLog).reduce((s, arr) => s + arr.length, 0);

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
			<div className="w-full max-w-2xl rounded-2xl bg-surface border border-border shadow-2xl overflow-hidden">
				{/* Header */}
				<div className={`px-6 py-4 flex items-center gap-3 border-b border-border ${result.domainsUpdated > 0 ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-surface-hover'}`}>
					<span className="text-2xl">{result.domainsUpdated > 0 ? '✅' : 'ℹ️'}</span>
					<div className="flex-1">
						<h3 className="font-bold text-foreground">Import Complete</h3>
						<p className="text-sm text-muted">{result.message}</p>
					</div>
					<button onClick={onClose} className="text-muted hover:text-foreground transition-colors">
						<svg viewBox="0 0 16 16" fill="none" className="h-5 w-5">
							<path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
						</svg>
					</button>
				</div>

				<div className="p-6 max-h-[60vh] overflow-y-auto space-y-5">
					{/* Stats row */}
					<div className="grid grid-cols-3 gap-3">
						{[
							{ label: 'Domains updated', value: result.domainsUpdated, color: 'text-emerald-600' },
							{ label: 'Fields changed', value: totalChanges, color: 'text-amber-600' },
							{ label: 'Errors', value: result.errors.length, color: result.errors.length > 0 ? 'text-rose-600' : 'text-muted' },
						].map(stat => (
							<div key={stat.label} className="rounded-xl bg-surface-hover p-3 text-center">
								<p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
								<p className="text-xs text-muted mt-0.5">{stat.label}</p>
							</div>
						))}
					</div>

					{/* Errors */}
					{result.errors.length > 0 && (
						<div className="rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 p-4 space-y-1">
							<p className="text-sm font-semibold text-rose-700 dark:text-rose-300">⚠️ Errors</p>
							{result.errors.map((e, i) => (
								<p key={i} className="text-xs text-rose-600 dark:text-rose-400">{e}</p>
							))}
						</div>
					)}

					{/* Change log */}
					{totalChanges > 0 && (
						<div className="space-y-3">
							<p className="text-sm font-semibold text-foreground">Change Log</p>
							{Object.entries(result.changeLog).map(([domain, changes]) => (
								<div key={domain} className="rounded-xl border border-border overflow-hidden">
									<div className="bg-surface-hover px-4 py-2 font-semibold text-sm capitalize">
										{domain} — {changes.length} change{changes.length !== 1 ? 's' : ''}
									</div>
									<div className="divide-y divide-border">
										{changes.map((c, i) => (
											<div key={i} className="px-4 py-2 text-xs space-y-1">
												<div className="flex items-center gap-2">
													<span className="font-mono bg-surface-hover px-1.5 py-0.5 rounded text-[10px]">{c.field}</span>
													<span className={`font-semibold uppercase text-[10px] ${c.lang === 'en' ? 'text-blue-600' : 'text-amber-600'}`}>{c.lang}</span>
												</div>
												<p className="text-muted line-through">{c.old || '(empty)'}</p>
												<p className="text-foreground">{c.new || '(empty)'}</p>
											</div>
										))}
									</div>
								</div>
							))}
						</div>
					)}

					{/* Deployment notice */}
					{result.domainsUpdated > 0 && (
						<div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4">
							<p className="text-sm font-semibold text-amber-700 dark:text-amber-300">📦 Next step</p>
							<p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
								Content files on disk have been updated. On the production server, you need to
								<strong> rebuild and reload</strong> the app for changes to take effect
								(<code>npm run build && pm2 reload nextjs-app</code>).
							</p>
						</div>
					)}
				</div>

				<div className="border-t border-border px-6 py-4 flex justify-end">
					<button
						onClick={onClose}
						className="rounded-lg bg-foreground text-background px-5 py-2 text-sm font-semibold hover:opacity-80 transition-opacity"
					>
						Close
					</button>
				</div>
			</div>
		</div>
	);
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PersonalityContentPage() {
	const [content, setContent] = useState<ContentData | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [lang, setLang] = useState<'en' | 'vi'>('en');
	const [exporting, setExporting] = useState(false);
	const [importing, setImporting] = useState(false);
	const [importResult, setImportResult] = useState<ImportResult | null>(null);
	const fileRef = useRef<HTMLInputElement>(null);

	const loadContent = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const data = await fetchContent();
			setContent(data);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Failed to load content');
		} finally {
			setLoading(false);
		}
	}, []);

	// Load on first render
	useEffect(() => { void loadContent(); }, [loadContent]);

	const handleExport = async () => {
		setExporting(true);
		try {
			const res = await fetch('/api/admin/personality-test/content');
			if (!res.ok) throw new Error('Export failed');
			const blob = await res.blob();
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			const date = new Date().toISOString().slice(0, 10);
			a.href = url;
			a.download = `personality-content-${date}.xlsx`;
			a.click();
			URL.revokeObjectURL(url);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Export failed');
		} finally {
			setExporting(false);
		}
	};

	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		setImporting(true);
		setError(null);
		try {
			const fd = new FormData();
			fd.append('file', file);
			const res = await fetch('/api/admin/personality-test/content', {
				method: 'POST',
				body: fd,
			});
			const json = await res.json();
			if (!res.ok || !json.ok) throw new Error(json.error ?? 'Import failed');
			setImportResult(json.data as ImportResult);
			// Reload preview content after import
			await loadContent();
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Import failed');
		} finally {
			setImporting(false);
			// Reset file input so same file can be re-imported
			if (fileRef.current) fileRef.current.value = '';
		}
	};

	return (
		<div className="min-h-screen bg-background">
			{/* Page header */}
			<div className="border-b border-border bg-surface px-8 py-6">
				<div className="max-w-6xl mx-auto">
					<div className="flex flex-wrap items-start gap-4 justify-between">
						<div>
							<div className="flex items-center gap-2 text-xs text-muted mb-2">
								<span>Admin</span>
								<span>›</span>
								<span>Personality Test</span>
								<span>›</span>
								<span className="text-foreground font-medium">Result Content</span>
							</div>
							<h1 className="text-2xl font-black text-foreground">
								🧠 Personality Result Content
							</h1>
							<p className="text-sm text-muted mt-1 max-w-xl">
								Xem, xuất và nhập nội dung kết quả cho cả 8 trait (5 Big Five + 3 Dark Triad).
								Export Excel → chỉnh sửa → Import để cập nhật.
							</p>
						</div>

						{/* Action buttons */}
						<div className="flex flex-wrap items-center gap-3">
							{/* Language toggle */}
							<div className="flex rounded-lg border border-border overflow-hidden text-sm">
								<button
									onClick={() => setLang('en')}
									className={`px-3 py-1.5 font-medium transition-colors ${lang === 'en' ? 'bg-foreground text-background' : 'text-muted hover:bg-surface-hover'}`}
								>
									EN
								</button>
								<button
									onClick={() => setLang('vi')}
									className={`px-3 py-1.5 font-medium transition-colors ${lang === 'vi' ? 'bg-foreground text-background' : 'text-muted hover:bg-surface-hover'}`}
								>
									VI
								</button>
							</div>

							{/* Refresh */}
							<button
								onClick={loadContent}
								disabled={loading}
								className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm text-foreground hover:bg-surface-hover transition-colors disabled:opacity-50"
							>
								<svg viewBox="0 0 16 16" fill="none" className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`}>
									<path d="M14 8A6 6 0 112 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
									<path d="M14 4v4h-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
								</svg>
								Refresh
							</button>

							{/* Export */}
							<button
								onClick={handleExport}
								disabled={exporting}
								className="flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-700 px-4 py-1.5 text-sm font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors disabled:opacity-50"
							>
								{exporting ? (
									<svg viewBox="0 0 16 16" fill="none" className="h-4 w-4 animate-spin">
										<path d="M14 8A6 6 0 112 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
									</svg>
								) : (
									<svg viewBox="0 0 16 16" fill="none" className="h-4 w-4">
										<path d="M8 2v8M5 7l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
										<path d="M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
									</svg>
								)}
								Export Excel
							</button>

							{/* Import */}
							<label className={`flex items-center gap-2 rounded-lg border border-blue-300 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-700 px-4 py-1.5 text-sm font-semibold text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors cursor-pointer ${importing ? 'opacity-50 pointer-events-none' : ''}`}>
								{importing ? (
									<svg viewBox="0 0 16 16" fill="none" className="h-4 w-4 animate-spin">
										<path d="M14 8A6 6 0 112 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
									</svg>
								) : (
									<svg viewBox="0 0 16 16" fill="none" className="h-4 w-4">
										<path d="M8 10V2M5 5l3-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
										<path d="M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
									</svg>
								)}
								Import Excel
								<input
									ref={fileRef}
									type="file"
									accept=".xlsx,.xls"
									className="sr-only"
									onChange={handleFileChange}
									disabled={importing}
								/>
							</label>
						</div>
					</div>

					{/* How-to strip */}
					<div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
						{[
							{ step: '1', title: 'Export', desc: 'Download the workbook. Each domain has its own sheet with EN and VI columns.' },
							{ step: '2', title: 'Edit in Excel', desc: 'Modify any cell in the EN or VI columns. Do not rename sheets or field keys.' },
							{ step: '3', title: 'Import', desc: 'Upload the edited file. Only changed fields are written to disk.' },
						].map(s => (
							<div key={s.step} className="flex items-start gap-3 rounded-xl bg-surface-hover/60 px-4 py-3">
								<div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-foreground text-background text-xs font-black">
									{s.step}
								</div>
								<div>
									<p className="text-sm font-semibold text-foreground">{s.title}</p>
									<p className="text-xs text-muted mt-0.5">{s.desc}</p>
								</div>
							</div>
						))}
					</div>
				</div>
			</div>

			{/* Body */}
			<div className="max-w-6xl mx-auto px-8 py-8 space-y-8">
				{/* Error banner */}
				{error && (
					<div className="rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 px-5 py-4 flex items-start gap-3">
						<span className="text-rose-600 shrink-0 mt-0.5">⚠️</span>
						<div className="flex-1 text-sm text-rose-700 dark:text-rose-300">{error}</div>
						<button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-600 shrink-0">✕</button>
					</div>
				)}

				{/* Loading skeleton */}
				{loading && !content && (
					<div className="space-y-3">
						{Array.from({ length: 8 }).map((_, i) => (
							<div key={i} className="h-16 rounded-xl bg-surface-hover animate-pulse" />
						))}
					</div>
				)}

				{content && (
					<>
						{/* Big Five section */}
						<section>
							<div className="flex items-center gap-3 mb-4">
								<h2 className="text-base font-black text-foreground uppercase tracking-widest">Big Five (BFI-2-S)</h2>
								<div className="flex-1 h-px bg-border" />
								<span className="text-xs text-muted">5 traits</span>
							</div>
							<div className="space-y-3">
								{OCEAN.map(domain => (
									<DomainCard
										key={domain.key}
										domain={domain}
										rows={content[domain.key] ?? []}
										lang={lang}
									/>
								))}
							</div>
						</section>

						{/* Dark Triad section */}
						<section>
							<div className="flex items-center gap-3 mb-4">
								<h2 className="text-base font-black text-foreground uppercase tracking-widest">Dark Triad (SD3)</h2>
								<div className="flex-1 h-px bg-border" />
								<span className="text-xs text-muted">3 traits</span>
							</div>
							<div className="space-y-3">
								{DARK.map(domain => (
									<DomainCard
										key={domain.key}
										domain={domain}
										rows={content[domain.key] ?? []}
										lang={lang}
									/>
								))}
							</div>
						</section>

						{/* Summary stats */}
						<section className="rounded-xl border border-border bg-surface p-6">
							<h3 className="text-sm font-bold text-foreground mb-4">Content Summary</h3>
							<div className="overflow-x-auto">
								<table className="w-full text-sm">
									<thead>
										<tr className="border-b border-border text-left">
											<th className="pb-2 text-xs font-bold uppercase tracking-widest text-muted">Domain</th>
											<th className="pb-2 text-xs font-bold uppercase tracking-widest text-muted text-right">Fields</th>
											<th className="pb-2 text-xs font-bold uppercase tracking-widest text-muted text-right">EN words</th>
											<th className="pb-2 text-xs font-bold uppercase tracking-widest text-muted text-right">VI words</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-border">
										{DOMAINS.map(domain => {
											const rows = content[domain.key] ?? [];
											const enWords = rows.reduce((s, r) => s + r.en.split(/\s+/).filter(Boolean).length, 0);
											const viWords = rows.reduce((s, r) => s + r.vi.split(/\s+/).filter(Boolean).length, 0);
											return (
												<tr key={domain.key} className="hover:bg-surface-hover/40 transition-colors">
													<td className="py-2.5 font-medium text-foreground">
														{domain.emoji} {domain.label}
													</td>
													<td className="py-2.5 text-right text-muted">{rows.length}</td>
													<td className="py-2.5 text-right text-muted">{enWords.toLocaleString()}</td>
													<td className="py-2.5 text-right text-muted">{viWords.toLocaleString()}</td>
												</tr>
											);
										})}
									</tbody>
									<tfoot>
										<tr className="border-t-2 border-border font-bold">
											<td className="pt-2.5 text-foreground">Total</td>
											<td className="pt-2.5 text-right text-foreground">
												{DOMAINS.reduce((s, d) => s + (content[d.key]?.length ?? 0), 0)}
											</td>
											<td className="pt-2.5 text-right text-foreground">
												{DOMAINS.reduce((s, d) => s + (content[d.key] ?? []).reduce((a, r) => a + r.en.split(/\s+/).filter(Boolean).length, 0), 0).toLocaleString()}
											</td>
											<td className="pt-2.5 text-right text-foreground">
												{DOMAINS.reduce((s, d) => s + (content[d.key] ?? []).reduce((a, r) => a + r.vi.split(/\s+/).filter(Boolean).length, 0), 0).toLocaleString()}
											</td>
										</tr>
									</tfoot>
								</table>
							</div>
						</section>
					</>
				)}
			</div>

			{/* Import result modal */}
			{importResult && (
				<ImportResultModal
					result={importResult}
					onClose={() => setImportResult(null)}
				/>
			)}
		</div>
	);
}
