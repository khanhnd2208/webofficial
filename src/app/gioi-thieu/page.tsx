import type { Metadata } from 'next';
import Image from 'next/image';

import { TrackedLink, TrustStrip } from '@/components/marketing';
import { SectionReveal } from '@/components/motion';
import { routes } from '@/config/routes';
import { absoluteUrl } from '@/config/site';
import { verifiedTrustItems } from '@/content/publicMarketing';

export const metadata: Metadata = {
	title: 'Giới thiệu — Nguyễn Duy Khánh',
	description:
		'Nguyễn Duy Khánh làm việc ở giao điểm giữa quản trị, thiết kế học tập và ứng dụng AI, kết nối sự chính xác của lý thuyết với thực hành.',
	alternates: { canonical: absoluteUrl(routes.about) },
};

const roles = [
	{
		title: 'Educator',
		body: 'Cấu trúc lại kiến thức quản trị khó, nối lý thuyết với case và tạo hoạt động buộc người học tự đưa ra quyết định.',
		project: 'strategic-management-learning-experience',
		link: 'Xem trải nghiệm học Strategic Management',
	},
	{
		title: 'Learning Designer',
		body: 'Chuyển mục tiêu học tập thành course map, học liệu, bài tập, workflow và tiêu chuẩn kiểm chứng có thể sử dụng.',
		project: 'ai50-ai-cho-moi-nguoi',
		link: 'Xem chương trình AI50',
	},
	{
		title: 'Advisor',
		body: 'Kết nối dữ liệu về khách hàng, vận hành và con người để giúp tổ chức nhìn đúng vấn đề và xác định ưu tiên khả thi.',
		project: 'moonie-cafe-business-development',
		link: 'Xem case doanh nghiệp',
	},
] as const;

const principles = [
	[
		'01',
		'Rõ nhưng không làm sai',
		'Giải thích dễ tiếp cận, đồng thời giữ nguyên những sắc thái và giới hạn quan trọng.',
	],
	[
		'02',
		'Thiết kế để sử dụng',
		'Mỗi khái niệm cần đi đến một hoạt động, công cụ hoặc quyết định phù hợp với bối cảnh.',
	],
	[
		'03',
		'Con người chịu trách nhiệm',
		'Công nghệ hỗ trợ tư duy; quyền đánh giá và quyết định cuối cùng vẫn thuộc về con người.',
	],
] as const;

const milestones = [
	['Nền tảng quản trị', 'Học tập tại Khoa Quản trị Kinh doanh và Du lịch, Trường Đại học Hà Nội.'],
	['Mở rộng góc nhìn', 'Hoàn thành chương trình thạc sĩ Quản trị kinh doanh tại Ý.'],
	['Đi qua thực hành', 'Làm việc trong các lĩnh vực giáo dục, nhân sự và khởi nghiệp.'],
	[
		'Trở lại giáo dục',
		'Giảng dạy tại Trường Đại học Hà Nội và phát triển các trải nghiệm học về quản trị, AI.',
	],
] as const;

