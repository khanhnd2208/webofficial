/* ════════════════════════════════════════════════════════════════════════
   Archetype Engine

   Personality archetype/persona profile generation.
   Matches scored trait profiles against a set of archetype rules
   and returns the best-fitting persona.

   Each archetype has:
   - A match function that scores how well the profile fits
   - Strengths, blindspots, and narrative text
   - A color theme for UI rendering
   ════════════════════════════════════════════════════════════════════════ */

import type {
	OceanScores,
	DarkTriadScores,
	ArchetypeProfile,
} from '@/types/personalityTest';

// ─── Archetype Rule Interface ──────────────────────────────────────────────────

interface ArchetypeRule {
	name: string;
	tagline: string;
	icon: string;
	colorTheme: ArchetypeProfile['colorTheme'];
	/** Returns a priority score (0 = no match). Higher = stronger match. */
	match: (ocean: OceanScores, dark: DarkTriadScores) => number;
	strengths: string[];
	blindspots: string[];
	narrative: string;
}

// ─── Archetype Rules ───────────────────────────────────────────────────────────

const ARCHETYPE_RULES: ArchetypeRule[] = [
	// ── 1. The Strategic Executor ──
	{
		name: 'The Strategic Executor',
		tagline: 'Discipline meets strategic awareness',
		icon: '♟️',
		colorTheme: 'amber',
		match: (o, d) => {
			let score = 0;
			if (o.conscientiousness.level === 'high') score += 3;
			if (d.machiavellianism.level === 'high') score += 3;
			if (o.agreeableness.level !== 'high') score += 1;
			return score >= 5 ? score : 0;
		},
		strengths: [
			'Exceptional project execution — delivers results regardless of obstacles',
			'Strategic resource allocation — reads organizational politics flawlessly',
			'Long-term planning with pragmatic flexibility when needed',
			'High reliability under ambiguous or high-pressure conditions',
		],
		blindspots: [
			'May sacrifice team morale for efficiency — "the mission over the people"',
			'Prone to information hoarding as a power lever',
			'Risk of becoming the person who "always has an agenda"',
			'Can erode trust over time due to perceived inauthenticity',
			'The "Brilliant Jerk" trap: organizations ultimately remove people who deliver results but destroy team culture — no matter how talented they are',
		],
		narrative:
			'You combine the disciplined work ethic of high Conscientiousness with the strategic calculus of Machiavellianism. In organizations, you are the person who gets things done — efficiently, precisely, and with full awareness of the political landscape. Your danger zone? When your pragmatism crosses into manipulation, you risk becoming the leader people respect but never truly trust. Research consistently shows: long-term career success depends more on trust than on tactics.',
	},

	// ── 2. The Charismatic Disruptor ──
	{
		name: 'The Charismatic Disruptor',
		tagline: 'Magnetic presence with a volatile core',
		icon: '⚡',
		colorTheme: 'rose',
		match: (o, d) => {
			let score = 0;
			if (o.extraversion.level === 'high') score += 3;
			if (d.narcissism.level === 'high') score += 3;
			if (o.openMindedness.level === 'high') score += 1;
			return score >= 5 ? score : 0;
		},
		strengths: [
			'Exceptional at inspiring and rallying teams around a vision',
			'Natural confidence that opens doors and creates opportunities',
			'High energy and enthusiasm that is genuinely contagious',
			'Comfortable taking bold risks when others hesitate',
		],
		blindspots: [
			'Feedback resistance — may dismiss criticism as jealousy or incompetence',
			'Risk of over-promising and under-delivering to maintain image',
			'Can unconsciously create a "cult of personality" that stifles dissent',
			'May prioritize personal glory over collective success',
		],
		narrative:
			'Your high Extraversion gives you magnetic social energy, amplified by a Narcissistic confidence that makes you a natural center of gravity. You thrive in roles requiring vision-casting and persuasion. The critical blindspot: you may confuse admiration for connection, and your need for validation can sabotage the very relationships you depend on.',
	},

	// ── 3. The Detached Analyst ──
	{
		name: 'The Detached Analyst',
		tagline: 'Calm intellect, high cost of disconnection',
		icon: '🏛️',
		colorTheme: 'indigo',
		match: (o, d) => {
			let score = 0;
			if (o.openMindedness.level === 'high') score += 2;
			if (o.negativeEmotionality.level === 'low') score += 2;
			if (d.psychopathy.level === 'high') score += 3;
			if (o.agreeableness.level === 'low') score += 1;
			return score >= 5 ? score : 0;
		},
		strengths: [
			'Calm under crisis — can make clear-headed decisions when others panic',
			'Sees systemic patterns others miss due to analytical open-mindedness',
			'Capable of making hard, unpopular decisions without emotional paralysis',
			'Valuable in restructuring, turnarounds, and crisis leadership',
		],
		blindspots: [
			'Emotional detachment can drift into indifference to human cost — without you noticing',
			'May unconsciously view people as "resources" to be optimized, eroding team trust',
			'Risk of creating toxic environments disguised as "high performance" culture',
			'Long-term isolation as colleagues learn to keep their distance — this is the highest career cost of this profile',
			'Organizations ultimately remove people who deliver results but destroy team culture (the "Brilliant Jerk" effect)',
		],
		narrative:
			'Your combination of Open-Mindedness, emotional stability (low Negative Emotionality), and elevated subclinical Psychopathy creates a profile of intellectual fearlessness. You can design complex systems and make tough calls others cannot. However — and this is critical — your emotional detachment, while an asset in crisis, becomes a serious liability in sustained relationships. The research is clear: the long-term cost of low empathy in leadership is isolation, talent flight, and eventual organizational pushback.',
	},

	// ── 4. The Empathic Strategist ──
	{
		name: 'The Empathic Strategist',
		tagline: 'Heart of gold, mind of a chess player',
		icon: '🎭',
		colorTheme: 'teal',
		match: (o, d) => {
			let score = 0;
			if (o.agreeableness.level === 'high') score += 3;
			if (d.machiavellianism.level === 'moderate' || d.machiavellianism.level === 'high') score += 2;
			if (o.conscientiousness.level === 'high') score += 1;
			if (d.psychopathy.level === 'low') score += 1;
			return score >= 5 ? score : 0;
		},
		strengths: [
			'Reads people with remarkable accuracy — combines empathy with strategic thinking',
			'Builds genuine alliances while maintaining awareness of political dynamics',
			'Excellent mediator — uses social intelligence to resolve complex conflicts',
			'Trusted enough to receive confidential information, smart enough to use it wisely',
		],
		blindspots: [
			'Internal conflict between genuine care and calculated moves can cause stress',
			'Risk of being perceived as "two-faced" if strategy overrides authenticity',
			'May over-invest emotionally in strategic relationships, leading to burnout',
			'Could rationalize manipulative behavior as "helping" others',
		],
		narrative:
			'You are the rare profile that balances genuine warmth with strategic awareness. High Agreeableness gives you authentic empathy, while your Machiavellian awareness means you understand the game even if you don\'t always play it. Your challenge is maintaining integrity when your strategic mind tempts you to "manage" people rather than truly connect with them.',
	},

	// ── 5. The Vulnerable Perfectionist ──
	{
		name: 'The Vulnerable Perfectionist',
		tagline: 'Driven by anxiety, sharpened by standards',
		icon: '🔬',
		colorTheme: 'purple',
		match: (o, d) => {
			let score = 0;
			if (o.conscientiousness.level === 'high') score += 3;
			if (o.negativeEmotionality.level === 'high') score += 3;
			if (d.narcissism.level === 'low' || d.narcissism.level === 'moderate') score += 1;
			return score >= 5 ? score : 0;
		},
		strengths: [
			'Exceptionally thorough — catches errors others overlook due to heightened vigilance',
			'Self-aware about limitations in ways that drive genuine improvement',
			'High accountability — takes ownership of failures rather than deflecting',
			'Produces consistently high-quality work fueled by intrinsic standards',
		],
		blindspots: [
			'Paralysis by analysis — the pursuit of perfection can delay critical decisions',
			'Chronic self-doubt undermines leadership presence and authority',
			'Risk of burnout from sustained emotional intensity paired with high standards',
			'May inadvertently project their anxiety onto team members',
		],
		narrative:
			'Your high Conscientiousness drives you to excel, but it\'s fueled by an anxious engine (high Negative Emotionality). You are the person who triple-checks everything — not because you\'re thorough by nature, but because your anxiety won\'t let you rest until it\'s right. This can produce extraordinary work, but the personal cost is high. Your growth edge: learning that "good enough" is sometimes excellent.',
	},

	// ── 6. The Balanced Operator ──
	{
		name: 'The Balanced Operator',
		tagline: 'Steady hands, clear conscience',
		icon: '⚖️',
		colorTheme: 'emerald',
		match: (o, d) => {
			let score = 0;
			// All dark triad traits low
			if (d.machiavellianism.level === 'low') score += 2;
			if (d.narcissism.level === 'low') score += 2;
			if (d.psychopathy.level === 'low') score += 2;
			// At least moderate positive traits
			if (o.agreeableness.level !== 'low') score += 1;
			if (o.conscientiousness.level !== 'low') score += 1;
			return score >= 6 ? score : 0;
		},
		strengths: [
			'High interpersonal trust — teams feel safe and supported around you',
			'Consistent, reliable performance without the drama or politics',
			'Excellent at building sustainable, healthy team cultures',
			'Genuine integrity that creates long-term organizational loyalty',
		],
		blindspots: [
			'May be outmaneuvered by more politically savvy colleagues',
			'Risk of being overlooked for promotions in highly competitive environments',
			'Could be slow to recognize or respond to manipulative behavior in others',
			'May avoid necessary confrontation in pursuit of harmony',
		],
		narrative:
			'Your profile shows low Dark Triad tendencies paired with constructive personality traits. You are the organizational backbone — trustworthy, ethical, and consistent. In healthy organizations, you thrive and rise. The risk? In toxic environments, your integrity can become a disadvantage when others play games you refuse to engage in.',
	},
];

