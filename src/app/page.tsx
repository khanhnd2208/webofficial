import Link from 'next/link';

import { routes } from '@/config/routes';
import { SITE_NAME, SITE_DESCRIPTION, siteProfile } from '@/config/site';

export const metadata = {
	title: { absolute: SITE_NAME },
	description: SITE_DESCRIPTION,
};

/**
 * Boutique homepage — compact profile overview.
 * No post fetching, no session-gated hero content.
 */
export default function Home() {
	return (
		<main className="min-h-screen">
			{/* Hero — two-column compact */}
			<section className="border-b border-hairline">
				<div className="shell grid gap-10 py-12 sm:py-16 lg:grid-cols-12 lg:items-end lg:gap-12 lg:py-20">
					<div className="lg:col-span-4">
						<p className="font-display text-6xl font-medium leading-none text-ink/20 sm:text-7xl">
							{siteProfile.personalMark}
						</p>
					</div>
					<div className="lg:col-span-8">
						{siteProfile.role ? (
							<p className="font-mono text-[10px] uppercase tracking-[0.28em] text-vermilion">
								{siteProfile.role}
							</p>
						) : null}
						<h1 className="mt-3 font-display type-wordmark font-medium text-ink">{SITE_NAME}</h1>
						{siteProfile.shortBio ? (
							<p className="mt-5 max-w-xl text-base leading-relaxed text-ink-secondary sm:text-lg">
								{siteProfile.shortBio}
							</p>
						) : null}
						<div className="mt-8">
							<Link
								href={routes.posts}
								className="inline-flex min-h-11 items-center rounded-[10px] bg-ink px-5 text-xs font-semibold uppercase tracking-wider text-paper transition-colors duration-200 hover:bg-ink/90"
							>
								Đọc bài viết
							</Link>
						</div>
					</div>
				</div>
			</section>

			{/* Site map — condensed navigation rows, no thumbnails */}
			<section className="border-b border-hairline">
				<div className="shell py-12 sm:py-14">
					<p className="font-mono text-[10px] uppercase tracking-[0.28em] text-ink-secondary">
						Website này có gì?
					</p>
					<nav className="mt-8 max-w-2xl" aria-label="Cấu trúc website">
						<ul className="divide-y divide-hairline border-y border-hairline">
							<li>
								<Link
									href={routes.posts}
									className="group flex items-baseline justify-between gap-6 py-5 transition-colors duration-200"
								>
									<span>
										<span className="font-display text-xl font-medium text-ink group-hover:text-vermilion sm:text-2xl">
											Bài viết
										</span>
										<span className="mt-1 block text-sm text-ink-secondary">
											Thư viện theo chủ đề — đọc công khai, không cần đăng nhập.
										</span>
									</span>
									<span
										aria-hidden
										className="shrink-0 font-mono text-xs text-vermilion opacity-0 transition-opacity duration-200 group-hover:opacity-100"
									>
										→
									</span>
								</Link>
							</li>
							<li>
								<a
									href="#gioi-thieu"
									className="group flex items-baseline justify-between gap-6 py-5 transition-colors duration-200"
								>
									<span>
										<span className="font-display text-xl font-medium text-ink group-hover:text-vermilion sm:text-2xl">
											Về {SITE_NAME}
										</span>
										<span className="mt-1 block text-sm text-ink-secondary">
											Thương hiệu cá nhân, góc nhìn và cách website được tổ chức.
										</span>
									</span>
									<span
										aria-hidden
										className="shrink-0 font-mono text-xs text-vermilion opacity-0 transition-opacity duration-200 group-hover:opacity-100"
									>
										→
									</span>
								</a>
							</li>
							<li>
								<Link
									href={routes.login}
									className="group flex items-baseline justify-between gap-6 py-5 transition-colors duration-200"
								>
									<span>
										<span className="font-display text-xl font-medium text-ink group-hover:text-vermilion sm:text-2xl">
											Đăng nhập
										</span>
										<span className="mt-1 block text-sm text-ink-secondary">
											Khu vực tài khoản riêng — dành cho người được mời.
										</span>
									</span>
									<span
										aria-hidden
										className="shrink-0 font-mono text-xs text-vermilion opacity-0 transition-opacity duration-200 group-hover:opacity-100"
									>
										→
									</span>
								</Link>
							</li>
						</ul>
					</nav>
				</div>
			</section>

			{/* About — merged from /gioi-thieu */}
			<section id="gioi-thieu" className="scroll-mt-[var(--header-height)] border-b border-hairline">
				<div className="shell py-12 sm:py-14">
					<p className="font-mono text-[10px] uppercase tracking-[0.28em] text-ink-secondary">Giới thiệu</p>
					<h2 className="mt-3 font-display type-section font-medium text-ink">
						{siteProfile.personalMark} · {SITE_NAME}
					</h2>
					<p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-secondary">
						{SITE_NAME} là thương hiệu cá nhân trên web: bài viết công khai về chuyên môn, trải nghiệm và góc
						nhìn. Công cụ phục vụ công việc thực tế mặc định không công khai; chỉ đầu ra được thiết kế riêng mới
						mở.
					</p>
					<ul className="mt-8 max-w-2xl space-y-5">
						<li className="border-t border-hairline pt-5">
							<p className="font-display text-lg font-medium text-ink">Bài viết</p>
							<p className="mt-1.5 text-sm leading-relaxed text-ink-secondary">
								Thư viện hai cột, lọc theo chủ đề và tag — đọc chậm hoặc quét nhanh đều được.
							</p>
						</li>
						<li className="border-t border-hairline pt-5">
							<p className="font-display text-lg font-medium text-ink">Tài khoản</p>
							<p className="mt-1.5 text-sm leading-relaxed text-ink-secondary">
								Đăng nhập bằng Google khi bạn được mời — khu học tập công khai đang tạm đóng.
							</p>
						</li>
					</ul>
				</div>
			</section>

			{/* Closing */}
			<section>
				<div className="shell py-12 sm:py-14">
					<p className="max-w-md font-display text-xl font-medium leading-snug text-ink sm:text-2xl">
						Viết để hiểu sâu.
					</p>
					<p className="mt-3 text-sm text-ink-secondary">
						<Link href={routes.posts} className="font-semibold text-vermilion hover:underline">
							Đọc bài viết
						</Link>
					</p>
				</div>
			</section>
		</main>
	);
}
