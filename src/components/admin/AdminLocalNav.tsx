'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { McIcon } from '@/components/myclass/ui/McIcon';
import { isAdminNavActive, type AdminNavItem } from '@/config/adminNavigation';

export function AdminLocalNav({
	items,
	action,
}: {
	items: AdminNavItem[];
	action?: { href: string; label: string; external?: boolean };
}) {
	const pathname = usePathname();

	return (
		<div className="border-b border-border bg-surface">
			<div className="flex items-center gap-2 overflow-x-auto px-3 py-2 sm:px-4">
				<nav aria-label="Điều hướng mục" className="flex min-w-0 flex-1 gap-1">
					{items.map((item) => {
						const active = isAdminNavActive(pathname, item.href, item.exact);
						return (
							<Link
								key={item.href}
								href={item.href}
								aria-current={active ? 'page' : undefined}
								className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-semibold ${
									active
										? 'bg-foreground text-background'
										: 'text-foreground-secondary hover:bg-surface-hover hover:text-foreground'
								}`}
							>
								<McIcon name={item.icon} size={16} />
								{item.label}
							</Link>
						);
					})}
				</nav>
				{action ? (
					<Link
						href={action.href}
						target={action.external ? '_blank' : undefined}
						rel={action.external ? 'noreferrer' : undefined}
						className="ml-auto inline-flex min-h-11 shrink-0 items-center gap-1 rounded-lg px-3 text-sm font-semibold text-foreground-secondary hover:bg-surface-hover hover:text-foreground"
					>
						{action.label}
						{action.external ? <McIcon name="open_in_new" size={14} /> : null}
					</Link>
				) : null}
			</div>
		</div>
	);
}
