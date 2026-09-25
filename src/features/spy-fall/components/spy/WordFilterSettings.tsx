'use client';

import { useMemo, useState } from 'react';

import { useLocale } from '@/features/spy-fall/components/i18n/LocaleProvider';
import { Field, Select } from '@/features/spy-fall/components/ui';
import { SPY_TAGS, SPY_TOPICS, type SpyTag } from '@/features/spy-fall/config/spyGame';
import { cn } from '@/features/spy-fall/lib/cn';
import { filterWordPairs, wordBankFor } from '@/features/spy-fall/lib/spy/wordBank';

interface Props {
	topic: string;
	excludedTags: SpyTag[];
	onChange: (settings: { topic?: string; excludedTags?: SpyTag[] }) => void;
}

/** Host-only: pick a topic and exclude whole tag groups, with a live count of what's left. */
export default function WordFilterSettings({ topic, excludedTags, onChange }: Props) {
	const { locale, t } = useLocale();
	// Local copy so chips respond instantly; the next room poll re-syncs it.
	const [excluded, setExcluded] = useState<SpyTag[]>(excludedTags);
	const serverKey = excludedTags.join(',');
	const [syncedKey, setSyncedKey] = useState(serverKey);
	if (serverKey !== syncedKey) {
		setSyncedKey(serverKey);
		setExcluded(excludedTags);
	}

	const bank = wordBankFor(locale);
	const remaining = useMemo(
		() => filterWordPairs(topic, bank, excluded).length,
		[topic, bank, excluded],
	);

	function toggle(tag: SpyTag) {
		const next = excluded.includes(tag)
			? excluded.filter((other) => other !== tag)
			: SPY_TAGS.filter((other) => other === tag || excluded.includes(other));
		setExcluded(next);
		onChange({ excludedTags: next });
	}

	return (
		<div className="space-y-4">
			<Field label={t('spy.lobby.topic')}>
				<Select value={topic} onChange={(e) => onChange({ topic: e.target.value })}>
					<option value="any">{t('spy.lobby.topicAny')}</option>
					{SPY_TOPICS.map((value) => (
						<option key={value} value={value}>
							{t(`spy.topics.${value}`)}
						</option>
					))}
				</Select>
			</Field>

			<div className="space-y-2">
				<div className="flex items-baseline justify-between gap-2">
					<p className="text-sm font-medium text-foreground">{t('spy.wordFilter.excludeTitle')}</p>
					{excluded.length > 0 ? (
						<button
							type="button"
							className="text-xs font-medium text-accent hover:underline"
							onClick={() => {
								setExcluded([]);
								onChange({ excludedTags: [] });
							}}
						>
							{t('spy.wordFilter.includeAll')}
						</button>
					) : null}
				</div>
				<p className="text-xs text-muted">{t('spy.wordFilter.excludeHint')}</p>
				<div className="flex flex-wrap gap-1.5">
					{SPY_TAGS.map((tag) => {
						const isExcluded = excluded.includes(tag);
						return (
							<button
								key={tag}
								type="button"
								aria-pressed={isExcluded}
								onClick={() => toggle(tag)}
								className={cn(
									'rounded-full border px-2.5 py-1 text-xs font-medium transition',
									isExcluded
										? 'border-border bg-surface-secondary text-muted line-through'
										: 'border-accent/30 bg-accent-subtle text-accent hover:bg-accent-subtle/70',
								)}
							>
								{t(`spy.tags.${tag}`)}
								{isExcluded ? (
									<span className="sr-only"> ({t('spy.wordFilter.excluded')})</span>
								) : null}
							</button>
						);
					})}
				</div>
				<p
					className={cn('text-xs', remaining === 0 ? 'text-danger' : 'text-muted')}
					role={remaining === 0 ? 'alert' : undefined}
				>
					{remaining === 0
						? t('spy.wordFilter.empty')
						: t('spy.wordFilter.pairCount', { count: remaining })}
				</p>
			</div>
		</div>
	);
}
