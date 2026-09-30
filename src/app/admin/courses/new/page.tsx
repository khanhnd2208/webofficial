import Link from 'next/link';

import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { routes } from '@/config/routes';

import CreateCourseForm from './CreateCourseForm';

export const metadata = {
	title: 'Tạo khóa học | Admin',
};

export default function NewCoursePage() {
	return (
		<div className="mx-auto max-w-3xl px-6 py-8">
			<AdminPageHeader
				eyebrow="Giảng dạy"
				title="Tạo khóa học"
				description="Khóa học Chương–Bài theo cấu trúc Chương → Bài học."
				actions={
					<Link
						href={routes.admin.courses}
						className="text-xs font-bold uppercase tracking-widest text-muted hover:text-foreground"
					>
						← Khóa học Chương–Bài
					</Link>
				}
			/>
			<div className="mt-8">
				<CreateCourseForm />
			</div>
		</div>
	);
}
