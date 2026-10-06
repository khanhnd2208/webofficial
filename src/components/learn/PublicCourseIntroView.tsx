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

function MetaItem({ label, value }: { label: string; value?: string | null }) {
	if (!value) return null;
	return (
		<div className="border-t border-hairline pt-4">
			<p className="font-mono text-xs uppercase tracking-[0.25em] text-ink-secondary">{label}</p>
			<p className="mt-2 text-sm leading-relaxed text-ink">{value}</p>
		</div>
	);
}

export default function PublicCourseIntroView({ intro, isLoggedIn }: PublicCourseIntroViewProps) {
	const outcomes = splitLines(intro.learningOutcomes);
	const prereqs = splitLines(intro.prerequisites);
	const interestHref = `${routes.contact}?type=course&course=${encodeURIComponent(intro.slug)}`;

	return (
		<main className="min-h-screen bg-canvas pb-20">
			<section className="relative overflow-hidden border-b border-hairline bg-section-tint">
				{intro.thumbnailUrl ? (
					<div className="pointer-events-none absolute inset-0 opacity-[0.08]" aria-hidden>
						<img src={intro.thumbnailUrl} alt="" className="h-full w-full object-cover grayscale" />
						<div className="absolute inset-0 bg-gradient-to-b from-canvas/40 to-section-tint" />
					</div>
				) : null}
				<div className="shell relative py-12 sm:py-16 lg:py-24">
					<Link
						href={routes.learnPrograms}
						className="inline-flex min-h-11 items-center text-xs font-semibold uppercase tracking-widest text-ink-secondary transition-colors hover:text-ink"
					>
						← Chương trình học
					</Link>

					<div className="mt-10 grid items-center gap-12 lg:grid-cols-12 lg:gap-20">
						<div className="lg:col-span-7">
							<p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
								Khóa học · Duy Khánh
							</p>
							<h1 className="mt-4 max-w-3xl text-balance font-display text-[clamp(3rem,6vw,6rem)] font-normal leading-[0.96] tracking-[-0.04em] text-ink">
								{intro.title}
							</h1>
							{intro.summary ? (
								<p className="mt-7 max-w-2xl text-base font-light leading-[1.85] text-ink-secondary sm:text-lg">
									{intro.summary}
								</p>
							) : null}
							<div className="mt-8 flex flex-wrap gap-3">
								<MarketingCta href={interestHref}>Quan tâm khóa học</MarketingCta>
								{isLoggedIn ? (
									<Link
										href={routes.accountLearning}
										className="inline-flex min-h-11 items-center rounded-[4px] border border-hairline px-5 text-xs font-semibold uppercase tracking-[0.14em] text-ink transition duration-250 hover:border-ink"
									>
										Khu học của tôi
									</Link>
								) : (
									<Link
										href={`${routes.login}?from=${routes.course(intro.slug)}`}
										className="inline-flex min-h-11 items-center rounded-[4px] border border-hairline px-5 text-xs font-semibold uppercase tracking-[0.14em] text-ink transition duration-250 hover:border-ink"
									>
										Đã được mời? Đăng nhập
									</Link>
								)}
							</div>
						</div>

						<div className="lg:col-span-5">
							{intro.thumbnailUrl ? (
								<img
									src={intro.thumbnailUrl}
									alt=""
									className="aspect-[4/3] w-full object-cover grayscale-[20%]"
								/>
							) : (
								<div className="flex aspect-[4/3] w-full items-end border border-hairline bg-paper p-5">
									<p className="font-display text-2xl text-ink-secondary">
										Một lộ trình học có dấu vết.
									</p>
								</div>
							)}
						</div>
					</div>
				</div>
			</section>

			<div className="shell">
				{(intro.audience || intro.format || intro.durationText) && (
					<section className="grid gap-6 border-b border-hairline py-10 sm:grid-cols-3 sm:gap-10 sm:py-12">
						<MetaItem label="Đối tượng" value={intro.audience} />
						<MetaItem label="Hình thức" value={intro.format} />
						<MetaItem label="Thời lượng" value={intro.durationText} />
					</section>
				)}

				<div className="grid gap-16 py-16 sm:py-20 lg:grid-cols-12 lg:gap-20 lg:py-28">
					<div className="space-y-12 lg:col-span-7">
						{intro.description ? (
							<section>
								<p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
									Giới thiệu
								</p>
								<div className="prose prose-sm dark:prose-invert mt-4 max-w-2xl whitespace-pre-wrap text-ink-secondary">
									{intro.description}
								</div>
							</section>
						) : null}

						{outcomes.length > 0 ? (
							<section>
								<p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
									Kết quả học tập
								</p>
								<ul className="mt-6 grid gap-4 sm:grid-cols-2">
									{outcomes.map((line, index) => (
										<li
											key={line}
											className="border border-hairline bg-paper p-6 text-sm leading-relaxed text-ink-secondary"
										>
											<span className="block font-mono text-xs text-accent">0{index + 1}</span>
											<span className="mt-4 block">{line}</span>
										</li>
									))}
								</ul>
							</section>
						) : null}

						{prereqs.length > 0 ? (
							<section>
								<p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
									Điều kiện tiên quyết
								</p>
								<ul className="mt-4 space-y-2 text-sm leading-relaxed text-ink-secondary">
									{prereqs.map((line) => (
										<li key={line}>— {line}</li>
									))}
								</ul>
							</section>
						) : null}
					</div>

					{intro.modules.length > 0 ? (
						<aside className="lg:col-span-5">
							<div className="lg:sticky lg:top-[calc(var(--header-height)+2rem)]">
								<p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
									Nội dung khóa học
								</p>
								<p className="mt-3 text-sm leading-relaxed text-ink-secondary">
									Các chương và bài học được mở để bạn xem trước cấu trúc lộ trình.
								</p>
								<ol className="relative mt-8 ml-3 border-l border-hairline">
									{intro.modules.map((mod) => (
										<li key={mod.id} className="relative border-b border-hairline py-6 pl-8">
											<span
												className="absolute -left-[5px] top-8 h-[9px] w-[9px] rounded-full border border-accent bg-canvas"
												aria-hidden
											/>
											<div className="flex gap-4">
												<span className="font-mono text-xs text-accent">
													{String(mod.position + 1).padStart(2, '0')}
												</span>
												<div className="min-w-0">
													<h2 className="font-display text-xl font-medium text-ink">{mod.title}</h2>
													{mod.description ? (
														<p className="mt-2 text-sm leading-relaxed text-ink-secondary">
															{mod.description}
														</p>
													) : null}
													<ol className="mt-3 space-y-1.5 text-xs leading-relaxed text-ink-secondary">
														{mod.lessons.map((lesson) => (
															<li key={lesson.id}>
																{lesson.position + 1}. {lesson.title}
															</li>
														))}
													</ol>
												</div>
											</div>
										</li>
									))}
								</ol>
							</div>
						</aside>
					) : null}
				</div>

				<section className="border-t border-hairline py-12 sm:py-16">
					<p className="max-w-2xl font-display text-3xl font-medium leading-tight text-ink sm:text-4xl">
						Muốn tham gia khóa này?
					</p>
					<p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-secondary">
						Gửi vài dòng về điều bạn muốn học. Khánh sẽ phản hồi sau khi hiểu rõ nhu cầu và cách
						đồng hành phù hợp.
					</p>
					<div className="mt-7">
						<MarketingCta href={interestHref}>Gửi yêu cầu quan tâm</MarketingCta>
					</div>
				</section>
			</div>
		</main>
	);
}
