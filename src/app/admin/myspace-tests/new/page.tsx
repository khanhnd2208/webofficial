import Link from 'next/link';

import { routes } from '@/config/routes';
import SpaceTestForm from '../SpaceTestForm';

export const metadata = {
	title: 'Tạo bài test | My Space Tests',
};

export default function NewSpaceTestPage() {
	return (
		<div className="mx-auto max-w-3xl px-6 py-8">
			<p className="text-xs font-bold uppercase tracking-widest text-muted">My Space Tests</p>
			<h1 className="mt-1 text-2xl font-black tracking-tight text-foreground">Tạo bài test</h1>
			<p className="mt-2 text-sm text-muted">
				Chọn môn, đặt tên và số câu. Khuyến nghị dùng{' '}
				<Link href={routes.admin.myspaceQuestionsImport} className="underline underline-offset-2">
					import thông minh
				</Link>{' '}
				để tạo bài kèm câu hỏi.
			</p>
			<Link
				href={routes.admin.myspaceTests}
				className="mt-3 inline-block text-sm text-muted hover:text-foreground"
			>
				← Danh sách
			</Link>
			<SpaceTestForm />
		</div>
	);
}
