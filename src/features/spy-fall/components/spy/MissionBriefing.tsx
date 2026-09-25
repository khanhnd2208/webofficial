'use client';

import { isSoundsEnabled, setSoundsEnabled } from '@/features/spy-fall/lib/sounds';

import { useT } from '@/features/spy-fall/components/i18n/LocaleProvider';
import { Sheet } from '@/features/spy-fall/components/ui';
import { getGuideSections, getHonorRules } from '@/features/spy-fall/lib/spy/i18n';

export function BriefingContent() {
	const t = useT();
	const sections = getGuideSections(t);
	const honorRules = getHonorRules(t);

	return (
		<div className="space-y-4">
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

export function BriefingSheet({
	open,
	onClose,
}: {
	open: boolean;
	onClose: () => void;
}) {
	const t = useT();
	return (
		<Sheet open={open} onClose={onClose} title={t('spy.guide.title')}>
			<BriefingContent />
		</Sheet>
	);
}
