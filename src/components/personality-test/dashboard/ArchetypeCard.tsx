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
    amber: "from-amber-500 to-orange-500",
    indigo: "from-indigo-500 to-purple-500",
    rose: "from-rose-500 to-pink-500",
    teal: "from-teal-500 to-emerald-500",
    purple: "from-purple-500 to-violet-500",
    emerald: "from-emerald-500 to-green-500",
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
          <h2 className="text-xl font-bold">{archetype.name}</h2>
          <p className="text-sm opacity-90">{archetype.tagline}</p>
        </div>
      </div>

      <p className="text-sm leading-relaxed opacity-90 mb-5">
        {archetype.narrative}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Strengths */}
        <div className="rounded-xl bg-white/15 backdrop-blur-sm p-4">
          <h3 className="font-semibold mb-2">{t.strengths}</h3>
          <ul className="space-y-1">
            {archetype.strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="mt-0.5 text-green-200">&#10003;</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Blind spots */}
        <div className="rounded-xl bg-white/15 backdrop-blur-sm p-4">
          <h3 className="font-semibold mb-2">{t.blindSpots}</h3>
          <ul className="space-y-1">
            {archetype.blindspots.map((b, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="mt-0.5 text-rose-200">&#9888;</span>
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
