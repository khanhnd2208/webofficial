import NotFoundPanel from '@/components/site/NotFoundPanel';
import { routes } from '@/config/routes';

export default function CourseNotFound() {
	return (
		<NotFoundPanel
			eyebrow="Khóa học"
			title="Chưa mở được khóa học này"
			primary={{ href: routes.learnCourses, label: 'Xem các khóa học' }}
		>
			Khóa học có thể chưa được công bố, đã đổi đường dẫn, hoặc link bị thiếu ký tự. Hãy kiểm tra
			lại link giảng viên gửi, hoặc chọn khóa học trong danh sách.
		</NotFoundPanel>
	);
}
