import Link from 'next/link';
import { getAdminKnowledgeUnit } from '@/features/my-class';
import { routes } from '@/config/routes';
import KnowledgeEditor from '@/components/myclass/admin/KnowledgeEditor';
import { rethrowUnlessNotFound } from '@/lib/pageErrors';

export const dynamic = 'force-dynamic';

export default async function EditKnowledgePage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	let unit;
	try {
		unit = await getAdminKnowledgeUnit(id);
	} catch (error) {
		rethrowUnlessNotFound(error);
	}
	return (
		<div className="mc-studio-container px-0 py-8">
			<Link
				href={routes.admin.myClassKnowledge}
				className="text-xs uppercase tracking-widest text-muted"
			>
				← Thư viện nội dung
			</Link>
			<h1 className="mt-6 text-2xl font-black">{unit.title}</h1>
			<div className="mt-8">
				<KnowledgeEditor initial={unit} />
			</div>
		</div>
	);
}
