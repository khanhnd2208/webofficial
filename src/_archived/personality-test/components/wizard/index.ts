/* ════════════════════════════════════════════════════════════════════════
   Wizard Module — Barrel export
   
   Sub-components for the PersonalityTestWizard multi-step experience.
   
   Module structure:
   src/components/personality-test/wizard/
   ├── index.ts              This barrel export
   ├── constants.ts          Likert options, demographic options, storage key
   ├── types.ts              TestPhase, SavedProgress, phase prop interfaces
   ├── helpers.ts            getKey(), formatTime()
   ├── ProgressHeader.tsx    Sticky progress bar with timer
   ├── IntroPhase.tsx        Welcome screen with start/resume
   ├── DemographicsPhase.tsx Demographic data collection form
   ├── QuestionPhase.tsx     Paginated Likert-scale questions
   ├── TransitionPhase.tsx   Celebration screen between BFI → SD3
   └── ReviewPhase.tsx       Final summary + submit button
   ════════════════════════════════════════════════════════════════════════ */

// Constants
export {
	QUESTIONS_PER_PAGE,
	STORAGE_KEY,
	LIKERT_OPTIONS,
	UNIVERSITY_OPTIONS,
	STUDENT_YEAR_OPTIONS,
	GPA_OPTIONS,
	INTELLIGENCE_OPTIONS,
	DEFAULT_DEMOGRAPHICS,
} from './constants';

// Types
export type {
	TestPhase,
	SavedProgress,
	PhaseBaseProps,
	IntroPhaseProps,
	DemographicsPhaseProps,
	QuestionPhaseProps,
	TransitionPhaseProps,
	ReviewPhaseProps,
} from './types';

// Helpers
export { getKey, formatTime } from './helpers';

// Components
export { default as ProgressHeader } from './ProgressHeader';
export { default as IntroPhase } from './IntroPhase';
export { default as DemographicsPhase } from './DemographicsPhase';
export { default as QuestionPhase } from './QuestionPhase';
export { default as TransitionPhase } from './TransitionPhase';
export { default as ReviewPhase } from './ReviewPhase';
