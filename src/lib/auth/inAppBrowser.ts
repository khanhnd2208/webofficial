/** Best-effort detection; embedded browsers do not all identify themselves. */
export function inAppBrowserName(userAgent: string): string | null {
	if (/Zalo/i.test(userAgent)) return 'Zalo';
	if (/FBAN|FBAV/i.test(userAgent)) return 'Facebook/Messenger';
	if (/Instagram/i.test(userAgent)) return 'Instagram';
	if (/\bLine\//i.test(userAgent)) return 'LINE';
	if (/;\s*wv[;)\s]/i.test(userAgent)) return 'trình duyệt trong ứng dụng';
	return null;
}
