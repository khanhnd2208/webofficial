import type { Metadata } from 'next';
import Link from 'next/link';

import SignInWithGoogleButton from './sign-in-with-google-button';
import { routes } from '@/config/routes';
import { SITE_NAME } from '@/config/site';

export const metadata: Metadata = {
	title: 'Đăng nhập',
	description: `Đăng nhập ${SITE_NAME} bằng Google để mở tài khoản của bạn.`,
	robots: { index: false, follow: false },
};

const ERROR_MESSAGES: Record<string, string> = {
	OAuthAccountNotLinked:
		'Email này đã được liên kết với một tài khoản khác. Vui lòng đăng nhập đúng tài khoản Google ban đầu hoặc thử lại.',
	OAuthCallbackError: 'Đã xảy ra lỗi khi xác thực với Google. Vui lòng thử lại.',
	OAuthSignin: 'Không thể kết nối đến Google. Vui lòng thử lại sau.',
	SessionRequired: 'Vui lòng đăng nhập để tiếp tục.',
	Default: 'Đã xảy ra lỗi đăng nhập. Vui lòng thử lại.',
};

function destinationLabel(from: string): string | null {
	if (!from || from === '/' || from.startsWith('http')) return null;
	if (from.startsWith('/admin')) return 'khu quản trị';
	if (from.startsWith('/bai-viet')) return 'bài viết';
	if (from.startsWith('/tai-khoan')) return 'tài khoản';
	return 'trang bạn vừa mở';
}

function normalizeCallbackUrl(value?: string): string {
	if (!value || value.startsWith('http')) return routes.home;
	if (value.startsWith('/dashboard')) return routes.accountLearning;
	if (value.startsWith('/giang-day')) return routes.learn;
	return value;
}

export default async function LoginPage({
	searchParams,
}: {
	searchParams?: Promise<{ from?: string; error?: string; callbackUrl?: string }>;
}) {
	const sp = await searchParams;
	const from = normalizeCallbackUrl(sp?.callbackUrl ?? sp?.from);
	const errorCode = sp?.error;
	const errorMessage = errorCode ? (ERROR_MESSAGES[errorCode] ?? ERROR_MESSAGES.Default) : null;
	const backLabel = destinationLabel(from);

	return (
		<main className="min-h-[calc(100svh-3.5rem)]">
			<div className="grid min-h-[calc(100svh-3.5rem)] lg:grid-cols-2">
				<aside className="relative hidden overflow-hidden border-r border-hairline bg-paper lg:flex lg:flex-col lg:justify-between lg:p-14 xl:p-20">
					<p className="font-display text-lg tracking-[0.12em] text-ink">{SITE_NAME}</p>
					<div>
						<p className="font-display text-4xl font-medium leading-snug text-ink xl:text-5xl">
							Viết để hiểu sâu.
						</p>
						<p className="mt-6 max-w-sm text-base leading-relaxed text-ink-secondary">
							Đăng nhập để mở tài khoản của bạn. Khu học tập công khai đang tạm đóng.
						</p>
					</div>
					<p className="font-mono text-[10px] uppercase tracking-[0.28em] text-ink-secondary">Boutique library</p>
				</aside>

				<div className="flex flex-col justify-start px-6 pb-10 pt-6 sm:px-10 sm:pt-10 lg:justify-center lg:px-16 lg:py-12">
					<div className="mx-auto w-full max-w-sm">
						<p className="font-display text-base tracking-[0.12em] text-ink lg:hidden">{SITE_NAME}</p>

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

						<h1 className="mt-5 font-display text-3xl font-medium text-ink sm:mt-8">Đăng nhập</h1>
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
							<SignInWithGoogleButton callbackUrl={from} />
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
