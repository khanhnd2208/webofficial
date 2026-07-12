'use client';

/* ════════════════════════════════════════════════════════════════════════
   PersonalityTestWizard — Orchestrator

   Manages state and phase transitions for the multi-step personality
   test experience. All visual rendering is delegated to sub-components
   in the `./wizard/` module.

   Sub-components:
   - ProgressHeader  — Sticky top bar with timer + progress
   - IntroPhase      — Welcome screen with start/resume
   - DemographicsPhase — Demographic data collection
   - QuestionPhase   — Paginated Likert-scale questions
   - TransitionPhase — BFI → SD3 celebration screen
   - ReviewPhase     — Summary + submit

   See: src/components/personality-test/wizard/index.ts
   ════════════════════════════════════════════════════════════════════════ */

import { useState, useCallback, useRef, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';

import type { DemographicData, RawResponse, TestConfigDTO } from '@/types/personalityTest';
import {
	STORAGE_KEY,
	DEFAULT_DEMOGRAPHICS,
	getKey,
	ProgressHeader,
	IntroPhase,
	DemographicsPhase,
	QuestionPhase,
	TransitionPhase,
	ReviewPhase,
} from './wizard';
import type { TestPhase, SavedProgress } from './wizard';

// ─── Props ─────────────────────────────────────────────────────────────────────

interface Props {
	config: TestConfigDTO;
	onSubmit: (demographics: DemographicData, responses: RawResponse[], durationSeconds: number) => Promise<void>;
	isSubmitting: boolean;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function PersonalityTestWizard({ config, onSubmit, isSubmitting }: Props) {
	// ── Core state ──
	const [phase, setPhase] = useState<TestPhase>('intro');
	const [currentPage, setCurrentPage] = useState(0);
	const [answers, setAnswers] = useState<Record<string, number>>({});
	const [demographics, setDemographics] = useState<DemographicData>({ ...DEFAULT_DEMOGRAPHICS });
	const [restored, setRestored] = useState(false);
	const [elapsed, setElapsed] = useState(0);

	// ── Refs ──
	// eslint-disable-next-line react-hooks/purity
	const startTimeRef = useRef<number>(Date.now());
	const topRef = useRef<HTMLDivElement>(null);
	const savedProgressRef = useRef<SavedProgress | null>(null);

	// ── Restore from localStorage on mount ──
	useEffect(() => {
		try {
			const saved = localStorage.getItem(STORAGE_KEY);
			if (saved) {
				const data = JSON.parse(saved);
				if (data.answers && Object.keys(data.answers).length > 0) {
					setAnswers(data.answers);
					// Restore elapsed time accurately (don't count offline time)
					const savedElapsed = typeof data.elapsedSeconds === 'number' ? data.elapsedSeconds : 0;
					savedProgressRef.current = {
						phase: data.phase || 'demographics',
						currentPage: data.currentPage || 0,
						// Set startTime so Date.now() - startTime = savedElapsed
						startTime: Date.now() - savedElapsed * 1000,
					};
				}
				if (data.demographics) {
					setDemographics(data.demographics);
				}
			}
		} catch {}
		setRestored(true);
	}, []);

	// ── Persist to localStorage on every meaningful change ──
	useEffect(() => {
		if (!restored) return;
		try {
			const elapsedSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
			localStorage.setItem(STORAGE_KEY, JSON.stringify({
				answers,
				demographics,
				phase,
				currentPage,
				elapsedSeconds,
				savedAt: Date.now(),
			}));
		} catch {}
	}, [answers, demographics, phase, currentPage, restored]);

	// ── Elapsed timer ──
	useEffect(() => {
		if (phase === 'intro' || phase === 'review') return;
		const interval = setInterval(() => {
			setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
		}, 1000);
		return () => clearInterval(interval);
	}, [phase]);

	// ── Derived counts ──
	const totalBfiAnswered = config.bfiQuestions.filter(
(q) => answers[getKey(q.testType, q.itemNumber)] !== undefined
	).length;
	const totalSd3Answered = config.sd3Questions.filter(
(q) => answers[getKey(q.testType, q.itemNumber)] !== undefined
	).length;
	const totalAnswered = totalBfiAnswered + totalSd3Answered;
	const allComplete = totalAnswered === config.totalQuestions;

	// ── Scroll helper ──
	const scrollToTop = useCallback(() => {
		topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	}, []);

	// ── Handlers ──
	const handleAnswer = useCallback((testType: string, itemNumber: number, value: number) => {
		setAnswers((prev) => ({ ...prev, [getKey(testType, itemNumber)]: value }));
	}, []);

	const currentQuestions = phase === 'bfi' ? config.bfiQuestions : phase === 'sd3' ? config.sd3Questions : [];
	const totalPages = Math.ceil(currentQuestions.length / 5);

	const nextPage = useCallback(() => {
		if (currentPage < totalPages - 1) {
			setCurrentPage((p) => p + 1);
			scrollToTop();
		} else if (phase === 'bfi') {
			setPhase('transition');
			setCurrentPage(0);
			scrollToTop();
		} else if (phase === 'sd3') {
			setPhase('review');
			scrollToTop();
		}
	}, [currentPage, totalPages, phase, scrollToTop]);

	const prevPage = useCallback(() => {
		if (currentPage > 0) {
			setCurrentPage((p) => p - 1);
			scrollToTop();
		}
	}, [currentPage, scrollToTop]);

	const handleSubmit = useCallback(async () => {
		const responses: RawResponse[] = [];
		for (const q of [...config.bfiQuestions, ...config.sd3Questions]) {
			const value = answers[getKey(q.testType, q.itemNumber)];
			if (value !== undefined) {
				responses.push({ testType: q.testType, itemNumber: q.itemNumber, value });
			}
		}
		const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
		await onSubmit(demographics, responses, duration);
	}, [answers, config, demographics, onSubmit]);

	// ── Intro phase handlers ──
	const handleStart = useCallback(() => {
		setPhase('demographics');
		startTimeRef.current = Date.now();
	}, []);

	const handleResume = useCallback(() => {
		const sp = savedProgressRef.current;
		if (sp) {
			setPhase(sp.phase);
			setCurrentPage(sp.currentPage);
			startTimeRef.current = sp.startTime;
		} else {
			setPhase('demographics');
			startTimeRef.current = Date.now();
		}
	}, []);

	const handleRestart = useCallback(() => {
		setAnswers({});
		setDemographics({ ...DEFAULT_DEMOGRAPHICS });
		setPhase('demographics');
		setCurrentPage(0);
		startTimeRef.current = Date.now();
		savedProgressRef.current = null;
		try { localStorage.removeItem(STORAGE_KEY); } catch {}
	}, []);

	const handleDemographicsNext = useCallback(() => {
		setPhase('bfi');
		scrollToTop();
	}, [scrollToTop]);

	const handleTransitionContinue = useCallback(() => {
		setPhase('sd3');
		setCurrentPage(0);
	}, []);

	const handleReviewBack = useCallback(() => {
		// Go back to the last page of SD3 (the most recent section), not BFI page 0
		const sd3Pages = Math.ceil(config.sd3Questions.length / 5);
		setPhase('sd3');
		setCurrentPage(sd3Pages - 1);
		scrollToTop();
	}, [config.sd3Questions.length, scrollToTop]);

	// ── Render ──
	return (
<div ref={topRef} className="mx-auto max-w-3xl">
			{phase !== 'intro' && (
				<ProgressHeader
					phase={phase}
					elapsed={elapsed}
					totalAnswered={totalAnswered}
					totalQuestions={config.totalQuestions}
				/>
			)}

			<AnimatePresence mode="wait">
				{phase === 'intro' && (
					<IntroPhase
						config={config}
						answers={answers}
						restored={restored}
						savedProgress={savedProgressRef.current}
						scrollToTop={scrollToTop}
						onStart={handleStart}
						onResume={handleResume}
						onRestart={handleRestart}
					/>
				)}

				{phase === 'demographics' && (
					<DemographicsPhase
						config={config}
						demographics={demographics}
						setDemographics={setDemographics}
						scrollToTop={scrollToTop}
						onNext={handleDemographicsNext}
					/>
				)}

				{(phase === 'bfi' || phase === 'sd3') && (
					<QuestionPhase
						config={config}
						phase={phase}
						currentPage={currentPage}
						answers={answers}
						scrollToTop={scrollToTop}
						onAnswer={handleAnswer}
						onNextPage={nextPage}
						onPrevPage={prevPage}
					/>
				)}

				{phase === 'transition' && (
					<TransitionPhase
						config={config}
						totalBfiAnswered={totalBfiAnswered}
						scrollToTop={scrollToTop}
						onContinue={handleTransitionContinue}
					/>
				)}

				{phase === 'review' && (
					<ReviewPhase
						config={config}
						totalBfiAnswered={totalBfiAnswered}
						totalSd3Answered={totalSd3Answered}
						totalAnswered={totalAnswered}
						allComplete={allComplete}
						elapsed={elapsed}
						isSubmitting={isSubmitting}
						scrollToTop={scrollToTop}
						onReview={handleReviewBack}
						onSubmit={handleSubmit}
					/>
				)}
			</AnimatePresence>
		</div>
	);
}
