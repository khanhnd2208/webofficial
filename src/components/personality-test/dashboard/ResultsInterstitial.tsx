"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  type Lang,
  type FiveTier,
  getStrings,
  getTierLabel,
} from "../i18n";
import { TIER_COLORS } from "./types";

export function ResultsInterstitial({
  lang,
  onConfirm,
}: {
  lang: Lang;
  onConfirm: () => void;
}) {
  const [confirmed, setConfirmed] = useState(false);
  const t = getStrings(lang);

  return (
    <motion.div
      className="mx-auto max-w-2xl space-y-8 px-4 py-12"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          {t.beforeYouSeeResults}
        </h1>
        <p className="text-muted">{t.beforeSubtitle}</p>
      </div>

      {/* How to read */}
      <div className="rounded-2xl border border-border bg-surface p-6 space-y-4">
        <h2 className="text-lg font-semibold text-foreground">
          {t.howToReadTitle}
        </h2>

        {/* Tier system explanation */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-2">
            {t.tierSystemTitle}
          </h3>
          <div className="grid gap-2">
            {(
              [
                "very_high",
                "high",
                "moderate",
                "low",
                "very_low",
              ] as FiveTier[]
            ).map((tier) => {
              const tc = TIER_COLORS[tier];
              return (
                <div
                  key={tier}
                  className="flex items-center gap-2 text-sm"
                >
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${tc.badge}`}
                  >
                    {tc.emoji} {getTierLabel(tier, lang)}
                  </span>
                  <span className="text-muted">
                    Z {tier === "very_high" ? ">= +1.5" : tier === "high" ? "+0.5 to +1.5" : tier === "moderate" ? "-0.5 to +0.5" : tier === "low" ? "-1.5 to -0.5" : "<= -1.5"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 p-4">
          <h3 className="text-sm font-semibold text-sky-700 dark:text-sky-300 mb-1">
            {t.quickReminder}
          </h3>
          <p className="text-xs text-sky-600 dark:text-sky-400">
            {t.quickReminderText}
          </p>
        </div>
      </div>

      {/* Limitations */}
      <div className="rounded-2xl border border-border bg-surface p-6 space-y-4">
        <h2 className="text-lg font-semibold text-foreground">
          {t.limitationsGateTitle}
        </h2>

        <div className="space-y-3">
          <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4">
            <h3 className="text-sm font-semibold text-amber-700 dark:text-amber-300 mb-1">
              {t.darkTriadWarning}
            </h3>
            <p className="text-xs text-amber-600 dark:text-amber-400 leading-relaxed">
              {t.darkTriadWarningText}
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {[
              { title: t.limitSelfReport, text: t.limitSelfReportText },
              { title: t.limitNotClinical, text: t.limitNotClinicalText },
              { title: t.limitChange, text: t.limitChangeText },
              { title: t.limitContext, text: t.limitContextText },
            ].map((lim, i) => (
              <div
                key={i}
                className="rounded-lg bg-background-secondary p-3 border border-border"
              >
                <h4 className="text-xs font-semibold text-foreground mb-1">
                  {lim.title}
                </h4>
                <p className="text-xs text-muted leading-relaxed">
                  {lim.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Confirmation */}
      <div className="rounded-2xl border border-border bg-surface p-6 space-y-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-1 h-5 w-5 rounded border-border text-accent focus:ring-accent"
          />
          <span className="text-sm text-foreground leading-relaxed">
            {t.confirmLabel}
          </span>
        </label>

        <button
          onClick={onConfirm}
          disabled={!confirmed}
          className={`w-full rounded-full py-3 font-semibold text-white shadow transition ${
            confirmed
              ? "bg-accent hover:bg-accent/90 cursor-pointer"
              : "bg-gray-300 dark:bg-gray-700 cursor-not-allowed"
          }`}
        >
          {confirmed ? t.viewResults : t.pleaseConfirm}
        </button>
      </div>
    </motion.div>
  );
}
