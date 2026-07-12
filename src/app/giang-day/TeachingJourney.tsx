'use client';

import Link from 'next/link';
import { m, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

import { useMotionTier } from '@/components/motion/MotionProvider';
import { StaggerGroup, StaggerItem } from '@/components/motion/StaggerGroup';
import { routes } from '@/config/routes';

const CHAPTERS = [
	{
		n: 'I',
		title: 'Lời mời',
		body: 'Mỗi khóa mở theo lời mời để trải nghiệm học tập được tập trung và phù hợp.',
	},
	{
		n: 'II',
		title: 'Phương pháp học',
		body: 'Khóa học → Chương → Bài học. Một lộ trình rõ ràng, tiến độ được ghi lại từng bước.',
	},
	{
		n: 'III',
		title: 'Quyền truy cập',
		body: 'Nội dung dành cho học viên được ghi danh — để lớp học giữ được sự tập trung và nhịp riêng.',
	},
	{
		n: 'IV',
		title: 'Cánh cửa vào lớp',
		body: 'Đăng nhập, nhận ghi danh, rồi mở bài học tiếp theo trong một thao tác.',
	},
] as const;

export default function TeachingJourney({ isLoggedIn }: { isLoggedIn: boolean }) {
	const ref = useRef<HTMLElement>(null);
	const { allowsReveal, reduced } = useMotionTier();
	const { scrollYProgress } = useScroll({
		target: ref,
		offset: ['start 80%', 'end 40%'],
	});
	const pathLength = useTransform(scrollYProgress, [0, 0.8], [0, 1]);
	const doorUnderline = useTransform(scrollYProgress, [0.65, 0.95], [0, 1]);

	return (
		<section ref={ref} className="shell py-[var(--section-space)]">
			<div className="relative max-w-3xl">
				<svg
					className="pointer-events-none absolute left-[1.15rem] top-3 h-[calc(100%-5rem)] w-4 overflow-visible sm:left-[1.35rem]"
					aria-hidden
				>
					{!allowsReveal || reduced ? (
						<line x1="2" y1="0" x2="2" y2="100%" stroke="var(--vermilion)" strokeWidth="1.5" />
					) : (
						<m.line
							x1="2"
							y1="0"
							x2="2"
							y2="100%"
							stroke="var(--vermilion)"
							strokeWidth="1.5"
							style={{ pathLength }}
						/>
					)}
				</svg>

				<StaggerGroup className="space-y-0">
					{CHAPTERS.map((ch) => (
						<StaggerItem key={ch.n}>
							<article className="relative grid gap-3 border-b border-hairline py-10 pl-12 sm:grid-cols-[4.5rem_1fr] sm:gap-4 sm:pl-14">
								<span
									aria-hidden
									className="absolute left-[0.7rem] top-12 h-3.5 w-3.5 rounded-full border border-vermilion bg-canvas sm:left-[0.9rem]"
								>
									<span className="absolute inset-[3px] rounded-full bg-vermilion" />
								</span>
								<span className="font-display text-3xl font-medium text-vermilion">{ch.n}</span>
								<div>
									<h2 className="font-display text-2xl font-medium text-ink sm:text-3xl">{ch.title}</h2>
									<p className="mt-3 text-base leading-relaxed text-ink-secondary">{ch.body}</p>
								</div>
							</article>
						</StaggerItem>
					))}
				</StaggerGroup>
			</div>

			<div className="mt-14 max-w-3xl rounded-[18px] border border-hairline bg-paper px-8 py-10 sm:px-12">
				<p className="font-mono text-[10px] uppercase tracking-[0.28em] text-vermilion">Cánh cửa</p>
				<p className="mt-4 font-display text-2xl font-medium leading-snug text-ink sm:text-3xl">
					Khi bạn được ghi danh, bài học tiếp theo luôn chỉ cách một thao tác.
				</p>
				{isLoggedIn ? (
					<Link
						href={routes.learn}
						className="relative mt-8 inline-flex min-h-11 items-center pb-1 text-sm font-semibold text-ink"
					>
						Mở dashboard học tập →
						{allowsReveal && !reduced ? (
							<m.span
								aria-hidden
								className="absolute inset-x-0 bottom-0 h-[1.5px] origin-left bg-vermilion"
								style={{ scaleX: doorUnderline }}
							/>
						) : (
							<span aria-hidden className="absolute inset-x-0 bottom-0 h-[1.5px] bg-vermilion" />
						)}
					</Link>
				) : (
					<Link
						href={`${routes.login}?from=${routes.learn}`}
						className="relative mt-8 inline-flex min-h-11 items-center pb-1 text-sm font-semibold text-ink"
					>
						Đăng nhập để vào lớp →
						{allowsReveal && !reduced ? (
							<m.span
								aria-hidden
								className="absolute inset-x-0 bottom-0 h-[1.5px] origin-left bg-vermilion"
								style={{ scaleX: doorUnderline }}
							/>
						) : (
							<span aria-hidden className="absolute inset-x-0 bottom-0 h-[1.5px] bg-vermilion" />
						)}
					</Link>
				)}
			</div>
		</section>
	);
}
