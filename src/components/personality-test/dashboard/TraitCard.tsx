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
   TraitCard v5 — Single bar, clean hierarchy

   Key design decisions:
   - ONE bar only: the PercentileGauge (percentile rank)
   - Raw score shown as mono text next to trait name
   - No separate "score bar" — avoids the confusing 2-bar problem
   - Header: icon + name + raw score + tier badge
   - Expanded content: bordered insight sections
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
        className={`flex w-full cursor-pointer items-center gap-3 p-4 sm:p-5 text-left transition-colors ${
          expanded ? "bg-accent/3" : "hover:bg-background-secondary/40"
        }`}
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        <span className="text-2xl shrink-0" aria-hidden="true">{insight.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
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
        {/* Expand/collapse indicator */}
        <div className="shrink-0 flex flex-col items-center gap-0.5">
          <motion.div
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className={`flex h-7 w-7 items-center justify-center rounded-full border-2 transition-colors ${
              expanded
                ? "border-accent bg-accent text-white"
                : "border-accent/40 bg-accent/10 text-accent"
            }`}
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </motion.div>
          {!expanded && (
            <span className="text-[8px] font-bold text-accent/70 leading-none">
              {lang === "vi" ? "xem" : "view"}
            </span>
          )}
        </div>
      </button>

      {/* ── Percentile gauge (single bar) ──────────────────────── */}
      <div className="px-4 sm:px-5 pb-3">
        <PercentileGauge domain={trait.domain} normResult={normResult} lang={lang} />
      </div>

      {/* ── Expand hint ────────────────────────────────────────── */}
      {!expanded && (
        <div className="px-4 sm:px-5 pb-3">
          <div className="flex items-center gap-1.5 text-accent/80">
            <motion.svg
              className="h-3 w-3 shrink-0"
              viewBox="0 0 20 20"
              fill="currentColor"
              animate={{ y: [0, 2, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 011.06 0L10 11.94l3.72-3.72a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.22 9.28a.75.75 0 010-1.06z" clipRule="evenodd" />
            </motion.svg>
            <span className="text-[11px] font-semibold">
              {lang === "vi" ? "Nhấn để xem phân tích chi tiết →" : "Tap to see your detailed analysis →"}
            </span>
          </div>
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
