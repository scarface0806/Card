#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports -- plain CommonJS operator script, like the others in scripts/ */
/**
 * Operator reset for an admin who is locked out of 2FA (lost phone AND lost
 * backup codes). Clears the four 2FA fields so the admin can sign in with
 * their password alone and enrol again from /admin/security.
 *
 * USAGE (from the repo root):
 *   node scripts/reset-admin-2fa.js <email> [--yes] [--force]
 *
 *   --yes    skip the interactive "Type YES" confirmation
 *   --force  REQUIRED when NODE_ENV=production
 *
 * WHAT IT CHANGES (that user only)
 *   twoFactorEnabled=false, twoFactorSecret=null, twoFactorBackupCodes=[],
 *   twoFactorLastUsedStep=null - through Prisma, exactly as the app writes them.
 *   Plus that admin's own 2FA rate-limit counters, so leftover attempts do
 *   not keep them locked (raw driver: mongo-rate-limit.ts has no key delete).
 *
 * WHAT IT DOES NOT CHANGE
 *   The password, the role, or any session already issued. See docs/2fa.md.
 *
 * It never prints the secret, the password hash or the backup-code hashes.
 * Exit codes: 0 success, 1 usage / permission / not found / aborted, 2 unexpected error.
 */

const path = require('node:path');

const FIELDS = ['twoFactorEnabled', 'twoFactorSecret', 'twoFactorBackupCodes', 'twoFactorLastUsedStep'];

/** Rate-limit scopes keyed by the admin's user id (see the 2FA routes). */
const USER_KEYED_SCOPES = ['admin-login-2fa-user', 'admin-2fa-disable'];

const USAGE = 'Usage: node scripts/reset-admin-2fa.js <email> [--yes] [--force]';

/** The PrismaClient main() created itself, so Ctrl+C can disconnect it. */
let activePrisma = null;

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Same database-name rule as src/lib/mongodb.ts. */
function dbNameFrom(env) {
  if (env.MONGODB_DB_NAME && env.MONGODB_DB_NAME.trim()) return env.MONGODB_DB_NAME.trim();
  try {
    const name = new URL(env.DATABASE_URL).pathname.replace(/^\//, '');
    if (name) return decodeURIComponent(name);
  } catch {
    // fall through
  }
  return 'tapvyo-nfc';
}

/** Error text with any connection string removed. */
function safeError(error) {
  const text = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  return text.replace(/mongodb(\+srv)?:\/\/\S+/g, '<redacted>').slice(0, 300);
}

async function defaultOpenRateLimits(env) {
  const { MongoClient } = require('mongodb');
  const client = new MongoClient(env.DATABASE_URL, { serverSelectionTimeoutMS: 10000 });
  await client.connect();
  return {
    collection: client.db(dbNameFrom(env)).collection('rate_limits'),
    close: () => client.close(),
  };
}

function defaultPrompt(question) {
  const readline = require('node:readline');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

/**
 * The whole reset, with every outside dependency injectable for tests.
 * Returns the exit code instead of exiting.
 */
async function main(options = {}) {
  const argv = options.argv ?? process.argv.slice(2);
  const env = options.env ?? process.env;
  const out = options.out ?? ((line) => console.log(line));
  const err = options.err ?? ((line) => console.error(line));
  const prompt = options.prompt ?? defaultPrompt;
  const openRateLimits = options.openRateLimits ?? (() => defaultOpenRateLimits(env));

  const flags = argv.filter((arg) => arg.startsWith('--'));
  const positional = argv.filter((arg) => !arg.startsWith('--'));
  const unknown = flags.filter((flag) => flag !== '--yes' && flag !== '--force');
  if (positional.length !== 1 || unknown.length > 0) {
    err(USAGE);
    return 1;
  }
  const email = positional[0].trim().toLowerCase();
  const yes = flags.includes('--yes');
  const force = flags.includes('--force');

  if (env.NODE_ENV === 'production' && !force) {
    err('Refusing to run with NODE_ENV=production without --force.');
    return 1;
  }
  if (!env.DATABASE_URL || !env.DATABASE_URL.trim()) {
    err('DATABASE_URL is not set.');
    return 1;
  }

  let prisma = options.prisma;
  let ownPrisma = false;
  if (!prisma) {
    const { PrismaClient } = require('@prisma/client');
    prisma = new PrismaClient();
    ownPrisma = true;
    activePrisma = prisma;
  }

  let rateLimits = null;
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, role: true, twoFactorEnabled: true },
    });
    if (!user) {
      err(`User ${email} not found`);
      return 1;
    }
    if (user.role !== 'ADMIN') {
      err(`User ${email} is not an admin`);
      return 1;
    }

    if (!yes) {
      out(`Target: ${user.email}  role=${user.role}  twoFactorEnabled=${user.twoFactorEnabled === true}`);
      const answer = await prompt('Type YES to continue: ');
      if (String(answer).trim() !== 'YES') {
        err('Aborted. Nothing was changed.');
        return 1;
      }
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: { set: [] },
        twoFactorLastUsedStep: null,
      },
    });

    // This admin's own 2FA counters. Ids look like
    // <scope>:<window>:<userId>:<windowIndex> (src/lib/mongo-rate-limit.ts).
    // admin-login-2fa-ip is keyed by IP, not by user, so it cannot be
    // attributed to this admin and is left to expire on its own TTL.
    rateLimits = await openRateLimits();
    const pattern = new RegExp(`^(${USER_KEYED_SCOPES.map(escapeRegex).join('|')}):[^:]+:${escapeRegex(user.id)}:\\d+$`);
    const removed = await rateLimits.collection.deleteMany({ _id: { $regex: pattern } });

    const operator = env.USER || env.USERNAME || 'unknown';
    out(`[2fa-reset] ${new Date().toISOString()} email=${user.email} operator=${operator} cleared=${FIELDS.join(',')}`);
    out(`rate_limits documents removed: ${removed.deletedCount ?? 0} (scopes: ${USER_KEYED_SCOPES.join(', ')}; admin-login-2fa-ip is per-IP and expires on its own)`);
    return 0;
  } catch (error) {
    err(`Unexpected error: ${safeError(error)}`);
    return 2;
  } finally {
    if (rateLimits) await rateLimits.close().catch(() => {});
    if (ownPrisma) {
      await prisma.$disconnect().catch(() => {});
      activePrisma = null;
    }
  }
}

module.exports = { main, USAGE };

if (require.main === module) {
  // Same env loading as scripts/seedAdmin.ts.
  require('dotenv').config({ path: path.join(process.cwd(), '.env.local') });
  require('dotenv').config();

  // Ctrl+C: leave cleanly. The reset is one write; if it already ran, the
  // audit line was printed.
  process.on('SIGINT', () => {
    console.error('\nInterrupted. Exiting.');
    const done = activePrisma ? activePrisma.$disconnect().catch(() => {}) : Promise.resolve();
    done.finally(() => process.exit(1));
  });

  main().then(
    (code) => {
      process.exitCode = code;
    },
    (error) => {
      console.error(`Unexpected error: ${safeError(error)}`);
      process.exitCode = 2;
    }
  );
}
