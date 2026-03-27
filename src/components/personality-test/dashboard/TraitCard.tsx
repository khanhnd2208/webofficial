"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { TraitScore, PersonalityDomain } from "@/types/personalityTest";
import {
  type Lang,
  type FiveTier,
  getStrings,
  getDomainLabel,
  getTierLabel,
} from "../i18n";
import { getTraitInsight } from "../traitInsights";
import { getZTier, TIER_COLORS } from "./types";
import type { NormativeResult } from "./types";
import { PercentileGauge } from "./PercentileGauge";

// ─── TraitCard ─────────────────────────────────────────────────────────────────

export function TraitCard({
  trait,
  normResult,
  lang,
  isDarkTriad,
}: {
  trait: TraitScore;
  normResult: NormativeResult | undefined;
  lang: Lang;
  isDarkTriad: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const t = getStrings(lang);
  const insight = getTraitInsight(trait.domain, lang);
  const tier: FiveTier = normResult
    ? getZTier(normResult.zScore)
    : (trait.level as FiveTier);
  const tc = TIER_COLORS[tier];
  const tierLabel = getTierLabel(tier, lang);
  const domainLabel = getDomainLabel(trait.domain, lang);
  const tierInterpretation = insight[tier];

  const scoreBarWidth = ((trait.score / 5) * 100).toFixed(1);

  // Left accent border color based on tier
  const accentBorder =
    tier === "very_high"
      ? "border-l-rose-400"
      : tier === "high"
        ? "border-l-amber-400"
        : tier === "moderate"
          ? "border-l-sky-400"
          : tier === "low"
            ? "border-l-stone-400"
            : "border-l-slate-400";

  return (
    <motion.div
      layout
      className={`rounded-2xl border border-border bg-surface shadow-sm hover:shadow-md transition-shadow border-l-4 ${accentBorder} overflow-hidden`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div
        className="flex cursor-pointer items-start justify-between gap-3 p-5"
        onClick={() => setExpanded(!expanded)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") setExpanded(!expanded);
        }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-2xl shrink-0">{insight.icon}</span>
          <div className="min-w-0">
            <h3 className="font-bold text-foreground text-base leading-tight truncate">
              {domainLabel}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm font-mono text-muted tabular-nums">
                {trait.score.toFixed(2)}/5
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold ${tc.badge}`}
              >
                {tc.emoji} {tierLabel}
              </span>
            </div>
          </div>
        </div>
        <motion.span
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-muted text-sm shrink-0 mt-2"
        >
          ▼
        </motion.span>
      </div>

      {/* Score bar */}
      <div className="mx-5 mb-4 h-1.5 w-auto overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
        <motion.div
          className={`h-full rounded-full ${
            isDarkTriad
              ? "bg-linear-to-r from-violet-400 to-purple-500"
              : "bg-linear-to-r from-indigo-400 to-blue-500"
          }`}
          initial={{ width: 0 }}
          animate={{ width: `${scoreBarWidth}%` }}
          transition={{ duration: 0.8 }}
        />
      </div>

      {/* Normative info — inside card but before expansion */}
      {normResult && (
        <div className="mx-5 mb-4">
          <PercentileGauge
            domain={trait.domain}
            normResult={normResult}
            lang={lang}
          />
        </div>
      )}

      {/* Expand prompt */}
      {!expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="mx-5 mb-4 flex items-center gap-1.5 text-xs text-accent font-medium hover:underline"
        >
          ✨ {t.tapToExplore}
        </button>
      )}

      {/* Expanded content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="mx-5 mb-5 space-y-4 border-t border-border pt-4">
              {/* What is this trait */}
              <div>
                <h4 className="text-sm font-bold text-foreground mb-1">
                  {t.whatThisMeans}
                </h4>
                <p className="text-sm text-muted leading-relaxed">
                  {insight.what}
                </p>
              </div>

              {/* Tier interpretation */}
              <div className={`rounded-xl p-4 ${tc.badge}`}>
                <h4 className="text-sm font-bold mb-1">
                  {tc.emoji} {tierLabel}
                </h4>
                <p className="text-sm leading-relaxed">{tierInterpretation}</p>
              </div>

              {/* Derailment warning for dark triad */}
              {isDarkTriad && insight.derailment && tier === "very_high" && (
                <div className="rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 p-4">
                  <h4 className="text-sm font-bold text-rose-700 dark:text-rose-300 mb-1">
                    {t.derailmentRisk}
                  </h4>
                  <p className="text-sm text-rose-600 dark:text-rose-400 leading-relaxed">
                    {insight.derailment}
                  </p>
                </div>
              )}

              {/* Career fit */}
              <div>
                <h4 className="text-sm font-bold text-foreground mb-1">
                  {t.careerFit}
                </h4>
                <p className="text-sm text-muted leading-relaxed">
                  {insight.career}
                </p>
              </div>

              {/* Academic context */}
              <div>
                <h4 className="text-sm font-bold text-foreground mb-1">
                  {t.academicContext}
                </h4>
                <p className="text-sm text-muted leading-relaxed">
                  {insight.academic}
                </p>
              </div>

              {/* OB Lesson */}
              {insight.obLesson && (
                <div>
                  <h4 className="text-sm font-bold text-foreground mb-1">
                    {t.obLesson}
                  </h4>
                  <p className="text-sm text-muted leading-relaxed">
                    {insight.obLesson}
                  </p>
                </div>
              )}

              {/* Student action tip */}
              <div className="rounded-xl bg-accent/8 border border-accent/15 p-4">
                <h4 className="text-sm font-bold text-accent mb-1">
                  {t.studentAction}
                </h4>
                <p className="text-sm text-foreground leading-relaxed">
                  {insight.tip}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
