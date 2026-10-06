'use client';

import Link from 'next/link';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useGuessWhoSession } from '@/lib/vocab/useGuessWhoSession';
import type { GuessWhoWord, WordResult } from '@/lib/vocab/useGuessWhoSession';
import GuessWhoInput from '@/components/vocab/GuessWhoInput';
import {
	useVocabSetUrl,
	useVocabScoreUrl,
	useVocabChrome,
	VocabPracticeFrame,
} from '@/components/vocab/practice/VocabApiProvider';
import { useSoundEffects } from '@/lib/vocab/useSoundEffects';

// Session Summary
function SessionSummary({
	wordResults,
	setId,
	sessionStartTime,
	penaltyMs,
	sessionEndTime,
	onReplay,
}: {
	wordResults: WordResult[];
	setId: string;
	sessionStartTime: number;
	penaltyMs: number;
	sessionEndTime: number;
	onReplay: () => void;
}) {
	const [scoreData, setScoreData] = useState<{
		score: number;
		isNewBest: boolean;
		previousBest: number;
	} | null>(null);
	const submittedRef = useRef(false);
	const chrome = useVocabChrome();
	const scoreUrlFor = useVocabScoreUrl();

	useEffect(() => {
		if (submittedRef.current || sessionEndTime === 0) return;
		submittedRef.current = true;
		fetch(scoreUrlFor(setId), {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ mode: 'GUESS_WHO', sessionStartTime, sessionEndTime, penaltyMs }),
		})
			.then((r) => r.json())
			.then((json) => {
				if (json.ok)
					setScoreData({
						score: Math.round(json.data.score),
						isNewBest: json.data.isNewBest,
						previousBest: Math.round(json.data.previousBest ?? 0),
					});
			})
			.catch(() => {});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [sessionEndTime]);

	const totalWrong = wordResults.reduce((s, r) => s + r.wrongGuesses, 0);

	return (
		<div className="mx-auto max-w-xl px-6 py-16 text-center">
			<div className="text-5xl mb-4">🏆</div>
			<h2 className="text-3xl font-black uppercase tracking-tight text-foreground">Kết thúc!</h2>

			{scoreData ? (
				<div className="mt-4">
					<p className="text-sm text-muted">Điểm số</p>
					<p className="text-4xl font-black tabular-nums text-foreground mt-1">
						{scoreData.score.toLocaleString()}
					</p>
					<p
						className={`mt-1 text-sm font-bold ${scoreData.isNewBest ? 'text-success' : 'text-muted'}`}
					>
						{scoreData.isNewBest
							? `🏆 Kỷ lục mới! (Trước: ${scoreData.previousBest.toLocaleString()})`
							: `Kỷ lục: ${scoreData.previousBest.toLocaleString()}`}
					</p>
				</div>
			) : (
				<p className="mt-2 text-sm text-muted">Đang tính điểm…</p>
			)}

			{totalWrong > 0 && (
				<p className="mt-2 text-xs text-muted">
					Phạt: {totalWrong} lần sai × −5s = −{totalWrong * 5}s
				</p>
			)}

			<div className="mt-6 divide-y divide-border border border-border text-left rounded-xl overflow-hidden">
				{wordResults.map((r, i) => (
					<div key={r.wordId} className="flex items-center gap-4 px-4 py-3">
						<span className="shrink-0 text-xs font-bold text-muted">{i + 1}</span>
						<div className="flex-1 min-w-0">
							<p className="text-sm font-bold text-foreground truncate">{r.term}</p>
							<p className="text-xs text-muted">
								{r.wrongGuesses === 0 ? 'Đúng ngay' : `${r.wrongGuesses} lần sai`}
							</p>
						</div>
						<span
							className={`text-xs font-black tabular-nums ${r.wrongGuesses === 0 ? 'text-success' : 'text-error'}`}
						>
							{r.wrongGuesses === 0 ? '✓' : `−${r.wrongGuesses * 5}s`}
						</span>
					</div>
				))}
			</div>

			<div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
				<button
					onClick={onReplay}
					className="inline-flex items-center gap-2 rounded-full border-2 border-foreground bg-foreground px-6 py-2.5 text-sm font-bold uppercase tracking-wider text-background transition-all hover:bg-transparent hover:text-foreground active:scale-95"
				>
					🔄 Chơi lại
				</button>
				<Link
					href={chrome.setHref(setId)}
					className="inline-flex items-center gap-2 rounded-full border-2 border-border px-6 py-2.5 text-sm font-bold uppercase tracking-wider text-foreground transition-all hover:border-foreground active:scale-95"
				>
					Về trang bộ từ
				</Link>
			</div>
		</div>
	);
}

