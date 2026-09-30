import { cn } from '@/features/spy-fall/lib/cn';

export type GameIconName =
	| 'arrow-left'
	| 'book'
	| 'cards'
	| 'check'
	| 'chevron-down'
	| 'compass'
	| 'eye'
	| 'help'
	| 'lantern'
	| 'lock'
	| 'map'
	| 'minus'
	| 'moon'
	| 'passport'
	| 'settings'
	| 'shield'
	| 'sound'
	| 'spy'
	| 'sun'
	| 'target'
	| 'plus'
	| 'users'
	| 'wolf';

interface Props {
	name: GameIconName;
	size?: number;
	className?: string;
	label?: string;
}

const common = {
	fill: 'none',
	stroke: 'currentColor',
	strokeLinecap: 'round' as const,
	strokeLinejoin: 'round' as const,
	strokeWidth: 1.7,
};

function IconArtwork({ name }: { name: GameIconName }) {
	switch (name) {
		case 'arrow-left':
			return <path {...common} d="M19 12H5m6-6-6 6 6 6" />;
		case 'book':
			return (
				<path
					{...common}
					d="M4.5 5.5c2.8-.9 5.3-.4 7.5 1.1 2.2-1.5 4.7-2 7.5-1.1v12c-2.8-.9-5.3-.4-7.5 1.1-2.2-1.5-4.7-2-7.5-1.1zm7.5 1.1v12"
				/>
			);
		case 'cards':
			return (
				<>
					<rect
						{...common}
						x="6"
						y="4"
						width="10"
						height="14"
						rx="1.5"
						transform="rotate(-8 6 4)"
					/>
					<rect {...common} x="8" y="6" width="10" height="14" rx="1.5" transform="rotate(8 8 6)" />
				</>
			);
		case 'check':
			return <path {...common} d="m5 12 4 4L19 6" />;
		case 'chevron-down':
			return <path {...common} d="m6 9 6 6 6-6" />;
		case 'compass':
			return (
				<>
					<circle {...common} cx="12" cy="12" r="8.2" />
					<path
						{...common}
						d="m15.4 8.6-2.2 4.6-4.6 2.2 2.2-4.6zM12 3.8v1.3m0 13.8v1.3m8.2-8.2h-1.3M5.1 12H3.8"
					/>
				</>
			);
		case 'eye':
			return (
				<>
					<path {...common} d="M3.5 12s3.1-5 8.5-5 8.5 5 8.5 5-3.1 5-8.5 5-8.5-5-8.5-5Z" />
					<circle {...common} cx="12" cy="12" r="2.1" />
				</>
			);
		case 'help':
			return (
				<>
					<circle {...common} cx="12" cy="12" r="8.5" />
					<path {...common} d="M9.7 9.2a2.4 2.4 0 1 1 3.9 1.9c-1.1.8-1.6 1.2-1.6 2.5m0 2.5h.01" />
				</>
			);
		case 'lantern':
			return (
				<>
					<path {...common} d="M8 8h8l1.2 11H6.8zM9 8a3 3 0 0 1 6 0M7 12h10M8 19h8" />
					<path {...common} d="M10 5.2h4" />
				</>
			);
		case 'lock':
			return (
				<>
					<rect {...common} x="5" y="10" width="14" height="10" rx="2" />
					<path {...common} d="M8 10V7.8a4 4 0 0 1 8 0V10m-4 4v2" />
				</>
			);
		case 'map':
			return <path {...common} d="m4 6 5-2 6 2 5-2v14l-5 2-6-2-5 2zm5-2v14m6-12v14" />;
		case 'minus':
			return <path {...common} d="M6 12h12" />;
		case 'moon':
			return <path {...common} d="M19 15.2A7.5 7.5 0 0 1 8.8 5a7.5 7.5 0 1 0 10.2 10.2Z" />;
		case 'passport':
			return (
				<>
					<rect {...common} x="5" y="3.5" width="14" height="17" rx="1.5" />
					<circle {...common} cx="12" cy="9" r="2.5" />
					<path {...common} d="M8.5 15.5h7M8.5 18h5" />
				</>
			);
		case 'settings':
			return (
				<>
					<circle {...common} cx="12" cy="12" r="2.8" />
					<path
						{...common}
						d="M19 13.2a7.5 7.5 0 0 0 0-2.4l1.5-1.2-1.8-3-1.8.7a7.5 7.5 0 0 0-2.1-1.2L14.5 4h-5l-.3 2.1a7.5 7.5 0 0 0-2.1 1.2l-1.8-.7-1.8 3L5 10.8a7.5 7.5 0 0 0 0 2.4l-1.5 1.2 1.8 3 1.8-.7a7.5 7.5 0 0 0 2.1 1.2l.3 2.1h5l.3-2.1a7.5 7.5 0 0 0 2.1-1.2l1.8.7 1.8-3z"
					/>
				</>
			);
		case 'shield':
			return (
				<path
					{...common}
					d="M12 3.5 19 6v5.2c0 4.3-2.8 7.4-7 9.3-4.2-1.9-7-5-7-9.3V6zM8.8 12l2.1 2.1 4.4-4.4"
				/>
			);
		case 'sound':
			return (
				<>
					<path
						{...common}
						d="M5 10v4h3l4 3V7l-4 3zM16 9.2a4 4 0 0 1 0 5.6M18.2 7a7 7 0 0 1 0 10"
					/>
				</>
			);
		case 'spy':
			return (
				<>
					<circle {...common} cx="12" cy="7.5" r="3" />
					<path
						{...common}
						d="M7 20c.3-3.7 1.8-5.6 5-5.6s4.7 1.9 5 5.6M8.5 4.5h7M9.5 3l1 2m4-2-1 2"
					/>
				</>
			);
		case 'sun':
			return (
				<>
					<circle {...common} cx="12" cy="12" r="3.5" />
					<path
						{...common}
						d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4m10.6 10.6 1.4 1.4m0-13.4-1.4 1.4M6.7 17.3l-1.4 1.4"
					/>
				</>
			);
		case 'target':
			return (
				<>
					<circle {...common} cx="12" cy="12" r="8" />
					<circle {...common} cx="12" cy="12" r="4" />
					<circle {...common} cx="12" cy="12" r="1" />
					<path {...common} d="M12 2v2m0 16v2m10-10h-2M4 12H2" />
				</>
			);
		case 'plus':
			return <path {...common} d="M12 6v12M6 12h12" />;
		case 'users':
			return (
				<>
					<circle {...common} cx="9" cy="9" r="3" />
					<path
						{...common}
						d="M3.8 19c.5-3 2.2-4.5 5.2-4.5s4.7 1.5 5.2 4.5M16 6.5a2.5 2.5 0 0 1 0 5M17 14.8c2.1.4 3.2 1.7 3.5 3.7"
					/>
				</>
			);
		case 'wolf':
			return (
				<>
					<path
						{...common}
						d="m6 6 1.5 5.5c.2 3.6 2 6.2 4.5 7.5 2.5-1.3 4.3-3.9 4.5-7.5L18 6l-3.1 1.6L12 5.5 9.1 7.6z"
					/>
					<path {...common} d="M9.3 12h.01m5.4 0h.01M10 15.3a3 3 0 0 0 4 0" />
				</>
			);
	}
}

export default function GameIcon({ name, size = 20, className, label }: Props) {
	return (
		<svg
			aria-hidden={label ? undefined : true}
			aria-label={label}
			className={cn('shrink-0', className)}
			fill="none"
			height={size}
			role={label ? 'img' : undefined}
			viewBox="0 0 24 24"
			width={size}
			xmlns="http://www.w3.org/2000/svg"
		>
			<IconArtwork name={name} />
		</svg>
	);
}
