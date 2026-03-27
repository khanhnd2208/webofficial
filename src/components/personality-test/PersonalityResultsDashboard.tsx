"use client";

/* ════════════════════════════════════════════════════════════════════════
   PersonalityResultsDashboard v2 — Modular Architecture

   Main orchestrator component. All sub-components are split into
   the ./dashboard/ directory for maintainability.

   Sub-module map:
   dashboard/
   ├── types.ts               Shared types, helpers, constants
   ├── RadarChart.tsx          SVG spider chart
   ├── TraitCard.tsx           Expandable trait card
   ├── PercentileGauge.tsx     Animated percentile bar (shared)
   ├── ArchetypeCard.tsx       Archetype persona display
   ├── CrossTraitInsights.ts   Pure logic — cross-trait insight generator
   ├── LimitationsSection.tsx  Collapsible limitations + references
   ├── ResultsInterstitial.tsx Gate screen (read-before-viewing)
   ├── ScoreTable.tsx          Summary table
   └── index.ts                Barrel export
   ════════════════════════════════════════════════════════════════════════ */

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

import type {
  PersonalityTestSessionDTO,
  TraitScore,
} from "@/types/personalityTest";

import { type Lang, getStrings, getDomainLabel } from "./i18n";

import {
  type NormativeResult,
  type PercentilesApiResponse,
  OCEAN_DOMAINS,
  DARK_TRIAD_DOMAINS,
  RadarChart,
  TraitCard,
  PercentileGauge,
  ArchetypeCard,
  ScoreTable,
  LimitationsSection,
  ResultsInterstitial,
  generateCrossTraitInsights,
} from "./dashboard";

// ─── Small inline components ───────────────────────────────────────────────────

function LangToggle({
  lang,
  setLang,
}: {
  lang: Lang;
  setLang: (l: Lang) => void;
}) {
  const t = getStrings(lang);
  return (
    <button
      onClick={() => setLang(lang === "en" ? "vi" : "en")}
      className="fixed right-4 top-20 z-50 flex items-center gap-1.5 rounded-full bg-surface-elevated border border-border px-4 py-2 text-sm font-semibold text-foreground shadow-lg backdrop-blur-sm transition-all hover:scale-105 hover:shadow-xl active:scale-95"
      aria-label="Toggle language"
    >
      {t.langToggle}
    </button>
  );
}

function InvalidResultCard({ lang }: { lang: Lang }) {
  const t = getStrings(lang);
  return (
    <motion.div
      className="max-w-xl mx-auto rounded-2xl border border-rose-300 dark:border-rose-700 bg-rose-50 dark:bg-rose-900/20 p-8 text-center shadow-lg"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="text-5xl mb-4">&#128542;</div>
      <h2 className="text-xl font-bold text-rose-700 dark:text-rose-300 mb-2">
        {t.invalidTitle}
      </h2>
      <p className="text-muted mb-6">{t.invalidText}</p>
      <Link
        href="/personality-test"
        className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 font-semibold text-white shadow hover:shadow-md transition"
      >
        {t.retakeLink}
      </Link>
    </motion.div>
  );
}

// ── Reusable section heading with icon + decorative bar ────────────────────────

