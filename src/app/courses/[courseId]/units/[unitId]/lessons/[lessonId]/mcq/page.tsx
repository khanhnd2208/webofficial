'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import type { LessonVocabularyItemDTO } from '@/types/lessonVocabulary';

/* ─── Types ─── */
type QuizMode = 'word-to-meaning' | 'meaning-to-word';

type Question = {
	item: LessonVocabularyItemDTO;
	options: string[];
	correctIndex: number;
	mode: QuizMode;
};

/* ─── Helpers ─── */
function shuffle<T>(arr: T[]): T[] {
	const a = [...arr];
	for (let i = a.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[a[i], a[j]] = [a[j], a[i]];
	}
	return a;
}

function buildQuestions(items: LessonVocabularyItemDTO[]): Question[] {
	if (items.length < 2) return [];
	const shuffled = shuffle(items);
	return shuffled.map((item, idx) => {
		const mode: QuizMode = idx % 2 === 0 ? 'word-to-meaning' : 'meaning-to-word';
		const distractors = shuffle(items.filter((x) => x.id !== item.id)).slice(0, 3);

		const correctAnswer = mode === 'word-to-meaning' ? item.meaningVi : item.word;
		const options = shuffle([
			correctAnswer,
			...distractors.map((d) => (mode === 'word-to-meaning' ? d.meaningVi : d.word)),
		]);

		return { item, options, correctIndex: options.indexOf(correctAnswer), mode };
	});
}

