/* ════════════════════════════════════════════════════════════════════════
   Normative Data — Backward-Compatibility Barrel

   This file now re-exports from the modular '@/lib/normative' package.
   All existing consumers can continue to import from this path unchanged.

   For new code, prefer importing directly from '@/lib/normative'.

   Module structure:
   src/lib/normative/
   ├── index.ts              Master barrel export
   ├── types.ts              Type definitions
   ├── norms.ts              Raw normative data + reference groups
   └── percentileEngine.ts   Math + percentile calculation + lookups
   ════════════════════════════════════════════════════════════════════════ */

// Types
export type { NormativeStats, ReferenceGroup, PercentileResult } from './normative';

// Data
export {
	REFERENCE_GROUPS, BFI2_FACET_NORMS,
	LOCAL_OCEAN_GROUP_ID, LOCAL_DARKTRIAD_GROUP_ID, buildLocalReferenceGroup,
} from './normative';

// Functions
export {
	getReferenceGroupsForDomain,
	getReferenceGroupById,
	getDefaultReferenceGroupIds,
	getLevelFromZScore,
	normalCDF,
	calculateZScore,
	calculatePercentile,
	calculateDomainPercentile,
	calculateDomainPercentileFromGroup,
	calculateAllPercentiles,
	getReferenceGroupOptions,
} from './normative';
