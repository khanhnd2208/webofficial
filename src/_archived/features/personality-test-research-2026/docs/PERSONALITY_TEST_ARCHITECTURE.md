# Personality Test — Architecture & Maintenance Guide

> **Last updated:** Phase 11 final audit — June 2025  
> **Total codebase:** ~9,380 lines across 51+ files  
> **Test coverage:** 109 tests (39 scoring + 70 normative) — all passing  

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Directory Map](#directory-map)
3. [Module Reference](#module-reference)
   - [Types & Interfaces](#types--interfaces)
   - [Scoring Engine](#scoring-engine-srclibpersonality)
   - [Normative Data](#normative-data-srclibnormative)
   - [Data Access Layer](#data-access-layer)
   - [Service Layer](#service-layer)
   - [API Routes](#api-routes)
   - [Pages (Server Components)](#pages-server-components)
   - [Wizard UI](#wizard-ui-srccomponentspersonality-testwizard)
   - [Results Dashboard](#results-dashboard-srccomponentspersonality-testdashboard)
   - [Shared UI Utilities](#shared-ui-utilities)
   - [Admin Tools](#admin-tools)
   - [Tests](#tests)
4. [Data Flow](#data-flow)
5. [Import Strategy](#import-strategy)
6. [Key Design Decisions](#key-design-decisions)
7. [Maintenance Checklist](#maintenance-checklist)

---

## System Overview

A **two-part personality assessment** built on validated academic instruments:

| Part | Instrument | Items | Domains |
|------|-----------|-------|---------|
| 1 — "The Light" | BFI-2-S (Big Five Inventory 2, Short) | 31 (30 + 1 attention check) | Extraversion, Agreeableness, Conscientiousness, Negative Emotionality, Open-Mindedness |
| 2 — "The Dark" | SD3 (Short Dark Triad) | 28 (27 + 1 attention check) | Machiavellianism, Narcissism, Psychopathy |

**Tech stack:** Next.js App Router · TypeScript · Tailwind CSS v4 · framer-motion · PostgreSQL · Vitest

---

## Directory Map

```
src/
├── types/
│   └── personalityTest.ts              ← All shared TypeScript interfaces
│
├── lib/
│   ├── personalityScoring.ts           ← Barrel re-export → ./personality/
│   ├── personality/                    ← SCORING ENGINE MODULE
│   │   ├── index.ts                    Master barrel
│   │   ├── questions/
│   │   │   ├── bfi2s.ts                BFI-2-S questions (31 items)
│   │   │   ├── sd3.ts                  SD3 questions (28 items)
│   │   │   └── index.ts                Re-exports both question arrays
│   │   ├── labels.ts                   Likert labels, domain names, thresholds
│   │   ├── scoringEngine.ts            validateAttentionChecks, scorePersonalityTest
│   │   ├── archetypes.ts               6 archetype rules + generateArchetype
│   │   └── config.ts                   getTestConfig() for client DTO
│   │
│   ├── normativeData.ts                ← Barrel re-export → ./normative/
│   ├── normative/                      ← NORMATIVE DATA MODULE
│   │   ├── index.ts                    Master barrel
│   │   ├── types.ts                    NormativeStats, ReferenceGroup, PercentileResult
│   │   ├── norms.ts                    Raw norms, reference groups, facet norms
│   │   └── percentileEngine.ts         normalCDF, z-scores, percentile calculations
│   │
│   └── __tests__/
│       ├── personalityScoring.test.ts  39 tests — scoring + attention + archetypes
│       └── normativeData.test.ts       70 tests — percentiles + reference groups
│
├── models/
│   └── PersonalityTest.ts              ← PostgreSQL data access (CRUD)
│
├── services/
│   └── personalityTestService.ts       ← Business logic orchestration
│
├── app/
│   ├── personality-test/
│   │   ├── page.tsx                    Server component — test entry
│   │   └── results/[id]/page.tsx       Server component — results view
│   │
│   ├── admin/personality-test/
│   │   ├── page.tsx                    Admin report dashboard
│   │   └── verify/page.tsx             Scoring verification tool
│   │
│   └── api/
│       ├── personality-test/
│       │   ├── route.ts                GET (list) / POST (submit)
│       │   └── [id]/
│       │       ├── route.ts            GET single session
│       │       └── percentiles/route.ts GET percentile calculations
│       │
│       └── admin/personality-test/
│           └── report/route.ts         Admin report + Excel export
│
└── components/personality-test/
    ├── PersonalityTestClient.tsx        ← Client orchestrator (wizard ↔ dashboard)
    ├── PersonalityTestHistory.tsx       ← Past sessions list
    │
    ├── PersonalityTestWizard.tsx        ← Wizard orchestrator → ./wizard/
    ├── wizard/                          ← WIZARD UI MODULE
    │   ├── index.ts                    Barrel export
    │   ├── constants.ts                Likert options, demographic options
    │   ├── types.ts                    TestPhase, phase prop interfaces
    │   ├── helpers.ts                  getKey(), formatTime()
    │   ├── ProgressHeader.tsx          Sticky progress bar + timer
    │   ├── IntroPhase.tsx              Welcome screen + resume
    │   ├── DemographicsPhase.tsx       Demographic form (gender, uni, GPA…)
    │   ├── QuestionPhase.tsx           Paginated Likert questions
    │   ├── TransitionPhase.tsx         BFI → SD3 celebration
    │   └── ReviewPhase.tsx             Summary + submit
    │
    ├── PersonalityResultsDashboard.tsx  ← Dashboard orchestrator → ./dashboard/
    ├── dashboard/                       ← DASHBOARD UI MODULE
    │   ├── index.ts                    Barrel export
    │   ├── types.ts                    NormativeResult, tiers, domain lists
    │   ├── RadarChart.tsx              SVG spider chart (framer-motion)
    │   ├── TraitCard.tsx               Expandable trait card
    │   ├── PercentileGauge.tsx         Animated percentile bar (shared)
    │   ├── ArchetypeCard.tsx           Archetype persona display
    │   ├── CrossTraitInsights.ts       Pure logic — 8 cross-trait patterns
    │   ├── LimitationsSection.tsx      Academic limitations + references
    │   ├── ResultsInterstitial.tsx     Gate screen (must-read before viewing)
    │   └── ScoreTable.tsx              Summary table with all scores
    │
    ├── i18n.ts                         ← Bilingual UI strings (EN/VI)
    └── traitInsights.ts                ← Bilingual trait descriptions
```

---

## Module Reference

### Types & Interfaces

**`src/types/personalityTest.ts`** (172 lines)

All shared TypeScript types for the personality test system. Key exports:

| Type | Purpose |
|------|---------|
| `QuestionConfig` | Single question definition (text, textVi, testType, itemNumber, domain, isReversed, isAttentionCheck) |
| `RawResponse` | User's answer to one question |
| `DemographicData` | Gender, university, GPA, student year, self-rated intelligence |
| `TraitScore` | Scored domain result (domain, score, level, raw items) |
| `ArchetypeProfile` | Generated personality archetype (name, emoji, description, strengths, watchOuts) |
| `AttentionCheckResult` | Attention check pass/fail status |
| `PersonalityTestSession` | Full session record (user, demographics, responses, scores, timestamps) |
| `TestConfigDTO` | Client-facing test configuration |

### Scoring Engine (`src/lib/personality/`)

**8 files, ~870 lines** — Split from the original 760-line monolith.

| File | Lines | Responsibility |
|------|-------|----------------|
| `questions/bfi2s.ts` | 121 | BFI-2-S question definitions (31 items) |
| `questions/sd3.ts` | 99 | SD3 question definitions (28 items) |
| `labels.ts` | 61 | LIKERT_MIN/MAX, REVERSE_CONSTANT, thresholds, domain labels (EN/VI) |
| `scoringEngine.ts` | 228 | `validateAttentionChecks()`, `getEffectiveScore()`, `scorePersonalityTest()` |
| `archetypes.ts` | 279 | 6 archetype rules + `generateArchetype()` |
| `config.ts` | 30 | `getTestConfig()` → `TestConfigDTO` |
| `index.ts` | 44 | Master barrel export |

**Backward-compatible barrel:** `src/lib/personalityScoring.ts` (42 lines) re-exports everything, so existing imports work unchanged.

### Normative Data (`src/lib/normative/`)

**4 files, ~624 lines** — Split from the original 581-line monolith.

| File | Lines | Responsibility |
|------|-------|----------------|
| `types.ts` | 48 | `NormativeStats`, `ReferenceGroup`, `PercentileResult` |
| `norms.ts` | 319 | Raw BFI-2/SD3 norms, reference groups (8 groups), facet norms |
| `percentileEngine.ts` | 219 | `normalCDF()`, z-scores, percentile calculations |
| `index.ts` | 38 | Master barrel export |

**Backward-compatible barrel:** `src/lib/normativeData.ts` (35 lines) re-exports everything.

### Data Access Layer

**`src/models/PersonalityTest.ts`** (452 lines)

PostgreSQL CRUD operations using `pgPool`. Key functions:

- `createSession()` — Insert new test session with all scores
- `getSessionById()` — Retrieve single session
- `getSessionsByUser()` — List user's past sessions
- `getAllSessions()` — Admin: get all sessions with filters
- `getSessionStats()` — Aggregate statistics for admin report

### Service Layer

**`src/services/personalityTestService.ts`** (375 lines)

Orchestrates scoring + archetype + persistence. Key functions:

- `submitTest()` — Validate → Score → Generate archetype → Save
- `getTestResult()` — Load session + format for client
- `getUserHistory()` — Get user's session list
- `getAdminReport()` — Aggregate data for admin dashboard

### API Routes

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/personality-test` | GET, POST | List sessions / Submit new test |
| `/api/personality-test/[id]` | GET | Get single session |
| `/api/personality-test/[id]/percentiles` | GET | Calculate percentiles for a session |
| `/api/admin/personality-test/report` | GET | Admin report + Excel export (XLSX) |

### Pages (Server Components)

| Page | Lines | Purpose |
|------|-------|---------|
| `/personality-test/page.tsx` | 68 | Entry point — loads config, renders client |
| `/personality-test/results/[id]/page.tsx` | 76 | Results view — loads session, renders dashboard |

### Wizard UI (`src/components/personality-test/wizard/`)

**10 files, ~923 lines** — Split from the original 873-line monolith.

The wizard is a 6-phase flow: `intro → demographics → bfi → transition → sd3 → review`

| File | Lines | Responsibility |
|------|-------|----------------|
| `constants.ts` | 59 | LIKERT_OPTIONS, demographic option sets, DEFAULT_DEMOGRAPHICS |
| `types.ts` | 66 | TestPhase union, SavedProgress, phase prop interfaces |
| `helpers.ts` | 15 | `getKey()`, `formatTime()` |
| `ProgressHeader.tsx` | 55 | Sticky top bar with animated progress |
| `IntroPhase.tsx` | 117 | Welcome + resume/restart buttons |
| `DemographicsPhase.tsx` | 256 | Full demographic form with validation |
| `QuestionPhase.tsx` | 130 | Paginated questions with Likert scale |
| `TransitionPhase.tsx` | 65 | BFI → SD3 celebration |
| `ReviewPhase.tsx` | 107 | Summary + submit with spinner |
| `index.ts` | 53 | Barrel export |

**Orchestrator:** `PersonalityTestWizard.tsx` (282 lines) — manages state, localStorage persistence, phase transitions.

### Results Dashboard (`src/components/personality-test/dashboard/`)

**10 files, ~1,216 lines** — Split from the original 1,559-line monolith.

| File | Lines | Responsibility |
|------|-------|----------------|
| `types.ts` | 109 | NormativeResult, PercentilesApiResponse, getZTier, TIER_COLORS |
| `RadarChart.tsx` | 127 | SVG spider chart with framer-motion animation |
| `TraitCard.tsx` | 205 | Expandable card, imports PercentileGauge |
| `PercentileGauge.tsx` | 100 | Animated percentile bar — shared by TraitCard & dashboard |
| `ArchetypeCard.tsx` | 79 | Gradient archetype display |
| `CrossTraitInsights.ts` | 150 | Pure logic — 8 cross-trait interaction patterns |
| `LimitationsSection.tsx` | 95 | Collapsible academic limitations + references |
| `ResultsInterstitial.tsx` | 154 | Gate screen with tier explanation + checkbox |
| `ScoreTable.tsx` | 94 | Summary table with all scores |
| `index.ts` | 14 | Barrel export |

**Orchestrator:** `PersonalityResultsDashboard.tsx` (508 lines) — manages percentile fetching, language toggle, layout. Uses PercentileGauge directly in the percentile comparison section.

### Shared UI Utilities

| File | Lines | Purpose |
|------|-------|---------|
| `i18n.ts` | 307 | Bilingual UI string dictionary (EN/VI) |
| `traitInsights.ts` | 255 | Bilingual descriptions for each trait at each level |

### Admin Tools

| File | Lines | Purpose |
|------|-------|---------|
| `admin/personality-test/page.tsx` | 493 | Admin report dashboard with charts + stats |
| `admin/personality-test/verify/page.tsx` | 720 | Scoring verification tool |

### Tests

| File | Tests | Lines | Coverage |
|------|-------|-------|----------|
| `personalityScoring.test.ts` | 39 | 489 | Scoring, reverse scoring, attention checks, archetypes |
| `normativeData.test.ts` | 70 | 602 | z-scores, percentiles, reference groups, edge cases |

---

## Data Flow

```
User takes test
     │
     ▼
PersonalityTestWizard (wizard/)
     │ demographics + 59 responses + duration
     ▼
POST /api/personality-test
     │
     ▼
personalityTestService.submitTest()
     │
     ├─► personalityScoring.validateAttentionChecks()
     ├─► personalityScoring.scorePersonalityTest()
     ├─► personalityScoring.generateArchetype()
     │
     ▼
PersonalityTest.createSession() → PostgreSQL
     │
     ▼
GET /api/personality-test/[id]
     │
     ▼
PersonalityResultsDashboard (dashboard/)
     │
     ├─► GET /api/personality-test/[id]/percentiles
     │        └─► normativeData.calculateAllPercentiles()
     │
     ▼
   Results displayed with radar chart, trait cards, archetype, insights
```

---

## Import Strategy

### For new code — import from modular paths:
```ts
import { scorePersonalityTest } from '@/lib/personality';
import { calculateAllPercentiles } from '@/lib/normative';
import { RadarChart, TraitCard } from '@/components/personality-test/dashboard';
import { QuestionPhase } from '@/components/personality-test/wizard';
```

### For existing code — barrel re-exports maintain backward compatibility:
```ts
// These still work:
import { scorePersonalityTest } from '@/lib/personalityScoring';
import { calculateAllPercentiles } from '@/lib/normativeData';
```

**Rule:** Never import from internal module files directly (e.g., `@/lib/personality/scoringEngine`). Always go through the barrel (`@/lib/personality`).

---

## Key Design Decisions

### 1. BFI-2-S Item Numbering
The `itemNumber` in questions maps to the **official academic BFI-2-S item numbers** (1-60 from the full BFI-2), not sequential 1-30. This is critical for correct reverse-scoring. See `questions/bfi2s.ts`.

### 2. Attention Checks
Two built-in attention check items (one per section). They are included in the question arrays with `isAttentionCheck: true` but excluded from trait scoring. The expected answer for attention checks is `5` (Strongly Agree).

### 3. Reverse Scoring
Uses `REVERSE_CONSTANT - value` (6 - value for 1-5 Likert scale). Applied via `getEffectiveScore()` in `scoringEngine.ts`.

### 4. Normative Reference Groups
8 reference groups combining gender (Male/Female/All) × instrument source data. Default groups auto-selected based on test session's gender field.

### 5. Archetype System
6 rule-based archetypes evaluated in priority order. Each rule has a `match()` function checking specific trait thresholds. Falls back to "Balanced Operator" if no rules match.

### 6. Bilingual UI
All user-facing text supports EN/VI toggle via `i18n.ts`. Questions show English primary + Vietnamese secondary.

### 7. ResultsInterstitial Gate
Users must read limitations and check a confirmation box before viewing results. This is a deliberate design choice to ensure responsible interpretation of personality scores.

---

## Maintenance Checklist

### Adding a new question
1. Add to `src/lib/personality/questions/bfi2s.ts` or `sd3.ts`
2. Update `totalQuestions` check in `config.ts`
3. Add corresponding test cases in `personalityScoring.test.ts`

### Adding a new trait domain
1. Add domain label to `labels.ts` (both EN and VI)
2. Add scoring logic in `scoringEngine.ts`
3. Add normative data in `normative/norms.ts`
4. Add reference groups if needed
5. Add trait insights in `traitInsights.ts`
6. Add to dashboard domain lists in `dashboard/types.ts`
7. Update `RadarChart.tsx` if polygon shape changes
8. Add tests for new domain scoring + percentiles

### Adding a new archetype
1. Add new `ArchetypeRule` to `archetypes.ts` (insert before fallback)
2. Include bilingual name/description/strengths/watchOuts
3. Add test case in `personalityScoring.test.ts`

### Adding a new reference group
1. Add normative stats to `normative/norms.ts`
2. Add entry to `REFERENCE_GROUPS` array with unique ID
3. Update `getDefaultReferenceGroupIds()` if it should be a default
4. Test with `normativeData.test.ts`

### Modifying the UI
- Wizard phases: edit in `wizard/` sub-components
- Results display: edit in `dashboard/` sub-components
- Orchestrators (`PersonalityTestWizard.tsx`, `PersonalityResultsDashboard.tsx`) handle state only — avoid adding visual code there

---

*This document should be updated whenever the personality test architecture changes.*
