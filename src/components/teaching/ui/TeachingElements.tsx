import type { HTMLAttributes, ReactNode } from 'react';
import { TeachingIcon, type TeachingIconName } from './TeachingIcon';

export function TeachingSectionHeading({
	id,
	icon,
	title,
	description,
	count,
}: {
	id?: string;
	icon: TeachingIconName;
	title: string;
	description?: string;
	count?: number;
}) {
	return (
		<div className="teaching-section-heading">
			<span className="teaching-section-icon">
				<TeachingIcon name={icon} />
			</span>
			<div className="min-w-0">
				<h2 id={id}>
					{title}
					{count !== undefined ? <span className="teaching-count">({count})</span> : null}
				</h2>
				{description ? <p>{description}</p> : null}
			</div>
		</div>
	);
}

export function TeachingEmpty({
	icon = 'class',
	title,
	description,
	children,
	...props
}: HTMLAttributes<HTMLDivElement> & {
	icon?: TeachingIconName;
	title: string;
	description?: string;
	children?: ReactNode;
}) {
	return (
		<div {...props} className={`teaching-empty ${props.className ?? ''}`}>
			<span className="teaching-empty-icon">
				<TeachingIcon name={icon} size={32} />
			</span>
			<p className="teaching-empty-title">{title}</p>
			{description ? <p className="teaching-empty-description">{description}</p> : null}
			{children ? <div className="mt-4">{children}</div> : null}
		</div>
	);
}

export function TeachingStatus({
	tone = 'muted',
	children,
}: {
	tone?: 'ok' | 'info' | 'warning' | 'error' | 'muted';
	children: ReactNode;
}) {
	return (
		<span className="teaching-status" data-tone={tone}>
			{children}
		</span>
	);
}

export function TeachingToolbar({ children, ...props }: HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			{...props}
			className={`mc-gradebook-toolbar teaching-toolbar ${props.className ?? ''}`}
			role="group"
			aria-label={props['aria-label'] ?? 'Công cụ bảng lớp'}
		>
			{children}
		</div>
	);
}
