'use client';

/* ════════════════════════════════════════════════════════════════════════
   IntroPhase — Welcome screen with start/resume options
   ════════════════════════════════════════════════════════════════════════ */

import { motion } from 'framer-motion';
import type { IntroPhaseProps } from './types';

export default function IntroPhase({
	config,
	answers,
	restored,
	savedProgress,
	onStart,
	onResume,
	onRestart,
}: IntroPhaseProps) {
	return (
		<motion.div
			key="intro"
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: -20 }}
			className="space-y-8"
		>
			<div className="rounded-2xl border border-border bg-surface p-8 sm:p-10">
				<div className="text-center">
					<div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-subtle text-3xl">
						🪞
					</div>
					<h2 className="mt-5 text-2xl font-black tracking-tight text-foreground sm:text-3xl">
						Khám phá Tính cách của bạn
					</h2>
					<p className="mt-1 text-xs text-muted italic">Discover Your Personality</p>
					<p className="mt-3 text-sm leading-relaxed text-muted max-w-lg mx-auto">
						Bài đánh giá này giúp bạn hiểu rõ tính cách — điểm mạnh, điểm cần lưu ý,
						và những gợi ý thiết thực cho phát triển bản thân và sự nghiệp.
					</p>
					<p className="mt-1 text-xs text-muted/70 max-w-lg mx-auto italic">
						This assessment helps you understand your personality — your strengths, areas to watch,
						and actionable insights for personal and career development.
					</p>
				</div>

				<div className="mt-8 grid gap-4 sm:grid-cols-2">
					<div className="rounded-xl border border-indigo/20 bg-indigo-subtle/30 p-5">
						<div className="flex items-center gap-3">
							<span className="text-2xl">🌟</span>
							<div>
								<h3 className="font-bold text-foreground">Phần 1 — 5 Nét tính cách lớn</h3>
								<p className="text-[10px] text-muted italic">Part 1 — Big Five Personality</p>
								<p className="text-xs text-muted">31 câu • BFI-2-S (Big Five)</p>
							</div>
						</div>
						<p className="mt-3 text-xs leading-relaxed text-muted">
							Khám phá 5 nét tính cách cốt lõi: Hướng ngoại, Dễ chịu, Tận tâm,
							Cảm xúc tiêu cực, và Cởi mở.
						</p>
						<p className="mt-1 text-[10px] leading-relaxed text-muted/70 italic">
							Explore 5 core traits: Extraversion, Agreeableness, Conscientiousness,
							Negative Emotionality, and Open-Mindedness.
						</p>
					</div>

					<div className="rounded-xl border border-rose/20 bg-rose-subtle/30 p-5">
						<div className="flex items-center gap-3">
							<span className="text-2xl">🌑</span>
							<div>
								<h3 className="font-bold text-foreground">Phần 2 — Bộ ba Bóng tối</h3>
								<p className="text-[10px] text-muted italic">Part 2 — Dark Triad</p>
								<p className="text-xs text-muted">28 câu • SD3 (Short Dark Triad)</p>
							</div>
						</div>
						<p className="mt-3 text-xs leading-relaxed text-muted">
							Khám phá 3 chiều ẩn: Tư duy chiến lược (Mưu lược), Sự tự tin (Ái kỷ),
							và Chấp nhận rủi ro (Thái nhân cách).
						</p>
						<p className="mt-1 text-[10px] leading-relaxed text-muted/70 italic">
							Discover 3 hidden dimensions: Strategic thinking (Machiavellianism),
							Self-confidence (Narcissism), and Risk tolerance (Psychopathy).
						</p>
					</div>
				</div>

				<div className="mt-6 rounded-xl bg-accent-subtle/40 border border-accent/15 p-4">
					<div className="flex items-start gap-2.5">
						<span className="text-base mt-0.5">💡</span>
						<div className="text-xs leading-relaxed text-foreground-secondary">
							<p className="font-bold text-foreground">Trước khi bắt đầu: <span className="font-normal text-muted italic text-[10px]">(Before you begin)</span></p>
							<ul className="mt-1.5 space-y-1 text-muted">
								<li>• <strong>{config.totalQuestions} câu hỏi</strong>, mất khoảng 10–15 phút</li>
								<li>• Không có câu trả lời đúng hay sai — chỉ chọn điều bạn cảm thấy đúng nhất</li>
								<li>• Đọc kỹ từng câu — có một vài câu kiểm tra sự tập trung 😉</li>
							</ul>
						</div>
					</div>
				</div>

				<button
					onClick={onStart}
					className="mt-6 w-full rounded-xl bg-accent py-3.5 text-sm font-bold text-accent-foreground transition-all hover:bg-accent-hover hover:scale-[1.01] active:scale-[0.99]"
				>
					Bắt đầu Đánh giá 🚀
				</button>

				{/* Resume button if saved progress exists */}
				{restored && Object.keys(answers).length > 0 && (
					<div className="mt-3 rounded-xl border border-accent/30 bg-accent-subtle/30 p-4 text-center">
						<p className="text-xs text-muted mb-2">
							👋 Chào mừng bạn trở lại! Bạn đã trả lời {Object.keys(answers).length}/{config.totalQuestions} câu
						</p>
						<div className="flex gap-2 justify-center">
							<button
								onClick={onResume}
								className="rounded-lg bg-accent px-4 py-2 text-xs font-bold text-accent-foreground transition-colors hover:bg-accent-hover"
							>
								Tiếp tục từ lần trước →
							</button>
							<button
								onClick={onRestart}
								className="rounded-lg border border-border px-4 py-2 text-xs font-bold text-muted transition-colors hover:text-foreground hover:bg-surface-hover"
							>
								Làm lại từ đầu
							</button>
						</div>
					</div>
				)}
			</div>
		</motion.div>
	);
}
