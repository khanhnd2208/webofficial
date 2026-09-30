'use client';

import { useEffect, useId, useRef, useState } from 'react';

type Phase = 'loading' | 'ready' | 'error';

function themeFrom(root: HTMLElement) {
	const style = getComputedStyle(root);
	const read = (name: string, fallback: string) => style.getPropertyValue(name).trim() || fallback;
	const ink = read('--ink', '#111827');
	const paper = read('--paper', '#f4f4f5');
	const accent = read('--bronze', ink);
	const line = read('--hairline', '#e5e7eb');
	const token = read('--ln-ui', '');
	const fontFamily = token.includes('var(') ? style.fontFamily : token || style.fontFamily;
	return { ink, paper, accent, line, fontFamily };
}

/** Renders one ```mermaid fence. The library loads only when a section actually has a diagram. */
export default function LearnMermaid({ source }: { source: string }) {
	const reactId = useId().replace(/:/g, '');
	const hostRef = useRef<HTMLElement>(null);
	const [phase, setPhase] = useState<Phase>('loading');
	const [svg, setSvg] = useState('');
	const [dark, setDark] = useState(false);

	useEffect(() => {
		const root = document.documentElement;
		const sync = () => setDark(root.classList.contains('dark'));
		sync();
		const observer = new MutationObserver(sync);
		observer.observe(root, { attributes: true, attributeFilter: ['class'] });
		return () => observer.disconnect();
	}, []);

	useEffect(() => {
		let cancelled = false;
		setPhase('loading');
		setSvg('');
		const id = `ln-mermaid-${reactId}-${dark ? 'd' : 'l'}`;
		void (async () => {
			try {
				const mermaid = (await import('mermaid')).default;
				const probe =
					hostRef.current?.closest('.ln') ?? hostRef.current ?? document.documentElement;
				const { ink, paper, accent, line, fontFamily } = themeFrom(probe as HTMLElement);
				mermaid.initialize({
					startOnLoad: false,
					securityLevel: 'strict',
					theme: 'base',
					fontFamily,
					flowchart: { useMaxWidth: false, htmlLabels: true, wrappingWidth: 420 },
					themeVariables: {
						primaryColor: paper,
						primaryTextColor: ink,
						primaryBorderColor: line,
						lineColor: accent,
						secondaryColor: paper,
						tertiaryColor: paper,
						background: paper,
						mainBkg: paper,
						nodeBorder: line,
						clusterBkg: paper,
						titleColor: ink,
						edgeLabelBackground: paper,
						fontFamily,
					},
				});
				const rendered = await mermaid.render(id, source);
				if (cancelled) return;
				setSvg(rendered.svg);
				setPhase('ready');
			} catch {
				if (!cancelled) setPhase('error');
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [source, dark, reactId]);

	if (phase === 'error') {
		return (
			<figure ref={hostRef} className="ln-diagram ln-diagram--error">
				<p>Không vẽ được sơ đồ</p>
				<pre>
					<code>{source}</code>
				</pre>
			</figure>
		);
	}

	if (phase !== 'ready') {
		return <figure ref={hostRef} className="ln-diagram ln-diagram--pending" aria-busy="true" />;
	}

	return <figure ref={hostRef} className="ln-diagram" dangerouslySetInnerHTML={{ __html: svg }} />;
}
