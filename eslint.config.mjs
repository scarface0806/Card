import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
// eslint-config-next no longer registers the react plugin itself, but the rule
// overrides below reference react/*. Without this import eslint refuses to
// start at all - "could not find plugin react" - so linting was dead.
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    plugins: { react: reactPlugin, "react-hooks": reactHooksPlugin },
    rules: {
      /**
       * Underscore means "deliberately unused".
       *
       * Most of the unused-variable warnings in this codebase were not dead
       * code at all: a positional handler parameter that a signature requires
       * but the body does not read (`withAdmin((request, user) => ...)` where
       * only `request` is used), and `catch (error)` blocks that intentionally
       * swallow. Neither can simply be deleted, so without a convention for
       * marking intent they stayed as permanent noise that hid the real dead
       * code among them.
       *
       * `caughtErrors: "all"` keeps genuinely unused catch bindings reported,
       * so `catch (_e)` is an explicit choice rather than an accident.
       */
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrors: "all",
          caughtErrorsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-require-imports": "warn",
      "@typescript-eslint/no-unsafe-function-type": "warn",
      "@next/next/no-html-link-for-pages": "warn",
      "react/no-unescaped-entities": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/static-components": "warn",
      "prefer-const": "warn",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Scratch worktree used by the audit tooling; never source.
    ".audit-tmp/**",
  ]),
]);

export default eslintConfig;
