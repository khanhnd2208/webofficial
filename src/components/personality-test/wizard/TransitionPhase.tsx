'use client';

/* ════════════════════════════════════════════════════════════════════════
   TransitionPhase — Celebration screen between BFI and SD3 sections
   ════════════════════════════════════════════════════════════════════════ */

import { motion } from 'framer-motion';
import type { TransitionPhaseProps } from './types';

export default function TransitionPhase({
	config,
	totalBfiAnswered,
	onContinue,
}: TransitionPhaseProps) {
	return (
		<motion.div
			key="transition"
			initial={{ opacity: 0, scale: 0.95 }}
			animate={{ opacity: 1, scale: 1 }}
			exit={{ opacity: 0, scale: 0.95 }}
			className="rounded-2xl border border-border bg-surface p-8 sm:p-10"
		>
			<div className="text-center">
				<motion.div
					initial={{ scale: 0 }}
					animate={{ scale: 1 }}
					transition={{ type: 'spring', stiffness: 260, damping: 20 }}
					className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-success-subtle text-3xl"
				>
					🎉
				</motion.div>
				<h3 className="mt-5 text-xl font-black text-foreground">
					Tuyệt vời! Phần 1 Hoàn thành
				</h3>
				<p className="mt-0.5 text-xs text-muted italic">Awesome! Part 1 Complete</p>
				<p className="mt-1 text-sm font-semibold text-success">
					✅ {totalBfiAnswered}/{config.bfiQuestions.length} câu — Big Five (OCEAN) hoàn tất
				</p>
			</div>

			<div className="mt-6 rounded-xl border border-rose/20 bg-rose-subtle/30 p-5">
				<div className="flex items-center gap-3">
					<span className="text-2xl">🌑</span>
					<div>
						<h4 className="font-bold text-foreground">Tiếp theo: Bộ ba Bóng tối</h4>
						<p className="text-[10px] text-muted italic">Up next: Dark Triad</p>
						<p className="text-xs text-muted">28 câu • SD3 (Short Dark Triad)</p>
					</div>
				</div>
				<p className="mt-3 text-xs leading-relaxed text-muted">
					Phần này khám phá tư duy chiến lược, sự tự tin, và khả năng chấp nhận rủi ro.
					Không có đúng sai — hãy tiếp tục với phản ứng thật của bạn!
				</p>
				<p className="mt-1 text-[10px] leading-relaxed text-muted/70 italic">
					This part explores strategic thinking, self-confidence, and risk tolerance.
					No right or wrong answers — just keep going with your honest reactions!
				</p>
			</div>

			<div className="mt-4 text-center">
				<p className="text-xs text-muted mb-4">Còn {config.sd3Questions.length} câu nữa — khoảng 5 phút 💪</p>
				<button
					onClick={onContinue}
					className="rounded-xl bg-accent px-8 py-3.5 text-sm font-bold text-accent-foreground transition-all hover:bg-accent-hover hover:scale-[1.01] active:scale-[0.99]"
				>
					Sẵn sàng — Bắt đầu! →
				</button>
			</div>
		</motion.div>
	);
}
