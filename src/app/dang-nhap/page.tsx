import type { Metadata } from 'next';
import { cookies, headers } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import SignInWithGoogleButton from './sign-in-with-google-button';
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
	searchParams?: Promise<{ from?: string; error?: string; callbackUrl?: string }>;
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

	// Retrying after a failed Google round trip that did sign in: finish the trip.
	if (session?.user && sp?.error) {
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
		<main className="min-h-[calc(100svh-3.5rem)]">
			<div className="grid min-h-[calc(100svh-3.5rem)] lg:grid-cols-2">
				<aside className="relative hidden overflow-hidden border-r border-hairline bg-paper lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
					<Link
						href={routes.toc}
						className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-accent"
					>
						{SITE_NAME}
					</Link>
					<div>
						<p className="font-display type-page-title font-medium text-ink">
							Một tài khoản Google
						</p>
						<ul className="type-lead mt-5 max-w-sm space-y-3 text-ink-secondary">
							<li>Đọc khóa học tự học và lưu tiến độ của bạn.</li>
							<li>Quay lại đúng trang bạn đang xem sau khi đăng nhập.</li>
							<li>Với giảng viên: mở Teaching và khu quản trị.</li>
						</ul>
					</div>
					<p className="text-sm text-ink-secondary">Duy Khánh · Giảng viên</p>
				</aside>

				<div className="flex flex-col justify-start px-6 pb-10 pt-6 sm:px-10 sm:pt-10 lg:justify-center lg:px-16 lg:py-12">
					<div className="mx-auto w-full max-w-sm">
						<Link
							href={routes.toc}
							className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-accent lg:hidden"
						>
							{SITE_NAME}
						</Link>

						{session?.user ? (
							<section data-testid="login-signed-in">
								<h1 className="mt-5 font-display type-page-title font-medium text-ink sm:mt-8">
									Bạn đã đăng nhập
								</h1>
								<p className="mt-2 text-sm text-ink-secondary">
									Đang dùng <span className="text-ink">{session.user.email}</span>
									{session.user.role === 'admin' ? ' với quyền admin' : ''}.
								</p>
								<div className="mt-6 space-y-3 sm:mt-8">
									<Link
										href={from === routes.home ? routes.toc : from}
										data-testid="login-continue"
										className="inline-flex w-full min-h-11 items-center justify-center rounded-[10px] border-2 border-ink bg-ink px-5 py-3 text-sm font-semibold text-paper transition duration-200 hover:bg-transparent hover:text-ink"
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
									Dùng tài khoản Google của bạn.
									{backLabel ? (
										<>
											{' '}
											Sau khi đăng nhập, bạn sẽ quay lại{' '}
											<span className="text-ink">{backLabel}</span>.
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

								<div className="mt-8 rounded-[10px] border border-hairline bg-paper px-4 py-3 text-xs leading-relaxed text-ink-secondary">
									<p className="font-semibold text-ink">Không cần đăng nhập Google khi</p>
									<ul className="mt-1.5 list-disc space-y-1 pl-4">
										<li>
											Xem lớp của bạn (điểm danh, điểm, nhóm): mở link lớp giảng viên gửi, đăng nhập
											bằng mã sinh viên và ngày sinh ngay trên trang lớp.
										</li>
										<li>Chơi Board Game cùng bạn bè.</li>
									</ul>
								</div>
							</>
						)}

						{session?.user ? null : (
							<p className="mt-8 text-center text-xs text-ink-secondary sm:mt-10">
								<Link href={backHref} className="hover:text-ink" data-testid="login-back">
									← Quay lại {backText}
								</Link>
							</p>
						)}
					</div>
				</div>
			</div>
		</main>
	);
}
