#!/usr/bin/env node
/**
 * Prints a fresh TWO_FACTOR_ENCRYPTION_KEY: 32 random bytes, base64.
 *
 * The key encrypts every stored TOTP secret (src/lib/two-factor-crypto.ts).
 * Generate ONE per environment and keep it: changing or losing it makes every
 * enrolled admin's secret undecryptable, and they would have to re-enrol.
 *
 * USAGE (from the repo root):
 *   node scripts/gen-2fa-key.js
 *
 * Paste the output into .env.local (local) or the Vercel project's
 * environment variables (production). Never commit it, never put it in a
 * NEXT_PUBLIC_ variable. This script only prints; it writes no files.
 */

// Plain CommonJS, like the other .js scripts here (package.json has no "type": "module").
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { randomBytes } = require('node:crypto');

process.stdout.write(`${randomBytes(32).toString('base64')}\n`);
