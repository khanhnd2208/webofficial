import Link from 'next/link';
import { routes } from '@/config/routes';

export type McAuthUser = {
	name?: string | null;
	image?: string | null;
} | null;

function initials(name?: string | null) {
	const trimmed = name?.trim();
	if (!trimmed) return '?';
	return trimmed.slice(0, 1).toLocaleUpperCase('vi');
}

export function McAuthCorner({
	user,
	loginHref,
}: {
	user: McAuthUser;
	loginHref: string;
}) {
	const progressLink = (
		<Link
			href={routes.myClassProgress}
			className="mc-focus-ring inline-flex min-h-10 items-center rounded-[var(--mc-r-sm)] px-3 text-sm font-semibold text-ink-secondary hover:bg-surface-sunken hover:text-ink"
		>
			Tiến độ
		</Link>
	);

	if (!user) {
		return (
			<div className="flex items-center gap-1">
				{progressLink}
				<Link
					href={loginHref}
					className="mc-focus-ring inline-flex min-h-10 items-center rounded-[var(--mc-r-sm)] border border-mc-rule bg-paper px-3 text-sm font-semibold text-ink hover:bg-surface-sunken"
				>
					Đăng nhập
				</Link>
			</div>
		);
	}

	return (
		<div className="flex items-center gap-1">
			{progressLink}
			<Link
				href={routes.account}
				aria-label="Tài khoản"
				className="mc-focus-ring inline-flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-mc-rule bg-surface-container-highest text-sm font-semibold text-ink-secondary"
			>
				{user.image ? (
					<img src={user.image} alt="" className="h-full w-full object-cover" />
				) : (
					<span aria-hidden>{initials(user.name)}</span>
				)}
			</Link>
		</div>
	);
}
