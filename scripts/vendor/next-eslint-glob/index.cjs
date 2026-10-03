const { globSync: tinyGlobSync } = require('tinyglobby');
const { isAbsolute } = require('node:path');

// @next/eslint-plugin-next only uses globSync to locate project root directories.
// tinyglobby expands literal directories by default; fast-glob does not.
function globSync(patterns, options = {}) {
	const inputs = Array.isArray(patterns) ? patterns : [patterns];
	const absolute = options.absolute ?? inputs.every((pattern) => isAbsolute(pattern));
	return tinyGlobSync(patterns, { ...options, absolute, expandDirectories: false }).map((entry) =>
		entry.length > 1 ? entry.replace(/\/$/, '') : entry,
	);
}

module.exports = { globSync };
