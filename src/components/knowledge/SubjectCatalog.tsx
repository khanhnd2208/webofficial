import Link from 'next/link';
import { routes } from '@/config/routes';
import type { MyClassCourseCard, MyClassProgressCourseSummary } from '@/features/my-class/types';

export default function SubjectCatalog({
	courses,
	progress,
}: {
	courses: MyClassCourseCard[];
	progress: MyClassProgressCourseSummary[];
}) {
	const progressBySlug = new Map(progress.map((item) => [item.courseSlug, item]));
	return (
		<section className="mc-page-shell" aria-labelledby="knowledge-catalog-title">
			<div className="mc-page-main">
				<header className="mc-catalog-head">
					<p className="mc-eyebrow">HỆ THỐNG TỔNG HỢP KIẾN THỨC</p>
					<h1 id="knowledge-catalog-title">Môn học</h1>
					<p className="mc-lead">Chọn một môn để học theo bài học lớn, module và các ý nhỏ.</p>
				</header>
				{courses.length === 0 ? (
					<div className="mc-empty">Chưa có môn học được xuất bản.</div>
				) : (
					<div className="mc-row-list">
						{courses.map((course) => {
							const item = progressBySlug.get(course.slug);
							const percent = item?.percent ?? 0;
							return (
								<Link key={course.id} href={routes.myClassCourse(course.slug)} className="mc-row">
									<span className="mc-index">{course.title.slice(0, 1).toUpperCase()}</span>
									<span className="mc-row-copy">
										<strong>{course.title}</strong>
										<small>{course.summary || course.description}</small>
										<small>
											{item?.completedItems ?? 0}/{item?.totalItems ?? course.unitCount ?? 0} ý nhỏ
											đã học
										</small>
									</span>
									<span className="mc-row-meta">{percent}%</span>
									<span aria-hidden="true">→</span>
								</Link>
							);
						})}
					</div>
				)}
			</div>
		</section>
	);
}
