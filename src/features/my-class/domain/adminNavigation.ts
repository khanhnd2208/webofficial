import { routes } from '@/config/routes';

export function performanceHref(courseId: string, cohortId?: string, userId?: string) {
	const params = new URLSearchParams({ courseId });
	if (cohortId) params.set('cohortId', cohortId);
	if (userId) params.set('userId', userId);
	return `${routes.admin.myClassPerformance}?${params.toString()}`;
}
