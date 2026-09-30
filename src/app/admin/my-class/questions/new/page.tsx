import Link from 'next/link';
import { listAdminKnowledgeUnits, listAdminSubjects, listAdminTopics } from '@/features/my-class';
import { routes } from '@/config/routes';
import QuestionForm from '@/components/myclass/admin/QuestionForm';

export const dynamic = 'force-dynamic';

export default async function NewQuestionPage() {
	const [units, subjects, topics] = await Promise.all([
		listAdminKnowledgeUnits({}),
		listAdminSubjects(),
		listAdminTopics(),
	]);
	return (
		<div className="mc-studio-container px-0 py-8">
			<Link
				href={routes.admin.myClassBank}
				className="text-xs uppercase tracking-widest text-muted"
			>
				← Ngân hàng câu hỏi
			</Link>
			<h1 className="mt-6 text-2xl font-black">Tạo câu hỏi</h1>
			<div className="mt-8">
				<QuestionForm
					knowledgeUnits={units.map((item) => ({
						id: item.id,
						title: item.title,
						slug: item.slug,
					}))}
					subjects={subjects.map((item) => ({ id: item.id, name: item.name }))}
					topics={topics.map((item) => ({
						id: item.id,
						name: item.name,
						path: item.path,
						subjectId: item.subjectId,
					}))}
				/>
			</div>
		</div>
	);
}
