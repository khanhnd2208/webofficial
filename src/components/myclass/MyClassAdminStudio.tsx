import { routes } from '@/config/routes';
import MyClassStudioLink from './MyClassStudioLink';

export default function MyClassAdminStudio({ empty = false }: { empty?: boolean }) {
	return (
		<section
			aria-label="Studio lớp học"
			className="mt-8 flex flex-col gap-3 rounded-[var(--mc-r-md)] border border-mc-rule/30 bg-paper px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"
		>
			<div className="min-w-0">
				<p className="mc-eyebrow text-accent">Admin</p>
				<p className="mc-h3 mt-1">Thiết kế lớp học</p>
				<p className="mc-meta mt-0.5">
					{empty ? 'Tạo lớp mới rồi soạn bài trước khi xuất bản.' : 'Soạn nội dung và xem trước đúng như học viên thấy.'}
				</p>
			</div>
			<div className="flex flex-wrap gap-2">
				<MyClassStudioLink href={routes.admin.myClass} variant="solid">
					Mở studio
				</MyClassStudioLink>
				<MyClassStudioLink href={routes.admin.myClassCourseNew} variant="quiet">
					Tạo lớp mới
				</MyClassStudioLink>
			</div>
		</section>
	);
}
