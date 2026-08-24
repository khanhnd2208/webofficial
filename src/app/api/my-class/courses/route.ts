import { listCourses } from '@/features/my-class';
import { apiSuccess, withErrorHandling } from '@/lib/apiUtils';

export const GET = withErrorHandling(async () => apiSuccess(await listCourses()));
