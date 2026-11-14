import type { Metadata } from 'next';
import Link from 'next/link';

import LearningHubHeader from '@/components/site/LearningHubHeader';
import RecentClasses from '@/components/site/RecentClasses';
import SpotIllustration from '@/components/site/SpotIllustration';
import { routes } from '@/config/routes';
import { auth } from '@/lib/auth';
import { listActiveClasses, type AdminActiveClass } from '@/services/adminDashboardService';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
	title: 'Lớp học',
	description: 'Các trang lớp bạn đã mở trên thiết bị này.',
	robots: { index: false, follow: false },
};

function EmptyClasses() {
	return (
		<div className="mx-auto max-w-md py-12 text-center" data-testid="classes-empty">
			<SpotIllustration variant="empty" size={112} className="mx-auto" />
			<p className="mt-6 text-body leading-relaxed text-ink-secondary">
				Trang lớp mở bằng link thầy gửi trong nhóm lớp. Mở một lần, lần sau lớp sẽ hiện ở đây.
			</p>
		</div>
	);
}

function TeachingClasses({ classes, total }: { classes: AdminActiveClass[]; total: number }) {
	return (
		<section
			aria-labelledby="teaching-classes-title"
			className="mt-12"
			data-testid="teaching-classes"
		>
			<div className="flex flex-wrap items-baseline justify-between gap-3">
				<h2 id="teaching-classes-title" className="editorial-label">
					Lớp đang dạy · {total}
				</h2>
				<Link href={routes.mySpaceTeaching} className="editorial-text-link text-subhead">
					Mở không gian giảng dạy
				</Link>
			</div>
			{classes.length ? (
				<ul className="mt-3 border-t border-hairline">
					{classes.map((item) => (
						<li
							key={item.id}
							className="flex flex-col gap-2 border-b border-hairline py-3 sm:flex-row sm:items-center sm:gap-4"
						>
							<span className="min-w-0 flex-1">
								<span className="block truncate font-display text-title-3">{item.courseName}</span>
								<span className="block text-footnote text-ink-secondary">
									{[
										item.classCode || item.courseCode,
										item.groupNo && `Nhóm ${item.groupNo}`,
										item.term,
									]
										.filter(Boolean)
										.join(' · ')}{' '}
									· {item.students} sinh viên
								</span>
							</span>
							<span className="flex shrink-0 gap-5 text-subhead font-medium [&_a]:underline [&_a]:decoration-hairline [&_a]:underline-offset-4 [&_a:hover]:decoration-current">
								{item.sharedSlug ? (
									<Link href={routes.teachingPublicClass(item.sharedSlug)}>Trang sinh viên</Link>
								) : (
									<span className="font-normal text-ink-secondary">Chưa chia sẻ</span>
								)}
								<Link href={routes.mySpaceTeachingClass(item.id)}>Chấm điểm</Link>
							</span>
						</li>
					))}
				</ul>
			) : (
				<p className="mt-3 text-subhead text-ink-secondary">Chưa có lớp nào đang mở.</p>
			)}
		</section>
	);
}

/** Học tập, tab Lớp học. Class pages stay unlisted; this only shows the ones opened here. */
export default async function ClassesPage() {
	const session = await auth();
	const isAdmin = session?.user?.role === 'admin';
	const teaching = isAdmin ? await listActiveClasses(20) : null;

	return (
		<main className="min-h-svh bg-canvas px-6 pb-16 pt-28 text-ink sm:px-10 sm:pt-36">
			<div className="mx-auto max-w-4xl">
				<LearningHubHeader
					active="classes"
					title="Lớp học của bạn"
					lead="Điểm danh, điểm chuyên cần và tài liệu ôn tập của lớp bạn đang học."
				/>
				<RecentClasses className="mt-8" empty={<EmptyClasses />} />
				{teaching ? <TeachingClasses classes={teaching.items} total={teaching.total} /> : null}
			</div>
		</main>
	);
}
