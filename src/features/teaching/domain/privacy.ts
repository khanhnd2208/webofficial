export function maskStudentCode(studentCode: string): string {
	const visible = Math.min(2, Math.max(0, studentCode.length - 1));
	return `${'*'.repeat(Math.max(0, studentCode.length - visible))}${visible ? studentCode.slice(-visible) : ''}`;
}
