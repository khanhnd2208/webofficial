'use client';

import { McButton, McIcon } from '@/components/myclass/ui';

export default function ReaderFooterNav({
	done,
	nextTitle,
	onComplete,
	disabled,
	loading,
	compact,
}: {
	done: boolean;
	nextTitle: string | null;
	onComplete: () => void;
	disabled?: boolean;
	loading?: boolean;
	compact?: boolean;
}) {
	if (done && !nextTitle) {
		return (
			<div className="border-t border-mc-rule/40 pt-6">
				<p className="text-sm font-semibold text-mc-done">Bạn đã hoàn thành nội dung này.</p>
			</div>
		);
	}

	if (compact) {
		return (
			<McButton
				size="md"
				onClick={onComplete}
				disabled={disabled}
				loading={loading}
				className="w-full whitespace-nowrap"
			>
				{done ? 'Tiếp tục' : 'Đã hiểu'}
				{nextTitle ? <McIcon name="arrow_forward" size={20} /> : null}
			</McButton>
		);
	}

	return (
		<div className="flex flex-col justify-between gap-4 border-t border-mc-rule/40 pt-6 md:flex-row md:items-center">
			<div className="min-w-0">
				{nextTitle ? (
					<>
						<p className="mc-eyebrow mb-1">Tiếp theo</p>
						<p className="truncate text-xl font-semibold leading-7 text-ink">{nextTitle}</p>
					</>
				) : (
					<p className="mc-meta">Đánh dấu đã hiểu nội dung này</p>
				)}
			</div>
			<McButton
				size={compact ? 'md' : 'lg'}
				onClick={onComplete}
				disabled={disabled}
				loading={loading}
				className="group shrink-0"
			>
				{done ? 'Tiếp tục' : 'Đã hiểu'}
				{nextTitle ? (
					<McIcon
						name="arrow_forward"
						size={20}
						className="transition-transform group-hover:translate-x-1"
					/>
				) : null}
			</McButton>
		</div>
	);
}
