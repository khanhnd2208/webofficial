'use client';

/* ════════════════════════════════════════════════════════════════════════
   PersonalityTestHistory — List of past test sessions
   ════════════════════════════════════════════════════════════════════════ */

import Link from 'next/link';
import { motion } from 'framer-motion';

import type { PersonalityTestHistoryDTO } from '@/types/personalityTest';

interface Props {
	history: PersonalityTestHistoryDTO[];
}

export default function PersonalityTestHistory({ history }: Props) {
	if (history.length === 0) return null;

	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay: 0.2 }}
			className="rounded-2xl border border-border bg-surface p-5 sm:p-6"
		>
			<h3 className="text-sm font-black uppercase tracking-wider text-foreground">
				📜 Lịch sử bài test
			</h3>
			<p className="mt-1 text-xs text-muted">
				{history.length} lần làm bài
			</p>

			<div className="mt-4 space-y-2">
				{history.map((item, i) => (
					<Link
						key={item.id}
						href={`/personality-test/results/${item.id}`}
						className="group flex items-center justify-between rounded-xl border border-border bg-background p-3.5 transition-all hover:border-border-hover hover:bg-surface-hover"
					>
						<div className="flex items-center gap-3">
							<span className="text-lg">
								{item.status === 'completed' ? '✅' : item.status === 'invalid' ? '🚫' : '⏳'}
							</span>
							<div>
								<p className="text-sm font-bold text-foreground">
									{item.archetype ?? (item.status === 'invalid' ? 'Không hợp lệ' : 'Đang làm')}
								</p>
								<p className="text-xs text-muted">
									{item.completedAt
										? new Date(item.completedAt).toLocaleDateString('vi-VN', {
												day: 'numeric',
												month: 'short',
												year: 'numeric',
												hour: '2-digit',
												minute: '2-digit',
											})
										: new Date(item.createdAt).toLocaleDateString('vi-VN', {
												day: 'numeric',
												month: 'short',
												year: 'numeric',
											})}
								</p>
							</div>
						</div>
						<svg
							className="h-4 w-4 text-muted transition-transform group-hover:translate-x-0.5"
							viewBox="0 0 16 16"
							fill="none"
						>
							<path
								d="M6 4l4 4-4 4"
								stroke="currentColor"
								strokeWidth="1.5"
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
						</svg>
					</Link>
				))}
			</div>
		</motion.div>
	);
}
