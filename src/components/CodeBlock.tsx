'use client';

import * as React from 'react';

type Props = React.ComponentPropsWithoutRef<'pre'> & { node?: unknown };

export default function CodeBlock({ node: _node, className, children, ...rest }: Props) {
	const preRef = React.useRef<HTMLPreElement | null>(null);
	const [copied, setCopied] = React.useState(false);
	void _node;

	async function onCopy() {
		const text = preRef.current?.innerText ?? '';
		if (!text) return;
		await navigator.clipboard.writeText(text);
		setCopied(true);
		window.setTimeout(() => setCopied(false), 1200);
	}

	return (
		<div className="relative">
			<button
				type="button"
				onClick={onCopy}
				className="absolute right-3 top-3 rounded-md bg-white/10 px-2 py-1 text-xs font-medium text-zinc-100 backdrop-blur hover:bg-white/15"
				aria-label="Copy code"
			>
				{copied ? 'Copied' : 'Copy'}
			</button>
			<pre
				ref={preRef}
				className={[
					"overflow-x-auto rounded-lg bg-zinc-950 text-zinc-50",
					className,
				]
					.filter(Boolean)
					.join(' ')}
				{...rest}
			>
				{children}
			</pre>
		</div>
	);
}
