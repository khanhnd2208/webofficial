import Link from 'next/link';

import SectionReveal from '@/components/motion/SectionReveal';
import { StaggerGroup, StaggerItem } from '@/components/motion/StaggerGroup';
import { routes } from '@/config/routes';
import { siteProfile } from '@/config/site';

export const metadata = {
	title: 'Giới thiệu',
	description: 'HANOICAM — viết, giảng dạy, và những công cụ phục vụ công việc thực tế.',
};

const CHAPTERS = [
	{
		n: 'I',
		title: 'Thương hiệu cá nhân',
		body: 'Bài viết công khai về chuyên môn, trải nghiệm và góc nhìn — không cần đăng nhập.',
	},
	{
		n: 'II',
		title: 'Giảng dạy',
		body: 'Khóa học theo cấu trúc chương–bài, dành cho học viên được ghi danh theo lời mời.',
	},
	{
		n: 'III',
		title: 'Công cụ',
		body: 'Tiện ích phục vụ công việc thực tế. Tool mặc định không công khai; chỉ đầu ra được thiết kế riêng mới mở.',
	},
] as const;

export default function AboutPage() {
	return (
		<main className="min-h-screen">
			<section className="border-b border-hairline">
				<div className="shell grid gap-12 py-16 sm:py-24 lg:grid-cols-12 lg:items-end lg:gap-8 lg:py-28">
					{/* Typography-only hero — no AI portrait */}
					<div className="lg:col-span-5">
						<p className="font-mono text-[10px] uppercase tracking-[0.28em] text-ink-secondary">Giới thiệu</p>
						<p className="mt-8 font-display text-[clamp(4rem,10vw,8rem)] font-medium leading-[0.85] tracking-tight text-ink/15">
							NDK
						</p>
					</div>
					<div className="lg:col-span-7">
						<h1 className="font-display type-page-title font-medium text-ink">{siteProfile.publicName}</h1>
						{siteProfile.role ? (
							<p className="mt-2 font-mono text-[10px] uppercase tracking-[0.28em] text-vermilion">
								{siteProfile.role}
							</p>
						) : null}
						{siteProfile.shortBio ? (
							<p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-secondary">
								{siteProfile.shortBio}
							</p>
						) : null}
					</div>
				</div>
			</section>

			<section className="shell py-[var(--section-space)]">
				<p className="font-mono text-[10px] uppercase tracking-[0.28em] text-ink-secondary">Ba chương</p>
				<StaggerGroup className="mt-12 max-w-3xl space-y-0">
					{CHAPTERS.map((ch) => (
						<StaggerItem key={ch.n}>
							<article className="grid gap-4 border-t border-hairline py-10 sm:grid-cols-[5rem_1fr]">
								<span className="font-display text-4xl font-medium text-vermilion">{ch.n}</span>
								<div>
									<h2 className="font-display text-2xl font-medium text-ink sm:text-3xl">{ch.title}</h2>
									<p className="mt-3 text-base leading-relaxed text-ink-secondary">{ch.body}</p>
								</div>
							</article>
						</StaggerItem>
					))}
				</StaggerGroup>

				{(siteProfile.teachingThemes && siteProfile.teachingThemes.length > 0) ||
				(siteProfile.audiences && siteProfile.audiences.length > 0) ? (
					<SectionReveal className="mt-0 border-t border-hairline pt-10">
						<div className="max-w-3xl grid gap-8 sm:grid-cols-2">
							{siteProfile.teachingThemes && siteProfile.teachingThemes.length > 0 ? (
								<div>
									<p className="font-mono text-[10px] uppercase tracking-[0.28em] text-ink-secondary">
										Chủ đề giảng dạy
									</p>
									<ul className="mt-4 space-y-2">
										{siteProfile.teachingThemes.map((theme) => (
											<li key={theme} className="flex items-start gap-2 text-base text-ink-secondary">
												<span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-vermilion" />
												{theme}
											</li>
										))}
									</ul>
								</div>
							) : null}
							{siteProfile.audiences && siteProfile.audiences.length > 0 ? (
								<div>
									<p className="font-mono text-[10px] uppercase tracking-[0.28em] text-ink-secondary">
										Dành cho
									</p>
									<ul className="mt-4 space-y-2">
										{siteProfile.audiences.map((audience) => (
											<li key={audience} className="flex items-start gap-2 text-base text-ink-secondary">
												<span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-vermilion" />
												{audience}
											</li>
										))}
									</ul>
								</div>
							) : null}
						</div>
					</SectionReveal>
				) : null}

				<SectionReveal className="mt-8 border-t border-hairline pt-10">
					<div className="flex flex-wrap gap-6">
						<Link href={routes.posts} className="text-sm font-semibold text-vermilion hover:underline">
							Bài viết
						</Link>
						<Link href={routes.teaching} className="text-sm font-semibold text-ink-secondary hover:text-ink">
							Giảng dạy
						</Link>
						<Link href={routes.login} className="text-sm font-semibold text-ink-secondary hover:text-ink">
							Đăng nhập
						</Link>
					</div>
				</SectionReveal>
			</section>
		</main>
	);
}
