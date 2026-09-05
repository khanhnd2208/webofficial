import type { LearningExperienceChoice } from '@/features/teaching/types';
import type { CSSProperties } from 'react';

import { McIcon } from '@/components/myclass/ui';

export function LearningExperienceMark({
	choice,
	size = 'md',
	index = 0,
	appearance = 'badge',
}: {
	choice?: LearningExperienceChoice | null;
	size?: 'sm' | 'md';
	index?: number;
	appearance?: 'badge' | 'quiet';
}) {
	if (!choice) return null;
	const tone = choice === 'CHALLENGE' ? 'challenge' : 'support';
	const quiet = appearance === 'quiet';
	const title = quiet
		? choice === 'CHALLENGE'
			? 'Quyết tâm'
			: 'Tự giác và enjoy'
		: choice === 'CHALLENGE'
			? 'Challenge mode'
			: 'Royal support mode';
	return (
		<span
			className="lx-mark"
			data-tone={tone}
			data-size={size}
			data-appearance={appearance}
			style={{ '--lx-delay': `${(index % 7) * 320}ms` } as CSSProperties}
			title={title}
			aria-label={title}
		>
			{quiet ? (
				<svg className="lx-mark-quiet-icon" viewBox="0 0 20 20" aria-hidden="true">
					{choice === 'CHALLENGE' ? (
						<>
							<circle cx="10" cy="10" r="6.75" />
							<circle cx="10" cy="10" r="3.25" />
							<path d="m10 10 5.75-5.75M13.5 4.25h2.25V6.5" />
						</>
					) : (
						<>
							<circle cx="10" cy="10" r="7" />
							<path d="M7.25 8h.01M12.75 8h.01M6.75 11.5c.85 1.4 1.94 2.1 3.25 2.1s2.4-.7 3.25-2.1" />
						</>
					)}
				</svg>
			) : (
				<>
					<McIcon
						name={choice === 'CHALLENGE' ? 'bolt' : 'auto_awesome'}
						size={15}
						className="lx-mark-icon"
					/>
					<span className="lx-mark-label">{choice === 'CHALLENGE' ? 'Challenge' : 'Royal'}</span>
				</>
			)}
		</span>
	);
}
