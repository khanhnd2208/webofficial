import type { Metadata } from 'next';
import Link from 'next/link';

import ClaimProgressOnLogin from '@/components/myspace/tests/ClaimProgressOnLogin';
import SubjectExplorer from '@/components/myspace/tests/SubjectExplorer';
import { routes } from '@/config/routes';
import { myspaceTestsService } from '@/features/myspace-tests';
import { readGuestId } from '@/features/myspace-tests/guestIdentity';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
	title: 'Tests | My Space',
	description: 'Không gian học tập: chọn môn, theo dõi tiến độ và làm bài kiểm tra.',
};

export default async function MySpaceTestsPage() {
	const [session, guestId] = await Promise.all([auth(), readGuestId()]);
	const userId = (session?.user as { id?: string } | undefined)?.id ?? null;
	const groups = await myspaceTestsService.listPublishedTestsGrouped({
		userId,
		guestId,
	});

	const isAuthenticated = Boolean(userId);
	const loginHref = `${routes.login}?from=${encodeURIComponent(routes.mySpaceTests)}`;

	return (
		<main className="min-h-svh bg-canvas pt-20 pb-24 sm:pt-24 sm:pb-28" data-testid="myspace-tests">
			<div className="shell">
				<header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-t border-hairline pt-5">
					<div className="min-w-0 max-w-[40rem]">
						<h1 className="font-display text-[clamp(1.65rem,3.5vw,2.15rem)] font-medium tracking-tight text-ink">
							Bài kiểm tra
						</h1>
						<p className="mt-1.5 text-sm leading-relaxed text-ink-secondary">
							Chọn môn, tìm bài và theo dõi tiến độ học của bạn.
						</p>
					</div>
					{isAuthenticated ? (
						guestId ? <ClaimProgressOnLogin enabled /> : (
							<p className="text-sm text-ink-secondary" data-testid="myspace-tests-sync-status">
								Đã đồng bộ với tài khoản
							</p>
						)
					) : (
						<Link
							href={loginHref}
							className="inline-flex min-h-11 items-center text-sm text-ink-secondary underline decoration-ink-secondary/35 underline-offset-4 transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
							data-testid="myspace-tests-login-link"
						>
							Đăng nhập để đồng bộ tiến độ
						</Link>
					)}
				</header>

				<SubjectExplorer groups={groups} />
			</div>
		</main>
	);
}
