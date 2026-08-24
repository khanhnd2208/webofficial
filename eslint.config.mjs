import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "@next/next/no-img-element": "off",
      // Allow _ prefix to indicate intentionally unused vars/args
      "@typescript-eslint/no-unused-vars": ["warn", {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_",
        "caughtErrorsIgnorePattern": "^_",
      }],
      // LazyMotion strict requires `m`, not `motion`
      "no-restricted-imports": ["error", {
        paths: [{
          name: "framer-motion",
          importNames: ["motion"],
          message: "Use `m` from framer-motion inside LazyMotion strict (see MotionProvider).",
        }],
      }],
    },
  },
  {
    // Archived research code is not under LazyMotion site shell
    files: ["src/_archived/**"],
    rules: {
      "no-restricted-imports": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "coverage/**",
    ".tmp-*/**",
    ".cursor/**",
    // CommonJS PM2 config — require() is intentional
    "ecosystem.config.js",
    // Archived snapshots — not shipped; keep lint focused on live app
    "src/_archived/**",
  ]),
]);

export default eslintConfig;
