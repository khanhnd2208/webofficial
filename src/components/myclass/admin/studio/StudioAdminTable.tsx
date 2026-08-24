'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

import { studioTableHref, type SortDir } from '@/features/my-class/domain/listQuery';

import { StudioDataTable, type StudioDataTableProps } from './StudioDataTable';

type Props<T> = Omit<StudioDataTableProps<T>, 'onSort' | 'prevHref' | 'nextHref' | 'pageSizeHref'> & {
	pathname: string;
	current: Record<string, string | undefined>;
	sortBy: string;
	sortDir: SortDir;
	page: number;
	pageSize: number;
	total: number;
	totalPages: number;
};

export function StudioAdminTable<T>({
	pathname,
	current,
	sortBy,
	sortDir,
	page,
	pageSize,
	total,
	totalPages,
	...props
}: Props<T>) {
	const router = useRouter();
	const [pending, startTransition] = useTransition();
	const hrefFor = (patch: Record<string, string | undefined | null>) =>
		studioTableHref(pathname, current, patch);

	return (
		<div className={pending ? 'opacity-60' : undefined}>
			<StudioDataTable
				{...props}
				sortBy={sortBy}
				sortDir={sortDir}
				page={page}
				pageSize={pageSize}
				total={total}
				totalPages={totalPages}
				onSort={(field) =>
					startTransition(() =>
						router.push(
							hrefFor({
								sortBy: field,
								sortDir: sortBy === field && sortDir === 'desc' ? 'asc' : 'desc',
								page: '1',
							}),
						),
					)
				}
				prevHref={page > 1 ? hrefFor({ page: String(page - 1) }) : undefined}
				nextHref={page < totalPages ? hrefFor({ page: String(page + 1) }) : undefined}
				pageSizeHref={(size) => hrefFor({ pageSize: String(size), page: '1' })}
			/>
		</div>
	);
}
