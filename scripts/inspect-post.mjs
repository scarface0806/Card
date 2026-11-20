#!/usr/bin/env node
/**
 * READ-ONLY. Why is a blog post not public?
 *
 * The public blog shows a post only when status === PUBLISHED AND publishedAt
 * is set AND publishedAt <= now (publicWhere in src/lib/blog/queries.ts).
 * This prints every Post whose title or slug matches a search term, with the
 * fields that decide that, plus any slug redirects pointing at it - and a
 * verdict per post.
 *
 * USAGE (from the repo root):
 *   node scripts/inspect-post.mjs "customised-nfc-card" "prints perfectly"
 *   INSPECT_ENV_FILE=.env.inspect.local node scripts/inspect-post.mjs "..."
 *
 * The database comes from DATABASE_URL in INSPECT_ENV_FILE (default
 * .env.local). To inspect PRODUCTION, put the production DATABASE_URL in a
 * gitignored file such as .env.inspect.local and point INSPECT_ENV_FILE at it.
 *
 * Only findMany queries - nothing is written. The connection string is never
 * printed; only its host, with credentials masked.
 */

import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';

const envFile = process.env.INSPECT_ENV_FILE || '.env.local';
config({ path: envFile, override: true });

const terms = process.argv.slice(2).map((t) => t.trim()).filter(Boolean);
if (terms.length === 0) {
  console.error('Usage: node scripts/inspect-post.mjs <search term> [more terms...]');
  process.exit(1);
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.error(`DATABASE_URL is not set (env file: ${envFile}).`);
  process.exit(1);
}

/** mongodb+srv://user:pass@host/db?x -> mongodb+srv://***@host */
function maskedHost(connection) {
  const m = connection.match(/^(mongodb(?:\+srv)?:\/\/)(?:[^@/]*@)?([^/?]+)/);
  return m ? `${m[1]}${connection.includes('@') ? '***@' : ''}${m[2]}` : '<unparseable DATABASE_URL>';
}

const IST = new Intl.DateTimeFormat('en-IN', {
  timeZone: 'Asia/Kolkata',
  dateStyle: 'medium',
  timeStyle: 'short',
});
const fmt = (d) => (d ? `${d.toISOString()} UTC  |  ${IST.format(d)} IST` : 'null');

function verdict(post, now) {
  if (post.status !== 'PUBLISHED') return `NOT PUBLIC: status is ${post.status} (case a)`;
  if (!post.publishedAt) return 'NOT PUBLIC: PUBLISHED but publishedAt is null (case b)';
  if (post.publishedAt > now) return `NOT PUBLIC: scheduled for ${IST.format(post.publishedAt)} IST (case b)`;
  return 'PUBLIC: matches publicWhere()';
}

const prisma = new PrismaClient();

try {
  console.log(`Database: ${maskedHost(url)}   (env file: ${envFile})`);
  const now = new Date();
  console.log(`Now:      ${fmt(now)}\n`);

  // A search term with spaces also matches the hyphenated slug form.
  const or = terms.flatMap((t) => {
    const slugish = t.toLowerCase().replace(/\s+/g, '-');
    return [
      { title: { contains: t, mode: 'insensitive' } },
      { slug: { contains: t, mode: 'insensitive' } },
      { slug: { contains: slugish, mode: 'insensitive' } },
    ];
  });

  const posts = await prisma.post.findMany({
    where: { OR: or },
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      publishedAt: true,
      updatedAt: true,
      noindex: true,
      coverImage: true,
    },
    orderBy: { updatedAt: 'desc' },
  });

  if (posts.length === 0) {
    console.log(`No post matches ${terms.map((t) => JSON.stringify(t)).join(' or ')} (case d: it does not exist in this database).`);
  }

  for (const post of posts) {
    const redirects = await prisma.postSlugRedirect.findMany({
      where: { postId: post.id },
      select: { oldSlug: true, createdAt: true },
    });
    console.log('-'.repeat(72));
    console.log(`id           ${post.id}`);
    console.log(`title        ${post.title}`);
    console.log(`slug         ${post.slug}`);
    console.log(`status       ${post.status}`);
    console.log(`publishedAt  ${fmt(post.publishedAt)}`);
    console.log(`updatedAt    ${fmt(post.updatedAt)}`);
    console.log(`noindex      ${post.noindex}`);
    console.log(`coverImage   ${post.coverImage ? 'yes' : 'no'}${post.coverImage ? `, alt ${post.coverImage.alt?.trim() ? 'set' : 'EMPTY'}` : ''}`);
    console.log(`redirects    ${redirects.length ? redirects.map((r) => r.oldSlug).join(', ') : 'none'}`);
    console.log(`verdict      ${verdict(post, now)}`);
  }

  // Redirect rows whose OLD slug matches the search (the URL may be an old name).
  const slugTerms = terms.map((t) => t.toLowerCase().replace(/\s+/g, '-'));
  const oldSlugHits = await prisma.postSlugRedirect.findMany({
    where: { OR: slugTerms.map((t) => ({ oldSlug: { contains: t, mode: 'insensitive' } })) },
    select: { oldSlug: true, postId: true },
  });
  console.log('-'.repeat(72));
  console.log(
    oldSlugHits.length
      ? `Redirects FROM a matching old slug:\n${oldSlugHits.map((r) => `  ${r.oldSlug} -> post ${r.postId}`).join('\n')}`
      : 'No redirect rows have a matching old slug.'
  );
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Query failed: ${message.replace(/mongodb(\+srv)?:\/\/\S+/g, '<redacted>').slice(0, 300)}`);
  process.exitCode = 2;
} finally {
  await prisma.$disconnect();
}
