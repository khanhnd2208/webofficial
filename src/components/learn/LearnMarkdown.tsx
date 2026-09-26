import ReactMarkdown, { type Components, type ExtraProps } from 'react-markdown';
import { isValidElement, type ReactNode } from 'react';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';

import remarkLearnCallouts from '@/features/learn/remarkCallouts';
import remarkLearnFootnotes from '@/features/learn/remarkFootnotes';
import { headingId } from '@/features/learn/outline';

import LearnFigure from './LearnFigure';
import LearnMermaid from './LearnMermaid';

function mermaidSource(children: ReactNode): string | null {
	const child = Array.isArray(children) ? children[0] : children;
	if (!isValidElement<{ className?: string; children?: ReactNode }>(child)) return null;
	const className = child.props.className ?? '';
	if (!className.split(/\s+/).includes('language-mermaid')) return null;
	return textOf(child.props.children).replace(/\n$/, '');
}

function textOf(children: ReactNode): string {
	if (typeof children === 'string' || typeof children === 'number') return String(children);
	if (Array.isArray(children)) return children.map((child) => textOf(child)).join('');
	return '';
}

/**
 * `![alt](src)` parses as a paragraph around the image, and the image renders as a
 * <figure>, which may not sit inside <p>. The browser splits such markup, so hydration no
 * longer matches and React re-renders the whole page on the client. Unwrap those paragraphs.
 */
function paragraphWithImage(node: ExtraProps['node']): 'only' | 'mixed' | null {
	const children = node?.children ?? [];
	if (!children.some((child) => child.type === 'element' && child.tagName === 'img')) return null;
	const onlyImages = children.every(
		(child) =>
			(child.type === 'element' && (child.tagName === 'img' || child.tagName === 'br')) ||
			(child.type === 'text' && !child.value.trim()),
	);
	return onlyImages ? 'only' : 'mixed';
}

const components: Components = {
	p: ({ node, children }) => {
		const image = paragraphWithImage(node);
		if (image === 'only') return <>{children}</>;
		if (image === 'mixed') return <div>{children}</div>;
		return <p>{children}</p>;
	},
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
	pre: ({ node: _node, children }) => {
		const source = mermaidSource(children);
		if (source !== null) return <LearnMermaid source={source} />;
		return <pre>{children}</pre>;
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
