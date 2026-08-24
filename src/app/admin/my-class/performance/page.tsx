import PerformanceView from '@/components/myclass/admin/PerformanceView';

export const dynamic = 'force-dynamic';

export default async function PerformancePage({
	searchParams,
}: {
	searchParams: Promise<{
		courseId?: string;
		cohortId?: string;
		userId?: string;
		q?: string;
		page?: string;
		pageSize?: string;
		sortBy?: string;
		sortDir?: string;
	}>;
}) {
	const params = await searchParams;
	return <PerformanceView {...params} />;
}
