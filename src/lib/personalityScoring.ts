/* ════════════════════════════════════════════════════════════════════════
   Personality Test — Backward-Compatibility Barrel

   This file now re-exports from the modular '@/lib/personality' package.
   All existing consumers can continue to import from this path unchanged.

   For new code, prefer importing directly from '@/lib/personality'.

   Module structure:
   src/lib/personality/
   ├── index.ts           Master barrel export
   ├── questions/
   │   ├── bfi2s.ts       BFI-2-S question config (31 items)
   │   ├── sd3.ts         SD3 question config (28 items)
   │   └── index.ts       Questions barrel
   ├── labels.ts          Constants, domain labels, Likert scales
   ├── scoringEngine.ts   Scoring pipeline
   ├── archetypes.ts      Archetype rule engine
   └── config.ts          Client-facing test config builder
   ════════════════════════════════════════════════════════════════════════ */

export {
	// Question banks
	BFI2S_QUESTIONS,
	SD3_QUESTIONS,

	// Constants & Labels
	LIKERT_LABELS,
	LIKERT_LABELS_VI,
	DOMAIN_LABELS_VI,

	// Scoring engine
	validateAttentionChecks,
	getEffectiveScore,
	scorePersonalityTest,

	// Archetype engine
	generateArchetype,

	// Test configuration
	getTestConfig,
} from './personality';
