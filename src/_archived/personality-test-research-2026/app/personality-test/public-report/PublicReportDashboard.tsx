'use client';

/* ════════════════════════════════════════════════════════════════════════
   Public Report Dashboard — Password-protected aggregate view
   
   NO individual data, NO export/download capability.
   Shows aggregate statistics, distributions, and charts.
   ════════════════════════════════════════════════════════════════════════ */

import { useState, useCallback, useMemo } from 'react';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Overview {
	total: number;
	valid: number;
	invalid: number;
	avgDurationSeconds: number;
}

interface ArchetypeEntry { name: string; count: number }
interface GenderEntry { gender: string; count: number }
interface UniversityEntry { university: string; count: number }
interface ReliabilityEntry { flag: string; count: number }
interface BucketEntry { bucket: string; count: number }
interface TimelineEntry { date: string; count: number }

interface ReportData {
	overview: Overview;
	averageScores: Record<string, number>;
	stdDevs: Record<string, number>;
	archetypeDistribution: ArchetypeEntry[];
	genderDistribution: GenderEntry[];
	universityDistribution: UniversityEntry[];
	reliabilityOverview: ReliabilityEntry[];
	scoreDistributions: Record<string, BucketEntry[]>;
	completionTimeline: TimelineEntry[];
	averageScoresByGender: Array<Record<string, string | number>>;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const TRAIT_LABELS: Record<string, { label: string; color: string; emoji: string }> = {
	extraversion:          { label: 'Hướng ngoại',         color: '#f59e0b', emoji: '☀️' },
	agreeableness:         { label: 'Dễ chịu',             color: '#10b981', emoji: '🤝' },
	conscientiousness:     { label: 'Tận tâm',             color: '#3b82f6', emoji: '📋' },
	negative_emotionality: { label: 'Cảm xúc tiêu cực',   color: '#ef4444', emoji: '🌊' },
	open_mindedness:       { label: 'Cởi mở',              color: '#8b5cf6', emoji: '🎨' },
	machiavellianism:      { label: 'Machiavellianism',    color: '#6366f1', emoji: '♟️' },
	narcissism:            { label: 'Narcissism',           color: '#ec4899', emoji: '👑' },
	psychopathy:           { label: 'Psychopathy',          color: '#64748b', emoji: '🧊' },
};

const GENDER_LABELS: Record<string, string> = {
	male: 'Nam',
	female: 'Nữ',
	other: 'Khác',
	unknown: 'Không rõ',
};

const RELIABILITY_LABELS: Record<string, { label: string; color: string }> = {
	valid: { label: 'Hợp lệ', color: '#10b981' },
	suspect: { label: 'Nghi ngờ', color: '#f59e0b' },
	careless: { label: 'Bất cẩn', color: '#ef4444' },
	unknown: { label: 'Không rõ', color: '#94a3b8' },
};

const ARCHETYPE_EMOJIS: Record<string, string> = {
	'The Strategic Executor': '♟️',
	'The Charismatic Disruptor': '⚡',
	'The Detached Analyst': '🏛️',
	'The Empathic Strategist': '🎭',
	'The Vulnerable Perfectionist': '🔬',
	'The Balanced Operator': '⚖️',
	'The Complex Mosaic': '🧩',
};

// ─── Component ─────────────────────────────────────────────────────────────────

export default function PublicReportDashboard() {
	const [password, setPassword] = useState('');
	const [data, setData] = useState<ReportData | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [authenticated, setAuthenticated] = useState(false);

	const handleSubmit = useCallback(async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError('');

		try {
			const res = await fetch(
				`/api/personality-test/public-report?password=${encodeURIComponent(password)}`
			);
			const json = await res.json();

			if (!json.ok) {
				setError(json.error || 'Sai mật khẩu.');
				return;
			}

			setData(json.data);
			setAuthenticated(true);
		} catch {
			setError('Lỗi kết nối, vui lòng thử lại.');
		} finally {
			setLoading(false);
		}
	}, [password]);

