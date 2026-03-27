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

/* ════════════════════════════════════════════════════════════════════════
   TraitCard v4 — Clean, insightful, world-class

   - Score bar now is a readable h-2 with rounded track
   - Header: icon + name + score/5 + tier badge, all on one line
   - Percentile gauge sits cleanly under the bar
   - Expanded content: bordered insight sections with clear hierarchy
   - No redundant visual noise
   ════════════════════════════════════════════════════════════════════════ */

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

  const pct = ((trait.score / 5) * 100).toFixed(1);

  const barColor = isDarkTriad
    ? "bg-violet-500 dark:bg-violet-400"
    : "bg-indigo-500 dark:bg-indigo-400";

  return (
    <motion.div
      layout
      className="rounded-xl border border-border bg-surface overflow-hidden transition-shadow hover:shadow-md"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      {/* ── Header (clickable) ─────────────────────────────────── */}
      <button
        className="flex w-full cursor-pointer items-center gap-3 p-4 sm:p-5 text-left"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        <span className="text-2xl shrink-0">{insight.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-foreground text-[15px] leading-tight truncate">
              {domainLabel}
            </h3>
            <span className={`shrink-0 inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${tc.badge}`}>
              {tc.emoji} {tierLabel}
            </span>
          </div>
          <span className="text-xs font-mono text-muted tabular-nums mt-0.5 block">
            {trait.score.toFixed(2)}<span className="opacity-40"> / 5</span>
          </span>
        </div>
        <svg
          className={`h-4 w-4 shrink-0 text-muted transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* ── Score bar ──────────────────────────────────────────── */}
      <div className="px-4 sm:px-5 pb-2">
        <div className="h-1.5 rounded-full bg-border/40 overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${barColor}`}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.6 }}
          />
        </div>
      </div>

      {/* ── Percentile gauge ───────────────────────────────────── */}
      {normResult && (
        <div className="px-4 sm:px-5 pb-3">
          <PercentileGauge domain={trait.domain} normResult={normResult} lang={lang} />
        </div>
      )}

      {/* ── Expand hint ────────────────────────────────────────── */}
      {!expanded && (
        <div className="px-4 sm:px-5 pb-3">
          <span className="text-[11px] text-muted">
            {t.tapToExplore}
          </span>
        </div>
      )}

      {/* ── Expanded insights ──────────────────────────────────── */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 sm:px-5 pb-5 space-y-3 border-t border-border/60 pt-4">
              {/* What is this trait */}
              <InsightBlock
                title={t.whatThisMeans}
                text={insight.what}
              />

              {/* Tier interpretation — highlighted */}
              <div className={`rounded-lg p-3.5 ${tc.badge}`}>
                <p className="text-xs font-bold mb-1">{tc.emoji} {tierLabel}</p>
                <p className="text-xs leading-relaxed">{tierInterpretation}</p>
              </div>

              {/* Derailment warning */}
              {isDarkTriad && insight.derailment && tier === "very_high" && (
                <div className="rounded-lg bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 p-3.5">
                  <p className="text-xs font-bold text-rose-700 dark:text-rose-300 mb-1">
                    {t.derailmentRisk}
                  </p>
                  <p className="text-xs text-rose-600 dark:text-rose-400 leading-relaxed">
                    {insight.derailment}
                  </p>
                </div>
              )}

              {/* Career + Academic in a 2-col grid on sm+ */}
              <div className="grid gap-3 sm:grid-cols-2">
                <InsightBlock title={t.careerFit} text={insight.career} />
                <InsightBlock title={t.academicContext} text={insight.academic} />
              </div>

              {/* OB Lesson */}
              {insight.obLesson && (
                <InsightBlock title={t.obLesson} text={insight.obLesson} />
              )}

              {/* Action tip — accent highlight */}
              <div className="rounded-lg bg-accent/6 border border-accent/12 p-3.5">
                <p className="text-xs font-bold text-accent mb-1">{t.studentAction}</p>
                <p className="text-xs text-foreground leading-relaxed">{insight.tip}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ── Reusable mini insight block ──────────────────────────────────────── */
function InsightBlock({ title, text }: { title: string; text: string }) {
  return (
    <div>
      <p className="text-xs font-bold text-foreground mb-0.5">{title}</p>
      <p className="text-xs text-muted leading-relaxed">{text}</p>
    </div>
  );
}