function SectionHeading({
  title,
  subtitle,
  icon,
}: {
  title: string;
  subtitle?: string;
  icon: string;
}) {
  return (
    <div className="flex items-start gap-3 mb-5">
      <span className="text-xl mt-0.5 shrink-0">{icon}</span>
      <div>
        <h2 className="text-lg sm:text-xl font-extrabold text-foreground tracking-tight leading-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm text-muted mt-0.5">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

function RefGroupSelector({
  groups,
  selected,
  onChange,
  label,
  lang,
  referenceGroupDetails,
}: {
  groups: { id: string; label: string; labelVi: string; n: number; isLocal?: boolean }[];
  selected: string;
  onChange: (id: string) => void;
  label: string;
  lang: Lang;
  referenceGroupDetails?: {
    id: string;
    label: string;
    labelVi: string;
    description: string;
    descriptionVi: string;
    source: string;
  };
}) {
  const t = getStrings(lang);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      {/* Section label */}
      <div className="flex items-center gap-2">
        <div className="h-4 w-1 rounded-full bg-accent" />
        <span className="text-sm font-bold text-foreground tracking-tight">{label}</span>
      </div>

      {/* Segmented control track */}
      <div className="flex flex-wrap gap-2 rounded-xl bg-background-secondary/60 p-1.5">
        {groups.map((g) => {
          const isActive = g.id === selected;
          const displayLabel = lang === "vi" ? g.labelVi : g.label;
          const isLocal = g.isLocal === true;
          return (
            <div key={g.id} className="relative">
              <button
                onClick={() => onChange(g.id)}
                onMouseEnter={() => setHoveredId(g.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={`relative flex items-center gap-2 rounded-lg px-3.5 py-2.5 text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? "bg-surface-elevated text-foreground shadow-md ring-1 ring-border"
                    : "text-muted hover:text-foreground hover:bg-surface/60"
                }`}
              >
                {/* Active indicator line */}
                {isActive && (
                  <motion.div
                    layoutId="ref-group-indicator"
                    className={`absolute bottom-0 left-3 right-3 h-0.5 rounded-full ${
                      isLocal ? "bg-emerald-500" : "bg-accent"
                    }`}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="text-sm">{isLocal ? "🏫" : "🌍"}</span>
                <span className="truncate max-w-45">{displayLabel}</span>
                <span className={`ml-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${
                  isActive
                    ? "bg-accent/10 text-accent"
                    : "bg-background-secondary text-muted"
                }`}>
                  n={g.n.toLocaleString()}
                </span>
              </button>

              {/* Tooltip on hover */}
              {hoveredId === g.id && !isActive && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute bottom-full left-1/2 -translate-x-1/2 z-50 mb-2 w-56 rounded-xl border border-border bg-surface-elevated p-3 shadow-xl text-xs"
                >
                  <p className="font-semibold text-foreground mb-1">{displayLabel}</p>
                  <p className="text-muted">
                    n={g.n.toLocaleString()}
                    {isLocal && ` · ${lang === "vi" ? "Cập nhật trực tiếp" : "Live-updated"}`}
                  </p>
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-2 w-2 rotate-45 border-b border-r border-border bg-surface-elevated" />
                </motion.div>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected group detail panel */}
      {referenceGroupDetails && (
        <div className="flex items-start gap-2.5 rounded-lg border border-border/50 bg-surface/50 px-3.5 py-2.5 text-[11px] text-muted">
          <span className="text-base mt-0.5 shrink-0">📋</span>
          <div className="space-y-0.5 min-w-0">
            <p className="leading-relaxed">
              {lang === "vi" ? referenceGroupDetails.descriptionVi : referenceGroupDetails.description}
            </p>
            <p className="opacity-60">
              {t.groupSource}: {referenceGroupDetails.source}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// NORM DISCLAIMER BANNER
// ═══════════════════════════════════════════════════════════════════════════════

function NormDisclaimer({ lang }: { lang: Lang }) {
  const t = getStrings(lang);
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-amber-200/60 dark:border-amber-800/40 bg-amber-50/50 dark:bg-amber-950/15 px-4 py-3">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2.5 text-left group"
      >
        <span className="text-lg shrink-0">ℹ️</span>
        <span className="text-xs font-medium text-amber-700 dark:text-amber-300 leading-relaxed flex-1">
          {t.normDisclaimer}
        </span>
        <span className={`text-amber-500 dark:text-amber-400 transition-transform duration-200 text-[10px] shrink-0 ${expanded ? "rotate-180" : ""}`}>
          ▼
        </span>
      </button>
      {expanded && (
        <motion.p
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-2.5 pl-8 text-[11px] text-amber-600/80 dark:text-amber-300/70 leading-relaxed"
        >
          {t.normDisclaimerDetail}
        </motion.p>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function PersonalityResultsDashboard({
  session,
}: {
  session: PersonalityTestSessionDTO;
}) {
  const [lang, setLang] = useState<Lang>("en");
  const [gatePass, setGatePass] = useState(false);
  const [percentileData, setPercentileData] =
    useState<PercentilesApiResponse | null>(null);
  const [percentileLoading, setPercentileLoading] = useState(false);
  const [oceanGroup, setOceanGroup] = useState("bfi2-internet");
  const [darkTriadGroup, setDarkTriadGroup] = useState("sd3-community");

  const result = session.result;
  const ocean = result?.ocean ?? null;
  const darkTriad = result?.darkTriad ?? null;
  const archetype = result?.archetype ?? null;
  const isValid = result?.isValid ?? false;

  // ── Fetch percentiles ──────────────────────────────────────────────────────

  const fetchPercentiles = useCallback(
    async (oGroup: string, dtGroup: string) => {
      setPercentileLoading(true);
      try {
        const url = `/api/personality-test/${session.id}/percentiles?oceanGroup=${encodeURIComponent(oGroup)}&darkTriadGroup=${encodeURIComponent(dtGroup)}`;
        const res = await fetch(url);
        if (res.ok) {
          const json = await res.json();
          // API wraps in { ok: true, data: {...} } — unwrap the envelope
          const payload: PercentilesApiResponse = json.data ?? json;
          setPercentileData(payload);
          if (payload.selectedGroups) {
            setOceanGroup(payload.selectedGroups.ocean);
            setDarkTriadGroup(payload.selectedGroups.darkTriad);
          }
        }
      } catch {
        // silent fail — percentiles are supplementary
      } finally {
        setPercentileLoading(false);
      }
    },
    [session.id]
  );

  // Fetch percentiles whenever the gate is passed AND we have scores to compare.
  // Note: isValid=false + scores present = attention-check failure. Still fetch.
  const hasScores = ocean !== null || darkTriad !== null;
  useEffect(() => {
    if (gatePass && hasScores) {
      fetchPercentiles(oceanGroup, darkTriadGroup);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gatePass]);

  const handleOceanGroupChange = (id: string) => {
    setOceanGroup(id);
    fetchPercentiles(id, darkTriadGroup);
  };

  const handleDarkTriadGroupChange = (id: string) => {
    setDarkTriadGroup(id);
    fetchPercentiles(oceanGroup, id);
  };

  const t = getStrings(lang);

  // ── Collect all traits ─────────────────────────────────────────────────────

  const allTraits: TraitScore[] = [];
  if (ocean) {
    for (const d of OCEAN_DOMAINS) {
      const ts = ocean[d as keyof typeof ocean];
      if (ts) allTraits.push(ts);
    }
  }
  if (darkTriad) {
    for (const d of DARK_TRIAD_DOMAINS) {
      const ts = darkTriad[d as keyof typeof darkTriad];
      if (ts) allTraits.push(ts);
    }
  }

  const oceanTraits = allTraits.filter((t) =>
    OCEAN_DOMAINS.includes(t.domain)
  );
  const dtTraits = allTraits.filter((t) =>
    DARK_TRIAD_DOMAINS.includes(t.domain)
  );

  const percentiles: Record<string, NormativeResult> =
    percentileData?.percentiles ?? {};
  const availableGroups = percentileData?.availableGroups ?? [];
  const oceanGroups = availableGroups.filter((g) => g.type === "ocean");
  const dtGroups = availableGroups.filter((g) => g.type === "darkTriad");

  // ── Cross-trait insights ───────────────────────────────────────────────────

  const crossInsights = generateCrossTraitInsights(
    ocean as unknown as Record<string, TraitScore> | null,
    darkTriad as unknown as Record<string, TraitScore> | null,
    lang
  );

  // ── Attention warning check ────────────────────────────────────────────────

  const hasComputedScores = ocean !== null || darkTriad !== null;
  const showAttentionWarning =
    result?.isValid === false &&
    hasComputedScores &&
    !!result?.invalidReason;

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  // Truly invalid result (no scores computed at all)
  if (!isValid && !hasComputedScores && result) {
    return (
      <div className="min-h-screen bg-background px-4 py-8">
        <LangToggle lang={lang} setLang={setLang} />
        <InvalidResultCard lang={lang} />
      </div>
    );
  }

  // Gate
  if (!gatePass) {
    return (
      <div className="min-h-screen bg-background">
        <LangToggle lang={lang} setLang={setLang} />
        <ResultsInterstitial
          lang={lang}
          onConfirm={() => setGatePass(true)}
        />
      </div>
    );
  }

  // Main results
  return (
    <div className="min-h-screen bg-background">
      <LangToggle lang={lang} setLang={setLang} />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12">
        {/* ══════════ HEADER ══════════════════════════════════════════════ */}
        <motion.header
          className="text-center space-y-3"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground">
            {t.comprehensiveProfile}
          </h1>
          <p className="text-muted max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
            {t.profileSubtitle}
          </p>
          {session.completedAt && (
            <p className="text-xs text-muted/70 tabular-nums">
              {new Date(session.completedAt).toLocaleDateString(
                lang === "vi" ? "vi-VN" : "en-US",
                { year: "numeric", month: "long", day: "numeric" }
              )}
            </p>
          )}
        </motion.header>

        {/* ══════════ ATTENTION WARNING ════════════════════════════════════ */}
        {showAttentionWarning && (
          <motion.div
            className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50/80 dark:bg-amber-900/15 p-5 sm:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="flex items-start gap-3">
              <span className="text-xl shrink-0 mt-0.5">⚠️</span>
              <div>
                <h2 className="font-bold text-amber-700 dark:text-amber-300 mb-1">
                  {t.attentionWarningTitle}
                </h2>
                <p className="text-sm text-amber-600 dark:text-amber-400 leading-relaxed">
                  {t.attentionWarningText}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* ══════════ ARCHETYPE — Hero card ════════════════════════════════ */}
        {archetype && (
          <section>
            <SectionHeading title={t.yourArchetype} icon="🎭" />
            <ArchetypeCard archetype={archetype} lang={lang} />
          </section>
        )}

        {/* ══════════ RADAR CHART ═════════════════════════════════════════ */}
        {oceanTraits.length > 0 && (
          <section>
            <SectionHeading
              title={t.oceanTitle}
              subtitle={t.oceanSubtitle}
              icon="🧬"
            />
            <div className="rounded-2xl border border-border bg-surface p-5 sm:p-8">
              <RadarChart traits={oceanTraits} lang={lang} />
            </div>
          </section>
        )}

        {/* ══════════ OCEAN TRAIT CARDS ════════════════════════════════════ */}
        {oceanTraits.length > 0 && (
          <section>
            <div className="mb-2">
              <p className="text-xs text-accent font-medium animate-pulse">
                ✨ {t.tapToExplore}
              </p>
            </div>
            <div className="grid gap-4 sm:gap-5">
              {oceanTraits.map((trait, i) => (
                <motion.div
                  key={trait.domain}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.4 }}
                >
                  <TraitCard
                    trait={trait}
                    normResult={percentiles[trait.domain]}
                    lang={lang}
                    isDarkTriad={false}
                  />
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* ══════════ DARK TRIAD TRAIT CARDS ═══════════════════════════════ */}
        {dtTraits.length > 0 && (
          <section>
            <SectionHeading
              title={t.darkTriadTitle}
              subtitle={t.darkTriadSubtitle}
              icon="🌑"
            />
            <p className="text-xs text-muted italic mb-4 -mt-2 pl-7">
              {t.darkTriadNote}
            </p>
            <div className="grid gap-4 sm:gap-5">
              {dtTraits.map((trait, i) => (
                <motion.div
                  key={trait.domain}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.4 }}
                >
                  <TraitCard
                    trait={trait}
                    normResult={percentiles[trait.domain]}
                    lang={lang}
                    isDarkTriad={true}
                  />
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* ══════════ PERCENTILE COMPARISON PANEL ═════════════════════════ */}
        {allTraits.length > 0 && (
          <section className="rounded-2xl border border-border bg-surface overflow-hidden">
            {/* Panel header */}
            <div className="border-b border-border bg-background-secondary/40 px-5 sm:px-7 py-5">
              <div className="flex items-center gap-3 mb-1">
                <span className="text-xl">📊</span>
                <h2 className="text-lg sm:text-xl font-extrabold text-foreground tracking-tight">
                  {t.percentileTitle}
                </h2>
              </div>
              <p className="text-sm text-muted pl-9">{t.percentileSubtitle}</p>
            </div>

            <div className="px-5 sm:px-7 py-6 space-y-6">
              {/* Norm disclaimer */}
              <NormDisclaimer lang={lang} />

              {/* Reference group selectors */}
              {(oceanGroups.length > 0 || dtGroups.length > 0) && (
                <div className="grid gap-6 sm:grid-cols-2">
                  {oceanGroups.length > 0 && (
                    <RefGroupSelector
                      groups={oceanGroups}
                      selected={oceanGroup}
                      onChange={handleOceanGroupChange}
                      label={t.oceanRefGroup}
                      lang={lang}
                      referenceGroupDetails={percentileData?.referenceGroupDetails?.ocean}
                    />
                  )}
                  {dtGroups.length > 0 && (
                    <RefGroupSelector
                      groups={dtGroups}
                      selected={darkTriadGroup}
                      onChange={handleDarkTriadGroupChange}
                      label={t.darkTriadRefGroup}
                      lang={lang}
                      referenceGroupDetails={percentileData?.referenceGroupDetails?.darkTriad}
                    />
                  )}
                </div>
              )}

              {/* Divider */}
              <div className="border-t border-border/50" />

              {/* Loading spinner */}
              {percentileLoading && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted py-4">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                  {t.loadingPercentile}
                </div>
              )}

              {/* Percentile gauges — grouped by type */}
              {!percentileLoading && (
                <div className="space-y-6">
                  {/* OCEAN gauges */}
                  {oceanTraits.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-muted">
                        OCEAN
                      </h3>
                      {oceanTraits.map((trait) => (
                        <div key={trait.domain}>
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-sm font-semibold text-foreground">
                              {getDomainLabel(trait.domain, lang)}
                            </span>
                            <span className="text-xs font-mono text-muted">
                              {trait.score.toFixed(2)}
                            </span>
                          </div>
                          <PercentileGauge
                            domain={trait.domain}
                            normResult={percentiles[trait.domain]}
                            lang={lang}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Dark Triad gauges */}
                  {dtTraits.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-muted">
                        Dark Triad
                      </h3>
                      {dtTraits.map((trait) => (
                        <div key={trait.domain}>
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-sm font-semibold text-foreground">
                              {getDomainLabel(trait.domain, lang)}
                            </span>
                            <span className="text-xs font-mono text-muted">
                              {trait.score.toFixed(2)}
                            </span>
                          </div>
                          <PercentileGauge
                            domain={trait.domain}
                            normResult={percentiles[trait.domain]}
                            lang={lang}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ══════════ CROSS-TRAIT INSIGHTS ════════════════════════════════ */}
        {crossInsights.length > 0 && (
          <section>
            <SectionHeading
              title={t.crossTraitTitle}
              subtitle={t.crossTraitSubtitle}
              icon="🔗"
            />
            <div className="grid gap-4 sm:grid-cols-2">
              {crossInsights.map((ci, i) => (
                <motion.div
                  key={i}
                  className="rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                >
                  <div className="flex items-center gap-2.5 mb-3">
                    <span className="text-2xl">{ci.emoji}</span>
                    <h3 className="text-sm font-bold text-foreground leading-snug">
                      {ci.title}
                    </h3>
                  </div>
                  <p className="text-sm text-muted leading-relaxed whitespace-pre-line">
                    {ci.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* ══════════ SCORE TABLE ═════════════════════════════════════════ */}
        {allTraits.length > 0 && (
          <section>
            <SectionHeading
              title={t.scoreTableTitle}
              icon="📋"
            />
            <ScoreTable
              traits={allTraits}
              percentiles={percentiles}
              lang={lang}
            />
          </section>
        )}

        {/* ══════════ LIMITATIONS ═════════════════════════════════════════ */}
        <LimitationsSection lang={lang} />

        {/* ══════════ ACTION BUTTONS ══════════════════════════════════════ */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 pb-10">
          <Link
            href="/personality-test"
            className="w-full sm:w-auto text-center rounded-xl border border-border px-8 py-3 text-sm font-semibold text-foreground hover:bg-background-secondary transition-colors"
          >
            {t.goBack}
          </Link>
          <Link
            href="/personality-test"
            className="w-full sm:w-auto text-center rounded-xl bg-accent px-8 py-3 text-sm font-bold text-white shadow-md hover:shadow-lg hover:brightness-110 transition-all"
          >
            {t.retakeTest}
          </Link>
        </div>
      </div>
    </div>
  );
}
