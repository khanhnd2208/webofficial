"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { TraitScore } from "@/types/personalityTest";
import {
  type Lang,
  type FiveTier,
  getStrings,
  getDomainLabel,
  getTierLabel,
} from "../i18n";
import { getZTier, TIER_COLORS, OCEAN_DOMAINS } from "./types";
import type { NormativeResult } from "./types";

/* ── Inline tooltip cell ─────────────────────────────────────────────── */
function TooltipCell({
  children,
  tooltip,
  highlight,
}: {
  children: React.ReactNode;
  tooltip: string;
  highlight: string; // Tailwind class string for background highlight
}) {
  const [open, setOpen] = useState(false);
  return (
    <td className="px-3 py-2.5 text-center">
      <div className="relative inline-flex justify-center">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
          className={`inline-flex cursor-pointer items-center gap-1 rounded-md px-2 py-0.5 font-mono text-xs font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 ${highlight}`}
          aria-label={tooltip}
        >
          {children}
        </button>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute bottom-full left-1/2 z-50 mb-2 w-64 -translate-x-1/2 rounded-lg border border-border bg-surface p-3 shadow-xl shadow-black/10 text-left"
              role="tooltip"
            >
              <p className="text-xs leading-relaxed text-foreground">{tooltip}</p>
              <div className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 border-b border-r border-border bg-surface" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </td>
  );
}

export function ScoreTable({
  traits,
  percentiles,
  lang,
}: {
  traits: TraitScore[];
  percentiles: Record<string, NormativeResult>;
  lang: Lang;
}) {
  const t = getStrings(lang);

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-background-secondary/60">
            <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-muted">
              {t.thTrait}
            </th>
            <th className="px-3 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-muted hidden sm:table-cell">
              {t.thType}
            </th>
            <th className="px-3 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-muted">
              {t.thScore}
            </th>
            <th className="px-3 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-muted">
              {t.thZ}
            </th>
            <th className="px-3 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-muted">
              {t.thLevel}
            </th>
            <th className="px-3 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-muted">
              {t.thPercentile}
            </th>
          </tr>
        </thead>
        <tbody>
          {traits.map((tr, rowIdx) => {
            const norm = percentiles[tr.domain];
            const tier: FiveTier = norm
              ? getZTier(norm.zScore)
              : (tr.level as FiveTier);
            const tc = TIER_COLORS[tier];
            const isOcean = OCEAN_DOMAINS.includes(tr.domain);

            const zDisplay = norm
              ? `${norm.zScore >= 0 ? "+" : ""}${norm.zScore.toFixed(2)}`
              : null;

            const pct = norm ? Math.round(norm.percentile) : null;

            // z-score tooltip
            const zTip = norm
              ? lang === "vi"
                ? `Z-score ${zDisplay}: điểm của bạn cách trung bình nhóm ${Math.abs(norm.zScore).toFixed(2)} độ lệch chuẩn về phía ${norm.zScore >= 0 ? "cao hơn" : "thấp hơn"}. μ=${norm.mean.toFixed(2)}, σ=${norm.sd.toFixed(2)}.`
                : `Z-score ${zDisplay}: your score is ${Math.abs(norm.zScore).toFixed(2)} SD ${norm.zScore >= 0 ? "above" : "below"} the group mean. μ=${norm.mean.toFixed(2)}, σ=${norm.sd.toFixed(2)}.`
              : "";

            // percentile tooltip
            const pctTip = norm
              ? lang === "vi"
                ? `Percentile ${pct}: bạn đạt điểm cao hơn ${pct}% người trong nhóm tham chiếu (${lang === "vi" ? norm.referenceGroupLabelVi : norm.referenceGroupLabel}).`
                : `Percentile ${pct}: you scored higher than ${pct}% of people in the reference group (${norm.referenceGroupLabel}).`
              : "";

            // z highlight color
            const zHighlight =
              tier === "very_high"
                ? "bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-200"
                : tier === "high"
                  ? "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200"
                  : tier === "moderate"
                    ? "bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-200"
                    : tier === "low"
                      ? "bg-stone-100 text-stone-700 dark:bg-stone-900/50 dark:text-stone-200"
                      : "bg-slate-100 text-slate-700 dark:bg-slate-900/50 dark:text-slate-200";

            // percentile highlight color
            const pctHighlight =
              (pct ?? 0) >= 75
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200"
                : (pct ?? 0) >= 50
                  ? "bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-200"
                  : (pct ?? 0) >= 25
                    ? "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200"
                    : "bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-200";

            const zebra = rowIdx % 2 === 1 ? "bg-background-secondary/25" : "";

            return (
              <tr
                key={tr.domain}
                className={`border-b border-border/50 last:border-0 transition-colors hover:bg-background-secondary/40 ${zebra}`}
              >
                <td className="px-4 py-3 font-semibold text-foreground text-sm">
                  {getDomainLabel(tr.domain, lang)}
                </td>
                <td className="px-3 py-3 text-center hidden sm:table-cell">
                  <span className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    isOcean
                      ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-300"
                      : "bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-300"
                  }`}>
                    {isOcean ? "OCEAN" : "DT"}
                  </span>
                </td>
                <td className="px-3 py-3 text-center font-mono font-semibold text-foreground tabular-nums">
                  {tr.score.toFixed(2)}
                </td>

                {/* Z-score */}
                {norm ? (
                  <TooltipCell tooltip={zTip} highlight={zHighlight}>
                    {zDisplay}
                  </TooltipCell>
                ) : (
                  <td className="px-3 py-3 text-center text-muted">&mdash;</td>
                )}

                <td className="px-3 py-3 text-center">
                  <span
                    className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold ${tc.badge}`}
                  >
                    {tc.emoji} {getTierLabel(tier, lang)}
                  </span>
                </td>

                {/* Percentile */}
                {norm ? (
                  <TooltipCell tooltip={pctTip} highlight={pctHighlight}>
                    P{pct}
                  </TooltipCell>
                ) : (
                  <td className="px-3 py-3 text-center text-muted">&mdash;</td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
