"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { type Lang, getStrings } from "../i18n";

/* ── Tiny inline SVG icon for the section header ─────────────────────── */
function BookIcon() {
  return (
    <svg
      className="h-4 w-4 text-muted"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M10.75 16.82A7.462 7.462 0 0115 15.5c.71 0 1.396.098 2.046.282A.75.75 0 0018 15.06V4.94a.75.75 0 00-.546-.722A9.006 9.006 0 0015 4a8.963 8.963 0 00-4.25 1.065v11.757zM9.25 4.75A8.963 8.963 0 005 4c-.85 0-1.673.118-2.454.34A.75.75 0 002 5.06v10.12a.75.75 0 00.954.721A7.506 7.506 0 015 15.5c1.579 0 3.042.487 4.25 1.32V4.75z" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg
      className="h-4 w-4 text-muted"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M5.22 8.22a.75.75 0 011.06 0L10 11.94l3.72-3.72a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.22 9.28a.75.75 0 010-1.06z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function LimitationsSection({ lang }: { lang: Lang }) {
  const [open, setOpen] = useState(false);
  const t = getStrings(lang);

  const limits = [
    { title: t.limitSelfReport, text: t.limitSelfReportText },
    { title: t.limitNotClinical, text: t.limitNotClinicalText },
    { title: t.limitCulture, text: t.limitCultureText },
    { title: t.limitChange, text: t.limitChangeText },
    { title: t.limitContext, text: t.limitContextText },
    { title: t.limitEffect, text: t.limitEffectText },
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
    <div className="rounded-xl border border-border bg-surface overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-5 sm:px-7 py-4 text-left hover:bg-background-secondary/30 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <BookIcon />
          <h2 className="text-sm sm:text-base font-bold text-foreground tracking-tight">
            {t.limitationsTitle}
          </h2>
        </div>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronIcon />
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
                    className="rounded-lg bg-background-secondary/50 p-4 border border-border/40"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-accent/60 shrink-0" />
                      <h3 className="text-xs font-bold text-foreground">
                        {lim.title}
                      </h3>
                    </div>
                    <p className="text-[11px] text-muted leading-relaxed pl-3.5">
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
                <ol className="space-y-1.5 list-none">
                  {references.map((ref, i) => (
                    <li
                      key={i}
                      className="text-[11px] text-muted/80 leading-relaxed pl-5 relative"
                    >
                      <span className="absolute left-0 top-0 text-[10px] font-mono text-muted/50 tabular-nums">
                        [{i + 1}]
                      </span>
                      {ref}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
