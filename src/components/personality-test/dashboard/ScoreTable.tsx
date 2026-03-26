"use client";

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
            return (
              <tr
                key={tr.domain}
                className="border-b border-border last:border-0"
              >
                <td className="px-4 py-2.5 font-medium text-foreground">
                  {getDomainLabel(tr.domain, lang)}
                </td>
                <td className="px-3 py-2.5 text-center text-xs text-muted">
                  {isOcean ? "OCEAN" : "DT"}
                </td>
                <td className="px-3 py-2.5 text-center font-mono">
                  {tr.score.toFixed(2)}
                </td>
                <td className="px-3 py-2.5 text-center font-mono">
                  {norm
                    ? `${norm.zScore >= 0 ? "+" : ""}${norm.zScore.toFixed(2)}`
                    : "\u2014"}
                </td>
                <td className="px-3 py-2.5 text-center">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${tc.badge}`}
                  >
                    {tc.emoji} {getTierLabel(tier, lang)}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-center font-mono">
                  {norm ? `P${Math.round(norm.percentile)}` : "\u2014"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
