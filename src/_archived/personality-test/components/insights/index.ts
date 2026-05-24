/* ════════════════════════════════════════════════════════════════════════
   insights/index.ts — Barrel export for all trait insight content

   Usage:
     import { getTraitInsight } from '../insights';
     const insight = getTraitInsight('extraversion', 'vi');
   ════════════════════════════════════════════════════════════════════════ */

import type { PersonalityDomain } from '@/types/personalityTest';
import type { Lang } from '../i18n';

export type { TraitInsightContent } from './_types';

// ─── OCEAN ─────────────────────────────────────────────────────────────────────
import { extraversionEN, extraversionVI } from './extraversion';
import { agreeablenessEN, agreeablenessVI } from './agreeableness';
import { conscientiousnessEN, conscientiousnessVI } from './conscientiousness';
import { negativeEmotionalityEN, negativeEmotionalityVI } from './negativeEmotionality';
import { openMindednessEN, openMindednessVI } from './openMindedness';

// ─── Dark Triad ────────────────────────────────────────────────────────────────
import { machiavellianism_EN, machiavellianism_VI } from './machiavellianism';
import { narcissismEN, narcissismVI } from './narcissism';
import { psychopathyEN, psychopathyVI } from './psychopathy';

import type { TraitInsightContent } from './_types';

type InsightMap = Record<PersonalityDomain, TraitInsightContent>;

const EN: InsightMap = {
	extraversion: extraversionEN,
	agreeableness: agreeablenessEN,
	conscientiousness: conscientiousnessEN,
	negativeEmotionality: negativeEmotionalityEN,
	openMindedness: openMindednessEN,
	machiavellianism: machiavellianism_EN,
	narcissism: narcissismEN,
	psychopathy: psychopathyEN,
};

const VI: InsightMap = {
	extraversion: extraversionVI,
	agreeableness: agreeablenessVI,
	conscientiousness: conscientiousnessVI,
	negativeEmotionality: negativeEmotionalityVI,
	openMindedness: openMindednessVI,
	machiavellianism: machiavellianism_VI,
	narcissism: narcissismVI,
	psychopathy: psychopathyVI,
};

export function getTraitInsight(
	domain: PersonalityDomain,
	lang: Lang,
): TraitInsightContent {
	return lang === 'vi' ? VI[domain] : EN[domain];
}
