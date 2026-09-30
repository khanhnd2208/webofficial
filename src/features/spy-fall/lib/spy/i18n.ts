import type { MessageParams } from '@/features/board-game-shared/lib/i18n/types';
import type { PlayerRole } from '@/features/spy-fall/types/spyGame';

export type TranslateFn = (key: string, params?: MessageParams) => string;

export function getRoleLabel(t: TranslateFn, role: PlayerRole): string {
	return t(`spy.roles.${role}`);
}

export function getGuideSections(t: TranslateFn) {
	return [
		{ title: t('spy.guide.sections.whoTitle'), body: t('spy.guide.sections.whoBody') },
		{ title: t('spy.guide.sections.startTitle'), body: t('spy.guide.sections.startBody') },
		{ title: t('spy.guide.sections.talkTitle'), body: t('spy.guide.sections.talkBody') },
		{ title: t('spy.guide.sections.voteTitle'), body: t('spy.guide.sections.voteBody') },
		{ title: t('spy.guide.sections.elimTitle'), body: t('spy.guide.sections.elimBody') },
		{ title: t('spy.guide.sections.winTitle'), body: t('spy.guide.sections.winBody') },
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
