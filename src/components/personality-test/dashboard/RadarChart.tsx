"use client";

import { motion } from "framer-motion";
import type { TraitScore } from "@/types/personalityTest";
import { type Lang, getDomainLabel } from "../i18n";

/* ════════════════════════════════════════════════════════════════════════
   RadarChart v5 — Labels fully visible, no clipping

   Key fixes over v4:
   - Wider viewBox (560×480) with generous horizontal padding for labels
   - Separate label layout: long labels split into two tspan lines
   - Label position pushed further out (maxR + 32) with per-angle offsets
   - Short label threshold — single line if ≤ 18 chars
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

/** Split a long label string into at most two lines for SVG tspan rendering */
function splitLabel(label: string): [string, string | null] {
  if (label.length <= 18) return [label, null];
  // Try to split at a space or parenthesis near the middle
  const mid = Math.floor(label.length / 2);
  let splitAt = -1;
  for (let d = 0; d <= 12; d++) {
    if (label[mid - d] === " " || label[mid - d] === "(") { splitAt = mid - d; break; }
    if (label[mid + d] === " " || label[mid + d] === "(") { splitAt = mid + d; break; }
  }
  if (splitAt <= 0) return [label.slice(0, mid + 1) + "-", label.slice(mid + 1)];
  const ch = label[splitAt];
  // Keep the paren on the second line
  if (ch === "(") return [label.slice(0, splitAt).trim(), label.slice(splitAt).trim()];
  return [label.slice(0, splitAt).trim(), label.slice(splitAt + 1).trim()];
}

export function RadarChart({
  traits,
  lang,
}: {
  traits: TraitScore[];
  lang: Lang;
}) {
  // Wider viewBox so horizontal labels never clip
  const W = 560;
  const H = 460;
  const cx = W / 2;
  const cy = H / 2;
  // Smaller chart radius relative to the wider canvas = more room for labels
  const maxR = 148;
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
        viewBox={`0 0 ${W} ${H}`}
        className="w-full max-w-sm sm:max-w-md"
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

        {/* Alternating ring backgrounds for depth */}
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

        {/* Grid rings */}
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
          // Push label further out than before — 32px past the outer ring
          const labelR = maxR + 32;
          const lp = polar(cx, cy, i * step, labelR);
          const label = getDomainLabel(t.domain, lang);
          const angle = i * step - Math.PI / 2;
          const cos = Math.cos(angle);
          const sin = Math.sin(angle);

          // text-anchor based on horizontal position
          const anchor = Math.abs(cos) < 0.15 ? "middle" : cos > 0 ? "start" : "end";

          // Split long labels across two tspan lines
          const [line1, line2] = splitLabel(label);
          // Vertical nudge: push top label up, bottom down for two-liners
          const hasTwo = line2 !== null;
          const yOff1 = hasTwo ? -7 : 0;
          const yOff2 = 8;

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
                x={dp.x + (cos > 0.15 ? 10 : cos < -0.15 ? -10 : 0)}
                y={dp.y + (sin > 0.15 ? 12 : -10)}
                textAnchor={anchor} dominantBaseline="auto"
                fill="rgb(99,102,241)" fillOpacity={0.9}
                fontSize={10} fontWeight={800}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 + i * 0.06 }}
              >{t.score.toFixed(1)}</motion.text>
              {/* Domain label — split into tspans if long */}
              <text
                x={lp.x}
                y={lp.y}
                textAnchor={anchor}
                dominantBaseline="middle"
                fill="currentColor" fillOpacity={0.7}
                fontSize={11} fontWeight={600}
              >
                <tspan x={lp.x} dy={yOff1}>{line1}</tspan>
                {hasTwo && <tspan x={lp.x} dy={yOff2}>{line2}</tspan>}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
