/**
 * Renames a blog tag across every post that carries it.
 *
 *   npx tsx scripts/fix-tag-slug.ts nfc-nadurai nfc-madurai           # DRY RUN
 *   npx tsx scripts/fix-tag-slug.ts nfc-nadurai nfc-madurai --apply   # writes
 *
 * DRY RUN IS THE DEFAULT. --apply is the only thing that writes.
 *
 * WHERE THE TAG LIVES
 * There is no tag table. `Post.tags` is a String[] on each post, and
 * listPublishedTags() derives the tag list by counting across posts. So
 * "renaming a tag" means rewriting that array on every post holding the old
 * value — which is what this does.
 *
 * NO REDIRECT IS CREATED. /blog/tag/<old> simply stops resolving, which is
 * correct for a slug that was never indexed. A tag page is generated from
 * whatever tags exist, so the old URL 404s on the next revalidate.
 *
 * DUPLICATES are collapsed: if a post somehow carries both the old and the new
 * tag, the result holds one copy, and the original order is otherwise kept.
 */
import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';

config({ path: '.env.local' });

const prisma = new PrismaClient();

const [, , FROM, TO, ...rest] = process.argv;
const APPLY = rest.includes('--apply') || process.argv.includes('--apply');

/** Same rule the write schema applies: lowercase, digits, single hyphens. */
const VALID_TAG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

async function main() {
  if (!FROM || !TO || FROM.startsWith('--') || TO.startsWith('--')) {
    console.error('Usage: npx tsx scripts/fix-tag-slug.ts <old-tag> <new-tag> [--apply]');
    process.exitCode = 1;
    return;
  }

  if (!VALID_TAG.test(TO)) {
    console.error(`Refusing to write "${TO}": a tag must be lowercase words joined by single hyphens.`);
    process.exitCode = 1;
    return;
  }

  const posts = await prisma.post.findMany({
    where: { tags: { has: FROM } },
    select: { id: true, title: true, slug: true, status: true, tags: true },
  });

  console.log(`\nRenaming tag "${FROM}" -> "${TO}"`);
  console.log(`${posts.length} post(s) carry "${FROM}".\n`);

  if (posts.length === 0) {
    // Worth distinguishing: the caller may have already run this.
    const withNew = await prisma.post.count({ where: { tags: { has: TO } } });
    console.log(
      withNew > 0
        ? `Nothing to do — ${withNew} post(s) already carry "${TO}". Looks like this ran before.`
        : 'Nothing to do — no post carries that tag.'
    );
    return;
  }

  for (const post of posts) {
    const next = [...new Set(post.tags.map((t) => (t === FROM ? TO : t)))];
    console.log(`  ${post.status.padEnd(10)} ${post.slug}`);
    console.log(`      title:  ${post.title}`);
    console.log(`      before: [${post.tags.join(', ')}]`);
    console.log(`      after:  [${next.join(', ')}]`);
  }

  if (!APPLY) {
    console.log(`\nDRY RUN — nothing was written. Re-run with --apply to update ${posts.length} post(s).`);
    return;
  }

  console.log(`\n--apply given. Writing ${posts.length} post(s). Make sure you have a backup.\n`);

  for (const post of posts) {
    const next = [...new Set(post.tags.map((t) => (t === FROM ? TO : t)))];
    await prisma.post.update({ where: { id: post.id }, data: { tags: next } });
    console.log(`  updated ${post.slug}`);
  }

  const leftover = await prisma.post.count({ where: { tags: { has: FROM } } });
  console.log(
    leftover === 0
      ? `\nDone. No post references "${FROM}" any more.`
      : `\nWARNING: ${leftover} post(s) still reference "${FROM}".`
  );
}

main()
  .catch((error) => {
    console.error('\nFailed:', error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
