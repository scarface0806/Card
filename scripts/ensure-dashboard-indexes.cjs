/**
 * Creates the indexes the admin dashboard relies on, and prints EXPLAIN for the
 * two access paths that were doing collection scans.
 *
 * Idempotent: createIndexes is a no-op for an index that already exists.
 * Uses the Prisma connection pool so it does not open extra Atlas connections.
 *
 *   node scripts/ensure-dashboard-indexes.cjs
 */
require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');

const SPECS = [
  ['orders', [
    { key: { createdAt: -1 },                    name: 'dash_createdAt_desc' },
    { key: { status: 1 },                        name: 'dash_status' },
    { key: { paymentStatus: 1 },                 name: 'dash_paymentStatus' },
    { key: { userId: 1 },                        name: 'dash_userId' },
    { key: { status: 1, createdAt: -1 },         name: 'dash_status_createdAt' },
    { key: { paymentStatus: 1, createdAt: -1 },  name: 'dash_payment_createdAt' },
  ]],
  ['customers', [
    { key: { isActive: 1 },                      name: 'dash_isActive' },
  ]],
  ['main_website_leads', [
    { key: { createdAt: -1 },                    name: 'dash_createdAt_desc' },
  ]],
];

(async () => {
  const prisma = new PrismaClient();
  try {
    for (const [coll, indexes] of SPECS) {
      const res = await prisma.$runCommandRaw({ createIndexes: coll, indexes });
      console.log(`${coll}: ok=${res.ok} created=${res.numIndexesAfter - res.numIndexesBefore} total=${res.numIndexesAfter}`);
    }

    console.log('\n--- indexes now present ---');
    for (const [coll] of SPECS) {
      const r = await prisma.$runCommandRaw({ listIndexes: coll, cursor: {} });
      console.log(`${coll}:`, r.cursor.firstBatch.map((i) => i.name).join(', '));
    }

    console.log('\n--- EXPLAIN: recent orders (sort createdAt desc, limit 5) ---');
    let ex = await prisma.$runCommandRaw({
      explain: { find: 'orders', filter: {}, sort: { createdAt: -1 }, limit: 5 },
      verbosity: 'executionStats',
    });
    let st = ex.executionStats;
    console.log('  winningPlan:', JSON.stringify(ex.queryPlanner.winningPlan).slice(0, 220));
    console.log(`  docsExamined=${st.totalDocsExamined} keysExamined=${st.totalKeysExamined} returned=${st.nReturned} ms=${st.executionTimeMillis}`);

    console.log('\n--- EXPLAIN: month-scoped paid revenue ---');
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    ex = await prisma.$runCommandRaw({
      explain: { find: 'orders', filter: { paymentStatus: 'PAID', createdAt: { $gte: monthStart } } },
      verbosity: 'executionStats',
    });
    st = ex.executionStats;
    console.log('  winningPlan:', JSON.stringify(ex.queryPlanner.winningPlan).slice(0, 220));
    console.log(`  docsExamined=${st.totalDocsExamined} keysExamined=${st.totalKeysExamined} ms=${st.executionTimeMillis}`);
  } finally {
    await prisma.$disconnect();
  }
})().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
