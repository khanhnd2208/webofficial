import Link from 'next/link';
import { getAdminTest, listAdminQuestions, listAdminSubjects } from '@/features/my-class';
import { routes } from '@/config/routes';
import TestBuilder from '@/components/myclass/admin/TestBuilder';
import { rethrowUnlessNotFound } from '@/lib/pageErrors';

export const dynamic = 'force-dynamic';

export default async function EditTestPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	let test;
	try {
		test = await getAdminTest(id);
	} catch (error) {
		rethrowUnlessNotFound(error);
	}
	const [questions, subjects] = await Promise.all([
		listAdminQuestions({ take: 20, status: 'ACTIVE' }),
		listAdminSubjects(),
	]);
	return (
		<div className="mc-studio-container px-0 py-8">
			<Link
				href={routes.admin.myClassTests}
				className="text-xs uppercase tracking-widest text-muted"
			>
				← Thư viện test
			</Link>
			<h1 className="mt-6 text-2xl font-black">{test.title}</h1>
			<div className="mt-8">
				<TestBuilder
					initial={test}
					subjects={subjects.map((item) => ({ id: item.id, name: item.name }))}
					bank={questions.map((item) => ({
						id: item.id,
						stem: item.stem,
						type: item.type,
						status: item.status,
						difficulty: item.difficulty,
						knowledgeUnits: item.knowledgeUnits,
					}))}
				/>
			</div>
		</div>
	);
}
