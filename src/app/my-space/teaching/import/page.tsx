import { ImportWorkspace } from '@/components/teaching/admin/ImportWorkspace';
import { TeachingAppHeader } from '@/components/teaching/admin/TeachingAppHeader';
import { routes } from '@/config/routes';

export const dynamic = 'force-dynamic';

export default function TeachingImportPage() {
	return (
		<div className="py-3 sm:py-5">
			<TeachingAppHeader backHref={routes.mySpaceTeaching} backLabel="Các lớp" eyebrow="Teaching" title="Import danh sách" description="Tải lên mẫu Excel danh sách học viên." />
			<div className="mt-4 sm:mt-5"><ImportWorkspace /></div>
		</div>
	);
}
