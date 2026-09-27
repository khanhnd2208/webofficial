import type { MessageTree } from '@/features/spy-fall/lib/i18n/types';

import { cheeseEn, cheeseVi } from './cheeseThief';
import { commonEn, commonVi } from './common';
import { errorsEn, errorsVi } from './errors';
import { hubEn, hubVi } from './hub';
import { mafiaEn, mafiaVi } from './mafia';
import { nightMarketEn, nightMarketVi } from './nightMarket';
import { spyEn, spyVi } from './spy';

export const vi: MessageTree = {
	cheese: cheeseVi,
	common: commonVi,
	hub: hubVi,
	spy: spyVi,
	mafia: mafiaVi,
	nightMarket: nightMarketVi,
	errors: errorsVi,
};

export const en: MessageTree = {
	cheese: cheeseEn,
	common: commonEn,
	hub: hubEn,
	spy: spyEn,
	mafia: mafiaEn,
	nightMarket: nightMarketEn,
	errors: errorsEn,
};