export default function AboutPage() {
	return (
		<main className="bg-canvas">
			<section className="border-b border-hairline">
				<div className="shell grid items-center gap-10 py-12 md:grid-cols-12 md:py-16 lg:py-20">
					<header className="md:col-span-7">
						<p className="editorial-label">Giới thiệu</p>
						<h1 className="premium-display mt-5 max-w-[14ch] text-ink">
							Tôi làm giáo dục để tiếp tục học.
						</h1>
						<p className="premium-lead mt-6 max-w-2xl">
							Tôi làm việc ở giao điểm giữa học thuật và thực hành: giữ sự chính xác của lý thuyết,
							nhưng luôn tìm cách chuyển nó thành điều con người có thể hiểu và sử dụng.
						</p>
						<div className="mt-8 flex flex-col gap-3 sm:flex-row">
							<TrackedLink
								href="#cong-viec-hien-tai"
								event="home_secondary_cta_click"
								payload={{ sourcePage: routes.about, label: 'current-work' }}
								className="editorial-button editorial-button-dark"
							>
								Xem công việc hiện tại <span aria-hidden>↓</span>
							</TrackedLink>
							<TrackedLink
								href={routes.projects}
								event="home_secondary_cta_click"
								payload={{ sourcePage: routes.about, label: 'projects' }}
								className="editorial-button"
							>
								Xem công việc đã thực hiện <span aria-hidden>→</span>
							</TrackedLink>
						</div>
					</header>
					<div className="md:col-span-5">
						<figure>
							<div className="premium-media relative aspect-[4/5]">
								<Image
									src="/brand/hero-figure.jpg"
									alt="Minh họa chân dung Duy Khánh"
									fill
									priority
									sizes="(max-width: 767px) calc(100vw - 48px), 40vw"
									className="object-cover grayscale-[12%]"
								/>
							</div>
							<figcaption className="mt-3 text-sm leading-[1.65] text-ink-secondary">
								Hình minh họa hiện tại; sẽ thay bằng chân dung thật khi có ảnh được phê duyệt.
							</figcaption>
						</figure>
					</div>
				</div>
			</section>

			<section className="bg-paper">
				<div className="shell py-9">
					<TrustStrip items={verifiedTrustItems} />
				</div>
			</section>

			<section
				id="cong-viec-hien-tai"
				className="editorial-section scroll-mt-24 border-y border-hairline"
			>
				<div className="shell grid gap-12 lg:grid-cols-12 lg:gap-20">
					<header className="lg:col-span-4">
						<p className="editorial-label">Công việc hiện tại</p>
						<h2 className="editorial-heading mt-4">
							Biến kiến thức phức tạp thành năng lực có thể sử dụng.
						</h2>
					</header>
					<div className="space-y-5 text-base leading-[1.75] text-ink-secondary lg:col-span-6 lg:col-start-7">
						<p>
							Tôi là Nguyễn Duy Khánh — giảng viên quản trị và người thiết kế trải nghiệm học tập
							tại Trường Đại học Hà Nội.
						</p>
						<p>
							Trong lớp học, tôi tổ chức lại lý thuyết thành một hành trình phân tích, lựa chọn và
							thực hành. Khi làm việc với AI, tôi bắt đầu từ công việc và tiêu chuẩn của con người,
							sau đó mới xác định công cụ nên tham gia ở đâu.
						</p>
						<p>
							Cùng một cách tiếp cận được dùng trong công việc với tổ chức: hiểu mối liên hệ giữa
							vấn đề, dữ liệu và nguồn lực trước khi thiết kế lựa chọn có thể thực hiện.
						</p>
					</div>
				</div>
			</section>

			<section className="editorial-section border-b border-hairline bg-paper">
				<div className="shell">
					<header className="max-w-3xl">
						<p className="editorial-label">Ba vai trò, một năng lực lõi</p>
						<h2 className="editorial-heading mt-4">
							Từ hiểu biết đến trải nghiệm, công cụ và quyết định.
						</h2>
					</header>
					<div className="mt-12 grid gap-10 md:grid-cols-3">
						{roles.map((role) => (
							<SectionReveal key={role.title} className="premium-card pt-7">
								<h3 className="type-h3">{role.title}</h3>
								<p className="mt-4 text-base leading-[1.7] text-ink-secondary">{role.body}</p>
								<TrackedLink
									href={routes.project(role.project)}
									event="service_proof_click"
									payload={{ slug: role.project, sourcePage: routes.about }}
									className="editorial-text-link mt-6"
								>
									{role.link} <span aria-hidden>→</span>
								</TrackedLink>
							</SectionReveal>
						))}
					</div>
				</div>
			</section>

			<section id="dau-moc" className="editorial-section scroll-mt-24 border-b border-hairline">
				<div className="shell grid gap-12 lg:grid-cols-12 lg:gap-20">
					<header className="lg:col-span-4">
						<p className="editorial-label">Hành trình nghề nghiệp</p>
						<h2 className="editorial-heading mt-4">Từ quản trị đến thực hành, giáo dục và AI.</h2>
					</header>
					<ol className="border-t border-hairline lg:col-span-7 lg:col-start-6">
						{milestones.map(([label, body], index) => (
							<li
								key={label}
								className="grid grid-cols-[3rem_1fr] gap-5 border-b border-hairline py-6"
							>
								<span className="font-mono text-xs text-accent">0{index + 1}</span>
								<div>
									<p className="editorial-label">{label}</p>
									<p className="mt-3 text-base leading-[1.7] text-ink-secondary">{body}</p>
								</div>
							</li>
						))}
					</ol>
				</div>
			</section>

			<section className="editorial-section border-b border-hairline bg-paper">
				<div className="shell">
					<p className="editorial-label">Nguyên tắc làm việc</p>
					<div className="mt-10 grid border-t border-hairline md:grid-cols-3">
						{principles.map(([number, title, body]) => (
							<article
								key={number}
								className="border-b border-hairline py-8 md:border-r md:px-6 md:last:border-r-0"
							>
								<span className="font-mono text-xs text-accent">{number}</span>
								<h2 className="type-h3 mt-5">{title}</h2>
								<p className="mt-3 text-base leading-[1.7] text-ink-secondary">{body}</p>
							</article>
						))}
					</div>
				</div>
			</section>

			<section className="editorial-section bg-ink text-center text-canvas">
				<div className="shell mx-auto max-w-3xl">
					<p className="editorial-label !text-sunlight">Cùng làm việc</p>
					<h2 className="editorial-heading mx-auto mt-5 max-w-3xl text-balance text-canvas">
						Bạn muốn học, thiết kế một chương trình hay giải quyết một vấn đề trong tổ chức?
					</h2>
					<TrackedLink
						href={routes.contact}
						event="contact_open"
						payload={{ sourcePage: routes.about }}
						className="editorial-button mt-8 border-canvas bg-canvas text-ink"
					>
						Chọn nội dung muốn trao đổi <span aria-hidden>→</span>
					</TrackedLink>
				</div>
			</section>
		</main>
	);
}
