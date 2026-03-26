'use client';

/* ════════════════════════════════════════════════════════════════════════
   PersonalityResultsDashboard — Visual results display

   Design:
   - SVG radar/spider chart for OCEAN and Dark Triad
   - 5-tier level system: very_low / low / moderate / high / very_high
   - Expandable per-trait insight cards (what, career, tip, academic)
   - Cross-trait insights with action steps
   - Collapsible limitations & research context section
   ════════════════════════════════════════════════════════════════════════ */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

import type {
	PersonalityTestSessionDTO,
	TraitScore,
	ArchetypeProfile,
	PersonalityDomain,
} from '@/types/personalityTest';
import { DOMAIN_LABELS_VI } from '@/lib/personalityScoring';

// ─── 5-tier helpers ────────────────────────────────────────────────────────────

type FiveTier = 'very_low' | 'low' | 'moderate' | 'high' | 'very_high';

function getZTier(zScore: number | undefined): FiveTier {
	if (zScore === undefined) return 'moderate';
	if (zScore >= 1.5) return 'very_high';
	if (zScore >= 0.5) return 'high';
	if (zScore >= -0.5) return 'moderate';
	if (zScore >= -1.5) return 'low';
	return 'very_low';
}

function getLevelLabel(tier: FiveTier): string {
	return { very_low: 'Rất thấp', low: 'Thấp', moderate: 'Trung bình', high: 'Cao', very_high: 'Rất cao' }[tier];
}

function getLevelBadgeClass(tier: FiveTier): string {
	return {
		very_high: 'bg-error-subtle text-error',
		high: 'bg-rose-subtle text-rose',
		moderate: 'bg-warning-subtle text-warning',
		low: 'bg-teal-subtle text-teal',
		very_low: 'bg-indigo-subtle text-indigo',
	}[tier];
}

// ─── Trait Insight Data ────────────────────────────────────────────────────────

interface TraitInsight {
	icon: string;
	what: string;
	very_high: string;
	high: string;
	moderate: string;
	low: string;
	very_low: string;
	career: string;
	tip: string;
	academic: string;
}

