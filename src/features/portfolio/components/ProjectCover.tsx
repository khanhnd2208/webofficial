import type { Project } from '../data/projects';

const covers: Record<string, { mark: string; title: string; steps: string[]; shape: string }> = {
	'strategic-management-learning-experience': {
		mark: '01 / STRATEGY',
		title: 'Nhìn thấy sự liên kết.',
		steps: ['Phân tích', 'Lựa chọn', 'Thực thi'],
		shape: 'strategy',
	},
	'ai50-ai-cho-moi-nguoi': {
		mark: '02 / AI50',
		title: 'Hiểu việc. Giao việc. Kiểm chứng.',
		steps: ['Công việc', 'AI hỗ trợ', 'Con người kiểm tra'],
		shape: 'ai',
	},
	'learning-at-moonie-cafe': {
		mark: '03 / MOONIE',
		title: 'Lớp học trong đời sống.',
		steps: ['Quan sát', 'Thực hành', 'Suy ngẫm'],
		shape: 'moonie',
	},
	'ai-in-recruitment-research': {
		mark: '04 / INQUIRY',
		title: 'Một câu hỏi còn mở.',
		steps: ['Lợi ích', 'Rủi ro', 'Trách nhiệm'],
		shape: 'research',
	},
};
export default function ProjectCover({
	project,
	compact = false,
}: {
	project: Project;
	compact?: boolean;
}) {
	const c = covers[project.slug] ?? {
		mark: project.kicker,
		title: project.title,
		steps: [],
		shape: 'research',
	};
	return (
		<figure
			className={`book-project-cover cover-${c.shape}${compact ? ' about-project-cover' : ''}`}
			aria-hidden={compact || undefined}
		>
			{!compact ? <span className="book-caption">{c.mark}</span> : null}
			<svg viewBox="0 0 320 160" fill="none" aria-hidden="true">
				{c.shape === 'strategy' ? (
					<>
						<path d="M30 120 105 40 210 110 290 30" />
						<path d="M30 130H290M105 40V130M210 110V130" className="cover-fine" />
						{[
							[30, 120],
							[105, 40],
							[210, 110],
							[290, 30],
						].map(([x, y]) => (
							<circle key={x} cx={x} cy={y} r="7" />
						))}
					</>
				) : c.shape === 'ai' ? (
					<>
						<rect x="25" y="48" width="70" height="70" />
						<rect x="125" y="28" width="70" height="70" />
						<rect x="225" y="48" width="70" height="70" />
						<path d="m95 80 30-20m70 0 30 20M143 62l12 12 23-25" />
					</>
				) : c.shape === 'moonie' ? (
					<>
						<ellipse cx="160" cy="130" rx="102" ry="10" className="cover-fine" />
						<path d="M85 55h120v32a48 48 0 0 1-48 40h-24a48 48 0 0 1-48-40ZM205 65h15a20 20 0 0 1 0 40h-20M125 40c-15-18 15-18 0-36M165 40c-15-18 15-18 0-36" />
					</>
				) : (
					<>
						<circle cx="127" cy="78" r="55" />
						<circle cx="195" cy="78" r="55" />
						<path d="M160 15v128M70 145h180" className="cover-fine" />
						<circle cx="160" cy="78" r="7" />
					</>
				)}
			</svg>
			{!compact ? <p className="book-cover-thesis">{c.title}</p> : null}
			{!compact ? (
				<div className="book-cover-steps">
					{c.steps.map((s) => (
						<span key={s}>{s}</span>
					))}
				</div>
			) : null}
			{!compact ? <figcaption className="book-caption">Minh họa ý tưởng dự án</figcaption> : null}
		</figure>
	);
}
