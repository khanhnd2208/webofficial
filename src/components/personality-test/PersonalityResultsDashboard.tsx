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
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

import type {
  PersonalityTestSessionDTO,
  TraitScore,
} from "@/types/personalityTest";

import { type Lang, type FiveTier, getStrings, getDomainLabel } from "./i18n";

import {
  type NormativeResult,
  type PercentilesApiResponse,
  OCEAN_DOMAINS,
  DARK_TRIAD_DOMAINS,
  getZTier,
  TIER_COLORS,
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
      className="max-w-xl mx-auto rounded-xl border border-rose-300 dark:border-rose-700 bg-rose-50 dark:bg-rose-900/20 p-8 text-center shadow-lg"
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

// ── Clean typographic section heading ──────────────────────────────────────────

function SectionHeading({
  title,
  subtitle,
  icon,
}: {
  title: string;
  subtitle?: string;
  icon?: string;
}) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-0.5">
        <div className="h-4 w-0.5 rounded-full bg-accent" aria-hidden="true" />
        <h2 className="text-base sm:text-lg font-bold text-foreground tracking-tight leading-tight">
          {icon && <span className="mr-1.5">{icon}</span>}{title}
        </h2>
      </div>
      {subtitle && (
        <p className="ml-3 text-sm text-muted">{subtitle}</p>
      )}
    </div>
  );
}

// ── Section Toggle for Table of Contents ──────────────────────────────────────

interface SectionConfig {
  id: string;
  icon: string;
  label: string;
  labelVi: string;
  defaultOn: boolean;
}

