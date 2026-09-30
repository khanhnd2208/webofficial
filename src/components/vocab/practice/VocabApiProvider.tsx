'use client';

import Link from 'next/link';
import {
	createContext,
	useCallback,
	useContext,
	forwardRef,
	type ReactNode,
	type HTMLAttributes,
} from 'react';

export type VocabPracticeMode = 'flashcards' | 'mcq' | 'fill-blank' | 'matching' | 'guess-who';

export type VocabChrome = {
	embedded: boolean;
	backHref: string;
	backLabel: string;
	setHref: (id: string) => string;
	modeHref: (id: string, mode?: VocabPracticeMode) => string;
};

const VocabApiContext = createContext<((id: string) => string) | null>(null);
const VocabScoreContext = createContext<((id: string) => string) | null>(null);
const VocabChromeContext = createContext<VocabChrome | null>(null);

const DEFAULT_CHROME: VocabChrome = {
	embedded: false,
	backHref: '/vocabulary',
	backLabel: '← Từ vựng',
	setHref: (id) => `/vocabulary/${id}`,
	modeHref: (id, mode) => (mode ? `/vocabulary/${id}/${mode}` : `/vocabulary/${id}`),
};

export function VocabApiProvider({
	endpointFor,
	scoreEndpointFor,
	chrome,
	children,
}: {
	endpointFor: (id: string) => string;
	scoreEndpointFor?: (id: string) => string;
	chrome?: VocabChrome;
	children: ReactNode;
}) {
	return (
		<VocabApiContext.Provider value={endpointFor}>
			<VocabScoreContext.Provider value={scoreEndpointFor ?? null}>
				<VocabChromeContext.Provider value={chrome ?? DEFAULT_CHROME}>
					{children}
				</VocabChromeContext.Provider>
			</VocabScoreContext.Provider>
		</VocabApiContext.Provider>
	);
}

export function useVocabSetUrl() {
	const override = useContext(VocabApiContext);
	return useCallback((id: string) => override?.(id) ?? `/api/vocab-sets/${id}`, [override]);
}

export function useVocabSetEndpoint(id: string) {
	return useVocabSetUrl()(id);
}

export function useVocabScoreUrl() {
	const override = useContext(VocabScoreContext);
	return useCallback((id: string) => override?.(id) ?? `/api/vocab-sets/${id}/score`, [override]);
}

export function useVocabChrome(): VocabChrome {
	return useContext(VocabChromeContext) ?? DEFAULT_CHROME;
}

export const VocabPracticeFrame = forwardRef<HTMLElement, HTMLAttributes<HTMLElement>>(
	function VocabPracticeFrame({ children, className = '', ...props }, ref) {
		const { embedded } = useVocabChrome();
		const Tag = embedded ? 'div' : 'main';
		const resolved = embedded
			? className
					.replace(/\bmin-h-screen\b/g, '')
					.replace(/\s+/g, ' ')
					.trim()
			: className;
		return (
			<Tag ref={ref as never} className={resolved} {...props}>
				{children}
			</Tag>
		);
	},
);

export function VocabBackLink({ className }: { className?: string }) {
	const chrome = useVocabChrome();
	if (chrome.embedded) return null;
	return (
		<Link href={chrome.backHref} className={className}>
			{chrome.backLabel}
		</Link>
	);
}
