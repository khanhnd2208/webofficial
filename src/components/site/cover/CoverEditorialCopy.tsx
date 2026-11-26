'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { routes } from '@/config/routes';
import { introPage } from '@/content/publicMarketing';

interface CoverEditorialCopyProps {
	onOpenToc: () => void;
}

/**
 * Editorial book-cover typography column.
 * Keeps the cover quiet on initial load; tapping "[động từ]" or "Chưa xong."
 * gently unfolds sincere marginalia whispers from the author's real notes.
 */
export default function CoverEditorialCopy({ onOpenToc }: CoverEditorialCopyProps) {
	const [whisperIndex, setWhisperIndex] = useState<number>(-1);
	const totalWhispers = introPage.whispers.length;

	const cycleWhisper = () => {
		setWhisperIndex((current) => (current + 1 >= totalWhispers ? -1 : current + 1));
	};

	useEffect(() => {
		if (whisperIndex < 0) return;
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') setWhisperIndex(-1);
		};
		document.addEventListener('keydown', onKeyDown);
		return () => document.removeEventListener('keydown', onKeyDown);
	}, [whisperIndex]);

	const activeWhisper = whisperIndex >= 0 ? introPage.whispers[whisperIndex] : null;

	return (
		<div className="cover-copy">
			<p className="book-caption cover-author">Nguyễn Duy Khánh</p>
			<h1 className="cover-title">{introPage.headline}</h1>
			<p className="cover-pos">
				<button
					type="button"
					className="cover-pos-trigger"
					onClick={cycleWhisper}
					aria-expanded={whisperIndex >= 0}
					aria-controls="cover-author-whisper"
					title="Chạm để đọc một ghi chú nhỏ bên lề"
				>
					{introPage.partOfSpeech}
				</button>
			</p>
			<div className="cover-narrative">
				{introPage.lines.map((line, index) => (
					<p key={line}>
						{index === 0 ? (
							<button
								type="button"
								className="cover-cursor-trigger"
								onClick={cycleWhisper}
								aria-expanded={whisperIndex >= 0}
								aria-controls="cover-author-whisper"
							>
								<span className="cover-cursor-line">
									{line}
									<span className="intro-ink-cursor" aria-hidden="true" />
								</span>
							</button>
						) : (
							line
						)}
					</p>
				))}
			</div>
			{activeWhisper ? (
				<aside
					id="cover-author-whisper"
					className="cover-whisper"
					aria-live="polite"
					data-testid="cover-author-whisper"
				>
					<p className="cover-whisper-text">{activeWhisper}</p>
					<span className="cover-whisper-index" aria-hidden="true">
						{whisperIndex + 1}/{totalWhispers}
					</span>
				</aside>
			) : null}
			<Link
				className="book-link cover-cta"
				href={routes.toc}
				data-testid="intro-open-toc"
				onClick={onOpenToc}
			>
				{introPage.cta}
				<span aria-hidden="true">→</span>
			</Link>
		</div>
	);
}
