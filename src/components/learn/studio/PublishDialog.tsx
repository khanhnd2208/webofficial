'use client';

import type { CheckItem } from '@/features/learn/publishChecklist';

import StudioDialog from './StudioDialog';

function List({
	title,
	items,
	onJump,
}: {
	title: string;
	items: CheckItem[];
	onJump: (sectionId: string) => void;
}) {
	if (!items.length) return null;
	return (
		<section>
			<h3>{title}</h3>
			<ul className="ln-preview__list">
				{items.map((item) => (
					<li key={item.id}>
						<p>{item.message}</p>
						{item.sectionId ? (
							<button type="button" className="ln-link-btn" onClick={() => onJump(item.sectionId!)}>
								Đi tới mục
							</button>
						) : null}
					</li>
				))}
			</ul>
		</section>
	);
}

export default function PublishDialog({
	title,
	blockers,
	warnings,
	busy,
	onClose,
	onJump,
	onPublish,
}: {
	title: string;
	blockers: CheckItem[];
	warnings: CheckItem[];
	busy: boolean;
	onClose: () => void;
	onJump: (sectionId: string) => void;
	onPublish: () => void;
}) {
	const blocked = blockers.length > 0;
	return (
		<StudioDialog
			title={`Xuất bản "${title}"?`}
			size="narrow"
			busy={busy}
			onClose={onClose}
			footer={
				<div className="ln-confirm">
					<button type="button" className="ln-btn" disabled={busy} onClick={onClose}>
						Hủy
					</button>
					<button
						type="button"
						className="ln-btn ln-btn--primary"
						disabled={busy || blocked}
						onClick={onPublish}
					>
						{busy ? 'Đang lưu…' : warnings.length ? 'Vẫn xuất bản' : 'Xuất bản'}
					</button>
				</div>
			}
		>
			<List title="Cần sửa trước khi xuất bản" items={blockers} onJump={onJump} />
			<List title="Nên xem lại" items={warnings} onJump={onJump} />
			{!blockers.length && !warnings.length ? <p>Khóa đã sẵn sàng để học viên mở.</p> : null}
		</StudioDialog>
	);
}
