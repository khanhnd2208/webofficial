import NotFoundPanel from '@/components/site/NotFoundPanel';

export default function ClassNotFound() {
	return (
		<NotFoundPanel eyebrow="Lớp học" title="Chưa mở được trang lớp này">
			Trang lớp có thể chưa được bật công khai, lớp đã kết thúc, hoặc link bị thiếu ký tự. Hãy mở
			lại đúng link giảng viên gửi trong nhóm lớp.
		</NotFoundPanel>
	);
}
