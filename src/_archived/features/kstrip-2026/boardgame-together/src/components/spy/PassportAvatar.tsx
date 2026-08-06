import { cn } from '@/lib/cn';

interface Props {
	name: string;
	avatarSeed: string;
	size?: 'sm' | 'md' | 'lg';
	className?: string;
}

const sizes = {
	sm: 'h-9 w-9 text-sm',
	md: 'h-10 w-10 text-sm',
	lg: 'h-12 w-12 text-base',
};

export default function PassportAvatar({ name, avatarSeed, size = 'md', className }: Props) {
	const hue = parseInt(avatarSeed.slice(0, 4), 36) % 360;
	const initial = name.charAt(0).toUpperCase();

	return (
		<div
			className={cn(
				'relative flex shrink-0 items-center justify-center rounded-md border-2 border-border-strong font-bold shadow-sm',
				sizes[size],
				className,
			)}
			style={{ backgroundColor: `hsl(${hue} 45% 88%)`, color: `hsl(${hue} 40% 28%)` }}
			aria-hidden
		>
			<span className="absolute -top-1 left-1 h-1.5 w-1.5 rounded-full bg-accent" />
			{initial}
		</div>
	);
}
