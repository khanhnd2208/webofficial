import Link from 'next/link';

import { MarketingCta } from '@/components/marketing';
import { routes } from '@/config/routes';
import type { PublicCourseIntro } from '@/features/courses/types';

type PublicCourseIntroViewProps = {
	intro: PublicCourseIntro;
	isLoggedIn: boolean;
};

function splitLines(text: string): string[] {
	return text
		.split('\n')
		.map((line) => line.trim())
		.filter(Boolean);
}

export default function PublicCourseIntroView({ intro, isLoggedIn }: PublicCourseIntroViewProps) {
	const outcomes = splitLines(intro.learningOutcomes);
	const prereqs = splitLines(intro.prerequisites);
	const interestHref = `${routes.contact}?type=course&course=${encodeURIComponent(intro.slug)}`;

	return (
		<main className="min-h-screen pb-20">
			<section className="border-b border-hairline">
				<div className="shell py-10 sm:py-14">
					<Link
						href={routes.learnPrograms}
						className="text-xs font-semibold uppercase tracking-widest text-ink-secondary hover:text-ink"
					>
						← Chương trình học
					</Link>
					{intro.thumbnailUrl ? (
						<img
							src={intro.thumbnailUrl}
							alt=""
							className="mt-6 aspect-[16/9] w-full max-w-3xl object-cover"
						/>
					) : null}
					<h1 className="mt-6 font-display text-3xl font-medium tracking-tight text-ink sm:text-4xl lg:text-5xl">
						{intro.title}
					</h1>
					{intro.summary ? (
						<p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-secondary">{intro.summary}</p>
					) : null}
					<div className="mt-8 flex flex-wrap gap-3">
						<MarketingCta href={interestHref}>Quan tâm khóa học</MarketingCta>
						{isLoggedIn ? (
							<Link
								href={routes.accountLearning}
								className="inline-flex min-h-11 items-center rounded-[10px] border border-hairline px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-ink transition duration-200 hover:border-ink"
							>
								Khu học của tôi
							</Link>
						) : (
							<Link
								href={`${routes.login}?from=${routes.course(intro.slug)}`}
								className="inline-flex min-h-11 items-center rounded-[10px] border border-hairline px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-ink transition duration-200 hover:border-ink"
							>
								Đã được mời? Đăng nhập
							</Link>
						)}
					</div>
				</div>
			</section>

			<div className="shell space-y-14 py-10 sm:py-12">
				{(intro.audience || intro.format || intro.durationText) && (
					<section className="grid gap-6 sm:grid-cols-3">
						{intro.audience ? (
							<div>
								<p className="font-mono text-[10px] uppercase tracking-[0.28em] text-ink-secondary">Đối tượng</p>
								<p className="mt-2 text-sm leading-relaxed text-ink">{intro.audience}</p>
							</div>
						) : null}
						{intro.format ? (
							<div>
								<p className="font-mono text-[10px] uppercase tracking-[0.28em] text-ink-secondary">Hình thức</p>
								<p className="mt-2 text-sm leading-relaxed text-ink">{intro.format}</p>
							</div>
						) : null}
						{intro.durationText ? (
							<div>
								<p className="font-mono text-[10px] uppercase tracking-[0.28em] text-ink-secondary">Thời lượng</p>
								<p className="mt-2 text-sm leading-relaxed text-ink">{intro.durationText}</p>
							</div>
						) : null}
					</section>
				)}

				{intro.description ? (
					<section>
						<p className="font-mono text-[10px] uppercase tracking-[0.28em] text-ink-secondary">Giới thiệu</p>
						<div className="prose prose-sm dark:prose-invert mt-4 max-w-none whitespace-pre-wrap text-ink-secondary">
							{intro.description}
						</div>
					</section>
				) : null}

				{outcomes.length > 0 ? (
					<section>
						<p className="font-mono text-[10px] uppercase tracking-[0.28em] text-ink-secondary">Kết quả học tập</p>
						<ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-ink-secondary">
							{outcomes.map((line) => (
								<li key={line}>{line}</li>
							))}
						</ul>
					</section>
				) : null}

				{prereqs.length > 0 ? (
					<section>
						<p className="font-mono text-[10px] uppercase tracking-[0.28em] text-ink-secondary">Điều kiện tiên quyết</p>
						<ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-ink-secondary">
							{prereqs.map((line) => (
								<li key={line}>{line}</li>
							))}
						</ul>
					</section>
				) : null}

				{intro.modules.length > 0 ? (
					<section>
						<p className="font-mono text-[10px] uppercase tracking-[0.28em] text-ink-secondary">Nội dung khóa học</p>
						<p className="mt-2 text-sm text-ink-secondary">
							Chỉ hiển thị tiêu đề chương và bài — nội dung chi tiết dành cho học viên đã ghi danh.
						</p>
						<div className="mt-8 space-y-6">
							{intro.modules.map((mod) => (
								<div key={mod.id} className="border-t border-hairline pt-6">
									<h2 className="font-display text-xl font-medium text-ink">
										Chương {mod.position + 1}. {mod.title}
									</h2>
									{mod.description ? (
										<p className="mt-2 text-sm text-ink-secondary">{mod.description}</p>
									) : null}
									<ol className="mt-4 space-y-2">
										{mod.lessons.map((lesson) => (
											<li key={lesson.id} className="text-sm text-ink-secondary">
												{lesson.position + 1}. {lesson.title}
											</li>
										))}
									</ol>
								</div>
							))}
						</div>
					</section>
				) : null}

				<section className="border-t border-hairline pt-10">
					<p className="font-display text-2xl font-medium text-ink">Muốn tham gia khóa này?</p>
					<p className="mt-2 max-w-xl text-sm text-ink-secondary">
						Gửi inquiry — Khánh sẽ phản hồi sau khi làm rõ nhu cầu và phạm vi, không báo giá tức thì.
					</p>
					<div className="mt-6">
						<MarketingCta href={interestHref}>Gửi yêu cầu quan tâm</MarketingCta>
					</div>
				</section>
			</div>
		</main>
	);
}