const TRAIT_INSIGHTS: Record<PersonalityDomain, TraitInsight> = {
	extraversion: {
		icon: '🗣️',
		what: 'Extraversion phản ánh xu hướng tìm kiếm sự kích thích từ thế giới bên ngoài — mức năng lượng xã hội, tính quyết đoán, và cảm xúc tích cực.',
		very_high: 'Bạn cực kỳ hướng ngoại — luôn tràn đầy năng lượng trong đám đông, chủ động dẫn dắt và khởi xướng. Hãy đảm bảo bạn cũng biết lắng nghe chứ không chỉ nói.',
		high: 'Bạn thích giao tiếp và làm việc nhóm, dễ dàng kết nối với người khác. Môi trường năng động phù hợp với bạn.',
		moderate: 'Bạn linh hoạt — thoải mái cả khi giao tiếp lẫn khi làm việc độc lập. Bạn điều chỉnh theo tình huống.',
		low: 'Bạn hướng nội — cần thời gian riêng để nạp năng lượng. Bạn thường lắng nghe sâu và suy nghĩ trước khi nói.',
		very_low: 'Bạn rất hướng nội và ưu tiên sự yên tĩnh. Tương tác xã hội có thể khá mệt mỏi — hãy biết giới hạn của mình.',
		career: 'E cao → Sales, quản lý, PR, diễn thuyết. E thấp → Nghiên cứu, lập trình, phân tích, viết.',
		tip: 'Hướng ngoại cao không có nghĩa là tốt hơn — cần phù hợp với bối cảnh công việc và cuộc sống.',
		academic: 'Soto & John (2017) cho thấy Extraversion dự báo sự thỏa mãn trong công việc nhóm và vai trò lãnh đạo.',
	},
	agreeableness: {
		icon: '🤝',
		what: 'Agreeableness phản ánh xu hướng hành xử hòa hợp, từ bi và tin tưởng người khác — đây là thước đo của sự hợp tác xã hội.',
		very_high: 'Bạn cực kỳ tốt bụng, luôn đặt người khác lên hàng đầu. Hãy cẩn thận: bạn có thể bị lợi dụng hoặc kiệt sức vì quên mất nhu cầu bản thân.',
		high: 'Bạn rất hợp tác, đồng cảm và sẵn sàng giúp đỡ. Đây là nền tảng tốt cho các mối quan hệ bền vững.',
		moderate: 'Bạn cân bằng giữa đồng cảm và lý trí — biết giúp đỡ nhưng cũng giữ vững lập trường khi cần.',
		low: 'Bạn thiên về phân tích logic hơn cảm xúc. Bạn đưa ra quyết định khó mà không bị ảnh hưởng bởi áp lực xã hội.',
		very_low: 'Bạn rất độc lập và ít quan tâm đến sự đồng thuận xã hội. Điều này giúp bạn quyết đoán nhưng có thể gây xung đột.',
		career: 'A cao → Chăm sóc, HR, giảng dạy, y tế. A thấp → Luật, đàm phán, kinh doanh cạnh tranh.',
		tip: 'A cao + Machiavellian thấp = rất đáng tin cậy. Chú ý đặt ranh giới cá nhân lành mạnh.',
		academic: 'Agreeableness dự báo ít xung đột và nhiều mối quan hệ xã hội chất lượng hơn (DeYoung et al., 2010).',
	},
	conscientiousness: {
		icon: '📋',
		what: 'Conscientiousness phản ánh mức độ có tổ chức, kỷ luật và hướng đến mục tiêu — thước đo tốt nhất về hiệu suất công việc và học tập trong Big Five.',
		very_high: 'Bạn cực kỳ có kỷ luật và tổ chức. Rủi ro: perfectionism quá mức có thể dẫn đến stress. Hãy học cách chấp nhận "đủ tốt".',
		high: 'Bạn đáng tin cậy, có kế hoạch và theo dõi tiến độ chặt chẽ. Đây là yếu tố dự báo mạnh cho thành công.',
		moderate: 'Bạn có thể có kỷ luật khi cần nhưng cũng linh hoạt thích nghi — một sự cân bằng tốt.',
		low: 'Bạn ưu tiên sự linh hoạt và tự phát hơn kế hoạch cứng nhắc. Công cụ nhắc nhở và danh sách việc cần làm sẽ giúp bạn.',
		very_low: 'Bạn thường ứng phó theo tình huống hơn lập kế hoạch. Đây là thách thức lớn cho deadline và mục tiêu dài hạn.',
		career: 'C là chỉ số dự báo hiệu suất mạnh nhất trong hầu hết mọi ngành nghề. C cao đặc biệt quan trọng trong tài chính, y tế, kỹ thuật.',
		tip: 'Conscientiousness có thể được cải thiện qua thói quen và hệ thống — nó ít "bẩm sinh" nhất trong Big Five.',
		academic: 'C là chỉ số dự báo GPA mạnh nhất trong Big Five, vượt qua cả IQ trong nhiều nghiên cứu (Noftle & Robins, 2007).',
	},
	negativeEmotionality: {
		icon: '🌊',
		what: 'Negative Emotionality (Neuroticism) phản ánh xu hướng trải nghiệm cảm xúc tiêu cực như lo lắng, buồn bã, tức giận — đây là chỉ số nhạy cảm với stress.',
		very_high: 'Bạn rất nhạy cảm với stress và trải nghiệm cảm xúc tiêu cực mạnh. Kỹ năng quản lý cảm xúc và tìm kiếm hỗ trợ là rất quan trọng.',
		high: 'Bạn có xu hướng lo lắng và bị ảnh hưởng bởi stress. Mindfulness và tập thể dục thường xuyên sẽ giúp ích đáng kể.',
		moderate: 'Bạn có sự ổn định cảm xúc ở mức bình thường — lo lắng khi cần nhưng phục hồi khá nhanh.',
		low: 'Bạn khá ổn định về cảm xúc và ít bị stress tác động. Đây là lợi thế lớn cho môi trường áp lực cao.',
		very_low: 'Bạn rất bình tĩnh dù trong tình huống căng thẳng. Điều này rất có giá trị cho lãnh đạo và quản lý khủng hoảng.',
		career: 'N thấp → Phù hợp cho lãnh đạo, phẫu thuật, phi công, chiến lược. N cao → Nghề cần cảm nhận sâu như nghệ thuật, tư vấn.',
		tip: 'N cao ≠ yếu đuối. Nó cho thấy bạn cảm nhận sâu sắc. Thiền định, tập thể dục và nhật ký cảm xúc có hiệu quả rõ ràng.',
		academic: 'N cao liên quan đến học thuật tốt trong các lĩnh vực sáng tạo nhưng là rào cản trong môi trường thi cử áp lực (Zeidner, 1998).',
	},
	openMindedness: {
		icon: '🎨',
		what: 'Open-Mindedness (Openness to Experience) phản ánh sự tò mò trí tuệ, cởi mở với ý tưởng mới, và khả năng suy nghĩ trừu tượng và sáng tạo.',
		very_high: 'Bạn cực kỳ tò mò và sáng tạo — luôn tìm kiếm ý tưởng mới, thích thách thức quy ước. Chú ý tính thực tiễn trong triển khai ý tưởng.',
		high: 'Bạn thích khám phá, suy nghĩ trừu tượng và đánh giá cao nghệ thuật và đổi mới. Bạn là người học hỏi suốt đời.',
		moderate: 'Bạn cân bằng giữa sáng tạo và thực tế — sẵn sàng thử cái mới nhưng cũng biết giữ những gì hiệu quả.',
		low: 'Bạn thiên về thực tế và thích những gì đã được chứng minh. Bạn ổn định và đáng tin cậy, thích quy trình rõ ràng.',
		very_low: 'Bạn rất truyền thống và ưu tiên tính nhất quán cao. Bạn có thể gặp khó khăn trong môi trường thay đổi nhanh.',
		career: 'O cao → Thiết kế, R&D, startup, nghệ thuật, triết học. O thấp → Kế toán, vận hành, kỹ thuật, hành chính.',
		tip: 'O cao liên quan đến thành công trong học thuật và sáng tạo. Tuy nhiên, cần kết hợp C để biến ý tưởng thành hiện thực.',
		academic: 'O là chỉ số dự báo mạnh nhất cho thành tích học thuật sau Conscientiousness, đặc biệt trong nghệ thuật và nhân văn (Chamorro-Premuzic, 2006).',
	},
	machiavellianism: {
		icon: '♟️',
		what: 'Machiavellianism đo lường xu hướng tư duy chiến lược về mối quan hệ, ưu tiên lợi ích cá nhân và sẵn sàng thao túng người khác để đạt mục tiêu.',
		very_high: 'Bạn rất chiến lược trong các mối quan hệ — luôn tính toán kết quả và vận dụng tình huống. Hãy cẩn thận về ranh giới đạo đức và hậu quả lâu dài.',
		high: 'Bạn có tư duy chiến lược rõ ràng và hiểu động lực của người khác. Điều này có thể là lợi thế trong kinh doanh nếu dùng đúng cách.',
		moderate: 'Bạn có nhận thức xã hội tốt nhưng không quá tính toán — một "trí tuệ xã hội" lành mạnh.',
		low: 'Bạn trực tính và chân thành, ít suy nghĩ chiến lược về mối quan hệ. Điều này tạo niềm tin nhưng đôi khi có thể bị lợi dụng.',
		very_low: 'Bạn rất thành thật và trực tiếp — gần như không sử dụng chiến thuật xã hội. Hãy học cách nhận biết khi người khác không có cùng quan điểm.',
		career: 'M vừa phải có giá trị trong đàm phán, chính trị, kinh doanh. M cao cần được kiểm soát bằng đạo đức nghề nghiệp.',
		tip: 'Ranh giới giữa "trí tuệ xã hội" và "thao túng" nằm ở ý định và tác động lên người khác.',
		academic: 'Machiavellianism thuộc Dark Triad (Paulhus & Williams, 2002). M vừa phải liên quan đến thành công nghề nghiệp ngắn hạn nhưng kém quan hệ dài hạn.',
	},
	narcissism: {
		icon: '👑',
		what: 'Narcissism đo lường mức độ tự tin, nhu cầu được công nhận, và cảm giác đặc biệt. Phân biệt với NPD lâm sàng — đây là thang đo đặc điểm trong dân số bình thường.',
		very_high: 'Bạn rất tự tin và muốn được công nhận mạnh mẽ. Hãy đảm bảo bạn lắng nghe và ghi nhận đóng góp người khác — đây là điểm mù phổ biến nhất.',
		high: 'Bạn tự tin và muốn được công nhận — lợi thế lớn cho trình bày, dẫn dắt và thuyết phục. Kiểm soát xu hướng cạnh tranh không lành mạnh.',
		moderate: 'Bạn tự tin ở mức lành mạnh — tin vào khả năng bản thân nhưng không cần phải luôn là trung tâm. Mức lý tưởng cho nhiều hoàn cảnh.',
		low: 'Bạn khiêm tốn và ít cần sự chú ý. Tốt cho teamwork nhưng hãy đảm bảo bạn tự vận động cho bản thân khi cần.',
		very_low: 'Bạn rất khiêm tốn và hiếm khi tìm kiếm sự công nhận. Điều này có thể khiến bạn bị bỏ qua trong môi trường cạnh tranh.',
		career: 'N vừa phải → CEO, diễn thuyết, chính trị, nghệ thuật biểu diễn. N quá cao có thể gây khó khăn trong teamwork.',
		tip: '"Healthy narcissism" (vừa phải) liên quan đến resilience và leadership. Phân biệt với NPD (rối loạn nhân cách) là quan trọng.',
		academic: 'Narcissism vừa phải liên quan đến sự tự tin học thuật và khả năng thuyết trình tốt hơn (Raskin & Terry, 1988).',
	},
	psychopathy: {
		icon: '⚡',
		what: 'Psychopathy đo lường mức độ thiếu đồng cảm, hành vi liều lĩnh và tìm kiếm cảm giác mạnh. Phân biệt với rối loạn tâm thần lâm sàng — đây là đặc điểm trong dân số bình thường.',
		very_high: 'Bạn có xu hướng tìm kiếm cảm giác mạnh mẽ và ít bị ảnh hưởng bởi hậu quả. Hãy chủ động phát triển đồng cảm và tìm kiếm thử thách xây dựng.',
		high: 'Bạn liều lĩnh và ít bị kiềm chế bởi sợ hãi — có thể là lợi thế trong môi trường rủi ro cao. Cần chú ý đến ảnh hưởng lên người xung quanh.',
		moderate: 'Bạn có sự bình tĩnh tốt trong tình huống căng thẳng nhưng vẫn quan tâm đến hậu quả và người khác.',
		low: 'Bạn đồng cảm cao và luôn cân nhắc ảnh hưởng của hành động. Đây là nền tảng tốt cho quan hệ bền vững và nghề nghiệp chăm sóc.',
		very_low: 'Bạn rất đồng cảm và cẩn thận — có thể gặp khó trong việc ra quyết định khó khăn mà không bị ảnh hưởng cảm xúc.',
		career: 'P thấp → Y tế, giảng dạy, tư vấn, xã hội học. P vừa phải có giá trị trong phẫu thuật khẩn, quân sự, cứu hộ.',
		tip: 'P thấp là lý tưởng cho đa số mối quan hệ cá nhân. P vừa phải giúp ra quyết định dưới áp lực không bị cảm xúc chi phối.',
		academic: 'Psychopathy thấp dự báo mối quan hệ chất lượng cao và ít hành vi rủi ro trong học thuật (Jones & Paulhus, 2014).',
	},
};

