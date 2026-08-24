import PerformanceView from '@/components/myclass/admin/PerformanceView';

export const dynamic = 'force-dynamic';

export default async function ResultsPage({
	params,
	searchParams,
}: {
	params: Promise<{ id: string }>;
	searchParams: Promise<{
		cohortId?: string;
		userId?: string;
		q?: string;
		page?: string;
		pageSize?: string;
		sortBy?: string;
		sortDir?: string;
	}>;
}) {
	const { id } = await params;
	const extra = await searchParams;
	return <PerformanceView courseId={id} {...extra} embedded />;
}
