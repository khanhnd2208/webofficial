import Link from 'next/link';

import { routes } from '@/config/routes';

export function AdminForbidden() {
	return (
		<main className="flex min-h-screen flex-col items-center justify-center px-6 py-16">
			<p className="text-xs font-bold uppercase tracking-widest text-muted">Không có quyền</p>
			<h1 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
				Bạn không thể mở khu quản trị
			</h1>
			<p className="mt-3 max-w-md text-center text-sm text-foreground-secondary">
				Tài khoản hiện tại không có quyền quản trị. Nếu đây là tài khoản của bạn, hãy đăng nhập bằng
				đúng Google đã được cấp quyền.
			</p>
			<div className="mt-8 flex flex-wrap items-center justify-center gap-3">
				<Link
					href={routes.account}
					className="inline-flex min-h-11 items-center rounded-full bg-foreground px-5 text-sm font-semibold text-background"
				>
					Về tài khoản
				</Link>
				<Link
					href={routes.home}
					className="inline-flex min-h-11 items-center rounded-full border border-border-strong px-5 text-sm font-semibold"
				>
					Trang chủ
				</Link>
			</div>
		</main>
	);
}
