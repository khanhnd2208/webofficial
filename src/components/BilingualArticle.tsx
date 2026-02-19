'use client';

import { useState } from 'react';

interface BilingualArticleProps {
	contentVi: string;
	contentEn: string;
	contentFormat: 'markdown' | 'html';
	/** Pre-rendered HTML for Vietnamese (for markdown posts) */
	renderedVi?: React.ReactNode;
	/** Additional className for article */
	className?: string;
}

export default function BilingualArticle({
	contentVi,
	contentEn,
	className = '',
}: BilingualArticleProps) {
	const [lang, setLang] = useState<'vi' | 'en'>('vi');
	const hasEn = Boolean(contentEn && contentEn.replace(/<[^>]*>/g, '').trim().length > 0);

	const activeContent = lang === 'en' && hasEn ? contentEn : contentVi;

	return (
		<div>
			{/* Language toggle */}
			{hasEn ? (
				<div className="mb-6 flex items-center gap-3">
					<button
						type="button"
						onClick={() => setLang(lang === 'vi' ? 'en' : 'vi')}
						className="group inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-1.5 text-xs font-bold transition-all hover:border-accent/50 hover:shadow-sm"
						title={lang === 'vi' ? 'Switch to English' : 'Chuyển sang tiếng Việt'}
					>
						<span className={`transition-opacity ${lang === 'vi' ? 'opacity-100' : 'opacity-40'}`}>🇻🇳</span>
						<div className="relative h-4 w-8 rounded-full bg-surface-active transition-colors">
							<div
								className={`absolute top-0.5 h-3 w-3 rounded-full bg-accent shadow-sm transition-transform ${
									lang === 'en' ? 'translate-x-4' : 'translate-x-0.5'
								}`}
							/>
						</div>
						<span className={`transition-opacity ${lang === 'en' ? 'opacity-100' : 'opacity-40'}`}>🇬🇧</span>
					</button>
					<span className="text-xs text-muted">
						{lang === 'vi' ? 'Tiếng Việt' : 'English'}
					</span>
				</div>
			) : null}

			{/* Article content */}
			<article
				className={className}
				dangerouslySetInnerHTML={{ __html: activeContent }}
			/>
		</div>
	);
}
