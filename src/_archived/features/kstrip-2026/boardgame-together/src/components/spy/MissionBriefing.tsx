'use client';

import { isSoundsEnabled, setSoundsEnabled } from '@/lib/sounds';

import { useT } from '@/components/i18n/LocaleProvider';
import { Button, Sheet } from '@/components/ui';
import { getGuideSections, getGuideSectionsHiddenRoles, getHonorRules } from '@/lib/spy/i18n';

export function BriefingContent({ hideRoles }: { hideRoles?: boolean }) {
	const t = useT();
	const sections = hideRoles ? getGuideSectionsHiddenRoles(t) : getGuideSections(t);
	const honorRules = getHonorRules(t);

	return (
		<div className="space-y-4">
			<div className="rounded-xl border border-dashed border-stamp/40 bg-accent-subtle/50 p-4 text-sm text-foreground-secondary">
				<strong className="text-ink">{t('spy.guide.title')}</strong>
				{hideRoles
					? ` — ${t('spy.guide.sections.hiddenBody')}`
					: ` — ${t('spy.guide.sections.whoBody')}`}
			</div>
			{sections.map((s, i) => (
				<div key={s.title}>
					<h3 className="font-display text-sm font-semibold text-ink">
						{i + 1}. {s.title}
					</h3>
					<p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
				</div>
			))}
			<div className="border-t border-border pt-4">
				<h3 className="font-display mb-2 text-sm font-semibold text-ink">
					{t('spy.guide.honorTitle')}
				</h3>
				<ul className="list-disc space-y-1 pl-4 text-sm text-muted-foreground">
					{honorRules.map((r) => (
						<li key={r}>{r}</li>
					))}
				</ul>
			</div>
			<label className="flex items-center gap-2 text-sm">
				<input
					type="checkbox"
					defaultChecked={typeof window !== 'undefined' && isSoundsEnabled()}
					onChange={(e) => setSoundsEnabled(e.target.checked)}
					className="h-4 w-4 rounded border-border"
				/>
				{t('spy.guide.sounds')}
			</label>
		</div>
	);
}

export function BriefingFab({ onOpen }: { onOpen: () => void }) {
	const t = useT();
	return (
		<Button
			variant="primary"
			size="md"
			onClick={onOpen}
			className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-40 h-12 w-12 rounded-full p-0 shadow-lg"
			aria-label={t('spy.guide.title')}
		>
			?
		</Button>
	);
}

export function BriefingSheet({
	open,
	onClose,
	hideRoles,
}: {
	open: boolean;
	onClose: () => void;
	hideRoles?: boolean;
}) {
	const t = useT();
	return (
		<Sheet open={open} onClose={onClose} title={t('spy.guide.title')}>
			<BriefingContent hideRoles={hideRoles} />
		</Sheet>
	);
}
