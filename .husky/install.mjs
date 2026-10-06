// npm runs `prepare` on every install, including the production-only install on the VPS
// (`npm ci --omit=dev`), where husky is not installed. Install the git hooks on developer
// machines and skip everywhere else instead of failing the install.
if (
	process.env.HUSKY === '0' ||
	process.env.CI === 'true' ||
	process.env.NODE_ENV === 'production'
) {
	process.exit(0);
}

try {
	const { default: husky } = await import('husky');
	const message = husky();
	if (message) console.log(message);
} catch (error) {
	if (error?.code !== 'ERR_MODULE_NOT_FOUND') throw error;
	console.log('husky is not installed; skipping git hooks');
}
