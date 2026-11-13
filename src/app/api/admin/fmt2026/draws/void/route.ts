import { voidLastDraw } from '@/features/fmt2026/services/drawService';
import { AppError, apiSuccess, withAdmin } from '@/lib/apiUtils';

export const POST = withAdmin(async () => {
	const undone = await voidLastDraw();
	if (!undone) throw new AppError('Chưa có lượt nào để hoàn tác', 409);
	return apiSuccess(undone);
});
