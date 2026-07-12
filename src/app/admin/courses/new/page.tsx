import Link from 'next/link';

import { routes } from '@/config/routes';

import CreateCourseForm from './CreateCourseForm';

export const metadata = {
	title: 'Tạo khóa học | Admin',
};

export default function NewCoursePage() {
	return (
		<div className="mx-auto max-w-3xl px-6 py-8">
			<Link href={routes.admin.courses} className="text-xs font-bold uppercase tracking-widest text-muted hover:text-foreground">
				← Khóa học
			</Link>
			<h1 className="mt-4 text-2xl font-black tracking-tight text-foreground">Tạo khóa học</h1>
			<CreateCourseForm />
		</div>
	);
}