function SectionToC({
  sections,
  visibility,
  onToggle,
  lang,
}: {
  sections: SectionConfig[];
  visibility: Record<string, boolean>;
  onToggle: (id: string) => void;
  lang: Lang;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <motion.div
      className="rounded-xl border border-border bg-surface overflow-hidden shadow-sm"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex w-full items-center justify-between px-5 py-3.5 text-left hover:bg-background-secondary/30 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-base">📋</span>
          <div>
            <h2 className="text-sm font-bold text-foreground">
              {lang === "vi" ? "Mục lục Kết quả" : "Results Navigation"}
            </h2>
            <p className="text-[10px] text-muted">
              {lang === "vi"
                ? "Bật/tắt để hiện hoặc ẩn từng phần"
                : "Toggle sections on/off to show or hide"}
            </p>
          </div>
        </div>
        <motion.svg
          animate={{ rotate: collapsed ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="h-4 w-4 text-muted shrink-0"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.22 8.22a.75.75 0 011.06 0L10 11.94l3.72-3.72a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.22 9.28a.75.75 0 010-1.06z"
            clipRule="evenodd"
          />
        </motion.svg>
      </button>

      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {sections.map((sec) => {
                const isOn = visibility[sec.id] ?? sec.defaultOn;
                return (
                  <button
                    key={sec.id}
                    onClick={() => onToggle(sec.id)}
                    className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-all duration-150 ${
                      isOn
                        ? "border-accent/40 bg-accent/5 shadow-sm"
                        : "border-border/60 bg-background-secondary/20 opacity-60"
                    }`}
                  >
                    {/* Toggle dot */}
                    <span
                      className={`shrink-0 h-4 w-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                        isOn ? "border-accent bg-accent" : "border-muted/40 bg-transparent"
                      }`}
                    >
                      {isOn && (
                        <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </span>

                    <span className="text-base shrink-0">{sec.icon}</span>
                    <div className="flex-1 min-w-0">
                      <span className={`text-xs font-semibold block truncate ${isOn ? "text-foreground" : "text-muted"}`}>
                        {lang === "vi" ? sec.labelVi : sec.label}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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

  /* Build a human-friendly description for each group */
  function friendlyLabel(g: { id: string; label: string; labelVi: string; n: number; isLocal?: boolean }): string {
    if (g.isLocal) {
      return lang === "vi" ? t.refGroupLocalDesc : t.refGroupLocalDesc;
    }
    // Use the raw label but make it friendlier
    const rawLabel = lang === "vi" ? g.labelVi : g.label;
    return rawLabel;
  }

  return (
    <div className="space-y-2">
      {/* Section label */}
      <p className="text-xs font-semibold text-muted">
        {label}
      </p>

      {/* Radio-style group options */}
      <div className="space-y-1.5">
        {groups.map((g) => {
          const isActive = g.id === selected;
          const isLocal = g.isLocal === true;
          const desc = friendlyLabel(g);

          return (
            <button
              key={g.id}
              onClick={() => onChange(g.id)}
              className={`flex w-full items-center gap-3 rounded-lg border px-3.5 py-2.5 text-left transition-all duration-150 ${
                isActive
                  ? isLocal
                    ? "border-emerald-300 bg-emerald-50/80 dark:border-emerald-700 dark:bg-emerald-950/40"
                    : "border-accent/40 bg-accent/5"
                  : "border-border/60 bg-transparent hover:border-border hover:bg-background-secondary/30"
              }`}
              aria-pressed={isActive}
            >
              {/* Radio dot */}
              <span className={`shrink-0 h-3.5 w-3.5 rounded-full border-2 flex items-center justify-center ${
                isActive
                  ? isLocal
                    ? "border-emerald-500"
                    : "border-accent"
                  : "border-muted/40"
              }`}>
                {isActive && (
                  <span className={`h-1.5 w-1.5 rounded-full ${
                    isLocal ? "bg-emerald-500" : "bg-accent"
                  }`} />
                )}
              </span>

              {/* Label + count */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold truncate ${
                    isActive ? "text-foreground" : "text-muted"
                  }`}>
                    {desc}
                  </span>
                  {isLocal && (
                    <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700 dark:text-emerald-300">
                      LIVE
                    </span>
                  )}
                </div>
                <span className={`text-[10px] tabular-nums ${isActive ? "text-muted" : "text-muted/50"}`}>
                  N = {g.n.toLocaleString()} {t.nParticipants}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected group detail */}
      {referenceGroupDetails && (
        <p className="text-[11px] text-muted leading-relaxed pl-1 border-l-2 border-border/60 mt-1">
          {lang === "vi" ? referenceGroupDetails.descriptionVi : referenceGroupDetails.description}
          <span className="opacity-50"> — {referenceGroupDetails.source}</span>
        </p>
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
    <div className="rounded-lg border border-border bg-background-secondary/50 px-4 py-3">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2.5 text-left group"
      >
        <svg
          className="h-4 w-4 shrink-0 text-muted"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="flex-1 text-xs text-muted leading-relaxed">
          {t.normDisclaimer}
        </span>
        <svg
          className={`h-3.5 w-3.5 shrink-0 text-muted transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {expanded && (
        <motion.p
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-2 pl-6 text-[11px] text-muted leading-relaxed"
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

  // ── Section visibility toggles ──
  const SECTION_CONFIG: SectionConfig[] = [
    { id: "archetype", icon: "🎭", label: "Your Archetype", labelVi: "Nguyên mẫu của bạn", defaultOn: true },
    { id: "radar", icon: "🕸️", label: "Radar Chart", labelVi: "Biểu đồ Radar", defaultOn: true },
    { id: "ocean", icon: "🌟", label: "Big Five (OCEAN)", labelVi: "5 Nét tính cách lớn", defaultOn: true },
    { id: "darkTriad", icon: "🌑", label: "Dark Triad", labelVi: "Bộ ba Bóng tối", defaultOn: true },
    { id: "percentile", icon: "📊", label: "Percentile Comparison", labelVi: "So sánh Percentile", defaultOn: true },
    { id: "crossTrait", icon: "🔗", label: "Cross-Trait Insights", labelVi: "Phân tích Tổng hợp", defaultOn: true },
    { id: "scoreTable", icon: "📋", label: "Score Table", labelVi: "Bảng điểm Chi tiết", defaultOn: true },
    { id: "limitations", icon: "📖", label: "Limitations & References", labelVi: "Giới hạn & Tài liệu", defaultOn: true },
  ];

  const [sectionVisibility, setSectionVisibility] = useState<Record<string, boolean>>(() => {
    const defaults: Record<string, boolean> = {};
    SECTION_CONFIG.forEach(s => { defaults[s.id] = s.defaultOn; });
    return defaults;
  });

  const toggleSection = useCallback((id: string) => {
    setSectionVisibility(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

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

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">
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

        {/* ══════════ SECTION NAVIGATION (Toggle On/Off) ══════════════ */}
        <SectionToC
          sections={SECTION_CONFIG.filter(s => {
            // Only show sections that actually have data
            if (s.id === "archetype" && !archetype) return false;
            if (s.id === "radar" && oceanTraits.length === 0) return false;
            if (s.id === "ocean" && oceanTraits.length === 0) return false;
            if (s.id === "darkTriad" && dtTraits.length === 0) return false;
            if (s.id === "percentile" && allTraits.length === 0) return false;
            if (s.id === "crossTrait" && crossInsights.length === 0) return false;
            if (s.id === "scoreTable" && allTraits.length === 0) return false;
            return true;
          })}
          visibility={sectionVisibility}
          onToggle={toggleSection}
          lang={lang}
        />

        {/* ══════════ ATTENTION WARNING ════════════════════════════════════ */}
        {showAttentionWarning && (
          <motion.div
            className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/80 dark:bg-amber-900/15 p-5 sm:p-6"
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

        {/* ══════════ ARCHETYPE — Hero card + trait summary ═════════════ */}
        {archetype && sectionVisibility.archetype && (
          <section className="space-y-4">
            <SectionHeading title={t.yourArchetype} />
            <ArchetypeCard archetype={archetype} lang={lang} />

            {/* Quick trait summary so user sees the score basis for the archetype */}
            {allTraits.length > 0 && (
              <div className="rounded-xl border border-border bg-surface p-4 sm:p-5">
                <p className="text-xs font-semibold text-muted mb-3">
                  {t.archetypeTraitBasis}
                </p>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {allTraits.map((trait) => {
                    const norm = percentiles[trait.domain];
                    const tier: FiveTier = norm
                      ? getZTier(norm.zScore)
                      : (trait.level as FiveTier);
                    const tc = TIER_COLORS[tier];
                    return (
                      <div key={trait.domain} className="flex items-center gap-2">
                        <span className={`shrink-0 inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold ${tc.badge}`}>
                          {tc.emoji}
                        </span>
                        <span className="text-xs text-foreground truncate">
                          {getDomainLabel(trait.domain, lang)}
                        </span>
                        <span className="text-[10px] font-mono text-muted tabular-nums ml-auto shrink-0">
                          {trait.score.toFixed(2)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        )}

        {/* ══════════ KEY HIGHLIGHTS ═══════════════════════════════════ */}
        {allTraits.length > 0 && sectionVisibility.archetype && (
          <motion.section
            className="rounded-xl border-2 border-accent/30 bg-linear-to-br from-accent/5 via-surface to-accent/5 p-5 sm:p-6 shadow-sm"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">⭐</span>
              <h2 className="text-sm sm:text-base font-bold text-foreground">
                {lang === "vi" ? "Điểm nổi bật" : "Key Highlights"}
              </h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {/* Highest trait */}
              {(() => {
                const highest = [...allTraits].sort((a, b) => b.score - a.score)[0];
                if (!highest) return null;
                const tier: FiveTier = percentiles[highest.domain]
                  ? getZTier(percentiles[highest.domain].zScore)
                  : (highest.level as FiveTier);
                const tc = TIER_COLORS[tier];
                return (
                  <div className={`rounded-lg border-2 border-emerald-300/60 dark:border-emerald-700/60 bg-emerald-50/50 dark:bg-emerald-900/10 p-3.5`}>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">
                      🏆 {lang === "vi" ? "Nét nổi bật nhất" : "Strongest Trait"}
                    </p>
                    <p className="text-sm font-bold text-foreground">
                      {getDomainLabel(highest.domain, lang)}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold ${tc.badge}`}>
                        {tc.emoji} {highest.score.toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })()}
              {/* Lowest trait */}
              {(() => {
                const lowest = [...allTraits].sort((a, b) => a.score - b.score)[0];
                if (!lowest) return null;
                const tier: FiveTier = percentiles[lowest.domain]
                  ? getZTier(percentiles[lowest.domain].zScore)
                  : (lowest.level as FiveTier);
                const tc = TIER_COLORS[tier];
                return (
                  <div className={`rounded-lg border-2 border-sky-300/60 dark:border-sky-700/60 bg-sky-50/50 dark:bg-sky-900/10 p-3.5`}>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400 mb-1">
                      📌 {lang === "vi" ? "Nét thấp nhất" : "Area to Watch"}
                    </p>
                    <p className="text-sm font-bold text-foreground">
                      {getDomainLabel(lowest.domain, lang)}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold ${tc.badge}`}>
                        {tc.emoji} {lowest.score.toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })()}
              {/* Notable Dark Triad */}
              {(() => {
                const highestDT = dtTraits.length > 0
                  ? [...dtTraits].sort((a, b) => b.score - a.score)[0]
                  : null;
                if (!highestDT) return null;
                const tier: FiveTier = percentiles[highestDT.domain]
                  ? getZTier(percentiles[highestDT.domain].zScore)
                  : (highestDT.level as FiveTier);
                const tc = TIER_COLORS[tier];
                return (
                  <div className={`rounded-lg border-2 border-purple-300/60 dark:border-purple-700/60 bg-purple-50/50 dark:bg-purple-900/10 p-3.5`}>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 mb-1">
                      🌑 {lang === "vi" ? "Dark Triad nổi bật" : "Notable Dark Triad"}
                    </p>
                    <p className="text-sm font-bold text-foreground">
                      {getDomainLabel(highestDT.domain, lang)}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold ${tc.badge}`}>
                        {tc.emoji} {highestDT.score.toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>
          </motion.section>
        )}

        {/* ═════════ RADAR CHART ═══════════════════════════════════════ */}
        {oceanTraits.length > 0 && sectionVisibility.radar && (
          <section>
            <div className="rounded-xl border border-border bg-surface p-5 sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-4 text-center">
                {t.oceanTitle}
              </p>
              <RadarChart traits={oceanTraits} lang={lang} />
            </div>
          </section>
        )}

        {/* ═════════ OCEAN TRAIT CARDS ════════════════════════════════════ */}
        {oceanTraits.length > 0 && sectionVisibility.ocean && (
          <section>
            <SectionHeading title={t.oceanTitle} subtitle={t.oceanSubtitle} />
            <div className="grid gap-3 sm:gap-4">
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

        {/* ═════════ DARK TRIAD TRAIT CARDS ════════════════════════════════ */}
        {dtTraits.length > 0 && sectionVisibility.darkTriad && (
          <section>
            <SectionHeading
              title={t.darkTriadTitle}
              subtitle={t.darkTriadSubtitle}
            />
            <div className="grid gap-3 sm:gap-4">
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

        {/* ═════════ PERCENTILE COMPARISON PANEL ══════════════════════ */}
        {allTraits.length > 0 && sectionVisibility.percentile && (
          <section className="rounded-xl border border-border bg-surface overflow-hidden">
            {/* Panel header */}
            <div className="border-b border-border bg-background-secondary/40 px-5 sm:px-7 py-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
                {t.percentileTitle}
              </h2>
              <p className="mt-0.5 text-xs text-muted">{t.percentileSubtitle}</p>
            </div>

            <div className="px-5 sm:px-7 py-6 space-y-5">
              {/* Norm disclaimer */}
              <NormDisclaimer lang={lang} />

              {/* Reference group selectors — stacked on mobile, side by side on desktop */}
              {(oceanGroups.length > 0 || dtGroups.length > 0) && (
                <div className="grid gap-5 sm:grid-cols-2">
                  {oceanGroups.length > 0 && (
                    <RefGroupSelector
                      groups={oceanGroups}
                      selected={oceanGroup}
                      onChange={handleOceanGroupChange}
                      label={t.oceanCompareLabel}
                      lang={lang}
                      referenceGroupDetails={percentileData?.referenceGroupDetails?.ocean}
                    />
                  )}
                  {dtGroups.length > 0 && (
                    <RefGroupSelector
                      groups={dtGroups}
                      selected={darkTriadGroup}
                      onChange={handleDarkTriadGroupChange}
                      label={t.dtCompareLabel}
                      lang={lang}
                      referenceGroupDetails={percentileData?.referenceGroupDetails?.darkTriad}
                    />
                  )}
                </div>
              )}

              {/* Loading spinner */}
              {percentileLoading && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted py-4">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                  {t.loadingPercentile}
                </div>
              )}

              {/* Quick visual: All percentile bars in one place for easy scan */}
              {!percentileLoading && (
                <div className="space-y-5">
                  <div className="border-t border-border/50 pt-5" />

                  <p className="text-xs font-semibold text-muted">{t.yourScoresSummary}</p>

                  {/* OCEAN gauges */}
                  {oceanTraits.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted/70">
                        OCEAN
                      </h3>
                      {oceanTraits.map((trait) => (
                        <div key={trait.domain}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-semibold text-foreground">
                              {getDomainLabel(trait.domain, lang)}
                            </span>
                            <span className="text-[10px] font-mono text-muted tabular-nums">
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
                    <div className="space-y-3">
                      <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted/70">
                        Dark Triad
                      </h3>
                      {dtTraits.map((trait) => (
                        <div key={trait.domain}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-semibold text-foreground">
                              {getDomainLabel(trait.domain, lang)}
                            </span>
                            <span className="text-[10px] font-mono text-muted tabular-nums">
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
        {crossInsights.length > 0 && sectionVisibility.crossTrait && (
          <section>
            <SectionHeading
              title={t.crossTraitTitle}
              subtitle={t.crossTraitSubtitle}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              {crossInsights.map((ci, i) => (
                <motion.div
                  key={i}
                  className="rounded-xl border border-border bg-surface p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{ci.emoji}</span>
                    <h3 className="text-sm font-bold text-foreground leading-snug">
                      {ci.title}
                    </h3>
                  </div>
                  <p className="text-xs text-muted leading-relaxed whitespace-pre-line">
                    {ci.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* ══════════ SCORE TABLE ═════════════════════════════════════════ */}
        {allTraits.length > 0 && sectionVisibility.scoreTable && (
          <section>
            <SectionHeading
              title={t.scoreTableTitle}
            />
            <ScoreTable
              traits={allTraits}
              percentiles={percentiles}
              lang={lang}
            />
          </section>
        )}

        {/* ══════════ LIMITATIONS ═════════════════════════════════════════ */}
        {sectionVisibility.limitations && (
          <LimitationsSection lang={lang} />
        )}

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
