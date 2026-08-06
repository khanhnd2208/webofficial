import type { MessageParams } from '@/lib/i18n/types';
import type { GamePhase, PlayerRole } from '@/types/spyGame';

export type TranslateFn = (key: string, params?: MessageParams) => string;

/** English role names (stable identifiers for display). Prefer `t('spy.roles.*')` in UI. */
export const ROLE_LABELS: Record<PlayerRole, string> = {
	civilian: 'Officer',
	spy: 'Spy',
	mrwhite: 'Mr. White',
};

export function getPhaseLabel(t: TranslateFn, phase: GamePhase): string {
	return t(`spy.phases.${phase}`);
}

export function getRoleLabel(t: TranslateFn, role: PlayerRole): string {
	return t(`spy.roles.${role}`);
}

export function getRoleHint(t: TranslateFn, role: PlayerRole): string {
	return t(`spy.roleHints.${role}`);
}

export function getPhaseHint(t: TranslateFn, phase: GamePhase): string | undefined {
	const key = `spy.phaseHints.${phase}`;
	const msg = t(key);
	return msg === key ? undefined : msg;
}

export function getGuideSections(t: TranslateFn) {
	return [
		{ title: t('spy.guide.sections.whoTitle'), body: t('spy.guide.sections.whoBody') },
		{ title: t('spy.guide.sections.startTitle'), body: t('spy.guide.sections.startBody') },
		{ title: t('spy.guide.sections.talkTitle'), body: t('spy.guide.sections.talkBody') },
		{ title: t('spy.guide.sections.voteTitle'), body: t('spy.guide.sections.voteBody') },
		{ title: t('spy.guide.sections.elimTitle'), body: t('spy.guide.sections.elimBody') },
		{ title: t('spy.guide.sections.winTitle'), body: t('spy.guide.sections.winBody') },
		{ title: t('spy.guide.sections.mwTitle'), body: t('spy.guide.sections.mwBody') },
	];
}

/** In-room briefing when hideRoles is on — no Mr. White, no role identity. */
export function getGuideSectionsHiddenRoles(t: TranslateFn) {
	return [
		{ title: t('spy.guide.sections.hiddenTitle'), body: t('spy.guide.sections.hiddenBody') },
		{ title: t('spy.guide.sections.startTitle'), body: t('spy.guide.sections.startBody') },
		{ title: t('spy.guide.sections.talkTitle'), body: t('spy.guide.sections.hiddenTalkBody') },
		{ title: t('spy.guide.sections.voteTitle'), body: t('spy.guide.sections.hiddenVoteBody') },
		{ title: t('spy.guide.sections.winTitle'), body: t('spy.guide.sections.hiddenWinBody') },
	];
}

export function getHonorRules(t: TranslateFn) {
	return [
		t('spy.guide.honor.noPeek'),
		t('spy.guide.honor.noDm'),
		t('spy.guide.honor.noSearch'),
		t('spy.guide.honor.noPhoto'),
		t('spy.guide.honor.fair'),
	];
}
