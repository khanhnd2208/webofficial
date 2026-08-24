import { McIcon } from '@/components/myclass/ui/McIcon';
import { ADMIN_TABLE_PAGE_SIZES } from '@/features/my-class/domain/listQuery';

export function StudioPagination({
	page,
	pageSize,
	total,
	totalPages,
	prevHref,
	nextHref,
	pageSizeHref,
}: {
	page: number;
	pageSize: number;
	total: number;
	totalPages: number;
	prevHref?: string;
	nextHref?: string;
	pageSizeHref: (size: number) => string;
}) {
	return (
		<div className="flex flex-wrap items-center justify-between gap-3 px-1 py-3 text-sm text-ink-secondary">
			<p>
				<span className="mc-num font-semibold text-ink">{total}</span> kết quả
				{totalPages > 1 ? (
					<>
						{' '}
						· trang <span className="mc-num">{page}</span> / <span className="mc-num">{totalPages}</span>
					</>
				) : null}
			</p>
			<div className="flex flex-wrap items-center gap-2">
				<div className="flex items-center gap-1" role="group" aria-label="Số dòng mỗi trang">
					{ADMIN_TABLE_PAGE_SIZES.map((size) => (
						<a
							key={size}
							href={pageSizeHref(size)}
							aria-current={size === pageSize ? 'page' : undefined}
							className={`inline-flex min-h-9 items-center rounded-[var(--mc-r-sm)] border px-3 text-xs font-semibold ${
								size === pageSize
									? 'border-ink bg-ink text-paper'
									: 'border-mc-rule text-ink hover:bg-surface-sunken'
							}`}
						>
							{size}/trang
						</a>
					))}
				</div>
				{totalPages > 1 ? (
					<div className="flex gap-2">
						{prevHref ? (
							<a
								href={prevHref}
								className="inline-flex min-h-9 items-center gap-1 rounded-[var(--mc-r-sm)] border border-mc-rule px-3 text-sm font-semibold text-ink hover:bg-surface-sunken"
							>
								<McIcon name="arrow_back" size={16} />
								Trước
							</a>
						) : (
							<span className="inline-flex min-h-9 items-center gap-1 rounded-[var(--mc-r-sm)] border border-mc-rule px-3 text-sm opacity-40">
								<McIcon name="arrow_back" size={16} />
								Trước
							</span>
						)}
						{nextHref ? (
							<a
								href={nextHref}
								className="inline-flex min-h-9 items-center gap-1 rounded-[var(--mc-r-sm)] border border-mc-rule px-3 text-sm font-semibold text-ink hover:bg-surface-sunken"
							>
								Tiếp
								<McIcon name="arrow_forward" size={16} />
							</a>
						) : (
							<span className="inline-flex min-h-9 items-center gap-1 rounded-[var(--mc-r-sm)] border border-mc-rule px-3 text-sm opacity-40">
								Tiếp
								<McIcon name="arrow_forward" size={16} />
							</span>
						)}
					</div>
				) : null}
			</div>
		</div>
	);
}
