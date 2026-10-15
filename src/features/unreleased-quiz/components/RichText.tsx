import { Fragment } from 'react';

/** Renders a paragraph where `*text*` becomes italic. Nothing else is parsed. */
export function RichText({ text }: { text: string }) {
	const parts = text.split(/(\*[^*]+\*)/g);
	return (
		<>
			{parts.map((part, index) =>
				part.startsWith('*') && part.endsWith('*') && part.length > 2 ? (
					<em key={index}>{part.slice(1, -1)}</em>
				) : (
					<Fragment key={index}>{part}</Fragment>
				),
			)}
		</>
	);
}

export function Paragraphs({ items, className = '' }: { items: string[]; className?: string }) {
	return (
		<div className={`space-y-4 ${className}`}>
			{items.map((item) => (
				<p key={item}>
					<RichText text={item} />
				</p>
			))}
		</div>
	);
}
