'use client';

/* ════════════════════════════════════════════════════════════════════════
   PersonalityResultsDashboard — Visual results display
   
   Design philosophy:
   - High contrast between "Light" (OCEAN) and "Dark" (SD3) sections
   - Professional, enterprise-grade look
   - Responsive radar-style bar visualizations
   - Archetype card with narrative
   - Normative percentile comparison with reference group selector
   ════════════════════════════════════════════════════════════════════════ */

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

import type {
	PersonalityTestSessionDTO,
	TraitScore,
	ArchetypeProfile,
	PersonalityDomain,
} from '@/types/personalityTest';
import { DOMAIN_LABELS_VI } from '@/lib/personalityScoring';

// ─── Trait Interpretation Data ─────────────────────────────────────────────────
// Rich domain-specific insights for each score level

const TRAIT_INSIGHTS: Record<PersonalityDomain, { icon: string; high: string; medium: string; low: string; tip: string }> = {
	extraversion: {
		icon: '🗣️',
		high: 'Bạn tràn đầy năng lượng xã hội — thích giao tiếp, dẫn dắt nhóm, và tìm cảm hứng từ người khác. Môi trường làm việc năng động, nhiều tương tác sẽ giúp bạn phát huy tốt nhất.',
		medium: 'Bạn linh hoạt giữa giao tiếp và không gian riêng. Bạn có thể dẫn dắt khi cần nhưng cũng thoải mái làm việc độc lập.',
		low: 'Bạn hướng nội — cần thời gian riêng để nạp năng lượng và suy nghĩ sâu. Bạn thường lắng nghe trước khi nói và thích các cuộc trò chuyện nhỏ, có ý nghĩa.',
		tip: '💡 Nghề phù hợp: E cao → Sales, quản lý, PR. E thấp → Nghiên cứu, lập trình, viết.',
	},
	agreeableness: {
		icon: '🤝',
		high: 'Bạn rất tử tế, sẵn lòng giúp đỡ và tin tưởng người khác. Điều này giúp xây dựng mối quan hệ tốt nhưng hãy cẩn thận đừng bỏ quên nhu cầu bản thân.',
		medium: 'Bạn cân bằng giữa đồng cảm và giữ vững lập trường — một sự kết hợp lành mạnh cho nhiều hoàn cảnh.',
		low: 'Bạn thiên về phân tích lý trí hơn cảm xúc. Bạn có thể đưa ra quyết định khó khăn mà không bị ảnh hưởng quá nhiều bởi áp lực xã hội.',
		tip: '💡 A cao → Chăm sóc khách hàng, HR, giảng dạy. A thấp → Luật sư, kinh doanh đàm phán.',
	},
	conscientiousness: {
		icon: '📋',
		high: 'Bạn kỷ luật, có tổ chức và đáng tin cậy. Bạn lập kế hoạch trước và theo dõi tiến độ chặt chẽ — một yếu tố dự báo mạnh cho thành công học thuật và nghề nghiệp.',
		medium: 'Bạn có thể có kỷ luật khi cần nhưng cũng linh hoạt để thích ứng với thay đổi — một sự cân bằng tốt.',
		low: 'Bạn ưu tiên sự linh hoạt và tự phát hơn kế hoạch cứng nhắc. Hãy cẩn thận với deadline — sử dụng công cụ nhắc nhở có thể giúp ích rất nhiều.',
		tip: '💡 C là chỉ số dự báo GPA và hiệu suất công việc mạnh nhất trong Big Five.',
	},
	negativeEmotionality: {
		icon: '🌊',
		high: 'Bạn nhạy cảm với stress và có xu hướng trải nghiệm cảm xúc tiêu cực mạnh hơn. Điều này không phải yếu điểm — nó cho thấy bạn cảm nhận sâu sắc, nhưng nên phát triển kỹ năng quản lý stress.',
		medium: 'Bạn có sự ổn định cảm xúc ở mức bình thường — có lo lắng lúc cần nhưng phục hồi nhanh.',
		low: 'Bạn rất ổn định về cảm xúc, ít bị stress tác động. Đây là lợi thế lớn cho các vị trí lãnh đạo và môi trường áp lực cao.',
		tip: '💡 N cao → Hãy đầu tư vào mindfulness, tập thể dục, và thiết lập ranh giới lành mạnh.',
	},
	openMindedness: {
		icon: '🎨',
		high: 'Bạn tò mò, sáng tạo và thích khám phá ý tưởng mới. Bạn thường suy nghĩ trừu tượng và đánh giá cao nghệ thuật, triết học, và đổi mới.',
		medium: 'Bạn cân bằng giữa sáng tạo và thực tế — sẵn sàng thử cái mới nhưng cũng biết giữ những gì hiệu quả.',
		low: 'Bạn thiên về thực tế, ưu tiên những gì đã được chứng minh. Bạn ổn định và đáng tin cậy, thích các quy trình rõ ràng.',
		tip: '💡 O cao → Thiết kế, R&D, startup, nghệ thuật. O thấp → Kế toán, vận hành, quản lý chất lượng.',
	},
	machiavellianism: {
		icon: '♟️',
		high: 'Bạn có tư duy chiến lược cao — hiểu rõ động lực của người khác và biết cách vận dụng tình huống. Trong kinh doanh, đây có thể là lợi thế, nhưng hãy cẩn thận về ranh giới đạo đức.',
		medium: 'Bạn có nhận thức xã hội tốt nhưng không quá tính toán — một sự kết hợp cân bằng.',
		low: 'Bạn trực tính và chân thành, ít khi suy nghĩ chiến lược về mối quan hệ. Điều này tạo sự tin tưởng nhưng đôi khi có thể bị lợi dụng.',
		tip: '💡 M vừa phải = "Trí tuệ xã hội" — biết đọc tình huống nhưng vẫn giữ đạo đức.',
	},
	narcissism: {
		icon: '👑',
		high: 'Bạn tự tin cao và muốn được công nhận. Điều này có thể tốt cho lãnh đạo và trình bày, nhưng hãy đảm bảo cũng lắng nghe và ghi nhận đóng góp của người khác.',
		medium: 'Bạn tự tin ở mức lành mạnh — tin vào khả năng bản thân nhưng không cần phải luôn là trung tâm.',
		low: 'Bạn khiêm tốn và ít cần sự chú ý. Đây là phẩm chất tốt cho làm việc nhóm nhưng đừng đánh giá thấp bản thân.',
		tip: '💡 Narcissism "lành mạnh" (vừa phải) liên quan đến sự tự tin và resilience cao hơn.',
	},
	psychopathy: {
		icon: '⚡',
		high: 'Bạn có xu hướng tìm kiếm cảm giác mạnh và ít bị ảnh hưởng bởi sợ hãi. Trong công việc, hãy chuyển hướng năng lượng này vào những thử thách mang tính xây dựng.',
		medium: 'Bạn có sự bình tĩnh tốt trong tình huống căng thẳng, nhưng vẫn quan tâm đến hậu quả hành động.',
		low: 'Bạn đồng cảm cao và luôn cân nhắc ảnh hưởng của hành động lên người khác. Đây là nền tảng tốt cho mối quan hệ bền vững.',
		tip: '💡 P thấp → mạnh về empathy và teamwork. P cao → mạnh về ra quyết định dưới áp lực.',
	},
};

