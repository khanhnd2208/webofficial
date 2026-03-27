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
    amber: "from-amber-700 to-orange-600",
    indigo: "from-indigo-700 to-blue-600",
    rose: "from-rose-700 to-rose-600",
    teal: "from-teal-700 to-cyan-600",
    purple: "from-violet-700 to-indigo-600",
    emerald: "from-teal-700 to-emerald-600",
  };

  const gradient = gradients[archetype.colorTheme] || gradients.indigo;

  return (
    <motion.div
      className={`rounded-2xl bg-linear-to-br ${gradient} p-6 text-white shadow-xl`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center gap-3 mb-4">
        <span className="text-4xl">{archetype.icon}</span>
        <div>
          <h2 className="text-xl font-bold">
            {lang === 'vi' && archetype.nameVi ? archetype.nameVi : archetype.name}
          </h2>
          <p className="text-sm opacity-90">
            {lang === 'vi' && archetype.taglineVi ? archetype.taglineVi : archetype.tagline}
          </p>
        </div>
      </div>

      <p className="text-sm leading-relaxed opacity-90 mb-5">
        {lang === 'vi' && archetype.narrativeVi ? archetype.narrativeVi : archetype.narrative}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Strengths */}
        <div className="rounded-xl bg-white/20 backdrop-blur-sm p-4">
          <h3 className="font-semibold mb-2">{t.strengths}</h3>
          <ul className="space-y-1">
            {(lang === 'vi' && archetype.strengthsVi ? archetype.strengthsVi : archetype.strengths).map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="mt-0.5 text-emerald-200">&#10003;</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Blind spots */}
        <div className="rounded-xl bg-white/20 backdrop-blur-sm p-4">
          <h3 className="font-semibold mb-2">{t.blindSpots}</h3>
          <ul className="space-y-1">
            {(lang === 'vi' && archetype.blindspotsVi ? archetype.blindspotsVi : archetype.blindspots).map((b, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="mt-0.5 text-amber-200">&#9888;</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="mt-4 text-xs opacity-70 italic">
        {t.archetypeDisclaimer}
      </p>
    </motion.div>
  );
}
