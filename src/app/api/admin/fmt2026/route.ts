import { getAdminOverview } from '@/features/fmt2026/services/drawService';
import { apiSuccess, withAdmin } from '@/lib/apiUtils';

export const dynamic = 'force-dynamic';

export const GET = withAdmin(async () => apiSuccess(await getAdminOverview()));
