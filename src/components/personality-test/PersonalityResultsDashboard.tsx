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
      className="fixed right-4 top-20 z-50 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
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
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-foreground">{label}</span>
        <span className="text-[11px] text-muted italic">{t.groupSelectorHint}</span>
      </div>
      <div className="flex flex-wrap gap-2">
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
                className={`rounded-xl px-3 py-2 text-xs font-medium transition-all border-2 ${
                  isActive
                    ? isLocal
                      ? "border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200 shadow-sm"
                      : "border-accent bg-accent/10 text-accent dark:bg-accent/20 shadow-sm"
                    : "border-transparent bg-background-secondary text-muted hover:bg-accent/10 hover:border-accent/30"
                }`}
              >
                <span className="flex items-center gap-1.5">
                  {isLocal && <span className="text-[10px]">🏫</span>}
                  {!isLocal && <span className="text-[10px]">🌍</span>}
                  <span>{displayLabel}</span>
                </span>
              </button>
              {/* Hover tooltip card */}
              {hoveredId === g.id && (
                <div className="absolute bottom-full left-0 z-50 mb-2 w-72 rounded-xl border border-border bg-surface p-3 shadow-xl shadow-black/10 text-xs">
                  <p className="font-semibold text-foreground mb-1">{displayLabel}</p>
                  <p className="text-muted leading-relaxed">
                    n={g.n.toLocaleString()}
                    {isLocal && ` · ${lang === 'vi' ? 'Cập nhật trực tiếp' : 'Live-updated'}`}
                  </p>
                  <div className="absolute -bottom-1 left-4 h-2 w-2 rotate-45 border-b border-r border-border bg-surface" />
                </div>
              )}
            </div>
          );
        })}
      </div>
      {/* Show selected group details */}
      {referenceGroupDetails && (
        <div className="mt-1 rounded-lg bg-background-secondary/50 px-3 py-2 text-[11px] text-muted space-y-0.5">
          <p>
            <span className="font-semibold">{t.groupDescription}:</span>{" "}
            {lang === "vi" ? referenceGroupDetails.descriptionVi : referenceGroupDetails.description}
          </p>
          <p>
            <span className="font-semibold">{t.groupSource}:</span>{" "}
            {referenceGroupDetails.source}
          </p>
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
    <div className="rounded-xl border border-amber-300/60 dark:border-amber-700/60 bg-amber-50/70 dark:bg-amber-950/20 p-4">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-start gap-2 text-left"
      >
        <span className="text-sm font-semibold text-amber-700 dark:text-amber-300 leading-relaxed flex-1">
          {t.normDisclaimer}
        </span>
        <span className={`text-amber-600 dark:text-amber-400 transition-transform text-xs mt-0.5 ${expanded ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>
      {expanded && (
        <p className="mt-2 text-xs text-amber-700/80 dark:text-amber-300/80 leading-relaxed">
          {t.normDisclaimerDetail}
        </p>
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

      <div className="mx-auto max-w-4xl px-4 py-8 space-y-10">
        {/* Header */}
        <motion.div
          className="text-center space-y-2"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-foreground">
            {t.comprehensiveProfile}
          </h1>
          <p className="text-muted max-w-xl mx-auto">{t.profileSubtitle}</p>
          {session.completedAt && (
            <p className="text-xs text-muted">
              {new Date(session.completedAt).toLocaleDateString(
                lang === "vi" ? "vi-VN" : "en-US",
                { year: "numeric", month: "long", day: "numeric" }
              )}
            </p>
          )}
        </motion.div>

        {/* Attention warning */}
        {showAttentionWarning && (
          <motion.div
            className="rounded-2xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 p-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <h2 className="font-semibold text-amber-700 dark:text-amber-300 mb-1">
              {t.attentionWarningTitle}
            </h2>
            <p className="text-sm text-amber-600 dark:text-amber-400">
              {t.attentionWarningText}
            </p>
          </motion.div>
        )}

        {/* Archetype */}
        {archetype && (
          <section>
            <h2 className="text-lg font-bold text-foreground mb-4">
              {t.yourArchetype}
            </h2>
            <ArchetypeCard archetype={archetype} lang={lang} />
          </section>
        )}

        {/* Radar Chart */}
        {oceanTraits.length > 0 && (
          <section className="rounded-2xl border border-border bg-surface p-5">
            <RadarChart traits={oceanTraits} lang={lang} />
          </section>
        )}

        {/* OCEAN Traits */}
        {oceanTraits.length > 0 && (
          <section>
            <div className="mb-4">
              <h2 className="text-lg font-bold text-foreground">
                {t.oceanTitle}
              </h2>
              <p className="text-sm text-muted">{t.oceanSubtitle}</p>
              <p className="text-xs text-accent mt-1 animate-pulse">
                &#10024; {t.tapToExplore}
              </p>
            </div>
            <div className="grid gap-4">
              {oceanTraits.map((trait) => (
                <TraitCard
                  key={trait.domain}
                  trait={trait}
                  normResult={percentiles[trait.domain]}
                  lang={lang}
                  isDarkTriad={false}
                />
              ))}
            </div>
          </section>
        )}

        {/* Dark Triad Traits */}
        {dtTraits.length > 0 && (
          <section>
            <div className="mb-4">
              <h2 className="text-lg font-bold text-foreground">
                {t.darkTriadTitle}
              </h2>
              <p className="text-sm text-muted">{t.darkTriadSubtitle}</p>
              <p className="text-xs text-muted mt-1 italic">
                {t.darkTriadNote}
              </p>
            </div>
            <div className="grid gap-4">
              {dtTraits.map((trait) => (
                <TraitCard
                  key={trait.domain}
                  trait={trait}
                  normResult={percentiles[trait.domain]}
                  lang={lang}
                  isDarkTriad={true}
                />
              ))}
            </div>
          </section>
        )}

        {/* Percentile comparison — always shown when there are scores */}
        {allTraits.length > 0 && (
          <section className="rounded-2xl border border-border bg-surface p-5 space-y-5">
            <div>
              <h2 className="text-lg font-bold text-foreground">
                {t.percentileTitle}
              </h2>
              <p className="text-sm text-muted">{t.percentileSubtitle}</p>
            </div>

            {/* Norm disclaimer */}
            <NormDisclaimer lang={lang} />

            {/* Reference group selectors — only after data loaded */}
            {(oceanGroups.length > 0 || dtGroups.length > 0) && (
              <div className="space-y-4">
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

            {/* Loading spinner */}
            {percentileLoading && (
              <div className="flex items-center gap-2 text-sm text-muted">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                {t.loadingPercentile}
              </div>
            )}

            {/* Percentile bars — show for all traits, passing undefined when still loading */}
            {!percentileLoading && (
              <div className="space-y-4">
                {allTraits.map((trait) => (
                  <div key={trait.domain}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-foreground">
                        {getDomainLabel(trait.domain, lang)}
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
          </section>
        )}

        {/* Cross-trait insights */}
        {crossInsights.length > 0 && (
          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-foreground">
                {t.crossTraitTitle}
              </h2>
              <p className="text-sm text-muted">{t.crossTraitSubtitle}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {crossInsights.map((ci, i) => (
                <motion.div
                  key={i}
                  className="rounded-2xl border border-border bg-surface p-5 shadow-sm"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">{ci.emoji}</span>
                    <h3 className="text-sm font-semibold text-foreground">
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

        {/* Score Table */}
        {allTraits.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-foreground mb-4">
              {t.scoreTableTitle}
            </h2>
            <ScoreTable
              traits={allTraits}
              percentiles={percentiles}
              lang={lang}
            />
          </section>
        )}

        {/* Limitations */}
        <LimitationsSection lang={lang} />

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-4 pb-8">
          <Link
            href="/personality-test"
            className="rounded-full border border-border px-6 py-2.5 text-sm font-semibold text-foreground hover:bg-background-secondary transition"
          >
            {t.goBack}
          </Link>
          <Link
            href="/personality-test"
            className="rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-white shadow hover:shadow-md transition"
          >
            {t.retakeTest}
          </Link>
        </div>
      </div>
    </div>
  );
}
