'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import CompletionSeal from '@/components/motion/CompletionSeal';

export default function CompleteLessonButton({
	lessonId,
	initiallyCompleted,
	compact = false,
}: {
	lessonId: string;
	initiallyCompleted: boolean;
	compact?: boolean;
}) {
	const router = useRouter();
	const [completed, setCompleted] = useState(initiallyCompleted);
	const [justCompleted, setJustCompleted] = useState(false);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function markComplete() {
		if (completed) return;
		setBusy(true);
		setError(null);
		try {
			const res = await fetch(`/api/learning/lessons/${lessonId}/complete`, { method: 'POST' });
			const json = (await res.json()) as { ok: boolean; error?: string };
			if (!json.ok) throw new Error(json.error ?? 'Không đánh dấu được');
			setCompleted(true);
			setJustCompleted(true);
			router.refresh();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Lỗi');
		} finally {
			setBusy(false);
		}
	}

	if (completed) {
		if (compact) {
			return (
				<span className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[10px] border border-vermilion text-xs font-semibold text-vermilion">
					✓ Hoàn thành
				</span>
			);
		}
		return (
			<div className="flex flex-col items-start gap-4">
				{justCompleted ? (
					<CompletionSeal show animateEntrance label="Hoàn thành" />
				) : (
					<span className="inline-flex items-center gap-2 text-sm font-semibold text-vermilion">
						<span
							className="flex h-5 w-5 items-center justify-center rounded-full bg-vermilion text-[10px] text-paper"
							aria-hidden
						>
							✓
						</span>
						Đã hoàn thành bài học
					</span>
				)}
			</div>
		);
	}

	return (
		<div>
			{error ? (
				<p role="alert" className="mb-3 text-sm text-error">
					{error}
				</p>
			) : null}
			<button
				type="button"
				disabled={busy}
				onClick={() => void markComplete()}
				className={
					compact
						? 'min-h-11 w-full rounded-[10px] bg-ink px-3 py-2.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-paper disabled:opacity-50'
						: 'min-h-11 rounded-[10px] bg-ink px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-paper transition duration-200 hover:bg-ink/90 disabled:opacity-50'
				}
			>
				{busy ? 'Đang lưu…' : compact ? 'Hoàn thành' : 'Đánh dấu hoàn thành'}
			</button>
		</div>
	);
}
