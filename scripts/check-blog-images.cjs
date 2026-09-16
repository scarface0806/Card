/**
 * Read-only audit: every image URL the blog renders, HEAD-checked.
 * Usage: node scripts/check-blog-images.cjs
 */
require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const posts = await prisma.post.findMany({
    select: { slug: true, status: true, title: true, coverImage: true, galleryImages: true,
              ogImage: true, authorAvatar: true, content: true },
  });

  const urls = new Map(); // url -> [where...]
  const add = (u, where) => {
    if (!u || typeof u !== 'string' || u.startsWith('data:')) return;
    if (!urls.has(u)) urls.set(u, []);
    urls.get(u).push(where);
  };

  for (const p of posts) {
    const tag = `${p.slug} [${p.status}]`;
    if (p.coverImage?.url) add(p.coverImage.url, `${tag} coverImage`);
    for (const g of p.galleryImages || []) add(g?.url, `${tag} galleryImage`);
    add(p.ogImage, `${tag} ogImage`);
    add(p.authorAvatar, `${tag} authorAvatar`);
    // Inline <img> inside the sanitized article HTML — these bypass next/image.
    for (const m of (p.content || '').matchAll(/<img[^>]+src="([^"]+)"/gi)) {
      add(m[1], `${tag} inline <img> in content`);
    }
  }

  console.log(`${posts.length} post(s), ${urls.size} distinct image URL(s)\n`);

  const bad = [];
  for (const [url, where] of urls) {
    let line;
    try {
      let res = await fetch(url, { method: 'HEAD', redirect: 'manual' });
      // Some CDNs refuse HEAD; fall back to a ranged GET before judging.
      if (res.status === 405 || res.status === 403) {
        res = await fetch(url, { method: 'GET', headers: { Range: 'bytes=0-0' }, redirect: 'manual' });
      }
      const loc = res.headers.get('location');
      line = `${res.status}${loc ? ` -> ${loc}` : ''}  ${res.headers.get('content-type') || ''}`;
      if (res.status >= 300) bad.push({ url, where, line });
    } catch (e) {
      line = `NETWORK ERROR: ${e.message}`;
      bad.push({ url, where, line });
    }
    console.log(`${line.padEnd(46)} ${url.slice(0, 96)}`);
    console.log(`${' '.repeat(46)} used by: ${where.join(', ')}`);
  }

  console.log('\n=== BROKEN / REDIRECTING ===');
  if (!bad.length) console.log('none — every blog image returns 200');
  else bad.forEach(b => console.log(`${b.line}\n  ${b.url}\n  ${b.where.join(', ')}`));
  await prisma.$disconnect();
})();
