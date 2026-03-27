"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { type Lang, getStrings } from "../i18n";

export function LimitationsSection({ lang }: { lang: Lang }) {
  const [open, setOpen] = useState(false);
  const t = getStrings(lang);

  const limits = [
    { title: t.limitSelfReport, text: t.limitSelfReportText, icon: "\u{1F4DD}" },
    { title: t.limitNotClinical, text: t.limitNotClinicalText, icon: "\u{1FA7A}" },
    { title: t.limitCulture, text: t.limitCultureText, icon: "\u{1F30F}" },
    { title: t.limitChange, text: t.limitChangeText, icon: "\u{1F331}" },
    { title: t.limitContext, text: t.limitContextText, icon: "\u{1F3AF}" },
    { title: t.limitEffect, text: t.limitEffectText, icon: "\u{1F4CA}" },
  ];

  const references = [
    "Barrick, M. R., & Mount, M. K. (1991). The Big Five personality dimensions and job performance. Personnel Psychology, 44(1), 1-26.",
    "Soto, C. J., & John, O. P. (2017). The next Big Five Inventory (BFI-2). Journal of Personality and Social Psychology, 113(1), 117-143.",
    "Jones, D. N., & Paulhus, D. L. (2014). Introducing the Short Dark Triad (SD3). Assessment, 21(1), 28-41.",
    "Judge, T. A., et al. (2002). Personality and leadership: A qualitative and quantitative review. Journal of Applied Psychology, 87(4), 765-780.",
    "Roberts, B. W., et al. (2006). Patterns of mean-level change in personality traits across the life course. Psychological Bulletin, 132(1), 1-25.",
    "Grijalva, E., et al. (2015). Narcissism and leadership: A meta-analytic review. Personnel Psychology, 68(1), 1-47.",
    "Paulhus, D. L., & Williams, K. M. (2002). The Dark Triad of personality. Journal of Research in Personality, 36(6), 556-563.",
  ];

  return (
    <div className="rounded-2xl border border-border bg-surface overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-5 sm:px-7 py-5 text-left hover:bg-background-secondary/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">📚</span>
          <h2 className="text-base sm:text-lg font-extrabold text-foreground tracking-tight">
            {t.limitationsTitle}
          </h2>
        </div>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          className="text-muted text-sm"
        >
          ▼
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-5 sm:px-7 pb-6">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mb-6">
                {limits.map((lim, i) => (
                  <div
                    key={i}
                    className="rounded-xl bg-background-secondary/50 p-4 border border-border/50"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-base">{lim.icon}</span>
                      <h3 className="text-xs font-bold text-foreground">
                        {lim.title}
                      </h3>
                    </div>
                    <p className="text-[11px] text-muted leading-relaxed">
                      {lim.text}
                    </p>
                  </div>
                ))}
              </div>

              {/* References */}
              <div className="border-t border-border/50 pt-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted mb-3">
                  {t.referencesTitle}
                </h3>
                <ul className="space-y-1.5">
                  {references.map((ref, i) => (
                    <li
                      key={i}
                      className="text-[11px] text-muted/80 leading-relaxed pl-4 relative before:absolute before:left-0 before:top-2 before:h-1 before:w-1 before:rounded-full before:bg-accent/60"
                    >
                      {ref}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
