'use client';

import { McIcon } from '@/components/myclass/ui/McIcon';
import type { SessionLifecycleAction } from '@/features/teaching/schemas';
import { GridPopover } from './GridPopover';

export function GridWeekActions({
	weekNumber,
	kind,
	open,
	finalized,
	cancelled,
	busy,
	onLifecycle,
	onToggle,
	onBulk,
}: {
	weekNumber: number;
	kind: 'điểm danh' | 'CP';
	open: boolean;
	finalized: boolean;
	cancelled: boolean;
	busy: boolean;
	onLifecycle?: (action: SessionLifecycleAction) => void;
	onToggle?: (open: boolean) => void;
	onBulk?: () => void;
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
				<GridPopover
					label={`Thao tác ${kind} tuần ${weekNumber}`}
					menu
					disabled={busy}
					trigger={<McIcon name="more_horiz" size={18} />}
				>
					{finalized ? (
						<button
							type="button"
							role="menuitem"
							onClick={() => (onLifecycle ? onLifecycle('unfinalize') : onToggle?.(true))}
						>
							<McIcon name="lock_open" size={18} />
							Bỏ chốt {kind} tuần {weekNumber}
						</button>
					) : (
						<>
							<button
								type="button"
								role="menuitem"
								onClick={() =>
									onLifecycle ? onLifecycle(open ? 'park' : 'open') : onToggle?.(!open)
								}
							>
								<McIcon name={open ? 'lock' : 'lock_open'} size={18} />
								{open ? 'Tạm khóa' : 'Mở'} {kind} tuần {weekNumber}
							</button>
							{onLifecycle ? (
								<button type="button" role="menuitem" onClick={() => onLifecycle('finalize')}>
									<McIcon name="check_circle" size={18} />
									Chốt {kind} tuần {weekNumber}
								</button>
							) : null}
						</>
					)}
					{open && onBulk ? (
						<button type="button" role="menuitem" onClick={onBulk}>
							<McIcon name="groups" size={18} />
							Tất cả có mặt
						</button>
					) : null}
					<p className="mc-grid-menu-hint">Chỉ buổi đã chốt mới tính điểm.</p>
				</GridPopover>
			) : null}
		</span>
	);
}
