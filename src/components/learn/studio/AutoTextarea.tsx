'use client';

export default function AutoTextarea({
	value,
	onChange,
	placeholder,
	className,
}: {
	value: string;
	onChange: (value: string) => void;
	placeholder: string;
	className: string;
}) {
	return (
		<textarea
			className={className}
			value={value}
			placeholder={placeholder}
			rows={1}
			onChange={(event) => onChange(event.target.value)}
			style={{ fieldSizing: 'content' } as React.CSSProperties}
		/>
	);
}
