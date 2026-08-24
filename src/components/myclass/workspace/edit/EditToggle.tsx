'use client';

import { useRouter } from 'next/navigation';
import { McButton, McIcon } from '@/components/myclass/ui';
import MyClassStudioLink from '@/components/myclass/MyClassStudioLink';
import { routes } from '@/config/routes';

export default function EditToggle({
	courseId,
	editMode,
	showStudio = true,
}: {
	courseSlug?: string;
	courseId: string;
	editMode: boolean;
	showStudio?: boolean;
}) {
	const router = useRouter();

	function toggle() {
		const url = new URL(window.location.href);
		if (editMode) url.searchParams.delete('edit');
		else url.searchParams.set('edit', '1');
		router.push(`${url.pathname}${url.search}${url.hash}`);
	}

	return (
		<div className="flex flex-wrap items-center gap-2">
			<McButton
				size="sm"
				variant={editMode ? 'primary' : 'secondary'}
				onClick={toggle}
				data-testid="my-class-edit-toggle"
				aria-pressed={editMode}
			>
				<McIcon name="edit" size={16} />
				{editMode ? 'Xem như học viên' : 'Chỉnh sửa'}
			</McButton>
			{showStudio ? (
				<MyClassStudioLink href={routes.admin.myClassCourseContent(courseId)} variant="quiet">
					Studio
				</MyClassStudioLink>
			) : null}
		</div>
	);
}
