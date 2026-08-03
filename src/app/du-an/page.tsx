import type { Metadata } from 'next';

import { ProofNote } from '@/components/marketing';
import { routes } from '@/config/routes';
import { absoluteUrl } from '@/config/site';
import { ProjectGrid, projects } from '@/features/portfolio';

export const metadata: Metadata = {
	title: 'Công việc đã thực hiện',
	description:
		'Các chương trình học, nghiên cứu và dự án cố vấn của Duy Khánh, trình bày rõ vấn đề, vai trò, đầu ra và bằng chứng hiện có.',
	alternates: { canonical: absoluteUrl(routes.projects) },
};

export default function ProjectsPage() {
	return (
		<main className="bg-canvas">
			<section className="editorial-section border-b border-hairline">
				<div className="shell">
					<header className="grid gap-8 lg:grid-cols-12 lg:items-end">
						<div className="lg:col-span-8">
							<p className="editorial-label">Selected work</p>
							<h1 className="premium-display mt-5 text-ink">Công việc đã thực hiện</h1>
						</div>
						<div className="lg:col-span-4">
							<p className="premium-lead">
								Mỗi hồ sơ cho thấy vấn đề được xử lý, vai trò của tôi, những gì được tạo ra và giới
								hạn của bằng chứng hiện có.
							</p>
							<ProofNote>
								Phạm vi và số lượng đầu ra không được gọi là tác động. Kết quả chỉ xuất hiện khi có
								căn cứ xác minh.
							</ProofNote>
						</div>
					</header>
					<ProjectGrid projects={projects} />
				</div>
			</section>
		</main>
	);
}
