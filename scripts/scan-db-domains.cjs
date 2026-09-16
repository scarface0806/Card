/**
 * Read-only audit: finds any stale origin stored in the database.
 * Usage: node scripts/scan-db-domains.cjs
 */
require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const BAD = /vercel\.app|localhost:\d+|127\.0\.0\.1|placehold\.co|via\.placeholder\.com|picsum\.photos|tapvyo\.com/i;

const TARGETS = [
  ['post',      ['title','slug','content','excerpt','coverImage','galleryImages','ogImage','canonicalUrl','authorAvatar']],
  ['customer',  ['name','slug','website','linkedin','logo','profileImage','mapEmbedUrl']],
  ['card',      ['website','profileImage','coverImage','logo','linkedin']],
  ['product',   ['name','images','backImage']],
  ['order',     ['website','productImageUrl','trackingUrl']],
  ['gallery',   ['image']],
  ['newsletter',['content']],
];

(async () => {
  const hits = [];
  for (const [model, fields] of TARGETS) {
    let rows;
    try { rows = await prisma[model].findMany(); }
    catch (e) { console.log(`  SKIP ${model}: ${String(e).slice(0, 200)}`); continue; }
    for (const row of rows) {
      for (const f of fields) {
        const v = row[f];
        if (v == null) continue;
        const s = typeof v === 'string' ? v : JSON.stringify(v);
        if (BAD.test(s)) {
          const m = s.match(new RegExp(`\S*(?:${BAD.source})\S*`, 'i'));
          hits.push({ model, id: row.id, field: f, found: (m && m[0] ? m[0] : '').slice(0, 110) });
        }
      }
    }
    console.log(`  scanned ${model}: ${rows.length} row(s)`);
  }
  console.log('\n=== STALE ORIGINS IN DATABASE ===');
  if (!hits.length) console.log('none');
  else hits.forEach(h => console.log(`${h.model}.${h.field}  id=${h.id}\n    ${h.found}`));
  await prisma.$disconnect();
})();
