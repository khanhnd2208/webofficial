import { ImportWorkspace } from '@/components/teaching/admin/ImportWorkspace';
import { TeachingAppHeader } from '@/components/teaching/admin/TeachingAppHeader';
import { routes } from '@/config/routes';

export const dynamic = 'force-dynamic';

export default function MySpaceTeachingImportPage() {
	return (
		<div className="mx-auto max-w-6xl py-3 sm:py-5">
			<TeachingAppHeader
				backHref={routes.mySpaceTeaching}
				backLabel="Các lớp"
				eyebrow="Teaching"
				title="Nhập danh sách"
				description="Tải CSV mẫu, dán bảng, hoặc import Excel danh sách học viên."
			/>
			<div className="mt-4 sm:mt-5">
				<ImportWorkspace />
			</div>
		</div>
	);
}
