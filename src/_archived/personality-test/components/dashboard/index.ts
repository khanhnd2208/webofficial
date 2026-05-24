/* Dashboard sub-components barrel export */

export type { NormativeResult, PercentilesApiResponse } from "./types";
export { getZTier, TIER_COLORS, OCEAN_DOMAINS, DARK_TRIAD_DOMAINS } from "./types";

export { RadarChart } from "./RadarChart";
export { TraitCard } from "./TraitCard";
export { PercentileGauge } from "./PercentileGauge";
export { ArchetypeCard } from "./ArchetypeCard";
export { ScoreTable } from "./ScoreTable";
export { LimitationsSection } from "./LimitationsSection";
export { ResultsInterstitial } from "./ResultsInterstitial";
export { generateCrossTraitInsights } from "./CrossTraitInsights";
export type { CrossTraitInsight } from "./CrossTraitInsights";
