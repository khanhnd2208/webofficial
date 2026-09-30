import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getCourse, getSubjectReview } from '@/features/my-class';
import { seedsFromCourseOutline } from '@/features/my-class/domain/learnerState';
import { routes } from '@/config/routes';
import KnowledgeHeader from '@/components/knowledge/KnowledgeHeader';
import SubjectTabs from '@/components/knowledge/SubjectTabs';

export const dynamic = 'force-dynamic';

export default async function SubjectReviewPage({
	params,
}: {
	params: Promise<{ courseSlug: string }>;
}) {
	const { courseSlug } = await params;
	const course = await getCourse(courseSlug);
	if (!course) notFound();
	const session = await auth();
	const userId = (session?.user as { id?: string } | undefined)?.id;
	const tests = userId ? await getSubjectReview(userId, courseSlug) : [];
	const seedBySlug = new Map(
		seedsFromCourseOutline(course).map((seed) => [seed.knowledgeUnitSlug, seed]),
	);
	const incorrect = tests.flatMap((test) =>
		test.kuAccuracy
			.filter((item) => item.accuracy < 1)
			.map((item) => ({ ...item, testTitle: test.title })),
	);
	return (
		<>
			<KnowledgeHeader
				crumb={course.title}
				user={session?.user ?? null}
				loginHref={`${routes.login}?from=${encodeURIComponent(routes.myClassReview(courseSlug))}`}
			/>
			<section className="mc-page-shell">
				<div className="mc-page-main">
					<header className="mc-catalog-head">
						<div>
							<p className="mc-eyebrow">ÔN TẬP THEO MÔN</p>
							<h1>Ôn tập · {course.title}</h1>
							<p className="mc-lead">Xem lại kết quả test và quay lại đúng ý nhỏ cần củng cố.</p>
						</div>
					</header>
					<SubjectTabs
						courseSlug={courseSlug}
						active="review"
						hasVocabulary={course.vocabSets.length > 0}
					/>
					{!userId ? (
						<p className="mc-empty">Đăng nhập để lưu và xem lịch sử test của môn này.</p>
					) : null}
					<h2 className="mc-section-title">Kết quả test</h2>
					<div className="mc-row-list">
						{course.tests.map((test) => {
							const result = tests.find((item) => item.testSlug === test.slug);
							return (
								<div className="mc-row" key={test.slug}>
									<span className="mc-row-copy">
										<strong>{test.title}</strong>
										<small>
											{result
												? `${result.latestScore}/${result.total} gần nhất · ${result.bestScore}/${result.total} cao nhất`
												: 'Chưa làm test'}
										</small>
									</span>
									{result ? (
										<span className="mc-row-meta">
											{Math.round((result.bestScore / Math.max(1, result.total)) * 100)}%
										</span>
									) : (
										<Link
											href={routes.myClassTest(courseSlug, test.slug)}
											className="mc-button mc-button-secondary"
										>
											Làm test
										</Link>
									)}
								</div>
							);
						})}
					</div>
					<h2 className="mc-section-title">Mục cần xem lại</h2>
					<div className="mc-row-list">
						{incorrect.length ? (
							incorrect.map((item, index) => {
								const seed = seedBySlug.get(item.slug);
								return (
									<Link
										key={`${item.slug}-${index}`}
										href={
											seed
												? routes.myClassUnit(courseSlug, seed.lessonSlug, seed.knowledgeUnitSlug, {
														sectionSlug: seed.sectionSlug,
													})
												: routes.myClassCourse(courseSlug)
										}
										className="mc-row"
									>
										<span className="mc-row-copy">
											<strong>{item.title}</strong>
											<small>
												{item.testTitle} · {item.correct}/{item.questions} câu đúng
											</small>
										</span>
										<span className="mc-row-meta">{Math.round(item.accuracy * 100)}%</span>
										<span aria-hidden="true">→</span>
									</Link>
								);
							})
						) : (
							<p className="mc-empty">Chưa có mục nào cần xem lại.</p>
						)}
					</div>
				</div>
			</section>
		</>
	);
}
