"use client";

import { motion } from "framer-motion";
import type { ArchetypeProfile } from "@/types/personalityTest";
import { type Lang, getStrings } from "../i18n";

export function ArchetypeCard({
  archetype,
  lang,
}: {
  archetype: ArchetypeProfile;
  lang: Lang;
}) {
  const t = getStrings(lang);

  const gradients: Record<string, string> = {
    amber: "from-amber-600 via-orange-500 to-amber-700",
    indigo: "from-indigo-600 via-blue-500 to-indigo-700",
    rose: "from-rose-600 via-pink-500 to-rose-700",
    teal: "from-teal-600 via-cyan-500 to-teal-700",
    purple: "from-violet-600 via-purple-500 to-indigo-700",
    emerald: "from-emerald-600 via-teal-500 to-emerald-700",
  };

  const gradient = gradients[archetype.colorTheme] || gradients.indigo;

  return (
    <motion.div
      className={`relative rounded-xl bg-linear-to-br ${gradient} p-6 sm:p-8 text-white shadow-xl overflow-hidden`}
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.45 }}
    >
      {/* Subtle decorative circles */}
      <div className="absolute -top-16 -right-16 w-48 h-48 bg-white/5 rounded-full" />
      <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-white/5 rounded-full" />

      {/* Header */}
      <div className="relative flex items-center gap-4 mb-5">
        <span className="text-4xl sm:text-5xl" aria-hidden="true">{archetype.icon}</span>
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight leading-tight">
            {lang === "vi" && archetype.nameVi ? archetype.nameVi : archetype.name}
          </h2>
          <p className="text-sm opacity-80 font-medium mt-0.5">
            {lang === "vi" && archetype.taglineVi ? archetype.taglineVi : archetype.tagline}
          </p>
        </div>
      </div>

      {/* Narrative */}
      <p className="relative text-sm sm:text-base leading-relaxed opacity-90 mb-6">
        {lang === "vi" && archetype.narrativeVi ? archetype.narrativeVi : archetype.narrative}
      </p>

      {/* Strengths + Blind spots grid */}
      <div className="relative grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div className="rounded-lg bg-white/12 backdrop-blur-sm p-4 sm:p-5">
          <h3 className="font-bold text-sm mb-2.5 flex items-center gap-2">
            <svg className="h-4 w-4 text-emerald-200" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
            </svg>
            {t.strengths}
          </h3>
          <ul className="space-y-1.5">
            {(lang === "vi" && archetype.strengthsVi ? archetype.strengthsVi : archetype.strengths).map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm leading-snug">
                <span className="mt-1.5 h-1 w-1 rounded-full bg-emerald-200 shrink-0" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg bg-white/12 backdrop-blur-sm p-4 sm:p-5">
          <h3 className="font-bold text-sm mb-2.5 flex items-center gap-2">
            <svg className="h-4 w-4 text-amber-200" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            {t.blindSpots}
          </h3>
          <ul className="space-y-1.5">
            {(lang === "vi" && archetype.blindspotsVi ? archetype.blindspotsVi : archetype.blindspots).map((b, i) => (
              <li key={i} className="flex items-start gap-2 text-sm leading-snug">
                <span className="mt-1.5 h-1 w-1 rounded-full bg-amber-200 shrink-0" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Disclaimer */}
      <p className="relative mt-5 text-[11px] opacity-50 leading-relaxed italic">
        {t.archetypeDisclaimer}
      </p>
    </motion.div>
  );
}
