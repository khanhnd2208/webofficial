'use client';

/* ════════════════════════════════════════════════════════════════════════
   Admin — Personality Test Report Dashboard
   
   Displays all test sessions with demographics + scores in a filterable
   table. Allows exporting to Excel.
   ════════════════════════════════════════════════════════════════════════ */

import { useState, useEffect, useMemo, useCallback } from 'react';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ReportRow {
	id: string;
	user_name: string;
	full_name: string | null;
	university: string | null;
	student_year: number | null;
	cumulative_gpa: number | null;
	self_rated_intelligence: number | null;
	status: string;
	duration_seconds: number | null;
	completed_at: string | null;
	created_at: string;
	is_valid: boolean | null;
	extraversion: number | null;
	agreeableness: number | null;
	conscientiousness: number | null;
	negative_emotionality: number | null;
	open_mindedness: number | null;
	machiavellianism: number | null;
	narcissism: number | null;
	psychopathy: number | null;
	archetype_name: string | null;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (v: number | null) =>
	v != null ? v.toFixed(2) : '—';

const fmtDuration = (secs: number | null) => {
	if (!secs) return '—';
	const m = Math.floor(secs / 60);
	const s = secs % 60;
	return `${m}:${String(s).padStart(2, '0')}`;
};

const OCEAN_DOMAINS = [
	{ key: 'extraversion',          short: 'E', label: 'Hướng ngoại' },
	{ key: 'agreeableness',         short: 'A', label: 'Dễ chịu' },
	{ key: 'conscientiousness',     short: 'C', label: 'Tận tâm' },
	{ key: 'negative_emotionality', short: 'N', label: 'Cảm xúc(-)' },
	{ key: 'open_mindedness',       short: 'O', label: 'Cởi mở' },
] as const;

const DARK_DOMAINS = [
	{ key: 'machiavellianism', short: 'M', label: 'Mưu lược' },
	{ key: 'narcissism',       short: 'N', label: 'Tự ái' },
	{ key: 'psychopathy',      short: 'P', label: 'Phản XH' },
] as const;

type SortKey = keyof ReportRow;

// ─── Score Cell ─────────────────────────────────────────────────────────────────

function ScoreCell({ value }: { value: number | null }) {
	if (value == null) return <span className="text-muted">—</span>;
	const color =
		value >= 3.8 ? 'text-success font-bold' :
		value <= 2.2 ? 'text-error font-bold' :
		'text-foreground';
	return <span className={color}>{value.toFixed(2)}</span>;
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function PersonalityTestReportPage() {
	const [rows, setRows] = useState<ReportRow[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [search, setSearch] = useState('');
	const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'invalid'>('all');
	const [sortKey, setSortKey] = useState<SortKey>('created_at');
	const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
	const [exporting, setExporting] = useState(false);
	const [tab, setTab] = useState<'ocean' | 'dark' | 'demo'>('demo');

	// Load data
	useEffect(() => {
		fetch('/api/admin/personality-test/report?limit=2000')
			.then((r) => r.json())
			.then((json) => {
				if (!json.ok) throw new Error(json.error);
				setRows(json.data.rows);
			})
			.catch((e: unknown) => setError(e instanceof Error ? e.message : 'Unknown error'))
			.finally(() => setLoading(false));
	}, []);

	// Sort handler
	const handleSort = useCallback((key: SortKey) => {
		setSortKey((prev) => {
			if (prev === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
			else setSortDir('asc');
			return key;
		});
	}, []);

	// Filtered + sorted rows
	const filtered = useMemo(() => {
		let data = rows;
		if (filterStatus !== 'all') data = data.filter((r) => r.status === filterStatus);
		if (search.trim()) {
			const q = search.toLowerCase();
			data = data.filter(
				(r) =>
					r.full_name?.toLowerCase().includes(q) ||
					r.university?.toLowerCase().includes(q) ||
					r.user_name?.toLowerCase().includes(q) ||
					r.archetype_name?.toLowerCase().includes(q)
			);
		}
		return [...data].sort((a, b) => {
			const av = a[sortKey] ?? '';
			const bv = b[sortKey] ?? '';
			const cmp = av < bv ? -1 : av > bv ? 1 : 0;
			return sortDir === 'asc' ? cmp : -cmp;
		});
	}, [rows, filterStatus, search, sortKey, sortDir]);

	// Summary stats
	const stats = useMemo(() => {
		const valid = rows.filter((r) => r.is_valid);
		const avg = (key: keyof ReportRow) => {
			const vals = valid.map((r) => Number(r[key])).filter((v) => !isNaN(v) && v > 0);
			return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
		};
		return {
			total: rows.length,
			valid: valid.length,
			invalid: rows.filter((r) => r.is_valid === false).length,
			avgE: avg('extraversion'),
			avgA: avg('agreeableness'),
			avgC: avg('conscientiousness'),
			avgN: avg('negative_emotionality'),
			avgO: avg('open_mindedness'),
			avgM: avg('machiavellianism'),
			avgNarc: avg('narcissism'),
			avgP: avg('psychopathy'),
		};
	}, [rows]);

	// Excel export
	const handleExport = async () => {
		setExporting(true);
		try {
			const res = await fetch('/api/admin/personality-test/report?format=xlsx&limit=2000');
			if (!res.ok) throw new Error('Export failed');
			const blob = await res.blob();
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `personality-test-${new Date().toISOString().split('T')[0]}.xlsx`;
			a.click();
			URL.revokeObjectURL(url);
		} catch (e: unknown) {
			alert(e instanceof Error ? e.message : 'Export failed');
		} finally {
			setExporting(false);
		}
	};

	// Sort indicator
	const SortIcon = ({ k }: { k: SortKey }) =>
		sortKey === k ? (
			<span className="ml-0.5 text-accent">{sortDir === 'asc' ? '↑' : '↓'}</span>
		) : null;

	const Th = ({ label, k }: { label: string; k: SortKey }) => (
		<th
			onClick={() => handleSort(k)}
			className="cursor-pointer whitespace-nowrap px-3 py-2.5 text-left text-xs font-bold uppercase tracking-wide text-muted hover:text-foreground select-none"
		>
			{label}
			<SortIcon k={k} />
		</th>
	);

	// ── Render ──
	if (loading) {
		return (
			<div className="flex h-64 items-center justify-center text-muted text-sm">
				Đang tải dữ liệu...
			</div>
		);
	}
	if (error) {
		return (
			<div className="m-8 rounded-xl border border-error/30 bg-error-subtle p-6 text-error text-sm">
				❌ {error}
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-350 space-y-6 px-4 py-8 sm:px-6">
			{/* ── Header ── */}
			<div className="flex flex-wrap items-start justify-between gap-4">
				<div>
					<p className="text-xs font-bold uppercase tracking-widest text-muted">Admin Report</p>
					<h1 className="mt-1 text-2xl font-black tracking-tight text-foreground">
						🧠 Personality Test Results
					</h1>
					<p className="mt-1 text-sm text-muted">
						{stats.total} bài làm · {stats.valid} hợp lệ · {stats.invalid} không hợp lệ
					</p>
				</div>
				<button
					onClick={handleExport}
					disabled={exporting}
					className="flex items-center gap-2 rounded-xl bg-success px-5 py-2.5 text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{exporting ? (
						<>
							<svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
								<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
								<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
							</svg>
							Đang xuất...
						</>
					) : (
						<>📊 Xuất Excel</>
					)}
				</button>
			</div>

			{/* ── Summary Cards ── */}
			<div className="grid grid-cols-4 gap-3 sm:grid-cols-8">
				{[
					{ label: 'E', value: stats.avgE, color: 'text-indigo' },
					{ label: 'A', value: stats.avgA, color: 'text-teal' },
					{ label: 'C', value: stats.avgC, color: 'text-success' },
					{ label: 'N(-)', value: stats.avgN, color: 'text-warning' },
					{ label: 'O', value: stats.avgO, color: 'text-purple' },
					{ label: 'M', value: stats.avgM, color: 'text-error' },
					{ label: 'Narc', value: stats.avgNarc, color: 'text-rose' },
					{ label: 'P', value: stats.avgP, color: 'text-rose' },
				].map((s) => (
					<div key={s.label} className="rounded-xl border border-border bg-surface p-3 text-center">
						<p className={`text-lg font-black tabular-nums ${s.color}`}>{fmt(s.value)}</p>
						<p className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-muted">{s.label}</p>
					</div>
				))}
			</div>

			{/* ── Filters ── */}
			<div className="flex flex-wrap items-center gap-3">
				<input
					type="text"
					placeholder="Tìm kiếm tên, trường, archetype..."
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					className="min-w-55 flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
				/>
				<div className="flex gap-1.5">
					{(['all', 'completed', 'invalid'] as const).map((s) => (
						<button
							key={s}
							onClick={() => setFilterStatus(s)}
							className={`rounded-lg px-3 py-2 text-xs font-bold transition-colors ${
								filterStatus === s
									? 'bg-accent text-accent-foreground'
									: 'border border-border bg-surface text-muted hover:bg-surface-hover'
							}`}
						>
							{s === 'all' ? 'Tất cả' : s === 'completed' ? 'Hợp lệ' : 'Không hợp lệ'}
						</button>
					))}
				</div>
				<span className="text-xs text-muted">{filtered.length} kết quả</span>
			</div>

			{/* ── Tab selector ── */}
			<div className="flex gap-1 rounded-xl border border-border bg-surface p-1 w-fit">
				{([
					{ key: 'demo', label: '👤 Thông tin' },
					{ key: 'ocean', label: '🌟 OCEAN' },
					{ key: 'dark', label: '🌑 Dark Triad' },
				] as const).map((t) => (
					<button
						key={t.key}
						onClick={() => setTab(t.key)}
						className={`rounded-lg px-4 py-1.5 text-sm font-bold transition-colors ${
							tab === t.key
								? 'bg-accent text-accent-foreground shadow-sm'
								: 'text-muted hover:text-foreground'
						}`}
					>
						{t.label}
					</button>
				))}
			</div>

			{/* ── Table ── */}
			<div className="overflow-auto rounded-2xl border border-border bg-surface shadow-sm">
				<table className="min-w-full text-sm">
					<thead className="border-b border-border bg-background-secondary">
						<tr>
							<th className="px-3 py-2.5 text-left text-xs font-bold uppercase tracking-wide text-muted">#</th>
							<Th label="Ngày" k="created_at" />
							<Th label="Họ tên" k="full_name" />

							{tab === 'demo' && (
								<>
									<Th label="Trường" k="university" />
									<Th label="Năm" k="student_year" />
									<Th label="GPA" k="cumulative_gpa" />
									<Th label="IQ (tự)" k="self_rated_intelligence" />
									<Th label="Thời gian" k="duration_seconds" />
									<Th label="Archetype" k="archetype_name" />
								</>
							)}

							{tab === 'ocean' && OCEAN_DOMAINS.map((d) => (
								<Th key={d.key} label={d.short} k={d.key as SortKey} />
							))}

							{tab === 'dark' && DARK_DOMAINS.map((d) => (
								<Th key={d.key} label={d.short} k={d.key as SortKey} />
							))}

							<Th label="Status" k="status" />
						</tr>
					</thead>
					<tbody className="divide-y divide-border">
						{filtered.map((r, idx) => (
							<tr key={r.id} className="group hover:bg-surface-hover transition-colors">
								<td className="px-3 py-2.5 text-xs text-muted tabular-nums">
									{idx + 1}
								</td>
								<td className="whitespace-nowrap px-3 py-2.5 text-xs text-muted tabular-nums">
									{new Date(r.created_at).toLocaleDateString('vi-VN')}
								</td>
								<td className="px-3 py-2.5 font-medium text-foreground max-w-40 truncate">
									{r.full_name ?? r.user_name}
								</td>

								{tab === 'demo' && (
									<>
										<td className="max-w-38 truncate px-3 py-2.5 text-xs text-muted">
											{r.university ?? '—'}
										</td>
										<td className="px-3 py-2.5 text-center text-xs font-bold text-foreground">
											{r.student_year ?? '—'}
										</td>
										<td className="px-3 py-2.5 text-center text-xs tabular-nums font-bold text-foreground">
											{r.cumulative_gpa != null ? Number(r.cumulative_gpa).toFixed(2) : '—'}
										</td>
										<td className="px-3 py-2.5 text-center text-xs font-bold text-foreground">
											{r.self_rated_intelligence ?? '—'}
										</td>
										<td className="px-3 py-2.5 text-center text-xs tabular-nums text-muted">
											{fmtDuration(r.duration_seconds)}
										</td>
										<td className="px-3 py-2.5 text-xs font-bold text-foreground max-w-35 truncate">
											{r.archetype_name ?? '—'}
										</td>
									</>
								)}

								{tab === 'ocean' && OCEAN_DOMAINS.map((d) => (
									<td key={d.key} className="px-3 py-2.5 text-center text-xs tabular-nums">
										<ScoreCell value={r[d.key as keyof ReportRow] as number | null} />
									</td>
								))}

								{tab === 'dark' && DARK_DOMAINS.map((d) => (
									<td key={d.key} className="px-3 py-2.5 text-center text-xs tabular-nums">
										<ScoreCell value={r[d.key as keyof ReportRow] as number | null} />
									</td>
								))}

								<td className="px-3 py-2.5">
									<span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
										r.status === 'completed'
											? 'bg-success-subtle text-success'
											: r.status === 'invalid'
											? 'bg-error-subtle text-error'
											: 'bg-warning-subtle text-warning'
									}`}>
										{r.status === 'completed' ? 'OK' : r.status === 'invalid' ? 'Invalid' : 'WIP'}
									</span>
								</td>
							</tr>
						))}
						{filtered.length === 0 && (
							<tr>
								<td colSpan={20} className="py-12 text-center text-sm text-muted">
									Không có dữ liệu phù hợp
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>

			{/* ── Footer note ── */}
			<p className="text-center text-xs text-muted">
				Hiển thị {filtered.length}/{rows.length} bản ghi · Điểm từ 1.00–5.00 ·{' '}
				<span className="text-success font-bold">Xanh ≥ 3.8</span> ·{' '}
				<span className="text-error font-bold">Đỏ ≤ 2.2</span>
			</p>
		</div>
	);
}
