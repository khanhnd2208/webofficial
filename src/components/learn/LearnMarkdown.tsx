import ReactMarkdown, { type Components } from 'react-markdown';
import type { ReactNode } from 'react';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';

import remarkLearnCallouts from '@/features/learn/remarkCallouts';
import remarkLearnFootnotes from '@/features/learn/remarkFootnotes';
import { headingId } from '@/features/learn/outline';

import LearnFigure from './LearnFigure';

function textOf(children: ReactNode): string {
	if (typeof children === 'string' || typeof children === 'number') return String(children);
	if (Array.isArray(children)) return children.map((child) => textOf(child)).join('');
	return '';
}

const components: Components = {
	table: ({ node: _node, ...props }) => (
		<div className="ln-table">
			<table {...props} />
		</div>
	),
	img: ({ node: _node, src, alt, title }) => (
		<LearnFigure src={typeof src === 'string' ? src : undefined} alt={alt} title={title} />
	),
	h2: ({ node: _node, children }) => <h2 id={headingId(textOf(children))}>{children}</h2>,
	h3: ({ node: _node, children }) => <h3 id={headingId(textOf(children))}>{children}</h3>,
	h4: ({ node: _node, children }) => <h4 id={headingId(textOf(children))}>{children}</h4>,
	a: ({ node: _node, href, ...props }) => {
		const external = typeof href === 'string' && /^https?:\/\//.test(href);
		return (
			<a href={href} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})} {...props} />
		);
	},
};

/** NDK markdown → reader prose. Raw HTML is never rendered. */
export default function LearnMarkdown({ markdown }: { markdown: string }) {
	return (
		<div className="ln-prose">
			<ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks, remarkLearnCallouts, remarkLearnFootnotes]} components={components}>
				{markdown}
			</ReactMarkdown>
		</div>
	);
}
