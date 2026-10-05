import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

import { routes } from '@/config/routes';
import { auth } from '@/lib/auth';

export const metadata: Metadata = {
	title: 'Board Game | My Space',
	description:
		'Chơi Spy Fall, Ma Sói và Cheese Thief cùng bạn bè — tạo phòng, chia sẻ mã và bắt đầu.',
};

export default async function BoardGamePage() {
	const session = await auth();
	const isAdmin = session?.user?.role === 'admin';
	return (
		<main className="relative min-h-svh overflow-hidden bg-canvas px-6 pt-4 pb-20 sm:px-8 sm:pt-8 sm:pb-28">
			<div className="pointer-events-none absolute -right-48 top-24 h-96 w-96 rounded-full bg-vermilion/5 blur-3xl" />
			<div className="mx-auto max-w-5xl">
				<header className="mt-10 grid gap-8 border-b border-hairline pb-10 lg:grid-cols-[1fr_auto] lg:items-end">
					<div>
						<p className="eyebrow">My Space · Board Game</p>
						<h1 className="mt-4 max-w-2xl font-display text-display font-medium tracking-tight text-ink">
							Chơi cùng nhau
						</h1>
						<p className="mt-5 max-w-xl text-body text-ink-secondary">
							Một góc nhỏ để mở game, tạo phòng và mời mọi người cùng tham gia — không cần tài
							khoản.
						</p>
					</div>
					<p className="eyebrow max-w-[16rem] border-l border-vermilion/60 pl-4">
						Mở phòng · Chia sẻ mã · Bắt đầu chơi
					</p>
				</header>
				{isAdmin ? (
					<Link
						href={routes.boardGameTest}
						className="mt-7 inline-flex min-h-11 items-center rounded-full border border-vermilion/40 bg-vermilion/5 px-5 text-sm font-medium text-ink hover:bg-vermilion/10"
					>
						Phòng test với bot{' '}
						<span className="ml-2" aria-hidden="true">
							→
						</span>
					</Link>
				) : null}

				<div className="mt-10 space-y-6">
					<Link
						href={routes.spyFall}
						className="group relative isolate block min-h-[25rem] overflow-hidden rounded-lg border border-hairline bg-paper transition duration-(--dur-3) ease-(--ease-out) hover:-translate-y-1 hover:border-vermilion/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:min-h-[29rem]"
					>
						<Image
							src="/brand/myspace/spy-fall-editorial.webp"
							unoptimized
							alt="Minh hoạ screen-print của một nhà ga đêm với vali và ghim đỏ cho Spy Fall"
							fill
							priority
							className="object-cover object-center transition duration-(--dur-3) ease-(--ease-out) group-hover:scale-[1.03]"
							sizes="(max-width: 640px) 100vw, 1024px"
						/>
						<div className="board-game-cover-overlay absolute inset-0" />
						<div className="relative flex min-h-[25rem] flex-col justify-between p-7 sm:min-h-[29rem] sm:p-10">
							<div className="flex items-center justify-between gap-4">
								<p className="eyebrow !text-sunlight">01 · Suy luận xã hội</p>
								<span className="eyebrow tabular-nums !text-paper/90">4–12 người</span>
							</div>
							<div className="max-w-md">
								<h2 className="font-display text-title-1 font-medium tracking-tight text-paper">
									Spy Fall
								</h2>
								<p className="mt-3 max-w-sm text-subhead text-paper/90 sm:text-body">
									Tìm ra điệp viên giữa nhóm bạn. Mỗi người dùng điện thoại của mình.
								</p>
								<span className="mt-7 inline-flex items-center gap-2 eyebrow !text-sunlight">
									Vào game{' '}
									<span className="transition-transform duration-(--dur-2) ease-(--ease-out) group-hover:translate-x-1">
										→
									</span>
								</span>
							</div>
						</div>
					</Link>

					<Link
						href={routes.maSoi}
						className="group relative isolate block min-h-[25rem] overflow-hidden rounded-lg border border-hairline bg-paper transition duration-(--dur-3) ease-(--ease-out) hover:-translate-y-1 hover:border-vermilion/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:min-h-[29rem]"
					>
						<Image
							src="/brand/myspace/ma-soi-editorial.webp"
							unoptimized
							alt="Minh hoạ screen-print của một bàn chơi làng quê dưới trăng cho Ma Sói"
							fill
							className="object-cover object-center transition duration-(--dur-3) ease-(--ease-out) group-hover:scale-[1.03]"
							sizes="(max-width: 640px) 100vw, 1024px"
						/>
						<div className="board-game-cover-overlay absolute inset-0" />
						<div className="relative flex min-h-[25rem] flex-col justify-between p-7 sm:min-h-[29rem] sm:p-10">
							<div className="flex items-center justify-between gap-4">
								<p className="eyebrow !text-sunlight">02 · Bàn làng dưới trăng</p>
								<span className="eyebrow tabular-nums !text-paper/90">5–20 người</span>
							</div>
							<div className="max-w-md">
								<h2 className="font-display text-title-1 font-medium tracking-tight text-paper">
									Ma Sói
								</h2>
								<p className="mt-3 max-w-sm text-subhead text-paper/90 sm:text-body">
									Chia thẻ vai cho cả nhóm. Mỗi người xem thẻ bí mật trên điện thoại của mình.
								</p>
								<span className="mt-7 inline-flex items-center gap-2 eyebrow !text-sunlight">
									Vào game{' '}
									<span className="transition-transform duration-(--dur-2) ease-(--ease-out) group-hover:translate-x-1">
										→
									</span>
								</span>
							</div>
						</div>
					</Link>

					<Link
						href={routes.cheeseThief}
						className="group relative isolate block min-h-[25rem] overflow-hidden rounded-lg border border-hairline bg-paper transition duration-(--dur-3) ease-(--ease-out) hover:-translate-y-1 hover:border-vermilion/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:min-h-[29rem]"
					>
						<Image
							src="/board-game/cheese-thief/cover.webp"
							alt="Tranh minh họa Cheese Thief: chú chuột lén lấy miếng cheese dưới ánh đèn đêm"
							fill
							className="object-cover object-center transition duration-(--dur-3) ease-(--ease-out) group-hover:scale-[1.03]"
							sizes="(max-width: 640px) 100vw, 1024px"
						/>
						<div className="board-game-cover-overlay absolute inset-0" />
						<div className="relative flex min-h-[25rem] flex-col justify-between p-7 sm:min-h-[29rem] sm:p-10">
							<div className="flex items-center justify-between gap-4">
								<p className="eyebrow !text-sunlight">03 · Bàn ăn đêm</p>
								<span className="eyebrow tabular-nums !text-paper/90">4–12 người</span>
							</div>
							<div className="max-w-md">
								<h2 className="font-display text-title-1 font-medium tracking-tight text-paper">
									Cheese Thief
								</h2>
								<p className="mt-3 max-w-sm text-subhead text-paper/90 sm:text-body">
									Ai lấy miếng cheese? Mở mắt, nhìn nhau, rồi cãi. Điện thoại chỉ giữ bí mật.
								</p>
								<span className="mt-7 inline-flex items-center gap-2 eyebrow !text-sunlight">
									Vào game{' '}
									<span className="transition-transform duration-(--dur-2) ease-(--ease-out) group-hover:translate-x-1">
										→
									</span>
								</span>
							</div>
						</div>
					</Link>
				</div>

				<footer className="eyebrow mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-hairline pt-5">
					<span>Không cần tài khoản</span>
					<span>Chơi ngay trên điện thoại</span>
				</footer>
			</div>
		</main>
	);
}
