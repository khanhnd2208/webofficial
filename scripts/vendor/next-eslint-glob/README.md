# Next ESLint directory glob adapter

The npm override applies only to `@next/eslint-plugin-next`'s `fast-glob` dependency. Its current implementation uses only `globSync(pattern, { onlyDirectories: true })` in `get-root-dirs.js`. This small package supplies that API using the already-used `tinyglobby@0.2.17`, without `micromatch` or `braces`.

The adapter explicitly disables `expandDirectories` and removes trailing directory separators to retain fast-glob's root-directory behavior. It is not a general fast-glob replacement: other consumers must not be overridden to this package. The tests exercise the installed Next plugin, its root-directory helper and its internal-link ESLint rule, including literal, wildcard, brace and array patterns, and deeply nested braces.

The override's relative path is resolved from `node_modules/@next/eslint-plugin-next`, not from the repository root. `.npmrc` enables `install-links` so npm packs the local package into node_modules rather than leaving a source symlink; this makes `npm ci` and deployment pruning reproducible. The adapter is development-only and has no lifecycle scripts. The VPS dependency-cache stamp includes `scripts/vendor` so changing local package source forces a fresh install.

Run `npm run test:lint-tooling`. The normal `test:unit` command includes these tests. When the upstream plugin removes this dependency or a safe braces release is available, replace this override with the upstream fix and remove this package after verifying the rule still works.

References:

- [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)
- [tinyglobby migration guide](https://superchupu.dev/tinyglobby/migration)
