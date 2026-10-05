import type { Metadata } from 'next';
import { cookies, headers } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import InAppBrowserNotice from './in-app-browser-notice';
import SignInWithGoogleButton from './sign-in-with-google-button';
import SiteTopBar from '@/components/site/SiteTopBar';
import SpotIllustration from '@/components/site/SpotIllustration';
import SwitchAccountButton from './switch-account-button';
import { isSignInRequiredPath } from '@/config/navigation';
import { routes } from '@/config/routes';
import { SITE_NAME } from '@/config/site';
import { auth } from '@/lib/auth';
import { AUTH_CALLBACK_URL_COOKIE } from '@/lib/auth.config';
import { authErrorMessage } from '@/lib/auth/errors';
import {
	destinationLabel,
	loginRedirectTarget,
	sameSiteReferrerPath,
} from '@/lib/auth/safeRedirect';

export const metadata: Metadata = {
	title: 'Đăng nhập',
	description: `Đăng nhập ${SITE_NAME} bằng Google để mở tài khoản của bạn.`,
	robots: { index: false, follow: false },
};

export default async function LoginPage({
	searchParams,
}: {
	searchParams?: Promise<{ from?: string; error?: string; callbackUrl?: string; chon?: string }>;
}) {
	const [sp, session, headerList, cookieStore] = await Promise.all([
		searchParams,
		auth(),
		headers(),
		cookies(),
	]);
	// A failed Google round trip lands here with only `?error=`; the destination it was heading
	// to is still in the Auth.js callback cookie, so retrying keeps the original page.
	const pendingCallback = sp?.error ? cookieStore.get(AUTH_CALLBACK_URL_COOKIE)?.value : null;
	const referrer = sameSiteReferrerPath(
		headerList.get('referer'),
		headerList.get('x-forwarded-host') ?? headerList.get('host'),
	);
	const from = loginRedirectTarget(sp?.callbackUrl, sp?.from, pendingCallback, referrer);

	// Signed in and sent here with a destination (a gate, a retry after a Google error): go on.
	// Without one (the page opened directly or from history) say who is signed in instead of
	// bouncing them somewhere they did not ask for.
	if (session?.user && (sp?.from || sp?.callbackUrl || sp?.error)) {
		redirect(from);
	}

	const errorMessage = authErrorMessage(sp?.error);
	const backLabel = destinationLabel(from);
	// "Quay lại" must not lead a signed-out visitor straight back here.
	const backIsToc = from === routes.home || (!session?.user && isSignInRequiredPath(from));
	const backHref = backIsToc ? routes.toc : from;
	const backText = backIsToc ? 'Mục lục' : (backLabel ?? 'trang trước');
	const continueText = from === routes.home ? 'Mục lục' : (backLabel ?? 'trang trước');

	return (
		<div className="mx-auto min-h-svh max-w-6xl px-5 sm:px-8">
			<SiteTopBar crumbs={[{ label: 'Đăng nhập' }]} showSignIn={false} />
			<main className="flex min-h-[calc(100svh-3.5rem)] items-start justify-center pb-12 pt-10 sm:items-center sm:py-16">
				<div className="w-full max-w-sm rounded-xl border border-hairline bg-canvas p-6 sm:p-8">
					<SpotIllustration variant="login" size={112} className="mx-auto mb-5" />
					<Link href={routes.toc} className="text-xs font-medium text-ink-secondary hover:text-ink">
						{SITE_NAME}
					</Link>
					{session?.user ? (
						<section data-testid="login-signed-in">
							<h1 className="mt-5 font-display text-3xl font-medium text-ink">Bạn đã đăng nhập</h1>
							<p className="mt-3 break-words text-sm text-ink-secondary">
								Đang dùng <span className="text-ink">{session.user.email}</span>
								{session.user.role === 'admin' ? ' với quyền admin' : ''}.
							</p>
							<div className="mt-6 space-y-3">
								<Link
									href={from === routes.home ? routes.toc : from}
									data-testid="login-continue"
									className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-ink px-4 text-sm font-medium text-canvas"
								>
									Tiếp tục tới {continueText}
								</Link>
								<SwitchAccountButton
									loginHref={`${routes.login}?from=${encodeURIComponent(from)}`}
								/>
							</div>
						</section>
					) : (
						<>
							<h1 className="mt-5 font-display text-3xl font-medium text-ink">Đăng nhập</h1>
							<p className="mt-3 text-[17px] leading-relaxed text-ink-secondary">
								Để lưu tiến độ học và quay lại đúng trang bạn đang xem.
								{backLabel ? (
									<>
										{' '}
										Sau khi đăng nhập, bạn sẽ quay lại <span className="text-ink">{backLabel}</span>
										.
									</>
								) : null}
							</p>
							{errorMessage ? (
								<div
									role="alert"
									className="mt-5 rounded-lg border border-vermilion/40 bg-accent-subtle px-4 py-3 text-sm text-ink"
								>
									<p className="font-medium">Không đăng nhập được</p>
									<p className="mt-1 text-ink-secondary">{errorMessage}</p>
									<p className="mt-2 text-xs text-ink-secondary">
										Thử lại bên dưới. Nếu vẫn lỗi, dùng đúng tài khoản Google đã liên kết.
									</p>
								</div>
							) : null}
							<InAppBrowserNotice />
							<div className="mt-6">
								<SignInWithGoogleButton redirectTo={from} chooseAccount={sp?.chon === '1'} />
							</div>
							<p className="mt-3 text-center text-xs leading-relaxed text-ink-secondary">
								Chỉ dùng tên và email Google của bạn. Không đăng bài thay bạn.
							</p>
							<p className="mt-6 text-xs leading-relaxed text-ink-secondary">
								Sinh viên xem lớp? Mở link lớp giảng viên gửi.
							</p>
							<p className="mt-6 text-center text-xs text-ink-secondary">
								<Link
									href={backHref}
									className="inline-flex min-h-10 items-center hover:text-ink"
									data-testid="login-back"
								>
									← Quay lại {backText}
								</Link>
							</p>
						</>
					)}
				</div>
			</main>
		</div>
	);
}
