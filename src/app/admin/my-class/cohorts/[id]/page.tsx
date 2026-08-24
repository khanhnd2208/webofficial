import Link from 'next/link';
import { getAdminCohort } from '@/features/my-class';
import { routes } from '@/config/routes';
import CohortRoster from '@/components/myclass/admin/CohortRoster';
import CohortEditor from '@/components/myclass/admin/CohortEditor';
import { rethrowUnlessNotFound } from '@/lib/pageErrors';

export const dynamic = 'force-dynamic';

export default async function EditCohortPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	let cohort;
	try {
		cohort = await getAdminCohort(id);
	} catch (error) {
		rethrowUnlessNotFound(error);
	}
	return (
		<div className="mc-studio-container px-0 py-8">
			<Link href={routes.admin.myClassCohorts} className="text-xs uppercase tracking-widest text-muted">← Nhóm học</Link>
			<h1 className="mt-6 text-2xl font-black">{cohort.name}</h1>
			<p className="mt-1 text-sm text-muted">{cohort.course.title} · {cohort.term}</p>
			<CohortEditor cohort={{ id: cohort.id, name: cohort.name, term: cohort.term, startsAt: cohort.startsAt?.toISOString() ?? null, endsAt: cohort.endsAt?.toISOString() ?? null, status: cohort.status }} />
			<div className="mt-8">
				<CohortRoster cohortId={cohort.id} members={cohort.members} />
			</div>
			<p className="mt-8 text-sm">
				<Link href={`${routes.admin.myClassPerformance}?courseId=${cohort.courseId}&cohortId=${cohort.id}`} className="underline">
					Xem kết quả
				</Link>
			</p>
		</div>
	);
}
