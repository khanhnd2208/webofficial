export function maskStudentCode(studentCode: string): string {
	const visible = Math.min(2, Math.max(0, studentCode.length - 1));
	return `${'*'.repeat(Math.max(0, studentCode.length - visible))}${visible ? studentCode.slice(-visible) : ''}`;
}

/**
 * Display form of a masked code: "********45" reads as "•••45". The stored mask stays
 * full length; this only shortens what a person sees. Unmasked codes pass through.
 */
export function formatStudentCode(studentCode: string): string {
	return studentCode.replace(/^\*{2,}/, '•••');
}
