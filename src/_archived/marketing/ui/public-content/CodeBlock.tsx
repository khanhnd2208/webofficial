'use client';

import * as React from 'react';

type Props = React.ComponentPropsWithoutRef<'pre'> & { node?: unknown };

export default function CodeBlock({ node: _node, className, children, ...rest }: Props) {
	const preRef = React.useRef<HTMLPreElement | null>(null);
	const [copied, setCopied] = React.useState(false);
	void _node;

	// Extract language from the code element's className (e.g. "language-js")
	const codeChild = React.Children.toArray(children).find(
		(child): child is React.ReactElement<{ className?: string }> =>
			React.isValidElement(child) && (child as React.ReactElement<{ className?: string }>).type === 'code'
	) as React.ReactElement<{ className?: string }> | undefined;
	const codeClassName = codeChild?.props?.className ?? '';
	const langMatch = typeof codeClassName === 'string' ? codeClassName.match(/language-(\w+)/) : null;
	const language = langMatch?.[1] ?? '';

	async function onCopy() {
		const text = preRef.current?.innerText ?? '';
		if (!text) return;
		await navigator.clipboard.writeText(text);
		setCopied(true);
		window.setTimeout(() => setCopied(false), 1200);
	}

	return (
		<div className="group relative my-6 overflow-hidden border border-border">
			{/* Thanh tiêu đề gồm ngôn ngữ và nút sao chép */}
			<div className="flex items-center justify-between border-b border-border bg-surface-secondary px-4 py-2">
				<span className="text-[10px] font-bold uppercase tracking-widest text-muted">
					{language || 'mã nguồn'}
				</span>
				<button
					type="button"
					onClick={onCopy}
					className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted transition-colors hover:text-foreground"
					aria-label="Sao chép mã"
				>
					{copied ? (
						<>
							<svg className="h-3 w-3 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
								<path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
							</svg>
							Đã sao chép
						</>
					) : (
						<>
							<svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
								<path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
							</svg>
							Sao chép
						</>
					)}
				</button>
			</div>
			<pre
				ref={preRef}
				className={[
					'overflow-x-auto bg-surface-elevated p-4 text-sm leading-relaxed text-foreground dark:bg-[#0d0c0b] dark:text-[#f0ece4]',
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