// ─── SVG Radar Chart ─────────────────────────────────────────────────────────

interface RadarChartProps {
	traits: { label: string; score: number; maxScore?: number }[];
	colorFill: string;
	colorStroke: string;
	size?: number;
}

function RadarChart({ traits, colorFill, colorStroke, size = 200 }: RadarChartProps) {
	const n = traits.length;
	if (n < 3) return null;
	const cx = size / 2;
	const cy = size / 2;
	const r = size * 0.38;
	const labelR = size * 0.49;

	const angles = traits.map((_, i) => (i / n) * 2 * Math.PI - Math.PI / 2);
	const toPoint = (angle: number, radius: number) => ({
		x: cx + radius * Math.cos(angle),
		y: cy + radius * Math.sin(angle),
	});
	const webLevels = [0.33, 0.66, 1.0];

	const scorePoints = traits.map((t, i) => {
		const norm = Math.max(0, Math.min(1, (t.score - 1) / ((t.maxScore ?? 5) - 1)));
		return toPoint(angles[i], norm * r);
	});

	const scorePath =
		scorePoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') + ' Z';

	return (
		<svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
			{webLevels.map((lvl) => {
				const pts = angles.map((a) => toPoint(a, lvl * r));
				const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') + ' Z';
				return <path key={lvl} d={d} fill="none" stroke="currentColor" strokeWidth="0.5"
					className="text-border opacity-60" strokeDasharray={lvl < 1 ? '2,2' : undefined} />;
			})}
			{angles.map((a, i) => {
				const end = toPoint(a, r);
				return <line key={i} x1={cx} y1={cy} x2={end.x.toFixed(1)} y2={end.y.toFixed(1)}
					stroke="currentColor" strokeWidth="0.5" className="text-border opacity-50" />;
			})}
			<path d={scorePath} fill={colorFill} stroke={colorStroke} strokeWidth="2" strokeLinejoin="round" />
			{scorePoints.map((p, i) => (
				<circle key={i} cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r="3" fill={colorStroke} />
			))}
			{traits.map((t, i) => {
				const lp = toPoint(angles[i], labelR);
				const anchor = lp.x < cx - 5 ? 'end' : lp.x > cx + 5 ? 'start' : 'middle';
				return (
					<text key={i} x={lp.x.toFixed(1)} y={lp.y.toFixed(1)}
						textAnchor={anchor} dominantBaseline="middle"
						fontSize="11" fill="currentColor" className="text-muted font-semibold">
						{t.label}
					</text>
				);
			})}
		</svg>
	);
}

