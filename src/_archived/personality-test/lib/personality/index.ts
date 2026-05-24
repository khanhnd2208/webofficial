/* ════════════════════════════════════════════════════════════════════════
   Personality Test — Module Barrel Export

   Central re-export hub for all personality scoring modules.
   Consumers can import everything from '@/lib/personality' instead of
   reaching into individual sub-modules.

   Module Map:
   ├── questions/       Question config arrays (BFI-2-S, SD3)
   ├── labels.ts        Constants, domain labels, Likert scale labels
   ├── scoringEngine.ts Scoring pipeline (validate → score → assemble)
   ├── archetypes.ts    Archetype rule engine + generateArchetype
   └── config.ts        Client-facing test configuration builder
   ════════════════════════════════════════════════════════════════════════ */

// ── Question Banks ─────────────────────────────────────────────────────────────
export { BFI2S_QUESTIONS } from './questions/bfi2s';
export { SD3_QUESTIONS } from './questions/sd3';

// ── Constants & Labels ─────────────────────────────────────────────────────────
export {
	LIKERT_MIN,
	LIKERT_MAX,
	REVERSE_CONSTANT,
	LEVEL_LOW_THRESHOLD,
	LEVEL_HIGH_THRESHOLD,
	DOMAIN_LABELS,
	DOMAIN_LABELS_VI,
	LIKERT_LABELS,
	LIKERT_LABELS_VI,
} from './labels';

// ── Scoring Engine ─────────────────────────────────────────────────────────────
export {
	validateAttentionChecks,
	getEffectiveScore,
	scorePersonalityTest,
} from './scoringEngine';

// ── Archetype Engine ───────────────────────────────────────────────────────────
export { generateArchetype } from './archetypes';

// ── Test Configuration ─────────────────────────────────────────────────────────
export { getTestConfig } from './config';