// ─── Fallback ──────────────────────────────────────────────────────────────────

/**
 * Fallback archetype when no specific rule matches strongly.
 */
const FALLBACK_ARCHETYPE: ArchetypeProfile = {
	name: 'The Complex Mosaic',
	tagline: 'Defying simple categorization',
	icon: '🧩',
	colorTheme: 'purple',
	strengths: [
		'Multifaceted personality that adapts across different contexts',
		'No single dominant tendency — provides versatility and flexibility',
		'Capable of understanding diverse perspectives due to mixed trait profile',
		'Harder to predict, which can be an advantage in negotiations and creativity',
	],
	blindspots: [
		'May struggle with a clear sense of professional identity or direction',
		'Mixed motivations can create internal conflict during high-stakes decisions',
		'Others may find it hard to "read" you, creating trust ambiguity',
		'Risk of context-switching stress as different situations activate different traits',
	],
	narrative:
		'Your personality profile doesn\'t fit neatly into a single archetype — and that\'s not a weakness. You are a complex blend of light and shadow traits that manifests differently depending on context. Your growth opportunity lies in developing self-awareness about which "version" of yourself shows up in different situations, and making that a conscious choice rather than an automatic reaction.',
};

// ─── Public API ────────────────────────────────────────────────────────────────

/**
 * Match scores against archetype rules and return the best-fit persona.
 */
export function generateArchetype(
	ocean: OceanScores,
	darkTriad: DarkTriadScores
): ArchetypeProfile {
	let bestMatch: ArchetypeRule | null = null;
	let bestScore = 0;

	for (const rule of ARCHETYPE_RULES) {
		const score = rule.match(ocean, darkTriad);
		if (score > bestScore) {
			bestScore = score;
			bestMatch = rule;
		}
	}

	if (!bestMatch) {
		return FALLBACK_ARCHETYPE;
	}

	return {
		name: bestMatch.name,
		tagline: bestMatch.tagline,
		icon: bestMatch.icon,
		colorTheme: bestMatch.colorTheme,
		strengths: bestMatch.strengths,
		blindspots: bestMatch.blindspots,
		narrative: bestMatch.narrative,
	};
}
