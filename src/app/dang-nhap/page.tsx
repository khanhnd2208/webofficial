import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import SignInWithGoogleButton from './sign-in-with-google-button';
import { routes } from '@/config/routes';
import { SITE_NAME } from '@/config/site';
import { auth } from '@/lib/auth';
import { authErrorMessage } from '@/lib/auth/errors';
import {
	destinationLabel,
	loginRedirectTarget,
	sanitizeAuthRedirect,
} from '@/lib/auth/safeRedirect';

export const metadata: Metadata = {
	title: 'Đăng nhập',
	description: `Đăng nhập ${SITE_NAME} bằng Google để mở tài khoản của bạn.`,
	robots: { index: false, follow: false },
};

export default async function LoginPage({
	searchParams,
}: {
	searchParams?: Promise<{ from?: string; error?: string; callbackUrl?: string }>;
}) {
	const sp = await searchParams;
	const session = await auth();
	const requested = sp?.callbackUrl ?? sp?.from;

	if (session?.user) {
		redirect(sanitizeAuthRedirect(requested, { role: session.user.role }));
	}

	const from = loginRedirectTarget(requested);

	const errorMessage = authErrorMessage(sp?.error);
	const backLabel = destinationLabel(from);

	return (
		<main className="min-h-[calc(100svh-3.5rem)]">
			<div className="grid min-h-[calc(100svh-3.5rem)] lg:grid-cols-2">
				<aside className="relative hidden overflow-hidden border-r border-hairline bg-paper lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
					<p className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-accent">
						{SITE_NAME}
					</p>
					<div>
						<p className="font-display type-page-title font-medium text-ink">Khu học tập</p>
						<p className="type-lead mt-4 max-w-sm text-ink-secondary">
							Dành cho học viên đã được ghi danh vào lớp hoặc chương trình của Khánh.
						</p>
					</div>
					<p className="text-sm text-ink-secondary">Duy Khánh · Giảng viên</p>
				</aside>

				<div className="flex flex-col justify-start px-6 pb-10 pt-6 sm:px-10 sm:pt-10 lg:justify-center lg:px-16 lg:py-12">
					<div className="mx-auto w-full max-w-sm">
						<p className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-accent lg:hidden">
							{SITE_NAME}
						</p>

						{errorMessage ? (
							<div
								role="alert"
								className="mt-4 rounded-[10px] border border-vermilion/40 bg-accent-subtle px-4 py-3 text-sm text-ink sm:mt-6"
							>
								<p className="font-semibold">Không đăng nhập được</p>
								<p className="mt-1 text-ink-secondary">{errorMessage}</p>
								<p className="mt-2 text-xs text-ink-secondary">
									Thử lại bên dưới. Nếu vẫn lỗi, dùng đúng tài khoản Google đã liên kết.
								</p>
							</div>
						) : null}

						<h1 className="mt-5 font-display type-page-title font-medium text-ink sm:mt-8">
							Đăng nhập
						</h1>
						<p className="mt-2 text-sm text-ink-secondary">
							Tiếp tục với Google để mở tài khoản.
							{backLabel ? (
								<>
									{' '}
									Sau khi đăng nhập, bạn sẽ quay lại <span className="text-ink">{backLabel}</span>.
								</>
							) : null}
						</p>

						<div className="mt-6 sm:mt-8">
							<SignInWithGoogleButton redirectTo={from} />
						</div>

						{errorMessage ? (
							<p className="mt-3 text-center text-xs text-ink-secondary">
								Nút phía trên vẫn dùng được để thử lại.
							</p>
						) : null}

						<p className="mt-8 text-center text-xs text-ink-secondary sm:mt-10">
							<Link href={routes.home} className="hover:text-ink">
								← Về trang chủ
							</Link>
						</p>
					</div>
				</div>
			</div>
		</main>
	);
}