	// ─── Password Gate ─────────────────────────────────────────────────────
	if (!authenticated || !data) {
		return (
			<div className="flex min-h-[80vh] items-center justify-center px-4">
				<form
					onSubmit={handleSubmit}
					className="w-full max-w-sm space-y-5 rounded-xl border border-border bg-surface p-8 shadow-lg"
				>
					<div className="text-center">
						<div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 text-2xl">
							📊
						</div>
						<h1 className="text-xl font-bold text-foreground">
							Báo cáo tổng hợp
						</h1>
						<p className="mt-1 text-sm text-muted">
							Personality Test Dashboard
						</p>
					</div>

					<div>
						<label htmlFor="report-password" className="mb-1.5 block text-sm font-medium text-foreground">
							Mật khẩu truy cập
						</label>
						<input
							id="report-password"
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							placeholder="Nhập mật khẩu..."
							required
							autoFocus
							className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
						/>
					</div>

					{error && (
						<p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-500">
							{error}
						</p>
					)}

					<button
						type="submit"
						disabled={loading || !password}
						className="flex w-full items-center justify-center rounded-lg bg-foreground px-4 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
					>
						{loading ? (
							<span className="flex items-center gap-2">
								<span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
								Đang tải...
							</span>
						) : (
							'Xem báo cáo'
						)}
					</button>

					<p className="text-center text-xs text-muted">
						Link này chỉ dành cho người được chia sẻ mật khẩu.
					</p>
				</form>
			</div>
		);
	}

	// ─── Dashboard ─────────────────────────────────────────────────────────
	return (
		<main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
			{/* Header */}
			<div className="mb-8">
				<h1 className="text-2xl font-bold text-foreground sm:text-3xl">
					📊 Báo cáo tổng hợp — Personality Test
				</h1>
				<p className="mt-1 text-sm text-muted">
					Dữ liệu tổng hợp • Không chứa thông tin cá nhân
				</p>
			</div>

			{/* Overview Cards */}
			<OverviewCards overview={data.overview} />

			{/* Average Scores */}
			<Section title="Điểm trung bình các chiều tính cách" icon="📈">
				<AverageScoresTable
					averageScores={data.averageScores}
					stdDevs={data.stdDevs}
					n={data.overview.valid}
				/>
			</Section>

			{/* Score bar charts */}
			<Section title="Phân bố điểm số" icon="📊">
				<ScoreDistributions distributions={data.scoreDistributions} />
			</Section>

			{/* Archetype Distribution */}
			<Section title="Phân bố Archetype" icon="🎭">
				<ArchetypeChart
					distribution={data.archetypeDistribution}
					total={data.overview.valid}
				/>
			</Section>

			{/* Demographics */}
			<div className="grid gap-6 md:grid-cols-2">
				<Section title="Phân bố giới tính" icon="👥">
					<PieList
						items={data.genderDistribution.map((g) => ({
							label: GENDER_LABELS[g.gender] ?? g.gender,
							count: g.count,
						}))}
						total={data.overview.valid}
					/>
				</Section>

				<Section title="Trường đại học (Top 20)" icon="🏫">
					<PieList
						items={data.universityDistribution.map((u) => ({
							label: u.university,
							count: u.count,
						}))}
						total={data.overview.valid}
					/>
				</Section>
			</div>

			{/* Average by Gender */}
			{data.averageScoresByGender.length > 1 && (
				<Section title="Điểm trung bình theo giới tính" icon="⚖️">
					<GenderComparisonTable rows={data.averageScoresByGender} />
				</Section>
			)}

			{/* Response Quality */}
			<Section title="Chất lượng phản hồi" icon="✅">
				<PieList
					items={data.reliabilityOverview.map((r) => ({
						label: RELIABILITY_LABELS[r.flag]?.label ?? r.flag,
						count: r.count,
						color: RELIABILITY_LABELS[r.flag]?.color,
					}))}
					total={data.overview.valid}
				/>
			</Section>

			{/* Timeline */}
			{data.completionTimeline.length > 0 && (
				<Section title="Số lượt hoàn thành theo ngày" icon="📅">
					<TimelineChart timeline={data.completionTimeline} />
				</Section>
			)}

			{/* Footer */}
			<footer className="mt-12 border-t border-border pt-6 text-center text-xs text-muted">
				<p>Dữ liệu được tổng hợp tự động — chỉ hiển thị số liệu thống kê, không bao gồm thông tin cá nhân.</p>
				<p className="mt-1">Personality Test System • HANOICAM</p>
			</footer>
		</main>
	);
}

// ═══════════════════════════════════════════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════════════════════════════════════════

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
	return (
		<section className="mb-8 rounded-xl border border-border bg-surface p-5 sm:p-6">
			<h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
				<span>{icon}</span> {title}
			</h2>
			{children}
		</section>
	);
}

