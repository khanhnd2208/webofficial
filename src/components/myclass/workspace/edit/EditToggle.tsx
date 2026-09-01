'use client';

import MyClassStudioLink from '@/components/myclass/MyClassStudioLink';
import { routes } from '@/config/routes';

export default function EditToggle({
	courseId,
}: {
	courseSlug?: string;
	courseId: string;
	editMode?: boolean;
	showStudio?: boolean;
}) {
	return (
		<div className="flex flex-wrap items-center gap-2">
			<MyClassStudioLink
				href={routes.admin.myClassCourseContent(courseId)}
				variant="quiet"
				aria-label="Chỉnh sửa trong Admin"
			>
				<span data-testid="my-class-edit-toggle">Chỉnh sửa</span>
			</MyClassStudioLink>
		</div>
	);
}
