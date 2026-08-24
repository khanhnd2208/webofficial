import { getCourse } from '@/features/my-class';
import CourseVocabHub from '@/components/myclass/vocab/CourseVocabHub';
import KnowledgeHeader from '@/components/knowledge/KnowledgeHeader';
import SubjectTabs from '@/components/knowledge/SubjectTabs';
import { rethrowUnlessNotFound } from '@/lib/pageErrors';

export const dynamic = 'force-dynamic';

export default async function CourseVocabIndexPage({
	params,
}: {
	params: Promise<{ courseSlug: string }>;
}) {
	const { courseSlug } = await params;
	let course;
	try {
		course = await getCourse(courseSlug);
	} catch (error) {
		rethrowUnlessNotFound(error);
	}
	return (
		<><KnowledgeHeader crumb={`${course.title} · Từ vựng`} /><main className="mc-page-shell"><div className="mc-page-main">
			<SubjectTabs courseSlug={course.slug} active="vocab" hasVocabulary />
			<h1 className="mc-title">Từ vựng</h1><p className="mc-dek">Luyện trực tiếp trong khóa học, hoặc lưu bộ từ vào thư viện của bạn.</p>
				<CourseVocabHub courseSlug={course.slug} sets={course.vocabSets} />
		</div></main></>
	);
}
