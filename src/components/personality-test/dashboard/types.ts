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
    badge: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
    ring: "ring-rose-400/40",
    emoji: "\u{1F525}",
  },
  high: {
    badge:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    ring: "ring-amber-400/40",
    emoji: "\u2B06\uFE0F",
  },
  moderate: {
    badge: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
    ring: "ring-sky-400/40",
    emoji: "\u2696\uFE0F",
  },
  low: {
    badge: "bg-stone-100 text-stone-600 dark:bg-stone-800/40 dark:text-stone-300",
    ring: "ring-stone-400/30",
    emoji: "\u2B07\uFE0F",
  },
  very_low: {
    badge:
      "bg-slate-100 text-slate-600 dark:bg-slate-800/40 dark:text-slate-300",
    ring: "ring-slate-400/30",
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
