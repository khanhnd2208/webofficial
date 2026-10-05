import Link from 'next/link';

import { routes } from '@/config/routes';

import HistoryBackButton from './HistoryBackButton';
import SpotIllustration from './SpotIllustration';

/**
 * Body of every 404: says what was missing in plain words and always offers Mục lục (the site's
 * map) plus the page the visitor came from, never a dead end.
 */
export default function NotFoundPanel({
	eyebrow = '404',
	title = 'Không tìm thấy trang',
	children = 'Đường dẫn không tồn tại hoặc nội dung đã được di chuyển.',
	primary,
}: {
	eyebrow?: string;
	title?: string;
	children?: React.ReactNode;
	/** An extra destination that fits the missing page, e.g. the course catalog. */
	primary?: { href: string; label: string };
}) {
	return (
		<main className="flex min-h-[70vh] flex-col items-center justify-center px-6 py-16">
			<div className="mx-auto max-w-md text-center">
				<p className="text-caption font-semibold uppercase tracking-[0.08em] text-accent">
					{eyebrow}
				</p>
				<h1 className="mt-2.5 font-display type-page-title font-medium text-ink">{title}</h1>
				<div className="mt-3 text-body leading-relaxed text-foreground-secondary">{children}</div>
				<div className="mt-8 flex flex-wrap items-center justify-center gap-3">
					{primary ? (
						<Link
							href={primary.href}
							className="inline-flex min-h-11 items-center justify-center rounded-full bg-foreground px-5 text-control font-semibold text-background transition-colors hover:bg-foreground-secondary"
						>
							{primary.label}
						</Link>
					) : null}
					<Link
						href={routes.toc}
						className={
							primary
								? 'inline-flex min-h-11 items-center justify-center rounded-full border border-border-strong px-5 text-control font-semibold text-foreground transition-colors hover:bg-surface-hover'
								: 'inline-flex min-h-11 items-center justify-center rounded-full bg-foreground px-5 text-control font-semibold text-background transition-colors hover:bg-foreground-secondary'
						}
					>
						Mở mục lục
					</Link>
				</div>
				<HistoryBackButton className="mt-5 text-control font-semibold text-foreground-secondary hover:text-foreground" />
			</div>
		</main>
	);
}