// ─── Percentile Result type (mirroring the API response) ──────────────────────

interface PercentileResult {
	domain: PersonalityDomain;
	score: number;
	referenceGroupId: string;
	referenceGroupLabel: string;
	referenceGroupLabelVi: string;
	mean: number;
	sd: number;
	zScore: number;
	percentile: number;
	interpretation: string;
	interpretationVi: string;
}

interface ReferenceGroupOption {
	id: string;
	label: string;
	labelVi: string;
	type: 'ocean' | 'darkTriad';
	n: number;
}

interface ReferenceGroupDetail {
	id: string;
	label: string;
	labelVi: string;
	description: string;
	descriptionVi: string;
	source: string;
}

interface PercentilesApiResponse {
	sessionId: string;
	percentiles: Record<string, PercentileResult>;
	selectedGroups: { ocean: string; darkTriad: string };
	availableGroups: ReferenceGroupOption[];
	referenceGroupDetails: {
		ocean: ReferenceGroupDetail;
		darkTriad: ReferenceGroupDetail;
	};
}

// ─── Props ─────────────────────────────────────────────────────────────────────

interface Props {
	session: PersonalityTestSessionDTO;
}

// ─── Trait Bar Component ───────────────────────────────────────────────────────

function TraitBar({
	trait,
	colorClass,
	delay = 0,
	normative,
	showInsight = false,
}: {
	trait: TraitScore;
	colorClass: string;
	delay?: number;
	normative?: PercentileResult;
	showInsight?: boolean;
}) {
	const percent = ((trait.score - 1) / 4) * 100; // Normalize 1-5 to 0-100%
	const viLabel = DOMAIN_LABELS_VI[trait.domain] ?? trait.label;
	const displayPercentile = normative?.percentile ?? trait.percentile;
	const insight = TRAIT_INSIGHTS[trait.domain];

	return (
		<div className="space-y-1.5">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					{insight && <span className="text-sm">{insight.icon}</span>}
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
					{displayPercentile !== null && displayPercentile !== undefined && (
						<span className="text-[10px] text-muted tabular-nums" title={normative ? `Z = ${normative.zScore}, ${normative.interpretationVi}` : undefined}>
							P{displayPercentile}
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
			{/* Normative comparison mini-bar */}
			{normative && (
				<div className="flex items-center gap-2 text-[10px] text-muted">
					<span>Nhóm tham chiếu: M={normative.mean.toFixed(2)}</span>
					<span>•</span>
					<span>{normative.interpretationVi}</span>
				</div>
			)}
			{/* Insight text */}
			{showInsight && insight && (
				<motion.div
					initial={{ opacity: 0, height: 0 }}
					animate={{ opacity: 1, height: 'auto' }}
					transition={{ duration: 0.3, delay: delay + 0.5 }}
					className="mt-1 rounded-lg bg-background-secondary/60 px-3 py-2"
				>
					<p className="text-[11px] leading-relaxed text-foreground-secondary">
						{trait.level === 'high' ? insight.high : trait.level === 'low' ? insight.low : insight.medium}
					</p>
					<p className="mt-1 text-[10px] text-muted">{insight.tip}</p>
				</motion.div>
			)}
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

// ─── Reference Group Selector ──────────────────────────────────────────────────

function ReferenceGroupSelector({
	label,
	options,
	value,
	onChange,
	detail,
}: {
	label: string;
	options: ReferenceGroupOption[];
	value: string;
	onChange: (id: string) => void;
	detail?: ReferenceGroupDetail;
}) {
	return (
		<div className="space-y-1.5">
			<label className="text-xs font-bold uppercase tracking-wider text-muted">
				{label}
			</label>
			<select
				className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground transition-colors hover:border-accent focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
				value={value}
				onChange={(e) => onChange(e.target.value)}
			>
				{options.map((opt) => (
					<option key={opt.id} value={opt.id}>
						{opt.labelVi} (N={opt.n.toLocaleString()})
					</option>
				))}
			</select>
			{detail && (
				<p className="text-[10px] text-muted leading-relaxed">
					📖 {detail.source}
				</p>
			)}
		</div>
	);
}

// ─── Percentile Comparison Table ──────────────────────────────────────────────

function PercentileComparisonTable({
	traits,
	normativeMap,
}: {
	traits: TraitScore[];
	normativeMap: Record<string, PercentileResult>;
}) {
	return (
		<div className="overflow-x-auto">
			<table className="w-full text-sm">
				<thead>
					<tr className="border-b border-border bg-background-secondary/50">
						<th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-muted">
							Đặc điểm
						</th>
						<th className="px-4 py-2.5 text-center text-xs font-bold uppercase tracking-wider text-muted">
							Điểm của bạn
						</th>
						<th className="px-4 py-2.5 text-center text-xs font-bold uppercase tracking-wider text-muted">
							TB nhóm
						</th>
						<th className="px-4 py-2.5 text-center text-xs font-bold uppercase tracking-wider text-muted">
							Z-score
						</th>
						<th className="px-4 py-2.5 text-center text-xs font-bold uppercase tracking-wider text-muted">
							Percentile
						</th>
						<th className="px-4 py-2.5 text-center text-xs font-bold uppercase tracking-wider text-muted">
							Mức so sánh
						</th>
					</tr>
				</thead>
				<tbody className="divide-y divide-border">
					{traits.map((trait) => {
						const norm = normativeMap[trait.domain];
						if (!norm) return null;
						const viLabel = DOMAIN_LABELS_VI[trait.domain] ?? trait.label;
						return (
							<tr key={trait.domain} className="transition-colors hover:bg-surface-hover/50">
								<td className="px-4 py-2.5 font-medium text-foreground">
									{viLabel}
								</td>
								<td className="px-4 py-2.5 text-center font-bold tabular-nums text-foreground">
									{trait.score.toFixed(2)}
								</td>
								<td className="px-4 py-2.5 text-center tabular-nums text-muted">
									{norm.mean.toFixed(2)} ± {norm.sd.toFixed(2)}
								</td>
								<td className="px-4 py-2.5 text-center tabular-nums text-muted">
									<span className={norm.zScore > 0 ? 'text-success' : norm.zScore < -0.5 ? 'text-error' : ''}>
										{norm.zScore > 0 ? '+' : ''}{norm.zScore.toFixed(2)}
									</span>
								</td>
								<td className="px-4 py-2.5 text-center">
									<PercentileBadge percentile={norm.percentile} />
								</td>
								<td className="px-4 py-2.5 text-center text-xs text-muted">
									{norm.interpretationVi}
								</td>
							</tr>
						);
					})}
				</tbody>
			</table>
		</div>
	);
}

function PercentileBadge({ percentile }: { percentile: number }) {
	let colorClass = 'bg-background-secondary text-muted';
	if (percentile >= 75) colorClass = 'bg-success-subtle text-success';
	else if (percentile >= 60) colorClass = 'bg-teal-subtle text-teal';
	else if (percentile <= 25) colorClass = 'bg-error-subtle text-error';
	else if (percentile <= 40) colorClass = 'bg-warning-subtle text-warning';

	return (
		<span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold tabular-nums ${colorClass}`}>
			P{percentile}
		</span>
	);
}

// ─── Main Component ────────────────────────────────────────────────────────────

interface CrossTraitInsight {
	icon: string;
	title: string;
	description: string;
}

type OceanResult = NonNullable<PersonalityTestSessionDTO['result']>['ocean'];
type DarkTriadResult = NonNullable<PersonalityTestSessionDTO['result']>['darkTriad'];

function generateCrossTraitInsights(
	ocean: NonNullable<OceanResult>,
	dark: NonNullable<DarkTriadResult>,
): CrossTraitInsight[] {
	const insights: CrossTraitInsight[] = [];

	// Leadership profile
	if (ocean.extraversion.level === 'high' && ocean.conscientiousness.level !== 'low') {
		insights.push({
			icon: '🏆',
			title: 'Tiềm năng lãnh đạo',
			description: 'Sự kết hợp giữa hướng ngoại cao và kỷ luật tốt cho thấy bạn có tiềm năng dẫn dắt đội nhóm hiệu quả. Bạn vừa có năng lượng giao tiếp, vừa có khả năng tổ chức.',
		});
	}

	// Creative entrepreneur
	if (ocean.openMindedness.level === 'high' && dark.narcissism.level !== 'low') {
		insights.push({
			icon: '🚀',
			title: 'Nhà sáng tạo tự tin',
			description: 'Sự cởi mở cao kết hợp với tự tin cho thấy bạn có thể đổi mới VÀ thuyết phục người khác theo ý tưởng của mình — đặc điểm quan trọng cho khởi nghiệp.',
		});
	}

	// Strategic empathizer
	if (ocean.agreeableness.level === 'high' && dark.machiavellianism.level !== 'low') {
		insights.push({
			icon: '🎯',
			title: 'Nhà ngoại giao chiến lược',
			description: 'Bạn vừa có trái tim nồng ấm, vừa hiểu cách "chơi game" xã hội. Đây là sự kết hợp tuyệt vời cho đàm phán, HR, và quản lý xung đột.',
		});
	}

	// Stress risk
	if (ocean.negativeEmotionality.level === 'high' && ocean.conscientiousness.level === 'high') {
		insights.push({
			icon: '⚡',
			title: 'Nguy cơ cầu toàn quá mức',
			description: 'Kỷ luật cao + nhạy cảm cảm xúc có thể dẫn đến perfectionism. Bạn đặt tiêu chuẩn rất cao cho bản thân — hãy nhớ rằng "đủ tốt" đôi khi là tốt nhất.',
		});
	}

	// Calm under pressure
	if (ocean.negativeEmotionality.level === 'low' && dark.psychopathy.level === 'low') {
		insights.push({
			icon: '🧘',
			title: 'Bình tĩnh & đồng cảm',
			description: 'Bạn vừa ổn định cảm xúc, vừa quan tâm đến người khác — nền tảng lý tưởng cho tâm lý trị liệu, coaching, hoặc quản lý khủng hoảng.',
		});
	}

	// Lone wolf
	if (ocean.extraversion.level === 'low' && ocean.openMindedness.level === 'high') {
		insights.push({
			icon: '🐺',
			title: 'Nhà tư duy độc lập',
			description: 'Hướng nội kết hợp với cởi mở cao tạo nên hồ sơ của những nhà tư duy sâu sắc — nhà nghiên cứu, nhà văn, triết gia, hoặc kỹ sư giải quyết vấn đề phức tạp.',
		});
	}

	// Social butterfly with edge
	if (ocean.extraversion.level === 'high' && ocean.agreeableness.level === 'low') {
		insights.push({
			icon: '🦅',
			title: 'Giao tiếp có chọn lọc',
			description: 'Bạn thích giao tiếp nhưng không ngại thách thức ý kiến người khác — phù hợp cho debating, luật sư, hoặc chuyên gia tư vấn.',
		});
	}

	// Dark triad balance
	const darkAvg = (dark.machiavellianism.score + dark.narcissism.score + dark.psychopathy.score) / 3;
	if (darkAvg < 2.5) {
		insights.push({
			icon: '✨',
			title: 'Hồ sơ "Ánh sáng" chiếm ưu thế',
			description: 'Dark Triad tổng thể của bạn ở mức thấp — bạn là người đáng tin cậy, chân thành. Đây là nền tảng vững chắc cho các mối quan hệ lâu dài.',
		});
	} else if (darkAvg > 3.5) {
		insights.push({
			icon: '⚔️',
			title: 'Bản năng cạnh tranh mạnh',
			description: 'Dark Triad cao phản ánh bản năng sinh tồn và cạnh tranh. Hãy chuyển hướng năng lượng này vào mục tiêu tích cực — kinh doanh, thể thao, hoặc sáng tạo.',
		});
	}

	// Limit to top 4 most relevant
	return insights.slice(0, 4);
}

export default function PersonalityResultsDashboard({ session }: Props) {
	const result = session.result;

	// ── Normative percentile state ──
	const [normativeData, setNormativeData] = useState<PercentilesApiResponse | null>(null);
	const [oceanGroup, setOceanGroup] = useState('bfi2-internet');
	const [darkTriadGroup, setDarkTriadGroup] = useState('sd3-community');
	const [isLoadingPercentiles, setIsLoadingPercentiles] = useState(false);

	const fetchPercentiles = useCallback(async (oGroup: string, dtGroup: string) => {
		setIsLoadingPercentiles(true);
		try {
			const res = await fetch(
				`/api/personality-test/${session.id}/percentiles?oceanGroup=${oGroup}&darkTriadGroup=${dtGroup}`
			);
			if (res.ok) {
				const json = await res.json();
				setNormativeData(json.data);
			}
		} catch {
			// Silently fail — percentile comparison is non-critical
		} finally {
			setIsLoadingPercentiles(false);
		}
	}, [session.id]);

	// Fetch percentiles on mount and when reference groups change
	useEffect(() => {
		if (result?.isValid) {
			fetchPercentiles(oceanGroup, darkTriadGroup);
		}
	}, [result?.isValid, oceanGroup, darkTriadGroup, fetchPercentiles]);

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

	const normativeMap = normativeData?.percentiles ?? {};
	const oceanGroupOptions = normativeData?.availableGroups?.filter(g => g.type === 'ocean') ?? [];
	const darkTriadGroupOptions = normativeData?.availableGroups?.filter(g => g.type === 'darkTriad') ?? [];

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

			{/* ── Cross-Trait Insights ── */}
			{ocean && darkTriad && (
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.4, delay: 0.25 }}
					className="rounded-2xl border border-accent/20 bg-surface p-5 sm:p-6"
				>
					<div className="flex items-center gap-3 mb-4">
						<span className="text-2xl">🔍</span>
						<div>
							<h3 className="text-sm font-black text-foreground uppercase tracking-wider">
								Phân tích kết hợp đặc điểm
							</h3>
							<p className="text-xs text-muted">Cross-Trait Insights — Nhìn toàn diện hơn</p>
						</div>
					</div>
					<div className="grid gap-3 sm:grid-cols-2">
						{generateCrossTraitInsights(ocean, darkTriad).map((insight, i) => (
							<div key={i} className="rounded-xl border border-border bg-background-secondary/50 p-3">
								<div className="flex items-start gap-2">
									<span className="text-base mt-0.5">{insight.icon}</span>
									<div>
										<p className="text-xs font-bold text-foreground">{insight.title}</p>
										<p className="mt-1 text-[11px] leading-relaxed text-muted">{insight.description}</p>
									</div>
								</div>
							</div>
						))}
					</div>
				</motion.div>
			)}

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
								normative={normativeMap[trait.domain]}
								showInsight
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
								normative={normativeMap[trait.domain]}
								showInsight
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

			{/* ── Normative Percentile Comparison Section ── */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.4, delay: 0.5 }}
				className="rounded-2xl border border-accent/20 bg-surface overflow-hidden"
			>
				<div className="p-5 sm:p-6">
					<div className="flex items-center gap-3 mb-1">
						<span className="text-2xl">📊</span>
						<div>
							<h3 className="text-sm font-black text-foreground uppercase tracking-wider">
								So sánh Percentile — Normative Comparison
							</h3>
							<p className="text-xs text-muted mt-0.5">
								Vị trí của bạn so với nhóm tham chiếu nghiên cứu
							</p>
						</div>
					</div>

					{/* Reference group selectors */}
					<div className="mt-4 grid gap-4 sm:grid-cols-2">
						{oceanGroupOptions.length > 0 && (
							<ReferenceGroupSelector
								label="Nhóm tham chiếu OCEAN (Big Five)"
								options={oceanGroupOptions}
								value={oceanGroup}
								onChange={setOceanGroup}
								detail={normativeData?.referenceGroupDetails?.ocean}
							/>
						)}
						{darkTriadGroupOptions.length > 0 && (
							<ReferenceGroupSelector
								label="Nhóm tham chiếu Dark Triad"
								options={darkTriadGroupOptions}
								value={darkTriadGroup}
								onChange={setDarkTriadGroup}
								detail={normativeData?.referenceGroupDetails?.darkTriad}
							/>
						)}
					</div>

					{/* Loading state */}
					{isLoadingPercentiles && (
						<div className="mt-4 flex items-center justify-center py-6 text-sm text-muted">
							<div className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent mr-2" />
							Đang tính toán percentile...
						</div>
					)}

					{/* OCEAN percentile table */}
					{!isLoadingPercentiles && normativeData && (
						<div className="mt-5 space-y-5">
							<div>
								<h4 className="text-xs font-bold uppercase tracking-wider text-indigo mb-2">
									🌟 OCEAN — Big Five
								</h4>
								<PercentileComparisonTable
									traits={oceanTraits}
									normativeMap={normativeMap}
								/>
							</div>

							<div>
								<h4 className="text-xs font-bold uppercase tracking-wider text-rose mb-2">
									🌑 Dark Triad
								</h4>
								<PercentileComparisonTable
									traits={darkTraits}
									normativeMap={normativeMap}
								/>
							</div>

							{/* Interpretation guide */}
							<div className="rounded-lg bg-background-secondary p-4">
								<h4 className="text-xs font-bold text-foreground mb-2">📖 Hướng dẫn đọc kết quả</h4>
								<div className="grid gap-2 sm:grid-cols-2 text-[10px] text-muted leading-relaxed">
									<div>
										<p><strong>Percentile (P)</strong> cho biết % người trong nhóm tham chiếu có điểm thấp hơn bạn.</p>
										<p className="mt-1">Ví dụ: P72 nghĩa là bạn cao hơn 72% người trong nhóm.</p>
									</div>
									<div>
										<p><strong>Z-score</strong> cho biết bạn cách trung bình nhóm bao nhiêu độ lệch chuẩn.</p>
										<p className="mt-1">Z = 0 → đúng trung bình; Z &gt; 1 → cao hơn phần lớn; Z &lt; -1 → thấp hơn phần lớn.</p>
									</div>
								</div>
							</div>
						</div>
					)}
				</div>
			</motion.div>

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
