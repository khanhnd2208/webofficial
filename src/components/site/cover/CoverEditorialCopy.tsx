'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { routes } from '@/config/routes';
import { introPage } from '@/content/publicMarketing';

interface CoverEditorialCopyProps {
	onWhisperChange?: (open: boolean) => void;
}

/**
 * Editorial book-cover typography column.
 * - `[động từ]` carries a 44px touch target with a dictionary-note underline and unfolds the
 *   author's three authentic marginalia notes below the primary action (zero headline shift).
 * - `Chưa xong.` stays pure editorial serif prose with a finite 3-breath ink bar.
 */
export default function CoverEditorialCopy({ onWhisperChange }: CoverEditorialCopyProps) {
	const [whisperIndex, setWhisperIndex] = useState<number>(-1);
	const [firstWord, ...remainingWords] = introPage.headline.split(' ');
	const totalWhispers = introPage.whispers.length;

	const cycleWhisper = () => {
		setWhisperIndex((current) => (current + 1 >= totalWhispers ? -1 : current + 1));
	};

	const closeWhisper = () => {
		setWhisperIndex(-1);
	};

	useEffect(() => {
		onWhisperChange?.(whisperIndex >= 0);
	}, [onWhisperChange, whisperIndex]);

	useEffect(() => {
		if (whisperIndex < 0) return;
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				setWhisperIndex(-1);
			}
		};
		document.addEventListener('keydown', onKeyDown);
		return () => document.removeEventListener('keydown', onKeyDown);
	}, [whisperIndex]);

	const activeWhisper = whisperIndex >= 0 ? introPage.whispers[whisperIndex] : null;

	return (
		<div className="cover-copy">
			<p className="book-caption cover-author">Nguyễn Duy Khánh</p>
			<h1 className="cover-title">
				<span className="cover-title-reveal">
					{firstWord} <em>{remainingWords.join(' ')}</em>
				</span>
			</h1>
			<p className="cover-pos">
				<button
					type="button"
					className="cover-pos-trigger"
					onClick={cycleWhisper}
					aria-expanded={whisperIndex >= 0}
					aria-controls="cover-author-whisper"
					title="Chạm để đọc ghi chú nhỏ bên lề"
				>
					<span className="cover-pos-label">{introPage.partOfSpeech}</span>
				</button>
			</p>
			<svg className="cover-ink-sprig" viewBox="0 0 88 12" fill="none" aria-hidden="true">
				<path
					d="M2 7.5 C 22 4.5, 42 4.5, 62 7 C 72 8.2, 80 7.2, 86 5.5"
					stroke="currentColor"
					strokeWidth="1"
					strokeLinecap="round"
				/>
				<path
					d="M42 5.2 C 45 2.2, 49 1.8, 51 3.4 C 48.5 5.4, 44.5 5.6, 42 5.2 Z"
					fill="currentColor"
					opacity="0.55"
				/>
			</svg>
			<div className="cover-narrative">
				{introPage.lines.map((line, index) => (
					<p key={line}>
						{index === 0 ? (
							<span className="cover-cursor-line">
								{line}
								<span className="intro-ink-cursor cover-settled-cursor" aria-hidden="true" />
							</span>
						) : (
							line
						)}
					</p>
				))}
			</div>
			<Link className="book-link cover-cta" href={routes.toc} data-testid="intro-open-toc">
				<span className="cover-cta-seal" aria-hidden="true" />
				<span className="cover-cta-text">{introPage.cta}</span>
				<span className="cover-cta-arrow" aria-hidden="true">
					→
				</span>
			</Link>
			{activeWhisper ? (
				<aside
					id="cover-author-whisper"
					className="cover-whisper"
					aria-live="polite"
					data-testid="cover-author-whisper"
				>
					<p className="cover-whisper-text">{activeWhisper}</p>
					<div className="cover-whisper-actions">
						<button
							type="button"
							className="cover-whisper-step"
							onClick={cycleWhisper}
							aria-label={`Đọc ghi chú tiếp theo (${whisperIndex + 1}/${totalWhispers})`}
						>
							{whisperIndex + 1}/{totalWhispers}
						</button>
						<button
							type="button"
							className="cover-whisper-close"
							onClick={closeWhisper}
							aria-label="Đóng ghi chú"
						>
							×
						</button>
					</div>
				</aside>
			) : null}
		</div>
	);
}
