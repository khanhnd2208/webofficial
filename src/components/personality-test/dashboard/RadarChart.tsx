"use client";

import { motion } from "framer-motion";
import type { TraitScore } from "@/types/personalityTest";
import { type Lang, getDomainLabel } from "../i18n";

/* ════════════════════════════════════════════════════════════════════════
   RadarChart v4 — World-class spider chart

   - Soft concentric fills for visual depth (like Tableau/PowerBI)
   - Solid grid lines (no dashes) with subtle alternating ring bg
   - Score values displayed boldly near each data point
   - Full domain labels with smart text-anchor based on angle
   - Radial gradient fill on data polygon
   ════════════════════════════════════════════════════════════════════════ */

function polar(cx: number, cy: number, angle: number, r: number) {
  return {
    x: cx + r * Math.cos(angle - Math.PI / 2),
    y: cy + r * Math.sin(angle - Math.PI / 2),
  };
}

function ringPoly(cx: number, cy: number, r: number, n: number, step: number) {
  return Array.from({ length: n }, (_, j) => {
    const { x, y } = polar(cx, cy, j * step, r);
    return `${x},${y}`;
  }).join(" ");
}

export function RadarChart({
  traits,
  lang,
}: {
  traits: TraitScore[];
  lang: Lang;
}) {
  const size = 420;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size / 2 - 60;
  const levels = 5;
  const n = traits.length;
  const step = (2 * Math.PI) / n;

  const rings = Array.from({ length: levels }, (_, i) => ({
    r: (maxR / levels) * (i + 1),
    level: i + 1,
  }));

  const dataPoints = traits.map((t, i) => {
    const val = (t.score / 5) * maxR;
    return { ...polar(cx, cy, i * step, val), score: t.score };
  });
  const dataPath = dataPoints.map((p) => `${p.x},${p.y}`).join(" ");

  const uid = "rc";

  return (
    <div className="flex flex-col items-center">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="w-full max-w-xs sm:max-w-sm"
        role="img"
        aria-label="OCEAN personality radar chart"
      >
        <defs>
          <radialGradient id={`${uid}-fill`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgb(99,102,241)" stopOpacity="0.32" />
            <stop offset="100%" stopColor="rgb(139,92,246)" stopOpacity="0.06" />
          </radialGradient>
          <filter id={`${uid}-glow`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Alternating ring bg for depth */}
        {rings.map(({ r, level }, idx) => {
          if (level % 2 === 0) {
            const inner = idx > 0 ? rings[idx - 1].r : 0;
            return (
              <g key={`bg-${level}`}>
                <polygon points={ringPoly(cx, cy, r, n, step)} fill="currentColor" fillOpacity={0.025} />
                {inner > 0 && (
                  <polygon points={ringPoly(cx, cy, inner, n, step)} fill="var(--surface, white)" />
                )}
              </g>
            );
          }
          return null;
        })}

        {/* Grid rings — solid */}
        {rings.map(({ r, level }) => (
          <polygon
            key={`grid-${level}`}
            points={ringPoly(cx, cy, r, n, step)}
            fill="none"
            stroke="currentColor"
            strokeOpacity={level === levels ? 0.18 : 0.07}
            strokeWidth={level === levels ? 1.2 : 0.6}
          />
        ))}

        {/* Axis spokes */}
        {traits.map((_, i) => {
          const { x, y } = polar(cx, cy, i * step, maxR);
          return (
            <line
              key={`ax-${i}`}
              x1={cx} y1={cy} x2={x} y2={y}
              stroke="currentColor" strokeOpacity={0.06} strokeWidth={0.6}
            />
          );
        })}

        {/* Tick labels 1–5 along top spoke */}
        {rings.map(({ r, level }) => {
          const p = polar(cx, cy, 0, r);
          return (
            <text
              key={`t-${level}`}
              x={p.x + 5}
              y={p.y + 1}
              fill="currentColor" fillOpacity={0.22}
              fontSize={8} fontWeight={600}
              textAnchor="start" dominantBaseline="middle"
            >{level}</text>
          );
        })}

        {/* Data area */}
        <motion.polygon
          points={dataPath}
          fill={`url(#${uid}-fill)`}
          stroke="rgb(99,102,241)"
          strokeWidth={2.2}
          strokeLinejoin="round"
          initial={{ opacity: 0, scale: 0.35 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{ transformOrigin: `${cx}px ${cy}px` }}
        />

        {/* Dots + scores + labels */}
        {traits.map((t, i) => {
          const dp = dataPoints[i];
          const lp = polar(cx, cy, i * step, maxR + 26);
          const label = getDomainLabel(t.domain, lang);
          const angle = i * step - Math.PI / 2;
          const cos = Math.cos(angle);
          const anchor = Math.abs(cos) < 0.15 ? "middle" : cos > 0 ? "start" : "end";

          return (
            <g key={t.domain}>
              <motion.circle
                cx={dp.x} cy={dp.y} r={4.5}
                fill="rgb(99,102,241)" stroke="white" strokeWidth={2}
                filter={`url(#${uid}-glow)`}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3 + i * 0.06, duration: 0.25 }}
              />
              {/* Score near dot */}
              <motion.text
                x={dp.x} y={dp.y - 10}
                textAnchor="middle" dominantBaseline="auto"
                fill="rgb(99,102,241)" fillOpacity={0.9}
                fontSize={10} fontWeight={800}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 + i * 0.06 }}
              >{t.score.toFixed(1)}</motion.text>
              {/* Domain label — full, no truncation */}
              <text
                x={lp.x} y={lp.y}
                textAnchor={anchor} dominantBaseline="middle"
                fill="currentColor" fillOpacity={0.65}
                fontSize={10.5} fontWeight={600}
              >{label}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
