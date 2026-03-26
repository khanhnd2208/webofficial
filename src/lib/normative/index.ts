/* ════════════════════════════════════════════════════════════════════════
   Normative Data — Module Barrel Export

   Central re-export hub for all normative data modules.
   Consumers can import everything from '@/lib/normative'.

   Module Map:
   ├── types.ts              Type definitions (NormativeStats, ReferenceGroup, PercentileResult)
   ├── norms.ts              Raw normative data + REFERENCE_GROUPS array
   └── percentileEngine.ts   Math functions + percentile calculation + lookup helpers
   ════════════════════════════════════════════════════════════════════════ */

// ── Types ──────────────────────────────────────────────────────────────────────
export type { NormativeStats, ReferenceGroup, PercentileResult } from './types';

// ── Data ───────────────────────────────────────────────────────────────────────
export { REFERENCE_GROUPS, BFI2_FACET_NORMS, OCEAN_DOMAINS, DARK_TRIAD_DOMAINS } from './norms';

// ── Percentile Engine ──────────────────────────────────────────────────────────
export {
	// Lookups
	getReferenceGroupsForDomain,
	getReferenceGroupById,
	getDefaultReferenceGroupIds,
	getLevelFromZScore,

	// Math
	normalCDF,
	calculateZScore,
	calculatePercentile,

	// Composite
	calculateDomainPercentile,
	calculateAllPercentiles,

	// UI helpers
	getReferenceGroupOptions,
} from './percentileEngine';
