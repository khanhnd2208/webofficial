"use client";

/* ════════════════════════════════════════════════════════════════════════
   PercentileGauge v3 — Clean, high-contrast, analytics-grade

   Design principles:
   - Track uses design-token colors (not raw Tailwind gray)
   - P-label displayed OUTSIDE bar for guaranteed readability
   - Single clean stat row: just the numbers, no clutter
   - Mean marker as a simple tick with label
   - Quartile color coding: semantic & accessible
   ════════════════════════════════════════════════════════════════════════ */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { PersonalityDomain } from "@/types/personalityTest";
import { type Lang, getStrings } from "../i18n";
import { getZTier, TIER_COLORS } from "./types";
import type { NormativeResult } from "./types";

/* ── Stat chip with tooltip ───────────────────────────────────────────── */
function StatChip({
  label,
  value,
  tooltip,
  colorClass,
}: {
  label: string;
  value: string;
  tooltip: string;
  colorClass: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-flex">
      <button
        type="button"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className={`inline-flex items-baseline gap-1 rounded-md px-2.5 py-1 font-mono text-xs font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 ${colorClass}`}
        aria-label={`${label}: ${value}. ${tooltip}`}
      >
        <span className="text-[9px] font-bold uppercase tracking-widest opacity-60">
          {label}
        </span>
        <span className="text-sm font-extrabold tabular-nums">{value}</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.1 }}
            className="absolute bottom-full left-0 z-50 mb-2 w-72 rounded-xl border border-border bg-surface-elevated p-3 shadow-xl"
            role="tooltip"
          >
            <p className="text-xs leading-relaxed text-foreground">{tooltip}</p>
            <div className="absolute -bottom-1 left-4 h-2 w-2 rotate-45 border-b border-r border-border bg-surface-elevated" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function PercentileGauge({
  domain,
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
      <div className="flex items-center gap-2 text-sm text-muted py-1.5">
        <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        <span className="text-xs">{t.loadingPercentile}</span>
      </div>
    );
  }

  const pct = Math.round(normResult.percentile);
  const z = normResult.zScore;
  const tier = getZTier(z);
  const tc = TIER_COLORS[tier];

  /* Quartile bar color — semantically accessible */
  const barColor =
    pct >= 75
      ? "bg-emerald-500 dark:bg-emerald-400"
      : pct >= 50
        ? "bg-sky-500 dark:bg-sky-400"
        : pct >= 25
          ? "bg-amber-500 dark:bg-amber-400"
          : "bg-rose-500 dark:bg-rose-400";

  /* Chip color mirrors bar, stays on design-token surfaces */
  const pctChipColor =
    pct >= 75
      ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200"
      : pct >= 50
        ? "bg-sky-50 text-sky-800 dark:bg-sky-950/60 dark:text-sky-200"
        : pct >= 25
          ? "bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200"
          : "bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-200";

  const zChipColor = "bg-background-secondary text-foreground-secondary dark:bg-surface-secondary dark:text-foreground-secondary";

  const groupLabel =
    lang === "vi" ? normResult.referenceGroupLabelVi : normResult.referenceGroupLabel;

  const zDisplay = `${z >= 0 ? "+" : ""}${z.toFixed(2)}`;

  const pctTooltip =
    lang === "vi"
      ? `Bạn đạt điểm cao hơn ${pct}% người trong nhóm "${groupLabel}". Tính theo thang bách phân vị.`
      : `You scored higher than ${pct}% of people in "${groupLabel}". Measured on the percentile scale.`;

  const zTooltip =
    lang === "vi"
      ? `Z-score ${zDisplay}: cách trung bình ${Math.abs(z).toFixed(2)} độ lệch chuẩn về phía ${z >= 0 ? "cao hơn" : "thấp hơn"}. μ=${normResult.mean.toFixed(2)}, σ=${normResult.sd.toFixed(2)}.`
      : `Z = ${zDisplay}: your score is ${Math.abs(z).toFixed(2)} SD ${z >= 0 ? "above" : "below"} the group mean (μ=${normResult.mean.toFixed(2)}, σ=${normResult.sd.toFixed(2)}).`;

  return (
    <div className="space-y-2">
      {/* ── Track + bar ───────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        {/* Bar */}
        <div className="relative flex-1 h-2 rounded-full bg-border/60">
          {/* Filled portion */}
          <motion.div
            className={`absolute inset-y-0 left-0 rounded-full ${barColor}`}
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(pct, 1)}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
          {/* Median tick */}
          <div
            className="absolute top-1/2 -translate-y-1/2 h-3 w-px bg-foreground/30"
            style={{ left: "50%" }}
            aria-hidden="true"
          />
        </div>
        {/* P-value label — always outside bar, always readable */}
        <span className={`w-10 shrink-0 text-right text-xs font-bold tabular-nums ${
          pct >= 75 ? "text-emerald-700 dark:text-emerald-300"
          : pct >= 50 ? "text-sky-700 dark:text-sky-300"
          : pct >= 25 ? "text-amber-700 dark:text-amber-300"
          : "text-rose-700 dark:text-rose-300"
        }`}>
          P{pct}
        </span>
      </div>

      {/* ── Stat row ──────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-1.5">
        <StatChip
          label={lang === "vi" ? "Bậc" : "Pct"}
          value={String(pct)}
          tooltip={pctTooltip}
          colorClass={pctChipColor}
        />
        <StatChip
          label="Z"
          value={zDisplay}
          tooltip={zTooltip}
          colorClass={zChipColor}
        />
        <span
          className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold ${tc.badge}`}
        >
          {tc.emoji} {tier.replace("_", " ")}
        </span>
        <span className="ml-auto text-[10px] text-muted hidden sm:inline truncate max-w-48">
          {groupLabel}
        </span>
      </div>
    </div>
  );
}
