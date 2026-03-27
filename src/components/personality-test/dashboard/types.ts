/* Shared types and constants for the results dashboard sub-components */

import type { PersonalityDomain } from "@/types/personalityTest";
import type { FiveTier } from "../i18n";

// ─── Normative Result (API Shape) ──────────────────────────────────────────────

export interface NormativeResult {
  domain: PersonalityDomain;
  score: number;
  referenceGroupId: string;
  referenceGroupLabel: string;
  referenceGroupLabelVi: string;
  mean: number;
  sd: number;
  zScore: number;
  percentile: number;
  interpretation: string;
  interpretationVi: string;
}

export interface PercentilesApiResponse {
  sessionId: string;
  percentiles: Record<string, NormativeResult>;
  selectedGroups: { ocean: string; darkTriad: string };
  availableGroups: {
    id: string;
    label: string;
    labelVi: string;
    type: "ocean" | "darkTriad";
    n: number;
  }[];
  referenceGroupDetails: {
    ocean: {
      id: string;
      label: string;
      labelVi: string;
      description: string;
      descriptionVi: string;
      source: string;
    };
    darkTriad: {
      id: string;
      label: string;
      labelVi: string;
      description: string;
      descriptionVi: string;
      source: string;
    };
  };
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

export function getZTier(zScore: number | undefined): FiveTier {
  if (zScore === undefined) return "moderate";
  if (zScore >= 1.5) return "very_high";
  if (zScore >= 0.5) return "high";
  if (zScore >= -0.5) return "moderate";
  if (zScore >= -1.5) return "low";
  return "very_low";
}

export const TIER_COLORS: Record<
  FiveTier,
  { badge: string; ring: string; emoji: string }
> = {
  very_high: {
    badge: "bg-rose-50 text-rose-800 dark:bg-rose-950/50 dark:text-rose-200",
    ring: "ring-rose-300/40 dark:ring-rose-700/40",
    emoji: "\u{1F525}",
  },
  high: {
    badge:
      "bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200",
    ring: "ring-amber-300/40 dark:ring-amber-700/40",
    emoji: "\u2B06\uFE0F",
  },
  moderate: {
    badge: "bg-sky-50 text-sky-800 dark:bg-sky-950/50 dark:text-sky-200",
    ring: "ring-sky-300/40 dark:ring-sky-700/40",
    emoji: "\u2696\uFE0F",
  },
  low: {
    badge: "bg-stone-50 text-stone-700 dark:bg-stone-900/50 dark:text-stone-200",
    ring: "ring-stone-300/30 dark:ring-stone-700/30",
    emoji: "\u2B07\uFE0F",
  },
  very_low: {
    badge:
      "bg-slate-50 text-slate-700 dark:bg-slate-900/50 dark:text-slate-200",
    ring: "ring-slate-300/30 dark:ring-slate-700/30",
    emoji: "\u2744\uFE0F",
  },
};

export const OCEAN_DOMAINS: PersonalityDomain[] = [
  "extraversion",
  "agreeableness",
  "conscientiousness",
  "negativeEmotionality",
  "openMindedness",
];

export const DARK_TRIAD_DOMAINS: PersonalityDomain[] = [
  "machiavellianism",
  "narcissism",
  "psychopathy",
];
