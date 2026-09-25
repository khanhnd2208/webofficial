import type { Metadata } from 'next';
import Link from 'next/link';

import { routes } from '@/config/routes';

export const metadata: Metadata = {
	title: 'Board Game | My Space',
	description: 'Chơi Spy Fall cùng bạn bè — tạo phòng, chia sẻ mã và bắt đầu một ván chơi.',
};

export default function BoardGamePage() {
	return (
		<main className="min-h-svh bg-canvas px-6 pt-24 pb-28 sm:px-8 sm:py-28">
			<div className="mx-auto max-w-3xl">
				<Link
					href={routes.mySpace}
					className="inline-flex min-h-10 items-center text-xs tracking-[0.16em] text-ink/55 uppercase transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
				>
					← My Space
				</Link>
				<p className="font-mono text-xs tracking-[0.22em] text-ink/45 uppercase">My Space · Board Game</p>
				<h1 className="mt-4 font-display text-4xl font-medium tracking-tight text-ink sm:text-5xl">
					Chơi cùng nhau
				</h1>
				<p className="mt-4 max-w-xl text-base leading-relaxed text-ink-secondary">
					Một góc nhỏ để mở game, tạo phòng và mời mọi người cùng tham gia — không cần tài khoản.
				</p>

				<Link
					href={routes.spyFall}
					className="group mt-12 block rounded-3xl border border-hairline bg-paper p-7 transition-transform duration-300 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:p-10"
				>
					<div className="flex flex-wrap items-start justify-between gap-8">
						<div>
							<p className="text-5xl" aria-hidden>
								🕵️
							</p>
							<h2 className="mt-5 font-display text-3xl font-medium text-ink">Spy Fall</h2>
							<p className="mt-2 max-w-md text-sm leading-relaxed text-ink-secondary">
								Tìm ra điệp viên giữa nhóm bạn. Từ 4–12 người, mỗi người dùng điện thoại của mình.
							</p>
						</div>
						<span className="font-mono text-xs tracking-[0.16em] text-accent uppercase transition-transform group-hover:translate-x-1">
							Vào game →
						</span>
					</div>
				</Link>
			</div>
		</main>
	);
}
