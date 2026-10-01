import Link from 'next/link';

import { routes } from '@/config/routes';

/** Shown to a signed-in account without admin rights instead of silently sending it elsewhere. */
export function AdminForbidden({
	area = 'khu quản trị',
	from,
}: {
	/** What the person tried to open, e.g. "Teaching". */
	area?: string;
	/** The page to come back to after switching to the admin Google account. */
	from: string;
}) {
	const loginHref = `${routes.login}?from=${encodeURIComponent(from)}`;
	return (
		<main className="flex min-h-screen flex-col items-center justify-center px-6 py-16">
			<p className="text-xs font-bold uppercase tracking-widest text-muted">Chỉ dành cho admin</p>
			<h1 className="mt-3 text-center text-2xl font-semibold tracking-tight text-foreground">
				Tài khoản này chưa mở được {area}
			</h1>
			<p className="mt-3 max-w-md text-center text-sm text-foreground-secondary">
				Bạn đang đăng nhập bằng một tài khoản không có quyền admin. Nếu bạn là giảng viên, hãy đổi
				sang đúng tài khoản Google đã được cấp quyền. Nếu bạn là học viên, lớp của bạn mở bằng link
				lớp giảng viên gửi.
			</p>
			<div className="mt-8 flex flex-wrap items-center justify-center gap-3">
				<Link
					href={routes.toc}
					className="inline-flex min-h-11 items-center rounded-full bg-foreground px-5 text-sm font-semibold text-background"
				>
					Mở mục lục
				</Link>
				<Link
					href={loginHref}
					className="inline-flex min-h-11 items-center rounded-full border border-border-strong px-5 text-sm font-semibold"
				>
					Đổi tài khoản
				</Link>
			</div>
		</main>
	);
}
