import Link from 'next/link';
import { RecallAnalyticsReport } from '@/components/teaching/admin/RecallAnalyticsReport';
import { routes } from '@/config/routes';
import { getRecallReport } from '@/features/active-recall/analytics/report';
import { recallReportFilters } from '@/features/active-recall/analytics/time';
import { AppError } from '@/lib/appError';
export const dynamic = 'force-dynamic';
export default async function RecallAnalyticsPage({
	searchParams,
}: {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
	const params = await searchParams;
	let report;
	let message = '';
	try {
		const query = Object.fromEntries(
			Object.entries(params).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]),
		);
		report = await getRecallReport(recallReportFilters(query));
	} catch (error) {
		if (!(error instanceof AppError) || error.status !== 400) throw error;
		message = error.message;
	}
	if (!report)
		return (
			<div className="mx-auto max-w-6xl py-8">
				<p role="alert">{message}</p>
				<Link className="mt-4 inline-block underline" href={routes.mySpaceTeachingRecallAnalytics}>
					Xem 30 ngày gần nhất
				</Link>
			</div>
		);
	return <RecallAnalyticsReport report={report} />;
}
