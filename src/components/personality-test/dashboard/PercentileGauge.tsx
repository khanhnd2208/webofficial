"use client";

/* ════════════════════════════════════════════════════════════════════════
   PercentileGauge — Animated percentile bar with z-score badge

   Used in:
   - TraitCard (inline within each expanded trait)
   - PersonalityResultsDashboard percentile comparison section (standalone)

   Props:
   - domain: the personality domain (for future conditional styling)
   - normResult: percentile data from the API (undefined = loading state)
   - lang: 'en' | 'vi'
   ════════════════════════════════════════════════════════════════════════ */

import { motion } from "framer-motion";
import type { PersonalityDomain } from "@/types/personalityTest";
import { type Lang, getStrings } from "../i18n";
import { getZTier, TIER_COLORS } from "./types";
import type { NormativeResult } from "./types";

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

  return (
    <div className="space-y-1.5">
      {/* Bar */}
      <div className="relative h-8 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        <motion.div
          className={`absolute inset-y-0 left-0 rounded-full bg-linear-to-r ${barColor}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
        {/* Percentile number inside bar */}
        <div
          className="absolute inset-y-0 flex items-center font-bold text-white text-sm"
          style={{ left: `${Math.max(pct - 8, 2)}%` }}
        >
          P{pct}
        </div>
        {/* Mean marker */}
        <div
          className="absolute top-0 h-full w-0.5 bg-gray-800 dark:bg-gray-200 opacity-60"
          style={{ left: `${meanPct}%` }}
          title={`${t.avgOfGroup}: 50th`}
        />
      </div>

      {/* Info row */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
        <span
          className={`inline-flex items-center rounded-md border px-1.5 py-0.5 font-mono text-xs ${tc.badge}`}
        >
          Z {z >= 0 ? "+" : ""}
          {z.toFixed(2)}
        </span>
        <span>
          {pct}% {t.lowerThanYou}
        </span>
        <span className="opacity-50">|</span>
        <span className="italic opacity-70">
          {t.refGroupMean}: {normResult.mean.toFixed(2)} (SD{" "}
          {normResult.sd.toFixed(2)}) &mdash; {groupLabel}
        </span>
      </div>
    </div>
  );
}