// Main Game Component
function GuessWhoGame({ words, setId }: { words: GuessWhoWord[]; setId: string }) {
	const session = useGuessWhoSession(words);
	const sounds = useSoundEffects();
	const [inputValues, setInputValues] = useState<string[]>([]);
	const [shake, setShake] = useState(false);
	const [lastResult, setLastResult] = useState<'correct' | 'wrong' | null>(null);

	useEffect(() => {
		if (session.currentWord) {
			setInputValues(Array(session.currentWord.term.length).fill(''));
			setLastResult(null);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [session.currentWord?.id]);

	const handleSubmit = useCallback(() => {
		if (!session.currentWord || session.gameStatus !== 'playing') return;
		const termChars = Array.from(session.currentWord.term);
		const guess = termChars
			.map((ch, i) => {
				const isInput = !/[^a-zA-Z0-9]/.test(ch);
				return isInput ? (inputValues[i] ?? '') : ch;
			})
			.join('');
		const result = session.submitGuess(guess);
		setLastResult(result);
		if (result === 'correct') {
			sounds.playSuccess();
		} else {
			sounds.playHeartLost();
			setShake(true);
			setTimeout(() => setShake(false), 450);
		}
	}, [session, inputValues, sounds]);

	useEffect(() => {
		function onKey(e: KeyboardEvent) {
			if (e.key === 'Enter' && session.gameStatus === 'playing') handleSubmit();
		}
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [handleSubmit, session.gameStatus]);

	if (session.gameStatus === 'session_complete') {
		return (
			<SessionSummary
				wordResults={session.wordResults}
				setId={setId}
				sessionStartTime={session.sessionStartTime}
				penaltyMs={session.penaltyMs}
				sessionEndTime={session.sessionEndTime}
				onReplay={() => window.location.reload()}
			/>
		);
	}

	if (!session.currentWord) {
		return (
			<div className="flex min-h-[60vh] items-center justify-center">
				<p className="text-sm text-muted">Không có từ nào có gợi ý.</p>
			</div>
		);
	}

	const { currentWord, currentHint, gameStatus, wordIndex, wrongGuessesThisWord, penaltyMs } =
		session;
	const isDone = gameStatus === 'word_done';
	const isCorrect = isDone && lastResult === 'correct';
	const progress = (wordIndex / session.eligibleWords.length) * 100;

	return (
		<div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
			<div className="mb-6 h-1 w-full overflow-hidden rounded-full bg-surface-hover">
				<div
					className="h-full bg-accent transition-all duration-400"
					style={{ width: `${progress}%` }}
				/>
			</div>

			<div className="flex items-center justify-between mb-6">
				<span className="text-xs font-bold uppercase tracking-widest text-muted">
					{wordIndex + 1} / {session.eligibleWords.length}
				</span>
				<div className="flex items-center gap-3 text-xs">
					{wrongGuessesThisWord > 0 && (
						<span className="font-bold text-error">−{wrongGuessesThisWord * 5}s từ này</span>
					)}
					{penaltyMs > 0 && (
						<span className="font-bold text-warning">−{penaltyMs / 1000}s tổng</span>
					)}
				</div>
			</div>

			<div className="rounded-2xl border border-border bg-surface p-6 mb-8">
				<p className="text-xs font-bold uppercase tracking-widest text-muted mb-3">💡 Gợi ý</p>
				<p className="text-base leading-relaxed text-foreground font-medium">{currentHint}</p>
			</div>

			<div className="mb-6">
				<GuessWhoInput
					term={currentWord.term}
					values={isDone ? Array.from(currentWord.term) : inputValues}
					onChange={setInputValues}
					disabled={isDone}
					reveal={isDone && !isCorrect}
					shake={shake}
				/>
			</div>

			{isDone && (
				<div
					className={`rounded-xl border p-4 mb-6 text-center ${isCorrect ? 'border-success bg-success-subtle text-success' : 'border-error bg-error-subtle text-error'}`}
				>
					{isCorrect ? (
						<p className="text-lg font-black">🎉 Chính xác!</p>
					) : (
						<>
							<p className="text-lg font-black">Sai rồi!</p>
							<p className="text-sm mt-1">
								Đáp án: <span className="font-black">{currentWord.term}</span>
							</p>
						</>
					)}
				</div>
			)}

			<div className="flex items-center justify-center gap-3">
				{!isDone ? (
					<button
						onClick={handleSubmit}
						disabled={inputValues.filter((v) => v).length === 0}
						className="inline-flex items-center gap-2 rounded-full border-2 border-foreground bg-foreground px-8 py-3 text-sm font-bold uppercase tracking-wider text-background transition-all hover:bg-transparent hover:text-foreground active:scale-95 disabled:opacity-50"
					>
						Xác nhận · Enter
					</button>
				) : (
					<button
						onClick={session.nextWord}
						className="inline-flex items-center gap-2 rounded-full border-2 border-accent bg-accent px-8 py-3 text-sm font-bold uppercase tracking-wider text-white transition-all hover:bg-transparent hover:text-accent active:scale-95"
					>
						{wordIndex + 1 >= session.eligibleWords.length ? 'Xem kết quả' : 'Từ tiếp theo →'}
					</button>
				)}
			</div>

			{!isDone && (
				<p className="mt-4 text-center text-xs font-bold uppercase tracking-widest text-muted/40">
					Enter để xác nhận · Sai −5s mỗi lần
				</p>
			)}
		</div>
	);
}

// Page wrapper
export default function GuessWhoPage({ params }: { params: Promise<{ id: string }> }) {
	const vocabUrl = useVocabSetUrl();
	const chrome = useVocabChrome();
	const [id, setId] = useState('');
	const [words, setWords] = useState<GuessWhoWord[] | null>(null);
	const [error, setError] = useState('');

	useEffect(() => {
		params.then(async ({ id: paramId }) => {
			setId(paramId);
			const res = await fetch(vocabUrl(paramId));
			const json = await res.json();
			if (!json.ok) {
				setError(json.error);
				return;
			}
			setWords((json.data.set?.words ?? json.data.words ?? []) as GuessWhoWord[]);
		});
	}, [params, vocabUrl]);

	if (error)
		return (
			<VocabPracticeFrame className="min-h-screen flex items-center justify-center">
				<p className="text-sm text-error">{error}</p>
			</VocabPracticeFrame>
		);
	if (words === null)
		return (
			<VocabPracticeFrame className="min-h-screen flex items-center justify-center">
				<div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-accent" />
			</VocabPracticeFrame>
		);

	const eligibleCount = words.filter(
		(w) => w.hintsHard.length + w.hintsMedium.length + w.hintsEasy.length > 0,
	).length;

	return (
		<VocabPracticeFrame className="min-h-screen">
			<div className="border-b border-border">
				<div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
					{chrome.embedded ? (
						<span />
					) : (
						<Link
							href={chrome.setHref(id)}
							className="text-xs font-bold uppercase tracking-widest text-muted hover:text-foreground transition-colors"
						>
							← Bộ từ
						</Link>
					)}
					<div className="flex items-center gap-2">
						<span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
							🎮 Guess Who I Am
						</span>
						<span className="rounded-full bg-surface-hover px-2 py-0.5 text-xs font-bold text-muted">
							{eligibleCount} từ
						</span>
					</div>
				</div>
			</div>

			{eligibleCount === 0 ? (
				<div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
					<h2 className="text-lg font-black uppercase tracking-tight text-foreground">
						Chưa có gợi ý nào
					</h2>
					<p className="max-w-sm text-sm text-foreground-secondary">
						{chrome.embedded
							? 'Bộ từ chưa có gợi ý cho Guess Who. Chọn chế độ luyện khác hoặc quay lại danh sách từ.'
							: 'Bộ từ này chưa có gợi ý Guess Who. Admin cần thêm gợi ý trong tab Quản lí cửa hàng.'}
					</p>
					<Link
						href={chrome.embedded ? chrome.setHref(id) : '/vocabulary/store'}
						className="mt-2 inline-flex items-center gap-2 rounded-full border-2 border-foreground bg-foreground px-5 py-2 text-xs font-bold uppercase tracking-wider text-background hover:bg-transparent hover:text-foreground transition-all"
					>
						{chrome.embedded ? 'Về danh sách từ' : 'Đến cửa hàng từ vựng'}
					</Link>
				</div>
			) : (
				<GuessWhoGame words={words} setId={id} />
			)}
		</VocabPracticeFrame>
	);
}
