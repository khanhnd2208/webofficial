import Link from 'next/link';
import {
	getAdminCourse,
	listCourseVocabAssignments,
	validateAdminCoursePublish,
} from '@/features/my-class';
import { routes } from '@/config/routes';
import PublishCourseButton from '@/components/myclass/admin/PublishCourseButton';
import { StudioStatus } from '@/components/myclass/admin/studio';

export const dynamic = 'force-dynamic';

export default async function OverviewPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const [course, blockers, vocab] = await Promise.all([
		getAdminCourse(id),
		validateAdminCoursePublish(id),
		listCourseVocabAssignments(id),
	]);
	const kuCount = course.lessons.reduce(
		(sum, lesson) =>
			sum + lesson.sections.reduce((inner, section) => inner + section.knowledge.length, 0),
		0,
	);
	const studentCount = course.cohorts.reduce((sum, cohort) => sum + cohort._count.members, 0);
	return (
		<div className="grid gap-4 md:grid-cols-2">
			<section className="mc-surface p-5">
				<p className="text-sm font-semibold text-ink-secondary">Trạng thái</p>
				<div className="mt-3">
					<StudioStatus status={course.status} />
				</div>
				<p className="mc-meta mt-3">
					Cập nhật {new Date(course.updatedAt).toLocaleString('vi-VN')}
				</p>
			</section>
			<section className="mc-surface p-5">
				<p className="text-sm font-semibold text-ink-secondary">Cấu trúc</p>
				<p className="mt-3 text-sm font-semibold text-ink">
					{course.lessons.length} bài · {kuCount} nội dung · {vocab.length} bộ từ vựng ·{' '}
					{course.placements.length} bài kiểm tra
				</p>
				<p className="mc-meta mt-2">{studentCount} học viên</p>
			</section>
			<section className="mc-surface p-5 md:col-span-2">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div>
						<h2 className="font-bold">
							{course.status === 'PUBLISHED' ? 'Tình trạng xuất bản' : 'Kiểm tra xuất bản'}
						</h2>
						<p className="mc-meta mt-1">
							{course.status === 'PUBLISHED'
								? 'Khóa học hiện đang hiển thị với học viên.'
								: 'Khắc phục mọi vấn đề trước khi đưa khóa học tới học viên.'}
						</p>
					</div>
					{course.status !== 'PUBLISHED' ? <PublishCourseButton courseId={course.id} /> : null}
				</div>
				{blockers.length ? (
					<ul className="mt-4 divide-y divide-mc-rule rounded-[var(--mc-r-sm)] border border-warning/30 text-sm">
						{blockers.map((item) => (
							<li key={`${item.code}-${item.path}`} className="p-3">
								<Link
									href={item.href ?? routes.admin.myClassCourseContent(course.id)}
									className="underline"
								>
									{item.message}
								</Link>
							</li>
						))}
					</ul>
				) : (
					<p className="mt-4 rounded-[var(--mc-r-sm)] border border-mc-done/30 bg-mc-done-subtle p-3 text-sm font-medium text-mc-done">
						{course.status === 'PUBLISHED'
							? 'Đã xuất bản và không có lỗi cấu trúc.'
							: 'Khóa học đã sẵn sàng để xuất bản.'}
					</p>
				)}
			</section>
		</div>
	);
}
