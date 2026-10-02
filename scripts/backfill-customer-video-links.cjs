/**
 * Backfills the customer fields added alongside the YouTube social link and the
 * three video card slots: `youtube`, `youtubeEnabled`, `videoLinksEnabled` and
 * `videoLinks`.
 *
 * MongoDB is schemaless, so adding these to prisma/schema.prisma does not touch
 * documents that were written before them. Prisma reads a document against the
 * schema, so a customer created earlier would be missing fields the schema now
 * declares as required. This writes the schema's own defaults into exactly
 * those documents.
 *
 * Idempotent: every $set is guarded by $exists:false, so a field that is
 * already present - including one an admin has since filled in - is left alone.
 *
 *   node scripts/backfill-customer-video-links.cjs
 */
require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

const DEFAULTS = [
  ['youtube', null],
  ['youtubeEnabled', false],
  ['videoLinksEnabled', false],
  ['videoLinks', []],
];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is not set');
  }

  const client = new MongoClient(url);
  await client.connect();

  try {
    const customers = client.db().collection('customers');

    for (const [field, value] of DEFAULTS) {
      const result = await customers.updateMany(
        { [field]: { $exists: false } },
        { $set: { [field]: value } }
      );
      console.log(`${field}: ${result.modifiedCount} document(s) backfilled`);
    }

    const remaining = await customers.countDocuments({
      $or: DEFAULTS.map(([field]) => ({ [field]: { $exists: false } })),
    });
    console.log(remaining === 0 ? 'All customers are up to date.' : `${remaining} customer(s) still missing fields.`);
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error('Backfill failed:', error.message);
  process.exit(1);
});
