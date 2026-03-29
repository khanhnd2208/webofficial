'use client';

/* ════════════════════════════════════════════════════════════════════════
   ReviewPhase — Final summary and submit button
   ════════════════════════════════════════════════════════════════════════ */

import { motion } from 'framer-motion';
import type { ReviewPhaseProps } from './types';
import { formatTime } from './helpers';

export default function ReviewPhase({
	config,
	totalBfiAnswered,
	totalSd3Answered,
	totalAnswered,
	allComplete,
	elapsed,
	isSubmitting,
	onReview,
	onSubmit,
}: ReviewPhaseProps) {
	return (
		<motion.div
			key="review"
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: -20 }}
			className="space-y-6"
		>
			<div className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
				<div className="text-center">
					<motion.div
						initial={{ scale: 0 }}
						animate={{ scale: 1 }}
						transition={{ type: 'spring', stiffness: 260, damping: 20 }}
						className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-success-subtle text-2xl"
					>
						🎊
					</motion.div>
					<h3 className="mt-4 text-lg font-black text-foreground">Bạn đã trả lời tất cả!</h3>
					<p className="mt-0.5 text-xs text-muted italic">You answered everything!</p>
					<p className="mt-1 text-sm text-muted">
						Cảm ơn bạn. Vui lòng xem lại trước khi gửi.
					</p>
				</div>

				<div className="mt-5 grid gap-3 sm:grid-cols-2">
					<div className="rounded-xl border border-indigo/20 bg-indigo-subtle/30 p-4">
						<div className="flex items-center justify-between">
							<span className="text-sm font-bold text-foreground">🌟 Big Five</span>
							<span className={`text-xs font-bold ${totalBfiAnswered === config.bfiQuestions.length ? 'text-success' : 'text-error'}`}>
								{totalBfiAnswered}/{config.bfiQuestions.length} ✅
							</span>
						</div>
						<p className="mt-1 text-[10px] text-muted">BFI-2-S — Big Five Inventory</p>
					</div>
					<div className="rounded-xl border border-rose/20 bg-rose-subtle/30 p-4">
						<div className="flex items-center justify-between">
							<span className="text-sm font-bold text-foreground">🌑 Dark Triad</span>
							<span className={`text-xs font-bold ${totalSd3Answered === config.sd3Questions.length ? 'text-success' : 'text-error'}`}>
								{totalSd3Answered}/{config.sd3Questions.length} ✅
							</span>
						</div>
						<p className="mt-1 text-[10px] text-muted">SD3 — Short Dark Triad</p>
					</div>
				</div>

				<div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted">
					<span>⏱ {formatTime(elapsed)}</span>
					<span>•</span>
					<span>{totalAnswered}/{config.totalQuestions} items</span>
				</div>

				{!allComplete && (
					<div className="rounded-lg bg-warning-subtle p-3 text-center">
						<p className="text-xs font-bold text-warning">⚠ Bạn chưa trả lời hết câu hỏi — vui lòng quay lại kiểm tra</p>
					</div>
				)}

				<div className="mt-6 flex flex-col gap-3 sm:flex-row">
					<button
						onClick={onReview}
						className="flex-1 rounded-xl border border-border bg-background py-3 text-sm font-bold text-foreground transition-colors hover:bg-surface-hover"
					>
						← Xem lại câu hỏi
					</button>
					<button
						onClick={onSubmit}
						disabled={!allComplete || isSubmitting}
						className="flex-1 rounded-xl bg-accent py-3 text-sm font-bold text-accent-foreground transition-all hover:bg-accent-hover hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
					>
						{isSubmitting ? (
							<span className="inline-flex items-center gap-2">
								<svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
									<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
									<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
								</svg>
								Đang phân tích tính cách của bạn...
							</span>
						) : (
							'Xem kết quả của tôi 🚀'
						)}
					</button>
				</div>
			</div>
		</motion.div>
	);
}
