import { AdminStoreView } from '@/app/vocabulary/store/StoreClient';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

export const dynamic = 'force-dynamic';

export default function AdminToolsVocabularyPage() {
	return (
		<div className="px-6 py-8">
			<AdminPageHeader
				eyebrow="Công cụ"
				title="Từ vựng"
				description="Quản lý bộ từ trong cửa hàng. Trang học viên chỉ còn trải nghiệm cửa hàng."
			/>
			<div className="mt-8">
				<AdminStoreView />
			</div>
		</div>
	);
}
