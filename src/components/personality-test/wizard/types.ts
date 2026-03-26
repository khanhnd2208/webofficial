/* ════════════════════════════════════════════════════════════════════════
   Wizard Types — Shared type definitions for wizard sub-components
   ════════════════════════════════════════════════════════════════════════ */

import type { DemographicData, TestConfigDTO } from '@/types/personalityTest';

/** The 6 phases of the test-taking wizard */
export type TestPhase = 'intro' | 'demographics' | 'bfi' | 'transition' | 'sd3' | 'review';

/** Saved progress data stored in localStorage */
export interface SavedProgress {
	phase: TestPhase;
	currentPage: number;
	startTime: number;
}

/** Common props shared across phase sub-components */
export interface PhaseBaseProps {
	config: TestConfigDTO;
	scrollToTop: () => void;
}

/** Props for IntroPhase */
export interface IntroPhaseProps extends PhaseBaseProps {
	answers: Record<string, number>;
	restored: boolean;
	savedProgress: SavedProgress | null;
	onStart: () => void;
	onResume: () => void;
	onRestart: () => void;
}

/** Props for DemographicsPhase */
export interface DemographicsPhaseProps extends PhaseBaseProps {
	demographics: DemographicData;
	setDemographics: React.Dispatch<React.SetStateAction<DemographicData>>;
	onNext: () => void;
}

/** Props for QuestionPhase */
export interface QuestionPhaseProps extends PhaseBaseProps {
	phase: 'bfi' | 'sd3';
	currentPage: number;
	answers: Record<string, number>;
	onAnswer: (testType: string, itemNumber: number, value: number) => void;
	onNextPage: () => void;
	onPrevPage: () => void;
}

/** Props for TransitionPhase */
export interface TransitionPhaseProps extends PhaseBaseProps {
	totalBfiAnswered: number;
	onContinue: () => void;
}

/** Props for ReviewPhase */
export interface ReviewPhaseProps extends PhaseBaseProps {
	totalBfiAnswered: number;
	totalSd3Answered: number;
	totalAnswered: number;
	allComplete: boolean;
	elapsed: number;
	isSubmitting: boolean;
	onReview: () => void;
	onSubmit: () => void;
}
