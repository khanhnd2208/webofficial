import Link from 'next/link';
import {
	getAdminQuestion,
	listAdminKnowledgeUnits,
	listAdminSubjects,
	listAdminTopics,
} from '@/features/my-class';
import { routes } from '@/config/routes';
import QuestionForm from '@/components/myclass/admin/QuestionForm';
import { rethrowUnlessNotFound } from '@/lib/pageErrors';

export const dynamic = 'force-dynamic';

export default async function EditQuestionPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	let question;
	try {
		question = await getAdminQuestion(id);
	} catch (error) {
		rethrowUnlessNotFound(error);
	}
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
			<h1 className="mt-6 text-2xl font-black">Sửa câu hỏi</h1>
			<div className="mt-8">
				<QuestionForm
					initial={{
						id: question.id,
						slug: question.slug,
						type: question.type,
						stem: question.stem,
						options: question.options,
						answer: question.answer,
						explanation: question.explanation,
						hint: question.hint,
						source: question.source,
						difficulty: question.difficulty,
						subjectId: question.subjectId,
						topicId: question.topicId,
						tags: question.tags,
						knowledgeUnitIds: question.knowledgeUnits.map((item) => item.knowledgeUnitId),
					}}
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