/* ─── Component ─── */
export default function MCQPage() {
	const p = useParams();
	const courseId = typeof p?.courseId === 'string' ? p.courseId : '';
	const unitId = typeof p?.unitId === 'string' ? p.unitId : '';
	const lessonId = typeof p?.lessonId === 'string' ? p.lessonId : '';

	const [items, setItems] = useState<LessonVocabularyItemDTO[] | null>(null);
	const [error, setError] = useState('');
	const [questions, setQuestions] = useState<Question[]>([]);
	const [qIndex, setQIndex] = useState(0);
	const [selected, setSelected] = useState<number | null>(null);
	const [answered, setAnswered] = useState(false);
	const [correct, setCorrect] = useState(0);
	const [wrong, setWrong] = useState(0);
	const [finished, setFinished] = useState(false);

	/* ── Fetch vocabulary ── */
	useEffect(() => {
		if (!lessonId) return;
		let cancelled = false;
		fetch(`/api/lessons/${encodeURIComponent(lessonId)}/vocabulary`)
			.then(async (res) => {
				if (!res.ok) throw new Error('Không thể tải dữ liệu');
				const json = await res.json();
				if (!json?.ok) throw new Error('Không thể tải dữ liệu');
				return (json.data ?? []) as LessonVocabularyItemDTO[];
			})
			.then((data) => {
				if (cancelled) return;
				setItems(data);
				setQuestions(buildQuestions(data));
			})
			.catch((e) => {
				if (!cancelled) setError(e instanceof Error ? e.message : 'Lỗi');
			});
		return () => {
			cancelled = true;
		};
	}, [lessonId]);

	const currentQ = questions[qIndex] ?? null;
	const total = questions.length;
	const progress = total > 0 ? ((qIndex + (answered ? 1 : 0)) / total) * 100 : 0;

	const handleSelect = useCallback(
		(optIdx: number) => {
			if (answered || !currentQ) return;
			setSelected(optIdx);
			setAnswered(true);
			if (optIdx === currentQ.correctIndex) setCorrect((c) => c + 1);
			else setWrong((w) => w + 1);
		},
		[answered, currentQ],
	);

	const handleNext = useCallback(() => {
		if (qIndex + 1 >= total) {
			setFinished(true);
		} else {
			setQIndex((i) => i + 1);
			setSelected(null);
			setAnswered(false);
		}
	}, [qIndex, total]);

	const handleRestart = useCallback(() => {
		if (!items) return;
		setQuestions(buildQuestions(items));
		setQIndex(0);
		setSelected(null);
		setAnswered(false);
		setCorrect(0);
		setWrong(0);
		setFinished(false);
	}, [items]);

	/* ── Keyboard: 1-4 to select, Enter to continue ── */
	useEffect(() => {
		function onKey(e: KeyboardEvent) {
			if (e.key >= '1' && e.key <= '4') handleSelect(parseInt(e.key) - 1);
			else if (e.key === 'Enter' && answered) handleNext();
		}
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [handleSelect, handleNext, answered]);

	const basePath = `/courses/${encodeURIComponent(courseId)}/units/${encodeURIComponent(unitId)}/lessons/${encodeURIComponent(lessonId)}`;

	/* ── Loading ── */
	if (items === null && !error) {
		return (
			<main className="flex min-h-screen items-center justify-center bg-background-secondary">
				<div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
			</main>
		);
	}

	/* ── Error / not enough vocab ── */
	if (error || total === 0) {
		return (
			<main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background-secondary px-6">
				<p className="text-foreground-secondary">
					{error || 'Cần ít nhất 2 từ vựng để làm bài.'}
				</p>
				<Link href={basePath} className="text-sm text-accent underline">
					Quay lại
				</Link>
			</main>
		);
	}

	/* ── Finished ── */
	if (finished) {
		const pct = Math.round((correct / total) * 100);
		return (
			<main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background-secondary px-6 text-center">
				<div className="flex justify-center">{pct >= 80 ? <svg className="h-14 w-14" viewBox="0 0 24 24" fill="none"><defs><linearGradient id="cmcq-p" x1="0" y1="1" x2="1" y2="0"><stop offset="0%" stopColor="#ff5500" /><stop offset="50%" stopColor="#ffcc00" /><stop offset="100%" stopColor="#4a8c5c" /></linearGradient></defs><path d="M12 2l2.5 6.5L21 12l-6.5 2.5L12 22l-2.5-7.5L3 12l6.5-3.5L12 2z" fill="url(#cmcq-p)" /><circle cx="12" cy="12" r="3" fill="#fff" opacity="0.4" /></svg> : pct >= 50 ? <svg className="h-14 w-14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="#4a8c5c" opacity="0.2" stroke="#4a8c5c" strokeWidth="1.5" /><path d="M8 12.5l2.5 3L16 9" stroke="#4a8c5c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg> : <svg className="h-14 w-14" viewBox="0 0 24 24" fill="none"><defs><linearGradient id="cmcq-f" x1=".5" y1="1" x2=".5" y2="0"><stop offset="0%" stopColor="#c44b28" /><stop offset="100%" stopColor="#c48a1a" /></linearGradient></defs><path d="M12 2C9 7 4 11 4 16c0 5 3.5 7 8 7s8-2 8-7c0-6-5-10-8-15z" fill="url(#cmcq-f)" opacity="0.7" /></svg>}</div>
				<h1 className="text-2xl font-bold">Kết quả</h1>
				<div className="flex items-center gap-6 text-lg">
					<div className="text-center">
						<div className="text-3xl font-bold text-success">{correct}</div>
						<div className="text-xs text-muted">Đúng</div>
					</div>
					<div className="h-8 w-px bg-border" />
					<div className="text-center">
						<div className="text-3xl font-bold text-error">{wrong}</div>
						<div className="text-xs text-muted">Sai</div>
					</div>
					<div className="h-8 w-px bg-border" />
					<div className="text-center">
						<div className="text-3xl font-bold text-accent">{pct}%</div>
						<div className="text-xs text-muted">Điểm</div>
					</div>
				</div>
				<div className="flex flex-wrap items-center justify-center gap-3">
					<button
						onClick={handleRestart}
						className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent-hover"
					>
						Làm lại
					</button>
					<Link
						href={`${basePath}/flashcards`}
						className="rounded-lg bg-surface px-5 py-2.5 text-sm font-semibold hover:bg-surface-hover"
					>
						Flashcards
					</Link>
					<Link
						href={`${basePath}/fill-blank`}
						className="rounded-lg bg-surface px-5 py-2.5 text-sm font-semibold hover:bg-surface-hover"
					>
						Điền từ
					</Link>
					<Link
						href={basePath}
						className="rounded-lg border border-border px-5 py-2.5 text-sm font-semibold hover:bg-surface-hover"
					>
						Bài học
					</Link>
				</div>
			</main>
		);
	}

	/* ── Main quiz ── */
	return (
		<main className="flex min-h-screen flex-col bg-background-secondary">
			{/* Top bar */}
			<header className="border-b border-border bg-surface">
				<div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
					<Link
						href={basePath}
						className="flex items-center gap-1.5 text-sm font-medium text-muted hover:text-foreground"
					>
						<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
							<path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
						</svg>
						Bài học
					</Link>
					<h1 className="text-sm font-semibold">Trắc nghiệm</h1>
					<div className="flex items-center gap-2">
						<Link
							href={`${basePath}/flashcards`}
							className="rounded-md bg-surface-hover px-2.5 py-1 text-[11px] font-semibold text-foreground-secondary hover:bg-surface-active"
						>
							Cards
						</Link>
						<Link
							href={`${basePath}/fill-blank`}
							className="rounded-md bg-surface-hover px-2.5 py-1 text-[11px] font-semibold text-foreground-secondary hover:bg-surface-active"
						>
							FIB
						</Link>
					</div>
				</div>
			</header>

			{/* Progress */}
			<div className="border-b border-border bg-surface px-4 py-3 sm:px-6">
				<div className="mx-auto max-w-3xl">
					<div className="flex items-center justify-between text-xs font-semibold text-muted">
						<span>
							Câu {qIndex + 1}/{total}
						</span>
						<span className="flex items-center gap-2">
							<span className="text-success">{correct} đúng</span>
							<span className="text-error">{wrong} sai</span>
						</span>
					</div>
					<div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-hover">
						<div
							className="h-full rounded-full bg-accent transition-all duration-300"
							style={{ width: `${progress}%` }}
						/>
					</div>
				</div>
			</div>

			{/* Question */}
			<div className="flex flex-1 flex-col items-center justify-center px-4 py-8 sm:px-6">
				{currentQ ? (
					<div className="w-full max-w-lg">
						{/* Prompt */}
						<div className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted">
							{currentQ.mode === 'word-to-meaning' ? 'Chọn nghĩa của từ' : 'Chọn từ đúng'}
						</div>
						<div className="rounded-xl border border-border bg-surface p-6 text-center shadow-sm">
							<div className="text-2xl font-bold sm:text-3xl">
								{currentQ.mode === 'word-to-meaning' ? currentQ.item.word : currentQ.item.meaningVi}
							</div>
							{currentQ.mode === 'word-to-meaning' && currentQ.item.partOfSpeech ? (
								<div className="mt-1 text-sm italic text-muted">{currentQ.item.partOfSpeech}</div>
							) : null}
						</div>

						{/* Options */}
						<div className="mt-6 grid gap-3">
							{currentQ.options.map((opt, i) => {
								let style = 'border-border bg-surface hover:border-accent hover:bg-accent-subtle';
								if (answered) {
									if (i === currentQ.correctIndex) {
										style = 'border-success bg-success-subtle text-success';
									} else if (i === selected && i !== currentQ.correctIndex) {
										style = 'border-error bg-error-subtle text-error';
									} else {
										style = 'border-border bg-surface opacity-50';
									}
								}
								return (
									<button
										key={i}
										onClick={() => handleSelect(i)}
										disabled={answered}
										className={`flex items-center gap-3 rounded-xl border-2 px-5 py-4 text-left text-sm font-medium transition-all ${style}`}
									>
										<span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-current/20 text-xs font-bold">
											{i + 1}
										</span>
										<span className="flex-1">{opt}</span>
										{answered && i === currentQ.correctIndex ? (
											<svg
												className="h-5 w-5 text-success"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
												strokeWidth={2.5}
											>
												<path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
											</svg>
										) : null}
										{answered && i === selected && i !== currentQ.correctIndex ? (
											<svg
												className="h-5 w-5 text-error"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
												strokeWidth={2.5}
											>
												<path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
											</svg>
										) : null}
									</button>
								);
							})}
						</div>

						{/* Next button */}
						{answered ? (
							<div className="mt-6 flex justify-center">
								<button
									onClick={handleNext}
									className="rounded-lg bg-accent px-6 py-2.5 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-hover"
								>
									{qIndex + 1 >= total ? 'Xem kết quả' : 'Câu tiếp →'}
								</button>
							</div>
						) : null}

						{/* Keyboard hints */}
						<div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-[10px] text-muted">
							<span>
								<kbd className="rounded border border-border px-1.5 py-0.5 font-mono">1-4</kbd> chọn
							</span>
							<span>
								<kbd className="rounded border border-border px-1.5 py-0.5 font-mono">Enter</kbd> tiếp
							</span>
						</div>
					</div>
				) : null}
			</div>
		</main>
	);
}
