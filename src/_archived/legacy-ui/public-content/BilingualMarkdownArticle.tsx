'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CodeBlock from '@/components/CodeBlock';

interface BilingualMarkdownArticleProps {
	contentVi: string;
	contentEn: string;
	className?: string;
}

export default function BilingualMarkdownArticle({
	contentVi,
	contentEn,
	className = '',
}: BilingualMarkdownArticleProps) {
	const [lang, setLang] = useState<'vi' | 'en'>('vi');
	const hasEn = Boolean(contentEn && contentEn.trim().length > 0);
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
			<article className={className}>
				<ReactMarkdown
					remarkPlugins={[remarkGfm]}
					components={{
						img: (props) => {
							const src = typeof props.src === 'string' ? props.src.trim() : '';
							if (!src) return null;
							return (
								<img
									{...props}
									src={src}
									alt={props.alt ?? ''}
									className="rounded-xl"
									loading="lazy"
								/>
							);
						},
						pre: (props) => <CodeBlock {...props} />,
						a: ({ children, href, ...props }) => {
							const ytMatch = href?.match(
								/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/
							);
							if (ytMatch) {
								return (
									<div className="not-prose my-6 aspect-video overflow-hidden border border-border">
										<iframe
											src={`https://www.youtube.com/embed/${ytMatch[1]}`}
											className="h-full w-full"
											allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
											allowFullScreen
											loading="lazy"
											title="YouTube video"
										/>
									</div>
								);
							}
							const isExternal = href?.startsWith('http') && !href?.includes(process.env.NEXT_PUBLIC_URL ?? '');
							return (
								<a
									href={href}
									{...props}
									{...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
								>
									{children}
									{isExternal ? <span className="ml-0.5 text-[0.7em] opacity-50">↗</span> : null}
								</a>
							);
						},
						h1: ({ children, ...props }) => {
							const text = String(children ?? '').replace(/[`*_~[\]]/g, '').trim();
							const id = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
							return <h1 id={id} {...props}>{children}</h1>;
						},
						h2: ({ children, ...props }) => {
							const text = String(children ?? '').replace(/[`*_~[\]]/g, '').trim();
							const id = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
							return <h2 id={id} {...props}>{children}</h2>;
						},
						h3: ({ children, ...props }) => {
							const text = String(children ?? '').replace(/[`*_~[\]]/g, '').trim();
							const id = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
							return <h3 id={id} {...props}>{children}</h3>;
						},
					}}
				>
					{activeContent}
				</ReactMarkdown>
			</article>
		</div>
	);
}
