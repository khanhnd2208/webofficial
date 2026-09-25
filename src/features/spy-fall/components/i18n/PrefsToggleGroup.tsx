'use client';

import LanguageToggle from '@/features/spy-fall/components/i18n/LanguageToggle';
import DarkModeToggle from '@/features/spy-fall/components/theme/DarkModeToggle';

/** Language + theme controls for game/hub chrome. */
export default function PrefsToggleGroup({ className = '' }: { className?: string }) {
	return (
		<div className={`flex items-center gap-2 ${className}`}>
			<LanguageToggle />
			<DarkModeToggle />
		</div>
	);
}
