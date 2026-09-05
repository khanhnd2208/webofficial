'use client';

import { McIcon } from '@/components/myclass/ui/McIcon';
import type { SessionLifecycleAction } from '@/features/teaching/schemas';

export function GridWeekActions({
	weekNumber,
	kind,
	open,
	finalized,
	cancelled,
	busy,
	onLifecycle,
	onToggle,
}: {
	weekNumber: number;
	kind: 'điểm danh' | 'CP';
	open: boolean;
	finalized: boolean;
	cancelled: boolean;
	busy: boolean;
	onLifecycle?: (action: SessionLifecycleAction) => void;
	onToggle?: (open: boolean) => void;
}) {
	const state = cancelled ? 'Đã hủy' : finalized ? 'Đã chốt' : open ? 'Đang nhập' : 'Chưa chốt';
	return (
		<span className="mc-grid-week-controls">
			<span
				className="mc-grid-week-state"
				data-state={cancelled ? 'cancelled' : finalized ? 'finalized' : open ? 'open' : 'draft'}
			>
				{state}
			</span>
			{!cancelled && (onLifecycle || onToggle) ? (
				<span className="mc-grid-week-buttons">
					<button
						type="button"
						className="mc-grid-week-action"
						disabled={busy}
						aria-label={`${finalized ? 'Mở lại' : open ? 'Tạm khóa' : 'Mở'} ${kind} tuần ${weekNumber}`}
						title={
							finalized
								? 'Mở nhập lại (cần bỏ chốt)'
								: open
									? 'Đang mở nhập · Bấm để tạm khóa'
									: 'Đang khóa nhập · Bấm để mở'
						}
						onClick={() =>
							onLifecycle
								? onLifecycle(finalized ? 'unfinalize' : open ? 'park' : 'open')
								: onToggle?.(finalized || !open)
						}
					>
						<McIcon name={open && !finalized ? 'lock_open' : 'lock'} size={18} />
					</button>
					{onLifecycle ? (
						<button
							type="button"
							className="mc-grid-week-action"
							disabled={busy}
							data-finalized={finalized}
							aria-label={`${finalized ? 'Bỏ chốt' : 'Chốt'} ${kind} tuần ${weekNumber}`}
							title={finalized ? 'Đã chốt · Bấm để bỏ chốt' : 'Chốt buổi để tính điểm'}
							onClick={() => onLifecycle(finalized ? 'unfinalize' : 'finalize')}
						>
							<McIcon name={finalized ? 'verified' : 'check_circle'} size={18} />
						</button>
					) : null}
				</span>
			) : null}
		</span>
	);
}
