"use client";

/* ════════════════════════════════════════════════════════════════════════
   PercentileGauge v2 — Professional gauge bar with clean stat badges

   Redesign:
   - Taller bar (h-9) with gradient + inner rounded track
   - Floating P-label that slides with the bar end
   - Mean marker with tooltip label
   - Cleaner stat badges: compact mono pills, no excessive borders
   - Group info collapsed into a subtle footer line
   ════════════════════════════════════════════════════════════════════════ */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { PersonalityDomain } from "@/types/personalityTest";
import { type Lang, getStrings } from "../i18n";
import { getZTier, TIER_COLORS } from "./types";
import type { NormativeResult } from "./types";

/* ── Compact stat pill with tooltip ──────────────────────────────────── */
function StatPill({
  label,
  value,
  tooltip,
  variant,
}: {
  label: string;
  value: string;
  tooltip: string;
  variant: "percentile" | "zscore" | "neutral";
}) {
  const [open, setOpen] = useState(false);

  const variantClass =
    variant === "percentile"
      ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 ring-1 ring-indigo-200 dark:ring-indigo-800"
      : variant === "zscore"
        ? "bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300 ring-1 ring-violet-200 dark:ring-violet-800"
        : "bg-background-secondary text-muted ring-1 ring-border";

  return (
    <div className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-mono text-xs font-semibold transition-all hover:scale-[1.03] active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 ${variantClass}`}
        aria-label={`${label}: ${value}. ${tooltip}`}
      >
        <span className="text-[9px] font-bold uppercase tracking-widest opacity-50">
          {label}
        </span>
        <span className="text-sm font-extrabold">{value}</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            transition={{ duration: 0.12 }}
            className="absolute bottom-full left-0 z-50 mb-2 w-72 rounded-xl border border-border bg-surface p-3 shadow-xl shadow-black/8"
            role="tooltip"
          >
            <p className="text-xs leading-relaxed text-foreground">
              {tooltip}
            </p>
            <div className="absolute -bottom-1 left-4 h-2 w-2 rotate-45 border-b border-r border-border bg-surface" />
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
      <div className="flex items-center gap-2 text-sm text-muted py-2">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        {t.loadingPercentile}
      </div>
    );
  }

  const pct = Math.round(normResult.percentile);
  const z = normResult.zScore;
  const tier = getZTier(z);
  const tc = TIER_COLORS[tier];

  const barGradient =
    pct >= 75
      ? "from-emerald-400 to-teal-500"
      : pct >= 50
        ? "from-sky-400 to-indigo-500"
        : pct >= 25
          ? "from-amber-400 to-orange-500"
          : "from-rose-400 to-red-500";

  const groupLabel =
    lang === "vi"
      ? normResult.referenceGroupLabelVi
      : normResult.referenceGroupLabel;

  const zDisplay = `${z >= 0 ? "+" : ""}${z.toFixed(2)}`;

  const pctTooltip =
    lang === "vi"
      ? `Percentile ${pct}: bạn đạt điểm cao hơn ${pct}% người trong nhóm tham chiếu (${groupLabel}).`
      : `Percentile ${pct}: you scored higher than ${pct}% of people in the reference group (${groupLabel}).`;

  const zTooltip =
    lang === "vi"
      ? `Z-score ${zDisplay}: điểm của bạn cách trung bình nhóm ${Math.abs(z).toFixed(2)} độ lệch chuẩn về phía ${z >= 0 ? "cao hơn" : "thấp hơn"}. μ=${normResult.mean.toFixed(2)}, σ=${normResult.sd.toFixed(2)}.`
      : `Z-score ${zDisplay}: your score is ${Math.abs(z).toFixed(2)} SD ${z >= 0 ? "above" : "below"} the group mean. μ=${normResult.mean.toFixed(2)}, σ=${normResult.sd.toFixed(2)}.`;

  return (
    <div className="space-y-2">
      {/* ── Gauge bar ─────────────────────────────────────────────── */}
      <div className="relative h-7 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800/80">
        {/* Gradient fill */}
        <motion.div
          className={`absolute inset-y-0 left-0 rounded-full bg-linear-to-r ${barGradient}`}
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(pct, 2)}%` }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        />
        {/* P-label floating at bar end */}
        <motion.div
          className="absolute inset-y-0 flex items-center"
          initial={{ left: "0%" }}
          animate={{ left: `${Math.max(pct - 1, 1)}%` }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        >
          <span className="text-[11px] font-extrabold text-white drop-shadow-sm pl-1">
            {pct > 8 ? `P${pct}` : ""}
          </span>
        </motion.div>
        {/* Small P label on the right when bar is too short */}
        {pct <= 8 && (
          <span className="absolute right-2 inset-y-0 flex items-center text-[11px] font-bold text-muted">
            P{pct}
          </span>
        )}
        {/* Mean marker at 50% */}
        <div
          className="absolute top-0 h-full w-0.5 bg-foreground/25"
          style={{ left: "50%" }}
          title={lang === "vi" ? "P50 — trung bình" : "P50 — median"}
        />
      </div>

      {/* ── Stat pills row ────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-1.5">
        <StatPill
          label="P"
          value={String(pct)}
          tooltip={pctTooltip}
          variant="percentile"
        />
        <StatPill
          label="Z"
          value={zDisplay}
          tooltip={zTooltip}
          variant="zscore"
        />
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${tc.badge}`}
        >
          {tc.emoji} {tier.replace("_", " ")}
        </span>
        <span className="ml-auto text-[10px] text-muted hidden sm:inline">
          {groupLabel} · μ={normResult.mean.toFixed(2)}
        </span>
      </div>
    </div>
  );
}
