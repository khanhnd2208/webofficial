type ResourceBadgeProps = {
	productStatus: 'concept' | 'prototype' | 'beta' | 'stable' | 'archived';
	access: 'public' | 'login' | 'invite';
};

const statusLabel: Record<ResourceBadgeProps['productStatus'], string> = {
	concept: 'Ý tưởng',
	prototype: 'Bản thử nghiệm',
	beta: 'Đang hoàn thiện',
	stable: 'Ổn định',
	archived: 'Đã lưu trữ',
};

const accessLabel: Record<ResourceBadgeProps['access'], string> = {
	public: 'Công khai',
	login: 'Cần đăng nhập',
	invite: 'Theo lời mời',
};

/**
 * Status/access badges for Góc của Khánh resources.
 * `concept` should not have a public route; still useful in admin previews.
 */
export function ResourceBadge({ productStatus, access }: ResourceBadgeProps) {
	return (
		<div className="flex flex-wrap gap-2">
			<span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-secondary">
				{statusLabel[productStatus]}
			</span>
			<span aria-hidden className="text-ink-secondary/40">
				·
			</span>
			<span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-secondary">
				{accessLabel[access]}
			</span>
		</div>
	);
}
