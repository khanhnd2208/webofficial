import ReactMarkdown, { type Components } from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';

import remarkLearnCallouts from '@/features/learn/remarkCallouts';

const components: Components = {
	table: ({ node: _node, ...props }) => (
		<div className="ln-table">
			<table {...props} />
		</div>
	),
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
			<ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks, remarkLearnCallouts]} components={components}>
				{markdown}
			</ReactMarkdown>
		</div>
	);
}
