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
	extraversion_pct: number | null;
	agreeableness_pct: number | null;
	conscientiousness_pct: number | null;
	negative_emotionality_pct: number | null;
	open_mindedness_pct: number | null;
	machiavellianism_pct: number | null;
	narcissism_pct: number | null;
	psychopathy_pct: number | null;
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
	{ key: 'extraversion',          short: 'E', label: 'Hướng ngoại',  pctKey: 'extraversion_pct' },
	{ key: 'agreeableness',         short: 'A', label: 'Dễ chịu',     pctKey: 'agreeableness_pct' },
	{ key: 'conscientiousness',     short: 'C', label: 'Tận tâm',     pctKey: 'conscientiousness_pct' },
	{ key: 'negative_emotionality', short: 'N', label: 'Cảm xúc(-)',  pctKey: 'negative_emotionality_pct' },
	{ key: 'open_mindedness',       short: 'O', label: 'Cởi mở',      pctKey: 'open_mindedness_pct' },
] as const;

const DARK_DOMAINS = [
	{ key: 'machiavellianism', short: 'M', label: 'Mưu lược',  pctKey: 'machiavellianism_pct' },
	{ key: 'narcissism',       short: 'N', label: 'Tự ái',      pctKey: 'narcissism_pct' },
	{ key: 'psychopathy',      short: 'P', label: 'Phản XH',    pctKey: 'psychopathy_pct' },
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

function PercentileCell({ value }: { value: number | null }) {
	if (value == null) return <span className="text-muted">—</span>;
	const pct = Math.round(value);
	const color =
		pct >= 75 ? 'bg-success-subtle text-success' :
		pct >= 60 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
		pct >= 40 ? 'text-foreground' :
		pct >= 25 ? 'bg-warning-subtle text-warning' :
		'bg-error-subtle text-error';
	return (
		<span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-bold ${color}`}>
			P{pct}
		</span>
	);
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
	const [tab, setTab] = useState<'ocean' | 'dark' | 'demo' | 'pct'>('demo');
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [deleting, setDeleting] = useState(false);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

	// Load data
	const fetchData = useCallback(() => {
		setLoading(true);
		setError(null);
		fetch('/api/admin/personality-test/report?limit=2000')
			.then((r) => r.json())
			.then((json) => {
				if (!json.ok) throw new Error(json.error);
				setRows(json.data.rows);
				setSelectedIds(new Set()); // clear selection on refresh
			})
			.catch((e: unknown) => setError(e instanceof Error ? e.message : 'Unknown error'))
			.finally(() => setLoading(false));
	}, []);

	useEffect(() => { fetchData(); }, [fetchData]);

	// Selection helpers
	const toggleSelect = useCallback((id: string) => {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	}, []);

	// Bulk delete handler
	const handleDelete = useCallback(async () => {
		const ids = Array.from(selectedIds);
		if (ids.length === 0) return;
		setDeleting(true);
		try {
			const res = await fetch('/api/admin/personality-test/report', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ ids }),
			});
			const json = await res.json();
			if (!json.ok) throw new Error(json.error ?? 'Delete failed');
			setShowDeleteConfirm(false);
			fetchData(); // refresh list
		} catch (e: unknown) {
			alert(e instanceof Error ? e.message : 'Xóa thất bại');
		} finally {
			setDeleting(false);
		}
	}, [selectedIds, fetchData]);

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

	// Select all filtered rows
	const toggleSelectAll = useCallback(() => {
		setSelectedIds((prev) => {
			const filteredIds = filtered.map((r) => r.id);
			const allSelected = filteredIds.length > 0 && filteredIds.every((id) => prev.has(id));
			if (allSelected) {
				const next = new Set(prev);
				filteredIds.forEach((id) => next.delete(id));
				return next;
			} else {
				const next = new Set(prev);
				filteredIds.forEach((id) => next.add(id));
				return next;
			}
		});
	}, [filtered]);

	// Derived: are all filtered rows selected?
	const allFilteredSelected = filtered.length > 0 && filtered.every((r) => selectedIds.has(r.id));

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
			if (!res.ok) {
				// Try to extract the real server error message
				let errMsg = `HTTP ${res.status}`;
				try {
					const ct = res.headers.get('content-type') ?? '';
					if (ct.includes('application/json')) {
						const json = await res.json() as { ok: boolean; error?: string };
						errMsg = json.error ?? errMsg;
					} else {
						errMsg = await res.text();
					}
				} catch {
					// ignore parse error, use status code
				}
				throw new Error(`Export failed: ${errMsg}`);
			}
			const blob = await res.blob();
			if (blob.size === 0) throw new Error('Export failed: server returned empty file');
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `personality-test-${new Date().toISOString().split('T')[0]}.xlsx`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
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
				<div className="flex items-center gap-2">
					{/* Delete button — only visible when items selected */}
					{selectedIds.size > 0 && (
						<div className="relative">
							<button
								onClick={() => setShowDeleteConfirm(true)}
								disabled={deleting}
								className="flex items-center gap-2 rounded-xl bg-error px-5 py-2.5 text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{deleting ? (
									<>
										<svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
											<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
											<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
										</svg>
										Đang xóa...
									</>
								) : (
									<>🗑️ Xóa ({selectedIds.size})</>
								)}
							</button>

							{/* Confirmation popover */}
							{showDeleteConfirm && (
								<div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-2xl border border-error/30 bg-surface p-5 shadow-xl">
									<p className="text-sm font-bold text-foreground">
										⚠️ Xác nhận xóa
									</p>
									<p className="mt-2 text-xs text-muted">
										Bạn sắp xóa <strong className="text-error">{selectedIds.size}</strong> bài test
										khỏi database. Hành động này <strong>không thể hoàn tác</strong>.
									</p>
									<p className="mt-1 text-xs text-muted">
										Dữ liệu bị xóa: session, kết quả tính điểm, và tất cả câu trả lời.
									</p>
									<div className="mt-4 flex items-center gap-2">
										<button
											onClick={handleDelete}
											disabled={deleting}
											className="flex-1 rounded-lg bg-error px-4 py-2 text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
										>
											{deleting ? 'Đang xóa...' : `Xóa ${selectedIds.size} bài test`}
										</button>
										<button
											onClick={() => setShowDeleteConfirm(false)}
											className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface-hover"
										>
											Hủy
										</button>
									</div>
								</div>
							)}
						</div>
					)}
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
				{selectedIds.size > 0 && (
					<button
						onClick={() => setSelectedIds(new Set())}
						className="text-xs text-accent hover:underline"
					>
						✕ Bỏ chọn {selectedIds.size}
					</button>
				)}
			</div>

			{/* ── Tab selector ── */}
			<div className="flex gap-1 rounded-xl border border-border bg-surface p-1 w-fit">
				{([
					{ key: 'demo', label: '👤 Thông tin' },
					{ key: 'ocean', label: '🌟 OCEAN' },
					{ key: 'dark', label: '🌑 Dark Triad' },
					{ key: 'pct', label: '📊 Percentile' },
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
							<th className="w-10 px-3 py-2.5 text-center">
								<input
									type="checkbox"
									checked={allFilteredSelected}
									onChange={toggleSelectAll}
									className="h-4 w-4 cursor-pointer rounded border-border accent-accent"
									title={allFilteredSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
								/>
							</th>
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

							{tab === 'pct' && (
								<>
									{OCEAN_DOMAINS.map((d) => (
										<Th key={d.pctKey} label={`${d.short}%`} k={d.pctKey as SortKey} />
									))}
									<th className="px-1 py-2.5 text-xs text-muted">│</th>
									{DARK_DOMAINS.map((d) => (
										<Th key={d.pctKey} label={`${d.short}%`} k={d.pctKey as SortKey} />
									))}
								</>
							)}

							<Th label="Status" k="status" />
						</tr>
					</thead>
					<tbody className="divide-y divide-border">
						{filtered.map((r, idx) => (
							<tr key={r.id} className={`group transition-colors ${selectedIds.has(r.id) ? 'bg-accent/5' : 'hover:bg-surface-hover'}`}>
								<td className="w-10 px-3 py-2.5 text-center">
									<input
										type="checkbox"
										checked={selectedIds.has(r.id)}
										onChange={() => toggleSelect(r.id)}
										className="h-4 w-4 cursor-pointer rounded border-border accent-accent"
									/>
								</td>
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

								{tab === 'pct' && (
									<>
										{OCEAN_DOMAINS.map((d) => (
											<td key={d.pctKey} className="px-3 py-2.5 text-center">
												<PercentileCell value={r[d.pctKey as keyof ReportRow] as number | null} />
											</td>
										))}
										<td className="px-1 py-2.5 text-xs text-muted text-center">│</td>
										{DARK_DOMAINS.map((d) => (
											<td key={d.pctKey} className="px-3 py-2.5 text-center">
												<PercentileCell value={r[d.pctKey as keyof ReportRow] as number | null} />
											</td>
										))}
									</>
								)}

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
								<td colSpan={21} className="py-12 text-center text-sm text-muted">
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
				{tab === 'pct' && (
					<>
						{' '}· Percentile so với nhóm tham chiếu (BFI-2: N=3,071 · SD3: N=998)
					</>
				)}
			</p>
		</div>
	);
}
