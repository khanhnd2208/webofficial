import Link from 'next/link';

import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { routes } from '@/config/routes';

export const dynamic = 'force-dynamic';

const PUBLIC_PAGES = [
	{ href: routes.home, label: 'Trang mở đầu', description: 'Màn hình “Trở thành” trước mục lục.' },
	{ href: routes.toc, label: 'Mục lục', description: 'Cổng Giới thiệu, Dự án và Dịch vụ.' },
	{ href: routes.about, label: 'Giới thiệu', description: 'Hành trình và công việc hiện tại.' },
	{ href: routes.projects, label: 'Dự án', description: 'Các lớp học và thử nghiệm đã làm.' },
	{ href: routes.services, label: 'Dịch vụ', description: 'Ba hướng làm việc cùng tôi.' },
	{ href: routes.contact, label: 'Liên hệ', description: 'Biểu mẫu gửi lời nhắn công khai.' },
	{ href: routes.mySpace, label: 'My Space', description: 'Cổng vào Teaching.' },
] as const;

export default function AdminWebsitePage() {
	return (
		<div className="mx-auto max-w-6xl px-6 py-8">
			<AdminPageHeader
				eyebrow="Website"
				title="Website"
				description="Xem các trang thương hiệu đang chạy. Nội dung giới thiệu chưa có trình sửa trong admin ở giai đoạn này."
			/>

			<section className="mt-8">
				<p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted/70">
					Trang công khai
				</p>
				<div className="grid gap-3 sm:grid-cols-2">
					{PUBLIC_PAGES.map((page) => (
						<a
							key={page.href}
							href={page.href}
							target="_blank"
							rel="noopener noreferrer"
							className="rounded-xl border border-border bg-surface p-5 transition-colors hover:border-border-hover"
						>
							<p className="text-sm font-bold text-foreground">{page.label} ↗</p>
							<p className="mt-1 text-sm text-muted">{page.description}</p>
						</a>
					))}
				</div>
			</section>

			<section className="mt-10">
				<p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted/70">Hộp thư</p>
				<Link
					href={routes.admin.inquiries}
					className="flex items-start justify-between gap-4 rounded-xl border border-foreground bg-foreground p-5 text-background transition-colors hover:bg-foreground/90"
				>
					<div>
						<p className="text-sm font-bold">Yêu cầu liên hệ</p>
						<p className="mt-1 text-sm text-background/70">
							Lời nhắn từ biểu mẫu /lien-he — giữ nguyên hộp thư hiện có.
						</p>
					</div>
					<span className="text-sm font-semibold">Mở hộp thư →</span>
				</Link>
			</section>
		</div>
	);
}
