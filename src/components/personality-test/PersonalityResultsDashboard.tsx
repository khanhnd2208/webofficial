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

// ── Large Section Title — numbered, prominent, with description ───────────────

function SectionTitle({
  number,
  icon,
  title,
  titleVi,
  description,
  descriptionVi,
  lang,
}: {
  number: number;
  icon: string;
  title: string;
  titleVi: string;
  description: string;
  descriptionVi: string;
  lang: Lang;
}) {
  return (
    <motion.div
      className="relative pt-8 pb-2"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      {/* Divider line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-border" />
      <div className="flex items-start gap-3 sm:gap-4">
        {/* Number badge */}
        <span className="shrink-0 flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-accent/10 text-accent text-sm sm:text-base font-black tabular-nums">
          {number}
        </span>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg sm:text-xl font-extrabold text-foreground tracking-tight leading-tight flex items-center gap-2 flex-wrap">
            <span>{icon}</span>
            <span>{lang === "vi" ? titleVi : title}</span>
          </h2>
          <p className="mt-1 text-sm text-muted leading-relaxed max-w-2xl">
            {lang === "vi" ? descriptionVi : description}
          </p>
        </div>
      </div>
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

  /* Build plain-language friendly labels */
  function friendlyLabel(g: { id: string; label: string; labelVi: string; n: number; isLocal?: boolean }): { main: string; sub: string } {
    if (g.isLocal) {
      return {
        main: lang === "vi" ? "🏫 Các bạn cùng làm bài" : "🏫 Students on this platform",
        sub: lang === "vi"
          ? "So sánh với sinh viên đã làm bài trên nền tảng này — gần gũi và phù hợp nhất với bạn"
          : "Compare with students who took this test here — the most relevant group for you",
      };
    }
    const rawLabel = lang === "vi" ? g.labelVi : g.label;
    return {
      main: `🌍 ${rawLabel}`,
      sub: lang === "vi"
        ? "Mẫu nghiên cứu quốc tế từ các bài báo khoa học"
        : "International research sample from published studies",
    };
  }

  return (
    <div className="space-y-3">
      {/* Section label */}
      <div>
        <p className="text-xs font-bold text-foreground">
          {label}
        </p>
        <p className="text-[10px] text-muted mt-0.5">
          {lang === "vi"
            ? "Chọn nhóm bạn muốn so sánh — nhấn để thay đổi"
            : "Pick who you want to compare with — tap to change"}
        </p>
      </div>

      {/* Card-style group options */}
      <div className="space-y-2">
        {groups.map((g) => {
          const isActive = g.id === selected;
          const isLocal = g.isLocal === true;
          const labels = friendlyLabel(g);

          return (
            <button
              key={g.id}
              onClick={() => onChange(g.id)}
              className={`flex w-full items-start gap-3.5 rounded-xl border-2 px-4 py-3.5 text-left transition-all duration-200 ${
                isActive
                  ? isLocal
                    ? "border-emerald-400 bg-emerald-50/80 dark:border-emerald-600 dark:bg-emerald-950/30 shadow-sm shadow-emerald-200/40 dark:shadow-emerald-900/30"
                    : "border-accent bg-accent/5 shadow-sm shadow-accent/10"
                  : "border-border/50 bg-transparent hover:border-border hover:bg-background-secondary/30"
              }`}
              aria-pressed={isActive}
            >
              {/* Radio circle */}
              <span className={`shrink-0 mt-0.5 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all ${
                isActive
                  ? isLocal
                    ? "border-emerald-500 bg-emerald-500"
                    : "border-accent bg-accent"
                  : "border-muted/30 bg-transparent"
              }`}>
                {isActive && (
                  <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>

              {/* Label + description + count */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-sm font-bold ${
                    isActive ? "text-foreground" : "text-muted"
                  }`}>
                    {labels.main}
                  </span>
                  {isLocal && (
                    <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 px-2 py-0.5 text-[9px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wide">
                      ● Live
                    </span>
                  )}
                  {isLocal && (
                    <span className="shrink-0 text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 rounded-full px-2 py-0.5">
                      {lang === "vi" ? "⭐ Khuyên dùng" : "⭐ Recommended"}
                    </span>
                  )}
                </div>
                <p className={`text-[11px] leading-relaxed mt-0.5 ${
                  isActive ? "text-muted" : "text-muted/60"
                }`}>
                  {labels.sub}
                </p>
                <span className={`text-[10px] tabular-nums mt-1 inline-block ${
                  isActive ? "text-muted" : "text-muted/40"
                }`}>
                  {g.n.toLocaleString()} {t.nParticipants}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected group detail */}
      {referenceGroupDetails && (
        <div className="rounded-lg bg-background-secondary/40 border border-border/40 px-3.5 py-2.5">
          <p className="text-[11px] text-muted leading-relaxed">
            <span className="font-bold">{lang === "vi" ? "ℹ️ Về nhóm này:" : "ℹ️ About this group:"}</span>{" "}
            {lang === "vi" ? referenceGroupDetails.descriptionVi : referenceGroupDetails.description}
          </p>
          <p className="text-[10px] text-muted/50 mt-1">
            {lang === "vi" ? "Nguồn" : "Source"}: {referenceGroupDetails.source}
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
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-amber-200/60 dark:border-amber-800/40 bg-amber-50/50 dark:bg-amber-900/10 px-4 py-3.5">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2.5 text-left group"
      >
        <span className="text-base shrink-0">💡</span>
        <span className="flex-1 text-xs text-amber-800 dark:text-amber-200 leading-relaxed font-medium">
          {lang === "vi"
            ? "Lưu ý: Các con số percentile phụ thuộc vào nhóm bạn chọn để so sánh. Để kết quả phù hợp nhất, hãy chọn nhóm gần gũi với bạn (ví dụ: sinh viên cùng nền tảng)."
            : "Note: Percentile numbers depend on which group you compare against. For the most meaningful results, choose the group closest to you (e.g. students on this platform)."}
        </span>
        <svg
          className={`h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-2.5 pl-8 space-y-2"
        >
          <p className="text-[11px] text-amber-700/80 dark:text-amber-300/80 leading-relaxed">
            {lang === "vi"
              ? "Nhóm tham chiếu mặc định đến từ người trưởng thành Mỹ/Canada. Do khác biệt văn hóa, sinh viên Việt Nam thường có điểm Dễ chịu và Tận tâm cao hơn so với chuẩn phương Tây — đây là do khác biệt văn hóa, không phải vấn đề tính cách."
              : "Default reference groups come from US/Canadian adults. Due to cultural differences in values and self-reporting style, Vietnamese students often score higher on Agreeableness and Conscientiousness compared to Western norms — this is a cultural difference, not a personality issue."}
          </p>
          <p className="text-[11px] text-amber-700/80 dark:text-amber-300/80 leading-relaxed font-semibold">
            {lang === "vi"
              ? "→ Để so sánh chính xác hơn, hãy chọn 'Các bạn cùng làm bài' (🏫) bên dưới!"
              : "→ For a more accurate comparison, select 'Students on this platform' (🏫) below!"}
          </p>
        </motion.div>
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

        {/* ══════════ 1. ARCHETYPE — Hero card + trait summary ════════ */}
        {archetype && (
          <section className="space-y-4">
            <SectionTitle
              number={1}
              icon="🎭"
              title="Your Personality Archetype"
              titleVi="Nguyên mẫu Tính cách của bạn"
              description="Based on the unique combination of all your trait scores, we've matched you to a personality archetype — a recognizable pattern that captures your dominant tendencies. Think of it as a starting point for self-understanding, not a final label."
              descriptionVi="Dựa trên sự kết hợp độc đáo của tất cả các nét tính cách, chúng tôi đã tìm ra một nguyên mẫu phù hợp với bạn — một mô hình dễ nhận biết thể hiện xu hướng nổi trội nhất. Hãy xem đây là điểm khởi đầu để hiểu bản thân, không phải nhãn dán cuối cùng."
              lang={lang}
            />
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
        {allTraits.length > 0 && (
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

        {/* ═════════ 2. RADAR CHART ══════════════════════════════════ */}
        {oceanTraits.length > 0 && (
          <section>
            <SectionTitle
              number={2}
              icon="🕸️"
              title="Personality Radar"
              titleVi="Bản đồ Tính cách (Radar)"
              description="A visual overview of your Big Five personality traits. The further a point extends from the center, the higher you scored on that trait. This gives you a quick snapshot of your overall personality shape at a glance."
              descriptionVi="Tổng quan trực quan về 5 nét tính cách lớn. Điểm càng xa tâm thì bạn càng có xu hướng mạnh ở nét đó. Biểu đồ này giúp bạn nhìn nhanh 'hình dạng tính cách' tổng thể của mình."
              lang={lang}
            />
            <div className="rounded-xl border border-border bg-surface p-5 sm:p-6">
              <RadarChart traits={oceanTraits} lang={lang} />
            </div>
          </section>
        )}

        {/* ═════════ 3. OCEAN TRAIT CARDS ═════════════════════════════ */}
        {oceanTraits.length > 0 && (
          <section>
            <SectionTitle
              number={3}
              icon="🌟"
              title="The Big Five Personality Traits (OCEAN)"
              titleVi="5 Nét Tính cách Lớn (OCEAN)"
              description="The Big Five model is the most widely validated personality framework in psychology. It measures five core dimensions that shape how you think, feel, and interact with others. Each trait exists on a spectrum — there are no 'good' or 'bad' scores."
              descriptionVi="Mô hình Big Five (Năm Lớn) là khung tính cách được nghiên cứu và kiểm chứng rộng rãi nhất trong tâm lý học. Mô hình đo lường 5 chiều cốt lõi định hình cách bạn suy nghĩ, cảm nhận và tương tác với người khác. Mỗi nét tính cách nằm trên một phổ — không có điểm nào là 'tốt' hay 'xấu'."
              lang={lang}
            />
            <p className="text-xs text-muted/70 italic mb-1">{t.oceanSubtitle}</p>

            {/* Click hint */}
            <div className="flex items-center gap-2 mb-4 rounded-lg bg-accent/5 border border-accent/15 px-3.5 py-2.5">
              <span className="text-accent text-base">👆</span>
              <p className="text-xs text-accent font-semibold">
                {lang === "vi"
                  ? "Nhấn vào từng nét tính cách bên dưới để xem phân tích chi tiết riêng cho bạn — bao gồm ý nghĩa, nghề nghiệp phù hợp, và lời khuyên cụ thể!"
                  : "Tap each trait card below to reveal your personalized analysis — including what it means, career fit, and specific action advice!"}
              </p>
            </div>

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

        {/* ═════════ 4. DARK TRIAD TRAIT CARDS ═════════════════════════ */}
        {dtTraits.length > 0 && (
          <section>
            <SectionTitle
              number={4}
              icon="🌑"
              title="Social Instincts — The Dark Triad"
              titleVi="Bản năng Xã hội — Bộ ba Bóng tối (Dark Triad)"
              description="Despite the dramatic name, the Dark Triad measures normal personality tendencies everyone has to some degree — strategic thinking (Machiavellianism), self-confidence (Narcissism), and risk tolerance (Psychopathy). These are NOT clinical diagnoses. Moderate levels often relate to leadership potential and career success."
              descriptionVi="Dù tên gọi có vẻ 'đáng sợ', Dark Triad đo các xu hướng tính cách bình thường mà ai cũng có ở mức nào đó — tư duy chiến lược (Mưu lược), sự tự tin (Ái kỷ), và khả năng chấp nhận rủi ro (Thái nhân cách). Đây KHÔNG phải chẩn đoán bệnh lý. Mức vừa phải thường liên quan đến tiềm năng lãnh đạo và thành công sự nghiệp."
              lang={lang}
            />
            <p className="text-xs text-muted/70 italic mb-1">{t.darkTriadSubtitle}</p>

            {/* Click hint */}
            <div className="flex items-center gap-2 mb-4 rounded-lg bg-purple-50/60 dark:bg-purple-900/10 border border-purple-200/40 dark:border-purple-800/30 px-3.5 py-2.5">
              <span className="text-purple-500 text-base">👆</span>
              <p className="text-xs text-purple-700 dark:text-purple-300 font-semibold">
                {lang === "vi"
                  ? "Nhấn vào từng đặc điểm để xem chi tiết — ý nghĩa thực sự, cách nó ảnh hưởng đến công việc, và cách phát huy ưu điểm của bạn!"
                  : "Tap each trait to see the full story — what it really means, how it affects your work, and how to leverage your strengths!"}
              </p>
            </div>

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

        {/* ═════════ 5. PERCENTILE COMPARISON PANEL ═══════════════════ */}
        {allTraits.length > 0 && (
          <section>
            <SectionTitle
              number={5}
              icon="📊"
              title="How Do You Compare?"
              titleVi="Bạn ở đâu so với Mọi người?"
              description="This section shows where your scores fall compared to other people — like finding your position on a bell curve. A percentile of 75 means you scored higher than 75% of people in the comparison group. You can switch between different comparison groups below."
              descriptionVi="Phần này cho thấy điểm của bạn nằm ở đâu so với người khác — giống như tìm vị trí của bạn trên đường cong phân phối chuẩn. Percentile 75 có nghĩa bạn đạt điểm cao hơn 75% người trong nhóm so sánh. Bạn có thể chuyển đổi giữa các nhóm so sánh bên dưới."
              lang={lang}
            />
          <div className="rounded-xl border border-border bg-surface overflow-hidden">

            <div className="px-5 sm:px-7 py-6 space-y-5">
              {/* Norm disclaimer */}
              <NormDisclaimer lang={lang} />

              {/* Reference group selectors — with user-friendly header */}
              {(oceanGroups.length > 0 || dtGroups.length > 0) && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🎯</span>
                    <div>
                      <h3 className="text-sm font-bold text-foreground">
                        {lang === "vi" ? "Chọn nhóm so sánh" : "Choose your comparison group"}
                      </h3>
                      <p className="text-[11px] text-muted leading-relaxed">
                        {lang === "vi"
                          ? "Kết quả percentile thay đổi tùy theo nhóm bạn so sánh. Hãy thử chuyển đổi giữa các nhóm để xem sự khác biệt!"
                          : "Percentile results change depending on who you compare against. Try switching between groups to see the difference!"}
                      </p>
                    </div>
                  </div>
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
          </div>
          </section>
        )}

        {/* ══════════ 6. CROSS-TRAIT INSIGHTS ═════════════════════════ */}
        {crossInsights.length > 0 && (
          <section>
            <SectionTitle
              number={6}
              icon="🔗"
              title="Your Unique Profile Insights"
              titleVi="Điểm Độc đáo chỉ riêng Bạn"
              description="The most powerful insights come from how your traits combine. This section analyses how your specific trait pairs interact to create unique tendencies — strengths that emerge only from your particular combination, and potential blind spots to be aware of."
              descriptionVi="Những nhận định giá trị nhất đến từ cách các nét tính cách của bạn kết hợp với nhau. Phần này phân tích cách các cặp nét tính cách của bạn tương tác, tạo ra những xu hướng riêng biệt — những thế mạnh chỉ xuất hiện từ sự kết hợp đặc trưng của bạn, và những điểm mù cần lưu ý."
              lang={lang}
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

        {/* ══════════ 7. SCORE TABLE ══════════════════════════════════ */}
        {allTraits.length > 0 && (
          <section>
            <SectionTitle
              number={7}
              icon="📋"
              title="Detailed Score Table"
              titleVi="Bảng điểm Chi tiết"
              description="A compact summary of all your numerical scores in one place. Hover or tap on any value to see what it means. Z-scores show how many standard deviations you are from the group average, and Percentile shows what percentage of people scored lower than you."
              descriptionVi="Bảng tóm tắt tất cả điểm số của bạn ở một nơi. Di chuột hoặc nhấn vào bất kỳ giá trị nào để xem giải thích. Z-score cho biết bạn cách trung bình nhóm bao nhiêu độ lệch chuẩn, và Percentile cho biết bao nhiêu phần trăm người có điểm thấp hơn bạn."
              lang={lang}
            />
            <ScoreTable
              traits={allTraits}
              percentiles={percentiles}
              lang={lang}
            />
          </section>
        )}

        {/* ══════════ 8. LIMITATIONS ═════════════════════════════════ */}
        <section>
          <SectionTitle
            number={8}
            icon="📖"
            title="Limitations & Research Context"
            titleVi="Giới hạn & Bối cảnh Nghiên cứu"
            description="No personality test is perfect. Understanding the limitations helps you interpret your results wisely. This section covers important caveats about self-report bias, cultural context, and what these scores can and cannot tell you."
            descriptionVi="Không có bài trắc nghiệm tính cách nào là hoàn hảo. Hiểu các giới hạn giúp bạn diễn giải kết quả một cách khôn ngoan. Phần này đề cập đến những lưu ý quan trọng về thiên lệch tự đánh giá, bối cảnh văn hóa, và những gì điểm số có thể và không thể nói cho bạn."
            lang={lang}
          />
          <LimitationsSection lang={lang} />
        </section>

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
