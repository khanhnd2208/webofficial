'use client';

import { getDisplayFontFamily } from '@/constants/message';
import { getMusicTrackLabel } from '@/lib/musicUrl';
import MessageMusicPlayer from '@/components/MessageMusicPlayer';
import type { PublicMessageDTO } from '@/types/message';

interface MessageContentDisplayProps {
	message: PublicMessageDTO;
}

export default function MessageContentDisplay({ message }: MessageContentDisplayProps) {
	const fontFamily = getDisplayFontFamily(message.displayFont);
	const hasCover = !!message.coverImageUrl;
	const hasMusic = !!message.musicTrack;

	return (
		<div
			className="relative min-h-screen bg-[var(--background)]"
			style={{ fontFamily, paddingBottom: hasMusic ? '5.5rem' : '2rem' }}
		>
			{/* Ambient blurred background from cover */}
			{hasCover && (
				<div
					aria-hidden
					className="pointer-events-none fixed inset-0 scale-110 bg-cover bg-center opacity-[0.07] blur-3xl"
					style={{ backgroundImage: `url(${message.coverImageUrl})` }}
				/>
			)}

			{/* ═══ Hero ═══ */}
			<div className="relative">
				{hasCover ? (
					<>
						{/* Cover image — full-width with gradient fade */}
						<div className="relative h-56 w-full overflow-hidden sm:h-72">
							{}
							<img src={message.coverImageUrl} alt="" className="h-full w-full object-cover" />
							{/* Bottom gradient to blend with page bg */}
							<div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[var(--background)]" />
						</div>

						{/* Recipient + Title overlapping the image bottom */}
						<div className="-mt-14 px-6 pb-2 text-center">
							<p
								className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted/80"
								style={{ fontFamily: 'inherit' }}
							>
								Lời nhắn dành cho
							</p>
							<h1
								className="mt-1 text-[2rem] font-black leading-tight tracking-tight text-foreground sm:text-4xl"
								style={{ fontFamily }}
							>
								{message.recipientName}
							</h1>
							<p className="mt-2 text-base text-foreground-secondary" style={{ fontFamily }}>
								{message.title}
							</p>
						</div>
					</>
				) : (
					/* No cover — minimal header */
					<div className="px-6 pt-14 pb-6 text-center">
						<p className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted">
							Lời nhắn dành cho
						</p>
						<h1
							className="mt-2 text-[2rem] font-black leading-tight tracking-tight text-foreground sm:text-4xl"
							style={{ fontFamily }}
						>
							{message.recipientName}
						</h1>
						<p className="mt-2 text-base text-foreground-secondary" style={{ fontFamily }}>
							{message.title}
						</p>
					</div>
				)}
			</div>

			{/* ═══ Message content ═══ */}
			{message.content && (
				<div className="relative px-4 pb-4 sm:px-6">
					<div
						className="tiptap-content prose prose-base dark:prose-invert mx-auto max-w-prose rounded-2xl border border-border/50 bg-surface/80 px-5 py-6 shadow-sm backdrop-blur-sm sm:px-8 sm:py-8"
						style={{ fontFamily }}
						dangerouslySetInnerHTML={{ __html: message.content }}
					/>
				</div>
			)}

			{/* ═══ Music player ═══ */}
			{hasMusic && (
				<MessageMusicPlayer
					trackId={message.musicTrack}
					trackLabel={getMusicTrackLabel(message.musicTrack)}
				/>
			)}
		</div>
	);
}
