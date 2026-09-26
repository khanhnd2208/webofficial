'use client';

import { useEffect, useId, useRef, useState } from 'react';

type Phase = 'loading' | 'ready' | 'error';
type Mermaid = (typeof import('mermaid'))['default'];

/** Start loading a little before the diagram scrolls into view. */
const NEAR_VIEWPORT = '600px 0px';

// The library is ~2 MB of JavaScript. Load it once per page and keep every rendered SVG,
// so revisiting a section (or toggling back to a theme) never parses or lays out again.
let mermaidPromise: Promise<Mermaid> | null = null;
const svgCache = new Map<string, string>();
let renderQueue: Promise<unknown> = Promise.resolve();

function loadMermaid(): Promise<Mermaid> {
	if (!mermaidPromise) {
		mermaidPromise = import('mermaid').then((mod) => mod.default);
		// A failed chunk download (flaky network) may be retried on the next diagram.
		mermaidPromise.catch(() => {
			mermaidPromise = null;
		});
	}
	return mermaidPromise;
}

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

type Theme = ReturnType<typeof themeFrom>;

function renderDiagram(id: string, source: string, theme: Theme): Promise<string> {
	// mermaid.initialize is global, so renders run one at a time with their own theme.
	const job = renderQueue.then(async () => {
		const mermaid = await loadMermaid();
		const { ink, paper, accent, line, fontFamily } = theme;
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
		return (await mermaid.render(id, source)).svg;
	});
	renderQueue = job.catch(() => undefined);
	return job;
}

/** Resolve once the element is near the viewport; `stop` releases the observer early. */
function whenNear(element: Element): { ready: Promise<void>; stop: () => void } {
	if (typeof IntersectionObserver === 'undefined') return { ready: Promise.resolve(), stop: () => {} };
	let observer: IntersectionObserver | null = null;
	const ready = new Promise<void>((resolve) => {
		observer = new IntersectionObserver(
			(entries) => {
				if (!entries.some((entry) => entry.isIntersecting)) return;
				observer?.disconnect();
				resolve();
			},
			{ rootMargin: NEAR_VIEWPORT },
		);
		observer.observe(element);
	});
	return { ready, stop: () => observer?.disconnect() };
}

/** Renders one ```mermaid fence. The library loads only when a diagram nears the viewport. */
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
		const host = hostRef.current;
		if (!host) return;
		let cancelled = false;
		const probe = (host.closest('.ln') ?? host) as HTMLElement;
		const theme = themeFrom(probe);
		const key = `${dark ? 'd' : 'l'}|${theme.fontFamily}|${source}`;
		const cached = svgCache.get(key);
		const near = cached ? null : whenNear(host);
		void (async () => {
			try {
				await near?.ready;
				if (cancelled) return;
				const rendered =
					cached ?? (await renderDiagram(`ln-mermaid-${reactId}-${dark ? 'd' : 'l'}`, source, theme));
				svgCache.set(key, rendered);
				if (cancelled) return;
				setSvg(rendered);
				setPhase('ready');
			} catch {
				if (!cancelled) setPhase('error');
			}
		})();
		return () => {
			cancelled = true;
			near?.stop();
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
