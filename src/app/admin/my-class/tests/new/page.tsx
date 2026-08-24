import Link from 'next/link';
import { routes } from '@/config/routes';
import NewTestForm from './NewTestForm';

export const dynamic = 'force-dynamic';

export default function NewTestPage() {
	return (
		<div className="mc-studio-container px-0 py-8">
			<Link href={routes.admin.myClassTests} className="text-xs uppercase tracking-widest text-muted">
				← Thư viện test
			</Link>
			<h1 className="mt-6 text-2xl font-black">Tạo bài kiểm tra</h1>
			<p className="mc-meta mt-2">Đặt tên, chọn câu từ ngân hàng, rồi gắn vào bài hoặc phần trong khóa học.</p>
			<NewTestForm />
		</div>
	);
}
