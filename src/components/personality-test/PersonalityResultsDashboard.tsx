'use client';

/* ════════════════════════════════════════════════════════════════════════
   PersonalityResultsDashboard — Visual results display
   
   Design philosophy:
   - High contrast between "Light" (OCEAN) and "Dark" (SD3) sections
   - Professional, enterprise-grade look
   - Responsive radar-style bar visualizations
   - Archetype card with narrative
   ════════════════════════════════════════════════════════════════════════ */

import { motion } from 'framer-motion';
import Link from 'next/link';

import type {
	PersonalityTestSessionDTO,
	TraitScore,
	ArchetypeProfile,
} from '@/types/personalityTest';
import { DOMAIN_LABELS_VI } from '@/lib/personalityScoring';

// ─── Props ─────────────────────────────────────────────────────────────────────

interface Props {
	session: PersonalityTestSessionDTO;
}

// ─── Trait Bar Component ───────────────────────────────────────────────────────

function TraitBar({
	trait,
	colorClass,
	delay = 0,
}: {
	trait: TraitScore;
	colorClass: string;
	delay?: number;
}) {
	const percent = ((trait.score - 1) / 4) * 100; // Normalize 1-5 to 0-100%
	const viLabel = DOMAIN_LABELS_VI[trait.domain] ?? trait.label;

	return (
		<div className="space-y-1.5">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<span className="text-sm font-bold text-foreground">{viLabel}</span>
					<span className="text-xs text-muted">({trait.label})</span>
				</div>
				<div className="flex items-center gap-2">
					<span className="text-sm font-black tabular-nums text-foreground">
						{trait.score.toFixed(2)}
					</span>
					<span
						className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
							trait.level === 'high'
								? 'bg-error-subtle text-error'
								: trait.level === 'low'
									? 'bg-indigo-subtle text-indigo'
									: 'bg-warning-subtle text-warning'
						}`}
					>
						{trait.level === 'high' ? 'Cao' : trait.level === 'low' ? 'Thấp' : 'TB'}
					</span>
					{trait.percentile !== null && (
						<span className="text-[10px] text-muted tabular-nums">
							P{trait.percentile}
						</span>
					)}
				</div>
			</div>
			<div className="h-3 overflow-hidden rounded-full bg-background-secondary">
				<motion.div
					className={`h-full rounded-full ${colorClass}`}
					initial={{ width: 0 }}
					animate={{ width: `${Math.max(percent, 2)}%` }}
					transition={{ duration: 0.8, delay, ease: 'easeOut' }}
				/>
			</div>
		</div>
	);
}

// ─── Archetype Card ────────────────────────────────────────────────────────────

function ArchetypeCard({ archetype }: { archetype: ArchetypeProfile }) {
	const themeColors: Record<ArchetypeProfile['colorTheme'], string> = {
		amber: 'from-amber-500/20 via-orange-500/10 to-transparent border-amber-500/30',
		indigo: 'from-indigo-500/20 via-blue-500/10 to-transparent border-indigo-500/30',
		rose: 'from-rose-500/20 via-pink-500/10 to-transparent border-rose-500/30',
		teal: 'from-teal-500/20 via-emerald-500/10 to-transparent border-teal-500/30',
		purple: 'from-purple-500/20 via-violet-500/10 to-transparent border-purple-500/30',
		emerald: 'from-emerald-500/20 via-green-500/10 to-transparent border-emerald-500/30',
	};

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5, delay: 0.2 }}
			className={`relative overflow-hidden rounded-2xl border bg-linear-to-br ${themeColors[archetype.colorTheme]} p-6 sm:p-8`}
		>
			{/* Background glow */}
			<div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-accent/5 blur-3xl" />

			<div className="relative">
				<div className="flex items-center gap-4">
					<span className="text-4xl">{archetype.icon}</span>
					<div>
						<h3 className="text-xl font-black tracking-tight text-foreground sm:text-2xl">
							{archetype.name}
						</h3>
						<p className="text-sm italic text-muted">{archetype.tagline}</p>
					</div>
				</div>

				<p className="mt-5 text-sm leading-relaxed text-foreground-secondary">
					{archetype.narrative}
				</p>

				<div className="mt-6 grid gap-4 sm:grid-cols-2">
					{/* Strengths */}
					<div className="rounded-xl border border-success/20 bg-success-subtle/50 p-4">
						<h4 className="flex items-center gap-2 text-sm font-bold text-success">
							<span>💪</span> Điểm mạnh (Constructive)
						</h4>
						<ul className="mt-3 space-y-2">
							{archetype.strengths.map((s, i) => (
								<li key={i} className="flex items-start gap-2 text-xs leading-relaxed text-foreground-secondary">
									<span className="mt-0.5 text-success">✓</span>
									{s}
								</li>
							))}
						</ul>
					</div>

					{/* Blindspots */}
					<div className="rounded-xl border border-error/20 bg-error-subtle/50 p-4">
						<h4 className="flex items-center gap-2 text-sm font-bold text-error">
							<span>⚠️</span> Điểm mù (Destructive Risks)
						</h4>
						<ul className="mt-3 space-y-2">
							{archetype.blindspots.map((b, i) => (
								<li key={i} className="flex items-start gap-2 text-xs leading-relaxed text-foreground-secondary">
									<span className="mt-0.5 text-error">!</span>
									{b}
								</li>
							))}
						</ul>
					</div>
				</div>
			</div>
		</motion.div>
	);
}

// ─── Invalid Result Card ───────────────────────────────────────────────────────

function InvalidResultCard({ reason }: { reason?: string }) {
	return (
		<div className="rounded-2xl border border-error/30 bg-error-subtle p-8 text-center">
			<div className="text-4xl">🚫</div>
			<h3 className="mt-4 text-xl font-black text-foreground">Kết quả không hợp lệ</h3>
			<p className="mt-2 text-sm text-muted leading-relaxed max-w-md mx-auto">
				Bài test không thể được phân tích do không vượt qua kiểm tra sự chú ý.
				{reason && (
					<span className="mt-2 block text-xs text-error">{reason}</span>
				)}
			</p>
			<Link
				href="/personality-test"
				className="mt-5 inline-block rounded-xl bg-accent px-6 py-3 text-sm font-bold text-accent-foreground transition-colors hover:bg-accent-hover"
			>
				Làm lại bài test
			</Link>
		</div>
	);
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function PersonalityResultsDashboard({ session }: Props) {
	const result = session.result;

	if (!result || !result.isValid) {
		return <InvalidResultCard reason={result?.invalidReason} />;
	}

	const { ocean, darkTriad, archetype } = result;

	const oceanTraits: TraitScore[] = ocean
		? [
				ocean.extraversion,
				ocean.agreeableness,
				ocean.conscientiousness,
				ocean.negativeEmotionality,
				ocean.openMindedness,
			]
		: [];

	const darkTraits: TraitScore[] = darkTriad
		? [darkTriad.machiavellianism, darkTriad.narcissism, darkTriad.psychopathy]
		: [];

	return (
		<div className="space-y-6">
			{/* ── Header ── */}
			<motion.div
				initial={{ opacity: 0, y: -10 }}
				animate={{ opacity: 1, y: 0 }}
				className="text-center"
			>
				<p className="text-xs font-bold uppercase tracking-widest text-muted">
					Kết quả phân tích tính cách
				</p>
				<h2 className="mt-1 text-2xl font-black tracking-tight text-foreground sm:text-3xl">
					Dual Personality Profile
				</h2>
				{session.completedAt && (
					<p className="mt-2 text-xs text-muted">
						{new Date(session.completedAt).toLocaleDateString('vi-VN', {
							year: 'numeric',
							month: 'long',
							day: 'numeric',
							hour: '2-digit',
							minute: '2-digit',
						})}
					</p>
				)}
			</motion.div>

			{/* ── Archetype ── */}
			{archetype && <ArchetypeCard archetype={archetype} />}

			{/* ── Scores Grid ── */}
			<div className="grid gap-6 lg:grid-cols-2">
				{/* OCEAN — The Light */}
				<motion.div
					initial={{ opacity: 0, x: -20 }}
					animate={{ opacity: 1, x: 0 }}
					transition={{ duration: 0.4, delay: 0.3 }}
					className="rounded-2xl border border-indigo/20 bg-surface p-5 sm:p-6"
				>
					<div className="flex items-center gap-3 mb-5">
						<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-subtle text-xl">
							🌟
						</div>
						<div>
							<h3 className="text-sm font-black text-foreground uppercase tracking-wider">
								The Light — OCEAN
							</h3>
							<p className="text-xs text-muted">BFI-2-S (Big Five Inventory)</p>
						</div>
					</div>
					<div className="space-y-4">
						{oceanTraits.map((trait, i) => (
							<TraitBar
								key={trait.domain}
								trait={trait}
								colorClass="bg-linear-to-r from-indigo to-purple"
								delay={0.3 + i * 0.1}
							/>
						))}
					</div>
				</motion.div>

				{/* Dark Triad — The Dark */}
				<motion.div
					initial={{ opacity: 0, x: 20 }}
					animate={{ opacity: 1, x: 0 }}
					transition={{ duration: 0.4, delay: 0.4 }}
					className="rounded-2xl border border-rose/20 bg-surface p-5 sm:p-6"
				>
					<div className="flex items-center gap-3 mb-5">
						<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-subtle text-xl">
							🌑
						</div>
						<div>
							<h3 className="text-sm font-black text-foreground uppercase tracking-wider">
								The Dark — Triad
							</h3>
							<p className="text-xs text-muted">SD3 (Short Dark Triad)</p>
						</div>
					</div>
					<div className="space-y-4">
						{darkTraits.map((trait, i) => (
							<TraitBar
								key={trait.domain}
								trait={trait}
								colorClass="bg-linear-to-r from-rose to-red-500"
								delay={0.4 + i * 0.1}
							/>
						))}
					</div>

					{/* Contextual warning */}
					<div className="mt-5 rounded-lg bg-background-secondary p-3">
						<p className="text-[10px] leading-relaxed text-muted">
							⚠️ Dark Triad scores cao không tự động có nghĩa xấu trong bối cảnh nghề nghiệp.
							Một mức Machiavellianism vừa phải có thể phản ánh trí tuệ chiến lược, không phải ý đồ xấu.
						</p>
					</div>
				</motion.div>
			</div>

			{/* ── Score Summary Table ── */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.4, delay: 0.6 }}
				className="rounded-2xl border border-border bg-surface overflow-hidden"
			>
				<div className="p-5 sm:p-6">
					<h3 className="text-sm font-black text-foreground uppercase tracking-wider">
						📊 Bảng điểm chi tiết
					</h3>
				</div>
				<div className="overflow-x-auto">
					<table className="w-full text-sm">
						<thead>
							<tr className="border-t border-border bg-background-secondary/50">
								<th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted">
									Đặc điểm
								</th>
								<th className="px-5 py-3 text-center text-xs font-bold uppercase tracking-wider text-muted">
									Loại
								</th>
								<th className="px-5 py-3 text-center text-xs font-bold uppercase tracking-wider text-muted">
									Điểm
								</th>
								<th className="px-5 py-3 text-center text-xs font-bold uppercase tracking-wider text-muted">
									Mức
								</th>
								<th className="px-5 py-3 text-center text-xs font-bold uppercase tracking-wider text-muted">
									Percentile
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-border">
							{[...oceanTraits, ...darkTraits].map((trait) => {
								const isOcean = ['extraversion', 'agreeableness', 'conscientiousness', 'negativeEmotionality', 'openMindedness'].includes(trait.domain);
								const viLabel = DOMAIN_LABELS_VI[trait.domain] ?? trait.label;
								return (
									<tr key={trait.domain} className="transition-colors hover:bg-surface-hover/50">
										<td className="px-5 py-3 font-medium text-foreground">
											{viLabel}
											<span className="ml-1 text-xs text-muted">({trait.label})</span>
										</td>
										<td className="px-5 py-3 text-center">
											<span
												className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
													isOcean
														? 'bg-indigo-subtle text-indigo'
														: 'bg-rose-subtle text-rose'
												}`}
											>
												{isOcean ? 'OCEAN' : 'Dark'}
											</span>
										</td>
										<td className="px-5 py-3 text-center font-bold tabular-nums text-foreground">
											{trait.score.toFixed(2)}
										</td>
										<td className="px-5 py-3 text-center">
											<span
												className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
													trait.level === 'high'
														? 'bg-error-subtle text-error'
														: trait.level === 'low'
															? 'bg-teal-subtle text-teal'
															: 'bg-warning-subtle text-warning'
												}`}
											>
												{trait.level === 'high' ? 'Cao' : trait.level === 'low' ? 'Thấp' : 'TB'}
											</span>
										</td>
										<td className="px-5 py-3 text-center text-xs tabular-nums text-muted">
											{trait.percentile !== null ? `${trait.percentile}%` : '—'}
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			</motion.div>

			{/* ── Actions ── */}
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ delay: 0.8 }}
				className="flex flex-col gap-3 sm:flex-row sm:justify-center"
			>
				<Link
					href="/personality-test"
					className="rounded-xl border border-border bg-surface px-6 py-3 text-center text-sm font-bold text-foreground transition-colors hover:bg-surface-hover"
				>
					← Về trang test
				</Link>
				<Link
					href="/personality-test"
					className="rounded-xl bg-accent px-6 py-3 text-center text-sm font-bold text-accent-foreground transition-colors hover:bg-accent-hover"
				>
					Làm bài test mới
				</Link>
			</motion.div>

			{/* ── Disclaimer ── */}
			<div className="rounded-xl bg-background-secondary p-4 text-center">
				<p className="text-[10px] leading-relaxed text-muted">
					📌 Kết quả này dựa trên hai thang đo tâm lý học được nghiên cứu học thuật (BFI-2-S: Soto & John, 2017; SD3: Jones & Paulhus, 2014).
					Đây là công cụ tự đánh giá, không phải chẩn đoán lâm sàng. Kết quả nên được xem xét trong bối cảnh phát triển cá nhân và nghề nghiệp.
				</p>
			</div>
		</div>
	);
}
