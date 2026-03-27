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
          className={`inline-flex cursor-pointer items-center gap-1 rounded-lg px-2 py-0.5 font-mono text-sm font-bold transition-all hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 ${highlight}`}
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
              className="absolute bottom-full left-1/2 z-50 mb-2 w-64 -translate-x-1/2 rounded-xl border border-border bg-surface p-3 shadow-xl shadow-black/10 text-left"
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
    <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-background-secondary">
            <th className="px-4 py-3 text-left font-semibold text-foreground">
              {t.thTrait}
            </th>
            <th className="px-3 py-3 text-center font-semibold text-foreground">
              {t.thType}
            </th>
            <th className="px-3 py-3 text-center font-semibold text-foreground">
              {t.thScore}
            </th>
            <th className="px-3 py-3 text-center font-semibold text-foreground">
              {t.thZ}
            </th>
            <th className="px-3 py-3 text-center font-semibold text-foreground">
              {t.thLevel}
            </th>
            <th className="px-3 py-3 text-center font-semibold text-foreground">
              {t.thPercentile}
            </th>
          </tr>
        </thead>
        <tbody>
          {traits.map((tr) => {
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
                ? "bg-teal-100 text-teal-800 dark:bg-teal-950/50 dark:text-teal-200"
                : (pct ?? 0) >= 50
                  ? "bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-200"
                  : (pct ?? 0) >= 25
                    ? "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200"
                    : "bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-200";

            return (
              <tr
                key={tr.domain}
                className="border-b border-border last:border-0 hover:bg-background-secondary/40 transition-colors"
              >
                <td className="px-4 py-2.5 font-medium text-foreground">
                  {getDomainLabel(tr.domain, lang)}
                </td>
                <td className="px-3 py-2.5 text-center text-xs text-muted">
                  {isOcean ? "OCEAN" : "DT"}
                </td>
                <td className="px-3 py-2.5 text-center font-mono text-foreground">
                  {tr.score.toFixed(2)}
                </td>

                {/* Z-score — highlighted + tooltip */}
                {norm ? (
                  <TooltipCell tooltip={zTip} highlight={zHighlight}>
                    {zDisplay}
                  </TooltipCell>
                ) : (
                  <td className="px-3 py-2.5 text-center text-muted">&mdash;</td>
                )}

                <td className="px-3 py-2.5 text-center">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${tc.badge}`}
                  >
                    {tc.emoji} {getTierLabel(tier, lang)}
                  </span>
                </td>

                {/* Percentile — highlighted + tooltip */}
                {norm ? (
                  <TooltipCell tooltip={pctTip} highlight={pctHighlight}>
                    P{pct}
                  </TooltipCell>
                ) : (
                  <td className="px-3 py-2.5 text-center text-muted">&mdash;</td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
