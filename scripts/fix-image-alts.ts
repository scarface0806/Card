/**
 * Repairs blog cover alt text that is missing or too short to describe anything.
 *
 *   npx tsx scripts/fix-image-alts.ts            # DRY RUN — prints, writes nothing
 *   npx tsx scripts/fix-image-alts.ts --apply    # writes to the database
 *
 * DRY RUN IS THE DEFAULT. --apply is the only thing that writes, and it prints
 * a warning and the row count before it starts. Take a database backup first.
 *
 * WHAT COUNTS AS BROKEN
 * An alt under MIN_MEANINGFUL_ALT characters, or absent. The live database has
 * a cover captioned "ap": it satisfies the schema's `min(1)` and describes
 * nothing to a screen reader or an image crawler.
 *
 * WHERE THE REPLACEMENT COMES FROM
 * The post title plus the image's role — "Cover image for <title>". Never the
 * filename: `vq0d3qii1zmakyylz1yb.webp` is a Cloudinary id, and a filename-
 * derived alt is worse than none because it looks deliberate.
 *
 * This only repairs stored rows. The render path has its own guard in
 * src/lib/blog/images.ts, so a short alt entered after this runs still never
 * reaches a reader. Both exist on purpose — cleaning the data does not stop the
 * next bad row being typed.
 */
import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';

config({ path: '.env.local' });

const prisma = new PrismaClient();

/** Keep in step with MIN_MEANINGFUL_ALT in src/lib/blog/images.ts. */
const MIN_MEANINGFUL_ALT = 4;

const APPLY = process.argv.includes('--apply');

type ImageRecord = { url: string; publicId: string; alt: string; width: number; height: number };

function needsFix(alt: unknown): boolean {
  return typeof alt !== 'string' || alt.trim().length < MIN_MEANINGFUL_ALT;
}

function proposedAlt(postTitle: string, role: 'Cover' | 'Gallery'): string {
  return `${role === 'Cover' ? 'Cover image' : 'Illustration'} for ${postTitle}`;
}

function pad(value: string, width: number): string {
  const v = value.length > width ? `${value.slice(0, width - 1)}…` : value;
  return v.padEnd(width);
}

async function main() {
  const posts = await prisma.post.findMany({
    select: { id: true, title: true, slug: true, coverImage: true, galleryImages: true },
  });

  type Change = {
    id: string; title: string; field: 'coverImage' | 'galleryImages';
    index: number; current: string; proposed: string;
  };
  const changes: Change[] = [];

  for (const post of posts) {
    const cover = post.coverImage as ImageRecord | null;
    if (cover && needsFix(cover.alt)) {
      changes.push({
        id: post.id, title: post.title, field: 'coverImage', index: -1,
        current: typeof cover.alt === 'string' ? cover.alt : '',
        proposed: proposedAlt(post.title, 'Cover'),
      });
    }

    const gallery = (post.galleryImages ?? []) as ImageRecord[];
    gallery.forEach((image, index) => {
      if (needsFix(image?.alt)) {
        changes.push({
          id: post.id, title: post.title, field: 'galleryImages', index,
          current: typeof image?.alt === 'string' ? image.alt : '',
          proposed: proposedAlt(post.title, 'Gallery'),
        });
      }
    });
  }

  console.log(`\nScanned ${posts.length} post(s). ${changes.length} image alt(s) need repair.\n`);

  if (changes.length === 0) {
    console.log('Nothing to do.');
    return;
  }

  console.log(
    `${pad('RECORD ID', 26)} ${pad('POST TITLE', 38)} ${pad('FIELD', 14)} ${pad('CURRENT ALT', 16)} PROPOSED ALT`
  );
  console.log('-'.repeat(150));
  for (const c of changes) {
    const field = c.index >= 0 ? `${c.field}[${c.index}]` : c.field;
    console.log(
      `${pad(c.id, 26)} ${pad(c.title, 38)} ${pad(field, 14)} ${pad(JSON.stringify(c.current), 16)} ${c.proposed}`
    );
  }

  if (!APPLY) {
    console.log(`\nDRY RUN — nothing was written. Re-run with --apply to write these ${changes.length} change(s).`);
    return;
  }

  console.log(`\n--apply given. Writing ${changes.length} change(s). Make sure you have a backup.\n`);

  // Grouped by post: cover and gallery may both change on one row, and each
  // post should be a single write rather than one per image.
  const byPost = new Map<string, Change[]>();
  for (const c of changes) {
    if (!byPost.has(c.id)) byPost.set(c.id, []);
    byPost.get(c.id)!.push(c);
  }

  let written = 0;
  for (const [postId, postChanges] of byPost) {
    const post = posts.find((p) => p.id === postId);
    if (!post) continue;

    const data: { coverImage?: ImageRecord; galleryImages?: ImageRecord[] } = {};

    const coverChange = postChanges.find((c) => c.field === 'coverImage');
    if (coverChange && post.coverImage) {
      data.coverImage = { ...(post.coverImage as ImageRecord), alt: coverChange.proposed };
    }

    const galleryChanges = postChanges.filter((c) => c.field === 'galleryImages');
    if (galleryChanges.length > 0) {
      const gallery = [...((post.galleryImages ?? []) as ImageRecord[])];
      for (const c of galleryChanges) gallery[c.index] = { ...gallery[c.index], alt: c.proposed };
      data.galleryImages = gallery;
    }

    await prisma.post.update({ where: { id: postId }, data });
    written += postChanges.length;
    console.log(`  updated ${postId} (${postChanges.length} alt(s))`);
  }

  console.log(`\nDone. ${written} alt(s) written across ${byPost.size} post(s).`);
}

main()
  .catch((error) => {
    console.error('\nFailed:', error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
