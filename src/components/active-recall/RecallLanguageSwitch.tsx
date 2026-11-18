'use client';

export type RecallLanguage = 'en' | 'vi' | 'split';

const OPTIONS: { value: RecallLanguage; label: string; name: string }[] = [
	{ value: 'en', label: 'EN', name: 'EN' },
	{ value: 'vi', label: 'VI', name: 'VI' },
	{ value: 'split', label: 'EN+VI', name: 'Hai ngôn ngữ' },
];

/**
 * One control with three states, so the selected language is always the dark option.
 * The VI option nudges a few times while the learner is still on English; the
 * animation stops on its own instead of pulsing for the whole session.
 */
export default function RecallLanguageSwitch({
	value,
	onChange,
}: {
	value: RecallLanguage;
	onChange: (value: RecallLanguage) => void;
}) {
	return (
		<div className="recall-lang-switch" role="radiogroup" aria-label="Ngôn ngữ">
			{OPTIONS.map((option) => (
				<button
					key={option.value}
					type="button"
					role="radio"
					aria-checked={value === option.value}
					aria-label={option.name === option.label ? undefined : option.name}
					className={`recall-lang-option${
						option.value === 'vi' && value === 'en' ? ' is-nudge' : ''
					}`}
					onClick={() => {
						if (value !== option.value) onChange(option.value);
					}}
				>
					{option.label}
				</button>
			))}
		</div>
	);
}
