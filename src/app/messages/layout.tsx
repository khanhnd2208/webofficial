import { redirect } from 'next/navigation';
import {
	Be_Vietnam_Pro,
	Inter,
	Lora,
	Source_Serif_4,
} from 'next/font/google';

import { auth } from '@/lib/auth';

const beVietnamPro = Be_Vietnam_Pro({
	variable: '--font-be-vietnam-pro',
	subsets: ['latin', 'vietnamese'],
	weight: ['300', '400', '500', '600'],
	display: 'block',
});

const inter = Inter({
	variable: '--font-inter',
	subsets: ['latin', 'latin-ext'],
	weight: ['300', '400', '500', '600'],
	display: 'block',
});

const lora = Lora({
	variable: '--font-lora',
	subsets: ['latin', 'vietnamese'],
	weight: ['400', '500', '600', '700'],
	display: 'block',
});

const sourceSerif = Source_Serif_4({
	variable: '--font-source-serif',
	subsets: ['latin', 'vietnamese'],
	weight: ['300', '400', '600', '700'],
	display: 'block',
});

export default async function MessagesLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const session = await auth();
	if (!session?.user) {
		redirect('/login?from=/messages');
	}

	const vars = [
		beVietnamPro.variable,
		inter.variable,
		lora.variable,
		sourceSerif.variable,
	].join(' ');

	return <div className={vars}>{children}</div>;
}
