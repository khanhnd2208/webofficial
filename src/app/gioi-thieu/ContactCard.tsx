import Image from 'next/image';

import { aboutContact, aboutHero } from '@/content/about';

type ChannelId = (typeof aboutContact.channels)[number]['id'];

function ChannelIcon({ id }: { id: ChannelId }) {
	if (id === 'email') {
		return (
			<svg viewBox="0 0 24 24" aria-hidden="true">
				<rect x="3" y="5" width="18" height="14" rx="2.5" />
				<path d="m4 7 8 6 8-6" />
			</svg>
		);
	}
	return (
		<svg viewBox="0 0 24 24" aria-hidden="true">
			<rect x="3" y="3" width="18" height="18" rx="5.5" />
			<circle cx="12" cy="12" r="4.2" />
			<circle cx="17.4" cy="6.6" r="0.6" fill="currentColor" />
		</svg>
	);
}

/** Temporary stand-in for the introduction while it is being rewritten. */
export default function ContactCard() {
	return (
		<main className="personal-book contact-profile-page" data-testid="about-contact">
			<article className="contact-profile">
				<header className="contact-profile-head">
					<div className="contact-profile-avatar">
						<Image
							src="/brand/portrait-journey.png"
							alt={`Chân dung minh họa ${aboutHero.fullName}`}
							fill
							sizes="104px"
							loading="eager"
						/>
					</div>
					<p className="contact-profile-eyebrow">{aboutContact.eyebrow}</p>
					<h1>{aboutContact.title}</h1>
					<p className="contact-profile-name">
						{aboutHero.fullName}
						<span aria-hidden="true"> · </span>
						<br className="contact-profile-break" />
						{aboutHero.role}, {aboutHero.organisation}
					</p>
					<p className="contact-profile-lead">{aboutContact.lead}</p>
				</header>

				<ul className="contact-profile-list" aria-label="Kênh liên hệ">
					{aboutContact.channels.map((channel) => {
						const external = channel.href.startsWith('http');
						return (
							<li key={channel.id} className="contact-profile-item">
								<a
									href={channel.href}
									className="contact-tile"
									data-testid={`contact-${channel.id}`}
									{...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
								>
									<span className={`contact-tile-icon contact-tile-icon--${channel.id}`}>
										<ChannelIcon id={channel.id} />
									</span>
									<span className="contact-tile-body">
										<span className="contact-tile-label">{channel.label}</span>
										<span className="contact-tile-value">{channel.value}</span>
										<span className="contact-tile-description">{channel.description}</span>
									</span>
									<span className="contact-tile-arrow" aria-hidden="true">
										{external ? '↗' : '→'}
									</span>
								</a>
								{'note' in channel ? (
									<p className="contact-tile-note">
										<span aria-hidden="true">i</span>
										{channel.note}
									</p>
								) : null}
							</li>
						);
					})}
				</ul>
			</article>
		</main>
	);
}