function OverviewCards({ overview }: { overview: Overview }) {
	const cards = [
		{ label: 'Tổng lượt làm bài', value: overview.total, icon: '📝', color: 'text-foreground' },
		{ label: 'Kết quả hợp lệ', value: overview.valid, icon: '✅', color: 'text-green-500' },
		{ label: 'Không hợp lệ', value: overview.invalid, icon: '⚠️', color: 'text-amber-500' },
		{
			label: 'Thời gian TB',
			value: overview.avgDurationSeconds
				? `${Math.floor(overview.avgDurationSeconds / 60)}:${String(overview.avgDurationSeconds % 60).padStart(2, '0')}`
				: '—',
			icon: '⏱️',
			color: 'text-foreground',
		},
	];

	return (
		<div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
			{cards.map((card) => (
				<div
					key={card.label}
					className="rounded-xl border border-border bg-surface p-4 text-center"
				>
					<div className="text-2xl">{card.icon}</div>
					<div className={`mt-1 text-2xl font-bold ${card.color}`}>
						{card.value}
					</div>
					<div className="mt-0.5 text-xs text-muted">{card.label}</div>
				</div>
			))}
		</div>
	);
}

function AverageScoresTable({
	averageScores,
	stdDevs,
	n,
}: {
	averageScores: Record<string, number>;
	stdDevs: Record<string, number>;
	n: number;
}) {
	const oceanTraits = ['extraversion', 'agreeableness', 'conscientiousness', 'negative_emotionality', 'open_mindedness'];
	const darkTraits = ['machiavellianism', 'narcissism', 'psychopathy'];

	const renderGroup = (traits: string[], groupLabel: string) => (
		<div>
			<h3 className="mb-2 text-sm font-semibold text-muted uppercase tracking-wide">{groupLabel}</h3>
			<div className="space-y-2">
				{traits.map((trait) => {
					const info = TRAIT_LABELS[trait];
					const mean = averageScores[trait];
					const sd = stdDevs[trait];
					if (mean == null) return null;
					const pct = ((mean - 1) / 4) * 100; // Likert 1-5 → 0-100%

					return (
						<div key={trait} className="flex flex-col gap-1">
							<div className="flex items-center justify-between text-sm">
								<span className="flex items-center gap-1.5">
									<span>{info?.emoji}</span>
									<span className="font-medium text-foreground">{info?.label ?? trait}</span>
								</span>
								<span className="font-mono text-xs text-muted">
									M = {mean.toFixed(2)} · SD = {sd?.toFixed(2) ?? '—'} · N = {n}
								</span>
							</div>
							<div className="h-3 w-full overflow-hidden rounded-full bg-border/50">
								<div
									className="h-full rounded-full transition-all duration-500"
									style={{
										width: `${Math.max(2, pct)}%`,
										backgroundColor: info?.color ?? '#94a3b8',
									}}
								/>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);

	return (
		<div className="space-y-6">
			{renderGroup(oceanTraits, 'Big Five (OCEAN)')}
			{renderGroup(darkTraits, 'Dark Triad')}
		</div>
	);
}

function ScoreDistributions({ distributions }: { distributions: Record<string, BucketEntry[]> }) {
	const [selectedTrait, setSelectedTrait] = useState('extraversion');
	const buckets = distributions[selectedTrait] ?? [];
	const maxCount = Math.max(...buckets.map((b) => b.count), 1);

	return (
		<div>
			<div className="mb-4 flex flex-wrap gap-2">
				{Object.entries(TRAIT_LABELS).map(([key, info]) => (
					<button
						key={key}
						onClick={() => setSelectedTrait(key)}
						className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
							selectedTrait === key
								? 'bg-foreground text-background'
								: 'border border-border text-muted hover:text-foreground'
						}`}
					>
						{info.emoji} {info.label}
					</button>
				))}
			</div>

			<div className="space-y-1.5">
				{buckets.map((bucket) => {
					const pct = (bucket.count / maxCount) * 100;
					const info = TRAIT_LABELS[selectedTrait];
					return (
						<div key={bucket.bucket} className="flex items-center gap-3 text-sm">
							<span className="w-16 shrink-0 text-right font-mono text-xs text-muted">
								{bucket.bucket}
							</span>
							<div className="flex-1">
								<div className="h-6 w-full overflow-hidden rounded bg-border/30">
									<div
										className="flex h-full items-center rounded px-2 text-xs font-medium text-white transition-all duration-300"
										style={{
											width: `${Math.max(3, pct)}%`,
											backgroundColor: info?.color ?? '#94a3b8',
										}}
									>
										{bucket.count}
									</div>
								</div>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}

function ArchetypeChart({ distribution, total }: { distribution: ArchetypeEntry[]; total: number }) {
	const maxCount = Math.max(...distribution.map((a) => a.count), 1);

	return (
		<div className="space-y-2">
			{distribution.map((arch) => {
				const pct = total > 0 ? ((arch.count / total) * 100).toFixed(1) : '0';
				const barPct = (arch.count / maxCount) * 100;
				const emoji = ARCHETYPE_EMOJIS[arch.name] ?? '🧩';

				return (
					<div key={arch.name} className="flex items-center gap-3">
						<span className="w-56 shrink-0 truncate text-sm font-medium text-foreground">
							{emoji} {arch.name}
						</span>
						<div className="flex-1">
							<div className="h-7 w-full overflow-hidden rounded bg-border/30">
								<div
									className="flex h-full items-center rounded bg-accent/80 px-2 text-xs font-semibold text-white transition-all duration-300"
									style={{ width: `${Math.max(3, barPct)}%` }}
								>
									{arch.count} ({pct}%)
								</div>
							</div>
						</div>
					</div>
				);
			})}
		</div>
	);
}

function PieList({
	items,
	total,
}: {
	items: Array<{ label: string; count: number; color?: string }>;
	total: number;
}) {
	return (
		<div className="space-y-2">
			{items.map((item) => {
				const pct = total > 0 ? ((item.count / total) * 100).toFixed(1) : '0';
				return (
					<div key={item.label} className="flex items-center justify-between text-sm">
						<span className="flex items-center gap-2">
							{item.color && (
								<span
									className="inline-block h-3 w-3 rounded-full"
									style={{ backgroundColor: item.color }}
								/>
							)}
							<span className="font-medium text-foreground">{item.label}</span>
						</span>
						<span className="font-mono text-xs text-muted">
							{item.count} ({pct}%)
						</span>
					</div>
				);
			})}
		</div>
	);
}

function GenderComparisonTable({ rows }: { rows: Array<Record<string, string | number>> }) {
	const traitKeys = [
		'extraversion', 'agreeableness', 'conscientiousness',
		'negative_emotionality', 'open_mindedness',
		'machiavellianism', 'narcissism', 'psychopathy',
	];

	return (
		<div className="overflow-x-auto">
			<table className="w-full text-sm">
				<thead>
					<tr className="border-b border-border">
						<th className="py-2 pr-4 text-left font-semibold text-foreground">Chiều tính cách</th>
						{rows.map((row) => (
							<th key={String(row.gender)} className="px-3 py-2 text-center font-semibold text-foreground">
								{GENDER_LABELS[String(row.gender)] ?? row.gender}
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{traitKeys.map((trait) => {
						const info = TRAIT_LABELS[trait];
						return (
							<tr key={trait} className="border-b border-border/50">
								<td className="py-2 pr-4 text-foreground">
									{info?.emoji} {info?.label ?? trait}
								</td>
								{rows.map((row) => (
									<td key={String(row.gender)} className="px-3 py-2 text-center font-mono text-xs text-muted">
										{row[trait] != null ? Number(row[trait]).toFixed(2) : '—'}
									</td>
								))}
							</tr>
						);
					})}
				</tbody>
			</table>
		</div>
	);
}

function TimelineChart({ timeline }: { timeline: TimelineEntry[] }) {
	const maxCount = Math.max(...timeline.map((t) => t.count), 1);
	const totalSubmissions = useMemo(() => timeline.reduce((sum, t) => sum + t.count, 0), [timeline]);

	// Show last 30 days or all if less
	const displayTimeline = timeline.slice(-30);

	return (
		<div>
			<p className="mb-3 text-xs text-muted">
				Tổng: {totalSubmissions} lượt • Hiển thị {displayTimeline.length} ngày gần nhất
			</p>
			<div className="flex items-end gap-0.5" style={{ height: '120px' }}>
				{displayTimeline.map((entry) => {
					const heightPct = (entry.count / maxCount) * 100;
					return (
						<div
							key={entry.date}
							className="group relative flex-1 cursor-default"
							style={{ height: '100%' }}
						>
							<div
								className="absolute bottom-0 w-full rounded-t bg-accent/70 transition-colors group-hover:bg-accent"
								style={{ height: `${Math.max(2, heightPct)}%` }}
							/>
							{/* Tooltip */}
							<div className="pointer-events-none absolute -top-10 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded bg-foreground px-2 py-1 text-xs text-background shadow group-hover:block">
								{entry.date}: {entry.count}
							</div>
						</div>
					);
				})}
			</div>
			<div className="mt-1 flex justify-between text-[10px] text-muted">
				<span>{displayTimeline[0]?.date}</span>
				<span>{displayTimeline[displayTimeline.length - 1]?.date}</span>
			</div>
		</div>
	);
}
