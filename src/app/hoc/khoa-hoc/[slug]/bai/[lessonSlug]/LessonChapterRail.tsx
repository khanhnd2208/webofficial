import Link from 'next/link';

type RailLesson = {
	slug: string;
	title: string;
	position: number;
	completed: boolean;
	href: string;
};

type LessonChapterRailProps = {
	moduleTitle: string;
	currentSlug: string;
	lessons: RailLesson[];
};

/**
 * Desktop chapter rail — sibling lessons in the current module.
 */
export default function LessonChapterRail({
	moduleTitle,
	currentSlug,
	lessons,
}: LessonChapterRailProps) {
	return (
		<nav
			aria-label="Bài trong chương"
			className="sticky top-24 hidden max-h-[calc(100svh-8rem)] overflow-y-auto lg:block"
		>
			<p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-secondary">
				{moduleTitle}
			</p>
			<ul className="mt-4 space-y-0 border-l border-hairline">
				{lessons.map((item) => {
					const active = item.slug === currentSlug;
					return (
						<li key={item.slug}>
							<Link
								href={item.href}
								className={`flex items-start gap-2 border-l-2 py-2.5 pl-4 text-sm leading-snug transition-colors duration-200 ${
									active
										? 'border-vermilion font-semibold text-ink'
										: 'border-transparent text-ink-secondary hover:border-hairline hover:text-ink'
								}`}
							>
								<span className="font-mono text-[10px] text-ink-secondary/80">
									{item.position + 1}
								</span>
								<span className="min-w-0 flex-1">{item.title}</span>
								{item.completed ? (
									<span
										className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-vermilion text-[8px] font-bold text-paper"
										aria-label="Hoàn thành"
									>
										✓
									</span>
								) : null}
							</Link>
						</li>
					);
				})}
			</ul>
		</nav>
	);
}
