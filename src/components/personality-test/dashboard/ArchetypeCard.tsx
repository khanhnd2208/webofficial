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
      className={`relative rounded-2xl bg-linear-to-br ${gradient} p-6 sm:p-8 text-white shadow-xl overflow-hidden`}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Subtle decorative circle */}
      <div className="absolute -top-16 -right-16 w-48 h-48 bg-white/5 rounded-full" />
      <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-white/5 rounded-full" />

      {/* Header */}
      <div className="relative flex items-center gap-4 mb-5">
        <span className="text-5xl">{archetype.icon}</span>
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            {lang === "vi" && archetype.nameVi ? archetype.nameVi : archetype.name}
          </h2>
          <p className="text-sm opacity-85 font-medium">
            {lang === "vi" && archetype.taglineVi ? archetype.taglineVi : archetype.tagline}
          </p>
        </div>
      </div>

      {/* Narrative */}
      <p className="relative text-sm sm:text-base leading-relaxed opacity-90 mb-6">
        {lang === "vi" && archetype.narrativeVi ? archetype.narrativeVi : archetype.narrative}
      </p>

      {/* Strengths + Blind spots grid */}
      <div className="relative grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-xl bg-white/15 backdrop-blur-sm p-4 sm:p-5">
          <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
            <span className="text-emerald-200">✓</span> {t.strengths}
          </h3>
          <ul className="space-y-2">
            {(lang === "vi" && archetype.strengthsVi ? archetype.strengthsVi : archetype.strengths).map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm leading-snug">
                <span className="mt-0.5 text-emerald-200 shrink-0">•</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl bg-white/15 backdrop-blur-sm p-4 sm:p-5">
          <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
            <span className="text-amber-200">⚡</span> {t.blindSpots}
          </h3>
          <ul className="space-y-2">
            {(lang === "vi" && archetype.blindspotsVi ? archetype.blindspotsVi : archetype.blindspots).map((b, i) => (
              <li key={i} className="flex items-start gap-2 text-sm leading-snug">
                <span className="mt-0.5 text-amber-200 shrink-0">•</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Disclaimer */}
      <p className="relative mt-5 text-[11px] opacity-55 leading-relaxed italic">
        {t.archetypeDisclaimer}
      </p>
    </motion.div>
  );
}
