import {
	Be_Vietnam_Pro,
	Inter,
	Lora,
	Source_Serif_4,
} from 'next/font/google';

/*
 * display: 'block' — hides text until font is ready → prevents FOUT (font jumping).
 * Fallback stacks in constants/message.ts match closely so invisible period is minimal.
 */

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

export default function MessagePublicLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const vars = [
		beVietnamPro.variable,
		inter.variable,
		lora.variable,
		sourceSerif.variable,
	].join(' ');

	return <div className={vars}>{children}</div>;
}
