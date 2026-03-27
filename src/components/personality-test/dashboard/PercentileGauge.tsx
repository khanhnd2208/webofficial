"use client";

/* ════════════════════════════════════════════════════════════════════════
   PercentileGauge — Animated percentile bar with z-score badge + tooltips

   Used in:
   - TraitCard (inline within each expanded trait)
   - PersonalityResultsDashboard percentile comparison section (standalone)

   Props:
   - domain: the personality domain (for future conditional styling)
   - normResult: percentile data from the API (undefined = loading state)
   - lang: 'en' | 'vi'
   ════════════════════════════════════════════════════════════════════════ */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { PersonalityDomain } from "@/types/personalityTest";
import { type Lang, getStrings } from "../i18n";
import { getZTier, TIER_COLORS } from "./types";
import type { NormativeResult } from "./types";

/* ── Inline stat badge with click/hover tooltip ──────────────────────────── */
function StatBadge({
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
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className={`inline-flex cursor-pointer items-center gap-1 rounded-lg border-2 px-2.5 py-1 font-mono text-sm font-black shadow-sm transition-all hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 ${colorClass}`}
        aria-label={`${label}: ${value}. ${tooltip}`}
      >
        <span className="text-[10px] font-semibold uppercase tracking-wider opacity-70">
          {label}
        </span>
        <span className="text-sm font-black">{value}</span>
        <span className="text-[9px] opacity-50">ⓘ</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-0 z-50 mb-2 w-64 rounded-xl border border-border bg-surface p-3 shadow-xl shadow-black/10"
            role="tooltip"
          >
            <p className="text-xs leading-relaxed text-foreground">
              {tooltip}
            </p>
            <div className="absolute -bottom-1 left-3 h-2 w-2 rotate-45 border-b border-r border-border bg-surface" />
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
      <div className="flex items-center gap-2 text-sm text-muted">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        {t.loadingPercentile}
      </div>
    );
  }

  const pct = Math.round(normResult.percentile);
  const z = normResult.zScore;
  const tier = getZTier(z);
  const tc = TIER_COLORS[tier];
  const meanPct = 50;

  const barColor =
    pct >= 75
      ? "from-teal-400 to-teal-500"
      : pct >= 50
        ? "from-sky-400 to-sky-600"
        : pct >= 25
          ? "from-amber-400 to-amber-600"
          : "from-rose-400 to-rose-600";

  const groupLabel =
    lang === "vi"
      ? normResult.referenceGroupLabelVi
      : normResult.referenceGroupLabel;

  const zDisplay = `${z >= 0 ? "+" : ""}${z.toFixed(2)}`;

  // Build tooltip texts
  const pctTooltip =
    lang === "vi"
      ? `Percentile ${pct} nghĩa là bạn đạt điểm cao hơn ${pct}% người trong nhóm tham chiếu (${groupLabel}, n≈${normResult.sd ? Math.round(normResult.mean * 100) / 100 : "?"}).`
      : `Percentile ${pct} means you scored higher than ${pct}% of people in the reference group (${groupLabel}).`;

  const zTooltip =
    lang === "vi"
      ? `Z-score ${zDisplay}: điểm của bạn cách trung bình nhóm ${Math.abs(z).toFixed(2)} độ lệch chuẩn về phía ${z >= 0 ? "cao hơn" : "thấp hơn"}. Trung bình nhóm = ${normResult.mean.toFixed(2)}, SD = ${normResult.sd.toFixed(2)}. |Z| < 0.5 = trung bình; |Z| > 1.5 = rất cao/thấp.`
      : `Z-score ${zDisplay}: your score is ${Math.abs(z).toFixed(2)} standard deviations ${z >= 0 ? "above" : "below"} the group mean. Group mean = ${normResult.mean.toFixed(2)}, SD = ${normResult.sd.toFixed(2)}. |Z| < 0.5 = average; |Z| > 1.5 = very high/low.`;

  // Z-badge color: accent the badge based on tier
  const zBadgeColor =
    tier === "very_high"
      ? "border-rose-400 bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-200"
      : tier === "high"
        ? "border-amber-400 bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200"
        : tier === "moderate"
          ? "border-sky-400 bg-sky-50 text-sky-800 dark:bg-sky-950/60 dark:text-sky-200"
          : tier === "low"
            ? "border-stone-400 bg-stone-50 text-stone-700 dark:bg-stone-900/60 dark:text-stone-200"
            : "border-slate-400 bg-slate-50 text-slate-700 dark:bg-slate-900/60 dark:text-slate-200";

  const pctBadgeColor =
    pct >= 75
      ? "border-teal-400 bg-teal-50 text-teal-800 dark:bg-teal-950/60 dark:text-teal-200"
      : pct >= 50
        ? "border-sky-400 bg-sky-50 text-sky-800 dark:bg-sky-950/60 dark:text-sky-200"
        : pct >= 25
          ? "border-amber-400 bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200"
          : "border-rose-400 bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-200";

  return (
    <div className="space-y-2.5">
      {/* Animated bar */}
      <div className="relative h-8 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        <motion.div
          className={`absolute inset-y-0 left-0 rounded-full bg-linear-to-r ${barColor}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
        {/* Percentile label inside bar */}
        <div
          className="absolute inset-y-0 flex items-center font-black text-white text-sm drop-shadow"
          style={{ left: `${Math.max(pct - 9, 1)}%` }}
        >
          P{pct}
        </div>
        {/* Mean marker at 50th */}
        <div
          className="absolute top-0 h-full w-0.5 bg-gray-800 dark:bg-gray-200 opacity-60"
          style={{ left: `${meanPct}%` }}
          title={lang === "vi" ? "Trung bình nhóm (P50)" : "Group mean (P50)"}
        />
      </div>

      {/* Highlighted stat badges + reference info */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Percentile badge — clickable with tooltip */}
        <StatBadge
          label={lang === "vi" ? "Percentile" : "Percentile"}
          value={`P${pct}`}
          tooltip={pctTooltip}
          colorClass={pctBadgeColor}
        />

        {/* Z-score badge — clickable with tooltip */}
        <StatBadge
          label="Z"
          value={zDisplay}
          tooltip={zTooltip}
          colorClass={zBadgeColor}
        />

        {/* Tier badge */}
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${tc.badge}`}
        >
          {tc.emoji} {tier.replace("_", " ")}
        </span>

        {/* Reference group info */}
        <span className="text-[11px] text-muted italic opacity-70">
          {lang === "vi" ? "Ref:" : "Ref:"} {groupLabel} · μ={normResult.mean.toFixed(2)} σ={normResult.sd.toFixed(2)}
        </span>
      </div>
    </div>
  );
}
