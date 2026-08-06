"use client";

/* ════════════════════════════════════════════════════════════════════════
   PercentileGauge v5 — Single professional percentile bar

   Standard statistical visualization:
   - One horizontal bar: 0 → 100 percentile scale
   - Filled portion = your percentile rank
   - Median marker at 50%
   - Mean marker (μ) of reference group shown as a tick
   - Insight label: "Top 10%", "Above average", etc.
   - Z + tier chips below for experts
   ════════════════════════════════════════════════════════════════════════ */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { PersonalityDomain } from "@/types/personalityTest";
import { type Lang, getStrings } from "../i18n";
import { getZTier, TIER_COLORS } from "./types";
import type { NormativeResult } from "./types";

/* ── Hoverable chip ───────────────────────────────────────────────────── */
function Chip({
  children,
  tooltip,
  className,
}: {
  children: React.ReactNode;
  tooltip: string;
  className: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <span
        className={className}
        role="button"
        tabIndex={0}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
        aria-label={tooltip}
      >
        {children}
      </span>
      <AnimatePresence>
        {show && (
          <motion.span
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="absolute bottom-full left-0 z-50 mb-2 w-64 rounded-lg border border-border bg-surface-elevated p-2.5 shadow-lg text-xs text-foreground leading-relaxed"
          >
            {tooltip}
            <span className="absolute -bottom-1 left-3 h-2 w-2 rotate-45 border-b border-r border-border bg-surface-elevated" />
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

/* ── Quick insight label ──────────────────────────────────────────────── */
function insightLabel(pct: number, lang: Lang): string {
  if (pct >= 90) return lang === "vi" ? "Top 10%" : "Top 10%";
  if (pct >= 75) return lang === "vi" ? "Trên trung bình" : "Above average";
  if (pct >= 50) return lang === "vi" ? "Khá" : "Above median";
  if (pct >= 25) return lang === "vi" ? "Dưới trung bình" : "Below average";
  return lang === "vi" ? "Thấp" : "Low range";
}

export function PercentileGauge({
  normResult,
  lang,
}: {
  domain: PersonalityDomain;
  normResult: NormativeResult | undefined;
  lang: Lang;
}) {
  const t = getStrings(lang);

  if (!normResult) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted py-1">
        <div className="h-3 w-3 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        {t.loadingPercentile}
      </div>
    );
  }

  const pct = Math.round(normResult.percentile);
  const z = normResult.zScore;
  const tier = getZTier(z);
  const tc = TIER_COLORS[tier];

  const barColor =
    pct >= 75
      ? "bg-emerald-500 dark:bg-emerald-400"
      : pct >= 50
        ? "bg-sky-500 dark:bg-sky-400"
        : pct >= 25
          ? "bg-amber-500 dark:bg-amber-400"
          : "bg-rose-500 dark:bg-rose-400";

  const pctColor =
    pct >= 75
      ? "text-emerald-700 dark:text-emerald-300"
      : pct >= 50
        ? "text-sky-700 dark:text-sky-300"
        : pct >= 25
          ? "text-amber-700 dark:text-amber-300"
          : "text-rose-700 dark:text-rose-300";

  const groupLabel =
    lang === "vi" ? normResult.referenceGroupLabelVi : normResult.referenceGroupLabel;

  const zDisplay = `${z >= 0 ? "+" : ""}${z.toFixed(2)}`;

  const pctTip =
    lang === "vi"
      ? `Bạn đạt điểm cao hơn ${pct}% người trong nhóm "${groupLabel}".`
      : `You scored higher than ${pct}% of people in "${groupLabel}".`;

  const zTip =
    lang === "vi"
      ? `Z = ${zDisplay}: cách trung bình ${Math.abs(z).toFixed(2)} SD (μ=${normResult.mean.toFixed(2)}, σ=${normResult.sd.toFixed(2)}).`
      : `Z = ${zDisplay}: ${Math.abs(z).toFixed(2)} SD ${z >= 0 ? "above" : "below"} mean (μ=${normResult.mean.toFixed(2)}, σ=${normResult.sd.toFixed(2)}).`;

  /* Mean position on the percentile bar (approximate: convert mean to a 0-100 position).
     For a true percentile of the mean you'd need the CDF, but the mean IS the 50th
     percentile of its own distribution, so we mark it at 50%. */
  const meanPctPosition = 50;

  return (
    <div className="space-y-1.5">
      {/* ── Percentile scale labels ────────────────────────────── */}
      <div className="flex items-center justify-between text-[9px] text-muted/50 tabular-nums px-px">
        <span>0</span>
        <span>25</span>
        <span>50</span>
        <span>75</span>
        <span>100</span>
      </div>

      {/* ── Bar ───────────────────────────────────────────────── */}
      <div className="relative h-3 rounded-full bg-border/40 overflow-hidden">
        {/* Filled portion */}
        <motion.div
          className={`absolute inset-y-0 left-0 rounded-full ${barColor}`}
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(pct, 2)}%` }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        />
        {/* Glass sheen */}
        <div className="absolute inset-0 rounded-full bg-linear-to-b from-white/25 to-transparent pointer-events-none" />
        {/* Quartile tick marks */}
        {[25, 50, 75].map((tick) => (
          <div
            key={tick}
            className={`absolute top-0 h-full ${tick === 50 ? "w-0.5 bg-foreground/25" : "w-px bg-foreground/10"}`}
            style={{ left: `${tick}%` }}
          />
        ))}
        {/* Mean marker (μ) — small triangle below */}
        <div
          className="absolute bottom-0 w-0 h-0"
          style={{
            left: `${meanPctPosition}%`,
            borderLeft: "3px solid transparent",
            borderRight: "3px solid transparent",
            borderBottom: "4px solid var(--foreground)",
            opacity: 0.3,
            transform: "translateX(-3px)",
          }}
          title={`μ = ${normResult.mean.toFixed(2)}`}
        />
      </div>

      {/* ── Stat row ──────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-1.5">
        {/* Percentile value — prominent */}
        <Chip
          tooltip={pctTip}
          className={`inline-flex items-baseline gap-0.5 rounded-md px-2 py-0.5 text-xs font-bold cursor-help ${pctColor} bg-background-secondary`}
        >
          <span className="text-[10px] opacity-60">P</span>{pct}
        </Chip>

        {/* Insight label */}
        <span className={`text-[11px] font-semibold ${pctColor}`}>
          {insightLabel(pct, lang)}
        </span>

        <span className="text-border">·</span>

        {/* Z chip */}
        <Chip
          tooltip={zTip}
          className="inline-flex items-baseline gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-mono font-bold bg-background-secondary text-muted cursor-help"
        >
          <span className="opacity-50">z</span> {zDisplay}
        </Chip>

        {/* Tier chip */}
        <span className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-semibold ${tc.badge}`}>
          {tc.emoji} {tier.replace("_", " ")}
        </span>

        {/* Group label (desktop only) */}
        <span className="ml-auto text-[10px] text-muted/70 hidden sm:inline truncate max-w-44">
          {groupLabel}
        </span>
      </div>
    </div>
  );
}
