"use client";

import { motion } from "framer-motion";
import type { TraitScore } from "@/types/personalityTest";
import { type Lang, getDomainLabel } from "../i18n";

/* ════════════════════════════════════════════════════════════════════════
   RadarChart v2 — Professional SVG spider chart with gradient fill,
   level labels, score values, and glow dots.
   ════════════════════════════════════════════════════════════════════════ */

export function RadarChart({
  traits,
  lang,
}: {
  traits: TraitScore[];
  lang: Lang;
}) {
  const size = 400;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size / 2 - 55;
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
    return { pts, r, level: i + 1 };
  });

  const dataPoints = traits.map((t, i) => {
    const val = (t.score / 5) * maxR;
    return polarToXY(i * angleStep, val);
  });
  const dataPath = dataPoints.map((p) => `${p.x},${p.y}`).join(" ");

  const gradientId = "radar-fill-grad";
  const glowId = "radar-dot-glow";

  return (
    <div className="flex flex-col items-center">
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-sm">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgb(99, 102, 241)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="rgb(139, 92, 246)" stopOpacity="0.10" />
          </linearGradient>
          <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Grid polygons */}
        {gridLines.map(({ pts, level }) => (
          <polygon
            key={level}
            points={pts}
            fill="none"
            stroke="currentColor"
            strokeOpacity={level === levels ? 0.18 : 0.07}
            strokeWidth={level === levels ? 1.5 : 0.75}
            strokeDasharray={level === levels ? "none" : "3 3"}
          />
        ))}

        {/* Level tick labels along first axis */}
        {gridLines.map(({ r, level }) => {
          const { x, y } = polarToXY(0, r);
          return (
            <text
              key={`tick-${level}`}
              x={x + 8}
              y={y - 4}
              className="fill-current text-[9px] opacity-25"
              textAnchor="start"
            >
              {level}
            </text>
          );
        })}

        {/* Axis lines */}
        {traits.map((_, i) => {
          const { x, y } = polarToXY(i * angleStep, maxR);
          return (
            <line
              key={`axis-${i}`}
              x1={cx}
              y1={cy}
              x2={x}
              y2={y}
              stroke="currentColor"
              strokeOpacity={0.07}
              strokeWidth={0.75}
            />
          );
        })}

        {/* Data polygon */}
        <motion.polygon
          points={dataPath}
          fill={`url(#${gradientId})`}
          stroke="rgb(99, 102, 241)"
          strokeWidth={2.5}
          strokeLinejoin="round"
          initial={{ opacity: 0, scale: 0.3 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          style={{ transformOrigin: `${cx}px ${cy}px` }}
        />

        {/* Data dots + labels */}
        {traits.map((t, i) => {
          const val = (t.score / 5) * maxR;
          const { x, y } = polarToXY(i * angleStep, val);
          const labelR = maxR + 34;
          const lp = polarToXY(i * angleStep, labelR);
          const label = getDomainLabel(t.domain, lang);
          const shortLabel =
            label.length > 14 ? label.substring(0, 12) + "…" : label;

          return (
            <g key={t.domain}>
              <motion.circle
                cx={x}
                cy={y}
                r={5}
                fill="rgb(99, 102, 241)"
                stroke="white"
                strokeWidth={2}
                filter={`url(#${glowId})`}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.4 + i * 0.08, duration: 0.3 }}
              />
              {/* Score near dot */}
              <motion.text
                x={x}
                y={y - 12}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-current text-[10px] font-bold opacity-50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                transition={{ delay: 0.6 + i * 0.08 }}
              >
                {t.score.toFixed(1)}
              </motion.text>
              {/* Domain label */}
              <text
                x={lp.x}
                y={lp.y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-current text-[10px] font-semibold opacity-65"
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