// ─── Percentile Result type ────────────────────────────────────────────────────

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

// ─── TraitBar with expandable insight ─────────────────────────────────────────

function TraitBar({
	trait,
	colorClass,
	delay = 0,
	normative,
}: {
	trait: TraitScore;
	colorClass: string;
	delay?: number;
	normative?: PercentileResult;
}) {
	const [expanded, setExpanded] = useState(false);
	const percent = ((trait.score - 1) / 4) * 100;
	const viLabel = DOMAIN_LABELS_VI[trait.domain] ?? trait.label;
	const insight = TRAIT_INSIGHTS[trait.domain];
	const tier: FiveTier = normative
		? getZTier(normative.zScore)
		: trait.level === 'high' ? 'high' : trait.level === 'low' ? 'low' : 'moderate';
	const tierText = getLevelLabel(tier);
	const badgeClass = getLevelBadgeClass(tier);
	const meanPercent = normative ? ((normative.mean - 1) / 4) * 100 : null;

	return (
		<div className="rounded-xl border border-border/40 bg-background-secondary/30 p-3">
			<button className="w-full text-left" onClick={() => setExpanded((v) => !v)} aria-expanded={expanded}>
				<div className="flex items-center justify-between mb-2">
					<div className="flex items-center gap-2">
						{insight && <span className="text-sm">{insight.icon}</span>}
						<span className="text-sm font-bold text-foreground">{viLabel}</span>
						<span className="text-[10px] text-muted">({trait.label})</span>
					</div>
					<div className="flex items-center gap-2">
						<span className="text-sm font-black tabular-nums text-foreground">{trait.score.toFixed(2)}</span>
						<span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${badgeClass}`}>
							{tierText}
						</span>
						{normative && (
							<span className="text-[10px] text-muted tabular-nums" title={`Z = ${normative.zScore.toFixed(2)}`}>
								P{normative.percentile}
							</span>
						)}
						<span className="text-muted text-xs">{expanded ? '▲' : '▼'}</span>
					</div>
				</div>
				<div className="relative h-3 overflow-visible rounded-full bg-background-secondary">
					<motion.div
						className={`h-full rounded-full ${colorClass}`}
						initial={{ width: 0 }}
						animate={{ width: `${Math.max(percent, 2)}%` }}
						transition={{ duration: 0.8, delay, ease: 'easeOut' }}
					/>
					{meanPercent !== null && (
						<div
							className="absolute top-1/2 -translate-y-1/2 w-0.5 h-5 bg-foreground/40 rounded-full"
							style={{ left: `${meanPercent}%` }}
							title={`Nhóm tham chiếu TB: ${normative?.mean.toFixed(2)}`}
						/>
					)}
				</div>
				{normative && (
					<div className="mt-1 flex items-center gap-2 text-[10px] text-muted">
						<span>TB nhóm: {normative.mean.toFixed(2)}</span>
						<span>•</span>
						<span>{normative.interpretationVi}</span>
					</div>
				)}
			</button>
			<AnimatePresence>
				{expanded && insight && (
					<motion.div
						initial={{ opacity: 0, height: 0 }}
						animate={{ opacity: 1, height: 'auto' }}
						exit={{ opacity: 0, height: 0 }}
						transition={{ duration: 0.25 }}
						className="overflow-hidden"
					>
						<div className="mt-3 space-y-2 border-t border-border/30 pt-3">
							<p className="text-[11px] text-muted leading-relaxed">{insight.what}</p>
							<div className="rounded-lg bg-surface/60 px-3 py-2">
								<p className="text-[11px] font-semibold text-foreground mb-1">Điều này có nghĩa gì với bạn ({tierText}):</p>
								<p className="text-[11px] leading-relaxed text-foreground-secondary">{insight[tier]}</p>
							</div>
							<div className="grid grid-cols-2 gap-2">
								<div className="rounded-lg bg-indigo-subtle/40 px-2.5 py-2">
									<p className="text-[10px] font-bold text-indigo mb-1">💼 Phù hợp nghề nghiệp</p>
									<p className="text-[10px] leading-relaxed text-muted">{insight.career}</p>
								</div>
								<div className="rounded-lg bg-success-subtle/40 px-2.5 py-2">
									<p className="text-[10px] font-bold text-success mb-1">📚 Bối cảnh học thuật</p>
									<p className="text-[10px] leading-relaxed text-muted">{insight.academic}</p>
								</div>
							</div>
							<p className="text-[10px] text-amber-600 dark:text-amber-400 bg-warning-subtle/40 px-2.5 py-1.5 rounded-lg">💡 {insight.tip}</p>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
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
					<div className="rounded-xl border border-success/20 bg-success-subtle/50 p-4">
						<h4 className="flex items-center gap-2 text-sm font-bold text-success">
							<span>💪</span> Điểm mạnh
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
					<div className="rounded-xl border border-error/20 bg-error-subtle/50 p-4">
						<h4 className="flex items-center gap-2 text-sm font-bold text-error">
							<span>⚠️</span> Điểm mù
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
			<div className="text-4xl">😔</div>
			<h3 className="mt-4 text-xl font-black text-foreground">Chưa thể phân tích kết quả</h3>
			<p className="mt-2 text-sm text-muted leading-relaxed max-w-md mx-auto">
				Bài làm chưa đạt yêu cầu kiểm tra sự tập trung. Điều này có thể xảy ra nếu bạn
				làm vội hoặc không đọc kĩ câu hỏi — hãy thử lại khi có thời gian tập trung nhé!
				{reason && (
					<span className="mt-2 block text-xs text-error">Chi tiết: {reason}</span>
				)}
			</p>
			<Link
				href="/personality-test"
				className="mt-5 inline-block rounded-xl bg-accent px-6 py-3 text-sm font-bold text-accent-foreground transition-colors hover:bg-accent-hover"
			>
				Thử lại bài đánh giá →
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

// ─── Cross-trait insights ─────────────────────────────────────────────────────

interface CrossTraitInsight { icon: string; title: string; description: string; action: string; }
type OceanResult = NonNullable<PersonalityTestSessionDTO['result']>['ocean'];
type DarkTriadResult = NonNullable<PersonalityTestSessionDTO['result']>['darkTriad'];

function generateCrossTraitInsights(ocean: NonNullable<OceanResult>, dark: NonNullable<DarkTriadResult>): CrossTraitInsight[] {
	const ins: CrossTraitInsight[] = [];
	if (ocean.extraversion.level === 'high' && ocean.conscientiousness.level !== 'low')
		ins.push({ icon: '🏆', title: 'Tiềm năng lãnh đạo', description: 'Hướng ngoại cao + kỷ luật tốt = hồ sơ lãnh đạo hiệu quả. Bạn vừa có năng lượng giao tiếp, vừa có khả năng tổ chức.', action: 'Tìm kiếm vai trò trưởng nhóm, dẫn dắt một dự án nhỏ trong semester tới.' });
	if (ocean.openMindedness.level === 'high' && dark.narcissism.level !== 'low')
		ins.push({ icon: '🚀', title: 'Nhà sáng tạo tự tin', description: 'Cởi mở cao + tự tin = đổi mới VÀ thuyết phục người khác — đặc điểm quan trọng cho khởi nghiệp.', action: 'Viết ra 3 ý tưởng sáng tạo và chia sẻ với người khác để lấy phản hồi.' });
	if (ocean.negativeEmotionality.level === 'high' && ocean.conscientiousness.level === 'high')
		ins.push({ icon: '⚡', title: 'Nguy cơ cầu toàn quá mức', description: 'Kỷ luật cao + nhạy cảm cảm xúc → perfectionism. Bạn đặt tiêu chuẩn rất cao, đôi khi không cần thiết.', action: 'Thực hành kỹ thuật "done is better than perfect" — đặt deadline và dừng lại khi đến.' });
	if (ocean.negativeEmotionality.level === 'low' && dark.psychopathy.level === 'low')
		ins.push({ icon: '🧘', title: 'Bình tĩnh & Đồng cảm', description: 'Ổn định cảm xúc + đồng cảm cao = lý tưởng cho tư vấn, coaching, hoặc quản lý khủng hoảng.', action: 'Xem xét vai trò mentor hoặc peer support trong trường.' });
	if (ocean.extraversion.level === 'low' && ocean.openMindedness.level === 'high')
		ins.push({ icon: '🐺', title: 'Nhà tư duy độc lập', description: 'Hướng nội + cởi mở cao = nhà nghiên cứu, nhà văn, kỹ sư giải quyết vấn đề phức tạp.', action: 'Đặt thời gian "deep work" 2-3 giờ mỗi ngày không bị gián đoạn.' });
	if (ocean.agreeableness.level === 'high' && dark.machiavellianism.level !== 'low')
		ins.push({ icon: '🎯', title: 'Nhà ngoại giao chiến lược', description: 'Trái tim nồng ấm + hiểu động lực xã hội = phù hợp cho đàm phán, HR, và quản lý xung đột.', action: 'Đọc về "principled negotiation" (Fisher & Ury, Getting to Yes).' });
	const darkAvg = (dark.machiavellianism.score + dark.narcissism.score + dark.psychopathy.score) / 3;
	if (darkAvg < 2.5)
		ins.push({ icon: '✨', title: 'Ánh sáng chiếm ưu thế', description: 'Dark Triad tổng thể thấp — bạn là người đáng tin cậy, chân thành. Nền tảng tốt cho mối quan hệ lâu dài.', action: 'Phát huy lòng tin này bằng cách xây dựng mạng lưới quan hệ chân thực.' });
	else if (darkAvg > 3.5)
		ins.push({ icon: '⚔️', title: 'Bản năng cạnh tranh mạnh', description: 'Dark Triad cao phản ánh bản năng sinh tồn. Hãy chuyển hướng năng lượng vào mục tiêu tích cực.', action: 'Chọn môi trường cạnh tranh lành mạnh: thể thao, kinh doanh, sáng tạo.' });
	return ins.slice(0, 4);
}

// ─── Limitations Section ──────────────────────────────────────────────────────

function LimitationsSection() {
	const [open, setOpen] = useState(false);
	return (
		<div className="rounded-xl border border-border bg-background-secondary/50">
			<button
				className="flex w-full items-center justify-between px-4 py-3 text-left"
				onClick={() => setOpen((v) => !v)}
			>
				<span className="text-xs font-bold text-muted uppercase tracking-wider">📌 Giới hạn & Bối cảnh nghiên cứu</span>
				<span className="text-muted text-xs">{open ? '▲' : '▼'}</span>
			</button>
			<AnimatePresence>
				{open && (
					<motion.div
						initial={{ opacity: 0, height: 0 }}
						animate={{ opacity: 1, height: 'auto' }}
						exit={{ opacity: 0, height: 0 }}
						className="overflow-hidden"
					>
						<div className="px-4 pb-4 space-y-3">
							<div className="grid gap-2 sm:grid-cols-2">
								{[
									{ icon: '🔬', title: 'Tự báo cáo', text: 'Kết quả dựa trên tự đánh giá — có thể bị ảnh hưởng bởi social desirability bias và trạng thái tâm lý hiện tại.' },
									{ icon: '📏', title: 'Không phải chẩn đoán lâm sàng', text: 'BFI-2-S và SD3 là thang đo nghiên cứu, KHÔNG thay thế đánh giá tâm lý chuyên nghiệp hoặc chẩn đoán DSM.' },
									{ icon: '🌍', title: 'Bối cảnh văn hóa', text: 'Dữ liệu chuẩn hóa (normative) chủ yếu từ mẫu phương Tây. Có thể có sự khác biệt văn hóa trong cách diễn giải.' },
									{ icon: '⏰', title: 'Tính ổn định theo thời gian', text: 'Tính cách tương đối ổn định ở người trưởng thành nhưng có thể thay đổi theo sự kiện cuộc sống lớn. Test lại sau 6-12 tháng để theo dõi.' },
									{ icon: '🎯', title: 'Ngữ cảnh phụ thuộc', text: 'Không có profile nào là "tốt nhất" — giá trị của mỗi đặc điểm phụ thuộc vào ngữ cảnh công việc, môi trường và mục tiêu cá nhân.' },
									{ icon: '📊', title: 'Kích thước hiệu ứng', text: 'Tương quan giữa đặc điểm tính cách và kết quả cuộc sống thường ở mức r=0.2-0.4 — có ý nghĩa thống kê nhưng không quyết định hoàn toàn.' },
								].map((item) => (
									<div key={item.title} className="rounded-lg bg-surface/60 px-3 py-2">
										<p className="text-[10px] font-bold text-foreground">{item.icon} {item.title}</p>
										<p className="mt-0.5 text-[10px] leading-relaxed text-muted">{item.text}</p>
									</div>
								))}
							</div>
							<div className="rounded-lg bg-background-secondary px-3 py-2">
								<p className="text-[10px] font-bold text-foreground mb-1">📚 Tài liệu tham khảo</p>
								<ul className="space-y-0.5 text-[10px] text-muted">
									<li>• Soto, C. J., & John, O. P. (2017). The next Big Five Inventory (BFI-2). <em>Journal of Personality and Social Psychology, 113</em>(1), 117–143.</li>
									<li>• Jones, D. N., & Paulhus, D. L. (2014). Introducing the Short Dark Triad (SD3). <em>Assessment, 21</em>(1), 28–41.</li>
									<li>• Paulhus, D. L., & Williams, K. M. (2002). The Dark Triad of personality. <em>Journal of Research in Personality, 36</em>, 556–563.</li>
									<li>• Noftle, E. E., & Robins, R. W. (2007). Personality predictors of academic outcomes. <em>Journal of Personality and Social Psychology, 93</em>(1), 116–130.</li>
								</ul>
							</div>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}

// ─── Props ─────────────────────────────────────────────────────────────────────

interface Props { session: PersonalityTestSessionDTO; }

// ─── Main Component ────────────────────────────────────────────────────────────

export default function PersonalityResultsDashboard({ session }: Props) {
	const result = session.result;

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
			{/* Header */}
			<motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center">
				<p className="text-xs font-bold uppercase tracking-widest text-accent">Kết quả của bạn đã sẵn sàng ✨</p>
				<h2 className="mt-1 text-2xl font-black tracking-tight text-foreground sm:text-3xl">Hồ sơ tính cách toàn diện</h2>
				<p className="mt-2 text-sm text-muted max-w-md mx-auto">
					Dưới đây là bức tranh đầy đủ về tính cách của bạn — dựa trên hai mô hình tâm lý học được nghiên cứu rộng rãi.
				</p>
				{session.completedAt && (
					<p className="mt-2 text-xs text-muted">
						{new Date(session.completedAt).toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
					</p>
				)}
			</motion.div>

			{/* Archetype */}
			{archetype && <ArchetypeCard archetype={archetype} />}

			{/* Radar Charts */}
			<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
				className="grid gap-6 sm:grid-cols-2">
				<div className="rounded-2xl border border-indigo/20 bg-surface p-5 flex flex-col items-center">
					<p className="text-xs font-black uppercase tracking-wider text-indigo mb-1">🌟 5 nét tính cách lớn (OCEAN)</p>
					<p className="text-[10px] text-muted mb-4">BFI-2-S • Soto &amp; John, 2017</p>
					<RadarChart
						traits={oceanTraits.map(t => ({ label: (DOMAIN_LABELS_VI[t.domain] ?? t.label).split('/')[0], score: t.score }))}
						colorFill="rgba(99,102,241,0.2)"
						colorStroke="rgb(99,102,241)"
						size={220}
					/>
				</div>
				<div className="rounded-2xl border border-rose/20 bg-surface p-5 flex flex-col items-center">
					<p className="text-xs font-black uppercase tracking-wider text-rose mb-1">🌑 Bản năng xã hội (Dark Triad)</p>
					<p className="text-[10px] text-muted mb-4">SD3 • Jones &amp; Paulhus, 2014</p>
					<RadarChart
						traits={darkTraits.map(t => ({ label: (DOMAIN_LABELS_VI[t.domain] ?? t.label).split('/')[0], score: t.score }))}
						colorFill="rgba(244,63,94,0.2)"
						colorStroke="rgb(244,63,94)"
						size={220}
					/>
					<div className="mt-4 rounded-lg bg-background-secondary p-2.5 w-full">
						<p className="text-[10px] leading-relaxed text-muted text-center">
							⚠️ Dark Triad cao không tự động có nghĩa xấu — mức vừa phải phản ánh trí tuệ chiến lược và khả năng lãnh đạo.
						</p>
					</div>
				</div>
			</motion.div>

			{/* Cross-Trait Insights */}
			{ocean && darkTriad && (
				<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
					className="rounded-2xl border border-accent/20 bg-surface p-5 sm:p-6">
					<div className="flex items-center gap-3 mb-4">
						<span className="text-2xl">🔍</span>
						<div>
							<h3 className="text-sm font-black text-foreground uppercase tracking-wider">Điểm độc đáo của bạn</h3>
							<p className="text-xs text-muted">Những nhận định này xuất hiện khi kết hợp nhiều đặc điểm của bạn với nhau</p>
						</div>
					</div>
					<div className="grid gap-3 sm:grid-cols-2">
						{generateCrossTraitInsights(ocean, darkTriad).map((ins, i) => (
							<div key={i} className="rounded-xl border border-border bg-background-secondary/50 p-3">
								<div className="flex items-start gap-2">
									<span className="text-base mt-0.5">{ins.icon}</span>
									<div>
										<p className="text-xs font-bold text-foreground">{ins.title}</p>
										<p className="mt-1 text-[11px] leading-relaxed text-muted">{ins.description}</p>
										<p className="mt-1.5 text-[10px] text-accent font-semibold">→ {ins.action}</p>
									</div>
								</div>
							</div>
						))}
					</div>
				</motion.div>
			)}

			{/* Trait Detail Bars */}
			<div className="grid gap-6 lg:grid-cols-2">
				<motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }}
					className="rounded-2xl border border-indigo/20 bg-surface p-5 sm:p-6">
					<div className="flex items-center gap-3 mb-4">
						<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-subtle text-xl">🌟</div>
						<div>
							<h3 className="text-sm font-black text-foreground uppercase tracking-wider">5 nét tính cách lớn</h3>
							<p className="text-[10px] text-muted">👆 Nhấn vào từng mục để xem phân tích riêng cho bạn</p>
						</div>
					</div>
					<div className="space-y-3">
						{oceanTraits.map((trait, i) => (
							<TraitBar key={trait.domain} trait={trait}
								colorClass="bg-linear-to-r from-indigo to-purple"
								delay={0.35 + i * 0.1}
								normative={normativeMap[trait.domain]}
							/>
						))}
					</div>
				</motion.div>
				<motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}
					className="rounded-2xl border border-rose/20 bg-surface p-5 sm:p-6">
					<div className="flex items-center gap-3 mb-4">
						<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-subtle text-xl">🌑</div>
						<div>
							<h3 className="text-sm font-black text-foreground uppercase tracking-wider">Bản năng xã hội</h3>
							<p className="text-[10px] text-muted">👆 Nhấn vào từng mục để xem phân tích riêng cho bạn</p>
						</div>
					</div>
					<div className="space-y-3">
						{darkTraits.map((trait, i) => (
							<TraitBar key={trait.domain} trait={trait}
								colorClass="bg-linear-to-r from-rose to-red-500"
								delay={0.4 + i * 0.1}
								normative={normativeMap[trait.domain]}
							/>
						))}
					</div>
				</motion.div>
			</div>

			{/* Normative Percentile Comparison */}
			<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
				className="rounded-2xl border border-accent/20 bg-surface overflow-hidden">
				<div className="p-5 sm:p-6">
					<div className="flex items-center gap-3 mb-1">
						<span className="text-2xl">📊</span>
						<div>
							<h3 className="text-sm font-black text-foreground uppercase tracking-wider">Bạn ở đâu so với mọi người?</h3>
							<p className="text-xs text-muted mt-0.5">So sánh với nhóm tham chiếu nghiên cứu quốc tế</p>
						</div>
					</div>
					<div className="mt-4 grid gap-4 sm:grid-cols-2">
						{oceanGroupOptions.length > 0 && (
							<ReferenceGroupSelector label="Nhóm OCEAN" options={oceanGroupOptions} value={oceanGroup} onChange={setOceanGroup} detail={normativeData?.referenceGroupDetails?.ocean} />
						)}
						{darkTriadGroupOptions.length > 0 && (
							<ReferenceGroupSelector label="Nhóm Dark Triad" options={darkTriadGroupOptions} value={darkTriadGroup} onChange={setDarkTriadGroup} detail={normativeData?.referenceGroupDetails?.darkTriad} />
						)}
					</div>
					{isLoadingPercentiles && (
						<div className="mt-4 flex items-center justify-center py-6 text-sm text-muted">
							<div className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent mr-2" />Đang tính toán percentile...
						</div>
					)}
					{!isLoadingPercentiles && normativeData && (
						<div className="mt-5 space-y-5">
							<div>
								<h4 className="text-xs font-bold uppercase tracking-wider text-indigo mb-2">🌟 5 nét tính cách lớn</h4>
								<PercentileComparisonTable traits={oceanTraits} normativeMap={normativeMap} />
							</div>
							<div>
								<h4 className="text-xs font-bold uppercase tracking-wider text-rose mb-2">🌑 Bản năng xã hội</h4>
								<PercentileComparisonTable traits={darkTraits} normativeMap={normativeMap} />
							</div>
							<div className="rounded-lg bg-background-secondary p-4">
								<h4 className="text-xs font-bold text-foreground mb-2">🎯 Hệ thống 5 mức (dựa trên Z-score)</h4>
								<div className="flex flex-wrap gap-2">
									{(['very_high', 'high', 'moderate', 'low', 'very_low'] as FiveTier[]).map((t) => (
										<span key={t} className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold ${getLevelBadgeClass(t)}`}>
											{getLevelLabel(t)} {t === 'very_high' ? '(Z≥1.5)' : t === 'high' ? '(Z≥0.5)' : t === 'moderate' ? '(-0.5≤Z<0.5)' : t === 'low' ? '(Z≥-1.5)' : '(Z<-1.5)'}
										</span>
									))}
								</div>
							</div>
							<div className="rounded-lg bg-background-secondary p-4">
								<h4 className="text-xs font-bold text-foreground mb-2">📖 Hướng dẫn đọc kết quả</h4>
								<div className="grid gap-2 sm:grid-cols-2 text-[10px] text-muted leading-relaxed">
									<div><p><strong>Percentile (P)</strong> cho biết % người trong nhóm tham chiếu có điểm thấp hơn bạn.</p><p className="mt-1">P72 = bạn cao hơn 72% người trong nhóm.</p></div>
									<div><p><strong>Z-score</strong> cho biết bạn cách trung bình nhóm bao nhiêu độ lệch chuẩn.</p><p className="mt-1">Z=0 → đúng trung bình; Z&gt;1 → cao hơn phần lớn.</p></div>
								</div>
							</div>
						</div>
					)}
				</div>
			</motion.div>

			{/* Score Summary Table */}
			<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
				className="rounded-2xl border border-border bg-surface overflow-hidden">
				<div className="p-5 sm:p-6">
					<h3 className="text-sm font-black text-foreground uppercase tracking-wider">📋 Bảng điểm chi tiết</h3>
				</div>
				<div className="overflow-x-auto">
					<table className="w-full text-sm">
						<thead>
							<tr className="border-t border-border bg-background-secondary/50">
								{['Đặc điểm', 'Loại', 'Điểm', 'Z', 'Mức', 'Percentile'].map((h) => (
									<th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted">{h}</th>
								))}
							</tr>
						</thead>
						<tbody className="divide-y divide-border">
							{[...oceanTraits, ...darkTraits].map((trait) => {
								const isOcean = ['extraversion', 'agreeableness', 'conscientiousness', 'negativeEmotionality', 'openMindedness'].includes(trait.domain);
								const norm = normativeMap[trait.domain];
								const tier: FiveTier = norm ? getZTier(norm.zScore) : (trait.level === 'high' ? 'high' : trait.level === 'low' ? 'low' : 'moderate');
								return (
									<tr key={trait.domain} className="transition-colors hover:bg-surface-hover/50">
										<td className="px-4 py-3 font-medium text-foreground">
											{DOMAIN_LABELS_VI[trait.domain] ?? trait.label}
											<span className="ml-1 text-xs text-muted">({trait.label})</span>
										</td>
										<td className="px-4 py-3">
											<span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${isOcean ? 'bg-indigo-subtle text-indigo' : 'bg-rose-subtle text-rose'}`}>
												{isOcean ? 'OCEAN' : 'Dark'}
											</span>
										</td>
										<td className="px-4 py-3 font-bold tabular-nums">{trait.score.toFixed(2)}</td>
										<td className="px-4 py-3 tabular-nums text-muted">{norm ? `${norm.zScore > 0 ? '+' : ''}${norm.zScore.toFixed(2)}` : '—'}</td>
										<td className="px-4 py-3">
											<span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${getLevelBadgeClass(tier)}`}>{getLevelLabel(tier)}</span>
										</td>
										<td className="px-4 py-3 text-xs tabular-nums text-muted">{norm ? `P${norm.percentile}` : (trait.percentile !== null ? `P${trait.percentile}` : '—')}</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			</motion.div>

			{/* Actions */}
			<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
				className="flex flex-col gap-3 sm:flex-row sm:justify-center">
				<Link href="/personality-test" className="rounded-xl border border-border bg-surface px-6 py-3 text-center text-sm font-bold text-foreground transition-colors hover:bg-surface-hover">
					← Quay lại
				</Link>
				<Link href="/personality-test" className="rounded-xl bg-accent px-6 py-3 text-center text-sm font-bold text-accent-foreground transition-colors hover:bg-accent-hover">
					Làm lại bài đánh giá 🔁
				</Link>
			</motion.div>

			{/* Limitations */}
			<LimitationsSection />
		</div>
	);
}
