"use client";

import { motion } from "framer-motion";
import type { TraitScore, PersonalityDomain } from "@/types/personalityTest";
import { type Lang, getDomainLabel } from "../i18n";

export function RadarChart({
  traits,
  lang,
}: {
  traits: TraitScore[];
  lang: Lang;
}) {
  const size = 300;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size / 2 - 40;
  const levels = 5;
  const n = traits.length;

  function polarToXY(angle: number, r: number) {
    return {
      x: cx + r * Math.cos(angle - Math.PI / 2),
      y: cy + r * Math.sin(angle - Math.PI / 2),
    };
  }

  const angleStep = (2 * Math.PI) / n;

  const gridLines = Array.from({ length: levels }, (_, i) => {
    const r = (maxR / levels) * (i + 1);
    const pts = Array.from({ length: n }, (_, j) => {
      const { x, y } = polarToXY(j * angleStep, r);
      return `${x},${y}`;
    }).join(" ");
    return pts;
  });

  const dataPoints = traits.map((t, i) => {
    const val = (t.score / 5) * maxR;
    return polarToXY(i * angleStep, val);
  });
  const dataPath = dataPoints.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <div className="flex justify-center">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="w-full max-w-75"
      >
        {/* Grid */}
        {gridLines.map((pts, i) => (
          <polygon
            key={i}
            points={pts}
            fill="none"
            stroke="currentColor"
            strokeOpacity={0.15}
            strokeWidth={1}
          />
        ))}

        {/* Axes */}
        {traits.map((_, i) => {
          const { x, y } = polarToXY(i * angleStep, maxR);
          return (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={x}
              y2={y}
              stroke="currentColor"
              strokeOpacity={0.1}
              strokeWidth={1}
            />
          );
        })}

        {/* Data polygon */}
        <motion.polygon
          points={dataPath}
          fill="rgba(99, 102, 241, 0.2)"
          stroke="rgb(99, 102, 241)"
          strokeWidth={2}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{ transformOrigin: `${cx}px ${cy}px` }}
        />

        {/* Data dots + labels */}
        {traits.map((t, i) => {
          const val = (t.score / 5) * maxR;
          const { x, y } = polarToXY(i * angleStep, val);
          const labelR = maxR + 20;
          const lp = polarToXY(i * angleStep, labelR);
          const label = getDomainLabel(t.domain, lang);
          const shortLabel =
            label.length > 12 ? label.substring(0, 10) + ".." : label;
          return (
            <g key={t.domain}>
              <motion.circle
                cx={x}
                cy={y}
                r={4}
                fill="rgb(99, 102, 241)"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3 + i * 0.1 }}
              />
              <text
                x={lp.x}
                y={lp.y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-current text-[9px] text-muted"
              >
                {shortLabel}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
